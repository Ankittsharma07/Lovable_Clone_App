import React, { useEffect, useRef } from 'react';
import { ChatMessage, GenerationStatus, WorkspaceSummary } from '../types';
import { LoaderIcon, SendIcon, SparklesIcon } from './Icons';

interface ChatAreaProps {
  messages: ChatMessage[];
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  status: GenerationStatus;
  requestCount: number;
  userEmail: string;
  onLogout: () => void;
  authBusy: boolean;
  workspaces: WorkspaceSummary[];
  activeWorkspaceId: string | null;
  onSelectWorkspace: (workspaceId: string) => void;
  onStartNewChat: () => void;
  isWorkspaceLoading: boolean;
  isWorkspaceSaving: boolean;
  workspaceError: string | null;
}

const formatHistoryTimestamp = (timestamp: number) =>
  new Date(timestamp).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  input,
  setInput,
  onSend,
  status,
  requestCount,
  userEmail,
  onLogout,
  authBusy,
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onStartNewChat,
  isWorkspaceLoading,
  isWorkspaceSaving,
  workspaceError,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, status]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  const composerDisabled = isWorkspaceLoading || status.isGenerating;

  return (
    <div className="relative flex h-full flex-col bg-transparent">
      <div className="border-b border-white/10 bg-white/[0.03] px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Prompt Console</p>
            <h2 className="text-sm font-semibold text-white">Build and Iterate</h2>
          </div>
          <div className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-zinc-200">
            API calls: {requestCount}
          </div>
        </div>
      </div>

      <div className="border-b border-white/10 bg-black/20 px-4 py-3">
        <div className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">{userEmail}</p>
              <p className="text-xs text-zinc-400">Your sessions are saved in Firestore under this account.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onStartNewChat}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-zinc-200 transition hover:bg-white/10"
              >
                New chat
              </button>
              <button
                onClick={onLogout}
                disabled={authBusy}
                className="rounded-full border border-red-300/25 bg-red-500/10 px-3 py-1.5 text-xs text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Chat History</p>
              <span className="text-xs text-zinc-500">{workspaces.length} saved</span>
            </div>

            {isWorkspaceLoading ? (
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-300">
                Loading saved session...
              </div>
            ) : workspaces.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-400">
                No saved sessions yet. Start your first chat.
              </div>
            ) : (
              <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
                {workspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    onClick={() => onSelectWorkspace(workspace.id)}
                    className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                      workspace.id === activeWorkspaceId
                        ? 'border-cyan-300/30 bg-cyan-300/10'
                        : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-medium text-white">{workspace.title}</span>
                      <span className="shrink-0 text-[11px] text-zinc-500">
                        {formatHistoryTimestamp(workspace.updatedAt)}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-400">
                      {workspace.messageCount} messages | {workspace.requestCount} requests
                    </div>
                  </button>
                ))}
              </div>
            )}

            {workspaceError && (
              <div className="mt-3 rounded-xl border border-red-300/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {workspaceError}
              </div>
            )}

            {isWorkspaceSaving && (
              <p className="mt-3 text-xs text-emerald-200">Syncing your latest changes to Firestore...</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="mt-20 flex h-full flex-col items-center justify-center opacity-80">
            <SparklesIcon className="mb-4 h-12 w-12 text-cyan-300" />
            <h2 className="mb-2 text-xl font-semibold text-zinc-100">What do you want to build?</h2>
            <p className="max-w-xs text-center text-sm text-zinc-400">
              Describe your app, generate code, and the full conversation will stay attached to your account.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-lg ${
                    message.role === 'user'
                      ? 'rounded-br-none bg-gradient-to-br from-cyan-500 to-blue-600 text-white'
                      : 'rounded-bl-none border border-white/15 bg-white/[0.04] text-zinc-200'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-cyan-200">
                      <SparklesIcon className="h-3 w-3" />
                      <span>AI Builder</span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{message.text}</div>
                </div>
              </div>
            ))}

            {status.isGenerating && (
              <div className="flex justify-start">
                <div className="flex max-w-[85%] items-center gap-3 rounded-2xl rounded-bl-none border border-white/15 bg-white/[0.04] p-4 shadow-sm">
                  <LoaderIcon className="h-5 w-5 animate-spin text-primary" />
                  <span className="animate-pulse text-sm text-zinc-300">
                    {status.step === 'thinking' ? 'Analyzing requirements...' : 'Generating code...'}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="z-10 border-t border-white/10 bg-black/20 p-4">
        <div className="relative rounded-xl border border-white/15 bg-white/[0.03] shadow-lg transition-all duration-300 focus-within:ring-2 focus-within:ring-cyan-300/20">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleComposerKeyDown}
            placeholder="Build a landing page for a coffee shop..."
            className="max-h-[120px] w-full resize-none overflow-y-auto bg-transparent p-4 pr-12 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
            rows={1}
            disabled={composerDisabled}
          />
          <button
            onClick={onSend}
            disabled={!input.trim() || composerDisabled}
            className="absolute bottom-2 right-2 rounded-lg bg-cyan-500 p-2 text-white transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status.isGenerating ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <SendIcon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
