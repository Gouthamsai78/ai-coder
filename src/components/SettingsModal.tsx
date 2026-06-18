import React, { useState, useEffect, useRef } from 'react';
import { Settings, X, Check, Globe } from 'lucide-react';
import type { ApiProvider, SeoSettings } from '../types';
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
    seoSettings: SeoSettings;
    setSeoSettings: (seo: SeoSettings) => void;
    onClose: () => void;
}

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
    seoSettings,
    setSeoSettings,
    onClose
}) => {
    const [activeSection, setActiveSection] = useState<'general' | 'seo'>('general');
    const [customModelInput, setCustomModelInput] = useState('');
    const modalRef = useRef<HTMLDivElement>(null);

    const isCustomModel = selectedProvider === 'openrouter' && !AI_MODELS.openrouter.some(m => m.id === selectedModel);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        modalRef.current?.focus();
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    const handleProviderChange = (provider: ApiProvider) => {
        setSelectedProvider(provider);
        setSelectedModel(AI_MODELS[provider][0].id);
    };

    const updateSeo = (field: keyof SeoSettings, value: string) => {
        setSeoSettings({ ...seoSettings, [field]: value });
    };

    return (
        <>
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in"
                onClick={onClose}
            />

            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-label="Settings"
                tabIndex={-1}
                className="fixed inset-x-4 top-20 md:right-6 md:left-auto md:top-16 z-50 w-auto md:w-[380px] max-w-[380px] card p-0 shadow-2xl zoom-in overflow-hidden max-h-[85vh] outline-none"
                >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
                    <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-[hsl(var(--primary))]" />
                        <span className="text-sm font-medium">Settings</span>
                    </div>
                    <button onClick={onClose} className="btn-ghost p-1.5 -mr-1" aria-label="Close settings">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Section Tabs */}
                <div className="flex border-b border-[hsl(var(--border))]">
                    <button
                        onClick={() => setActiveSection('general')}
                        className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                            activeSection === 'general'
                                ? 'text-[hsl(var(--primary))] border-b-2 border-[hsl(var(--primary))]'
                                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                        }`}
                    >
                        General
                    </button>
                    <button
                        onClick={() => setActiveSection('seo')}
                        className={`flex-1 py-2.5 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                            activeSection === 'seo'
                                ? 'text-[hsl(var(--primary))] border-b-2 border-[hsl(var(--primary))]'
                                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                        }`}
                    >
                        <Globe className="h-3.5 w-3.5" />
                        SEO
                    </button>
                </div>

                <div className="p-4 space-y-5 overflow-y-auto max-h-[calc(85vh-100px)]">
                    {activeSection === 'general' && (
                        <>
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
                                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1" role="radiogroup" aria-label="AI Model">
                                    {AI_MODELS[selectedProvider].map((model) => (
                                        <button
                                            key={model.id}
                                            onClick={() => setSelectedModel(model.id)}
                                            role="radio"
                                            aria-checked={selectedModel === model.id}
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

                            {/* Custom Model Input (OpenRouter only) */}
                            {selectedProvider === 'openrouter' && (
                                <div className="space-y-2 pt-2 border-t border-[hsl(var(--border))]">
                                    <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                                        Or enter any OpenRouter model ID
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={customModelInput}
                                            onChange={(e) => setCustomModelInput(e.target.value)}
                                            placeholder="provider/model-name:free"
                                            className="input flex-1 px-3 py-2 text-sm"
                                        />
                                        <button
                                            onClick={() => {
                                                const trimmed = customModelInput.trim();
                                                if (trimmed) {
                                                    setSelectedModel(trimmed);
                                                    setCustomModelInput('');
                                                }
                                            }}
                                            disabled={!customModelInput.trim()}
                                            className="px-3 py-2 rounded-lg bg-[hsl(var(--primary)/.1)] border border-[hsl(var(--primary)/.3)] text-[hsl(var(--primary))] text-sm font-medium hover:bg-[hsl(var(--primary)/.2)] disabled:opacity-40 transition-all"
                                        >
                                            Use
                                        </button>
                                    </div>
                                    {isCustomModel && (
                                        <p className="text-[10px] text-[hsl(var(--primary))]">
                                            Using custom model: {selectedModel}
                                        </p>
                                    )}
                                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                                        Find models at <a href="https://openrouter.ai/models" target="_blank" rel="noreferrer" className="text-[hsl(var(--primary))] hover:underline">openrouter.ai/models</a>
                                    </p>
                                </div>
                            )}

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
                                        role="switch"
                                        aria-checked={webSearchEnabled}
                                        aria-label="Enable web search"
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

                            {/* GitHub Token */}
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
                        </>
                    )}

                    {activeSection === 'seo' && (
                        <>
                            <div className="rounded-lg bg-[hsl(var(--secondary))/50] p-3 border border-[hsl(var(--border))]">
                                <p className="text-[11px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                                    These settings are injected into the AI prompt. The AI will generate SEO-optimized meta tags, Open Graph tags, and a sitemap.xml in the HTML output.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                                    Site Title
                                </label>
                                <input
                                    type="text"
                                    value={seoSettings.siteTitle}
                                    onChange={(e) => updateSeo('siteTitle', e.target.value)}
                                    placeholder="My Awesome App"
                                    className="input w-full px-3 py-2.5 text-sm"
                                />
                                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                                    Used in &lt;title&gt; tag and Open Graph
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                                    Site Description
                                </label>
                                <textarea
                                    value={seoSettings.siteDescription}
                                    onChange={(e) => updateSeo('siteDescription', e.target.value)}
                                    placeholder="A brief description of your site for search engines"
                                    rows={2}
                                    className="input w-full px-3 py-2.5 text-sm resize-none"
                                />
                                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                                    Used in meta description tag (150-160 chars recommended)
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                                    Keywords
                                </label>
                                <input
                                    type="text"
                                    value={seoSettings.siteKeywords}
                                    onChange={(e) => updateSeo('siteKeywords', e.target.value)}
                                    placeholder="portfolio, web dev, javascript"
                                    className="input w-full px-3 py-2.5 text-sm"
                                />
                                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                                    Comma-separated keywords for meta tags
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                                    Author
                                </label>
                                <input
                                    type="text"
                                    value={seoSettings.author}
                                    onChange={(e) => updateSeo('author', e.target.value)}
                                    placeholder="Your Name"
                                    className="input w-full px-3 py-2.5 text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                                    Site URL
                                </label>
                                <input
                                    type="url"
                                    value={seoSettings.siteUrl}
                                    onChange={(e) => updateSeo('siteUrl', e.target.value)}
                                    placeholder="https://example.com"
                                    className="input w-full px-3 py-2.5 text-sm"
                                />
                                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                                    Used for canonical URL and sitemap
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                                    OG Image URL
                                </label>
                                <input
                                    type="url"
                                    value={seoSettings.ogImage}
                                    onChange={(e) => updateSeo('ogImage', e.target.value)}
                                    placeholder="https://example.com/og-image.png"
                                    className="input w-full px-3 py-2.5 text-sm"
                                />
                                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                                    Social sharing image (1200x630px recommended)
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default SettingsModal;
