import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '../constants/storage';
import { generateCodeStream } from '../services/ai';
import { formatApiError } from '../utils/errors';
import { analytics } from '../utils/analytics';
import { useToast } from '../components/Toast';
import type { Message, FileAttachment, ChatState, ChatActions, ApiSettings } from '../types';

interface UseChatOptions {
    apiSettings: ApiSettings;
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
    const { apiSettings, code, isDefaultCode, setCode, setPendingCode, pushToHistory } = options;

    const [messages, setMessages] = useLocalStorage<Message[]>(
        STORAGE_KEYS.CHAT_MESSAGES,
        []
    );

    const [isLoading, setIsLoading] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);
    const [lastPrompt, setLastPrompt] = useState('');

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
            const providerName = apiSettings.provider === 'google'
                ? 'Google AI Studio'
                : 'OpenRouter';
            setMessages(prev => [
                ...prev,
                { role: 'user', content: message },
                { role: 'assistant', content: `Please set your ${providerName} API Key in settings first.` }
            ]);
            return;
        }

        setLastPrompt(message);
        setLastError(null);

        const newMessages: Message[] = [...messages, { role: 'user', content: message }];
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
                apiSettings.webSearchEnabled
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
        }
    }, [apiSettings, messages, code, isDefaultCode, setCode, setPendingCode, pushToHistory, showToast, setMessages]);

    const retry = useCallback(() => {
        if (lastPrompt && !isLoading) {
            setMessages(prev => prev.slice(0, -2));
            analytics.track('retry', { provider: apiSettings.provider });
            sendMessage(lastPrompt);
        }
    }, [lastPrompt, isLoading, sendMessage, setMessages, apiSettings.provider]);

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
