import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { GoogleGenerativeAI, type Part } from '@google/generative-ai';
import { SYSTEM_PROMPT } from '../src/services/ai/system-prompt';
import type { ApiProvider, FileAttachment } from '../src/types';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

interface AiRequest {
    apiKey: string;
    provider: ApiProvider;
    model: string;
    messages: ChatMessage[];
    currentCode: string;
    attachments?: FileAttachment[];
    searchContext?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function parseRequest(body: unknown): AiRequest | null {
    if (!isRecord(body)) return null;
    const apiKey = body.apiKey;
    const provider = body.provider;
    const model = body.model;
    const messages = body.messages;
    const currentCode = body.currentCode;

    if (
        typeof apiKey !== 'string' || !apiKey.trim() ||
        (provider !== 'google' && provider !== 'openrouter') ||
        typeof model !== 'string' || !model.trim() ||
        !Array.isArray(messages) ||
        !messages.every((message: unknown) =>
            isRecord(message) &&
            (message.role === 'user' || message.role === 'assistant') &&
            typeof message.content === 'string'
        ) ||
        typeof currentCode !== 'string'
    ) {
        return null;
    }

    return {
        apiKey,
        provider,
        model,
        messages: messages as ChatMessage[],
        currentCode,
        attachments: Array.isArray(body.attachments) ? body.attachments as FileAttachment[] : undefined,
        searchContext: typeof body.searchContext === 'string' ? body.searchContext : undefined,
    };
}

function sendEvent(res: VercelResponse, event: Record<string, string>): void {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
}

function modelName(model: string): string {
    return model.includes('/') ? model.split('/').pop()?.replace(':free', '') || model : model;
}

function attachmentParts(attachments: FileAttachment[] | undefined): Part[] {
    if (!attachments) return [];
    const parts: Part[] = [];
    for (const attachment of attachments) {
        if (attachment.type === 'text') {
            parts.push({
                text: `\n\n--- Attached File: ${attachment.name} ---\n${attachment.content}\n--- End of File ---\n`,
            });
            continue;
        }

        const match = attachment.content.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
            parts.push({ inlineData: { mimeType: attachment.mimeType, data: match[2] } });
        }
    }
    return parts;
}

async function streamGoogle(request: AiRequest, res: VercelResponse, signal: AbortSignal): Promise<void> {
    const genAI = new GoogleGenerativeAI(request.apiKey);
    const model = genAI.getGenerativeModel({
        model: modelName(request.model),
        systemInstruction: SYSTEM_PROMPT,
    });
    const history = request.messages.map((message) => ({
        role: message.role === 'assistant' ? 'model' as const : 'user' as const,
        parts: [{ text: message.content }],
    }));
    const chat = model.startChat({ history });
    const promptParts: Part[] = [{
        text: `Current Code:\n${request.currentCode}\n${request.searchContext || ''}\nBased on the conversation above, generate the COMPLETE updated HTML file. Always output the full file.`,
    }, ...attachmentParts(request.attachments)];
    const result = await chat.sendMessageStream(promptParts, { signal });

    for await (const chunk of result.stream) {
        if (signal.aborted) return;
        const text = chunk.text();
        if (text) sendEvent(res, { type: 'chunk', text });
    }
}

async function streamOpenRouter(request: AiRequest, res: VercelResponse, signal: AbortSignal): Promise<void> {
    const openai = new OpenAI({ apiKey: request.apiKey, baseURL: 'https://openrouter.ai/api/v1' });
    let attachmentContext = '';
    for (const attachment of request.attachments || []) {
        attachmentContext += attachment.type === 'text'
            ? `\n\n--- Attached File: ${attachment.name} ---\n${attachment.content}\n--- End of File ---\n`
            : `\n\n[${attachment.type.toUpperCase()} attached: ${attachment.name}]`;
    }
    const stream = await openai.chat.completions.create({
        model: request.model,
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...request.messages,
            {
                role: 'user',
                content: `Current Code:\n${request.currentCode}\n${attachmentContext}${request.searchContext || ''}\nBased on the conversation above, generate the COMPLETE updated HTML file. Always output the full file.`,
            },
        ],
        stream: true,
    }, { signal });

    for await (const chunk of stream) {
        if (signal.aborted) return;
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) sendEvent(res, { type: 'chunk', text });
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const request = parseRequest(req.body);
    if (!request) {
        res.status(400).json({ error: 'Invalid AI request' });
        return;
    }

    const controller = new AbortController();
    req.on('aborted', () => controller.abort());
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    try {
        if (request.provider === 'google') {
            await streamGoogle(request, res, controller.signal);
        } else {
            await streamOpenRouter(request, res, controller.signal);
        }
        sendEvent(res, { type: 'done' });
    } catch (error) {
        if (!controller.signal.aborted) {
            const message = error instanceof Error ? error.message : 'AI request failed';
            sendEvent(res, { type: 'error', message });
        }
    } finally {
        res.end();
    }
}
