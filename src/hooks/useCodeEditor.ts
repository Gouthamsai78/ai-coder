import { useState, useCallback } from 'react';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storage';
import { DEFAULT_CODE, APP_CONFIG } from '../constants/app';
import { downloadAsHtml } from '../utils/download';
import { analytics } from '../utils/analytics';
import { useToast } from '../components/Toast';
import type { EditorState, EditorActions } from '../types';

/**
 * Manages code state, history for undo, and pending diffs
 */
export function useCodeEditor(): EditorState & EditorActions {
    const { showToast } = useToast();

    // Plain state + explicit persistence so AI streaming can update the editor
    // live WITHOUT writing the full accumulated code to localStorage on every
    // chunk (that path writes MBs repeatedly and can blow the quota).
    const [code, setCodeState] = useState<string>(() =>
        storage.getString(STORAGE_KEYS.SAVED_CODE, DEFAULT_CODE)
    );

    const [history, setHistory] = useState<string[]>([]);
    const [pendingCode, setPendingCode] = useState<string | null>(null);

    const isDefault = code.trim() === DEFAULT_CODE.trim();

    // Save to history before making changes (for undo)
    const pushToHistory = useCallback(() => {
        if (!isDefault) {
            setHistory(prev => [...prev.slice(-(APP_CONFIG.CODE_HISTORY_LIMIT - 1)), code]);
        }
    }, [code, isDefault]);

    // Persisting setter — used by manual edits, undo, apply, reset.
    const setCode = useCallback((next: string) => {
        setCodeState(next);
        storage.setString(STORAGE_KEYS.SAVED_CODE, next);
    }, []);

    // Live setter — used during AI streaming. Updates the editor/state only;
    // the final code is persisted once via setCode when generation ends.
    const setCodeLive = useCallback((next: string) => {
        setCodeState(next);
    }, []);

    const undo = useCallback((): boolean => {
        if (history.length === 0) return false;

        const previousCode = history[history.length - 1];
        setHistory(prev => prev.slice(0, -1));
        setCode(previousCode);
        showToast('Restored previous code', 'info');
        analytics.track('undo');
        return true;
    }, [history, setCode, showToast]);

    const applyPendingCode = useCallback(() => {
        if (pendingCode) {
            pushToHistory();
            setCode(pendingCode);
            setPendingCode(null);
            showToast('Changes applied!', 'success');
            analytics.track('diff_applied');
        }
    }, [pendingCode, pushToHistory, setCode, showToast]);

    const rejectPendingCode = useCallback(() => {
        setPendingCode(null);
        showToast('Changes rejected', 'info');
        analytics.track('diff_rejected');
    }, [showToast]);

    const reset = useCallback(() => {
        setCode(DEFAULT_CODE);
        setHistory([]);
        setPendingCode(null);
    }, [setCode]);

    const download = useCallback(() => {
        downloadAsHtml(code);
        showToast('Code downloaded!', 'success');
        analytics.track('code_downloaded');
    }, [code, showToast]);

    const copy = useCallback(async (): Promise<boolean> => {
        try {
            await navigator.clipboard.writeText(code);
            showToast('Code copied to clipboard', 'success');
            analytics.track('code_copied');
            return true;
        } catch {
            showToast('Failed to copy code', 'error');
            return false;
        }
    }, [code, showToast]);

    return {
        // State
        code,
        history,
        pendingCode,
        isDefault,
        // Actions
        setCode,
        undo,
        applyPendingCode,
        rejectPendingCode,
        reset,
        download,
        copy,
        // Internal (for AI streaming)
        setCodeLive,
        setPendingCode,
        pushToHistory,
    };
}
