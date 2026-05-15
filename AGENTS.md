# AGENTS.md - AI Coder Development Guidelines

## Build/Lint/Test Commands

```bash
npm run dev       # Start dev server (Vite + HMR)
npm run build     # Type check + production build (tsc -b && vite build)
npm run lint      # Run ESLint on all files
npm run preview   # Preview production build locally
```

**No test framework is configured.** Add tests manually if needed (Jest/Vitest recommended).

**Running a single file check:**
```bash
npx tsc --noEmit src/path/to/file.tsx    # Type check single file
npx eslint src/path/to/file.tsx          # Lint single file
```

## Code Style Guidelines

### Imports
- Order: React → External libraries → Local imports (relative paths)
- Use named imports for React hooks: `import { useState, useEffect } from 'react'`
- Use `clsx` for conditional class names, `tailwind-merge` for merging Tailwind classes
- No barrel imports from components - import directly from files

### Formatting
- 4-space indentation (configured in editor)
- Semicolons required
- Single quotes for strings, double quotes for JSX attributes
- Trailing commas in multi-line objects/arrays
- Max line length: ~100 chars (ESLint default)

### TypeScript
- Strict mode enabled (`strict: true` in tsconfig)
- No `any` - use `unknown` or proper types
- Interface names: PascalCase (`interface ApiSettings`)
- Type aliases: PascalCase (`type ApiProvider = 'openrouter' | 'google'`)
- Generic types use single letter (`T`, `K`, `V`)
- All types defined in `src/types/index.ts`
- Use `verbatimModuleSyntax` - no default exports for types

### Naming Conventions
- Components: PascalCase (`ChatInterface`, `DeployModal`)
- Hooks: camelCase with `use` prefix (`useChat`, `useCodeEditor`)
- Variables/Functions: camelCase (`sendMessage`, `isLoading`)
- Constants: UPPER_SNAKE_CASE (`STORAGE_KEYS`, `DEFAULT_CODE`)
- Files: PascalCase for components, camelCase for hooks/utils
- CSS classes: Tailwind utility classes only (no custom CSS unless necessary)

### React Patterns
- Functional components only (no class components)
- Use `React.FC<Props>` for component typing
- Custom hooks for state logic (`useChat`, `useCodeEditor`, `useLocalStorage`)
- Context for global state (Toast, Theme)
- Memoize callbacks with `useCallback` when passed as props
- Memoize values with `useMemo` for expensive computations

### Error Handling
- Wrap localStorage operations in try/catch (see `src/utils/storage.ts`)
- Use `showToast()` for user-facing errors
- Use `console.error()` for developer-facing errors
- Format API errors with `formatApiError()` utility
- Never let errors crash the app - always have fallbacks

### TailwindCSS
- Use CSS variables for theming: `hsl(var(--primary))`, `hsl(var(--background))`
- Use `clsx()` for conditional classes
- Use `twMerge()` when combining dynamic + static classes
- Dark mode via `dark:` prefix (configured in tailwind.config)

### File Structure
```
src/
  components/   # React components (PascalCase files)
  hooks/        # Custom hooks (useXxx.ts)
  services/     # API integrations (ai.ts, deploy.ts)
  utils/        # Helper functions (storage.ts, analytics.ts)
  constants/    # Config values (app.ts, storage.ts, prompts.ts)
  types/        # TypeScript definitions (index.ts)
```

### Key Dependencies
- React 19.2, TypeScript 5.9, Vite (rolldown-vite)
- TailwindCSS 4.x, clsx, tailwind-merge
- Monaco Editor, Google Generative AI, OpenAI SDK
- GSAP, Three.js (landing page animations)
- lucide-react (icons)

### Analytics
- Google Analytics via `src/utils/analytics.ts`
- Track events: `analytics.track('event_name', { params })`
- All custom events defined in hooks/components

### Commit Messages
- Follow conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- Keep messages concise and descriptive
- Example: `feat: add Google Analytics tracking with custom events`

### Important Notes
- No React Router - navigation is state-based via `useAppNavigation` hook
- API keys stored in browser localStorage (no server-side proxy)
- Generated code is single HTML files only (no multi-file projects)
- Preview uses sandboxed iframe for security
- All AI prompts defined in `src/constants/prompts.ts`
- System prompt for AI in `src/services/ai/system-prompt.ts`

### Common Pitfalls
- Don't use `any` - TypeScript strict mode will catch this
- Don't forget to wrap localStorage in try/catch
- Don't mutate state directly - always use setters
- Don't forget `useCallback` dependencies for memoized functions
- Don't use inline styles - use Tailwind classes
- Don't add custom CSS unless absolutely necessary
- Don't forget to export new types from `src/types/index.ts`
