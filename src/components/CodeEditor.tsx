import React, { useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Code2, Copy, Check } from 'lucide-react';

interface CodeEditorProps {
    code: string;
    onChange: (value: string | undefined) => void;
    isLoading?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, isLoading: _isLoading }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    }, [code]);

    // Format file size
    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="h-full w-full overflow-hidden card">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[hsl(var(--border))]">
                <div className="flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-[hsl(var(--primary))]" />
                    <span className="text-sm font-medium">Editor</span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))] ml-2">
                        {formatSize(new Blob([code]).size)}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {/* Copy Button */}
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs rounded hover:bg-[hsl(var(--accent))] transition-colors"
                        title="Copy code"
                    >
                        {copied ? (
                            <>
                                <Check className="h-3 w-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                            </>
                        ) : (
                            <>
                                <Copy className="h-3 w-3 text-[hsl(var(--muted-foreground))]" />
                                <span className="text-[hsl(var(--muted-foreground))]">Copy</span>
                            </>
                        )}
                    </button>
                    {/* Traffic lights */}
                    <div className="flex space-x-1.5">
                        <div className="h-3 w-3 rounded-full bg-[hsl(var(--destructive))] opacity-50"></div>
                        <div className="h-3 w-3 rounded-full bg-yellow-500/50"></div>
                        <div className="h-3 w-3 rounded-full bg-emerald-500/50"></div>
                    </div>
                </div>
            </div>

            {/* Editor */}
            <div className="relative h-[calc(100%-41px)]">
                <Editor
                    height="100%"
                    defaultLanguage="html"
                    value={code}
                    onChange={onChange}
                    theme="vs-dark"
                    options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        wordWrap: 'on',
                        padding: { top: 16, bottom: 16 },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                        fontLigatures: true,
                        smoothScrolling: true,
                        cursorBlinking: "smooth",
                        cursorSmoothCaretAnimation: "on",
                        lineNumbers: 'on',
                        renderLineHighlight: 'line',
                        scrollbar: {
                            verticalScrollbarSize: 6,
                            horizontalScrollbarSize: 6,
                        }
                    }}
                />
            </div>
        </div>
    );
};

export default CodeEditor;
