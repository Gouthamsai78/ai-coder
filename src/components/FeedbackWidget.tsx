import { useState, useEffect, useCallback } from 'react';
import { X, Flame, MessageCircle } from 'lucide-react';
import FeedbackPrompt from './FeedbackPrompt';
import { analytics } from '../utils/analytics';

const YOUTUBE_VIDEO_URL = 'https://youtu.be/oLGHMdPOyzg?si=2SZbezYZ8nRJiKaG';
const WHATSAPP_URL = 'https://chat.whatsapp.com/KywQwl2CXFmBSDHIau12Cb';

type ModalView = 'choose' | 'feedback';

const FeedbackWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<ModalView>('choose');
    const [hasShownTooltip, setHasShownTooltip] = useState(false);

    const handleOpen = useCallback(() => {
        setIsOpen(true);
        setView('choose');
        analytics.track('feedback_widget_opened');
    }, []);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setView('choose');
    }, []);

    const handleJoinCommunity = useCallback(() => {
        analytics.track('whatsapp_clicked', { source: 'roast_us_modal' });
        window.open(WHATSAPP_URL, '_blank', 'noopener,noreferrer');
    }, []);

    const handleProceedToFeedback = useCallback(() => {
        setView('feedback');
        analytics.track('feedback_proceed_confirmed');
    }, []);

    // Show subtle tooltip after 5s delay on first visit
    useEffect(() => {
        if (hasShownTooltip) return;
        const timer = setTimeout(() => {
            setHasShownTooltip(true);
        }, 5000);
        return () => clearTimeout(timer);
    }, [hasShownTooltip]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen]);

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={handleOpen}
                className="fixed z-[100] flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-orange-500 to-purple-500 text-white text-sm font-medium shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105 active:scale-95 transition-all duration-200"
                style={{
                    bottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))',
                    right: '1.5rem',
                }}
                aria-label="Give feedback"
            >
                <Flame className="h-4 w-4" />
                <span className="hidden sm:inline">Roast us!</span>
            </button>

            {/* Tooltip nudge */}
            {hasShownTooltip && !isOpen && (
                <div
                    className="fixed z-[100] px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 text-xs text-white/70 animate-pulse pointer-events-none"
                    style={{
                        bottom: 'max(4.5rem, env(safe-area-inset-bottom, 4.5rem))',
                        right: '1.5rem',
                    }}
                >
                    Got feedback? 🔥
                </div>
            )}

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    {/* Modal Content */}
                    <div className="relative w-full max-w-md bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--border))]">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-purple-500 flex items-center justify-center">
                                    <Flame className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Roast us!</h3>
                                    <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Tell us what sucked — we can take it.</p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors"
                                aria-label="Close feedback"
                            >
                                <X className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                            </button>
                        </div>

                        {/* Body */}
                        {view === 'choose' ? (
                            <div className="p-5 space-y-4">
                                <p className="text-sm text-[hsl(var(--foreground))] text-center">
                                    Before you roast us — what kind of feedback do you have?
                                </p>

                                {/* Join Community Option */}
                                <button
                                    onClick={handleJoinCommunity}
                                    className="w-full flex items-center gap-3 p-4 rounded-xl border border-green-500/20 bg-green-500/5 hover:bg-green-500/10 transition-colors text-left group"
                                >
                                    <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                                        <MessageCircle className="h-5 w-5 text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[hsl(var(--foreground))] group-hover:text-green-400 transition-colors">
                                            Join our Community
                                        </p>
                                        <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                                            Chat, ask questions, or share quick thoughts on WhatsApp
                                        </p>
                                    </div>
                                </button>

                                {/* Serious Feedback Option */}
                                <button
                                    onClick={handleProceedToFeedback}
                                    className="w-full flex items-center gap-3 p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10 transition-colors text-left group"
                                >
                                    <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
                                        <Flame className="h-5 w-5 text-orange-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[hsl(var(--foreground))] group-hover:text-orange-400 transition-colors">
                                            Yes, I have serious feedback
                                        </p>
                                        <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                                            Bug reports, feature requests, or detailed criticism
                                        </p>
                                    </div>
                                </button>

                                <p className="text-[10px] text-[hsl(var(--muted-foreground))] text-center">
                                    Please save feedback for important stuff — we limit submissions to keep quality high.
                                </p>
                            </div>
                        ) : (
                            <div className="p-1">
                                <FeedbackPrompt onDismiss={handleClose} />
                            </div>
                        )}

                        {/* Footer */}
                        <div className="px-5 py-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--secondary)/.3)]">
                            <a
                                href={YOUTUBE_VIDEO_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-[hsl(var(--border))] text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))] transition-colors"
                                onClick={() => analytics.track('see_how_it_works_clicked', { source: 'feedback_modal' })}
                            >
                                <svg className="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                </svg>
                                See How It Works
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default FeedbackWidget;
