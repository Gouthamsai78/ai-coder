/**
 * AI Code Generation Service
 * 
 * Handles code generation using multiple AI providers:
 * - Google Generative AI (Gemini models)
 * - OpenRouter (Claude, GPT-4, etc.)
 * 
 * Features:
 * - Streaming responses for real-time UI updates
 * - File attachment support (images, PDFs, text)
 * - Automatic response processing and summary extraction
 */

import type { ApiProvider, FileAttachment, SeoSettings } from '../types';
import { GOOGLE_FALLBACK_MODEL } from '../constants/models';
import { shouldSearch, searchWeb } from './search';

// ============================================
// Provider Implementations
// ============================================

const streamFromServer = async (
    apiKey: string,
    model: string,
    provider: ApiProvider,
    messages: { role: 'user' | 'assistant'; content: string }[],
    currentCode: string,
    onChunk: (chunk: string) => void,
    attachments?: FileAttachment[],
    searchContext?: string,
    signal?: AbortSignal
): Promise<{ code: string; summary: string }> => {
    const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, model, provider, messages, currentCode, attachments, searchContext }),
        signal,
    });

    if (!response.ok) {
        const data: unknown = await response.json().catch(() => null);
        const message = typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string'
            ? data.error
            : `AI request failed (${response.status})`;
        throw new Error(message);
    }

    if (!response.body) throw new Error('AI response stream was unavailable');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';

    const consumeEvent = (line: string): void => {
        if (!line.startsWith('data: ')) return;
        const parsed: unknown = JSON.parse(line.slice(6));
        if (typeof parsed !== 'object' || parsed === null || !('type' in parsed)) return;
        const event = parsed as { type?: unknown; text?: unknown; message?: unknown };
        if (event.type === 'chunk' && typeof event.text === 'string') {
            fullContent += event.text;
            onChunk(event.text);
        } else if (event.type === 'error' && typeof event.message === 'string') {
            throw new Error(event.message);
        }
    };

    while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) consumeEvent(line.trimEnd());
        if (done) break;
    }
    if (buffer.trim()) consumeEvent(buffer.trim());
    return processResponse(fullContent, currentCode);
};

/**
 * Generate code using Google Generative AI (Gemini)
 * Supports multimodal inputs (text, images, PDFs)
 */
const generateWithGoogleAI = async (
    apiKey: string,
    model: string,
    messages: { role: 'user' | 'assistant'; content: string }[],
    currentCode: string,
    onChunk: (chunk: string) => void,
    attachments?: FileAttachment[],
    searchContext?: string,
    signal?: AbortSignal
): Promise<{ code: string; summary: string }> => {
    return streamFromServer(apiKey, model, 'google', messages, currentCode, onChunk, attachments, searchContext, signal);
};

/**
 * Generate code using OpenRouter API
 * Provides access to multiple AI models (Claude, GPT-4, Llama, etc.)
 */
const generateWithOpenRouter = async (
    apiKey: string,
    model: string,
    messages: { role: 'user' | 'assistant'; content: string }[],
    currentCode: string,
    onChunk: (chunk: string) => void,
    attachments?: FileAttachment[],
    searchContext?: string,
    signal?: AbortSignal
): Promise<{ code: string; summary: string }> => {
    return streamFromServer(apiKey, model, 'openrouter', messages, currentCode, onChunk, attachments, searchContext, signal);
};

// ============================================
// Response Processing
// ============================================

/**
 * Strip a single leading ```html / ``` fence and trailing ``` if the model
 * wrapped its whole answer in a markdown code block. Inner backticks (legit
 * content like <pre> samples) are preserved.
 */
const stripOuterCodeFence = (content: string): string => {
    let out = content.trim();
    const fenceStart = /^```(?:html)?\s*\n?/i;
    if (fenceStart.test(out)) {
        out = out.replace(fenceStart, '');
        out = out.replace(/\n?```\s*$/, '');
        return out.trim();
    }

    // Intro/outro text around a single fenced block (e.g.
    // "Here is the file:\n```html\n...\n```"). Only handled when there are
    // EXACTLY two bare fence lines, so legit code containing backticks or
    // <pre> samples is never touched.
    const lines = out.split('\n');
    const fenceIdx: number[] = [];
    for (let i = 0; i < lines.length; i++) {
        if (/^```(?:html)?\s*$/i.test(lines[i].trim())) {
            fenceIdx.push(i);
        }
    }
    if (fenceIdx.length === 2) {
        return lines.slice(fenceIdx[0] + 1, fenceIdx[1]).join('\n').trim();
    }

    return out;
};

/**
 * Apply MODE 2 SEARCH/REPLACE blocks against the current code.
 * Format per system prompt:
 *   <<<<<<< SEARCH
 *   [exact code]
 *   =======
 *   [replacement]
 *   >>>>>>> REPLACE
 * Matching is whitespace-tolerant: exact match first, then a line-by-line
 * match ignoring trailing spaces/tabs per line. Throws a friendly error if a
 * SEARCH block still does not match.
 */
const applySearchReplace = (currentCode: string, blocksText: string): string => {
    // Capture the trailing newline of each block so the replacement lands on
    // line boundaries (prevents doubled/merged newlines).
    const blockRegex = /<{5,}\s*SEARCH\s*\n([\s\S]*?\n)={5,}\s*\n([\s\S]*?\n)>{5,}\s*REPLACE/g;
    let updated = currentCode;
    let match: RegExpExecArray | null;
    let applied = 0;

    while ((match = blockRegex.exec(blocksText)) !== null) {
        const search = match[1];
        const replace = match[2];

        updated = replaceFirstMatch(updated, search, replace);
        applied++;
    }

    if (applied === 0) {
        throw new Error('No valid SEARCH/REPLACE blocks found in AI response.');
    }

    return updated;
};

/**
 * Replace the first occurrence of `search` in `haystack` with `replace`,
 * falling back to a whitespace-tolerant line-by-line match (ignoring trailing
 * spaces/tabs on each line) when the exact substring is not found.
 */
const replaceFirstMatch = (haystack: string, search: string, replace: string): string => {
    // 1. Exact substring match — the common case.
    if (haystack.includes(search)) {
        return haystack.replace(search, () => replace);
    }

    // 2. Tolerant match: compare per line, ignoring trailing spaces/tabs.
    const hLines = haystack.split('\n');
    const sLines = search.split('\n');
    const clean = (line: string) => line.replace(/[ \t]+$/, '');

    for (let i = 0; i + sLines.length <= hLines.length; i++) {
        let matched = true;
        for (let j = 0; j < sLines.length; j++) {
            if (clean(hLines[i + j]) !== clean(sLines[j])) {
                matched = false;
                break;
            }
        }
        if (matched) {
            return [
                ...hLines.slice(0, i),
                ...replace.split('\n'),
                ...hLines.slice(i + sLines.length),
            ].join('\n');
        }
    }

    throw new Error(
        'SEARCH block did not match current code — the AI edit could not be applied. Try rephrasing your request or regenerate as a full rewrite.'
    );
};

/**
 * Process AI response to extract code and summary.
 * Handles both MODE 1 (full HTML) and MODE 2 (SEARCH/REPLACE blocks) —
 * the latter is applied against currentCode.
 */
const processResponse = (
    fullContent: string,
    currentCode: string
): { code: string; summary: string } => {
    // Split off the summary first (use the FIRST marker only).
    let body = fullContent;
    let summary = 'I have updated the code based on your request.';

    const summaryIdx = fullContent.indexOf('---SUMMARY---');
    if (summaryIdx !== -1) {
        body = fullContent.slice(0, summaryIdx);
        summary = fullContent.slice(summaryIdx + '---SUMMARY---'.length).trim() || summary;
        // Models sometimes wrap the summary in a markdown fence — strip stray ones.
        summary = summary.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
    }

    const cleaned = stripOuterCodeFence(body);

    // MODE 2: SEARCH/REPLACE blocks — apply against current code.
    if (/<{5,}\s*SEARCH/.test(cleaned)) {
        const code = applySearchReplace(currentCode, cleaned);
        return { code, summary };
    }

    // MODE 1: full HTML file.
    return { code: cleaned, summary };
};

// ============================================
// SEO Context Builder
// ============================================

function buildSeoContext(seo?: SeoSettings): string {
    if (!seo) return '';

    const parts: string[] = ['\n\n## 🔍 SEO SETTINGS (generate meta tags using these):'];

    if (seo.siteTitle) parts.push(`- Title: ${seo.siteTitle}`);
    if (seo.siteDescription) parts.push(`- Description: ${seo.siteDescription}`);
    if (seo.siteKeywords) parts.push(`- Keywords: ${seo.siteKeywords}`);
    if (seo.author) parts.push(`- Author: ${seo.author}`);
    if (seo.siteUrl) parts.push(`- Canonical URL: ${seo.siteUrl}`);
    if (seo.ogImage) parts.push(`- OG Image: ${seo.ogImage}`);

    parts.push('\nGenerate ALL required SEO meta tags in the <head> section. Include sitemap.xml and robots.txt references.');

    return parts.join('\n');
}

// ============================================
// Public API
// ============================================

/**
 * Main code generation function
 * Routes to the appropriate AI provider and handles streaming.
 * Automatically enriches prompts with Tavily web search when needed.
 *
 * @param apiKey - API key for the selected provider
 * @param model - Model ID to use
 * @param messages - Conversation history
 * @param currentCode - Current code in the editor
 * @param onChunk - Callback for streaming chunks
 * @param provider - AI provider ('google' or 'openrouter')
 * @param attachments - Optional file attachments
 * @returns Generated code and summary
 */
export const generateCodeStream = async (
    apiKey: string,
    model: string,
    messages: { role: 'user' | 'assistant'; content: string }[],
    currentCode: string,
    onChunk: (chunk: string) => void,
    provider: ApiProvider = 'openrouter',
    attachments?: FileAttachment[],
    onStatus?: (status: string) => void,
    webSearchEnabled?: boolean,
    seoSettings?: SeoSettings,
    onRetry?: () => void,
    signal?: AbortSignal
): Promise<{ code: string; summary: string; searchData?: { query: string; results: { title: string; url: string; snippet: string }[] } }> => {
    // Extract the latest user message for search context detection
    const latestUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';

    // Only search when the toggle is ON and the prompt needs it
    let searchContextStr: string | undefined;
    let searchData: { query: string; results: { title: string; url: string; snippet: string }[] } | undefined;

    if (webSearchEnabled && shouldSearch(latestUserMessage)) {
        onStatus?.('🔍 Searching the web...');
        const searchResult = await searchWeb(latestUserMessage, signal);
        if (searchResult) {
            searchContextStr = searchResult.context;
            searchData = { query: searchResult.query, results: searchResult.results };
            onStatus?.(`✅ Found ${searchResult.results.length} results — generating code...`);
        } else {
            onStatus?.('⚡ Generating code...');
        }
    } else {
        onStatus?.('⚡ Generating code...');
    }

    // Build full context string (search + SEO)
    const seoContextStr = buildSeoContext(seoSettings);
    const fullContext = [searchContextStr, seoContextStr].filter(Boolean).join('\n');

    const MAX_RETRIES = 3;
    let lastError: unknown;

    // If the selected Google model is busy, retry with the proven fallback
    // model instead of hammering the same one.
    let activeModel = model;
    let fallbackUsed = false;

    // Retryable transient failures: rate limits (429) and server-side spikes
    // (5xx, "high demand", "temporarily"). Both are common with Gemini and
    // OpenRouter and usually resolve within seconds.
    const isTransientError = (message: string): boolean => {
        const m = message.toLowerCase();
        return (
            message.includes('429') ||
            m.includes('rate limit') ||
            m.includes('resource_exhausted') ||
            message.includes('500') ||
            message.includes('502') ||
            message.includes('503') ||
            message.includes('504') ||
            m.includes('high demand') ||
            m.includes('overloaded') ||
            m.includes('temporarily') ||
            // SDK wraps any mid-stream connection drop as this exact message.
            // Do NOT match "Request aborted when reading from the stream"
            // (a user Stop) — hence the leading "error".
            m.includes('error reading from the stream') ||
            // SDK also throws this when a transient 503/HTML body arrives
            // mid-stream instead of valid SSE.
            m.includes('failed to parse stream')
        );
    };

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            let result;
            if (provider === 'google') {
                result = await generateWithGoogleAI(
                    apiKey,
                    activeModel,
                    messages,
                    currentCode,
                    onChunk,
                    attachments,
                    fullContext || undefined,
                    signal
                );
            } else {
                result = await generateWithOpenRouter(
                    apiKey,
                    activeModel,
                    messages,
                    currentCode,
                    onChunk,
                    attachments,
                    fullContext || undefined,
                    signal
                );
            }
            return { ...result, searchData };
        } catch (error) {
            lastError = error;
            const message = error instanceof Error ? error.message : String(error);
            const isRetryable = isTransientError(message);

            if (isRetryable && attempt < MAX_RETRIES - 1) {
                const delay = Math.pow(2, attempt + 1) * 1000;

                if (provider === 'google' && !fallbackUsed && activeModel !== GOOGLE_FALLBACK_MODEL) {
                    fallbackUsed = true;
                    activeModel = GOOGLE_FALLBACK_MODEL;
                    onStatus?.(`⏳ ${model} is busy — retrying with ${GOOGLE_FALLBACK_MODEL} in ${delay / 1000}s...`);
                    console.warn(`Model ${model} busy — switching to fallback ${GOOGLE_FALLBACK_MODEL}.`);
                } else {
                    onStatus?.(`⏳ Service busy. Retrying in ${delay / 1000}s...`);
                }

                console.warn(`Transient service error (attempt ${attempt + 1}/${MAX_RETRIES}). Retrying in ${delay / 1000}s...`);
                onRetry?.();
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            console.error('Error generating code:', error);
            throw error;
        }
    }

    throw lastError;
};
