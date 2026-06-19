import React, { useState, useRef, useEffect } from 'react';
import { X, Rocket, Github, Code2, Zap, ExternalLink, Copy, Check, Loader2, AlertCircle, Globe, RefreshCw, Pencil } from 'lucide-react';
import { createCodePenData, deployToGitHubGist, type DeployResult } from '../services/deploy';
import { analytics } from '../utils/analytics';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storage';

interface DeployModalProps {
    code: string;
    githubToken: string;
    onClose: () => void;
    onOpenSettings: () => void;
}

type DeployStatus = 'idle' | 'loading' | 'success' | 'error';

const DEPLOY_URL = 'https://aicoderbygoutham.vercel.app';

const DeployModal: React.FC<DeployModalProps> = ({ code, githubToken, onClose, onOpenSettings }) => {
    const [deployStatus, setDeployStatus] = useState<DeployStatus>('idle');
    const [deployResult, setDeployResult] = useState<DeployResult | null>(null);
    const [oneClickResult, setOneClickResult] = useState<{ slug: string; url: string } | null>(null);
    const [copied, setCopied] = useState(false);
    const [customSlug, setCustomSlug] = useState('');
    const [renameSlug, setRenameSlug] = useState('');
    const [showRename, setShowRename] = useState(false);
    const codePenFormRef = useRef<HTMLFormElement>(null);

    const existingSlug = storage.getString(STORAGE_KEYS.DEPLOYED_SLUG);
    const isUpdate = !!existingSlug;
    const existingUrl = existingSlug ? `${DEPLOY_URL}/${existingSlug}` : '';

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    const handleDeploy = async () => {
        analytics.track('deploy_clicked', { platform: 'ai_coder_hosted' });
        setDeployStatus('loading');

        try {
            const body: { html: string; title: string; customSlug?: string; oldSlug?: string } = {
                html: code,
                title: document.title,
            };

            if (isUpdate) {
                // Update mode: use existing slug or new renamed slug
                const newSlug = showRename && renameSlug.trim() ? renameSlug.trim().toLowerCase() : existingSlug;
                if (newSlug) {
                    body.customSlug = newSlug;
                }
                // Always send oldSlug in update mode to prove ownership
                body.oldSlug = existingSlug;
            } else {
                // First deploy: use custom slug if provided
                if (customSlug.trim()) {
                    body.customSlug = customSlug.trim().toLowerCase();
                }
            }

            const res = await fetch('/api/site', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Deployment failed');
            }

            const data = await res.json();
            setOneClickResult({ slug: data.slug, url: data.url });
            setDeployStatus('success');

            // Save deployed slug to localStorage
            storage.setString(STORAGE_KEYS.DEPLOYED_SLUG, data.slug);

            analytics.track('deploy_success', { platform: 'ai_coder_hosted' });
            analytics.track('site_deployed', { slug: data.slug, code_length: code.length });
        } catch (err) {
            setDeployStatus('error');
            setDeployResult({
                success: false,
                error: err instanceof Error ? err.message : 'Deployment failed',
            });
            analytics.track('deploy_failed', { platform: 'ai_coder_hosted' });
        }
    };

    const handleCodePenDeploy = () => {
        analytics.track('deploy_clicked', { platform: 'codepen' });
        codePenFormRef.current?.submit();
    };

    const handleStackBlitzDeploy = () => {
        analytics.track('deploy_clicked', { platform: 'new_tab' });
        const blob = new Blob([code], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    };

    const handleGitHubDeploy = async () => {
        if (!githubToken) {
            setDeployStatus('error');
            setDeployResult({ success: false, error: 'No GitHub token configured. Please add your token in Settings.' });
            return;
        }

        analytics.track('deploy_clicked', { platform: 'github_gist' });
        setDeployStatus('loading');
        const result = await deployToGitHubGist(code, githubToken);

        if (result.success) {
            setDeployStatus('success');
            setDeployResult(result);
            analytics.track('deploy_success', { platform: 'github_gist' });
        } else {
            setDeployStatus('error');
            setDeployResult(result);
            analytics.track('deploy_failed', { platform: 'github_gist', error: result.error });
        }
    };

    const handleCopyLink = async (url: string) => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const resetState = () => {
        setDeployStatus('idle');
        setDeployResult(null);
        setOneClickResult(null);
        setCustomSlug('');
        setRenameSlug('');
        setShowRename(false);
    };

    const handleForgetDeployment = () => {
        storage.remove(STORAGE_KEYS.DEPLOYED_SLUG);
        resetState();
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Deploy your app">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative w-full max-w-lg mx-4 bg-[hsl(var(--card))] rounded-2xl shadow-2xl border border-[hsl(var(--border))] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[hsl(var(--border))]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500">
                            <Rocket className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">
                                {isUpdate ? 'Update Your Site' : 'Deploy Your App'}
                            </h2>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                {isUpdate ? 'Push changes to your live URL' : 'Share your creation with the world'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors"
                        aria-label="Close deploy dialog"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {deployStatus === 'idle' && (
                        <>
                            {isUpdate ? (
                                <>
                                    {/* Current Live URL */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                                            Live URL
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                readOnly
                                                value={existingUrl}
                                                className="flex-1 px-3 py-2.5 rounded-lg bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--foreground))]"
                                            />
                                            <button
                                                onClick={() => handleCopyLink(existingUrl)}
                                                className="p-2.5 rounded-lg bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--accent))] transition-colors shrink-0"
                                            >
                                                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                            </button>
                                            <a
                                                href={existingUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2.5 rounded-lg bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--accent))] transition-colors shrink-0"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        </div>
                                    </div>

                                    {/* Rename Toggle */}
                                    {!showRename ? (
                                        <button
                                            onClick={() => setShowRename(true)}
                                            className="w-full flex items-center gap-2 p-3 rounded-lg text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))] transition-colors"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                            Rename URL
                                        </button>
                                    ) : (
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                                                New URL path
                                            </label>
                                            <div className="flex items-center gap-0 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] overflow-hidden focus-within:ring-1 focus-within:ring-emerald-500/50">
                                                <span className="pl-3 pr-1 text-xs text-[hsl(var(--muted-foreground))] shrink-0">aicoderbygoutham.vercel.app/</span>
                                                <input
                                                    type="text"
                                                    value={renameSlug}
                                                    onChange={(e) => setRenameSlug(e.target.value.replace(/[^a-z0-9-]/g, '').toLowerCase())}
                                                    placeholder={existingSlug}
                                                    maxLength={30}
                                                    className="flex-1 py-2.5 pr-3 bg-transparent text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground)/.4)] focus:outline-none min-w-0"
                                                />
                                            </div>
                                            {renameSlug && renameSlug.length < 3 && (
                                                <p className="text-[11px] text-amber-400">At least 3 characters</p>
                                            )}
                                            <button
                                                onClick={() => { setShowRename(false); setRenameSlug(''); }}
                                                className="text-[11px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                                            >
                                                Cancel rename
                                            </button>
                                        </div>
                                    )}

                                    {/* Update Button */}
                                    <button
                                        onClick={handleDeploy}
                                        disabled={showRename && renameSlug.length > 0 && renameSlug.length < 3}
                                        className="w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border border-emerald-500/30 hover:border-emerald-500/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 shrink-0">
                                            <RefreshCw className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <h3 className="font-semibold text-[hsl(var(--foreground))] group-hover:text-emerald-400 transition-colors">
                                                Update Site
                                            </h3>
                                            <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                                Push your latest changes live
                                            </p>
                                        </div>
                                        <ExternalLink className="h-4 w-4 text-[hsl(var(--muted-foreground))] group-hover:text-emerald-400" />
                                    </button>

                                    {/* Forget deployment */}
                                    <button
                                        onClick={handleForgetDeployment}
                                        className="w-full py-2 text-xs text-[hsl(var(--muted-foreground)/.6)] hover:text-[hsl(var(--muted-foreground))] transition-colors"
                                    >
                                        Deploy as a new site instead
                                    </button>
                                </>
                            ) : (
                                <>
                                    {/* Custom Slug Input — First deploy only */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                                            Custom URL path <span className="text-[hsl(var(--muted-foreground)/.6)]">(optional)</span>
                                        </label>
                                        <div className="flex items-center gap-0 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] overflow-hidden focus-within:ring-1 focus-within:ring-emerald-500/50">
                                            <span className="pl-3 pr-1 text-xs text-[hsl(var(--muted-foreground))] shrink-0">aicoderbygoutham.vercel.app/</span>
                                            <input
                                                type="text"
                                                value={customSlug}
                                                onChange={(e) => setCustomSlug(e.target.value.replace(/[^a-z0-9-]/g, '').toLowerCase())}
                                                placeholder="my-cool-app"
                                                maxLength={30}
                                                className="flex-1 py-2.5 pr-3 bg-transparent text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground)/.4)] focus:outline-none min-w-0"
                                            />
                                        </div>
                                        {customSlug && customSlug.length < 3 && (
                                            <p className="text-[11px] text-amber-400">At least 3 characters</p>
                                        )}
                                    </div>

                                    {/* AI Coder One-Click Deploy — PRIMARY */}
                                    <button
                                        onClick={handleDeploy}
                                        disabled={customSlug.length > 0 && customSlug.length < 3}
                                        className="w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border border-emerald-500/30 hover:border-emerald-500/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 shrink-0">
                                            <Globe className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <h3 className="font-semibold text-[hsl(var(--foreground))] group-hover:text-emerald-400 transition-colors">
                                                Deploy to AI Coder
                                            </h3>
                                            <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                                One-click • Free • SEO-ready • aicoderbygoutham.vercel.app
                                            </p>
                                        </div>
                                        <ExternalLink className="h-4 w-4 text-[hsl(var(--muted-foreground))] group-hover:text-emerald-400" />
                                    </button>
                                </>
                            )}

                            {/* CodePen — Instant */}
                            <button
                                onClick={handleCodePenDeploy}
                                className="w-full flex items-center gap-4 p-4 rounded-xl bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--accent))] border border-transparent hover:border-[hsl(var(--border))] transition-all group"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 shrink-0">
                                    <Code2 className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1 text-left">
                                    <h3 className="font-semibold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition-colors">
                                        Open in CodePen
                                    </h3>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                        Instant • No account needed • Edit & share
                                    </p>
                                </div>
                                <ExternalLink className="h-4 w-4 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))]" />
                            </button>

                            {/* GitHub Gist */}
                            <button
                                onClick={handleGitHubDeploy}
                                className="w-full flex items-center gap-4 p-4 rounded-xl bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--accent))] border border-transparent hover:border-[hsl(var(--border))] transition-all group"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gray-800 to-black shrink-0">
                                    <Github className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1 text-left">
                                    <h3 className="font-semibold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition-colors">
                                        Deploy to GitHub Gist
                                    </h3>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                        Permanent link • {githubToken ? 'Token configured ✓' : 'Requires GitHub token'}
                                    </p>
                                </div>
                                {githubToken ? (
                                    <ExternalLink className="h-4 w-4 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))]" />
                                ) : (
                                    <AlertCircle className="h-4 w-4 text-amber-500" />
                                )}
                            </button>

                            {/* Preview in New Tab */}
                            <button
                                onClick={handleStackBlitzDeploy}
                                className="w-full flex items-center gap-4 p-4 rounded-xl bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--accent))] border border-transparent hover:border-[hsl(var(--border))] transition-all group"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 shrink-0">
                                    <Zap className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1 text-left">
                                    <h3 className="font-semibold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition-colors">
                                        Open in New Tab
                                    </h3>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                        Preview live • Right-click to save as HTML
                                    </p>
                                </div>
                                <ExternalLink className="h-4 w-4 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))]" />
                            </button>
                        </>
                    )}

                    {deployStatus === 'loading' && (
                        <div className="flex flex-col items-center justify-center py-12" role="status" aria-live="polite">
                            <Loader2 className="h-12 w-12 text-[hsl(var(--primary))] animate-spin mb-4" />
                            <p className="text-[hsl(var(--muted-foreground))] font-medium">
                                {isUpdate ? 'Updating...' : 'Deploying...'}
                            </p>
                        </div>
                    )}

                    {deployStatus === 'success' && (
                        <div className="space-y-4">
                            <div className="flex flex-col items-center py-6">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 mb-4">
                                    <Check className="h-8 w-8 text-emerald-500" />
                                </div>
                                <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">
                                    {isUpdate ? 'Updated Successfully!' : 'Deployed Successfully!'}
                                </h3>
                                <p className="text-sm text-[hsl(var(--muted-foreground))]">Your app is now live</p>
                            </div>

                            {/* Live URL */}
                            {oneClickResult && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Live URL</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={oneClickResult.url}
                                            className="flex-1 px-3 py-2 rounded-lg bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--foreground))]"
                                        />
                                        <button
                                            onClick={() => handleCopyLink(oneClickResult.url)}
                                            className="p-2 rounded-lg bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--accent))] transition-colors"
                                        >
                                            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                        </button>
                                        <a
                                            href={oneClickResult.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 rounded-lg bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--accent))] transition-colors"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* GitHub Gist URL */}
                            {deployResult?.url && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Gist URL</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={deployResult.url}
                                            className="flex-1 px-3 py-2 rounded-lg bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--foreground))]"
                                        />
                                        <button
                                            onClick={() => handleCopyLink(deployResult.url || '')}
                                            className="p-2 rounded-lg bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--accent))] transition-colors"
                                        >
                                            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                        </button>
                                        <a
                                            href={deployResult.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 rounded-lg bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--accent))] transition-colors"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={resetState}
                                className="w-full py-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                            >
                                Deploy to Another Platform
                            </button>
                        </div>
                    )}

                    {deployStatus === 'error' && deployResult && (
                        <div className="space-y-4" role="alert" aria-live="assertive">
                            <div className="flex flex-col items-center py-6">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 mb-4">
                                    <AlertCircle className="h-8 w-8 text-red-500" />
                                </div>
                                <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">Deployment Failed</h3>
                                <p className="text-sm text-[hsl(var(--muted-foreground))] text-center mt-2">
                                    {deployResult.error}
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={resetState}
                                    className="flex-1 py-3 rounded-xl bg-[hsl(var(--secondary))] font-semibold hover:bg-[hsl(var(--accent))] transition-colors"
                                >
                                    Try Again
                                </button>
                                {!githubToken && (
                                    <button
                                        onClick={() => {
                                            onClose();
                                            onOpenSettings();
                                        }}
                                        className="flex-1 py-3 rounded-xl bg-[hsl(var(--primary))] text-white font-semibold hover:opacity-90 transition-opacity"
                                    >
                                        Open Settings
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Hidden CodePen form */}
                <form
                    ref={codePenFormRef}
                    action="https://codepen.io/pen/define"
                    method="POST"
                    target="_blank"
                    className="hidden"
                >
                    <input type="hidden" name="data" value={createCodePenData(code)} />
                </form>
            </div>
        </div>
    );
};

export default DeployModal;
