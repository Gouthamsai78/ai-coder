import { useState, useCallback, useRef } from 'react';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storage';
import { DEFAULT_CODE, APP_CONFIG } from '../constants/app';
import { downloadAsHtml } from '../utils/download';
import { analytics } from '../utils/analytics';
import { useToast } from '../components/Toast';
import type { EditorState, EditorActions } from '../types';

/**
 * Manages code state, history for undo/redo, and pending diffs
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
    const [redoStack, setRedoStack] = useState<string[]>([]);
    const [pendingCode, setPendingCode] = useState<string | null>(null);
    // Coalesce rapid consecutive edits (keystrokes) into a single undo entry.
    const lastEditTimeRef = useRef(0);

    const isDefault = code.trim() === DEFAULT_CODE.trim();

    const limitHistory = (stack: string[]) =>
        stack.slice(-(APP_CONFIG.CODE_HISTORY_LIMIT - 1));

    // Raw persisting apply — no history side effects (undo/redo/reset use it).
    const applyCode = useCallback((next: string) => {
        setCodeState(next);
        storage.setString(STORAGE_KEYS.SAVED_CODE, next);
    }, []);

    // Record the current code as an undo point and clear the redo branch.
    const recordHistory = useCallback(() => {
        if (!isDefault) {
            setHistory(prev => [...limitHistory(prev), code]);
            setRedoStack([]);
        }
    }, [code, isDefault]);

    // Persisting setter — used by manual edits, AI completion, and diff apply.
    // One undo entry per edit burst so typing doesn't flood the stack.
    const setCode = useCallback((next: string) => {
        if (next === code) return;
        const now = Date.now();
        if (now - lastEditTimeRef.current > APP_CONFIG.EDIT_BURST_MS) {
            recordHistory();
        }
        lastEditTimeRef.current = now;
        applyCode(next);
    }, [code, recordHistory, applyCode]);

    // Live setter — used during AI streaming. Updates the editor/state only;
    // the final code is persisted once via setCode when generation ends.
    const setCodeLive = useCallback((next: string) => {
        setCodeState(next);
    }, []);

    const undo = useCallback((): boolean => {
        if (history.length === 0) return false;

        const previousCode = history[history.length - 1];
        setHistory(prev => prev.slice(0, -1));
        setRedoStack(prev => [...limitHistory(prev), code]);
        applyCode(previousCode);
        showToast('Restored previous code', 'info');
        analytics.track('undo');
        return true;
    }, [history, code, applyCode, showToast]);

    const redo = useCallback((): boolean => {
        if (redoStack.length === 0) return false;

        const nextCode = redoStack[redoStack.length - 1];
        setRedoStack(prev => prev.slice(0, -1));
        setHistory(prev => [...limitHistory(prev), code]);
        applyCode(nextCode);
        showToast('Redid change', 'info');
        analytics.track('redo');
        return true;
    }, [redoStack, code, applyCode, showToast]);

    const applyPendingCode = useCallback(() => {
        if (pendingCode) {
            recordHistory();
            applyCode(pendingCode);
            setPendingCode(null);
            showToast('Changes applied!', 'success');
            analytics.track('diff_applied');
        }
    }, [pendingCode, recordHistory, applyCode, showToast]);

    const rejectPendingCode = useCallback(() => {
        setPendingCode(null);
        showToast('Changes rejected', 'info');
        analytics.track('diff_rejected');
    }, [showToast]);

    const reset = useCallback(() => {
        setCodeState(DEFAULT_CODE);
        storage.setString(STORAGE_KEYS.SAVED_CODE, DEFAULT_CODE);
        setHistory([]);
        setRedoStack([]);
        setPendingCode(null);
    }, []);

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
        redoStack,
        pendingCode,
        isDefault,
        // Actions
        setCode,
        undo,
        redo,
        applyPendingCode,
        rejectPendingCode,
        reset,
        download,
        copy,
        // Internal (for AI streaming)
        setCodeLive,
        setPendingCode,
    };
}
