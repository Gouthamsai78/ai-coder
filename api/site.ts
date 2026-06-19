import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

// ─── Supabase Client ────────────────────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars');
}

const supabase = supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

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

        if (!supabase) {
            return res.status(500).json({ error: 'Storage not configured' });
        }

        const { data: site } = await supabase
            .from('deployed_sites')
            .select('html, title')
            .eq('slug', id)
            .single();

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
        if (!supabase) {
            return res.status(500).json({ error: 'Storage not configured' });
        }

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
                const { data: existing } = await supabase
                    .from('deployed_sites')
                    .select('slug')
                    .eq('slug', normalized)
                    .single();
                if (existing) {
                    return res.status(409).json({
                        error: 'This URL is already taken. Try another one.',
                    });
                }
                slug = normalized;
            } else {
                slug = generateSlug();
                let { data: existing } = await supabase
                    .from('deployed_sites')
                    .select('slug')
                    .eq('slug', slug)
                    .single();
                while (existing) {
                    slug = generateSlug();
                    const check = await supabase
                        .from('deployed_sites')
                        .select('slug')
                        .eq('slug', slug)
                        .single();
                    existing = check.data;
                }
            }

            const { error } = await supabase
                .from('deployed_sites')
                .insert({
                    slug,
                    html,
                    title: typeof title === 'string' ? title.slice(0, 200) : null,
                });

            if (error) {
                throw error;
            }

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
