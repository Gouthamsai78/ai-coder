# Customization & Extension Guide

Complete guide for customizing AI Coder and integrating your own technologies, AI providers, and features.

---

## Table of Contents

- [Adding AI Providers](#adding-ai-providers)
- [Adding AI Models](#adding-ai-models)
- [Custom Storage Solutions](#custom-storage-solutions)
- [Custom Prompts & Templates](#custom-prompts--templates)
- [Integrating External Services](#integrating-external-services)
- [Custom Hooks](#custom-hooks)
- [Theming & Styling](#theming--styling)
- [Environment Variables](#environment-variables)

---

## Adding AI Providers

### Step 1: Update Types

Add your provider to the `ApiProvider` type:

```typescript
// src/types/index.ts
export type ApiProvider = 'openrouter' | 'google' | 'anthropic'; // Added 'anthropic'
```

### Step 2: Add Model Configuration

Define available models for your provider:

```typescript
// src/constants/models.ts
export const AI_MODELS = {
  google: [...],
  openrouter: [...],
  anthropic: [ // NEW
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      description: 'Most capable model for complex tasks'
    },
    {
      id: 'claude-3-sonnet-20240229',
      name: 'Claude 3 Sonnet',
      description: 'Balanced performance and speed'
    }
  ]
};

// Update default provider if needed
export const DEFAULT_PROVIDER: ApiProvider = 'anthropic';

export function getDefaultModel(provider: ApiProvider): string {
  return AI_MODELS[provider]?.[0]?.id || AI_MODELS.google[0].id;
}
```

### Step 3: Implement Provider Function

Create the generation function in `src/services/ai.ts`:

```typescript
// src/services/ai.ts
import Anthropic from '@anthropic-ai/sdk'; // Install: npm i @anthropic-ai/sdk

const generateWithAnthropic = async (
    apiKey: string,
    model: string,
    messages: { role: 'user' | 'assistant'; content: string }[],
    currentCode: string,
    onChunk: (chunk: string) => void,
    attachments?: FileAttachment[]
): Promise<{ code: string; summary: string }> => {
    const anthropic = new Anthropic({
        apiKey: apiKey,
    });

    // Build message context
    const systemMessage = SYSTEM_PROMPT;
    const userMessages = [
        ...messages,
        {
            role: 'user' as const,
            content: `Current Code:\n${currentCode}\n\nGenerate the COMPLETE updated HTML file.`
        }
    ];

    // Stream the response
    const stream = await anthropic.messages.stream({
        model: model,
        max_tokens: 4096,
        system: systemMessage,
        messages: userMessages,
    });

    let fullContent = '';

    for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            const text = chunk.delta.text;
            fullContent += text;
            onChunk(text);
        }
    }

    return processResponse(fullContent);
};
```

### Step 4: Update Router Function

Add your provider to the main routing function:

```typescript
// src/services/ai.ts
export const generateCodeStream = async (
    apiKey: string,
    model: string,
    messages: { role: 'user' | 'assistant'; content: string }[],
    currentCode: string,
    onChunk: (chunk: string) => void,
    provider: ApiProvider = 'openrouter',
    attachments?: FileAttachment[]
): Promise<{ code: string; summary: string }> => {
    try {
        if (provider === 'google') {
            return await generateWithGoogleAI(apiKey, model, messages, currentCode, onChunk, attachments);
        } else if (provider === 'anthropic') { // NEW
            return await generateWithAnthropic(apiKey, model, messages, currentCode, onChunk, attachments);
        } else {
            return await generateWithOpenRouter(apiKey, model, messages, currentCode, onChunk, attachments);
        }
    } catch (error) {
        console.error('Error generating code:', error);
        throw error;
    }
};
```

### Step 5: Update UI

Add the provider option to `SettingsModal.tsx`:

```typescript
// The component already uses AI_MODELS from constants, so it will automatically
// show the new provider option once you've updated the constants!
```

**Done!** Your new provider is now integrated.

---

## Adding AI Models

Much simpler than adding a provider - just update the constants:

```typescript
// src/constants/models.ts
export const AI_MODELS = {
  google: [
    // Existing models...
    { 
      id: 'gemini-3-ultra', // NEW MODEL
      name: 'Gemini 3 Ultra', 
      description: 'Most advanced Gemini model' 
    }
  ],
  // ...
};
```

**That's it!** The model will automatically appear in the settings dropdown.

---

## Custom Storage Solutions

### Using a Different Storage Backend

Instead of localStorage, you might want to use:
- IndexedDB
- SessionStorage
- Cloud storage (Firebase, Supabase)
- In-memory cache

#### Example: IndexedDB Storage

```typescript
// src/utils/storage.ts (replace existing implementation)
import { openDB } from 'idb'; // npm i idb

const DB_NAME = 'ai-coder-db';
const STORE_NAME = 'data';

const db = await openDB(DB_NAME, 1, {
  upgrade(db) {
    db.createObjectStore(STORE_NAME);
  },
});

export const storage = {
  async get<T>(key: string, fallback: T): Promise<T> {
    try {
      const value = await db.get(STORE_NAME, key);
      return value !== undefined ? value : fallback;
    } catch {
      return fallback;
    }
  },

  async set<T>(key: string, value: T): Promise<boolean> {
    try {
      await db.put(STORE_NAME, value, key);
      return true;
    } catch (e) {
      console.error('Storage set failed:', e);
      return false;
    }
  },

  async remove(key: string): Promise<boolean> {
    try {
      await db.delete(STORE_NAME, key);
      return true;
    } catch {
      return false;
    }
  },

  async clear(): Promise<boolean> {
    try {
      await db.clear(STORE_NAME);
      return true;
    } catch {
      return false;
    }
  },
};
```

#### Example: Supabase Storage

```typescript
// src/utils/supabase-storage.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_KEY!
);

export const cloudStorage = {
  async get<T>(userId: string, key: string, fallback: T): Promise<T> {
    const { data } = await supabase
      .from('user_data')
      .select('value')
      .eq('user_id', userId)
      .eq('key', key)
      .single();
    
    return data?.value ?? fallback;
  },

  async set<T>(userId: string, key: string, value: T): Promise<boolean> {
    const { error } = await supabase
      .from('user_data')
      .upsert({ user_id: userId, key, value });
    
    return !error;
  },
};
```

---

## Custom Prompts & Templates

### Modifying the System Prompt

The system prompt is in `src/services/ai/system-prompt.ts`:

```typescript
// src/services/ai/system-prompt.ts
export const SYSTEM_PROMPT = `
You are an elite developer specializing in [YOUR TECHNOLOGY STACK].

Your task is to generate [YOUR OUTPUT FORMAT].

[YOUR CUSTOM INSTRUCTIONS]
`.trim();
```

### Adding Prompt Templates

Add new suggestions to `src/constants/prompts.ts`:

```typescript
// src/constants/prompts.ts
export const PROMPT_SUGGESTIONS = [
  // Existing prompts...
  { emoji: '🎮', text: 'Build a game with HTML5 Canvas' },
  { emoji: '📱', text: 'Create a mobile-first PWA' },
  { emoji: '🎬', text: 'Design a video streaming interface' },
];
```

### Environment-Specific Prompts

Load prompts based on environment:

```typescript
// src/services/ai/system-prompt.ts
const BASE_PROMPT = `...base instructions...`;

const PRODUCTION_ADDITIONS = `
- Always include analytics tracking
- Ensure GDPR compliance
- Add error monitoring
`;

const DEVELOPMENT_ADDITIONS = `
- Include debug logs
- Add performance markers
- Enable verbose error messages
`;

export const SYSTEM_PROMPT = import.meta.env.PROD
  ? BASE_PROMPT + PRODUCTION_ADDITIONS
  : BASE_PROMPT + DEVELOPMENT_ADDITIONS;
```

---

## Integrating External Services

### Example: Vercel Deployment

Create a new deployment service:

```typescript
// src/services/deploy/vercel.ts
export async function deployToVercel(
  code: string,
  token: string,
  projectName: string
): Promise<DeployResult> {
  try {
    const response = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: projectName,
        files: [
          {
            file: 'index.html',
            data: code,
          },
        ],
        projectSettings: {
          framework: null,
        },
      }),
    });

    const data = await response.json();

    return {
      success: true,
      url: data.url,
      previewUrl: data.alias?.[0],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Deployment failed',
    };
  }
}
```

### Example: Firebase Integration

```typescript
// src/services/firebase.ts
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  databaseURL: import.meta.env.VITE_FIREBASE_DB_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export const firebaseStorage = {
  async saveProject(userId: string, projectId: string, code: string) {
    await set(ref(db, `users/${userId}/projects/${projectId}`), {
      code,
      updatedAt: Date.now(),
    });
  },

  async loadProject(userId: string, projectId: string) {
    const snapshot = await get(ref(db, `users/${userId}/projects/${projectId}`));
    return snapshot.val();
  },
};
```

---

## Custom Hooks

### Creating Your Own Hooks

Follow the existing pattern:

```typescript
// src/hooks/useProjectManager.ts
import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

interface Project {
  id: string;
  name: string;
  code: string;
  createdAt: number;
}

export function useProjectManager() {
  const [projects, setProjects] = useLocalStorage<Project[]>('projects', []);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const createProject = useCallback((name: string, code: string) => {
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      code,
      createdAt: Date.now(),
    };
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    return newProject;
  }, [setProjects]);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) {
      setActiveProjectId(null);
    }
  }, [activeProjectId, setProjects]);

  const activeProject = projects.find(p => p.id === activeProjectId);

  return {
    projects,
    activeProject,
    activeProjectId,
    setActiveProjectId,
    createProject,
    deleteProject,
  };
}
```

### Using Your Custom Hook

```typescript
// src/App.tsx
import { useProjectManager } from './hooks/useProjectManager';

function App() {
  const projectManager = useProjectManager();
  
  const handleNewProject = () => {
    projectManager.createProject('My New Project', DEFAULT_CODE);
  };
  
  // ...
}
```

---

## Theming & Styling

### Custom CSS Variables

Add your own design tokens:

```typescript
// src/constants/theme.ts
export const THEME = {
  colors: {
    primary: '#0ea5e9',
    secondary: '#8b5cf6',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '16px',
    full: '9999px',
  },
};
```

### Apply in CSS

```css
:root {
  --color-primary: ${THEME.colors.primary};
  --spacing-md: ${THEME.spacing.md};
  --radius-md: ${THEME.borderRadius.md};
}
```

### Dark Mode

Implement custom dark mode:

```typescript
// src/hooks/useTheme.ts
import { useLocalStorage } from './useLocalStorage';

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'dark');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  };

  return { theme, toggleTheme };
}
```

---

## Environment Variables

### Setup

Create `.env` file:

```bash
# AI Provider Keys
VITE_GOOGLE_API_KEY=your_key_here
VITE_OPENROUTER_API_KEY=your_key_here

# Deployment
VITE_GITHUB_TOKEN=your_token_here
VITE_VERCEL_TOKEN=your_token_here

# Firebase
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_PROJECT_ID=your_project_id

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_TELEMETRY=false
```

### Usage

```typescript
// src/config.ts
export const config = {
  googleApiKey: import.meta.env.VITE_GOOGLE_API_KEY,
  openrouterApiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
  githubToken: import.meta.env.VITE_GITHUB_TOKEN,
  features: {
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    telemetry: import.meta.env.VITE_ENABLE_TELEMETRY === 'true',
  },
};
```

### Pre-fill API Keys (Development Only)

```typescript
// src/hooks/useApiSettings.ts
const [apiKey, setApiKey] = useLocalStorageString(
  STORAGE_KEYS.API_KEY,
  import.meta.env.DEV ? import.meta.env.VITE_GOOGLE_API_KEY : ''
);
```

---

## Advanced Examples

### Adding Code Export Formats

```typescript
// src/utils/export.ts
export function exportAsReact(code: string): string {
  // Convert HTML to React JSX
  return `
import React from 'react';

export default function App() {
  return (
    <div dangerouslySetInnerHTML={{ __html: \`${code}\` }} />
  );
}
  `;
}

export function exportAsVue(code: string): string {
  return `
<template>
  <div v-html="code"></div>
</template>

<script setup>
const code = \`${code}\`;
</script>
  `;
}
```

### Adding Code Analysis

```typescript
// src/services/analyzer.ts
export function analyzeCode(code: string) {
  return {
    lineCount: code.split('\n').length,
    characterCount: code.length,
    hasCSS: code.includes('<style>'),
    hasJS: code.includes('<script>'),
    frameworks: detectFrameworks(code),
  };
}

function detectFrameworks(code: string): string[] {
  const frameworks = [];
  if (code.includes('cdn.tailwindcss.com')) frameworks.push('Tailwind');
  if (code.includes('unpkg.com/vue')) frameworks.push('Vue');
  if (code.includes('react.development.js')) frameworks.push('React');
  return frameworks;
}
```

---

## Best Practices

1. **Keep Types Updated**: Always update `src/types/index.ts` when adding new features
2. **Use Constants**: Put all configuration in `src/constants/`
3. **Create Utils**: Reusable logic goes in `src/utils/`
4. **Build Hooks**: Extract stateful logic into custom hooks
5. **Document**: Update docs when you add features
6. **Test**: Build after major changes (`npm run build`)

---

## Need Help?

- 📖 Read [TYPES.md](./TYPES.md) for type reference
- 🏗️ Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- 💡 See existing code for patterns
- 🐛 File issues for bugs or feature requests
