import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes } from 'crypto';

// Single shared in-memory store (same process for both deploy + view)
// Cold start = data lost. For production: swap for Redis/Vercel KV.
const sitesStore = new Map<string, {
    html: string;
    title?: string;
    created_at: string;
}>();

function generateSlug(): string {
    return randomBytes(4).toString('base64url');
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

        const site = sitesStore.get(id);

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
            const { html, title } = req.body;

            if (!html || typeof html !== 'string') {
                return res.status(400).json({ error: 'HTML content is required' });
            }

            if (html.length > 5_000_000) {
                return res.status(400).json({ error: 'HTML too large (max 5MB)' });
            }

            let slug = generateSlug();
            while (sitesStore.has(slug)) {
                slug = generateSlug();
            }

            sitesStore.set(slug, {
                html,
                title: typeof title === 'string' ? title.slice(0, 200) : undefined,
                created_at: new Date().toISOString(),
            });

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
