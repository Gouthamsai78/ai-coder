# TypeScript Types Documentation

Complete reference for all TypeScript types, interfaces, and type definitions used in AI Coder.

---

## Table of Contents

- [Core Types](#core-types)
- [State Types](#state-types)
- [Action Types](#action-types)
- [Component Props Types](#component-props-types)
- [Service Types](#service-types)
- [Usage Examples](#usage-examples)

---

## Core Types

### `ApiProvider`

Defines the available AI provider options.

```typescript
export type ApiProvider = 'openrouter' | 'google';
```

**Usage:**
- Used in settings to determine which AI service to use
- Affects which models are available
- Each provider has different API requirements

**Example:**
```typescript
const provider: ApiProvider = 'google';
```

---

### `Message`

Represents a single chat message in the conversation.

```typescript
export interface Message {
  role: 'user' | 'assistant';
  content: string;
}
```

**Properties:**
- `role`: Who sent the message (`'user'` or `'assistant'`)
- `content`: The text content of the message

**Example:**
```typescript
const message: Message = {
  role: 'user',
  content: 'Build a landing page for a SaaS product'
};
```

---

### `ModelOption`

Describes an AI model configuration.

```typescript
export interface ModelOption {
  id: string;
  name: string;
  description: string;
}
```

**Properties:**
- `id`: Unique identifier for the model (used in API calls)
- `name`: Human-readable display name
- `description`: Brief description of the model's capabilities

**Example:**
```typescript
const model: ModelOption = {
  id: 'gemini-2.0-flash',
  name: 'Gemini 2.0 Flash',
  description: 'Fast and capable (Free)'
};
```

---

### `FileAttachment`

Represents an uploaded file attachment.

```typescript
export interface FileAttachment {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'text';
  content: string;
  mimeType: string;
  size: number;
}
```

**Properties:**
- `id`: Unique identifier for the attachment
- `name`: Original filename
- `type`: File category (determines how it's processed)
- `content`: File content (base64 for images/PDFs, plain text for text files)
- `mimeType`: MIME type (e.g., `'image/png'`, `'application/pdf'`)
- `size`: File size in bytes

**Example:**
```typescript
const attachment: FileAttachment = {
  id: '1234567890',
  name: 'mockup.png',
  type: 'image',
  content: 'data:image/png;base64,iVBORw0KGgo...',
  mimeType: 'image/png',
  size: 45678
};
```

---

## State Types

These interfaces define the shape of state managed by custom hooks.

### `ApiSettings`

API configuration state.

```typescript
export interface ApiSettings {
  provider: ApiProvider;
  apiKey: string;
  model: string;
  githubToken: string;
}
```

**Properties:**
- `provider`: Selected AI provider
- `apiKey`: API key for the selected provider
- `model`: Selected model ID
- `githubToken`: GitHub personal access token (for deployment)

**Used by:** `useApiSettings` hook

---

### `EditorState`

Code editor state.

```typescript
export interface EditorState {
  code: string;
  history: string[];
  pendingCode: string | null;
  isDefault: boolean;
}
```

**Properties:**
- `code`: Current code in the editor
- `history`: Array of previous code versions (for undo)
- `pendingCode`: AI-generated code awaiting approval (for diff review)
- `isDefault`: Whether the code is the default template

**Used by:** `useCodeEditor` hook

---

### `ChatState`

Chat conversation state.

```typescript
export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  lastError: string | null;
  lastPrompt: string;
}
```

**Properties:**
- `messages`: Array of conversation messages
- `isLoading`: Whether AI is currently generating a response
- `lastError`: Most recent error message (if any)
- `lastPrompt`: Last user prompt (for retry functionality)

**Used by:** `useChat` hook

---

### `ActiveTab`

Currently active tab in the UI.

```typescript
export type ActiveTab = 'chat' | 'code' | 'preview';
```

**Values:**
- `'chat'`: Chat interface visible
- `'code'`: Code editor visible
- `'preview'`: Preview pane visible

---

### `AppNavigation`

Application navigation and modal state.

```typescript
export interface AppNavigation {
  showLanding: boolean;
  activeTab: ActiveTab;
  showSettings: boolean;
  showDeploy: boolean;
}
```

**Properties:**
- `showLanding`: Whether to show the landing page
- `activeTab`: Currently active tab
- `showSettings`: Whether settings modal is open
- `showDeploy`: Whether deploy modal is open

**Used by:** `useAppNavigation` hook

---

## Action Types

These interfaces define the actions/methods returned by custom hooks.

### `EditorActions`

Code editor operations.

```typescript
export interface EditorActions {
  setCode: (code: string) => void;
  undo: () => boolean;
  applyPendingCode: () => void;
  rejectPendingCode: () => void;
  reset: () => void;
  download: () => void;
  copy: () => Promise<boolean>;
  setPendingCode: (code: string | null) => void;
  pushToHistory: () => void;
}
```

**Methods:**
- `setCode(code)`: Update the code (directly, without history)
- `undo()`: Restore previous code version (returns `true` if successful)
- `applyPendingCode()`: Apply AI-generated code changes
- `rejectPendingCode()`: Reject AI-generated code changes
- `reset()`: Reset to default code and clear history
- `download()`: Download code as HTML file
- `copy()`: Copy code to clipboard (returns `true` if successful)
- `setPendingCode(code)`: Set pending code for diff review
- `pushToHistory()`: Manually save current code to history

**Example:**
```typescript
const editor = useCodeEditor();

// Apply AI changes
editor.applyPendingCode();

// Undo last change
if (editor.undo()) {
  console.log('Undo successful');
}

// Copy to clipboard
const copied = await editor.copy();
```

---

### `ChatActions`

Chat operations.

```typescript
export interface ChatActions {
  sendMessage: (message: string, attachments?: FileAttachment[]) => Promise<void>;
  retry: () => void;
  clearMessages: () => void;
  clearAll: () => void;
}
```

**Methods:**
- `sendMessage(message, attachments?)`: Send a message to the AI
- `retry()`: Retry the last failed request
- `clearMessages()`: Clear chat history (keeps code)
- `clearAll()`: Clear everything (chat + resets error state)

**Example:**
```typescript
const chat = useChat(options);

// Send a message
await chat.sendMessage('Add a contact form', attachments);

// Retry on error
if (chat.lastError) {
  chat.retry();
}

// Clear chat
chat.clearMessages();
```

---

## Component Props Types

### `ToastType`

Toast notification configuration.

```typescript
export interface ToastType {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}
```

**Properties:**
- `id`: Unique identifier for the toast
- `message`: Text to display
- `type`: Visual style/severity level

---

### `DeployResult`

Deployment operation result.

```typescript
export interface DeployResult {
  success: boolean;
  url?: string;
  previewUrl?: string;
  error?: string;
}
```

**Properties:**
- `success`: Whether deployment succeeded
- `url`: URL to the deployed app (if successful)
- `previewUrl`: Preview URL (e.g., for staging)
- `error`: Error message (if failed)

---

## Service Types

### `GenerateResult`

AI code generation result.

```typescript
export interface GenerateResult {
  code: string;
  summary: string;
}
```

**Properties:**
- `code`: Generated HTML code
- `summary`: Brief description of what was generated/changed

**Returned by:** `generateCodeStream()` function

---

### `StreamOptions`

Streaming callbacks configuration.

```typescript
export interface StreamOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (result: GenerateResult) => void;
  onError?: (error: Error) => void;
}
```

**Properties:**
- `onChunk`: Called for each chunk of streamed content
- `onComplete`: Called when generation completes successfully
- `onError`: Called if an error occurs during generation

---

## Usage Examples

### Complete Hook Usage

```typescript
import { useApiSettings, useCodeEditor, useChat, useAppNavigation } from './hooks';

function MyComponent() {
  // API settings
  const apiSettings = useApiSettings();
  
  // Code editor
  const editor = useCodeEditor();
  
  // Chat
  const chat = useChat({
    apiSettings: apiSettings.settings,
    code: editor.code,
    isDefaultCode: editor.isDefault,
    setCode: editor.setCode,
    setPendingCode: editor.setPendingCode,
    pushToHistory: editor.pushToHistory,
  });
  
  // Navigation
  const navigation = useAppNavigation();
  
  // Use the hooks
  const handleSend = async (message: string) => {
    await chat.sendMessage(message);
  };
  
  const handleApply = () => {
    editor.applyPendingCode();
  };
  
  return (
    <div>
      {/* Your UI */}
    </div>
  );
}
```

### Type-Safe Message Array

```typescript
const messages: Message[] = [
  { role: 'user', content: 'Build a todo app' },
  { role: 'assistant', content: 'I\'ve created a todo app for you...' },
  { role: 'user', content: 'Add dark mode' },
];
```

### Model Configuration

```typescript
import type { ApiProvider, ModelOption } from './types';

const models: Record<ApiProvider, ModelOption[]> = {
  google: [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Fast and capable' }
  ],
  openrouter: [
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Best for reasoning' }
  ]
};
```

---

## Type Guards

Useful type guard functions:

```typescript
// Check if provider is valid
function isValidProvider(provider: string): provider is ApiProvider {
  return provider === 'google' || provider === 'openrouter';
}

// Check if tab is valid
function isValidTab(tab: string): tab is ActiveTab {
  return tab === 'chat' || tab === 'code' || tab === 'preview';
}

// Check if attachment is image
function isImageAttachment(attachment: FileAttachment): boolean {
  return attachment.type === 'image';
}
```

---

## Best Practices

### 1. Always Use Types
```typescript
// ✅ Good
const provider: ApiProvider = 'google';

// ❌ Bad
const provider = 'google'; // TypeScript might infer as string
```

### 2. Type Hook Returns
```typescript
// ✅ Good
const editor: EditorState & EditorActions = useCodeEditor();

// ❌ Bad (but works)
const editor = useCodeEditor();
```

### 3. Type Event Handlers
```typescript
// ✅ Good
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  // ...
};

// ❌ Bad
const handleClick = (e: any) => {
  // ...
};
```

### 4. Use Generics with useLocalStorage
```typescript
// ✅ Good
const [messages, setMessages] = useLocalStorage<Message[]>('messages', []);

// ❌ Bad (loses type safety)
const [messages, setMessages] = useLocalStorage('messages', []);
```

---

## Adding New Types

When adding new types, follow this pattern:

1. **Define the type in `src/types/index.ts`**
```typescript
export interface MyNewType {
  id: string;
  data: string;
}
```

2. **Export from the same file**
```typescript
export type { MyNewType };
```

3. **Import where needed**
```typescript
import type { MyNewType } from '../types';
```

4. **Update this documentation!**
