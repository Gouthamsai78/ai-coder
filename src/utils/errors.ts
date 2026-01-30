/**
 * User-friendly error message formatting
 * Converts technical API errors into helpful messages for users
 */
export function formatApiError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);

    // Google AI specific errors
    if (message.includes('API_KEY_INVALID') || message.includes('API key not valid')) {
        return 'Invalid Google AI API key. Please get a new key from https://aistudio.google.com/apikey';
    }
    if (message.includes('PERMISSION_DENIED') || message.includes('permission denied')) {
        return 'Permission denied. Your API key may not have access to this model.';
    }
    if (message.includes('QUOTA_EXCEEDED') || message.includes('quota')) {
        return 'API quota exceeded. Try again later or use a different API key.';
    }
    if (message.includes('RESOURCE_EXHAUSTED')) {
        return 'Resource exhausted. You may have exceeded your rate limit.';
    }
    if (message.includes('SAFETY') || message.includes('blocked')) {
        return 'Response blocked by safety filters. Try rephrasing your request.';
    }
    if (message.includes('model is not found') || message.includes('Model not found')) {
        return 'Model not available. Try selecting a different model.';
    }

    // Standard HTTP errors
    if (message.includes('401')) {
        return 'Invalid API key. Please check your settings.';
    }
    if (message.includes('403')) {
        return 'Access forbidden. Check if your API key has proper permissions.';
    }
    if (message.includes('429')) {
        return 'Rate limit exceeded. Please wait a moment and try again.';
    }
    if (message.includes('400')) {
        return 'Bad request. The model may not support this request format.';
    }
    if (message.includes('500') || message.includes('502') || message.includes('503')) {
        return 'Server error. Please try again later.';
    }
    if (message.includes('network') || message.includes('fetch failed') || message.includes('Failed to fetch')) {
        return 'Network error. Check your internet connection.';
    }
    if (message.includes('timeout') || message.includes('TIMEOUT')) {
        return 'Request timed out. Please try again.';
    }
    if (message.includes('CORS') || message.includes('cors')) {
        return 'CORS error. This may be a browser security issue.';
    }

    // Return original message if no specific match
    if (message.length < 100) {
        return message;
    }

    return 'Something went wrong. Check console for details.';
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
