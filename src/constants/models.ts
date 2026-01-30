import type { ApiProvider, ModelOption } from '../types';

/**
 * Available AI models by provider
 * To add a new model: just add an entry here
 */
export const AI_MODELS: Record<ApiProvider, ModelOption[]> = {
    google: [
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
    aicoder: [
        {
            id: 'glm-4.6',
            name: '🔥 GLM-4.6',
            description: 'Best open-source multimodal, 200K ctx',
        },
        {
            id: 'qwen3-coder-plus',
            name: '🔥 Qwen3-Coder-Plus',
            description: '480B MoE - SOTA Agentic Coding',
        },
        {
            id: 'qwen3-max',
            name: '🔥 Qwen3-Max',
            description: 'Agent programming & tool calling',
        },
        {
            id: 'qwen3-max-preview',
            name: '🔥 Qwen3-Max-Preview',
            description: 'Enhanced tool call capabilities',
        },
        {
            id: 'qwen3-vl-plus',
            name: '🔥 Qwen3-VL-Plus',
            description: 'Best visual language model',
        },
        {
            id: 'kimi-k2',
            name: '🔥 Kimi-K2',
            description: '1T params, super code & agent',
        },
        {
            id: 'kimi-k2-0905',
            name: '🔥 Kimi-K2-0905',
            description: 'Trillion-param MoE, 256K context',
        },
        {
            id: 'iflow-rome-30ba3b',
            name: '🔥 iFlow-ROME',
            description: '30B MoE, 3B active - SWE-bench 57.4%',
        },
        {
            id: 'deepseek-r1',
            name: '🔥 DeepSeek-R1',
            description: 'RL reasoning - math, code, logic',
        },
        {
            id: 'deepseek-v3',
            name: '🔥 DeepSeek-V3',
            description: '671B params, GPT-4o level',
        },
        {
            id: 'deepseek-v3.2',
            name: '🔥 DeepSeek-V3.2',
            description: 'Sparse attention, long text optimized',
        },
        {
            id: 'qwen3-32b',
            name: 'Qwen3-32B',
            description: '32B matching DeepSeek-R1 671B',
        },
        {
            id: 'qwen3-235b',
            name: 'Qwen3-235B',
            description: 'MoE breakthrough model',
        },
        {
            id: 'qwen3-235b-a22b-instruct',
            name: 'Qwen3-235B Instruct',
            description: 'Best instruction following',
        },
        {
            id: 'qwen3-235b-a22b-thinking-2507',
            name: 'Qwen3-235B Thinking',
            description: 'SOTA reasoning & long context',
        },
    ],
};

export const DEFAULT_PROVIDER: ApiProvider = 'google';

export const getDefaultModel = (provider: ApiProvider): string =>
    AI_MODELS[provider][0].id;
