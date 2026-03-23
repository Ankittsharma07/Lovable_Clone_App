import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { ChatMessage, GenerationStatus, ViewMode, WorkspaceSnapshot, WorkspaceSummary } from './types';
import { generateApp } from './services/geminiService';
import { auth, googleAuthProvider, initFirebaseAnalytics } from './services/firebase';
import {
  createEmptyWorkspaceSnapshot,
  createWorkspace,
  deriveWorkspaceTitle,
  getWorkspaceById,
  listUserWorkspaces,
  saveWorkspace,
} from './services/workspaceService';
import { AuthPage } from './components/AuthPage';
import { ChatArea } from './components/ChatArea';
import { HistoryPanel } from './components/HistoryPanel';
import { PreviewArea } from './components/PreviewArea';

const SAVE_DEBOUNCE_MS = 900;

const upsertWorkspaceSummary = (
  workspaces: WorkspaceSummary[],
  nextWorkspace: WorkspaceSummary,
): WorkspaceSummary[] => {
  const deduped = workspaces.filter((workspace) => workspace.id !== nextWorkspace.id);
  return [nextWorkspace, ...deduped].sort((left, right) => right.updatedAt - left.updatedAt);
};

const getReadableAuthError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return 'Authentication failed. Please try again.';
  }

  const errorCode = (error as Error & { code?: string }).code || '';
  const messageByCode: Record<string, string> = {
    'auth/email-already-in-use': 'That email is already registered.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/missing-password': 'Enter your password.',
    'auth/popup-closed-by-user': 'The Google sign-in popup was closed before login completed.',
    'auth/too-many-requests': 'Too many attempts. Wait a minute and try again.',
    'auth/weak-password': 'Use a password with at least 6 characters.',
  };

  return messageByCode[errorCode] || error.message;
};

const AuthLoadingScreen: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#05070b] text-white">
    <div className="text-center">
      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-cyan-400/20 border-t-cyan-300" />
      <p className="text-sm text-zinc-400">Checking your Firebase session...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<WorkspaceSnapshot['files']>([]);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [requestCount, setRequestCount] = useState(0);
  const [workspaceCreatedAt, setWorkspaceCreatedAt] = useState<number>(Date.now());
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.PREVIEW);
  const [status, setStatus] = useState<GenerationStatus>({ isGenerating: false, step: 'idle' });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false);
  const [isWorkspaceSaving, setIsWorkspaceSaving] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);

  const isRequestInFlightRef = useRef(false);
  const hasLoadedWorkspaceRef = useRef(false);

  const applyWorkspaceState = useCallback((snapshot: WorkspaceSnapshot, workspaceId: string | null) => {
    setMessages(snapshot.messages);
    setFiles(snapshot.files);
    setPreviewHtml(snapshot.previewHtml);
    setRequestCount(snapshot.requestCount);
    setWorkspaceCreatedAt(snapshot.createdAt);
    setActiveWorkspaceId(workspaceId);
    setLastSavedAt(workspaceId ? snapshot.updatedAt : null);
    setInput('');
    setStatus({ isGenerating: false, step: 'idle' });
  }, []);

  const resetWorkspaceState = useCallback(() => {
    applyWorkspaceState(createEmptyWorkspaceSnapshot(), null);
    setWorkspaceError(null);
    setViewMode(ViewMode.PREVIEW);
    isRequestInFlightRef.current = false;
  }, [applyWorkspaceState]);

  const buildWorkspaceSnapshot = useCallback(
    (updatedAt = Date.now()): WorkspaceSnapshot => ({
      title: deriveWorkspaceTitle(messages),
      messages,
      files,
      previewHtml,
      requestCount,
      createdAt: workspaceCreatedAt,
      updatedAt,
    }),
    [files, messages, previewHtml, requestCount, workspaceCreatedAt],
  );

  const persistWorkspace = useCallback(
    async (workspaceId: string, snapshot = buildWorkspaceSnapshot(Date.now())) => {
      if (!user) {
        return;
      }

      setIsWorkspaceSaving(true);
      setWorkspaceError(null);

      try {
        const summary = await saveWorkspace(user.uid, workspaceId, snapshot);
        setLastSavedAt(summary.updatedAt);
        setWorkspaces((current) => upsertWorkspaceSummary(current, summary));
      } catch (error) {
        console.error('[Workspace] Failed to save workspace.', error);
        setWorkspaceError('Cloud sync failed. Check that Firestore is enabled and try again.');
      } finally {
        setIsWorkspaceSaving(false);
      }
    },
    [buildWorkspaceSnapshot, user],
  );

  const loadWorkspace = useCallback(
    async (uid: string, workspaceId: string) => {
      setIsWorkspaceLoading(true);
      setWorkspaceError(null);
      hasLoadedWorkspaceRef.current = false;

      try {
        const snapshot = await getWorkspaceById(uid, workspaceId);
        if (!snapshot) {
          throw new Error('Workspace not found.');
        }

        applyWorkspaceState(snapshot, workspaceId);
      } catch (error) {
        console.error('[Workspace] Failed to load workspace.', error);
        setWorkspaceError('Could not load that chat history.');
      } finally {
        hasLoadedWorkspaceRef.current = true;
        setIsWorkspaceLoading(false);
      }
    },
    [applyWorkspaceState],
  );

  useEffect(() => {
    void initFirebaseAnalytics();

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      setAuthError(null);
      setWorkspaceError(null);
      hasLoadedWorkspaceRef.current = false;

      if (!nextUser) {
        setWorkspaces([]);
        resetWorkspaceState();
        hasLoadedWorkspaceRef.current = true;
        return;
      }

      setIsWorkspaceLoading(true);

      try {
        const nextWorkspaces = await listUserWorkspaces(nextUser.uid);
        setWorkspaces(nextWorkspaces);

        if (nextWorkspaces.length > 0) {
          const latestWorkspace = await getWorkspaceById(nextUser.uid, nextWorkspaces[0].id);
          if (latestWorkspace) {
            applyWorkspaceState(latestWorkspace, nextWorkspaces[0].id);
          } else {
            resetWorkspaceState();
          }
        } else {
          resetWorkspaceState();
        }
      } catch (error) {
        console.error('[Workspace] Failed to initialize user workspace.', error);
        setWorkspaceError('Unable to read cloud chat history. Make sure Firestore is ready.');
        resetWorkspaceState();
      } finally {
        hasLoadedWorkspaceRef.current = true;
        setIsWorkspaceLoading(false);
      }
    });

    return unsubscribe;
  }, [applyWorkspaceState, resetWorkspaceState]);

  useEffect(() => {
    if (!user || !activeWorkspaceId || isWorkspaceLoading || !hasLoadedWorkspaceRef.current) {
      return;
    }

    const snapshot = buildWorkspaceSnapshot();
    const hasContent =
      snapshot.messages.length > 0 ||
      snapshot.files.length > 0 ||
      snapshot.previewHtml.trim().length > 0 ||
      snapshot.requestCount > 0;

    if (!hasContent) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void persistWorkspace(activeWorkspaceId, snapshot);
    }, SAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [activeWorkspaceId, buildWorkspaceSnapshot, isWorkspaceLoading, persistWorkspace, user]);

  const handleAuthSubmit = useCallback(async () => {
    const email = authEmail.trim();
    if (!email) {
      setAuthError('Enter your email address.');
      return;
    }

    if (authPassword.length < 6) {
      setAuthError('Use a password with at least 6 characters.');
      return;
    }

    setAuthBusy(true);
    setAuthError(null);

    try {
      if (authMode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, authPassword);
      } else {
        await signInWithEmailAndPassword(auth, email, authPassword);
      }

      setAuthEmail('');
      setAuthPassword('');
    } catch (error) {
      setAuthError(getReadableAuthError(error));
    } finally {
      setAuthBusy(false);
    }
  }, [authEmail, authMode, authPassword]);

  const handleLogout = useCallback(async () => {
    setAuthBusy(true);
    setAuthError(null);

    try {
      await signOut(auth);
    } catch (error) {
      console.error('[Auth] Failed to sign out.', error);
      setAuthError('Sign out failed. Try again.');
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const handleGoogleAuth = useCallback(async () => {
    setAuthBusy(true);
    setAuthError(null);

    try {
      await signInWithPopup(auth, googleAuthProvider);
      setAuthEmail('');
      setAuthPassword('');
    } catch (error) {
      setAuthError(getReadableAuthError(error));
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const handleSelectWorkspace = useCallback(
    async (workspaceId: string) => {
      if (!user || workspaceId === activeWorkspaceId) {
        setIsHistoryOpen(false);
        return;
      }

      await loadWorkspace(user.uid, workspaceId);
      setIsHistoryOpen(false);
    },
    [activeWorkspaceId, loadWorkspace, user],
  );

  const handleStartNewChat = useCallback(() => {
    resetWorkspaceState();
    setIsHistoryOpen(false);
  }, [resetWorkspaceState]);

  const handleSend = useCallback(async () => {
    if (!user || !input.trim() || status.isGenerating || isRequestInFlightRef.current || isWorkspaceLoading) {
      return;
    }

    isRequestInFlightRef.current = true;
    setWorkspaceError(null);

    let workspaceId = activeWorkspaceId;
    let createdAt = workspaceCreatedAt;

    if (!workspaceId) {
      try {
        const nextWorkspace = await createWorkspace(user.uid);
        workspaceId = nextWorkspace.id;
        createdAt = nextWorkspace.createdAt;
        setActiveWorkspaceId(nextWorkspace.id);
        setWorkspaceCreatedAt(nextWorkspace.createdAt);
        setLastSavedAt(nextWorkspace.updatedAt);
        setWorkspaces((current) => upsertWorkspaceSummary(current, nextWorkspace));
      } catch (error) {
        console.error('[Workspace] Failed to create a new workspace.', error);
        setWorkspaceError('Could not create a cloud chat session.');
        isRequestInFlightRef.current = false;
        return;
      }
    }

    const trimmedInput = input.trim();
    const nextRequestCount = requestCount + 1;
    const requestId = `req-${nextRequestCount}-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: `${Date.now()}`,
      role: 'user',
      text: trimmedInput,
      timestamp: Date.now(),
    };

    console.info(`[UI] User request #${nextRequestCount} started (${requestId}). Dispatching 1 Gemini API call.`);

    setRequestCount(nextRequestCount);
    setMessages((current) => [...current, userMsg]);
    setInput('');
    setStatus({ isGenerating: true, step: 'thinking' });

    try {
      const historyForAi = messages.map((message) => ({ role: message.role, text: message.text }));
      const result = await generateApp(userMsg.text, historyForAi, requestId);

      setStatus({ isGenerating: true, step: 'coding' });
      await new Promise((resolve) => setTimeout(resolve, 500));

      setFiles(result.files);
      setPreviewHtml(result.previewHtml);

      const aiMsg: ChatMessage = {
        id: `${Date.now() + 1}`,
        role: 'assistant',
        text: result.explanation,
        timestamp: Date.now(),
      };

      const nextMessages = [...messages, userMsg, aiMsg];
      setMessages(nextMessages);
      setStatus({ isGenerating: false, step: 'idle' });

      await persistWorkspace(workspaceId, {
        title: deriveWorkspaceTitle(nextMessages),
        messages: nextMessages,
        files: result.files,
        previewHtml: result.previewHtml,
        requestCount: nextRequestCount,
        createdAt,
        updatedAt: Date.now(),
      });

      console.info(`[UI] User request #${nextRequestCount} completed (${requestId}).`);
    } catch (error) {
      console.error(error);

      const errorMsg: ChatMessage = {
        id: `${Date.now() + 1}`,
        role: 'assistant',
        text: "I'm sorry, I encountered an error while generating the application. Please try again or check your API key.",
        timestamp: Date.now(),
      };

      const nextMessages = [...messages, userMsg, errorMsg];
      setMessages(nextMessages);
      setStatus({ isGenerating: false, step: 'idle' });

      if (workspaceId) {
        await persistWorkspace(workspaceId, {
          title: deriveWorkspaceTitle(nextMessages),
          messages: nextMessages,
          files,
          previewHtml,
          requestCount: nextRequestCount,
          createdAt,
          updatedAt: Date.now(),
        });
      }

      console.error(`[UI] User request #${nextRequestCount} failed (${requestId}).`);
    } finally {
      isRequestInFlightRef.current = false;
    }
  }, [
    activeWorkspaceId,
    files,
    input,
    isWorkspaceLoading,
    messages,
    persistWorkspace,
    previewHtml,
    requestCount,
    status.isGenerating,
    user,
    workspaceCreatedAt,
  ]);

  const lastSavedLabel = isWorkspaceSaving
    ? 'Syncing...'
    : lastSavedAt
      ? new Date(lastSavedAt).toLocaleTimeString()
      : 'No cloud save yet';

  if (!authReady) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return (
      <AuthPage
        authMode={authMode}
        setAuthMode={setAuthMode}
        authEmail={authEmail}
        setAuthEmail={setAuthEmail}
        authPassword={authPassword}
        setAuthPassword={setAuthPassword}
        onAuthSubmit={handleAuthSubmit}
        onGoogleAuth={handleGoogleAuth}
        authBusy={authBusy}
        authError={authError}
      />
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#05070b] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(0,198,255,0.14),transparent_36%),radial-gradient(circle_at_80%_5%,rgba(255,128,0,0.14),transparent_30%),radial-gradient(circle_at_50%_85%,rgba(90,255,173,0.08),transparent_35%)]" />
      <div className="relative z-10 flex h-full flex-col">
        <header className="border-b border-white/10 bg-black/30 px-4 py-3 backdrop-blur-md md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold tracking-tight md:text-xl">Lovable Clone Workspace</h1>
              <p className="text-xs text-zinc-300 md:text-sm">
                Firebase Auth + Firestore history for{' '}
                <code className="rounded bg-white/10 px-1.5 py-0.5">{user.email}</code>
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-cyan-100">Requests: {requestCount}</span>
              <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-emerald-100">Files: {files.length}</span>
              <span className="rounded-full border border-fuchsia-300/30 bg-fuchsia-400/10 px-3 py-1 text-fuchsia-100">Chats: {workspaces.length}</span>
              <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-amber-50">Last sync: {lastSavedLabel}</span>
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 text-cyan-100 transition hover:bg-cyan-400/15"
              >
                History
              </button>
              <button
                onClick={handleStartNewChat}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white transition hover:bg-white/15"
              >
                New chat
              </button>
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 p-3 md:p-4">
          <div className="grid h-full grid-cols-1 gap-3 lg:grid-cols-[430px_minmax(0,1fr)]">
            <section className="min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-black/35 shadow-[0_20px_55px_-35px_rgba(0,0,0,0.95)] backdrop-blur">
              <ChatArea
                messages={messages}
                input={input}
                setInput={setInput}
                onSend={handleSend}
                status={status}
                requestCount={requestCount}
                userEmail={user.email ?? 'Signed-in user'}
                onLogout={handleLogout}
                authBusy={authBusy}
                onStartNewChat={handleStartNewChat}
                onOpenHistory={() => setIsHistoryOpen(true)}
                isWorkspaceLoading={isWorkspaceLoading}
              />
            </section>
            <section className="min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-black/35 shadow-[0_20px_55px_-35px_rgba(0,0,0,0.95)] backdrop-blur">
              <PreviewArea
                files={files}
                previewHtml={previewHtml}
                viewMode={viewMode}
                setViewMode={setViewMode}
              />
            </section>
          </div>
        </main>

        <HistoryPanel
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          onSelectWorkspace={handleSelectWorkspace}
          onStartNewChat={handleStartNewChat}
          isWorkspaceLoading={isWorkspaceLoading}
          isWorkspaceSaving={isWorkspaceSaving}
          workspaceError={workspaceError}
        />
      </div>
    </div>
  );
};

export default App;
