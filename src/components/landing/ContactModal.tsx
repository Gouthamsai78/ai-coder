import { useState, useEffect, useCallback } from 'react';
import { X, Send, Mail, Loader2, Check, AlertTriangle, MessageCircle } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from '../../constants/emailjs';
import { analytics } from '../../utils/analytics';

const RATE_LIMIT_KEY = 'contact_rate_limit';
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const WHATSAPP_URL = 'https://chat.whatsapp.com/KywQwl2CXFmBSDHIau12Cb';

interface RateLimitState {
    count: number;
    firstSubmit: number;
}

function getRateLimit(): RateLimitState | null {
    try {
        const raw = localStorage.getItem(RATE_LIMIT_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw) as RateLimitState;
        if (Date.now() - data.firstSubmit > RATE_LIMIT_WINDOW_MS) {
            localStorage.removeItem(RATE_LIMIT_KEY);
            return null;
        }
        return data;
    } catch {
        return null;
    }
}

function incrementRateLimit(): RateLimitState {
    const existing = getRateLimit();
    if (existing) {
        const updated = { ...existing, count: existing.count + 1 };
        localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(updated));
        return updated;
    }
    const fresh: RateLimitState = { count: 1, firstSubmit: Date.now() };
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(fresh));
    return fresh;
}

function getRemainingTime(): string {
    const data = getRateLimit();
    if (!data) return '';
    const elapsed = Date.now() - data.firstSubmit;
    const remaining = RATE_LIMIT_WINDOW_MS - elapsed;
    if (remaining <= 0) return '';
    const days = Math.ceil(remaining / (24 * 60 * 60 * 1000));
    return days === 1 ? '1 day' : `${days} days`;
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error' | 'rate_limited';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<SubmitStatus>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [rateLimit, setRateLimit] = useState<RateLimitState | null>(() => getRateLimit());

    // Derive rate-limited status from current state
    const isAlreadyRateLimited = rateLimit !== null && rateLimit.count >= RATE_LIMIT_MAX;

    // Close on Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !message.trim() || !isValidEmail(email)) return;

        const current = getRateLimit();
        if (current && current.count >= RATE_LIMIT_MAX) {
            setStatus('rate_limited');
            return;
        }

        setStatus('loading');
        analytics.track('contact_submitted');

        try {
            const isConfigured = EMAILJS_CONFIG.serviceId.length > 0 && EMAILJS_CONFIG.publicKey.length > 0;

            if (isConfigured) {
                await emailjs.send(
                    EMAILJS_CONFIG.serviceId,
                    EMAILJS_CONFIG.templateId,
                    {
                        from_name: name.trim(),
                        from_email: email.trim(),
                        message: message.trim(),
                        page_url: window.location.href,
                        timestamp: new Date().toISOString(),
                        type: 'contact_us',
                    } as unknown as Record<string, unknown>,
                    EMAILJS_CONFIG.publicKey
                );
            }

            incrementRateLimit();
            setRateLimit(getRateLimit());
            setStatus('success');
            analytics.track('contact_sent');
        } catch (err) {
            setStatus('error');
            setErrorMsg(err instanceof Error ? err.message : 'Failed to send message');
            analytics.track('contact_error', { error: String(err) });
        }
    }, [name, email, message]);

    const handleClose = useCallback(() => {
        setName('');
        setEmail('');
        setMessage('');
        setStatus('idle');
        setErrorMsg('');
        onClose();
    }, [onClose]);

    const canSubmit = name.trim() && email.trim() && message.trim() && isValidEmail(email) && status !== 'loading' && status !== 'rate_limited' && !isAlreadyRateLimited;
    const remaining = getRemainingTime();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

            <div className="relative w-full max-w-md bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--border))]">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-purple-500 flex items-center justify-center">
                            <Mail className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Contact Us</h3>
                            <p className="text-[11px] text-[hsl(var(--muted-foreground))]">We&apos;d love to hear from you</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors"
                        aria-label="Close contact form"
                    >
                        <X className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5">
                    {/* WhatsApp nudge */}
                    <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                        <p className="text-xs text-green-300 leading-relaxed">
                            <strong>Limited to 3 messages per week.</strong> For quick questions or casual chat, join our{' '}
                            <a
                                href={WHATSAPP_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-green-200 transition-colors"
                                onClick={() => analytics.track('whatsapp_clicked', { source: 'contact_modal' })}
                            >
                                WhatsApp community
                            </a>
                            {' '}instead. Save this for important feedback!
                        </p>
                    </div>

                    {status === 'success' ? (
                        <div className="flex flex-col items-center py-6 text-center">
                            <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
                                <Check className="h-6 w-6 text-emerald-500" />
                            </div>
                            <p className="text-sm font-medium text-[hsl(var(--foreground))]">Message sent!</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">We&apos;ll get back to you soon.</p>
                            <button
                                onClick={handleClose}
                                className="mt-4 px-4 py-2 rounded-lg bg-[hsl(var(--secondary))] text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary)/.8)] transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    ) : status === 'rate_limited' || isAlreadyRateLimited ? (
                        <div className="flex flex-col items-center py-6 text-center">
                            <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-3">
                                <AlertTriangle className="h-6 w-6 text-amber-500" />
                            </div>
                            <p className="text-sm font-medium text-[hsl(var(--foreground))]">Rate limit reached</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                                You&apos;ve used all 3 messages this week. Try again in {remaining}.
                            </p>
                            <div className="mt-4 flex gap-3">
                                <a
                                    href={WHATSAPP_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 text-sm text-green-400 hover:bg-green-500/30 transition-colors"
                                    onClick={() => analytics.track('whatsapp_clicked', { source: 'contact_rate_limited' })}
                                >
                                    <MessageCircle className="h-4 w-4" />
                                    Join WhatsApp
                                </a>
                                <button
                                    onClick={handleClose}
                                    className="px-4 py-2 rounded-lg bg-[hsl(var(--secondary))] text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary)/.8)] transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">
                                    Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your name"
                                    className="w-full px-3 py-2.5 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground)/.5)] focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">
                                    Email <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full px-3 py-2.5 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground)/.5)] focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                                    required
                                />
                                {email && !isValidEmail(email) && (
                                    <p className="text-[11px] text-red-400 mt-1">Please enter a valid email address</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">
                                    Message <span className="text-red-400">*</span>
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Tell us what's on your mind..."
                                    className="w-full px-3 py-2.5 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground)/.5)] resize-none min-h-[100px] focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                                    rows={4}
                                    required
                                />
                            </div>

                            {status === 'error' && (
                                <p className="text-xs text-red-400">{errorMsg}</p>
                            )}

                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-all"
                            >
                                {status === 'loading' ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                                {status === 'loading' ? 'Sending...' : 'Send Message'}
                            </button>

                            <p className="text-[10px] text-[hsl(var(--muted-foreground))] text-center">
                                {RATE_LIMIT_MAX - (rateLimit?.count ?? 0)} messages remaining this week
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContactModal;
