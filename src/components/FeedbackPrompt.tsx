import { useState } from 'react';
import { Send, X, MessageSquare, Loader2, Check } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG, type FeedbackTemplateParams } from '../constants/emailjs';
import { analytics } from '../utils/analytics';

interface FeedbackPromptProps {
    onDismiss: () => void;
}

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

const FeedbackPrompt: React.FC<FeedbackPromptProps> = ({ onDismiss }) => {
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<SubmitStatus>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const isConfigured = EMAILJS_CONFIG.serviceId.length > 0 && EMAILJS_CONFIG.publicKey.length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setStatus('loading');
        analytics.track('feedback_submitted');

        try {
            if (isConfigured) {
                const templateParams: FeedbackTemplateParams = {
                    from_name: email || 'Anonymous',
                    from_email: email,
                    message: message.trim(),
                    page_url: window.location.href,
                    timestamp: new Date().toISOString(),
                };

                await emailjs.send(
                    EMAILJS_CONFIG.serviceId,
                    EMAILJS_CONFIG.templateId,
                    templateParams as unknown as Record<string, unknown>,
                    EMAILJS_CONFIG.publicKey
                );
            }

            setStatus('success');
            analytics.track('feedback_sent');

            setTimeout(() => {
                onDismiss();
            }, 2000);
        } catch (err) {
            setStatus('error');
            setErrorMsg(err instanceof Error ? err.message : 'Failed to send feedback');
            analytics.track('feedback_error', { error: String(err) });
        }
    };

    return (
        <div className="mx-2 mb-4 p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-purple-500/10 border border-orange-500/20 relative">
            <button
                onClick={onDismiss}
                className="absolute top-2 right-2 p-1 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Dismiss feedback prompt"
            >
                <X className="h-3.5 w-3.5 text-gray-400" />
            </button>

            {status === 'success' ? (
                <div className="flex flex-col items-center py-4 text-center">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
                        <Check className="h-5 w-5 text-emerald-500" />
                    </div>
                    <p className="text-sm font-medium text-[hsl(var(--foreground))]">Thanks for the feedback!</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">We read every message.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-7 w-7 rounded-lg bg-orange-500/20 flex items-center justify-center">
                            <MessageSquare className="h-3.5 w-3.5 text-orange-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-[hsl(var(--foreground))]">Roast us!</p>
                            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Tell us what sucked — we can take it.</p>
                        </div>
                    </div>

                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="This UI is confusing because... The code quality was... I wish it could..."
                        className="w-full px-3 py-2 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground)/.5)] resize-none min-h-[80px] focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                        rows={3}
                    />

                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Your email (optional, for follow-up)"
                        className="w-full px-3 py-2 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground)/.5)] focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                    />

                    {status === 'error' && (
                        <p className="text-xs text-red-400">{errorMsg}</p>
                    )}

                    <button
                        type="submit"
                        disabled={!message.trim() || status === 'loading'}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-all"
                    >
                        {status === 'loading' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                        {status === 'loading' ? 'Sending...' : 'Send Feedback'}
                    </button>

                    {!isConfigured && (
                        <p className="text-[10px] text-amber-500/70 text-center">
                            EmailJS not configured yet. Set up at emailjs.com
                        </p>
                    )}
                </form>
            )}
        </div>
    );
};

export default FeedbackPrompt;
