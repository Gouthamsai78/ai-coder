import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, AlertCircle, ExternalLink } from 'lucide-react';

function getSiteId(): string | null {
    const segments = window.location.pathname.split('/').filter(Boolean);
    return segments.length === 1 ? segments[0] : null;
}

function SiteViewerError({ message }: { message: string }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
            <div className="flex flex-col items-center gap-4 max-w-md text-center px-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-white">Site Not Found</h1>
                <p className="text-[hsl(var(--muted-foreground))]">{message}</p>
                <a
                    href="/"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--primary))] text-white font-medium hover:opacity-90 transition-opacity"
                >
                    <ExternalLink className="h-4 w-4" />
                    Go to AI Coder
                </a>
            </div>
        </div>
    );
}

function SiteViewerLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 text-[hsl(var(--primary))] animate-spin" />
                <p className="text-[hsl(var(--muted-foreground))]">Loading site...</p>
            </div>
        </div>
    );
}

function SiteViewer(): React.ReactNode {
    const siteId = useMemo(() => getSiteId(), []);
    const [html, setHtml] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!siteId) {
            return;
        }

        let cancelled = false;

        const fetchSite = async () => {
            try {
                const res = await fetch(`/api/site?id=${siteId}`);
                if (cancelled) return;

                if (!res.ok) {
                    setError(res.status === 404
                        ? 'Site not found. It may have expired or was never deployed.'
                        : 'Failed to load site'
                    );
                    setLoading(false);
                    return;
                }

                const htmlContent = await res.text();
                if (!cancelled) {
                    setHtml(htmlContent);
                    setLoading(false);
                }
            } catch {
                if (!cancelled) {
                    setError('Network error — could not load site');
                    setLoading(false);
                }
            }
        };

        fetchSite();

        return () => {
            cancelled = true;
        };
    }, [siteId]);

    if (!siteId) {
        return <SiteViewerError message="No site ID provided." />;
    }

    if (loading) {
        return <SiteViewerLoading />;
    }

    if (error || !html) {
        return <SiteViewerError message={error || 'This site does not exist.'} />;
    }

    return (
        <div className="min-h-screen bg-white">
            <iframe
                srcDoc={html}
                title="Deployed Site"
                className="w-full h-screen border-0"
                sandbox="allow-scripts allow-same-origin"
            />
        </div>
    );
}

export default SiteViewer;
