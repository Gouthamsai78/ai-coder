# Architecture — AI Coder

## System Overview

AI Coder is a single-page React application that uses AI to generate complete, deployable HTML sites. Users describe what they want, the AI generates production-ready code with SEO metadata, and they can deploy it to a shareable URL instantly.

```
┌──────────────────────────────────────────────────────┐
│                    Browser (SPA)                      │
│                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │   Chat   │  │   Code   │  │  Preview │            │
│  │ Interface│  │  Editor  │  │  (iframe)│            │
│  └────┬─────┘  └────┬─────┘  └──────────┘            │
│       │              │                                 │
│  ┌────▼──────────────▼────────────────────────────┐  │
│  │              useChat hook                       │  │
│  │  (streaming, retry, message history)            │  │
│  └────────────────┬───────────────────────────────┘  │
│                   │                                   │
│  ┌────────────────▼───────────────────────────────┐  │
│  │           ai.ts service                        │  │
│  │  (Google AI / OpenRouter routing)               │  │
│  │  (SEO context injection)                       │  │
│  │  (web search context)                          │  │
│  └────────────────┬───────────────────────────────┘  │
│                   │                                   │
│  ┌────────────────▼───────────────────────────────┐  │
│  │          DeployModal                           │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐     │  │
│  │  │ AI Coder │  │ CodePen  │  │  GitHub  │     │  │
│  │  │ (1-click)│  │          │  │  Gist    │     │  │
│  │  └────┬─────┘  └──────────┘  └──────────┘     │  │
│  └───────┼─────────────────────────────────────────┘  │
└──────────┼───────────────────────────────────────────┘
           │ POST /api/deploy
           ▼
┌──────────────────────────────────────────────────────┐
│              Vercel Serverless Functions              │
│                                                       │
│  api/deploy.ts          POST  → stores HTML, returns │
│  api/view/[id].ts       GET   → serves HTML by slug  │
│  api/seo/[id]/sitemap.xml.ts  GET  → serves sitemap  │
│  api/seo/[id]/robots.txt.ts   GET  → serves robots   │
│                                                       │
│  Storage: In-memory Map (swap for Redis for prod)     │
└──────────────────────────────────────────────────────┘
```

## File Structure

```
ai-coder/
├── api/                          # Vercel serverless functions
│   ├── deploy.ts                 # POST — deploy site, returns slug
│   ├── view/
│   │   └── [id].ts              # GET — serve HTML by slug
│   └── seo/
│       └── [id]/
│           ├── sitemap.xml.ts    # GET — serve sitemap
│           └── robots.txt.ts     # GET — serve robots.txt
├── src/
│   ├── components/
│   │   ├── SiteViewer.tsx        # Renders deployed sites at /{slug}
│   │   ├── DeployModal.tsx       # One-click deploy + CodePen + GitHub
│   │   ├── SettingsModal.tsx     # API + SEO settings (tabbed)
│   │   ├── Preview.tsx           # Live preview iframe
│   │   ├── CodeEditor.tsx        # Monaco editor wrapper
│   │   ├── ChatInterface.tsx     # Chat message list + input
│   │   ├── LandingPage.tsx       # Marketing landing page
│   │   └── ...
│   ├── hooks/
│   │   ├── useChat.ts            # Chat state + AI generation
│   │   ├── useApiSettings.ts     # API + SEO settings persistence
│   │   ├── useCodeEditor.ts      # Code editor state
│   │   └── useAppNavigation.ts   # View routing (landing/chat/settings)
│   ├── services/
│   │   ├── ai.ts                 # AI provider routing + SEO injection
│   │   ├── ai/system-prompt.ts   # System prompt (1100+ lines)
│   │   ├── search.ts             # Tavily web search
│   │   └── deploy.ts             # CodePen + GitHub Gist deployment
│   ├── types/
│   │   └── index.ts              # All TypeScript interfaces
│   └── constants/
│       ├── storage.ts            # localStorage keys
│       └── models.ts             # AI model definitions
├── public/                       # Static assets
│   ├── sitemap.xml              # Main site sitemap
│   └── robots.txt               # Main site robots.txt
├── vercel.json                   # Vercel config + API rewrites
├── vite.config.ts                # Vite build config
└── tsconfig.json                 # TypeScript config
```

## Key Design Decisions

### 1. In-Memory Storage for Deployments
- **Decision:** Store deployed HTML in a `Map<string, Site>` on the serverless function
- **Trade-off:** Lost on cold start (each Vercel instance has its own memory)
- **Why:** Zero external dependencies, instant setup, no API keys needed
- **Production upgrade path:** Swap `Map` for Vercel KV or Upstash Redis (same interface)

### 2. Slug-Based Routing
- **Decision:** 8-character alphanumeric slugs (`/abc123xy`)
- **Pattern:** Vite serves the SPA for `/`, site viewer checks `isSiteRoute()` for `/{slug}`
- **Collision handling:** Check `Map.has()` before inserting, regenerate if needed

### 3. SEO Injection Architecture
- **Decision:** SEO settings stored in localStorage → injected into AI prompt context → AI generates meta tags in HTML
- **Flow:**
  1. User configures SEO in Settings → SEO tab
  2. `useApiSettings` persists to `localStorage['seo_settings']`
  3. `useChat` passes `seoSettings` to `generateCodeStream`
  4. `ai.ts` calls `buildSeoContext(seoSettings)` → appends to prompt
  5. AI system prompt instructs AI to generate `<meta>` tags, sitemap.xml, robots.txt
  6. Generated HTML contains all SEO elements
  7. When deployed, server stores the full HTML with SEO already embedded

### 4. One-Click Deploy Flow
- **Decision:** Client POSTs directly to `/api/deploy` → server stores in memory → returns URL
- **No auth required** for deployment
- **URL format:** `https://aicoderbygoutham.vercel.app/{slug}`

### 5. AI Provider Routing
- **Decision:** Support both Google AI (Gemini) and OpenRouter (Claude/GPT-4)
- **Routing:** `provider` field in settings determines which SDK to use
- **Both providers** receive the same system prompt + context injection

## Data Flow

### Generation Flow
```
User types prompt → useChat.sendMessage()
  → generateCodeStream(apiKey, model, messages, code, ...)
    → shouldSearch(prompt)? → searchWeb(prompt) → searchContext
    → buildSeoContext(seoSettings) → seoContext
    → fullContext = searchContext + seoContext
    → generateWithGoogleAI(..., fullContext)  OR  generateWithOpenRouter(..., fullContext)
    → streaming chunks → onChunk callback → setCode(accumulatedCode)
    → ---SUMMARY--- separator → extract summary
    → { code, summary } returned
```

### Deploy Flow
```
User clicks "Deploy to AI Coder"
  → handleOneClickDeploy()
    → POST /api/deploy { html, title }
    → server generates slug
    → stores in Map<slug, { html, title, ... }>
    → returns { slug, url: "https://aicoderbygoutham.vercel.app/{slug}" }
    → UI shows copy link + open in new tab
```

### View Flow
```
User visits https://aicoderbygoutham.vercel.app/abc123xy
  → isSiteRoute() returns true
  → render <SiteViewer />
    → getSiteId() extracts "abc123xy"
    → GET /api/view/abc123xy
    → server looks up slug in Map
    → returns HTML (or 404 page)
    → SiteViewer renders HTML in <iframe srcDoc={html} />
```

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19.2 |
| Build | Vite (rolldown-vite) | 7.2 |
| Language | TypeScript | 5.9 (strict) |
| Styling | TailwindCSS | 4.x |
| Editor | Monaco Editor | via @monaco-editor/react |
| AI SDKs | @google/generative-ai, openai | latest |
| Icons | lucide-react | latest |
| Deploy Target | Vercel Serverless | - |
| Runtime | Node.js (Vercel) | 20.x |

## Security Considerations

- API keys stored in browser `localStorage` (never sent to our server)
- Deployed HTML rendered in sandboxed `<iframe>` (allow-scripts, allow-same-origin)
- No user authentication required for deployment
- `Content-Security-Policy` not set (would break generated sites that use CDNs)
- Rate limiting: Not implemented (Vercel has built-in protection)
- Input validation: HTML size capped at 5MB on server
