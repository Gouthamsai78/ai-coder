import type { FileAttachment } from '../types';

/**
 * Process a file and convert it to a FileAttachment object
 * Supports: images (PNG, JPG, GIF, WebP), PDFs, and text files
 */
export async function processFile(file: File): Promise<FileAttachment> {
    const id = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Determine file type
    let type: FileAttachment['type'];
    if (file.type.startsWith('image/')) {
        type = 'image';
    } else if (file.type === 'application/pdf') {
        type = 'pdf';
    } else {
        type = 'text';
    }

    // For text files, read as text. For binary (images, PDFs), read as base64
    let content: string;
    if (type === 'text') {
        content = await readAsText(file);
    } else {
        content = await readAsBase64(file);
    }

    return {
        id,
        name: file.name,
        type,
        content,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
    };
}

/**
 * Read file as plain text
 */
function readAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file as text'));
        reader.readAsText(file);
    });
}

/**
 * Read file as base64 data URL
 */
function readAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove the data URL prefix (e.g., "data:image/png;base64,")
            // We'll keep the full data URL for easier handling
            resolve(result);
        };
        reader.onerror = () => reject(new Error('Failed to read file as base64'));
        reader.readAsDataURL(file);
    });
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
 * Check if file type is supported
 */
export function isFileSupported(file: File): boolean {
    const supportedTypes = [
        // Images
        'image/png',
        'image/jpeg',
        'image/gif',
        'image/webp',
        // PDFs
        'application/pdf',
        // Text
        'text/plain',
        'text/markdown',
        'text/html',
        'text/css',
        'text/javascript',
        'application/json',
    ];

    // Also allow files with text-like extensions
    const textExtensions = ['.txt', '.md', '.json', '.html', '.css', '.js', '.ts', '.tsx', '.jsx'];
    const hasTextExtension = textExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    return supportedTypes.includes(file.type) || hasTextExtension;
}

/**
 * Get icon for file type
 */
export function getFileIcon(type: FileAttachment['type']): string {
    switch (type) {
        case 'image':
            return '🖼️';
        case 'pdf':
            return '📄';
        case 'text':
            return '📝';
        default:
            return '📎';
    }
}
