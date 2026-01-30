import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Copy, Check, Paperclip, X, Settings } from 'lucide-react';
import clsx from 'clsx';
import type { FileAttachment } from '../types';
import { processFile, isFileSupported, formatFileSize, getFileIcon } from '../services/fileProcessor';
import { PROMPT_SUGGESTIONS } from '../constants/prompts';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatInterfaceProps {
    messages: Message[];
    onSendMessage: (message: string, attachments?: FileAttachment[]) => void;

    isLoading: boolean;
    onOpenSettings?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading, onOpenSettings }) => {
    const [input, setInput] = useState('');
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [attachments, setAttachments] = useState<FileAttachment[]>([]);
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
        }
    }, [input]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if ((input.trim() || attachments.length > 0) && !isLoading) {
            onSendMessage(input.trim(), attachments.length > 0 ? attachments : undefined);
            setInput('');
            setAttachments([]);
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handlePromptClick = (prompt: string) => {
        onSendMessage(prompt);
    };

    const handleCopyMessage = async (content: string, idx: number) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopiedId(idx);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsProcessingFile(true);
        try {
            const newAttachments: FileAttachment[] = [];
            for (const file of Array.from(files)) {
                if (!isFileSupported(file)) {
                    console.warn(`Unsupported file type: ${file.type}`);
                    continue;
                }
                // Limit file size to 10MB
                if (file.size > 10 * 1024 * 1024) {
                    console.warn(`File too large: ${file.name}`);
                    continue;
                }
                const attachment = await processFile(file);
                newAttachments.push(attachment);
            }
            setAttachments(prev => [...prev, ...newAttachments]);
        } catch (error) {
            console.error('Error processing file:', error);
        } finally {
            setIsProcessingFile(false);
            // Reset input so same file can be selected again
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const removeAttachment = (id: string) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    return (
        <div className="flex h-full flex-col card overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
                <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[hsl(var(--primary))]">
                        <Sparkles className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-sm font-medium">AI Assistant</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">Online</span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" role="log" aria-live="polite">
                {messages.length === 0 && (
                    <div className="flex flex-col h-full">
                        {/* Empty state header */}
                        <div className="flex flex-col items-center text-center pt-8 pb-6">
                            <div className="h-12 w-12 rounded-full bg-[hsl(var(--primary)/.1)] flex items-center justify-center mb-3">
                                <Sparkles className="h-6 w-6 text-[hsl(var(--primary))]" />
                            </div>
                            <h3 className="font-medium text-[hsl(var(--foreground))]">Ready to build something amazing?</h3>
                            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                                Pick a template below or describe your idea
                            </p>
                        </div>

                        {/* Prompt Suggestions */}
                        <div className="grid grid-cols-1 gap-2 px-2">
                            {PROMPT_SUGGESTIONS.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handlePromptClick(suggestion.text)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all group
                                        ${idx === 0
                                            ? 'bg-[hsl(var(--primary)/.05)] border-[hsl(var(--primary)/.2)] hover:border-[hsl(var(--primary)/.4)]'
                                            : 'bg-[hsl(var(--secondary))] border-transparent hover:bg-[hsl(var(--accent))] hover:border-[hsl(var(--border))]'}
                                    `}
                                >
                                    <span className="text-lg">{suggestion.emoji}</span>
                                    <div className="flex-1">
                                        <span className="text-sm text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))] transition-colors">
                                            {suggestion.text}
                                        </span>
                                        {idx === 0 && (
                                            <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-[hsl(var(--primary)/.1)] text-[hsl(var(--primary))] rounded-full font-medium">Popular</span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={clsx(
                            "flex gap-3 max-w-[95%] group",
                            msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                        )}
                    >
                        <div className={clsx(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                            msg.role === 'user'
                                ? "bg-[hsl(var(--primary))]"
                                : "bg-[hsl(var(--secondary))]"
                        )}>
                            {msg.role === 'user' ? <User className="h-3.5 w-3.5 text-white" /> : <Bot className="h-3.5 w-3.5" />}
                        </div>
                        <div className="relative">
                            <div className={clsx(
                                "rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
                                msg.role === 'user'
                                    ? "bg-[hsl(var(--primary))] text-white rounded-br-sm"
                                    : "bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] rounded-bl-sm"
                            )}>
                                {msg.content}
                            </div>
                            {/* Copy button on hover */}
                            <button
                                onClick={() => handleCopyMessage(msg.content, idx)}
                                className={clsx(
                                    "absolute -bottom-1 right-0 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity",
                                    msg.role === 'user' ? "hover:bg-white/20" : "hover:bg-black/20"
                                )}
                                title="Copy message"
                            >
                                {copiedId === idx ? (
                                    <Check className="h-3 w-3 text-emerald-400" />
                                ) : (
                                    <Copy className="h-3 w-3 text-[hsl(var(--muted-foreground))]" />
                                )}
                            </button>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--secondary))]">
                            <Bot className="h-3.5 w-3.5" />
                        </div>
                        <div className="bg-[hsl(var(--secondary))] rounded-xl rounded-bl-sm px-4 py-3">
                            <div className="flex space-x-1.5">
                                <div className="h-2 w-2 animate-bounce rounded-full bg-[hsl(var(--muted-foreground))]" style={{ animationDelay: '0ms' }}></div>
                                <div className="h-2 w-2 animate-bounce rounded-full bg-[hsl(var(--muted-foreground))]" style={{ animationDelay: '150ms' }}></div>
                                <div className="h-2 w-2 animate-bounce rounded-full bg-[hsl(var(--muted-foreground))]" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Attachments Preview */}
            {attachments.length > 0 && (
                <div className="px-3 py-2 border-t border-[hsl(var(--border))] bg-[hsl(var(--secondary)/.5)]">
                    <div className="flex flex-wrap gap-2">
                        {attachments.map((attachment) => (
                            <div
                                key={attachment.id}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-xs"
                            >
                                <span>{getFileIcon(attachment.type)}</span>
                                <span className="max-w-[120px] truncate">{attachment.name}</span>
                                <span className="text-[hsl(var(--muted-foreground))]">
                                    {formatFileSize(attachment.size)}
                                </span>
                                <button
                                    onClick={() => removeAttachment(attachment.id)}
                                    className="p-0.5 hover:bg-rose-500/20 rounded transition-colors"
                                    title="Remove attachment"
                                >
                                    <X className="h-3 w-3 text-rose-400" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-[hsl(var(--border))]">
                <div className="flex items-end gap-2 bg-[hsl(var(--secondary)/.3)] p-2 rounded-xl border border-[hsl(var(--border))] focus-within:ring-2 focus-within:ring-[hsl(var(--ring))] focus-within:border-transparent transition-all shadow-sm">
                    {/* File Upload Button - Left side like Lovable */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        accept="image/*,.pdf,.txt,.md,.json,.html,.css,.js"
                        multiple
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading || isProcessingFile}
                        className="p-2 h-10 w-10 flex items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--background))] disabled:opacity-50 transition-all shrink-0"
                        title="Add files to context"
                        aria-label="Upload files"
                    >
                        {isProcessingFile ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[hsl(var(--muted-foreground))] border-t-transparent" />
                        ) : (
                            <Paperclip className="h-5 w-5" />
                        )}
                    </button>

                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="What do you want to build?"
                        className="flex-1 bg-transparent py-2.5 px-0 text-sm resize-none min-h-[40px] max-h-[200px] focus:outline-none placeholder:text-[hsl(var(--muted-foreground)/.7)] text-[hsl(var(--foreground))]"
                        disabled={isLoading}
                        rows={1}
                    />

                    {/* Settings Button */}
                    {onOpenSettings && (
                        <button
                            type="button"
                            onClick={onOpenSettings}
                            disabled={isLoading}
                            className="p-2 h-10 w-10 flex items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--background))] transition-all shrink-0"
                            title="Settings"
                        >
                            <Settings className="h-4 w-4" />
                        </button>
                    )}

                    {/* Send Button */}
                    <button
                        type="submit"
                        disabled={isLoading || (!input.trim() && attachments.length === 0)}
                        className={clsx(
                            "p-2 h-10 w-10 flex items-center justify-center rounded-lg transition-all shrink-0",
                            input.trim() || attachments.length > 0
                                ? "bg-[hsl(var(--primary))] text-primary-foreground hover:opacity-90 shadow-sm"
                                : "bg-[hsl(var(--muted))]/50 text-[hsl(var(--muted-foreground))] cursor-not-allowed"
                        )}
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatInterface;
