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

import OpenAI from 'openai';
import { GoogleGenerativeAI, type Part } from '@google/generative-ai';
import type { ApiProvider, FileAttachment } from '../types';
import { SYSTEM_PROMPT } from './ai/system-prompt';

// ============================================
// Provider Implementations
// ============================================

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
    attachments?: FileAttachment[]
): Promise<{ code: string; summary: string }> => {
    // Initialize the Google Generative AI client
    const genAI = new GoogleGenerativeAI(apiKey);

    // Extract model name (remove provider prefix if present)
    const modelName = model.includes('/')
        ? model.split('/').pop()?.replace(':free', '') || model
        : model;

    // Configure model with system instruction
    const generativeModel = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: {
            role: 'user',
            parts: [{ text: SYSTEM_PROMPT }]
        }
    });

    // Build the chat history
    const history = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' as const : 'user' as const,
        parts: [{ text: m.content }]
    }));

    // Create the chat session
    const chat = generativeModel.startChat({
        history: history,
    });

    // Build prompt parts (text + attachments)
    const promptParts: Part[] = [];

    // Add text prompt
    promptParts.push({
        text: `
Current Code:
${currentCode}

Based on the conversation above, generate the COMPLETE updated HTML file. Always output the full file.
`
    });

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
            if (attachment.type === 'image') {
                // Extract base64 content
                const base64Match = attachment.content.match(/^data:([^;]+);base64,(.+)$/);
                if (base64Match) {
                    promptParts.push({
                        inlineData: {
                            mimeType: attachment.mimeType,
                            data: base64Match[2]
                        }
                    });
                }
            } else if (attachment.type === 'text') {
                promptParts.push({
                    text: `\n\n--- Attached File: ${attachment.name} ---\n${attachment.content}\n--- End of File ---\n`
                });
            } else if (attachment.type === 'pdf') {
                // Google AI supports PDF as inline data
                const base64Match = attachment.content.match(/^data:([^;]+);base64,(.+)$/);
                if (base64Match) {
                    promptParts.push({
                        inlineData: {
                            mimeType: attachment.mimeType,
                            data: base64Match[2]
                        }
                    });
                }
            }
        }
    }

    // Stream the response
    const result = await chat.sendMessageStream(promptParts);
    let fullContent = '';

    for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
            fullContent += chunkText;
            onChunk(chunkText);
        }
    }

    return processResponse(fullContent);
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
    attachments?: FileAttachment[]
): Promise<{ code: string; summary: string }> => {
    const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
        dangerouslyAllowBrowser: true,
    });

    // Build attachment context (OpenRouter doesn't support multimodal for all models)
    let attachmentContext = '';
    if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
            if (attachment.type === 'text') {
                attachmentContext += `\n\n--- Attached File: ${attachment.name} ---\n${attachment.content}\n--- End of File ---\n`;
            } else if (attachment.type === 'image') {
                attachmentContext += `\n\n[Image attached: ${attachment.name}] - Note: Please describe what you want from this image in text.`;
            } else if (attachment.type === 'pdf') {
                attachmentContext += `\n\n[PDF attached: ${attachment.name}] - Note: PDF content extraction not available for this provider.`;
            }
        }
    }

    const stream = await openai.chat.completions.create({
        model: model,
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            {
                role: 'user',
                content: `
Current Code:
${currentCode}
${attachmentContext}
Based on the conversation above, generate the COMPLETE updated HTML file. Always output the full file.
`,
            },
        ],
        stream: true,
    });

    let fullContent = '';

    for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
            fullContent += content;
            onChunk(content);
        }
    }

    return processResponse(fullContent);
};

// ============================================
// Response Processing
// ============================================

/**
 * Process AI response to extract code and summary
 * Cleans up markdown artifacts and parses the summary section
 */
const processResponse = (
    fullContent: string
): { code: string; summary: string } => {
    // Clean up markdown code blocks if present (common AI quirk)
    let cleanedContent = fullContent
        .replace(/```html/g, '')
        .replace(/```/g, '')
        .trim();

    // Parse summary
    let summary = 'I have updated the code based on your request.';

    if (cleanedContent.includes('---SUMMARY---')) {
        const parts = cleanedContent.split('---SUMMARY---');
        cleanedContent = parts[0].trim();
        summary = parts[1]?.trim() || summary;
    }

    return { code: cleanedContent, summary };
};

// ============================================
// Public API
// ============================================

/**
 * Main code generation function
 * Routes to the appropriate AI provider and handles streaming
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
    attachments?: FileAttachment[]
): Promise<{ code: string; summary: string }> => {
    try {
        if (provider === 'google') {
            return await generateWithGoogleAI(
                apiKey,
                model,
                messages,
                currentCode,
                onChunk,
                attachments
            );
        } else {
            return await generateWithOpenRouter(
                apiKey,
                model,
                messages,
                currentCode,
                onChunk,
                attachments
            );
        }
    } catch (error) {
        console.error('Error generating code:', error);
        throw error;
    }
};
