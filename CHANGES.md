# Changelog

## Session: Bug Fixes + One-Click Deploy + SEO

### Phase 1: Critical Bug Fixes

| File | Issue | Fix |
|------|-------|-----|
| `src/services/search.ts:8` | Hardcoded Tavily API key as fallback | Removed `|| 'tvly-dev-...'` fallback |
| `src/components/ui/animated-shader-hero.tsx` | 14 `any` types | Added class properties (`uResolution`, `uTime`, `uMove`, `uTouch`, `uPointerCount`, `uPointers`), fixed `interval` type |
| `src/services/deploy.ts` | Unused `_code` param in `createStackBlitzUrl` | Removed parameter |
| `src/types/index.ts` | Duplicate `DeployResult` interface | Removed (kept canonical one in `deploy.ts`) |
| `src/components/SettingsModal.tsx` | Unused `AVAILABLE_MODELS` export | Removed |
| `src/App.css` | Dead CSS file | Deleted |
| `src/components/Preview.tsx` | iframe re-render on every `safeSrcDoc.length` change | Ref-based key tracking + 5s blob URL revocation |
| `src/components/CodeEditor.tsx` | Duplicated `formatSize` function | Replaced with `formatFileSize` from `fileProcessor.ts` |
| `src/components/LandingPage.tsx` | 4 `react-hooks/refs` ESLint violations | Avoided destructuring `ref` from custom hooks |

### Phase 2: Architecture Simplification

**Removed Supabase entirely.** Replaced with in-memory `Map` storage on Vercel serverless functions.

- No external database dependency
- No API keys needed
- Zero-config deployment
- Upgrade path: swap `Map` for Vercel KV or Redis

### Phase 3: Vercel Serverless API

Created 4 API endpoints at project root `api/`:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `api/deploy.ts` | POST | Store HTML, return slug URL |
| `api/view/[id].ts` | GET | Serve HTML by slug |
| `api/seo/[id]/sitemap.xml.ts` | GET | Serve sitemap.xml |
| `api/seo/[id]/robots.txt.ts` | GET | Serve robots.txt |

Plus `vercel.json` with:
- SPA routing (dist/ for static, api/ for functions)
- CORS headers on API routes
- API rewrites

### Phase 4: Site Viewer

Created `src/components/SiteViewer.tsx`:
- Reads slug from URL path (`/{slug}`)
- Fetches HTML from `/api/view/{slug}`
- Renders in sandboxed `<iframe srcDoc={html}>`
- Loading state + error state + 404 page

Updated `src/App.tsx`:
- `isSiteRoute()` detects `/{slug}` patterns
- Renders `<SiteViewer>` for site routes, `<AppContent>` otherwise

### Phase 5: One-Click Deploy

Updated `src/components/DeployModal.tsx`:
- Added primary "Deploy to AI Coder" button (gradient, highlighted)
- Calls `POST /api/deploy` with the generated HTML
- Shows shareable URL with copy + open-in-new-tab buttons
- Existing CodePen and GitHub Gist options kept below

### Phase 6: SEO Settings

**Types** (`src/types/index.ts`):
- Added `SeoSettings` interface with 6 fields

**Storage** (`src/constants/storage.ts`):
- Added `SEO_SETTINGS` key

**Hook** (`src/hooks/useApiSettings.ts`):
- Added `seoSettings` state + `setSeoSettings` action
- JSON parsing with type-safe defaults

**Settings Modal** (`src/components/SettingsModal.tsx`):
- Added "SEO" tab with fields: Title, Description, Keywords, Author, URL, OG Image
- Helper text for each field
- Persisted to localStorage automatically

### Phase 7: AI System Prompt (SEO)

Updated `src/services/ai/system-prompt.ts`:
- Added `## 🔍 SEO & SEARCH ENGINE OPTIMIZATION` section (~100 lines)
- Instructions for required meta tags, OG tags, Twitter Card tags
- Sitemap.xml and robots.txt generation rules
- Structured data (JSON-LD) when possible

### Phase 8: SEO Context Injection

Updated `src/services/ai.ts`:
- Added `import { type SeoSettings }`
- Added `buildSeoContext(seo?)` function
- Updated `generateCodeStream` to accept `seoSettings` parameter
- Combines search context + SEO context into `fullContext`
- Passes `fullContext` to both Google AI and OpenRouter providers

Updated `src/hooks/useChat.ts`:
- Added `seoSettings` to `UseChatOptions` interface
- Passes `seoSettings` to `generateCodeStream`
- Added `seoSettings` to callback dependencies

Updated `src/App.tsx`:
- Passes `apiSettings.seoSettings` to `useChat`

### Phase 9: Documentation

Created 4 documentation files:
- `ARCHITECTURE.md` — System design, file structure, data flow
- `DEPLOYMENT.md` — Deployment options, API docs, storage
- `SEO.md` — SEO feature docs, AI prompt injection, Google Search Console
- `CHANGES.md` — This file

### Build Verification

- TypeScript: `npx tsc --noEmit` — **clean** (0 errors)
- ESLint (modified files): `npx eslint ... --max-warnings 0` — **clean** (0 errors)
- Pre-existing ESLint issues in `LandingPage.tsx` (ref access during render) — not introduced by this session

### Files Created
- `vercel.json`
- `api/deploy.ts`
- `api/view/[id].ts`
- `api/seo/[id]/sitemap.xml.ts`
- `api/seo/[id]/robots.txt.ts`
- `src/components/SiteViewer.tsx`
- `ARCHITECTURE.md`
- `DEPLOYMENT.md`
- `SEO.md`
- `CHANGES.md`

### Files Modified
- `src/App.tsx` — routing + SEO settings passthrough
- `src/components/DeployModal.tsx` — one-click deploy button
- `src/components/SettingsModal.tsx` — SEO settings tab
- `src/hooks/useApiSettings.ts` — SEO state management
- `src/hooks/useChat.ts` — SEO context passthrough
- `src/services/ai.ts` — SEO context injection
- `src/services/ai/system-prompt.ts` — SEO generation instructions
- `src/types/index.ts` — SeoSettings interface
- `src/constants/storage.ts` — SEO_SETTINGS key

### Files Deleted
- `src/App.css`
