import React from 'react';
import { Settings, X, Check } from 'lucide-react';
import type { ApiProvider } from '../types';
import { AI_MODELS } from '../constants/models';
import { PromoCodeInput } from './PromoCodeInput';

interface SettingsModalProps {
    apiKey: string;
    setApiKey: (key: string) => void;
    selectedModel: string;
    setSelectedModel: (model: string) => void;
    selectedProvider: ApiProvider;
    setSelectedProvider: (provider: ApiProvider) => void;
    githubToken: string;
    setGithubToken: (token: string) => void;
    onClose: () => void;
    credits?: number; // For AI Coder provider
    isUsingPlatformKey?: boolean; // True when using VITE_IFLOW_API_KEY
}

// Export for backward compatibility with App.tsx (will be removed after App.tsx refactor)
// eslint-disable-next-line react-refresh/only-export-components
export const AVAILABLE_MODELS = AI_MODELS;

const SettingsModal: React.FC<SettingsModalProps> = ({
    apiKey,
    setApiKey,
    selectedModel,
    setSelectedModel,
    selectedProvider,
    setSelectedProvider,
    githubToken,
    setGithubToken,
    onClose,
    credits = 0,
    isUsingPlatformKey = false
}) => {
    const [showApiKey, setShowApiKey] = React.useState(false);
    const [showGithubToken, setShowGithubToken] = React.useState(false);

    // When provider changes, automatically set the first model for that provider
    // Also clear the API key when switching away from aicoder to prevent platform key exposure
    const handleProviderChange = (provider: ApiProvider) => {
        setSelectedProvider(provider);
        setSelectedModel(AI_MODELS[provider][0].id);

        // Clear API key when switching FROM aicoder to another provider
        // This prevents the internal platform API key from being shown
        if (selectedProvider === 'aicoder' && provider !== 'aicoder') {
            setApiKey('');
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-x-4 top-20 md:right-6 md:left-auto md:top-16 z-50 w-auto md:w-[360px] max-w-[360px] card p-0 shadow-2xl zoom-in overflow-hidden max-h-[80vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
                    <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-[hsl(var(--primary))]" />
                        <span className="text-sm font-medium">Settings</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="btn-ghost p-1.5 -mr-1"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-4 space-y-5 overflow-y-auto max-h-[calc(80vh-56px)]">
                    {/* Provider Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                            Choose Your AI Provider
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => handleProviderChange('aicoder')}
                                className={`relative px-2 py-2.5 rounded-lg border text-xs font-medium transition-all ${selectedProvider === 'aicoder'
                                    ? 'bg-gradient-to-br from-violet-500/10 to-pink-500/10 border-violet-400/50 text-violet-700'
                                    : 'bg-[hsl(var(--secondary))] border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                                    }`}
                            >
                                AI Coder
                                <span className="absolute -top-1 -right-1 text-[8px] px-1 py-0.5 bg-violet-100 text-violet-700 rounded-full font-medium">Free</span>
                            </button>
                            <button
                                onClick={() => handleProviderChange('google')}
                                className={`relative px-2 py-2.5 rounded-lg border text-xs font-medium transition-all ${selectedProvider === 'google'
                                    ? 'bg-[hsl(var(--primary)/.1)] border-[hsl(var(--primary)/.5)] text-[hsl(var(--primary))]'
                                    : 'bg-[hsl(var(--secondary))] border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                                    }`}
                            >
                                Google AI
                            </button>
                            <button
                                onClick={() => handleProviderChange('openrouter')}
                                className={`px-2 py-2.5 rounded-lg border text-xs font-medium transition-all ${selectedProvider === 'openrouter'
                                    ? 'bg-[hsl(var(--primary)/.1)] border-[hsl(var(--primary)/.5)] text-[hsl(var(--primary))]'
                                    : 'bg-[hsl(var(--secondary))] border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                                    }`}
                            >
                                OpenRouter
                            </button>
                        </div>
                    </div>

                    {/* AI Coder Credits Section - Only for aicoder provider */}
                    {selectedProvider === 'aicoder' && (
                        <div className="space-y-3">
                            <div className="p-3 rounded-lg bg-gradient-to-br from-violet-50 to-pink-50 border border-violet-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-violet-700">Free Credits</span>
                                    <span className={`text-lg font-bold ${credits > 0 ? 'text-violet-600' : 'text-red-500'}`}>
                                        {credits} remaining
                                    </span>
                                </div>
                                <p className="text-[11px] text-violet-600/80">
                                    Each code generation uses 1 credit. Credits reset daily (5/day).
                                </p>
                                {credits === 0 && (
                                    <div className="mt-2 pt-2 border-t border-violet-200">
                                        <p className="text-[11px] text-red-600 font-medium">
                                            Out of credits! Options:
                                        </p>
                                        <ul className="text-[11px] text-violet-600 mt-1 space-y-0.5">
                                            <li>• Wait for tomorrow's daily reset</li>
                                            <li>• Enter a promo code below</li>
                                            <li>• Use your own API key (Google AI or OpenRouter)</li>
                                        </ul>
                                        <a
                                            href="mailto:gouthamsai480@gmail.com?subject=AI%20Coder%20Credits%20Request"
                                            className="inline-flex items-center gap-1 mt-2 text-[11px] text-violet-700 font-medium hover:underline"
                                        >
                                            📧 Request more credits from developer
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Promo Code Input */}
                            <PromoCodeInput onSuccess={() => window.location.reload()} />
                        </div>
                    )}

                    {/* API Key - Only for google/openrouter providers */}
                    {selectedProvider !== 'aicoder' && !isUsingPlatformKey && (
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                                {selectedProvider === 'google' ? 'Google AI Studio API Key' : 'OpenRouter API Key'}
                            </label>
                            <div className="relative">
                                <input
                                    type={showApiKey ? 'text' : 'password'}
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder={selectedProvider === 'google' ? 'Paste your key here (AIza...)' : 'Paste your key here (sk-or-...)'}
                                    className="input w-full px-3 py-2.5 text-sm pr-16"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] px-2 py-1 rounded transition-colors"
                                >
                                    {showApiKey ? 'Hide' : 'Show'}
                                </button>
                            </div>
                            {apiKey && (
                                <div className="flex items-center gap-1.5 text-[11px] text-emerald-600">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Key added - you're ready to build!
                                </div>
                            )}
                            <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                                {selectedProvider === 'google' ? (
                                    <>Get your free key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[hsl(var(--primary))] hover:underline">Google AI Studio</a> (takes 30 seconds)</>
                                ) : (
                                    <>Get your key from <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-[hsl(var(--primary))] hover:underline">openrouter.ai</a></>
                                )}
                            </p>
                        </div>
                    )}

                    {/* Model Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                            AI Model
                        </label>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            {AI_MODELS[selectedProvider].map((model) => (
                                <button
                                    key={model.id}
                                    onClick={() => setSelectedModel(model.id)}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between group ${selectedModel === model.id
                                        ? 'bg-[hsl(var(--primary)/.1)] text-[hsl(var(--foreground))]'
                                        : 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                                        }`}
                                >
                                    <div>
                                        <span className="text-sm font-medium block">{model.name}</span>
                                        <span className="text-[10px] opacity-70">{model.description}</span>
                                    </div>
                                    {selectedModel === model.id && (
                                        <Check className="h-4 w-4 text-[hsl(var(--primary))] shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* GitHub Token for Deployment */}
                    <div className="space-y-2 pt-2 border-t border-[hsl(var(--border))]">
                        <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                            GitHub Token <span className="text-[10px] font-normal">(optional - for deploying)</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showGithubToken ? 'text' : 'password'}
                                value={githubToken}
                                onChange={(e) => setGithubToken(e.target.value)}
                                placeholder="ghp_..."
                                className="input w-full px-3 py-2.5 text-sm pr-16"
                            />
                            <button
                                type="button"
                                onClick={() => setShowGithubToken(!showGithubToken)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] px-2 py-1 rounded transition-colors"
                            >
                                {showGithubToken ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                            Skip for now. Create a <a href="https://github.com/settings/tokens/new?scopes=gist" target="_blank" rel="noreferrer" className="text-[hsl(var(--primary))] hover:underline">Personal Access Token</a> when you're ready to deploy.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SettingsModal;
