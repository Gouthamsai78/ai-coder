import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { useToast } from './Toast';

interface PromoCodeInputProps {
    onSuccess?: (creditsAdded: number) => void;
}

export const PromoCodeInput: React.FC<PromoCodeInputProps> = ({ onSuccess }) => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const { showToast } = useToast();

    const handleRedeem = async () => {
        if (!code.trim()) return;

        setLoading(true);
        setMessage(null);

        try {
            const { data, error } = await supabase.rpc('redeem_promo_code', {
                p_code: code.trim()
            });

            if (error) throw error;

            const result = data?.[0];

            if (result?.success) {
                setMessage({ type: 'success', text: result.message });
                setCode('');
                showToast(result.message, 'success');
                onSuccess?.(result.credits_granted);
            } else {
                setMessage({ type: 'error', text: result?.message || 'Failed to redeem code' });
                showToast(result?.message || 'Invalid code', 'error');
            }
        } catch (err) {
            console.error('Failed to redeem promo code:', err);
            setMessage({ type: 'error', text: 'Failed to redeem promo code' });
            showToast('Failed to redeem code', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-2">
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                🎁 Have a Promo Code?
            </label>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Enter code..."
                    className="input flex-1 px-3 py-2 text-sm uppercase"
                    disabled={loading}
                    onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
                />
                <button
                    onClick={handleRedeem}
                    disabled={!code.trim() || loading}
                    className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
                >
                    {loading ? (
                        <span className="flex items-center gap-1">
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            ...
                        </span>
                    ) : 'Redeem'}
                </button>
            </div>
            {message && (
                <p className={`text-xs ${message.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {message.type === 'success' ? '✅' : '❌'} {message.text}
                </p>
            )}
        </div>
    );
};

export default PromoCodeInput;
