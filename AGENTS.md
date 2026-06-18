# AGENTS.md — AI Coder Development Guidelines

> **Engineering standard: Every rule in this document is mandatory. No exceptions.**
> Modeled after Google's eng-practices, Meta's React standards, and Apple/Microsoft code quality bar.

---

## 1. Engineering Philosophy

These principles constrain ALL decisions. Read them before writing any code.

- **Simplicity over complexity.** If a simple alternative exists, use it. Don't reach for abstractions, patterns, or libraries when plain code works.
- **YAGNI (You Aren't Gonna Need It).** Don't add code for hypothetical future needs. Build what is needed now, nothing more.
- **Delete aggressively.** Dead code, unused imports, commented-out blocks, unreachable paths — delete them. Dead code is worse than no code.
- **No premature optimization.** Write clean code first. Measure performance. Optimize only after profiling shows a bottleneck.
- **Minimum viable change.** Every change should be the smallest possible improvement. Don't refactor unrelated code.
- **One way to do things.** Don't introduce new patterns when an existing pattern already solves the problem.
- **Earn your abstraction.** Every wrapper, utility, HOC, or abstraction must justify its existence with at least 3 call sites. If you can't find 3, don't abstract.
- **If a simple alternative exists, use it.** Don't use a state management library when `useState` + context works. Don't use a form library when a simple controlled form works. Don't add a dependency for a feature that can be built in <20 lines. Don't use `useMemo`/`useCallback` when the computation is trivial. Don't create an abstraction layer when direct code is clearer. Don't add middleware/interceptors when a simple function call works.

---

## 2. Build/Lint/Test Commands

```bash
npm run dev       # Start dev server (Vite + HMR)
npm run build     # Type check + production build (tsc -b && vite build)
npm run lint      # Run ESLint on all files
npm run preview   # Preview production build locally
```

**Running a single file check:**
```bash
npx tsc --noEmit src/path/to/file.tsx    # Type check single file
npx eslint src/path/to/file.tsx          # Lint single file
```

**Before completing any task, run:**
```bash
npm run build && npm run lint
```
If either fails, fix the errors before finishing.

---

## 3. TypeScript Standards (Strict)

| Rule | Bad | Good |
|------|-----|------|
| No `any` | `function f(x: any)` | `function f(x: unknown)` then narrow with type guards |
| No type assertions | `const u = JSON.parse(x) as User` | Validate with Zod or runtime check, then infer |
| No `as` casts | `data as Result` | `data satisfies Result` or validate first |
| No enums | `enum Status { A, B }` | `type Status = 'a' \| 'b'` (tree-shakeable, zero runtime cost) |
| No `@ts-ignore` | `// @ts-ignore` | `// @ts-expect-error — reason, issue #N` |
| No `!` assertions | `user!.name` | `user?.name ?? 'default'` |
| No `object`/`{}` | `f(x: object)` | `f(x: Record<string, unknown>)` |
| Explicit return types | function auto-inferred | `function f(): string` on exported functions |
| Discriminated unions | Multiple optional fields | `{ type: 'a'; ... } \| { type: 'b'; ... }` |
| Named exports only | `export default Foo` | `export { Foo }` |

**Additional rules:**
- All types defined in `src/types/index.ts`, exported from there
- Use `verbatimModuleSyntax` — no default exports for types
- Interface/type names: PascalCase (`ApiSettings`, `ApiProvider`)
- Generic types: single letter (`T`, `K`, `V`)
- No `object` or `{}` as a type — be explicit about shape
- Prefer `type` over `interface` for union types
- No DTO duplication — single schema, inferred types

---

## 4. React Patterns (Meta-quality)

**Component rules:**
- Functional components only (no class components)
- Max 150 lines per component. Extract sub-components if larger
- Single responsibility: one component = one job. If it does multiple things, split it
- Use explicit prop types: `function Component({ prop }: Props)` — not `React.FC`
- Named exports only: `export { Component }` — no default exports
- No barrel files — import directly from source files

**State rules:**
- Derive state: compute from props/existing state during render. Don't store derived values in state
- Early returns: guard clauses at the top. Reduce nesting
- No `useEffect` for derived state — compute during render
- No `useEffect` for event handlers — use event handlers directly
- `useCallback`/`useMemo` only when profiling shows a re-render problem. Not by default

**Composition rules:**
- No inline function definitions in JSX for frequently-rendered components
- Extract complex logic into custom hooks
- Separate concerns: UI in components, logic in hooks, data in services
- Prefer `children` prop and composition over passing 5+ props
- No deep prop drilling (>2 levels) — use context or composition

---

## 5. Error Handling (Production-grade)

- **Never empty catch.** Every `catch` must either rethrow, log, or show to user
- **User-facing errors:** Always via `showToast()` — never raw error messages
- **Dev-facing errors:** `console.error()` with context (function name, input data)
- **API errors:** Always format with `formatApiError()` before displaying
- **localStorage:** Every access wrapped in try/catch (see `src/utils/storage.ts`)
- **Async operations:** Always have loading/error/success states
- **Fallbacks:** Every async call must have a fallback value or error boundary
- **Never let errors crash the app** — always have fallbacks

---

## 6. Anti-Patterns (Hard Rules — No Exceptions)

| Anti-Pattern | Why | Alternative |
|-------------|-----|-------------|
| String literals as keys | Typos, no autocomplete | Use constants from `src/constants/` |
| Hardcoded URLs | Unmaintainable | Environment variables or constants |
| Deep prop drilling (>2 levels) | Fragile, hard to refactor | Context or composition |
| `&&` for conditional rendering | Renders `0` or `""` unexpectedly | Ternary or early return |
| `useEffect` for derived state | Wasted render cycles | Compute during render |
| `useEffect` for event handlers | Race conditions, stale closures | Event handlers directly |
| Magic numbers | Unclear intent | Named constants |
| Inline styles | Untestable, no theme support | Tailwind classes |
| CSS files (unless necessary) | Maintainability | Tailwind utility classes only |
| Default imports from libraries | Tree-shaking broken | Named imports |
| Nested ternaries | Unreadable | If/else or early return |
| God components (>200 lines) | Unmaintainable | Extract sub-components |
| Premature abstraction | Wrong abstractions are worse | Duplicate first, abstract third time |
| `any` type | Erases all type safety | `unknown` + type guards |
| Non-null assertions | Runtime crashes | Optional chaining + nullish coalescing |
| Empty `catch` blocks | Silently swallows errors | Rethrow, log, or show to user |

---

## 7. File Organization

```
src/
  components/     # PascalCase, one component per file
  hooks/          # camelCase with `use` prefix
  services/       # ALL external API calls go here
  utils/          # Pure functions, no side effects
  constants/      # App config, storage keys, models
  types/          # All TypeScript definitions
```

**Rules:**
- One component per file, file named after component
- Max nesting: 2 levels deep in directories
- Types: All in `src/types/index.ts`, exported from there
- Utils: Pure functions with no side effects, no DOM access
- Services: ALL external API calls — never in components or hooks directly
- Constants: Use from `src/constants/`, never hardcode values

---

## 8. Imports

- Order: React → External libraries → Local imports (relative paths)
- Use named imports for React hooks: `import { useState, useEffect } from 'react'`
- Use `clsx` for conditional class names, `tailwind-merge` for merging Tailwind classes
- No barrel imports from components — import directly from files
- No unused imports — ESLint will catch this, but verify before committing

---

## 9. Formatting

- 4-space indentation (configured in editor)
- Semicolons required
- Single quotes for strings, double quotes for JSX attributes
- Trailing commas in multi-line objects/arrays
- Max line length: ~100 chars (ESLint default)

---

## 10. UI/UX — Intuitive Design

> **Core rule: If a human cannot understand the UI within 3 seconds without a video, demo, or tutorial, the design has failed.**

Every UI element must pass the **"3-Second Test"**: a first-time user should know what it does and how to use it within 3 seconds of seeing it.

### Nielsen's 10 Usability Heuristics — Enforced

| # | Heuristic | Rule |
|---|-----------|------|
| 1 | **Visibility of System Status** | Every async action must show feedback: loading spinner, progress bar, or status text. Never let the user wonder "did it work?" Chat must show "Generating..." during AI streaming. Deploy must show loading/success/error states. |
| 2 | **Match Between System and Real World** | Use language users understand: "Deploy" not "POST to /api/deploy". "Chat" not "MessageEndpoint". Icons must match their action (pencil = edit, trash = delete, gear = settings). No internal jargon in UI. |
| 3 | **User Control and Freedom** | Every destructive action must be reversible or confirmable. Undo must work. Deploy must show confirmation. Chat must allow retry. Never trap the user in a state with no exit. |
| 4 | **Consistency and Standards** | Follow platform conventions: back arrow = go back, X = close, gear = settings. Button styles must be consistent across all modals. Same action = same appearance everywhere. |
| 5 | **Error Prevention** | Prevent errors before they happen: disable buttons during loading, validate API key before sending, confirm before clearing chat. Don't just show error messages — prevent the error from occurring. |
| 6 | **Recognition Over Recall** | Make options visible. Show prompt suggestions in empty chat state. Show deploy options as cards, not in a dropdown. Show available models as a list, not a text input. Never make the user remember something from one screen to another. |
| 7 | **Flexibility and Efficiency** | Keyboard shortcuts for power users. Quick actions in header. Don't force multi-step flows when one step suffices. |
| 8 | **Aesthetic and Minimalist Design** | Every element must earn its place. No decorative elements that don't serve a purpose. No text that doesn't inform. Clean hierarchy: primary action > secondary > tertiary. |
| 9 | **Help Users Recover from Errors** | Error messages in plain language: "API key is invalid" not "Error 401". Always suggest a fix: "Check your API key in Settings". Never show raw error objects or stack traces to users. |
| 10 | **Help and Documentation** | If a feature isn't obvious, it needs a tooltip or hint. Settings modal should explain what each field does. No feature should require external documentation to use. |

### Intuitive Design Rules

- **No hidden functionality.** If it exists, it must be visible or reachable within 2 clicks
- **No mystery meat navigation.** Every clickable element must look clickable (hover states, cursor pointer, clear affordance)
- **No dead ends.** Every screen must have a clear next action or way to go back
- **Progressive disclosure.** Show essential options first, advanced options behind a toggle
- **Visual hierarchy.** Most important element is most prominent (size, color, position)
- **Affordance.** Buttons look like buttons, inputs look like inputs, links look like links
- **Feedback loops.** Every user action produces a visible result within 100ms

---

## 11. Responsive Design — Mobile & Desktop Friendly

> **Core rule: Every feature must work perfectly on both mobile (320px–768px) and desktop (1024px+). No exceptions.**

### Breakpoint Strategy

| Prefix | Width | Device | Layout Behavior |
|--------|-------|--------|-----------------|
| Default | 320px–639px | Phone portrait | Single column, bottom nav, stacked content |
| `sm:` | 640px+ | Phone landscape | Minor spacing adjustments, show text labels |
| `md:` | 768px+ | Tablet | Two-column where appropriate, larger touch targets |
| `lg:` | 1024px+ | Laptop/Desktop | Full 3-panel layout, all panels visible |
| `xl:` | 1280px+ | Desktop | Wider content areas, more whitespace |
| `2xl:` | 1536px+ | Large monitor | Max-width containers, no stretching |

### Mobile-First Rules

1. **Always design mobile-first.** Start with the smallest screen, add complexity with `min-width` media queries
2. **Touch targets minimum 44x44px.** Apple's HIG minimum. Use `min-h-[44px] min-w-[44px]` on all interactive elements
3. **Safe area insets.** Use `env(safe-area-inset-bottom)` for iPhone notch/home bar
4. **No horizontal scroll.** Content must never overflow the viewport. Test at 320px width
5. **Thumb-friendly zones.** Primary actions in the bottom 1/3 of the screen on mobile
6. **Bottom navigation on mobile.** Use the floating pill bar pattern for primary navigation
7. **Stack on mobile, side-by-side on desktop.** Grid layouts collapse to single column on mobile
8. **Font sizes.** Use `clamp()` for fluid typography or responsive classes like `text-sm md:text-base lg:text-lg`

### Desktop-Only Rules

1. **Don't waste desktop space.** Use extra width for side-by-side panels, not just bigger mobile layouts
2. **Hover states.** Desktop gets hover effects, mobile does not. Use `hover:` Tailwind prefix
3. **Keyboard shortcuts.** Desktop gets shortcuts, mobile does not
4. **No fixed-width containers that waste space.** Use `max-w-*` with `mx-auto` for content

### Responsive Patterns for This Codebase

| Pattern | Implementation |
|---------|---------------|
| Chat panel | `w-full lg:w-[400px]` — full width mobile, fixed sidebar desktop |
| Editor + Preview | `flex-col lg:flex-row` — stacked mobile, side-by-side desktop |
| Header buttons | `hidden sm:inline` — icon-only mobile, icon + text desktop |
| Bottom nav | `lg:hidden` — visible mobile only, hidden desktop |
| Modals | `inset-x-4 md:inset-auto md:right-6` — full-width mobile, positioned desktop |
| Typography | `text-3xl sm:text-5xl lg:text-7xl` — scales with viewport |
| Grids | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` — stacks mobile, multi-column desktop |

### Responsive Testing Checklist

- [ ] Test at 320px width (smallest phone)
- [ ] Test at 375px width (iPhone standard)
- [ ] Test at 768px width (tablet)
- [ ] Test at 1024px width (laptop)
- [ ] Test at 1440px width (desktop)
- [ ] All interactive elements reachable with thumb on mobile
- [ ] No horizontal scroll at any width
- [ ] Text readable without zooming on mobile
- [ ] Bottom nav doesn't overlap content
- [ ] Modals don't overflow viewport on mobile
- [ ] Touch targets are at least 44x44px

---

## 12. TailwindCSS

- Use CSS variables for theming: `hsl(var(--primary))`, `hsl(var(--background))`
- Use `clsx()` for conditional classes
- Use `twMerge()` when combining dynamic + static classes
- Dark mode via `dark:` prefix (configured in tailwind.config)
- No custom CSS unless absolutely necessary — Tailwind utility classes only
- No inline styles — use Tailwind classes
- Use `@media (prefers-reduced-motion: reduce)` to disable animations for accessibility

---

## 13. Accessibility (WCAG 2.2 AA)

- Semantic HTML: `<button>`, `<nav>`, `<main>`, `<section>`, `<article>`
- Keyboard navigation on all interactive elements
- Visible focus indicators (`focus-ring` class)
- Alt text on all images
- ARIA labels where semantic HTML isn't sufficient
- 24x24px minimum tap targets (24x24 WCAG, 44x44 Apple HIG preferred)
- `prefers-reduced-motion` respected — disable animations
- Color contrast: minimum 4.5:1 for normal text, 3:1 for large text
- No color as the only way to convey information

---

## 14. Performance

- Target: LCP < 2.5s, CLS < 0.1, INP < 200ms
- Lazy-load heavy components (Monaco, Three.js)
- Debounce user input handlers
- `loading="lazy"` on images
- No unnecessary re-renders — check React DevTools Profiler
- Animate only `transform` and `opacity` for 60fps
- Set `width`/`height` on images to prevent CLS
- Use `aspect-ratio` for media containers

---

## 15. Security

- No secrets in code — API keys only in localStorage
- Sanitize user-generated content before rendering
- iframe `sandbox` attribute always set (no `allow-same-origin`)
- No `dangerouslySetInnerHTML` with untrusted content
- No `eval()` or `Function()` constructor
- Never log sensitive data (API keys, tokens)
- Validate all user inputs before processing

---

## 16. Analytics

- Google Analytics via `src/utils/analytics.ts`
- Track events: `analytics.track('event_name', { params })`
- All custom events defined in hooks/components
- No PII (personally identifiable information) in analytics events

---

## 17. Testing Guidelines

**Setup (Vitest):**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**Test file naming:** `ComponentName.test.tsx` next to the component

**Rules:**
- Test utilities in `src/utils/` — pure functions, easy to test
- Test hooks with `@testing-library/react-hooks`
- Mock external services, never make real API calls
- Target: critical paths covered, not 100% coverage
- Run: `npx vitest` (dev) or `npx vitest run` (CI)

**What to test:**
- Utility functions (pure, deterministic)
- Custom hooks (state transitions)
- Component rendering (key states: loading, error, empty, populated)
- User interactions (click, submit, input)

**What NOT to test:**
- Implementation details (internal state, private methods)
- Third-party library behavior
- Trivial one-line functions
- Styling/CSS class names

---

## 18. Commit Messages

```
feat: add new feature
fix: resolve bug
refactor: improve code structure
docs: update documentation
chore: maintenance tasks
test: add or update tests
perf: performance improvement
```

- One line, imperative mood, lowercase
- No period at end
- Reference issue numbers when applicable
- Keep messages concise and descriptive

---

## 19. Code Quality Checklist

Before any change is complete, verify:

- [ ] Does this change improve overall code health?
- [ ] Is this the minimum viable change?
- [ ] Are all types explicit and correct?
- [ ] Are errors handled at every boundary?
- [ ] Is there any dead/unused code that should be deleted?
- [ ] Are there hardcoded values that should be constants?
- [ ] Does the component follow single responsibility?
- [ ] Are there any anti-patterns from Section 6?
- [ ] Does this follow existing patterns in the codebase?
- [ ] Would a new developer understand this code without comments?
- [ ] Does the UI pass the 3-Second Test (Section 10)?
- [ ] Does the feature work on both mobile and desktop (Section 11)?
- [ ] Does `npm run build && npm run lint` pass?

---

## 20. Project Architecture Notes

- No React Router — navigation is state-based via `useAppNavigation` hook
- API keys stored in browser localStorage (no server-side proxy)
- Generated code is single HTML files only (no multi-file projects)
- Preview uses sandboxed iframe for security
- All AI prompts defined in `src/constants/prompts.ts`
- System prompt for AI in `src/services/ai/system-prompt.ts`
- Vercel serverless for deployment (in-memory Map storage)

---

## 21. Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| React | 19.2 | UI framework |
| TypeScript | 5.9 | Type system |
| Vite (rolldown-vite) | 7.2.5 | Build tool |
| TailwindCSS | 4.x | Styling |
| clsx + tailwind-merge | latest | Class utilities |
| Monaco Editor | 0.55 | Code editor |
| Google Generative AI | 0.24 | Gemini AI SDK |
| OpenAI SDK | 6.9 | OpenRouter integration |
| Framer Motion | 12.4 | Animations |
| lucide-react | 0.554 | Icons |
| GSAP | 3.14 | Landing page animations |
| Three.js | 0.182 | 3D graphics (landing page) |
| diff-match-patch | 1.0 | Text diffing |
| pdfjs-dist | 5.4 | PDF parsing |

**Do not add new dependencies without justification.** Prefer built-in solutions and existing packages.

---

## 22. Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase | `ChatInterface`, `DeployModal` |
| Hooks | camelCase + `use` | `useChat`, `useCodeEditor` |
| Variables/Functions | camelCase | `sendMessage`, `isLoading` |
| Constants | UPPER_SNAKE_CASE | `STORAGE_KEYS`, `DEFAULT_CODE` |
| Component files | PascalCase | `ChatInterface.tsx` |
| Hook files | camelCase | `useChat.ts` |
| Utility files | camelCase | `storage.ts`, `analytics.ts` |
| Type files | camelCase | `types.ts` |
| CSS classes | Tailwind utilities | `bg-black`, `text-white`, `p-4` |
