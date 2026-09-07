# Deployment — AI Coder

## Overview

AI Coder deploys to `aicoderbygoutham.vercel.app` with one click. Users generate HTML with AI, then deploy it to a shareable URL with no account or configuration required. Deployed sites are stored in **Supabase** (Postgres) and served by a single Vercel serverless function.

## Deployment Options

### 1. AI Coder Hosted (Primary — One-Click)
**URL:** `https://aicoderbygoutham.vercel.app/{slug}`

Click "Deploy to AI Coder" in the DeployModal → instant shareable URL.

- No account needed
- SEO meta tags embedded in HTML
- Shareable via link
- Persistent storage (Supabase), not in-memory

### 2. CodePen (Instant Preview)
**URL:** `https://codepen.io/pen/define?data=...`

Opens CodePen with the generated HTML pre-filled. Good for quick sharing.

### 3. GitHub Gist (Permanent)
**URL:** `https://gist.github.com/{user}/{id}`

Creates a public GitHub Gist with the HTML file. Requires a GitHub token.

### 4. Open in New Tab (Local)
**URL:** `blob:...`

Opens the HTML in a new browser tab. User can save manually.

## Serverless API

A single function lives in `api/site.ts`. Vercel auto-detects it alongside the Vite SPA.

### POST /api/site — Deploy or update a site

**Request:**
```json
{
  "html": "<!DOCTYPE html>...",
  "title": "My Site",
  "customSlug": "my-site",
  "oldSlug": "my-old-site"
}
```

- `customSlug` is optional (3-30 lowercase letters/numbers/hyphens, not reserved).
- `oldSlug` is required only to update/re-rename an existing slug.

**Response (200):**
```json
{
  "id": "my-site",
  "slug": "my-site",
  "url": "https://aicoderbygoutham.vercel.app/my-site",
  "ownerToken": "<opaque-owner-token>",
  "created_at": "2026-06-18T12:00:00.000Z"
}
```

**Errors:**
- `400` — HTML missing or >5MB, invalid slug
- `401` — Missing/invalid deployment ownership token
- `409` — Slug already taken
- `500` — Storage not configured or server error

### GET /api/site?id={slug} — Serve a deployed site

Returns the raw HTML with `Content-Type: text/html; charset=utf-8`.

**Headers:**
- `X-Robots-Tag: index, follow` — tells crawlers to index the page
- `Cache-Control: public, max-age=300, s-maxage=300` — 5-minute cache
- `Content-Security-Policy: sandbox allow-scripts allow-forms allow-popups allow-modals` — served HTML cannot touch the app's origin (which holds API keys in localStorage)
- `X-Site-Title` — optional sanitized site title

**Errors:**
- `400` — Missing `id`
- `404` — Site not found
- `500` — Storage not configured or server error

## Storage — Supabase

Deployed sites live in the `deployed_sites` table (columns: `slug`, `html`, `title`, `updated_at`). Deploys insert/update rows; GET fetches by `slug`.

**Required env vars (Vercel project settings):**
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_ANON_KEY` — Supabase anon key

**Required env var:**
- `DEPLOY_SECRET` — server-only secret used to sign deployment ownership tokens. Never expose it as a `VITE_*` variable.

**Client-side env vars (build time):**
- `VITE_TAVILY_API_KEY` — enables web search during generation
- `VITE_EMAILJS_SERVICE_ID` / `VITE_EMAILJS_TEMPLATE_ID` / `VITE_EMAILJS_PUBLIC_KEY` — override EmailJS contact/feedback config

## Local Development

`npm run dev` serves the frontend only. To test the deploy/view and AI APIs locally, run `npx vercel dev` (starts Vite plus the serverless functions). Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `DEPLOY_SECRET` in the server environment first.

Provider API keys remain user-entered settings, but generation now goes through `/api/ai` so provider SDKs and provider requests are not bundled into the browser application.

## Vercel Configuration

`vercel.json` handles:
- SPA routing: All non-API routes serve `dist/index.html`
- API rewrites: `/api/*` routes to serverless functions
- CORS headers: `Access-Control-Allow-Origin: *` on API routes

## Build

```bash
npm run build  # tsc -b && vite build → dist/
```

Vercel detects:
- `vercel.json` for config
- `api/` directory for serverless functions
- `dist/` for static SPA output
