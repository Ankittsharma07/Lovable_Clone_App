import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage, FileNode, GenerationStatus, ViewMode } from './types';
import { generateApp } from './services/geminiService';
import { ChatArea } from './components/ChatArea';
import { PreviewArea } from './components/PreviewArea';

const WORKSPACE_STORAGE_KEY = 'lovableClone.latestWorkspace';

interface PersistedWorkspace {
  messages: ChatMessage[];
  files: FileNode[];
  previewHtml: string;
  requestCount: number;
  updatedAt: number;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<FileNode[]>([]);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [requestCount, setRequestCount] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.PREVIEW);
  const [status, setStatus] = useState<GenerationStatus>({ isGenerating: false, step: 'idle' });
  const isRequestInFlightRef = useRef(false);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as PersistedWorkspace;
      setMessages(Array.isArray(parsed.messages) ? parsed.messages : []);
      setFiles(Array.isArray(parsed.files) ? parsed.files : []);
      setPreviewHtml(typeof parsed.previewHtml === 'string' ? parsed.previewHtml : '');
      setRequestCount(typeof parsed.requestCount === 'number' ? parsed.requestCount : 0);
      setLastSavedAt(typeof parsed.updatedAt === 'number' ? parsed.updatedAt : null);
      console.info('[Workspace] Restored from localStorage.');
    } catch (error) {
      console.warn('[Workspace] Failed to restore from localStorage.', error);
    } finally {
      hasHydratedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!hasHydratedRef.current) return;

    try {
      const payload: PersistedWorkspace = {
        messages,
        files,
        previewHtml,
        requestCount,
        updatedAt: Date.now(),
      };
      localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(payload));
      setLastSavedAt(payload.updatedAt);
    } catch (error) {
      console.warn('[Workspace] Failed to save to localStorage.', error);
    }
  }, [messages, files, previewHtml, requestCount]);

  const handleResetWorkspace = useCallback(() => {
    setMessages([]);
    setFiles([]);
    setPreviewHtml('');
    setInput('');
    setRequestCount(0);
    setStatus({ isGenerating: false, step: 'idle' });
    isRequestInFlightRef.current = false;
    localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    setLastSavedAt(null);
    console.info('[Workspace] Cleared and localStorage key removed.');
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || status.isGenerating || isRequestInFlightRef.current) return;

    isRequestInFlightRef.current = true;
    const nextRequestCount = requestCount + 1;
    setRequestCount(nextRequestCount);
    const requestId = `req-${nextRequestCount}-${Date.now()}`;
    console.info(`[UI] User request #${nextRequestCount} started (${requestId}). Dispatching 1 Gemini API call.`);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setStatus({ isGenerating: true, step: 'thinking' });

    try {
      // We pass the history excluding the latest message which is in the 'prompt' arg mostly,
      // but for simplicity in this demo structure, we pass the simplified history.
      const historyForAi = messages.map(m => ({ role: m.role, text: m.text }));
      
      const result = await generateApp(userMsg.text, historyForAi, requestId);
      
      setStatus({ isGenerating: true, step: 'coding' });

      // Simulate a small delay for "coding" feel if response was instant
      await new Promise(r => setTimeout(r, 500));

      setFiles(result.files);
      setPreviewHtml(result.previewHtml);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: result.explanation,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, aiMsg]);
      setStatus({ isGenerating: false, step: 'idle' });
      console.info(`[UI] User request #${nextRequestCount} completed (${requestId}).`);
      
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: "I'm sorry, I encountered an error while generating the application. Please try again or check your API key.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
      setStatus({ isGenerating: false, step: 'idle' });
      console.error(`[UI] User request #${nextRequestCount} failed (${requestId}).`);
    } finally {
      isRequestInFlightRef.current = false;
    }
  }, [input, messages, requestCount, status.isGenerating]);

  const lastSavedLabel = lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString() : 'Not saved yet';

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#05070b] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(0,198,255,0.14),transparent_36%),radial-gradient(circle_at_80%_5%,rgba(255,128,0,0.14),transparent_30%),radial-gradient(circle_at_50%_85%,rgba(90,255,173,0.08),transparent_35%)]" />
      <div className="relative z-10 flex h-full flex-col">
        <header className="border-b border-white/10 bg-black/30 px-4 py-3 backdrop-blur-md md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold tracking-tight md:text-xl">Lovable Clone Workspace</h1>
              <p className="text-xs text-zinc-300 md:text-sm">
                Saved locally in your browser: <code className="rounded bg-white/10 px-1.5 py-0.5">{WORKSPACE_STORAGE_KEY}</code>
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-cyan-100">Requests: {requestCount}</span>
              <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-emerald-100">Files: {files.length}</span>
              <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-amber-50">Last saved: {lastSavedLabel}</span>
              <button
                onClick={handleResetWorkspace}
                className="rounded-full border border-red-300/35 bg-red-500/10 px-3 py-1 text-red-100 transition hover:bg-red-500/20"
              >
                Reset
              </button>
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 p-3 md:p-4">
          <div className="grid h-full grid-cols-1 gap-3 lg:grid-cols-[390px_minmax(0,1fr)]">
            <section className="min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-black/35 shadow-[0_20px_55px_-35px_rgba(0,0,0,0.95)] backdrop-blur">
              <ChatArea 
                messages={messages}
                input={input}
                setInput={setInput}
                onSend={handleSend}
                status={status}
                requestCount={requestCount}
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
      </div>
    </div>
  );
};

export default App;
