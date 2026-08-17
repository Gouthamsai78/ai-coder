import { useState, useCallback, useRef, useEffect } from 'react';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storage';
import { generateCodeStream } from '../services/ai';
import { formatApiError } from '../utils/errors';
import { reportError } from '../utils/errorReporter';
import { analytics } from '../utils/analytics';
import { useToast } from '../components/Toast';
import { DEMO_HTML, DEFAULT_CODE } from '../constants/app';
import type { Message, FileAttachment, ChatState, ChatActions, ApiSettings, SeoSettings } from '../types';

interface UseChatOptions {
    apiSettings: ApiSettings;
    seoSettings: SeoSettings;
    code: string;
    isDefaultCode: boolean;
    setCode: (code: string) => void;
    setStreamingCode: (code: string) => void;
    setPendingCode: (code: string | null) => void;
    onGenerationSuccess?: () => void;
}

/**
 * Manages chat messages and AI code generation
 */
export function useChat(options: UseChatOptions): ChatState & ChatActions {
    const { showToast } = useToast();
    const { apiSettings, seoSettings, code, isDefaultCode, setCode, setStreamingCode, setPendingCode, onGenerationSuccess } = options;

    // Plain state (not useLocalStorage) so transient "Generating..." updates
    // during streaming don't write to localStorage on every chunk. Persisted
    // explicitly at terminal points below.
    const [messages, setMessages] = useState<Message[]>(() =>
        storage.get<Message[]>(STORAGE_KEYS.CHAT_MESSAGES, [])
    );

    const persistMessages = useCallback((msgs: Message[]) => {
        storage.set(STORAGE_KEYS.CHAT_MESSAGES, msgs);
    }, []);

    const [isLoading, setIsLoading] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);
    const [lastPrompt, setLastPrompt] = useState('');
    const [lastAttachments, setLastAttachments] = useState<FileAttachment[] | undefined>();

    // Refs to always hold latest values without stale closures
    const messagesRef = useRef(messages);
    messagesRef.current = messages;
    const abortControllerRef = useRef<AbortController | null>(null);
    const userStoppedRef = useRef(false);

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
            setLastPrompt(message);
            const demoMessages: Message[] = [
                ...messagesRef.current,
                { role: 'user', content: message },
                { role: 'assistant', content: "Here's a sample of what AI Coder can build. Add your free API key in Settings to generate your own apps." }
            ];
            setMessages(demoMessages);
            persistMessages(demoMessages);
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
        persistMessages(newMessages);
        setIsLoading(true);

        // Loading message — will be replaced by onStatus with real activity
        setMessages(prev => [...prev, { role: 'assistant', content: '⚡ Generating...' }]);

        // The DEMO (no-key sample) is not a real project: once a key is added,
        // treat it as a fresh first build so the first generation starts from a
        // clean baseline instead of streaming over the demo.
        const isDemoShowing = code.trim() === DEMO_HTML.trim();
        const isFirstBuild = isDefaultCode || isDemoShowing;
        const baseCode = isDemoShowing ? DEFAULT_CODE : code;

        let succeeded = false;
        try {
            let accumulatedCode = '';

            const result = await generateCodeStream(
                apiSettings.apiKey,
                apiSettings.model,
                newMessages,
                baseCode,
                (chunk) => {
                    accumulatedCode += chunk;
                    if (isFirstBuild) {
                        setStreamingCode(accumulatedCode);
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
                },
                controller.signal
            );

            if (isFirstBuild) {
                setCode(result.code);
                const finalMessages: Message[] = [...messagesRef.current];
                finalMessages[finalMessages.length - 1] = {
                    role: 'assistant',
                    content: result.summary,
                    searchData: result.searchData,
                };
                setMessages(finalMessages);
                persistMessages(finalMessages);
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
                const finalMessages: Message[] = [...messagesRef.current];
                finalMessages[finalMessages.length - 1] = {
                    role: 'assistant',
                    content: result.summary + '\n\n📝 Review the diff and click Apply to accept changes.',
                    searchData: result.searchData,
                };
                setMessages(finalMessages);
                persistMessages(finalMessages);
                showToast('Review the diff before applying', 'info');
                analytics.track('code_generated', {
                    model: apiSettings.model,
                    provider: apiSettings.provider,
                    is_first_build: false,
                    has_attachments: attachments?.length || 0,
                    web_search: !!result.searchData,
                });
            }
            succeeded = true;
        } catch (error) {
            const isAbort = (error instanceof DOMException && error.name === 'AbortError')
                || (error instanceof Error && (
                    (error.name === 'GoogleGenerativeAIError'
                        && error.message.toLowerCase().includes('abort'))
                    || error.name === 'GoogleGenerativeAIAbortError'
                ));
            const isUserAbort = userStoppedRef.current || isAbort;
            userStoppedRef.current = false;

            // A newer send superseded this one — stay silent, don't touch shared state.
            if (isAbort && abortControllerRef.current !== controller) {
                return;
            }

            if (isUserAbort) {
                // User clicked stop — remove loading message, no error
                const stoppedMessages: Message[] = [
                    ...messagesRef.current.slice(0, -1),
                    { role: 'assistant', content: '⏹️ Generation stopped.' }
                ];
                setMessages(stoppedMessages);
                persistMessages(stoppedMessages);
            } else {
                const friendlyError = formatApiError(error);
                setLastError(friendlyError);

                reportError(error, {
                    model: apiSettings.model,
                    provider: apiSettings.provider,
                    messageCount: messagesRef.current.length,
                    hasAttachments: !!attachments?.length,
                    webSearchEnabled: !!apiSettings.webSearchEnabled,
                    isRetry: !!lastPrompt,
                });

                // Remove loading message
                const errorMessages: Message[] = [
                    ...messagesRef.current.slice(0, -1),
                    { role: 'assistant', content: `❌ Error: ${friendlyError}\n\nClick "Retry" to try again.` }
                ];
                setMessages(errorMessages);
                persistMessages(errorMessages);

                showToast(friendlyError, 'error');
                analytics.track('generation_error', {
                    error_type: friendlyError,
                    provider: apiSettings.provider,
                    model: apiSettings.model,
                    message_count: messagesRef.current.length,
                    has_attachments: !!attachments?.length,
                    web_search: !!apiSettings.webSearchEnabled,
                    is_retry: !!lastPrompt,
                });
            }
        } finally {
            // Only clear shared state if THIS invocation still owns the controller.
            if (abortControllerRef.current === controller) {
                setIsLoading(false);
                abortControllerRef.current = null;
            }
            if (succeeded) {
                onGenerationSuccess?.();
            }
        }
    }, [apiSettings, seoSettings, code, isDefaultCode, lastPrompt, setCode, setStreamingCode, setPendingCode, showToast, setMessages, persistMessages, onGenerationSuccess]);

    const retry = useCallback(() => {
        if (lastPrompt && !isLoading) {
            // Remove from the last user message onwards (handles loading + error
            // messages). Sync messagesRef immediately so sendMessage doesn't
            // re-read the stale (pre-trim) history.
            const trimmed: Message[] = [...messagesRef.current];
            for (let i = trimmed.length - 1; i >= 0; i--) {
                if (trimmed[i].role === 'user') {
                    const cut = trimmed.slice(0, i);
                    setMessages(cut);
                    messagesRef.current = cut;
                    persistMessages(cut);
                    break;
                }
            }
            analytics.track('retry', { provider: apiSettings.provider });
            sendMessage(lastPrompt, lastAttachments);
        }
    }, [lastPrompt, lastAttachments, isLoading, sendMessage, setMessages, persistMessages, apiSettings.provider]);

    const clearMessages = useCallback(() => {
        setMessages([]);
        persistMessages([]);
        setLastError(null);
        showToast('Chat history cleared', 'info');
    }, [setMessages, persistMessages, showToast]);

    const clearAll = useCallback(() => {
        setMessages([]);
        persistMessages([]);
        setLastError(null);
        setLastPrompt('');
    }, [setMessages, persistMessages]);

    const stopGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            userStoppedRef.current = true;
            abortControllerRef.current.abort();
        }
    }, []);

    return {
        // State
        messages,
        isLoading,
        lastError,
        lastPrompt,
        // Actions
        sendMessage,
        retry,
        stopGeneration,
        clearMessages,
        clearAll,
    };
}
