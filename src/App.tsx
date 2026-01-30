import { useState, useEffect } from 'react';
import { Menu, Copy, Check, Download, ArrowLeft, RefreshCw, Rocket, MessageSquare, Code, Play } from 'lucide-react';

// Layout Components
import Sidebar from './components/layout/Sidebar';

// Chat Components
import ChatGreeting from './components/chat/ChatGreeting';
import ChatInterface from './components/ChatInterface';

// Editor & Preview
import CodeEditor from './components/CodeEditor';
import Preview from './components/Preview';

// Modals
import SettingsModal from './components/SettingsModal';
import DeployModal from './components/DeployModal';
import DiffViewer from './components/DiffViewer';

// UI Components
import { ToastProvider, useToast } from './components/Toast';

// Custom Hooks
import { useApiSettings } from './hooks/useApiSettings';
import { useCodeEditor } from './hooks/useCodeEditor';
import { useChat } from './hooks/useChat';
import { useAppNavigation } from './hooks/useAppNavigation';

// Services
import { projectsApi, trainingDataApi, authApi, creditsApi, adminApi } from './services/supabase';
import type { Project } from './services/supabase';
import type { FileAttachment } from './types';

// Auth & Credits
import AuthPromptModal from './components/AuthPromptModal';
import { AdminDashboard } from './components/AdminDashboard';
import CreditsDisplay from './components/CreditsDisplay';

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
    onCreditDeducted: async () => {
      // Deduct credits after AI Coder generation
      if (user && credits > 0) {
        try {
          const newCredits = await creditsApi.deductCredits(1);
          setCredits(newCredits);
        } catch (err) {
          console.error('Failed to deduct credits:', err);
        }
      }
    },
  });

  // UI state
  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<string | null>(null);
  const [user, setUser] = useState<{ email?: string; user_metadata?: { name?: string; avatar_url?: string } } | null>(null);
  const [viewMode, setViewMode] = useState<'welcome' | 'editor'>('welcome');

  // Credits & Auth
  const [credits, setCredits] = useState<number>(0);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

  // AI Coder API key from environment (used for Google Auth users with free credits)
  const aicoderApiKey = import.meta.env.VITE_IFLOW_API_KEY || '';

  // Auto-select AI Coder provider for Google Auth users without their own API key
  useEffect(() => {
    if (user && !apiSettings.settings.apiKey && credits > 0 && aicoderApiKey) {
      // User is signed in, has credits, but no custom API key - use AI Coder's built-in provider
      if (apiSettings.settings.provider !== 'aicoder') {
        apiSettings.setProvider('aicoder');
        apiSettings.setApiKey(aicoderApiKey);
      }
    }
  }, [user, credits, apiSettings, aicoderApiKey]);

  // Load projects
  const loadProjects = async () => {
    try {
      const data = await projectsApi.list();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  // Auth state listener
  useEffect(() => {
    const { data: { subscription } } = authApi.onAuthStateChange(async (u) => {
      setUser(u as typeof user);
      if (u) {
        loadProjects();
        // Initialize and load credits
        try {
          await creditsApi.initializeCredits();
          const userCredits = await creditsApi.getCredits();
          setCredits(userCredits);
        } catch (err) {
          console.error('Failed to initialize/load credits:', err);
        }
      }
    });

    // Check initial auth state
    authApi.getUser().then(async (data) => {
      setUser(data.user as typeof user);
      if (data.user) {
        loadProjects();
        try {
          const userCredits = await creditsApi.getCredits();
          setCredits(userCredits);
          // Check if user is admin
          const adminStatus = await adminApi.isAdmin();
          setIsAdmin(adminStatus);
        } catch (err) {
          console.error('Failed to load credits:', err);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-save project every 30 seconds
  useEffect(() => {
    if (!currentProject || !user || editor.isDefault) return;

    const autoSaveInterval = setInterval(async () => {
      try {
        await projectsApi.update(currentProject, {
          code: editor.code,
          chat_history: chat.messages,
        });
        console.log('Auto-saved project');
      } catch (err) {
        console.error('Auto-save failed:', err);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [currentProject, editor.code, chat.messages, user, editor.isDefault]);

  // Save code and training data AFTER AI generation completes
  useEffect(() => {
    // Skip if no messages or still on default code
    if (chat.messages.length === 0 || editor.isDefault || !user) return;

    // Get the last assistant message (AI response)
    const lastMessage = chat.messages[chat.messages.length - 1];
    if (lastMessage.role !== 'assistant') return;

    // Helper to check if error should be logged (ignore AbortError from HMR)
    const shouldLogError = (err: unknown): boolean => {
      if (err && typeof err === 'object' && 'message' in err) {
        const message = String((err as { message: string }).message);
        // Ignore abort errors (caused by HMR/hot reload)
        return !message.includes('AbortError') && !message.includes('aborted');
      }
      return true;
    };

    // Save to project
    if (currentProject) {
      projectsApi.update(currentProject, {
        code: editor.code,
        chat_history: chat.messages,
      }).catch(err => {
        if (shouldLogError(err)) console.error('Failed to save project:', err);
      });
    }

    // Save training data
    const userMessage = chat.messages[chat.messages.length - 2];
    if (userMessage && userMessage.role === 'user') {
      trainingDataApi.save({
        prompt: userMessage.content,
        context_code: chat.messages.length > 2 ? editor.code : null,
        generated_code: editor.code,
        model_used: apiSettings.settings.model,
        provider: apiSettings.settings.provider,
        project_id: currentProject || undefined,
        is_accepted: true,
      }).catch(err => {
        if (shouldLogError(err)) console.error('Failed to save training data:', err);
      });
    }
  }, [chat.messages, editor.code, currentProject, user, editor.isDefault, apiSettings.settings.model, apiSettings.settings.provider]);

  // Handlers
  const handleCopy = async () => {
    const success = await editor.copy();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNewProject = () => {
    chat.clearAll();
    editor.reset();
    setCurrentProject(null);
    setViewMode('welcome');
    setSidebarOpen(false);
    showToast('Started new project', 'info');
  };

  const handleSelectProject = async (id: string) => {
    try {
      const project = await projectsApi.get(id);
      if (project) {
        editor.setCode(project.code);

        // Restore chat history if available
        if (project.chat_history && Array.isArray(project.chat_history)) {
          chat.restoreMessages(project.chat_history);
        } else {
          chat.clearAll();
        }

        setCurrentProject(id);
        setViewMode('editor');
        setSidebarOpen(false);
      }
    } catch (err) {
      console.error('Failed to load project:', err);
      showToast('Failed to load project', 'error');
    }
  };

  const handleSendMessage = async (message: string, attachments?: FileAttachment[]) => {
    // Check if user has API key OR is authenticated
    const hasApiKey = apiSettings.settings.apiKey;
    const isAuthenticated = user !== null;

    // If neither, show auth prompt
    if (!hasApiKey && !isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }

    // If authenticated but no API key, check credits
    if (isAuthenticated && !hasApiKey) {
      if (credits <= 0) {
        showToast('Out of credits! Add your API key for unlimited use', 'error');
        navigation.openSettings();
        return;
      }
    }

    // Switch to editor view when user sends first message
    setViewMode('editor');

    // Auto-create project if this is the first message and user is logged in
    if (!currentProject && user && chat.messages.length === 0) {
      try {
        // Get current user for user_id
        const authData = await authApi.getUser();
        if (!authData?.user?.id) {
          console.error('No user ID available');
          return;
        }

        const projectName = message.slice(0, 50).replace(/[^a-zA-Z0-9 ]/g, '') || 'Untitled Project';
        const newProject = await projectsApi.create({
          user_id: authData.user.id,
          name: projectName,
          code: editor.code,
          chat_history: [],
          is_public: false,
        });
        setCurrentProject(newProject.id);
        setProjects(prev => [newProject, ...prev]);
        showToast('Project created', 'success');
      } catch (err) {
        console.error('Failed to create project:', err);
      }
    }

    // Send message through chat hook
    await chat.sendMessage(message, attachments);

    // Deduct credits if using platform API (authenticated but no API key)
    if (isAuthenticated && !hasApiKey) {
      try {
        const newCredits = await creditsApi.deductCredits(1);
        setCredits(newCredits);
      } catch (err) {
        console.error('Failed to deduct credits:', err);
      }
    }

    // NOTE: Code and training data will be saved AFTER generation completes
    // See useEffect hook that watches chat.messages changes
  };

  // Determine what to show
  const isWelcomeScreen = viewMode === 'welcome' && chat.messages.length === 0;

  return (
    <div className="flex h-screen w-full bg-white light" data-theme="light">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        projects={projects}
        currentProject={currentProject}
        onSelectProject={handleSelectProject}
        onNewProject={handleNewProject}
        user={user}
        onSignIn={async () => {
          try {
            await authApi.signInWithGoogle();
          } catch {
            showToast('Failed to sign in', 'error');
          }
        }}
        onSignOut={async () => {
          await authApi.signOut();
          setUser(null);
          setCredits(0);
          setIsAdmin(false);
          showToast('Signed out successfully', 'success');
        }}
        onOpenSettings={navigation.openSettings}
        isAdmin={isAdmin}
        onOpenAdmin={() => setShowAdminDashboard(true)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - Only show in editor mode or on desktop */}
        {(!isWelcomeScreen || window.innerWidth >= 1024) && (
          <header className="flex h-14 shrink-0 items-center justify-between px-4 border-b border-gray-200 bg-white z-10">
            <div className="flex items-center gap-3">
              {/* Menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Back button on mobile editor view */}
              {!isWelcomeScreen && (
                <button
                  onClick={() => setViewMode('welcome')}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors lg:hidden"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}

              {/* Logo */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg overflow-hidden">
                  <img src="/logo.jpg" alt="AI Coder" className="w-full h-full object-cover" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="font-semibold text-gray-900 text-sm">AI Coder</h1>
                  <span className="text-xs text-gray-500">by Goutham Sai</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Credits Badge - in header next to user */}
              {user && !apiSettings.settings.apiKey && credits > 0 && (
                <CreditsDisplay credits={credits} />
              )}

              {/* Clear Chat */}
              <button
                onClick={() => chat.clearMessages()}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                title="Clear Chat"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {/* Copy Code */}
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                title="Copy Code"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>

              {/* Download */}
              <button
                onClick={editor.download}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>

              {/* Deploy */}
              <button
                onClick={navigation.openDeploy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                title="Deploy"
              >
                <Rocket className="w-4 h-4" />
                <span className="hidden sm:inline">Deploy</span>
              </button>
            </div>
          </header>
        )}

        {/* Main Area */}
        <main className="flex-1 flex overflow-hidden">
          {isWelcomeScreen ? (
            /* Welcome Screen with Gradient */
            <div className="flex-1 flex flex-col relative">
              {/* Menu button on welcome screen */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="absolute top-4 left-4 p-2 rounded-lg hover:bg-white/50 text-gray-700 transition-colors z-20 lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>

              <ChatGreeting
                userName={user?.user_metadata?.name || user?.email?.split('@')[0]}
                userAvatar={user?.user_metadata?.avatar_url}
                onSubmit={handleSendMessage}
                isLoading={chat.isLoading}
                hasApiKey={!!apiSettings.settings.apiKey}
                onOpenSettings={navigation.openSettings}
                onSignIn={async () => {
                  try {
                    await authApi.signInWithGoogle();
                  } catch {
                    showToast('Failed to sign in', 'error');
                  }
                }}
                user={user}
              />
            </div>
          ) : (
            /* Editor View - Split Pane */
            <>
              {/* Left Pane - Chat (Desktop always, Mobile conditional) */}
              <div className={`
                w-full lg:w-[420px] shrink-0 flex flex-col border-r border-gray-200
                ${navigation.activeTab === 'chat' ? 'flex' : 'hidden lg:flex'}
              `}>
                <ChatInterface
                  messages={chat.messages}
                  onSendMessage={chat.sendMessage}
                  isLoading={chat.isLoading}
                  onOpenSettings={navigation.openSettings}
                />
              </div>

              {/* Right Pane - Editor/Preview */}
              <div className={`
                flex-1 flex flex-col min-w-0
                ${navigation.activeTab !== 'chat' ? 'flex' : 'hidden lg:flex'}
              `}>
                {/* Code/Preview Toggle */}
                <div className="flex items-center justify-center gap-2 p-2 border-b border-gray-200 bg-gray-50">
                  <button
                    onClick={() => navigation.setActiveTab('code')}
                    className={`
                      flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                      ${navigation.activeTab === 'code'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'}
                    `}
                  >
                    <Code className="w-4 h-4" />
                    Code
                  </button>
                  <button
                    onClick={() => navigation.setActiveTab('preview')}
                    className={`
                      flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                      ${navigation.activeTab === 'preview'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'}
                    `}
                  >
                    <Play className="w-4 h-4" />
                    Preview
                  </button>
                </div>

                {/* Editor or Preview */}
                <div className="flex-1 overflow-hidden">
                  {navigation.activeTab === 'code' ? (
                    <CodeEditor
                      code={editor.code}
                      onChange={(val) => editor.setCode(val || '')}
                      isLoading={chat.isLoading}
                      activeTab={navigation.activeTab}
                      onTabChange={navigation.setActiveTab}
                    />
                  ) : (
                    <Preview
                      code={editor.code}
                      activeTab={navigation.activeTab}
                      onTabChange={navigation.setActiveTab}
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </main>

        {/* Mobile Bottom Navigation (Editor Mode Only) */}
        {!isWelcomeScreen && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center p-1.5 gap-1 bg-white border border-gray-200 rounded-full shadow-xl z-40 lg:hidden">
            <button
              onClick={() => navigation.setActiveTab('chat')}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all
                ${navigation.activeTab === 'chat'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:bg-gray-100'}
              `}
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </button>
            <button
              onClick={() => navigation.setActiveTab('preview')}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all
                ${navigation.activeTab === 'preview' || navigation.activeTab === 'code'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:bg-gray-100'}
              `}
            >
              <Play className="w-4 h-4" />
              Preview
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
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
          credits={credits}
          isUsingPlatformKey={apiSettings.settings.provider === 'aicoder'}
        />
      )}

      {navigation.showDeploy && (
        <DeployModal
          code={editor.code}
          githubToken={apiSettings.settings.githubToken}
          onClose={navigation.closeDeploy}
          onOpenSettings={navigation.openSettings}
        />
      )}

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        isOpen={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        onUseOwnKey={() => {
          setShowAuthPrompt(false);
          navigation.openSettings();
        }}
      />

      {/* Admin Dashboard Modal */}
      {showAdminDashboard && isAdmin && (
        <AdminDashboard onClose={() => setShowAdminDashboard(false)} />
      )}      {/* Diff Viewer - Show when there's pending code */}
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
