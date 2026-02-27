import React, { useRef, useEffect } from 'react';
import { ChatMessage, GenerationStatus } from '../types';
import { SendIcon, SparklesIcon, LoaderIcon } from './Icons';

interface ChatAreaProps {
  messages: ChatMessage[];
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  status: GenerationStatus;
  requestCount: number;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ messages, input, setInput, onSend, status, requestCount }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, status]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

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

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="mt-20 flex h-full flex-col items-center justify-center opacity-80">
            <SparklesIcon className="mb-4 h-12 w-12 text-cyan-300" />
            <h2 className="mb-2 text-xl font-semibold text-zinc-100">What do you want to build?</h2>
            <p className="max-w-xs text-center text-sm text-zinc-400">
              Describe your dream app, and I'll generate the code and a live preview instantly.
            </p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-lg ${
                msg.role === 'user' 
                  ? 'rounded-br-none bg-gradient-to-br from-cyan-500 to-blue-600 text-white' 
                  : 'rounded-bl-none border border-white/15 bg-white/[0.04] text-zinc-200'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-cyan-200">
                  <SparklesIcon className="w-3 h-3" />
                  <span>AI Builder</span>
                </div>
              )}
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
          </div>
        ))}

        {status.isGenerating && (
          <div className="flex justify-start">
             <div className="flex max-w-[85%] items-center gap-3 rounded-2xl rounded-bl-none border border-white/15 bg-white/[0.04] p-4 shadow-sm">
                <LoaderIcon className="w-5 h-5 animate-spin text-primary" />
                <span className="animate-pulse text-sm text-zinc-300">
                  {status.step === 'thinking' ? 'Analyzing requirements...' : 'Generating code...'}
                </span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="z-10 border-t border-white/10 bg-black/20 p-4">
        <div className="relative rounded-xl border border-white/15 bg-white/[0.03] shadow-lg transition-all duration-300 focus-within:ring-2 focus-within:ring-cyan-300/20">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Build a landing page for a coffee shop..."
            className="max-h-[120px] w-full resize-none overflow-y-auto bg-transparent p-4 pr-12 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
            rows={1}
            disabled={status.isGenerating}
          />
          <button
            onClick={onSend}
            disabled={!input.trim() || status.isGenerating}
            className="absolute bottom-2 right-2 rounded-lg bg-cyan-500 p-2 text-white transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status.isGenerating ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <SendIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
