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

        try {
            const { data: sites, error } = await supabase
                .from('deployed_sites')
                .select('html, title')
                .eq('slug', id)
                .limit(1);

            if (error) {
                console.error('Supabase GET error:', error.message, error.code, error.details);
                return res.status(500).json({ error: 'Failed to load site' });
            }

            const site = sites && sites.length > 0 ? sites[0] : null;

            if (!site || !site.html) {
                return res.status(404).json({ error: 'Site not found. It may have expired or was never deployed.' });
            }

            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
            res.setHeader('X-Robots-Tag', 'index, follow');

            if (site.title) {
                res.setHeader('X-Site-Title', escapeHtml(site.title));
            }

            return res.status(200).send(site.html);
        } catch (err) {
            console.error('GET /api/site crash:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
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
            let isUpdate = false;

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
                    .limit(1);
                if (existing && existing.length > 0) {
                    isUpdate = true;
                }
                slug = normalized;
            } else {
                slug = generateSlug();
                let { data: existing } = await supabase
                    .from('deployed_sites')
                    .select('slug')
                    .eq('slug', slug)
                    .limit(1);
                while (existing && existing.length > 0) {
                    slug = generateSlug();
                    const check = await supabase
                        .from('deployed_sites')
                        .select('slug')
                        .eq('slug', slug)
                        .limit(1);
                    existing = check.data;
                }
            }

            const siteData = {
                slug,
                html,
                title: typeof title === 'string' ? title.slice(0, 200) : null,
            };

            if (isUpdate) {
                const { error } = await supabase
                    .from('deployed_sites')
                    .update({ html: siteData.html, title: siteData.title, updated_at: new Date().toISOString() })
                    .eq('slug', slug);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('deployed_sites')
                    .insert(siteData);
                if (error) throw error;
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
