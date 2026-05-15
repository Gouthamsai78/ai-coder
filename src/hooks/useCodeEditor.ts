import { useState, useCallback } from 'react';
import { useLocalStorageString } from './useLocalStorage';
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

    const [code, setCodeRaw] = useLocalStorageString(
        STORAGE_KEYS.SAVED_CODE,
        DEFAULT_CODE
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

    const undo = useCallback((): boolean => {
        if (history.length === 0) return false;

        const previousCode = history[history.length - 1];
        setHistory(prev => prev.slice(0, -1));
        setCodeRaw(previousCode);
        showToast('Restored previous code', 'info');
        analytics.track('undo');
        return true;
    }, [history, setCodeRaw, showToast]);

    const applyPendingCode = useCallback(() => {
        if (pendingCode) {
            pushToHistory();
            setCodeRaw(pendingCode);
            setPendingCode(null);
            showToast('Changes applied!', 'success');
            analytics.track('diff_applied');
        }
    }, [pendingCode, pushToHistory, setCodeRaw, showToast]);

    const rejectPendingCode = useCallback(() => {
        setPendingCode(null);
        showToast('Changes rejected', 'info');
        analytics.track('diff_rejected');
    }, [showToast]);

    const reset = useCallback(() => {
        setCodeRaw(DEFAULT_CODE);
        setHistory([]);
        setPendingCode(null);
    }, [setCodeRaw]);

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
        setCode: setCodeRaw, // Direct set without history
        undo,
        applyPendingCode,
        rejectPendingCode,
        reset,
        download,
        copy,
        // Internal (for AI streaming)
        setPendingCode,
        pushToHistory,
    };
}
