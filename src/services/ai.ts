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
    try {
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
    } catch (error) {
        // Re-throw with more context
        const message = error instanceof Error ? error.message : String(error);

        // Check for common Google AI issues
        if (message.includes('API key not valid')) {
            throw new Error('API_KEY_INVALID: Your Google AI API key is invalid. Get a new one at https://aistudio.google.com/apikey');
        }
        if (message.includes('permission denied') || message.includes('403')) {
            throw new Error('PERMISSION_DENIED: Your API key does not have permission to use this model.');
        }
        if (message.includes('quota') || message.includes('429')) {
            throw new Error('QUOTA_EXCEEDED: API quota exceeded. Please try again later.');
        }
        if (message.includes('not found') || message.includes('404')) {
            throw new Error(`Model not found: "${model}" may not be available. Try a different model.`);
        }

        throw error;
    }
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
/**
 * Generate code using iFlow API (for Google Auth users with free credits)
 * Uses GLM-4.6 model at apis.iflow.cn
 */
const generateWithIFlow = async (
    apiKey: string,
    model: string,
    messages: { role: 'user' | 'assistant'; content: string }[],
    currentCode: string,
    onChunk: (chunk: string) => void
): Promise<{ code: string; summary: string }> => {
    const actualModel = model || 'glm-4.6';
    console.log('[AI Coder] ========== REQUEST DEBUG ==========');
    console.log('[AI Coder] Model:', actualModel);
    console.log('[AI Coder] API Key present:', !!apiKey, '| Length:', apiKey?.length);
    console.log('[AI Coder] Messages count:', messages.length);
    console.log('[AI Coder] Current code length:', currentCode?.length || 0);

    const requestBody = {
        model: actualModel,
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            {
                role: 'user',
                content: `Current Code:\n${currentCode}\n\nGenerate the COMPLETE updated HTML file.`,
            },
        ],
        stream: true,
        max_tokens: 8192,
        temperature: 0.7,
    };

    console.log('[AI Coder] Request body model:', requestBody.model);
    console.log('[AI Coder] Total messages in request:', requestBody.messages.length);

    try {
        console.log('[AI Coder] Sending fetch to apis.iflow.cn...');
        const response = await fetch('https://apis.iflow.cn/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        console.log('[AI Coder] Response received! Status:', response.status);
        console.log('[AI Coder] Response OK:', response.ok);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[AI Coder] ERROR Response:', errorText);
            throw new Error(`AI Coder API error: ${response.status} - ${errorText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            console.error('[AI Coder] No response body reader!');
            throw new Error('No response body');
        }

        console.log('[AI Coder] Starting to read stream...');
        const decoder = new TextDecoder();
        let fullContent = '';
        let buffer = '';
        let chunkCount = 0;
        const rawChunks: string[] = []; // Collect raw chunks for debugging

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const rawChunk = decoder.decode(value, { stream: true });
            buffer += rawChunk;

            // Log first 3 raw chunks for debugging
            if (rawChunks.length < 3) {
                rawChunks.push(rawChunk);
                console.log('[AI Coder] Raw chunk #' + rawChunks.length + ':', rawChunk.substring(0, 300));
            }

            // Process complete SSE events (separated by double newline or data: prefix)
            // Split by 'data:' to get individual events
            const parts = buffer.split(/\ndata:/);

            // Keep last part in buffer if it might be incomplete
            buffer = parts.pop() || '';

            for (let i = 0; i < parts.length; i++) {
                let eventData = parts[i];

                // First part might start with 'data:' or just be the beginning
                if (i === 0 && !eventData.startsWith('data:')) {
                    eventData = 'data:' + eventData;
                } else if (i > 0) {
                    eventData = 'data:' + eventData;
                }

                // Clean up the event data
                const trimmed = eventData.trim();
                if (!trimmed || !trimmed.startsWith('data:')) continue;

                // Extract JSON - handle 'data:' or 'data: '
                let jsonStr = trimmed.startsWith('data: ') ? trimmed.slice(6) : trimmed.slice(5);
                jsonStr = jsonStr.trim();

                if (jsonStr === '[DONE]' || !jsonStr) continue;

                try {
                    const parsed = JSON.parse(jsonStr);
                    const content = parsed.choices?.[0]?.delta?.content || '';
                    if (content) {
                        fullContent += content;
                        onChunk(content);
                        chunkCount++;

                        // Log first few successful chunks
                        if (chunkCount <= 3) {
                            console.log('[AI Coder] Chunk #' + chunkCount + ':', content.substring(0, 50));
                        }
                    }
                } catch {
                    // This event might be incomplete, skip it
                }
            }
        }

        // Process any remaining buffer
        if (buffer.trim() && buffer.trim().startsWith('data:')) {
            const jsonStr = buffer.trim().startsWith('data: ')
                ? buffer.trim().slice(6)
                : buffer.trim().slice(5);
            if (jsonStr && jsonStr !== '[DONE]') {
                try {
                    const parsed = JSON.parse(jsonStr.trim());
                    const content = parsed.choices?.[0]?.delta?.content || '';
                    if (content) {
                        fullContent += content;
                        onChunk(content);
                        chunkCount++;
                    }
                } catch {
                    // Final incomplete chunk, ignore
                }
            }
        }

        console.log('[AI Coder] ========== RESPONSE DEBUG ==========');
        console.log('[AI Coder] Parsed chunks with content:', chunkCount);
        console.log('[AI Coder] Total content length:', fullContent.length);

        // If no chunks parsed, log the remaining buffer for debugging
        if (chunkCount === 0) {
            console.log('[AI Coder] ⚠️ NO CHUNKS PARSED - Raw buffer:', buffer.substring(0, 1000));
            console.log('[AI Coder] Retrying with non-streaming mode...');

            // Retry with non-streaming mode
            const nonStreamResponse = await fetch('https://apis.iflow.cn/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...requestBody,
                    stream: false,
                }),
            });

            if (nonStreamResponse.ok) {
                const jsonData = await nonStreamResponse.json();
                console.log('[AI Coder] Non-stream response:', JSON.stringify(jsonData).substring(0, 500));
                const content = jsonData.choices?.[0]?.message?.content || '';
                if (content) {
                    fullContent = content;
                    onChunk(content);
                    console.log('[AI Coder] Non-stream content length:', content.length);
                }
            } else {
                console.error('[AI Coder] Non-stream request failed:', nonStreamResponse.status);
            }
        }

        console.log('[AI Coder] First 300 chars:', fullContent.substring(0, 300));

        return processResponse(fullContent);
    } catch (error) {
        console.error('[AI Coder] ========== FETCH ERROR ==========');
        console.error('[AI Coder] Error type:', error instanceof Error ? error.constructor.name : typeof error);
        console.error('[AI Coder] Error message:', error instanceof Error ? error.message : String(error));
        console.error('[AI Coder] Full error:', error);
        throw error;
    }
};

// ============================================
// Response Processing
// ============================================

/**
 * Process AI response to extract code and summary
 * Cleans up markdown artifacts and parses the summary section
 * Generates intelligent summaries when AI doesn't include ---SUMMARY---
 */
const processResponse = (
    fullContent: string
): { code: string; summary: string } => {
    // Clean up markdown code blocks if present (common AI quirk)
    let cleanedContent = fullContent
        .replace(/```html\n?/gi, '')
        .replace(/```\n?/g, '')
        .trim();

    // Parse summary if provided
    let summary = '';

    if (cleanedContent.includes('---SUMMARY---')) {
        const parts = cleanedContent.split('---SUMMARY---');
        cleanedContent = parts[0].trim();
        summary = parts[1]?.trim() || '';
    }

    // If no summary was provided, generate one from the code
    if (!summary) {
        summary = generateSmartSummary(cleanedContent);
    }

    return { code: cleanedContent, summary };
};

/**
 * Generate an intelligent summary by analyzing the HTML code
 */
const generateSmartSummary = (code: string): string => {
    const features: string[] = [];

    // Extract title
    const titleMatch = code.match(/<title>([^<]+)<\/title>/i);
    const appName = titleMatch?.[1]?.trim() || 'your application';

    // Detect key features from code patterns
    if (code.includes('firebase') || code.includes('Firebase')) {
        features.push('Firebase integration');
    }
    if (code.includes('supabase') || code.includes('Supabase')) {
        features.push('Supabase backend');
    }
    if (code.includes('localStorage') || code.includes('sessionStorage')) {
        features.push('data persistence');
    }
    if (code.includes('fetch(') || code.includes('XMLHttpRequest')) {
        features.push('API integration');
    }
    if (code.includes('@media') || code.includes('responsive')) {
        features.push('responsive design');
    }
    if (code.includes('dark-mode') || code.includes('prefers-color-scheme')) {
        features.push('dark mode support');
    }
    if (code.includes('chart') || code.includes('Chart')) {
        features.push('data visualization');
    }
    if (code.includes('animation') || code.includes('@keyframes') || code.includes('transition')) {
        features.push('smooth animations');
    }
    if (code.includes('drag') || code.includes('Sortable')) {
        features.push('drag-and-drop');
    }
    if (code.includes('modal') || code.includes('dialog')) {
        features.push('modal dialogs');
    }
    if (code.includes('form') && (code.includes('input') || code.includes('submit'))) {
        features.push('form handling');
    }
    if (code.includes('addEventListener') || code.includes('onclick')) {
        features.push('interactive elements');
    }

    // Build summary
    let summary = `✅ **${appName}** has been created!`;

    if (features.length > 0) {
        const featuresStr = features.slice(0, 4).join(', ');
        summary += `\n\n**Features:** ${featuresStr}`;
    }

    // Add code stats
    const lines = code.split('\n').length;
    const hasCSS = code.includes('<style>');
    const hasJS = code.includes('<script>');

    summary += `\n\n📊 **Stats:** ${lines} lines`;
    if (hasCSS) summary += ' | styled with CSS';
    if (hasJS) summary += ' | interactive with JavaScript';

    return summary;
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
        } else if (provider === 'aicoder') {
            return await generateWithIFlow(
                apiKey,
                model,
                messages,
                currentCode,
                onChunk
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
