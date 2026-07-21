import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from '../constants/emailjs';

let initialized = false;

function initEmailJS() {
    if (initialized) return;
    if (!EMAILJS_CONFIG.serviceId || !EMAILJS_CONFIG.publicKey) return;
    try {
        emailjs.init(EMAILJS_CONFIG.publicKey);
        initialized = true;
    } catch {
        console.error('Failed to initialize EmailJS');
    }
}

function classifyError(err: Error): { type: string; category: string } {
    const msg = err.message.toLowerCase();
    const name = err.name.toLowerCase();

    if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('invalid api key')) {
        return { type: 'AUTH_FAILURE', category: 'authentication' };
    }
    if (msg.includes('429') || msg.includes('rate limit') || msg.includes('resource_exhausted') || msg.includes('too many requests')) {
        return { type: 'RATE_LIMIT', category: 'throttling' };
    }
    if (msg.includes('400') || msg.includes('bad request')) {
        if (msg.includes('model')) return { type: 'INVALID_MODEL', category: 'configuration' };
        return { type: 'BAD_REQUEST', category: 'request' };
    }
    if (msg.includes('model not found') || msg.includes('invalid model') || msg.includes('does not exist')) {
        return { type: 'MODEL_NOT_FOUND', category: 'configuration' };
    }
    if (msg.includes('content filter') || msg.includes('safety') || msg.includes('blocked') || msg.includes('policy violation')) {
        return { type: 'CONTENT_BLOCKED', category: 'content' };
    }
    if (msg.includes('quota') || msg.includes('exceeded') || msg.includes('limit exceeded')) {
        return { type: 'QUOTA_EXCEEDED', category: 'billing' };
    }
    if (msg.includes('500') || msg.includes('502') || msg.includes('503') || msg.includes('server error') || msg.includes('internal error')) {
        return { type: 'SERVER_ERROR', category: 'infrastructure' };
    }
    if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('deadline')) {
        return { type: 'TIMEOUT', category: 'network' };
    }
    if (msg.includes('network') || msg.includes('fetch failed') || msg.includes('cors') || msg.includes('offline')) {
        return { type: 'NETWORK_ERROR', category: 'network' };
    }
    if (name.includes('abort') || msg.includes('abort')) {
        return { type: 'STREAM_ABORT', category: 'streaming' };
    }
    if (msg.includes('stream')) {
        return { type: 'STREAM_ERROR', category: 'streaming' };
    }
    if (msg.includes('json') || msg.includes('parse') || msg.includes('syntax error')) {
        return { type: 'PARSE_ERROR', category: 'response' };
    }
    if (msg.includes('generative') || msg.includes('gemini')) {
        return { type: 'GOOGLE_AI_ERROR', category: 'provider' };
    }
    if (msg.includes('openrouter')) {
        return { type: 'OPENROUTER_ERROR', category: 'provider' };
    }

    return { type: 'UNKNOWN', category: 'unknown' };
}

interface ErrorReportContext {
    model: string;
    provider: string;
    messageCount: number;
    hasAttachments: boolean;
    webSearchEnabled: boolean;
    isRetry: boolean;
}

export async function reportError(
    error: unknown,
    context: ErrorReportContext
): Promise<void> {
    initEmailJS();
    if (!initialized) return;

    const err = error instanceof Error ? error : new Error(String(error));
    const { type, category } = classifyError(err);

    const report = [
        `=== AI CODER ERROR REPORT ===`,
        ``,
        `[${type}] ${category}`,
        ``,
        `Error Name: ${err.name}`,
        `Error Message: ${err.message}`,
        ``,
        `Stack Trace:`,
        err.stack || 'N/A',
        ``,
        `--- Context ---`,
        `Model: ${context.model}`,
        `Provider: ${context.provider}`,
        `Message Count: ${context.messageCount}`,
        `Has Attachments: ${context.hasAttachments}`,
        `Web Search Enabled: ${context.webSearchEnabled}`,
        `Is Retry: ${context.isRetry}`,
        ``,
        `--- Environment ---`,
        `URL: ${window.location.href}`,
        `Browser: ${navigator.userAgent}`,
        `Screen: ${window.screen.width}x${window.screen.height}`,
        `Viewport: ${window.innerWidth}x${window.innerHeight}`,
        `Language: ${navigator.language}`,
        `Online: ${navigator.onLine}`,
        `Time: ${new Date().toISOString()}`,
        `Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
    ].join('\n');

    try {
        await emailjs.send(
            EMAILJS_CONFIG.serviceId,
            EMAILJS_CONFIG.templateId,
            {
                from_name: `AI Coder [${type}]`,
                from_email: 'error@aicoder.app',
                message: report,
                page_url: window.location.href,
                timestamp: new Date().toISOString(),
            } as unknown as Record<string, unknown>,
            EMAILJS_CONFIG.publicKey
        );
    } catch (e) {
        console.error('Failed to send error report:', e);
    }
}
