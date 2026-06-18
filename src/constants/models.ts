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
            id: 'openrouter/free',
            name: 'Auto (Free)',
            description: 'Auto-selects best available free model',
        },
        {
            id: 'nvidia/nemotron-3-super-120b-a12b:free',
            name: 'Nemotron 3 Super',
            description: '1M context, fast & capable (Free)',
        },
        {
            id: 'google/gemma-4-31b-it:free',
            name: 'Gemma 4 31B',
            description: 'Google vision model (Free)',
        },
        {
            id: 'qwen/qwen3-coder:free',
            name: 'Qwen3 Coder',
            description: '1M context, code-focused (Free)',
        },
        {
            id: 'meta-llama/llama-3.3-70b-instruct:free',
            name: 'Llama 3.3 70B',
            description: 'Meta open model (Free)',
        },
        {
            id: 'openai/gpt-oss-120b:free',
            name: 'GPT-OSS 120B',
            description: 'OpenAI open model (Free)',
        },
    ],
};

export const DEFAULT_PROVIDER: ApiProvider = 'google';

export const getDefaultModel = (provider: ApiProvider): string =>
    AI_MODELS[provider][0].id;
