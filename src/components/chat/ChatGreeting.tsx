/**
 * Mobile Welcome Greeting
 * 
 * Clean welcome screen with gradient background
 * Only functional elements - no mock UI
 */

import React from 'react';
import { Settings, Paperclip, LogIn } from 'lucide-react';
import GradientBackground from '../ui/GradientBackground';
import type { FileAttachment } from '../../types';
import { processFile, isFileSupported, getFileIcon } from '../../services/fileProcessor';

interface ChatGreetingProps {
    userName?: string;
    userAvatar?: string;
    onSubmit: (message: string, attachments?: FileAttachment[]) => void;
    isLoading?: boolean;
    hasApiKey: boolean;
    onOpenSettings: () => void;
    onSignIn: () => void;
    user?: { email?: string; user_metadata?: { name?: string; avatar_url?: string } } | null;
}

const ChatGreeting: React.FC<ChatGreetingProps> = ({
    userName,
    userAvatar,
    onSubmit,
    isLoading,
    hasApiKey,
    onOpenSettings,
    onSignIn,
    user
}) => {
    const [message, setMessage] = React.useState('');
    const [attachments, setAttachments] = React.useState<FileAttachment[]>([]);
    const [isProcessingFile, setIsProcessingFile] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsProcessingFile(true);
        try {
            const newAttachments: FileAttachment[] = [];
            for (const file of Array.from(files)) {
                if (!isFileSupported(file)) continue;
                if (file.size > 10 * 1024 * 1024) continue;
                const attachment = await processFile(file);
                newAttachments.push(attachment);
            }
            setAttachments(prev => [...prev, ...newAttachments]);
        } catch (error) {
            console.error('Error processing file:', error);
        } finally {
            setIsProcessingFile(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeAttachment = (id: string) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Check if API key is configured
        if (!hasApiKey) {
            onOpenSettings();
            return;
        }

        if ((message.trim() || attachments.length > 0) && !isLoading) {
            onSubmit(message.trim(), attachments);
            setMessage('');
            setAttachments([]);
        }
    };

    return (
        <div className="relative flex-1 flex flex-col items-center justify-center px-4 overflow-hidden">
            {/* Animated gradient background */}
            <GradientBackground />

            {/* Top Bar: Sign In & Settings */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                {!user ? (
                    <button
                        onClick={onSignIn}
                        className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 rounded-full text-sm font-medium transition-all shadow-sm border border-gray-200"
                    >
                        <LogIn className="w-4 h-4" />
                        Sign In
                    </button>
                ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 backdrop-blur-sm rounded-full border border-gray-200/50">
                        {userAvatar ? (
                            <img src={userAvatar} alt="" className="w-5 h-5 rounded-full" />
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center text-white text-[10px] font-bold">
                                {userName?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <span className="text-xs font-medium text-gray-700">{userName}</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-xl flex flex-col items-center">
                {/* Main heading */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 text-center mb-8 tracking-tight">
                    What should we build{userName ? `, ${userName}` : ''}?
                </h1>

                {/* API Key Setup Prompt - Friendly, not scary */}
                {!hasApiKey && (
                    <div className="w-full mb-4 p-4 bg-violet-50 border border-violet-200 rounded-xl">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                                <span className="text-lg">🔑</span>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-violet-900 mb-1">
                                    Quick Setup (2 min)
                                </h3>
                                <p className="text-sm text-violet-700 mb-3">
                                    Add your free API key to start building. Don't worry, we'll guide you through it!
                                </p>
                                <button
                                    onClick={onOpenSettings}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
                                >
                                    <Settings className="w-4 h-4" />
                                    Get Started
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Chat input card */}
                <form onSubmit={handleSubmit} className="w-full">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-2 transition-all focus-within:ring-2 focus-within:ring-violet-500/20 focus-within:border-violet-500/50">
                        {/* Attachments Preview */}
                        {attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 px-2 pt-2 pb-1 mb-1">
                                {attachments.map(att => (
                                    <div key={att.id} className="flex items-center gap-1.5 bg-gray-100 rounded-md px-2 py-1 text-xs text-gray-700">
                                        <span>{getFileIcon(att.type)}</span>
                                        <span className="truncate max-w-[100px]">{att.name}</span>
                                        <button onClick={() => removeAttachment(att.id)} className="hover:text-red-500">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center gap-2 pl-2">
                            {/* Upload Button */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                onChange={handleFileSelect}
                                multiple
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading || isProcessingFile}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Attach files"
                            >
                                {isProcessingFile ? (
                                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Paperclip className="w-5 h-5" />
                                )}
                            </button>

                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit(e as unknown as React.FormEvent);
                                    }
                                }}
                                placeholder={hasApiKey
                                    ? "Tell me what you want to build today..."
                                    : "Set up your API key to start creating →"
                                }
                                className="flex-1 text-base sm:text-lg text-gray-900 placeholder-gray-400 outline-none bg-transparent py-4 min-w-0"
                                disabled={isLoading}
                            />

                            {/* Settings Button */}
                            <button
                                type="button"
                                onClick={onOpenSettings}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors mr-1"
                                title="Settings"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Submit button */}
                        <div className="flex items-center justify-between px-2 pb-2">
                            <div className="text-xs text-gray-400 hidden sm:block">
                                Press Enter to send
                            </div>
                            <button
                                type="submit"
                                disabled={(!message.trim() && attachments.length === 0) || isLoading || !hasApiKey}
                                className={`
                  p-3 rounded-xl transition-all flex items-center gap-2 font-medium text-sm
                  ${(message.trim() || attachments.length > 0) && !isLoading && hasApiKey
                                        ? 'bg-gray-900 text-white hover:bg-gray-800 hover:scale-105 shadow-md active:scale-95'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                `}
                                title={!hasApiKey ? "Set up your API key to start" : "Create your app"}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Creating...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Create</span>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatGreeting;
