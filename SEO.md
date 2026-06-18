# SEO — AI Coder

## Overview

AI Coder generates SEO-ready HTML that can be submitted to Google Search Console. The system injects meta tags, Open Graph tags, and sitemap references into every generated site.

## How It Works

### User Configuration (Settings → SEO Tab)

Users fill in SEO metadata in the SettingsModal:

| Field | Purpose | Example |
|-------|---------|---------|
| Site Title | `<title>` tag, OG title | "My Portfolio" |
| Site Description | `<meta description>`, OG description | "A creative portfolio showcasing..." |
| Keywords | `<meta keywords>` | "portfolio, web dev, design" |
| Author | `<meta author>` | "John Doe" |
| Site URL | Canonical URL, sitemap | "https://example.com" |
| OG Image URL | Social sharing image | "https://example.com/og.png" |

### Settings Persistence

SEO settings are stored in `localStorage` under key `seo_settings` as JSON:

```json
{
  "siteTitle": "My Portfolio",
  "siteDescription": "Creative portfolio...",
  "siteKeywords": "portfolio, web dev",
  "author": "John Doe",
  "siteUrl": "https://example.com",
  "ogImage": "https://example.com/og.png"
}
```

### AI Prompt Injection

When the user sends a message:

1. `useChat` passes `seoSettings` to `generateCodeStream`
2. `ai.ts` calls `buildSeoContext(seoSettings)` which builds a context string
3. This context is appended to the prompt alongside search context
4. The AI system prompt contains detailed SEO instructions (1000+ lines of guidance)

### AI System Prompt (SEO Section)

The system prompt instructs the AI to generate:

1. **In `<head>`:**
   - `<meta charset="UTF-8">`
   - `<meta name="viewport">`
   - `<title>` (unique, under 60 chars)
   - `<meta name="description">` (150-160 chars)
   - `<meta name="keywords">`
   - `<meta name="author">`
   - `<link rel="canonical">`
   - Open Graph tags (`og:type`, `og:url`, `og:title`, `og:description`, `og:image`)
   - Twitter Card tags (`twitter:card`, `twitter:url`, `twitter:title`, `twitter:description`, `twitter:image`)
   - `<meta name="robots" content="index, follow">`

2. **Structured Data (JSON-LD):**
   - `<script type="application/ld+json">` with schema.org data

3. **In summary section:**
   - `sitemap.xml` content
   - `robots.txt` content

## SEO File Generation

When deployed, the server also serves:

### sitemap.xml (`/api/seo/{slug}/sitemap.xml`)

Default format:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://aicoderbygoutham.vercel.app/{slug}</loc>
    <lastmod>2026-06-18</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

If the AI generates a custom sitemap, it's stored and served instead.

### robots.txt (`/api/seo/{slug}/robots.txt`)

Default format:
```
User-agent: *
Allow: /
Sitemap: https://aicoderbygoutham.vercel.app/seo/{slug}/sitemap.xml
```

## Google Search Console Submission

Users can submit their deployed sites to Google Search Console:

1. Deploy site → get URL `https://aicoderbygoutham.vercel.app/{slug}`
2. Go to Google Search Console → Add Property
3. Enter the URL
4. Verify ownership (may need DNS TXT record — not available for subpath deploys)
5. Submit sitemap: `https://aicoderbygoutham.vercel.app/seo/{slug}/sitemap.xml`

**Note:** Since sites are on a shared domain, users may not be able to verify ownership directly. The SEO meta tags still help with indexing when the URL is shared on social media or linked from other sites.

## File References

| File | Purpose |
|------|---------|
| `src/types/index.ts:38-46` | `SeoSettings` interface |
| `src/constants/storage.ts:15` | `SEO_SETTINGS` localStorage key |
| `src/hooks/useApiSettings.ts` | SEO settings persistence + parsing |
| `src/components/SettingsModal.tsx` | SEO settings UI (tabbed) |
| `src/services/ai/system-prompt.ts` | SEO generation instructions (~100 lines) |
| `src/services/ai.ts:220-240` | `buildSeoContext()` function |
| `api/seo/[id]/sitemap.xml.ts` | Sitemap endpoint |
| `api/seo/[id]/robots.txt.ts` | Robots.txt endpoint |
