/**
 * User-friendly error message formatting
 * Converts technical API errors into helpful messages for users
 */
export function formatApiError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('401')) {
        return 'Invalid API key. Please check your settings.';
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
    if (message.includes('network') || message.includes('fetch failed')) {
        return 'Network error. Check your internet connection.';
    }
    if (message.includes('timeout')) {
        return 'Request timed out. Please try again.';
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
