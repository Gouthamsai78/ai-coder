import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ExternalLink, Monitor, MessageSquare, Code2, Play } from 'lucide-react';

interface PreviewProps {
    code: string;
    activeTab?: 'chat' | 'code' | 'preview';
    onTabChange?: (tab: 'chat' | 'code' | 'preview') => void;
}

// Throttle window for iframe reloads during AI streaming. Each reload wipes
// the iframe's runtime state, so we only swap ~every 400ms while chunks flow,
// plus a guaranteed trailing flush when streaming ends.
const IFRAME_THROTTLE_MS = 400;

const Preview: React.FC<PreviewProps> = ({ code, activeTab, onTabChange }) => {
    // Displayed code is throttled; the editor/Monaco still streams live.
    const [displayedCode, setDisplayedCode] = useState(code);
    const lastSwapRef = useRef(0);

    useEffect(() => {
        const now = Date.now();
        const elapsed = now - lastSwapRef.current;
        const delay = elapsed >= IFRAME_THROTTLE_MS ? 0 : IFRAME_THROTTLE_MS - elapsed;
        const timeout = setTimeout(() => {
            lastSwapRef.current = Date.now();
            setDisplayedCode(code);
        }, delay);
        return () => clearTimeout(timeout);
    }, [code]);

    const handleOpenInNewTab = () => {
        const blob = new Blob([code], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    };

    // Create a safe srcdoc with proper HTML structure
    const safeSrcDoc = useMemo(() => {
        // If code is empty or just whitespace, show a placeholder
        if (!displayedCode || !displayedCode.trim()) {
            return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Preview</title></head>
<body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;color:#666;background:#fafafa;">
<p>No preview available</p>
</body>
</html>`;
        }

        // Return the code as-is (should be valid HTML)
        return displayedCode;
    }, [displayedCode]);

    return (
        <div className="h-full w-full overflow-hidden rounded-[var(--radius)] border border-[hsl(var(--border))] bg-white">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-gray-700">Preview</span>
                </div>
                <div className="flex items-center gap-2">
                    {/* Quick Navigation Toggle (Mobile Only) */}
                    {onTabChange && (
                        <div className="flex items-center gap-1 glass rounded-lg p-1 lg:hidden">
                            <button
                                onClick={() => onTabChange('chat')}
                                className={`p-1.5 rounded transition-all ${activeTab === 'chat' ? 'bg-[hsl(var(--primary))] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                title="Chat"
                            >
                                <MessageSquare className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => onTabChange('code')}
                                className={`p-1.5 rounded transition-all ${activeTab === 'code' ? 'bg-[hsl(var(--primary))] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                title="Code"
                            >
                                <Code2 className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => onTabChange('preview')}
                                className={`p-1.5 rounded transition-all ${activeTab === 'preview' ? 'bg-[hsl(var(--primary))] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                title="Preview"
                            >
                                <Play className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                    <button
                        onClick={handleOpenInNewTab}
                        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                        title="Open in New Tab"
                    >
                        <ExternalLink className="h-3.5 h-3.5" />
                        <span className="hidden sm:inline">Open</span>
                    </button>
                </div>
            </div>

            {/* Iframe - sandbox without allow-same-origin to prevent navigation */}
            <iframe
                srcDoc={safeSrcDoc}
                title="Preview"
                className="h-[calc(100%-41px)] w-full border-none bg-white"
                sandbox="allow-scripts allow-modals allow-forms allow-popups"
            />
        </div>
    );
};

export default Preview;
