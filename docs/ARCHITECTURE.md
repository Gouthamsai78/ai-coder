# Architecture Documentation

High-level overview of AI Coder's architecture, design patterns, and system design.

---

## System Overview

AI Coder is built as a **modular, hook-based React application** with clear separation of concerns:

```
┌─────────────────────────────────────────────┐
│           User Interface (React)            │
│  Components + Custom Hooks + State          │
└────────────┬────────────────────────────────┘
             │
┌────────────┴────────────────────────────────┐
│         Application Layer                   │
│  - Custom Hooks (State Management)          │
│  - Constants (Configuration)                │
│  - Utils (Helper Functions)                 │
└────────────┬────────────────────────────────┘
             │
┌────────────┴────────────────────────────────┐
│         Service Layer                       │
│  - AI Generation (Google, OpenRouter)       │
│  - File Processing                          │
│  - Deployment Services                      │
└────────────┬────────────────────────────────┘
             │
┌────────────┴────────────────────────────────┐
│         Storage Layer                       │
│  - LocalStorage (Wrapped)                   │
│  - SessionStorage                           │
└─────────────────────────────────────────────┘
```

---

## Directory Structure

```
src/
├── components/          # React UI components
│   ├── ChatInterface.tsx
│   ├── CodeEditor.tsx
│   ├── SettingsModal.tsx
│   └── ...
│
├── hooks/              # Custom React hooks (state logic)
│   ├── useLocalStorage.ts
│   ├── useApiSettings.ts
│   ├── useCodeEditor.ts
│   ├── useChat.ts
│   ├── useAppNavigation.ts
│   └── index.ts
│
├── services/           # External service integrations
│   ├── ai/
│   │   └── system-prompt.ts
│   ├── ai.ts
│   ├── deploy.ts
│   └── fileProcessor.ts
│
├── utils/              # Helper functions
│   ├── storage.ts
│   ├── download.ts
│   ├── errors.ts
│   └── index.ts
│
├── constants/          # Configuration & constants
│   ├── storage.ts
│   ├── app.ts
│   ├── models.ts
│   ├── prompts.ts
│   └── index.ts
│
├── types/              # TypeScript type definitions
│   └── index.ts
│
└── App.tsx             # Main application orchestrator
```

---

## Design Patterns

### 1. Custom Hooks Pattern

**Problem:** Large components with complex state management.

**Solution:** Extract state logic into custom hooks.

```typescript
// Instead of this (in App.tsx):
const [apiKey, setApiKey] = useState('');
const [provider, setProvider] = useState('google');
const [model, setModel] = useState('gemini-2.0-flash');

// We have this:
const apiSettings = useApiSettings();
// Returns: { settings, setProvider, setApiKey, setModel, ... }
```

**Benefits:**
- Reusable across components
- Easier to test
- Clear separation of concerns
- Reduced component complexity

### 2. Constants Layer Pattern

**Problem:** Magic strings scattered throughout codebase.

**Solution:** Centralize all configuration.

```typescript
// Before:
localStorage.getItem('ai_api_key');
localStorage.setItem('selected_model', model);

// After:
import { STORAGE_KEYS } from '../constants/storage';
storage.get(STORAGE_KEYS.API_KEY, '');
storage.set(STORAGE_KEYS.SELECTED_MODEL, model);
```

### 3. Service Layer Pattern

**Problem:** Business logic mixed with UI logic.

**Solution:** Move external operations to services.

```typescript
// src/services/ai.ts
export const generateCodeStream = async (...) => {
  // AI generation logic here
};

// src/App.tsx (or hook)
const result = await generateCodeStream(apiKey, model, messages, code, onChunk);
```

### 4. Utility Pattern

**Problem:** Repeated helper code in multiple files.

**Solution:** Extract to utility functions.

```typescript
// src/utils/errors.ts
export function formatApiError(error: unknown): string {
  // Convert technical errors to user-friendly messages
}

// Usage anywhere:
const friendlyMessage = formatApiError(error);
```

---

## Data Flow

### Code Generation Flow

```
User Input
   │
   ├─> ChatInterface (Component)
   │      │
   │      └─> useChat (Hook)
   │             │
   │             ├─> generateCodeStream (Service)
   │             │      │
   │             │      ├─> Google AI API
   │             │      └─> OpenRouter API
   │             │
   │             └─> Streaming chunks
   │                    │
   │                    ├─> onChunk callback
   │                    │      │
   │                    │      └─> Update UI in real-time
   │                    │
   │                    └─> Complete response
   │                           │
   │                           └─> useCodeEditor
   │                                  │
   │                                  └─> Update code state
```

### State Persistence Flow

```
React State (Hook)
   │
   ├─> useLocalStorage (Hook)
   │      │
   │      └─> storage.set() (Util)
   │             │
   │             └─> localStorage.setItem()
   │
   └─> On Mount:
          │
          └─> storage.get() (Util)
                 │
                 └─> localStorage.getItem()
                        │
                        └─> Initialize state
```

---

## State Management

### Hook-Based Architecture

Each domain has its own custom hook:

| Hook | Manages | Persisted |
|------|---------|-----------|
| `useApiSettings` | API keys, provider, model | ✅ localStorage |
| `useCodeEditor` | Code, history, pending changes | ✅ localStorage |
| `useChat` | Messages, loading, errors | ✅ localStorage |
| `useAppNavigation` | Tabs, modals, landing | ✅ localStorage |

### Composition in App.tsx

```typescript
function AppContent() {
  // All state managed by hooks
  const navigation = useAppNavigation();
  const apiSettings = useApiSettings();
  const editor = useCodeEditor();
  const chat = useChat({
    apiSettings: apiSettings.settings,
    code: editor.code,
    isDefaultCode: editor.isDefault,
    setCode: editor.setCode,
    setPendingCode: editor.setPendingCode,
    pushToHistory: editor.pushToHistory,
  });
  
  // Minimal UI-only state
  const [copied, setCopied] = useState(false);
  
  // Just render and handle events
}
```

---

## Key Architectural Decisions

### 1. Single HTML File Output

**Decision:** AI generates complete, self-contained HTML files.

**Rationale:**
- Easy to preview in iframe
- Simple to download/deploy
- No build step required for generated code
- Users can open directly in browser

### 2. LocalStorage for Persistence

**Decision:** Use localStorage for all data persistence.

**Rationale:**
- No backend required
- Works offline
- Simple implementation
- Fast access

**Trade-offs:**
- Limited to ~5-10MB
- No cross-device sync
- Can be cleared by user

### 3. Streaming AI Responses

**Decision:** Stream AI responses chunk-by-chunk.

**Rationale:**
- Better UX (see progress in real-time)
- Lower perceived latency
- Can show loading states
- Enables cancellation (future)

### 4. Diff-Based Code Updates

**Decision:** Show diff for modifications, direct apply for new builds.

**Rationale:**
- Users can review changes before applying
- Prevents accidental overwrites
- Educational (see what changed)
- Supports undo/redo

---

## Performance Considerations

### 1. Code Editor Optimization

- **Debounced onChange**: Prevent excessive re-renders
- **Lazy loading**: CodeMirror loaded on demand
- **Virtual scrolling**: Handle large code files

### 2. Chat Message Rendering

- **Virtualization**: For very long conversations
- **Memoization**: React.memo for message components
- **Efficient updates**: Only re-render new messages

### 3. Storage Optimization

- **Selective persistence**: Only save changed data
- **Compression**: Consider LZ-string for large code
- **Cleanup**: Remove old history items (limit to 5)

---

## Security Considerations

### 1. API Key Storage

- Stored in localStorage (client-side only)
- Never transmitted except to selected AI provider
- User responsible for key security

**Recommendations for Production:**
- Use environment variables for server-side proxy
- Implement rate limiting
- Add authentication layer

### 2. XSS Prevention

- Preview in sandboxed iframe
- Content Security Policy headers
- Sanitize user inputs

### 3. CORS & CSP

- Configure proper CORS for deployment services
- Set restrictive CSP for generated previews

---

## Extensibility Points

### Easy to Extend

1. **Add AI Provider:**
   - Update `constants/models.ts`
   - Add provider function in `services/ai.ts`
   - Update router

2. **Add Storage Backend:**
   - Replace `utils/storage.ts` implementation
   - Keep same interface

3. **Add Export Format:**
   - Add function to `utils/download.ts`
   - Add button in UI

4. **Add Deployment Target:**
   - Create new service in `services/deploy/`
   - Add to DeployModal

### Hard to Extend

1. **Change Output Format:**
   - Requires updating system prompt
   - Updating preview rendering
   - Modifying file processing

2. **Multi-File Projects:**
   - Major architectural change
   - Need virtual file system
   - Complex preview setup

---

## Testing Strategy

### Unit Tests
- Utility functions
- Custom hooks (with @testing-library/react-hooks)
- Type guards

### Integration Tests
- Hook interactions
- Service layer
- Storage operations

### E2E Tests
- Full user flows
- AI generation scenarios
- Deployment processes

---

## Future Architecture Improvements

### Potential Enhancements

1. **State Management Library:**
   - Consider Zustand or Jotai for global state
   - Reduce prop drilling
   - Better DevTools integration

2. **Backend API:**
   - Proxy for API keys
   - User authentication
   - Cloud storage for projects

3. **Code Splitting:**
   - Lazy load heavy components
   - Dynamic imports for providers
   - Reduce initial bundle size

4. **Web Workers:**
   - Offload code processing
   - Background file operations
   - Better performance

5. **IndexedDB:**
   - Replace localStorage for larger capacity
   - Better query capabilities
   - Structured data storage

---

## Maintenance Guidelines

### Adding Features

1. **Plan:** Update `docs/` first
2. **Types:** Define in `types/index.ts`
3. **Constants:** Add config to `constants/`
4. **Implementation:** Follow existing patterns
5. **Test:** Build and verify
6. **Document:** Update relevant docs

### Refactoring

1. **Small steps:** One component at a time
2. **Maintain API:** Keep hook interfaces stable
3. **Test:** Verify after each change
4. **Document:** Update architecture docs

---

## Related Documentation

- [Types Documentation](./TYPES.md) - TypeScript reference
- [Customization Guide](./CUSTOMIZATION.md) - Extension guide
- [API Reference](./API.md) - Service API documentation (if created)
