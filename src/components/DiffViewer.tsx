import React, { useMemo } from 'react';
import DiffMatchPatch from 'diff-match-patch';
import { Check, X, ArrowRight } from 'lucide-react';

interface DiffViewerProps {
    oldCode: string;
    newCode: string;
    onApply: () => void;
    onReject: () => void;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ oldCode, newCode, onApply, onReject }) => {
    const dmp = useMemo(() => new DiffMatchPatch(), []);

    const diffs = useMemo(() => {
        const d = dmp.diff_main(oldCode, newCode);
        dmp.diff_cleanupSemantic(d);
        return d;
    }, [dmp, oldCode, newCode]);

    // Stats
    const stats = useMemo(() => {
        let additions = 0;
        let deletions = 0;
        diffs.forEach(([type, text]) => {
            if (type === 1) additions += text.split('\n').length - 1 || 1;
            if (type === -1) deletions += text.split('\n').length - 1 || 1;
        });
        return { additions, deletions };
    }, [diffs]);

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
            <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] w-full max-w-full sm:max-w-4xl max-h-[90vh] sm:max-h-[80vh] flex flex-col shadow-2xl">
                {/* Header - Responsive Stack */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4 border-b border-[hsl(var(--border))]">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <h2 className="text-base sm:text-lg font-semibold">Review Changes</h2>
                        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                            <span className="text-emerald-400">+{stats.additions} additions</span>
                            <span className="text-rose-400">-{stats.deletions} deletions</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            onClick={onReject}
                            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors w-full sm:w-auto text-sm sm:text-base"
                        >
                            <X className="h-4 w-4" />
                            <span>Reject</span>
                        </button>
                        <button
                            onClick={onApply}
                            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors w-full sm:w-auto text-sm sm:text-base"
                        >
                            <Check className="h-4 w-4" />
                            <span>Apply Changes</span>
                        </button>
                    </div>
                </div>

                {/* Diff Content - Optimized for mobile scrolling */}
                <div className="flex-1 overflow-auto p-3 sm:p-4 font-mono text-xs sm:text-sm leading-relaxed">
                    <pre className="whitespace-pre-wrap break-words">
                        {diffs.map(([type, text], index) => {
                            if (type === 0) {
                                // Unchanged
                                return <span key={index} className="text-gray-400">{text}</span>;
                            } else if (type === 1) {
                                // Addition
                                return (
                                    <span
                                        key={index}
                                        className="bg-emerald-500/20 text-emerald-300 border-l-2 border-emerald-500 pl-1"
                                    >
                                        {text}
                                    </span>
                                );
                            } else {
                                // Deletion
                                return (
                                    <span
                                        key={index}
                                        className="bg-rose-500/20 text-rose-300 line-through border-l-2 border-rose-500 pl-1"
                                    >
                                        {text}
                                    </span>
                                );
                            }
                        })}
                    </pre>
                </div>

                {/* Footer - Responsive */}
                <div className="flex items-center justify-center gap-2 px-3 sm:px-6 py-2 sm:py-3 border-t border-[hsl(var(--border))] text-[10px] sm:text-xs text-[hsl(var(--muted-foreground))]">
                    <ArrowRight className="h-3 w-3" />
                    <span className="text-center">Green = Added, Red = Removed, Gray = Unchanged</span>
                </div>
            </div>
        </div>
    );
};

export default DiffViewer;
