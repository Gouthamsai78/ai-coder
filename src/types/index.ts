// Shared types for the AI Coder application

export type ApiProvider = 'openrouter' | 'google';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export interface ModelOption {
    id: string;
    name: string;
    description: string;
}

export interface FileAttachment {
    id: string;
    name: string;
    type: 'image' | 'pdf' | 'text';
    content: string; // base64 for images/PDFs, plain text for text files
    mimeType: string;
    size: number;
}
