/**
 * Credits Display Badge
 * 
 * Shows remaining credits for users who are using the platform's free credits.
 * Only visible when user is authenticated but has no API key configured.
 */

import React from 'react';
import { Zap } from 'lucide-react';

interface CreditsDisplayProps {
    credits: number;
}

const CreditsDisplay: React.FC<CreditsDisplayProps> = ({ credits }) => {
    const getColorClass = () => {
        if (credits >= 3) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (credits >= 1) return 'bg-amber-50 text-amber-700 border-amber-200';
        return 'bg-rose-50 text-rose-700 border-rose-200';
    };

    return (
        <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${getColorClass()} text-sm font-medium`}
            title="Free credits remaining • Add your API key for unlimited use"
        >
            <Zap className="w-3.5 h-3.5" />
            <span>{credits} {credits === 1 ? 'credit' : 'credits'} left</span>
        </div>
    );
};

export default CreditsDisplay;
