import React, { useMemo } from 'react';
import { ExternalLink, Monitor } from 'lucide-react';

interface PreviewProps {
    code: string;
}

const Preview: React.FC<PreviewProps> = ({ code }) => {
    const handleOpenInNewTab = () => {
        // Create a Blob with the HTML content
        const blob = new Blob([code], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        // Open in new tab
        window.open(url, '_blank');

        // Clean up the URL after a short delay
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    // Create a safe srcdoc with proper HTML structure
    const safeSrcDoc = useMemo(() => {
        // If code is empty or just whitespace, show a placeholder
        if (!code || !code.trim()) {
            return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Preview</title></head>
<body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;color:#666;background:#fafafa;">
<p>No preview available</p>
</body>
</html>`;
        }

        // Return the code as-is (should be valid HTML)
        return code;
    }, [code]);

    return (
        <div className="h-full w-full overflow-hidden rounded-[var(--radius)] border border-[hsl(var(--border))] bg-white">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-gray-700">Preview</span>
                </div>
                <button
                    onClick={handleOpenInNewTab}
                    className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    title="Open in New Tab"
                >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open
                </button>
            </div>

            {/* Iframe - sandbox without allow-same-origin to prevent navigation */}
            <iframe
                key={safeSrcDoc.length}
                srcDoc={safeSrcDoc}
                title="Preview"
                className="h-[calc(100%-41px)] w-full border-none bg-white"
                sandbox="allow-scripts allow-modals allow-forms allow-popups"
            />
        </div>
    );
};

export default Preview;
