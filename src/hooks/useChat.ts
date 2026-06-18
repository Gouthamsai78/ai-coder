import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '../constants/storage';
import { generateCodeStream } from '../services/ai';
import { formatApiError } from '../utils/errors';
import { analytics } from '../utils/analytics';
import { useToast } from '../components/Toast';
import { DEMO_HTML } from '../constants/app';
import type { Message, FileAttachment, ChatState, ChatActions, ApiSettings } from '../types';

interface UseChatOptions {
    apiSettings: ApiSettings;
    seoSettings: import('../types').SeoSettings;
    code: string;
    isDefaultCode: boolean;
    setCode: (code: string) => void;
    setPendingCode: (code: string | null) => void;
    pushToHistory: () => void;
}

/**
 * Manages chat messages and AI code generation
 */
export function useChat(options: UseChatOptions): ChatState & ChatActions {
    const { showToast } = useToast();
    const { apiSettings, seoSettings, code, isDefaultCode, setCode, setPendingCode, pushToHistory } = options;

    const [messages, setMessages] = useLocalStorage<Message[]>(
        STORAGE_KEYS.CHAT_MESSAGES,
        []
    );

    const [isLoading, setIsLoading] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);
    const [lastPrompt, setLastPrompt] = useState('');
    const [lastAttachments, setLastAttachments] = useState<FileAttachment[] | undefined>();

    // Refs to always hold latest values without stale closures
    const messagesRef = useRef(messages);
    messagesRef.current = messages;
    const abortControllerRef = useRef<AbortController | null>(null);

    // Cleanup: abort any in-progress stream on unmount
    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);

    const sendMessage = useCallback(async (
        message: string,
        attachments?: FileAttachment[]
    ) => {
        analytics.track('send_message', {
            has_attachments: attachments?.length || 0,
            attachment_types: attachments?.map(a => a.type).join(','),
        });
        // Check for API key
        if (!apiSettings.apiKey) {
            setCode(DEMO_HTML);
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: "Here's a sample of what AI Coder can build. Add your free API key in Settings to generate your own apps." }
            ]);
            return;
        }

        // Cancel any in-progress stream
        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setLastPrompt(message);
        setLastAttachments(attachments);
        setLastError(null);

        // Use ref to avoid stale closure
        const newMessages: Message[] = [...messagesRef.current, { role: 'user', content: message }];
        setMessages(newMessages);
        setIsLoading(true);

        // Save history for modifications
        if (!isDefaultCode) {
            pushToHistory();
        }

        // Loading message — will be replaced by onStatus with real activity
        setMessages(prev => [...prev, { role: 'assistant', content: '⚡ Generating...' }]);

        try {
            let accumulatedCode = '';

            const result = await generateCodeStream(
                apiSettings.apiKey,
                apiSettings.model,
                newMessages,
                code,
                (chunk) => {
                    accumulatedCode += chunk;
                    if (isDefaultCode) {
                        setCode(accumulatedCode);
                    }
                },
                apiSettings.provider,
                attachments,
                // Live status updates in chat
                (status) => {
                    setMessages(prev => {
                        const updated = [...prev];
                        updated[updated.length - 1] = { role: 'assistant', content: status };
                        return updated;
                    });
                },
                apiSettings.webSearchEnabled,
                seoSettings,
                // Reset accumulatedCode on retry so chunks don't stack
                () => {
                    accumulatedCode = '';
                }
            );

            if (isDefaultCode) {
                setCode(result.code);
                setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                        role: 'assistant',
                        content: result.summary,
                        searchData: result.searchData,
                    };
                    return updated;
                });
                showToast('Code generated successfully!', 'success');
                analytics.track('code_generated', {
                    model: apiSettings.model,
                    provider: apiSettings.provider,
                    is_first_build: true,
                    has_attachments: attachments?.length || 0,
                    web_search: !!result.searchData,
                });
            } else {
                setPendingCode(result.code);
                setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                        role: 'assistant',
                        content: result.summary + '\n\n📝 Review the diff and click Apply to accept changes.',
                        searchData: result.searchData,
                    };
                    return updated;
                });
                showToast('Review the diff before applying', 'info');
                analytics.track('code_generated', {
                    model: apiSettings.model,
                    provider: apiSettings.provider,
                    is_first_build: false,
                    has_attachments: attachments?.length || 0,
                    web_search: !!result.searchData,
                });
            }
        } catch (error) {
            const friendlyError = formatApiError(error);
            setLastError(friendlyError);

            // Remove loading message
            setMessages(prev => prev.slice(0, -1));
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `❌ Error: ${friendlyError}\n\nClick "Retry" to try again.`
            }]);

            showToast(friendlyError, 'error');
            analytics.track('generation_error', {
                error_type: friendlyError,
                provider: apiSettings.provider,
            });
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    }, [apiSettings, seoSettings, code, isDefaultCode, setCode, setPendingCode, pushToHistory, showToast, setMessages]);

    const retry = useCallback(() => {
        if (lastPrompt && !isLoading) {
            // Remove from the last user message onwards (handles loading + error messages)
            setMessages(prev => {
                for (let i = prev.length - 1; i >= 0; i--) {
                    if (prev[i].role === 'user') {
                        return prev.slice(0, i);
                    }
                }
                return prev;
            });
            analytics.track('retry', { provider: apiSettings.provider });
            sendMessage(lastPrompt, lastAttachments);
        }
    }, [lastPrompt, lastAttachments, isLoading, sendMessage, setMessages, apiSettings.provider]);

    const clearMessages = useCallback(() => {
        setMessages([]);
        setLastError(null);
        showToast('Chat history cleared', 'info');
    }, [setMessages, showToast]);

    const clearAll = useCallback(() => {
        setMessages([]);
        setLastError(null);
        setLastPrompt('');
    }, [setMessages]);

    return {
        // State
        messages,
        isLoading,
        lastError,
        lastPrompt,
        // Actions
        sendMessage,
        retry,
        clearMessages,
        clearAll,
    };
}
