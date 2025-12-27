import { useState, useEffect, useCallback } from 'react';
import { Settings, Download, Home, Plus, RefreshCw, Copy, Check, Rocket, MessageSquare, Code2, Play } from 'lucide-react';
import CodeEditor from './components/CodeEditor';
import Preview from './components/Preview';
import SettingsModal, { AVAILABLE_MODELS } from './components/SettingsModal';
import ChatInterface from './components/ChatInterface';
import LandingPage from './components/LandingPage';
import DiffViewer from './components/DiffViewer';
import DeployModal from './components/DeployModal';
import { ToastProvider, useToast } from './components/Toast';
import { generateCodeStream } from './services/ai';
import type { ApiProvider, FileAttachment } from './types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const DEFAULT_CODE = `<!DOCTYPE html>
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
</html>`;

function AppContent() {
  const { showToast } = useToast();

  // Check if user has used the app before (has API key)
  const hasUsedBefore = () => {
    const apiKey = localStorage.getItem('ai_api_key');
    const hasVisited = localStorage.getItem('has_visited_app');
    return !!(apiKey && hasVisited);
  };

  const [showLanding, setShowLanding] = useState(!hasUsedBefore());
  const [code, setCode] = useState<string>(() => {
    const savedCode = localStorage.getItem('saved_code');
    return savedCode && savedCode.length > 100 ? savedCode : DEFAULT_CODE;
  });
  const [codeHistory, setCodeHistory] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('chat_messages');
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<ApiProvider>(() =>
    (localStorage.getItem('selected_provider') as ApiProvider) || 'google'
  );
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('ai_api_key') || '');
  const [selectedModel, setSelectedModel] = useState(() =>
    localStorage.getItem('selected_model') || AVAILABLE_MODELS[selectedProvider][0].id
  );
  const [showSettings, setShowSettings] = useState(false);
  const [showDeploy, setShowDeploy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pendingCode, setPendingCode] = useState<string | null>(null); // For diff review
  const [githubToken, setGithubToken] = useState(() => localStorage.getItem('github_token') || '');
  const [activeTab, setActiveTab] = useState<'chat' | 'code' | 'preview'>('chat');

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('ai_api_key', apiKey);
    }
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('selected_provider', selectedProvider);
  }, [selectedProvider]);

  useEffect(() => {
    localStorage.setItem('selected_model', selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    localStorage.setItem('chat_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('saved_code', code);
  }, [code]);

  useEffect(() => {
    if (githubToken) {
      localStorage.setItem('github_token', githubToken);
    }
  }, [githubToken]);

  const handleSendMessage = useCallback(async (message: string, attachments?: FileAttachment[]) => {
    if (!apiKey) {
      const providerName = selectedProvider === 'google' ? 'Google AI Studio' : 'OpenRouter';
      setMessages(prev => [...prev, { role: 'user', content: message }, { role: 'assistant', content: `Please set your ${providerName} API Key in settings first.` }]);
      setShowSettings(true);
      return;
    }

    setLastPrompt(message);
    setLastError(null);
    const newMessages = [...messages, { role: 'user', content: message } as Message];
    setMessages(newMessages);
    setIsLoading(true);

    // Detect if this is a NEW build (default code) or MODIFICATION (existing project)
    const isNewBuild = code.trim() === DEFAULT_CODE.trim();

    // Save current code to history before AI changes it (only for modifications)
    if (!isNewBuild) {
      setCodeHistory(prev => [...prev.slice(-4), code]);
    }

    // Add a temporary assistant message showing generating status
    setMessages(prev => [...prev, { role: 'assistant', content: '⏳ Generating code...' }]);

    try {
      let accumulatedCode = '';

      const result = await generateCodeStream(apiKey, selectedModel, newMessages, code, (chunk) => {
        accumulatedCode += chunk;
        // For NEW builds, stream directly to editor
        if (isNewBuild) {
          setCode(accumulatedCode);
        }
      }, selectedProvider, attachments);

      if (isNewBuild) {
        // For new builds, apply final cleaned code directly
        setCode(result.code);
        setMessages(prev => {
          const newMsgs = [...prev];
          const lastMsg = newMsgs[newMsgs.length - 1];
          if (lastMsg.role === 'assistant') {
            lastMsg.content = result.summary;
          }
          return newMsgs;
        });
        showToast('Code generated successfully!', 'success');
      } else {
        // For modifications, show diff for review
        setPendingCode(result.code);
        setMessages(prev => {
          const newMsgs = [...prev];
          const lastMsg = newMsgs[newMsgs.length - 1];
          if (lastMsg.role === 'assistant') {
            lastMsg.content = result.summary + '\n\n📝 Review the diff and click Apply to accept changes.';
          }
          return newMsgs;
        });
        showToast('Review the diff before applying', 'info');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setLastError(errorMessage);

      // Remove the empty assistant message
      setMessages(prev => prev.slice(0, -1));

      // Show more specific error
      const friendlyError = errorMessage.includes('401')
        ? 'Invalid API key. Please check your settings.'
        : errorMessage.includes('429')
          ? 'Rate limit exceeded. Please wait a moment and try again.'
          : errorMessage.includes('400')
            ? 'Bad request. The model may not support this request format.'
            : 'Something went wrong. Check console for details.';

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Error: ${friendlyError}\n\nClick "Retry" to try again, or check Settings if the issue persists.`
      }]);

      showToast(friendlyError, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, selectedProvider, selectedModel, messages, code, showToast]);

  const handleRetry = useCallback(() => {
    if (lastPrompt && !isLoading) {
      // Remove the last error message
      setMessages(prev => prev.slice(0, -2));
      handleSendMessage(lastPrompt);
    }
  }, [lastPrompt, isLoading, handleSendMessage]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setCode(DEFAULT_CODE);
    setCodeHistory([]);
    setLastError(null);
    setLastPrompt('');
    localStorage.removeItem('chat_messages');
    setPendingCode(null);
    showToast('Started new chat (Reset All)', 'info');
  }, [showToast]);

  // Diff handlers
  const handleApplyDiff = useCallback(() => {
    if (pendingCode) {
      setCode(pendingCode);
      setPendingCode(null);
      showToast('Changes applied!', 'success');
    }
  }, [pendingCode, showToast]);

  const handleRejectDiff = useCallback(() => {
    setPendingCode(null);
    showToast('Changes rejected', 'info');
  }, [showToast]);

  const handleUndo = useCallback(() => {
    if (codeHistory.length > 0) {
      const previousCode = codeHistory[codeHistory.length - 1];
      setCodeHistory(prev => prev.slice(0, -1));
      setCode(previousCode);
      showToast('Restored previous code', 'info');
    }
  }, [codeHistory, showToast]);

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast('Code copied to clipboard', 'success');
    } catch (err) {
      showToast('Failed to copy code', 'error');
    }
  }, [code, showToast]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Code downloaded!', 'success');
  }, [code, showToast]);

  const handleGetStarted = () => {
    localStorage.setItem('has_visited_app', 'true');
    setShowLanding(false);
  };

  if (showLanding) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  return (
    <div className="flex h-screen w-full flex-col bg-dot-pattern bg-glow overflow-hidden">
      {/* Header */}
      <header className="glass flex h-14 shrink-0 items-center justify-between px-6 z-10">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden">
            <img src="/logo.jpg" alt="AI Coder Logo" className="h-full w-full object-cover" />
          </div>
          <div>
            <h1 className="font-semibold text-base tracking-tight hidden sm:block">
              AI Coder
            </h1>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))] hidden sm:block">by Goutham Sai</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Clear Chat Button */}
          <button
            onClick={() => {
              setMessages([]);
              setLastError(null);
              showToast('Chat history cleared (Code preserved)', 'info');
            }}
            className="btn-ghost flex items-center gap-2 px-3 py-2 text-sm"
            title="Clear Chat History (Keep Code)"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Clear</span>
          </button>

          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="btn-ghost flex items-center gap-2 px-3 py-2 text-sm"
            title="New Project (Reset All)"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New</span>
          </button>

          {/* Retry Button (show only if there was an error) */}
          {lastError && !isLoading && (
            <button
              onClick={handleRetry}
              className="btn-ghost flex items-center gap-2 px-3 py-2 text-sm text-amber-400 hover:text-amber-300"
              title="Retry last prompt"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Retry</span>
            </button>
          )}

          {/* Undo Button */}
          {codeHistory.length > 0 && (
            <button
              onClick={handleUndo}
              className="btn-ghost flex items-center gap-2 px-3 py-2 text-sm"
              title="Undo last AI change"
            >
              <RefreshCw className="h-4 w-4 rotate-180" />
              <span className="hidden sm:inline">Undo</span>
            </button>
          )}

          {/* Copy Code Button */}
          <button
            onClick={handleCopyCode}
            className="btn-ghost flex items-center gap-2 px-3 py-2 text-sm"
            title="Copy Code"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <button
            onClick={() => setShowLanding(true)}
            className="btn-ghost flex items-center gap-2 px-3 py-2 text-sm"
            title="Back to Home"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </button>
          <button
            onClick={handleDownload}
            className="btn-ghost flex items-center gap-2 px-3 py-2 text-sm"
            title="Download Code"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            onClick={() => setShowDeploy(true)}
            className="btn-primary flex items-center gap-2 px-3 py-2 text-sm"
            title="Deploy Your App"
          >
            <Rocket className="h-4 w-4" />
            <span className="hidden sm:inline">Deploy</span>
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="btn-ghost p-2"
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          apiKey={apiKey}
          setApiKey={setApiKey}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          selectedProvider={selectedProvider}
          setSelectedProvider={setSelectedProvider}
          githubToken={githubToken}
          setGithubToken={setGithubToken}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Deploy Modal */}
      {showDeploy && (
        <DeployModal
          code={code}
          githubToken={githubToken}
          onClose={() => setShowDeploy(false)}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden p-4 gap-4 pb-20 lg:pb-4">
        {/* Left Panel - Chat */}
        <div className={`w-full lg:w-[400px] shrink-0 flex flex-col gap-4 ${activeTab === 'chat' ? 'flex' : 'hidden lg:flex'}`}>
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>

        {/* Right Panel - Editor & Preview */}
        <div className={`flex-1 flex flex-col lg:flex-row gap-4 min-w-0 ${activeTab !== 'chat' ? 'flex' : 'hidden lg:flex'}`}>
          <div className={`flex-1 overflow-hidden rounded-xl glass shadow-2xl ${activeTab === 'code' ? 'flex' : 'hidden lg:flex'}`}>
            <CodeEditor code={code} onChange={(val) => setCode(val || '')} isLoading={isLoading} />
          </div>
          <div className={`flex-1 overflow-hidden rounded-xl glass shadow-2xl ${activeTab === 'preview' ? 'flex' : 'hidden lg:flex'}`}>
            <Preview code={code} />
          </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-4 left-4 right-4 h-16 glass rounded-2xl flex lg:hidden items-center justify-around px-2 z-50 border border-[hsl(var(--border))] shadow-2xl">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 rounded-xl transition-all ${activeTab === 'chat' ? 'text-[hsl(var(--primary))] bg-[hsl(var(--primary))/10]' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}
        >
          <MessageSquare className="h-5 w-5" />
          <span className="text-[10px] font-medium">Chat</span>
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 rounded-xl transition-all ${activeTab === 'code' ? 'text-[hsl(var(--primary))] bg-[hsl(var(--primary))/10]' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}
        >
          <Code2 className="h-5 w-5" />
          <span className="text-[10px] font-medium">Code</span>
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 rounded-xl transition-all ${activeTab === 'preview' ? 'text-[hsl(var(--primary))] bg-[hsl(var(--primary))/10]' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}
        >
          <Play className="h-5 w-5" />
          <span className="text-[10px] font-medium">Preview</span>
        </button>
      </nav>

      {/* Diff Viewer Modal */}
      {pendingCode && pendingCode !== code && (
        <DiffViewer
          oldCode={code}
          newCode={pendingCode}
          onApply={handleApplyDiff}
          onReject={handleRejectDiff}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
