import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes } from 'crypto';

// ─── Storage Layer ───────────────────────────────────────────────
// Uses Vercel KV (Upstash Redis) when env vars are set, otherwise
// falls back to in-memory Map (data lost on cold start).

interface SiteData {
    html: string;
    title?: string;
    created_at: string;
}

const KV_PREFIX = 'site:';
const SITES_INDEX_KEY = 'sites:index';

function isKvConfigured(): boolean {
    return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function kvGet(slug: string): Promise<SiteData | null> {
    const { kv } = await import('@vercel/kv');
    const raw = await kv.get<string>(`${KV_PREFIX}${slug}`);
    return raw ? (JSON.parse(raw) as SiteData) : null;
}

async function kvSet(slug: string, data: SiteData): Promise<void> {
    const { kv } = await import('@vercel/kv');
    await kv.set(`${KV_PREFIX}${slug}`, JSON.stringify(data));
    // Add to index for collision checks
    const index = (await kv.get<string[]>(SITES_INDEX_KEY)) || [];
    if (!index.includes(slug)) {
        index.push(slug);
        await kv.set(SITES_INDEX_KEY, index);
    }
}

async function kvHas(slug: string): Promise<boolean> {
    const { kv } = await import('@vercel/kv');
    const index = (await kv.get<string[]>(SITES_INDEX_KEY)) || [];
    return index.includes(slug);
}

// In-memory fallback
const memStore = new Map<string, SiteData>();
const memIndex = new Set<string>();

async function storeGet(slug: string): Promise<SiteData | null> {
    if (isKvConfigured()) return kvGet(slug);
    return memStore.get(slug) || null;
}

async function storeHas(slug: string): Promise<boolean> {
    if (isKvConfigured()) return kvHas(slug);
    return memIndex.has(slug);
}

async function storeSet(slug: string, data: SiteData): Promise<void> {
    if (isKvConfigured()) {
        await kvSet(slug, data);
    } else {
        memStore.set(slug, data);
        memIndex.add(slug);
    }
}

// ─── Helpers ─────────────────────────────────────────────────────

function generateSlug(): string {
    return randomBytes(4).toString('base64url');
}

const RESERVED_SLUGS = ['api', 'admin', 'settings', 'login', 'signup', 'deploy', 'static', 'assets'];

function isValidCustomSlug(slug: string): boolean {
    return /^[a-z0-9-]{3,30}$/.test(slug) && !RESERVED_SLUGS.includes(slug);
}

function escapeHtml(str: string): string {
    return str.replace(/[&<>"']/g, (char) => {
        const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return map[char];
    });
}

function setSecurityHeaders(res: VercelResponse) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
}

// ─── Handler ─────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setSecurityHeaders(res);

    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    // GET /api/site?id=xxx → serve deployed HTML
    if (req.method === 'GET') {
        const { id } = req.query;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: 'Site ID required' });
        }

        const site = await storeGet(id);

        if (!site) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.status(404).send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Site Not Found - AI Coder</title>
    <style>
        body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0a0a0a; color: #fff; font-family: system-ui, sans-serif; }
        .container { text-align: center; padding: 2rem; }
        h1 { font-size: 4rem; margin: 0; background: linear-gradient(135deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        p { color: #888; margin: 1rem 0 2rem; }
        a { color: #3b82f6; text-decoration: none; padding: 0.75rem 1.5rem; border: 1px solid #3b82f6; border-radius: 8px; transition: all 0.2s; }
        a:hover { background: #3b82f6; color: #fff; }
    </style>
</head>
<body>
    <div class="container">
        <h1>404</h1>
        <p>This site has expired or was never deployed.</p>
        <a href="/">Go to AI Coder</a>
    </div>
</body>
</html>`);
        }

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
        res.setHeader('X-Robots-Tag', 'index, follow');

        if (site.title) {
            res.setHeader('X-Site-Title', escapeHtml(site.title));
        }

        return res.status(200).send(site.html);
    }

    // POST /api/site → deploy HTML
    if (req.method === 'POST') {
        try {
            const { html, title, customSlug } = req.body;

            if (!html || typeof html !== 'string') {
                return res.status(400).json({ error: 'HTML content is required' });
            }

            if (html.length > 5_000_000) {
                return res.status(400).json({ error: 'HTML too large (max 5MB)' });
            }

            let slug: string;

            if (customSlug && typeof customSlug === 'string') {
                const normalized = customSlug.toLowerCase().trim();
                if (!isValidCustomSlug(normalized)) {
                    return res.status(400).json({
                        error: 'Invalid slug. Use 3-30 lowercase letters, numbers, or hyphens.',
                    });
                }
                if (await storeHas(normalized)) {
                    return res.status(409).json({
                        error: 'This URL is already taken. Try another one.',
                    });
                }
                slug = normalized;
            } else {
                slug = generateSlug();
                while (await storeHas(slug)) {
                    slug = generateSlug();
                }
            }

            const siteData: SiteData = {
                html,
                title: typeof title === 'string' ? title.slice(0, 200) : undefined,
                created_at: new Date().toISOString(),
            };
            await storeSet(slug, siteData);

            const url = `https://aicoderbygoutham.vercel.app/${slug}`;

            return res.status(200).json({
                id: slug,
                slug,
                url,
                created_at: new Date().toISOString(),
            });
        } catch {
            return res.status(500).json({
                error: 'Deployment failed. Please try again.',
            });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
