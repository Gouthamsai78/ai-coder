# Deployment — AI Coder

## Overview

AI Coder deploys to `aicoderbygoutham.vercel.app` with one click. Users generate HTML with AI, then deploy it to a shareable URL with no account or configuration required.

## Deployment Options

### 1. AI Coder Hosted (Primary — One-Click)
**URL:** `https://aicoderbygoutham.vercel.app/{slug}`

Click "Deploy to AI Coder" in the DeployModal → instant shareable URL.

- No account needed
- SEO meta tags embedded in HTML
- Shareable via link
- Limited lifetime (in-memory storage)

### 2. CodePen (Instant Preview)
**URL:** `https://codepen.io/pen/define?data=...`

Opens CodePen with the generated HTML pre-filled. Good for quick sharing.

### 3. GitHub Gist (Permanent)
**URL:** `https://gist.github.com/{user}/{id}`

Creates a public GitHub Gist with the HTML file. Requires a GitHub token.

### 4. Open in New Tab (Local)
**URL:** `blob:http://localhost:5173/...`

Opens the HTML in a new browser tab. User can save manually.

## Serverless API Endpoints

All endpoints are in the `api/` directory at the project root. Vercel auto-detects them alongside the Vite SPA.

### POST /api/deploy

Stores generated HTML and returns a shareable URL.

**Request:**
```json
{
  "html": "<!DOCTYPE html>...",
  "title": "My Site",
  "description": "Optional description",
  "sitemap_xml": "<optional sitemap>",
  "robots_txt": "<optional robots.txt>"
}
```

**Response (200):**
```json
{
  "id": "abc123xy",
  "slug": "abc123xy",
  "url": "https://aicoderbygoutham.vercel.app/abc123xy",
  "created_at": "2026-06-18T12:00:00.000Z"
}
```

**Errors:**
- `400` — HTML missing or too large (>5MB)
- `405` — Wrong HTTP method
- `500` — Server error

### GET /api/view/{slug}

Returns the raw HTML for a deployed site.

**Response:** `Content-Type: text/html; charset=utf-8`

**Headers:**
- `X-Robots-Tag: index, follow` — tells crawlers to index the page
- `Cache-Control: public, max-age=300` — 5-minute cache

### GET /api/seo/{slug}/sitemap.xml

Returns sitemap.xml for the deployed site. Falls back to a generated default.

**Response:** `Content-Type: application/xml; charset=utf-8`

### GET /api/seo/{slug}/robots.txt

Returns robots.txt for the deployed site. Falls back to a generated default.

**Response:** `Content-Type: text/plain; charset=utf-8`

## Storage

Currently uses in-memory `Map<string, SiteData>` on the Vercel serverless function.

**Limitations:**
- Data is lost on cold start (each instance has its own memory)
- Data is lost when the function is redeployed
- Each Vercel instance has separate memory (requests may not find data stored by another instance)

**Production upgrade path:** Replace `Map` with:
- **Vercel KV** (Redis) — `@vercel/kv` package, same interface
- **Upstash Redis** — Serverless Redis, free tier available
- **Supabase** — PostgreSQL, free tier

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
