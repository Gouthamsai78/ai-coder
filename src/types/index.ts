// ============================================
// Core Types
// ============================================

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

// ============================================
// State Types (for hooks)
// ============================================

export interface ApiSettings {
    provider: ApiProvider;
    apiKey: string;
    model: string;
    githubToken: string;
}

export interface EditorState {
    code: string;
    history: string[];
    pendingCode: string | null;
    isDefault: boolean;
}

export interface ChatState {
    messages: Message[];
    isLoading: boolean;
    lastError: string | null;
    lastPrompt: string;
}

export type ActiveTab = 'chat' | 'code' | 'preview';

export interface AppNavigation {
    showLanding: boolean;
    activeTab: ActiveTab;
    showSettings: boolean;
    showDeploy: boolean;
}

// ============================================
// Action Types (for hook returns)
// ============================================

export interface EditorActions {
    setCode: (code: string) => void;
    undo: () => boolean;
    applyPendingCode: () => void;
    rejectPendingCode: () => void;
    reset: () => void;
    download: () => void;
    copy: () => Promise<boolean>;
    // Internal actions exposed for advanced usage
    setPendingCode: (code: string | null) => void;
    pushToHistory: () => void;
}

export interface ChatActions {
    sendMessage: (message: string, attachments?: FileAttachment[]) => Promise<void>;
    retry: () => void;
    clearMessages: () => void;
    clearAll: () => void;
}

// ============================================
// Component Props Types
// ============================================

export interface ToastType {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
}

export interface DeployResult {
    success: boolean;
    url?: string;
    previewUrl?: string;
    error?: string;
}

// ============================================
// AI Service Types
// ============================================

export interface GenerateResult {
    code: string;
    summary: string;
}

export interface StreamOptions {
    onChunk?: (chunk: string) => void;
    onComplete?: (result: GenerateResult) => void;
    onError?: (error: Error) => void;
}

