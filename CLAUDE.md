# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

AI Coder — a single-page React app that generates complete, self-contained HTML sites from natural-language prompts (via Google Gemini or OpenRouter), previews them in a sandboxed iframe, and deploys them to shareable URLs backed by Supabase.

## Commands

```bash
npm run dev       # Vite dev server (http://localhost:5173)
npm run build     # Type check + production build (tsc -b && vite build)
npm run lint      # ESLint on all files
npm run preview   # Preview production build

npx tsc --noEmit src/path/to/file.tsx   # Type check single file
npx eslint src/path/to/file.tsx         # Lint single file
```

Before finishing any task, `npm run build && npm run lint` must pass. There is no test suite currently.

Note: `vite` is aliased to `rolldown-vite` via package.json overrides.

## Architecture

**Two runtime surfaces:**

1. **SPA (src/)** — React 19 + TypeScript strict + Tailwind 4. No React Router; navigation is state-based via `useAppNavigation` (views: landing/chat/settings). A URL path like `/{slug}` is a deployed site: `App.tsx` checks `isSiteRoute()` and renders `SiteViewer` instead of the app.

2. **Vercel serverless (api/site.ts)** — single handler for deploy + view. `POST /api/site` stores generated HTML in Supabase table `deployed_sites` (slug-keyed, supports custom slugs + update-in-place redeploys); `GET /api/site?id={slug}` serves it. Requires `SUPABASE_URL` / `SUPABASE_ANON_KEY` env vars on Vercel. (ARCHITECTURE.md describes an older in-memory Map design with separate api routes — the code is the source of truth.)

**Generation flow (the core path):**

```
ChatInterface → useChat.sendMessage()
  → services/ai.ts generateCodeStream()
      - shouldSearch()? → services/search.ts (Tavily) → search context
      - buildSeoContext(seoSettings) → SEO context
      - routes to Google AI SDK or OpenAI SDK (OpenRouter) by provider setting
      - streams chunks via onChunk → live editor/preview updates
      - AbortController threaded through for "stop generating"
  → response split on ---SUMMARY--- separator → { code, summary }
```

- System prompt (1100+ lines) lives in `src/services/ai/system-prompt.ts`; other prompts in `src/constants/prompts.ts`.
- API keys live in browser localStorage only (no server proxy); persisted via `useApiSettings` with keys from `src/constants/storage.ts`.
- Modifications to existing code go through DiffViewer (diff-match-patch) with apply/reject; fresh builds stream directly into the editor.
- Preview renders in a sandboxed iframe (`Preview.tsx`); generated output is always a single HTML file, no multi-file projects.
- File attachments (images/PDFs/text) processed in `services/fileProcessor.ts`; only Gemini gets multimodal parts.

**Layer rules (from AGENTS.md, enforced):**
- ALL external API calls in `src/services/` — never in components or hooks
- UI in components, logic in custom hooks, pure functions in `src/utils/`
- All types in `src/types/index.ts`; constants in `src/constants/` (never hardcode storage keys, model IDs, URLs)
- `src/components/landing/` is the marketing page (GSAP/Three.js heavy); app components live at `src/components/` root

## Code Standards (condensed from AGENTS.md — read it for the full set)

- **TypeScript strict:** no `any` (use `unknown` + narrowing), no `as` casts, no enums (union types), no `!` assertions, no `@ts-ignore`. Explicit return types on exported functions. Named exports only — no default exports.
- **React:** functional components only, max ~150 lines per component, no `React.FC`, no barrel files. Derive state during render — no `useEffect` for derived state or event handlers. `useMemo`/`useCallback` only when profiling shows a problem.
- **Errors:** never empty catch. User-facing errors via `showToast()`, formatted with `formatApiError()` (`src/utils/errors.ts`). Every localStorage access wrapped in try/catch (use `src/utils/storage.ts`).
- **Styling:** Tailwind utilities only — no inline styles, no new CSS files. `clsx` for conditional classes, `twMerge` for merging. No `&&` conditional rendering (renders `0`) — use ternary.
- **Philosophy:** YAGNI, minimum viable change, delete dead code, abstraction needs ≥3 call sites, no new dependencies without justification.
- **Responsive:** mobile-first, every feature must work 320px–desktop. Common patterns: `flex-col lg:flex-row` (editor+preview), `w-full lg:w-[400px]` (chat panel), `lg:hidden` (bottom nav).
- **Formatting:** 4-space indent, semicolons, single quotes (double for JSX attributes).
- **Commits:** conventional format (`feat:`/`fix:`/`refactor:`/...), one line, imperative, lowercase, no period.

## Security Constraints

- Preview/deployed-site iframes must keep `sandbox` attribute
- No `dangerouslySetInnerHTML` with untrusted content, no `eval`
- Never log API keys; keys stay client-side in localStorage
- Server caps deployed HTML size; slugs validated against reserved list in `api/site.ts`
