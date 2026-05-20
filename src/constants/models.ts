import type { ApiProvider, ModelOption } from '../types';

/**
 * Available AI models by provider
 * To add a new model: just add an entry here
 */
export const AI_MODELS: Record<ApiProvider, ModelOption[]> = {
    google: [
        {
            id: 'gemini-3.5-flash',
            name: 'Gemini 3.5 Flash',
            description: 'Latest ultra-fast Gemini 3.5 model',
        },
        {
            id: 'gemini-3-flash-preview',
            name: 'Gemini 3 Flash Preview',
            description: 'Latest Gemini 3 model (Free)',
        },
        {
            id: 'gemini-2.0-flash',
            name: 'Gemini 2.0 Flash',
            description: 'Fast and capable (Free)',
        },
        {
            id: 'gemini-1.5-pro',
            name: 'Gemini 1.5 Pro',
            description: 'Most capable Google model',
        },
    ],
    openrouter: [
        {
            id: 'google/gemini-2.0-flash-exp:free',
            name: 'Gemini 2.0 Flash',
            description: 'Free tier available',
        },
        {
            id: 'anthropic/claude-3.5-sonnet',
            name: 'Claude 3.5 Sonnet',
            description: 'Best for complex reasoning',
        },
        {
            id: 'anthropic/claude-3-sonnet',
            name: 'Claude 3 Sonnet',
            description: 'Balanced performance',
        },
        {
            id: 'openai/gpt-4o',
            name: 'GPT-4o',
            description: 'Most capable (Expensive)',
        },
    ],
};

export const DEFAULT_PROVIDER: ApiProvider = 'google';

export const getDefaultModel = (provider: ApiProvider): string =>
    AI_MODELS[provider][0].id;
