import React from 'react';
import { ExternalLink } from 'lucide-react';

interface PreviewProps {
    code: string;
}

const Preview: React.FC<PreviewProps> = ({ code }) => {
    const handleOpenInNewTab = () => {
        const newWindow = window.open();
        if (newWindow) {
            newWindow.document.write(code);
            newWindow.document.close();
        }
    };

    return (
        <div className="h-full w-full overflow-hidden rounded-xl border border-gray-700/50 bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-gray-50 px-4 py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    Live Preview
                </span>
                <button
                    onClick={handleOpenInNewTab}
                    className="flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 hover:text-gray-900 border border-gray-200 transition-colors"
                    title="Open in New Tab"
                >
                    <ExternalLink className="h-3 w-3" />
                    Open New Tab
                </button>
            </div>
            <iframe
                srcDoc={code}
                title="Preview"
                className="h-[calc(100%-40px)] w-full border-none bg-white"
                sandbox="allow-scripts allow-same-origin allow-modals"
            />
        </div>
    );
};

export default Preview;
