import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Copy, Check, Paperclip, X, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import type { FileAttachment, Message } from '../types';
import { processFile, isFileSupported, formatFileSize, getFileIcon } from '../services/fileProcessor';
import { PROMPT_SUGGESTIONS } from '../constants/prompts';

interface ChatInterfaceProps {
    messages: Message[];
    onSendMessage: (message: string, attachments?: FileAttachment[]) => void;
    isLoading: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading }) => {
    const [input, setInput] = useState('');
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [expandedSearch, setExpandedSearch] = useState<number | null>(null);
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
                            <h3 className="font-medium text-[hsl(var(--foreground))]">What would you like to build?</h3>
                            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                                Describe your idea or attach files for context
                            </p>
                        </div>

                        {/* Prompt Suggestions */}
                        <div className="grid grid-cols-1 gap-2 px-2">
                            {PROMPT_SUGGESTIONS.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handlePromptClick(suggestion.text)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--accent))] border border-transparent hover:border-[hsl(var(--border))] text-left transition-all group"
                                >
                                    <span className="text-lg">{suggestion.emoji}</span>
                                    <span className="text-sm text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))] transition-colors">
                                        {suggestion.text}
                                    </span>
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

                                {/* Search Results Dropdown */}
                                {msg.role === 'assistant' && msg.searchData && msg.searchData.results.length > 0 && (
                                    <div className="mt-2 border-t border-[hsl(var(--border)/.5)] pt-2">
                                        <button
                                            onClick={() => setExpandedSearch(expandedSearch === idx ? null : idx)}
                                            className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors w-full"
                                        >
                                            <span>🔍</span>
                                            <span>Searched: "{msg.searchData.query.slice(0, 40)}{msg.searchData.query.length > 40 ? '...' : ''}"</span>
                                            <span className="text-[10px] opacity-70">({msg.searchData.results.length} results)</span>
                                            <ChevronDown className={clsx(
                                                "h-3 w-3 ml-auto transition-transform duration-200",
                                                expandedSearch === idx && "rotate-180"
                                            )} />
                                        </button>

                                        {expandedSearch === idx && (
                                            <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
                                                {msg.searchData.results.map((result, rIdx) => (
                                                    <a
                                                        key={rIdx}
                                                        href={result.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="block px-2.5 py-2 rounded-md bg-[hsl(var(--card))] border border-[hsl(var(--border)/.5)] hover:border-[hsl(var(--primary)/.3)] transition-colors"
                                                    >
                                                        <div className="text-xs font-medium text-[hsl(var(--foreground))] truncate">
                                                            {result.title}
                                                        </div>
                                                        <div className="text-[10px] text-[hsl(var(--primary))] truncate mt-0.5">
                                                            {result.url}
                                                        </div>
                                                        <div className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1 line-clamp-2">
                                                            {result.snippet}
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
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

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-[hsl(var(--border))]">
                <div className="relative">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe what you want to build... (Enter to send)"
                        className="input w-full py-3 pl-4 pr-20 text-sm resize-none min-h-[48px] max-h-[120px]"
                        disabled={isLoading}
                        rows={1}
                    />
                    <div className="absolute right-2 bottom-2 flex items-center gap-1">
                        {/* File Upload Button */}
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
                            className="p-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/.1)] disabled:opacity-50 transition-all"
                            title="Attach files (images, PDFs, text)"
                        >
                            <Paperclip className={clsx("h-4 w-4", isProcessingFile && "animate-pulse")} />
                        </button>
                        {/* Send Button */}
                        <button
                            type="submit"
                            disabled={isLoading || (!input.trim() && attachments.length === 0)}
                            className="p-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/.1)] disabled:opacity-50 disabled:hover:bg-transparent transition-all"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </div>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1.5 text-center">
                    Press Enter to send • Shift+Enter for new line • 📎 to attach files
                </p>
            </form>
        </div>
    );
};

export default ChatInterface;
