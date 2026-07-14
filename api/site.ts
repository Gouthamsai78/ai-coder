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

const RESERVED_SLUGS = [
    'api', 'admin', 'settings', 'login', 'signup', 'deploy', 'static', 'assets',
    'robots.txt', 'sitemap.xml', 'favicon.ico', 'index.html',
];

function isValidCustomSlug(slug: string): boolean {
    // 3-30 chars, lowercase alphanumeric + hyphen, but not all-hyphen and no
    // leading/trailing hyphen.
    if (!/^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/.test(slug)) return false;
    return !RESERVED_SLUGS.includes(slug);
}

/** Sanitize a value destined for an HTTP header — strip CR/LF and control chars. */
function sanitizeHeaderValue(str: string): string {
    let out = '';
    for (const ch of str) {
        const code = ch.charCodeAt(0);
        // Drop C0 controls (incl. CR/LF/tab) and DEL.
        if (code < 0x20 || code === 0x7f) continue;
        out += ch;
    }
    return out.trim();
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
            // Sandbox the served HTML so direct navigation to this endpoint cannot
            // execute script in the app's own origin (localStorage holds API keys).
            res.setHeader('Content-Security-Policy', 'sandbox allow-scripts allow-forms allow-popups allow-modals;');

            if (site.title) {
                const safeTitle = sanitizeHeaderValue(escapeHtml(site.title));
                if (safeTitle) {
                    res.setHeader('X-Site-Title', safeTitle);
                }
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

        // Optional write protection: if DEPLOY_TOKEN is configured, require it.
        const deployToken = process.env.DEPLOY_TOKEN;
        if (deployToken) {
            const provided = req.headers['x-deploy-token'];
            if (provided !== deployToken) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
        }

        try {
            const body = (req.body && typeof req.body === 'object') ? req.body : {};
            const { html, title, customSlug, oldSlug } = body as {
                html?: unknown; title?: unknown; customSlug?: unknown; oldSlug?: unknown;
            };

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
                    // Slug exists — only allow if this is an update (oldSlug provided)
                    if (oldSlug && typeof oldSlug === 'string' && oldSlug === normalized) {
                        isUpdate = true;
                    } else if (oldSlug && typeof oldSlug === 'string' && oldSlug !== normalized) {
                        // Rename to a slug that already exists — block
                        return res.status(409).json({ error: 'This URL is already taken. Choose a different one.' });
                    } else {
                        // New deploy with existing slug — block
                        return res.status(409).json({ error: 'This URL is already taken. Choose a different one.' });
                    }
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
                if (error) {
                    // Postgres unique_violation — slug taken by a concurrent deploy.
                    if ((error as { code?: string }).code === '23505') {
                        return res.status(409).json({ error: 'This URL is already taken. Choose a different one.' });
                    }
                    throw error;
                }
            }

            // Rename: remove the old slug only AFTER the new row is safely written,
            // so a failure above never destroys the existing site.
            if (oldSlug && typeof oldSlug === 'string' && oldSlug !== slug) {
                const { error: delError } = await supabase
                    .from('deployed_sites')
                    .delete()
                    .eq('slug', oldSlug);
                if (delError) {
                    console.error('POST /api/site: failed to delete old slug', oldSlug, delError.message);
                }
            }

            const url = `https://aicoderbygoutham.vercel.app/${slug}`;

            return res.status(200).json({
                id: slug,
                slug,
                url,
                created_at: new Date().toISOString(),
            });
        } catch (err) {
            console.error('POST /api/site crash:', err);
            return res.status(500).json({
                error: 'Deployment failed. Please try again.',
            });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
