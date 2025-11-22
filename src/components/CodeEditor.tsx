import React from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
    code: string;
    onChange: (value: string | undefined) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange }) => {
    return (
        <div className="h-full w-full overflow-hidden rounded-xl border border-gray-700/50 bg-[#1e1e1e]/50 backdrop-blur-sm">
            <div className="flex items-center justify-between bg-white/5 px-4 py-2 border-b border-gray-700/50">
                <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    Editor
                </span>
                <div className="flex space-x-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500/20 hover:bg-red-500/40 transition-colors"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500/20 hover:bg-yellow-500/40 transition-colors"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500/20 hover:bg-green-500/40 transition-colors"></div>
                </div>
            </div>
            <Editor
                height="calc(100% - 40px)"
                defaultLanguage="html"
                value={code}
                onChange={onChange}
                theme="vs-dark"
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                    padding: { top: 16 },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                    fontLigatures: true,
                    smoothScrolling: true,
                    cursorBlinking: "smooth",
                    cursorSmoothCaretAnimation: "on",
                }}
            />
        </div>
    );
};

export default CodeEditor;
