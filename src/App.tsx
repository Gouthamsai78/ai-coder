import { useState, useEffect } from 'react';
import { Settings, Code2, Download } from 'lucide-react';
import CodeEditor from './components/CodeEditor';
import Preview from './components/Preview';
import ChatInterface from './components/ChatInterface';
import { generateCodeStream } from './services/ai';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function App() {
  const [code, setCode] = useState<string>(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Coder Preview</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 1rem;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        }
        h1 { font-size: 2.5rem; margin-bottom: 1rem; }
        p { font-size: 1.2rem; opacity: 0.9; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to AI Coder</h1>
        <p>Describe what you want to build in the chat!</p>
    </div>
</body>
</html>`);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openrouter_api_key') || '');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('openrouter_api_key', apiKey);
    }
  }, [apiKey]);

  const handleSendMessage = async (message: string) => {
    if (!apiKey) {
      setMessages(prev => [...prev, { role: 'user', content: message }, { role: 'assistant', content: 'Please set your OpenRouter API Key in settings first.' }]);
      setShowSettings(true);
      return;
    }

    const newMessages = [...messages, { role: 'user', content: message } as Message];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      setCode('');

      let accumulatedCode = '';

      const result = await generateCodeStream(apiKey, newMessages, code, (chunk) => {
        accumulatedCode += chunk;
        setCode(accumulatedCode);
      });

      // Set the final cleaned code
      setCode(result.code);

      // Add the AI's summary to the chat
      setMessages(prev => [...prev, { role: 'assistant', content: result.summary }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please check your API key and try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen w-full flex-col bg-[#0f0f0f] text-white overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-[#0f0f0f] to-black">
      {/* Header */}
      <header className="glass flex h-16 shrink-0 items-center justify-between px-6 z-10 relative">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-blue-500/20">
            <Code2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              AI Coder
            </h1>
            <span className="text-xs text-gray-500 font-medium">by Goutham Sai</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleDownload}
            className="glass glass-hover flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-all duration-200"
            title="Download Code"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="glass glass-hover rounded-lg p-2.5 text-gray-400 hover:text-white transition-all duration-200"
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute right-6 top-20 z-50 w-80 rounded-xl glass p-5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <h3 className="mb-3 text-sm font-semibold text-gray-200 flex items-center gap-2">
            <Settings className="h-4 w-4 text-blue-400" />
            API Configuration
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1.5">OpenRouter API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-..."
                className="w-full rounded-lg border border-gray-700/50 bg-black/30 px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <p className="text-xs text-gray-500">
              Get your key from <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">openrouter.ai</a>
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden p-4 gap-4">
        {/* Left Panel - Chat */}
        <div className="w-[400px] shrink-0 flex flex-col gap-4">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>

        {/* Right Panel - Editor & Preview */}
        <div className="flex flex-1 gap-4 min-w-0">
          <div className="flex-1 overflow-hidden rounded-xl glass shadow-2xl">
            <CodeEditor code={code} onChange={(val) => setCode(val || '')} />
          </div>
          <div className="flex-1 overflow-hidden rounded-xl glass shadow-2xl">
            <Preview code={code} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
