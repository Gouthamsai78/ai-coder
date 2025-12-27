import React, { useState, useRef, useEffect } from 'react';
import { X, Rocket, Github, Code2, Zap, ExternalLink, Copy, Check, Loader2, AlertCircle } from 'lucide-react';
import { createCodePenData, deployToGitHubGist, type DeployResult } from '../services/deploy';

interface DeployModalProps {
    code: string;
    githubToken: string;
    onClose: () => void;
    onOpenSettings: () => void;
}

type DeployStatus = 'idle' | 'loading' | 'success' | 'error';

const DeployModal: React.FC<DeployModalProps> = ({ code, githubToken, onClose, onOpenSettings }) => {
    const [deployStatus, setDeployStatus] = useState<DeployStatus>('idle');
    const [deployResult, setDeployResult] = useState<DeployResult | null>(null);
    const [copied, setCopied] = useState(false);
    const codePenFormRef = useRef<HTMLFormElement>(null);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    const handleCodePenDeploy = () => {
        codePenFormRef.current?.submit();
    };

    const handleStackBlitzDeploy = () => {
        // Create blob URL for the HTML and open in new tab
        const blob = new Blob([code], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        // Open in new tab (user can save/deploy from there)
        window.open(url, '_blank');
    };

    const handleGitHubDeploy = async () => {
        if (!githubToken) {
            setDeployStatus('error');
            setDeployResult({ success: false, error: 'No GitHub token configured. Please add your token in Settings.' });
            return;
        }

        setDeployStatus('loading');
        const result = await deployToGitHubGist(code, githubToken);

        if (result.success) {
            setDeployStatus('success');
            setDeployResult(result);
        } else {
            setDeployStatus('error');
            setDeployResult(result);
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
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg mx-4 bg-[hsl(var(--card))] rounded-2xl shadow-2xl border border-[hsl(var(--border))] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[hsl(var(--border))]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500">
                            <Rocket className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">Deploy Your App</h2>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">Share your creation with the world</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {deployStatus === 'idle' && (
                        <>
                            {/* CodePen - Instant, No Auth */}
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

                            {/* GitHub Gist - Permanent, Needs Token */}
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
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="h-12 w-12 text-[hsl(var(--primary))] animate-spin mb-4" />
                            <p className="text-[hsl(var(--muted-foreground))] font-medium">Deploying to GitHub...</p>
                        </div>
                    )}

                    {deployStatus === 'success' && deployResult && (
                        <div className="space-y-4">
                            <div className="flex flex-col items-center py-6">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 mb-4">
                                    <Check className="h-8 w-8 text-emerald-500" />
                                </div>
                                <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">Deployed Successfully!</h3>
                                <p className="text-sm text-[hsl(var(--muted-foreground))]">Your app is now live</p>
                            </div>

                            {/* Gist URL */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Gist URL</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={deployResult.url || ''}
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

                            {/* Preview URL */}
                            {deployResult.previewUrl && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Live Preview</label>
                                    <a
                                        href={deployResult.previewUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold hover:opacity-90 transition-opacity"
                                    >
                                        <Zap className="h-4 w-4" />
                                        View Live Site
                                    </a>
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
                        <div className="space-y-4">
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

                {/* Hidden Forms for CodePen */}
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
