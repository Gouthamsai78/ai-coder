/**
 * User-friendly error message formatting
 * Converts technical API errors into helpful messages for users
 */
export function formatApiError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    const lowerMessage = message.toLowerCase();

    // Authentication errors
    if (message.includes('401') || lowerMessage.includes('unauthorized') || lowerMessage.includes('invalid api key')) {
        return 'Invalid API key. Please check your settings and try again.';
    }

    // Rate limiting
    if (message.includes('429') || lowerMessage.includes('resource_exhausted') || lowerMessage.includes('rate limit') || lowerMessage.includes('too many requests')) {
        return 'Rate limit exceeded. Please wait a moment and retry, or try disabling Web Search in Settings.';
    }

    // Bad request / invalid input
    if (message.includes('400') || lowerMessage.includes('bad request')) {
        if (lowerMessage.includes('model')) {
            return 'Invalid model selected. Please choose a different model in Settings.';
        }
        return 'Invalid request format. Please try again with a different prompt.';
    }

    // Model not found
    if (lowerMessage.includes('model not found') || lowerMessage.includes('invalid model') || lowerMessage.includes('does not exist')) {
        return 'Model not available. Please select a different model in Settings.';
    }

    // Content filtering
    if (lowerMessage.includes('content filter') || lowerMessage.includes('safety') || lowerMessage.includes('blocked') || lowerMessage.includes('policy violation')) {
        return 'Your request was blocked by content filters. Please rephrase your prompt and try again.';
    }

    // Quota exceeded
    if (lowerMessage.includes('quota') || lowerMessage.includes('exceeded') || lowerMessage.includes('limit exceeded')) {
        return 'API quota exceeded. Please check your API provider account or try again later.';
    }

    // Server errors
    if (message.includes('500') || message.includes('502') || message.includes('503') || lowerMessage.includes('server error') || lowerMessage.includes('internal error')) {
        return 'AI service is temporarily unavailable. Please try again in a few moments.';
    }

    // Network errors
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch failed') || lowerMessage.includes('connection') || lowerMessage.includes('cors') || lowerMessage.includes('offline')) {
        return 'Network error. Please check your internet connection and try again.';
    }

    // Timeout
    if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out') || lowerMessage.includes('deadline')) {
        return 'Request timed out. The AI service is busy - please try again.';
    }

    // OpenRouter specific errors
    if (lowerMessage.includes('openrouter') && lowerMessage.includes('error')) {
        return 'OpenRouter service error. Please check your API key and try again.';
    }

    // Google AI specific errors
    if (lowerMessage.includes('generative') || lowerMessage.includes('gemini')) {
        if (lowerMessage.includes('api key')) {
            return 'Invalid Google API key. Please check your settings.';
        }
        return 'Google AI service error. Please try again or switch to a different provider.';
    }

    // JSON parsing errors (from response processing)
    if (lowerMessage.includes('json') || lowerMessage.includes('parse') || lowerMessage.includes('syntax error')) {
        return 'Failed to process AI response. Please try again with a simpler prompt.';
    }

    // Streaming errors — last resort, log real error for debugging
    if (lowerMessage.includes('stream') || lowerMessage.includes('abort')) {
        console.error('Stream/abort error (raw):', error);
        return 'Connection interrupted during generation. Please try again.';
    }

    // Default fallback
    console.error('API Error:', error);
    return 'AI service error. Please check your API key, internet connection, and try again. If the problem persists, try a different model or provider.';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Truncate text to a maximum length
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
}
