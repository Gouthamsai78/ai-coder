import React from 'react';
import { Settings, X, Check } from 'lucide-react';
import type { ApiProvider } from '../types';
import { AI_MODELS } from '../constants/models';

interface SettingsModalProps {
    apiKey: string;
    setApiKey: (key: string) => void;
    selectedModel: string;
    setSelectedModel: (model: string) => void;
    selectedProvider: ApiProvider;
    setSelectedProvider: (provider: ApiProvider) => void;
    githubToken: string;
    setGithubToken: (token: string) => void;
    webSearchEnabled: boolean;
    setWebSearchEnabled: (enabled: boolean) => void;
    onClose: () => void;
}

// Export for backward compatibility with App.tsx (will be removed after App.tsx refactor)
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
    webSearchEnabled,
    setWebSearchEnabled,
    onClose
}) => {
    // When provider changes, automatically set the first model for that provider
    const handleProviderChange = (provider: ApiProvider) => {
        setSelectedProvider(provider);
        setSelectedModel(AI_MODELS[provider][0].id);
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
                            API Provider
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => handleProviderChange('google')}
                                className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${selectedProvider === 'google'
                                    ? 'bg-[hsl(var(--primary)/.1)] border-[hsl(var(--primary)/.5)] text-[hsl(var(--primary))]'
                                    : 'bg-[hsl(var(--secondary))] border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                                    }`}
                            >
                                Google AI
                            </button>
                            <button
                                onClick={() => handleProviderChange('openrouter')}
                                className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${selectedProvider === 'openrouter'
                                    ? 'bg-[hsl(var(--primary)/.1)] border-[hsl(var(--primary)/.5)] text-[hsl(var(--primary))]'
                                    : 'bg-[hsl(var(--secondary))] border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                                    }`}
                            >
                                OpenRouter
                            </button>
                        </div>
                    </div>

                    {/* API Key */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                            {selectedProvider === 'google' ? 'Google AI Studio API Key' : 'OpenRouter API Key'}
                        </label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={selectedProvider === 'google' ? 'AIza...' : 'sk-or-...'}
                            className="input w-full px-3 py-2.5 text-sm"
                        />
                        <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                            {selectedProvider === 'google' ? (
                                <>Get your key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[hsl(var(--primary))] hover:underline">Google AI Studio</a></>
                            ) : (
                                <>Get your key from <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-[hsl(var(--primary))] hover:underline">openrouter.ai</a></>
                            )}
                        </p>
                    </div>

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

                    {/* Web Search Toggle */}
                    <div className="space-y-2 pt-2 border-t border-[hsl(var(--border))]">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                                    🔍 Web Search
                                </label>
                                <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">
                                    Search the web for context before generating
                                </p>
                            </div>
                            <button
                                onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                                className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 ${webSearchEnabled
                                    ? 'bg-[hsl(var(--primary))]'
                                    : 'bg-[hsl(var(--secondary))]'
                                    }`}
                            >
                                <span
                                    className={`absolute top-[3px] w-4 h-4 rounded-full bg-white transition-transform duration-200 ${webSearchEnabled ? 'translate-x-[22px]' : 'translate-x-[3px]'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* GitHub Token for Deployment */}
                    <div className="space-y-2 pt-2 border-t border-[hsl(var(--border))]">
                        <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                            GitHub Token (for Deploy)
                        </label>
                        <input
                            type="password"
                            value={githubToken}
                            onChange={(e) => setGithubToken(e.target.value)}
                            placeholder="ghp_..."
                            className="input w-full px-3 py-2.5 text-sm"
                        />
                        <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                            Optional. Create a <a href="https://github.com/settings/tokens/new?scopes=gist" target="_blank" rel="noreferrer" className="text-[hsl(var(--primary))] hover:underline">Personal Access Token</a> with gist scope
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SettingsModal;
