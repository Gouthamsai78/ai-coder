import { useState } from 'react';
import { Settings, Download, Home, Plus, RefreshCw, Copy, Check, Rocket, MessageSquare, Play } from 'lucide-react';

// Components
import CodeEditor from './components/CodeEditor';
import Preview from './components/Preview';
import SettingsModal from './components/SettingsModal';
import ChatInterface from './components/ChatInterface';
import LandingPage from './components/LandingPage';
import DiffViewer from './components/DiffViewer';
import DeployModal from './components/DeployModal';
import { ToastProvider, useToast } from './components/Toast';

// Custom Hooks
import { useApiSettings } from './hooks/useApiSettings';
import { useCodeEditor } from './hooks/useCodeEditor';
import { useChat } from './hooks/useChat';
import { useAppNavigation } from './hooks/useAppNavigation';

function AppContent() {
  const { showToast } = useToast();

  // All state managed by custom hooks
  const navigation = useAppNavigation();
  const apiSettings = useApiSettings();
  const editor = useCodeEditor();
  const chat = useChat({
    apiSettings: apiSettings.settings,
    code: editor.code,
    isDefaultCode: editor.isDefault,
    setCode: editor.setCode,
    setPendingCode: editor.setPendingCode,
    pushToHistory: editor.pushToHistory,
  });

  // UI-only state
  const [copied, setCopied] = useState(false);

  // Handlers
  const handleCopy = async () => {
    const success = await editor.copy();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNewChat = () => {
    chat.clearAll();
    editor.reset();
    showToast('Started new chat (Reset All)', 'info');
  };

  // Render landing if needed
  if (navigation.showLanding) {
    return <LandingPage onGetStarted={navigation.completeLanding} />;
  }

  return (
    <div className="flex h-screen w-full flex-col bg-dot-pattern bg-glow overflow-hidden">
      {/* Header */}
      <header className="glass flex h-14 shrink-0 items-center justify-between px-6 z-10">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden">
            <img src="/logo.jpg" alt="AI Coder Logo" className="hfull w-full object-cover" />
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
              chat.clearMessages();
            }}
            className="btn-ghost flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:px-3 sm:py-2 text-sm min-h-[44px]"
            title="Clear Chat History (Keep Code)"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden xs:hidden sm:inline">Clear</span>
          </button>

          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="btn-ghost flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:px-3 sm:py-2 text-sm min-h-[44px]"
            title="New Project (Reset All)"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden xs:hidden sm:inline">New</span>
          </button>

          {/* Retry Button (show only if there was an error) */}
          {chat.lastError && !chat.isLoading && (
            <button
              onClick={chat.retry}
              className="btn-ghost flex items-center gap-2 px-3 py-2 text-sm text-amber-400 hover:text-amber-300"
              title="Retry last prompt"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Retry</span>
            </button>
          )}

          {/* Undo Button */}
          {editor.history.length > 0 && (
            <button
              onClick={editor.undo}
              className="btn-ghost flex items-center gap-2 px-3 py-2 text-sm"
              title="Undo last AI change"
            >
              <RefreshCw className="h-4 w-4 rotate-180" />
              <span className="hidden sm:inline">Undo</span>
            </button>
          )}

          {/* Copy Code Button */}
          <button
            onClick={handleCopy}
            className="btn-ghost flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:px-3 sm:py-2 text-sm"
            title="Copy Code"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <button
            onClick={navigation.goToLanding}
            className="btn-ghost flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:px-3 sm:py-2 text-sm"
            title="Back to Home"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </button>
          <button
            onClick={editor.download}
            className="btn-ghost flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:px-3 sm:py-2 text-sm"
            title="Download Code"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            onClick={navigation.openDeploy}
            className="btn-primary flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:px-3 sm:py-2 text-sm"
            title="Deploy Your App"
          >
            <Rocket className="h-4 w-4" />
            <span className="hidden sm:inline">Deploy</span>
          </button>
          <button
            onClick={navigation.openSettings}
            className="btn-ghost p-1.5 sm:p-2"
            title="Settings"
          >
            <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </header>

      {/* Settings Modal */}
      {navigation.showSettings && (
        <SettingsModal
          apiKey={apiSettings.settings.apiKey}
          setApiKey={apiSettings.setApiKey}
          selectedModel={apiSettings.settings.model}
          setSelectedModel={apiSettings.setModel}
          selectedProvider={apiSettings.settings.provider}
          setSelectedProvider={apiSettings.setProvider}
          githubToken={apiSettings.settings.githubToken}
          setGithubToken={apiSettings.setGithubToken}
          onClose={navigation.closeSettings}
        />
      )}

      {/* Deploy Modal */}
      {navigation.showDeploy && (
        <DeployModal
          code={editor.code}
          githubToken={apiSettings.settings.githubToken}
          onClose={navigation.closeDeploy}
          onOpenSettings={navigation.openSettings}
        />
      )}

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden p-4 gap-4 pb-20 lg:pb-4">
        {/* Left Panel - Chat */}
        <div className={`w-full lg:w-[400px] shrink-0 flex flex-col gap-4 ${navigation.activeTab === 'chat' ? 'flex' : 'hidden lg:flex'}`}>
          <ChatInterface
            messages={chat.messages}
            onSendMessage={chat.sendMessage}
            isLoading={chat.isLoading}
          />
        </div>

        {/* Right Panel - Editor & Preview */}
        <div className={`flex-1 flex flex-col lg:flex-row gap-4 min-w-0 ${navigation.activeTab !== 'chat' ? 'flex' : 'hidden lg:flex'}`}>
          <div className={`flex-1 overflow-hidden rounded-xl glass shadow-2xl ${navigation.activeTab === 'code' ? 'flex' : 'hidden lg:flex'}`}>
            <CodeEditor
              code={editor.code}
              onChange={(val) => editor.setCode(val || '')}
              isLoading={chat.isLoading}
              activeTab={navigation.activeTab}
              onTabChange={navigation.setActiveTab}
            />
          </div>
          <div className={`flex-1 overflow-hidden rounded-xl glass shadow-2xl ${navigation.activeTab === 'preview' ? 'flex' : 'hidden lg:flex'}`}>
            <Preview
              code={editor.code}
              activeTab={navigation.activeTab}
              onTabChange={navigation.setActiveTab}
            />
          </div>
        </div>
      </main>

      {/* Mobile Toggle Navigation */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center p-1.5 gap-1 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl z-50 lg:hidden ring-1 ring-white/10">
        <button
          onClick={() => navigation.setActiveTab('chat')}
          className={`relative px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 min-w-[100px] flex items-center justify-center gap-2 ${navigation.activeTab === 'chat'
            ? 'bg-white text-black shadow-lg shadow-white/20'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
        >
          <MessageSquare className="w-4 h-4" />
          Chat
        </button>
        <button
          onClick={() => navigation.setActiveTab('preview')}
          className={`relative px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 min-w-[100px] flex items-center justify-center gap-2 ${navigation.activeTab === 'preview' || navigation.activeTab === 'code'
            ? 'bg-[#0ea5e9] text-white shadow-lg shadow-[#0ea5e9]/20'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
        >
          <Play className="w-4 h-4" />
          Preview
        </button>
      </div>

      {/* Diff Viewer Modal */}
      {editor.pendingCode && editor.pendingCode !== editor.code && (
        <DiffViewer
          oldCode={editor.code}
          newCode={editor.pendingCode}
          onApply={editor.applyPendingCode}
          onReject={editor.rejectPendingCode}
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
