import React, { useEffect, useRef } from 'react';
import { ChatMessage, GenerationStatus } from '../types';
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
  onStartNewChat: () => void;
  onOpenHistory: () => void;
  isWorkspaceLoading: boolean;
}

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
  onStartNewChat,
  onOpenHistory,
  isWorkspaceLoading,
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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">{userEmail}</p>
            <p className="text-xs text-zinc-400">Use History to reopen any previous chat and continue it.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenHistory}
              className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100 transition hover:bg-cyan-400/15"
            >
              History
            </button>
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
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="mt-20 flex h-full flex-col items-center justify-center opacity-80">
            <SparklesIcon className="mb-4 h-12 w-12 text-cyan-300" />
            <h2 className="mb-2 text-xl font-semibold text-zinc-100">What do you want to build?</h2>
            <p className="max-w-xs text-center text-sm text-zinc-400">
              Describe your app, generate code, and reopen earlier chats anytime from the History panel.
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
