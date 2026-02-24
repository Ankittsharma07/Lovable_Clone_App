import React, { useRef, useEffect } from 'react';
import { ChatMessage, GenerationStatus } from '../types';
import { SendIcon, SparklesIcon, LoaderIcon } from './Icons';

interface ChatAreaProps {
  messages: ChatMessage[];
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  status: GenerationStatus;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ messages, input, setInput, onSend, status }) => {
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
    <div className="flex flex-col h-full bg-background border-r border-border relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted opacity-50 mt-20">
            <SparklesIcon className="w-12 h-12 mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">What do you want to build?</h2>
            <p className="text-sm text-center max-w-xs">
              Describe your dream app, and I'll generate the code and a live preview instantly.
            </p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-br-none' 
                  : 'bg-surface border border-border text-gray-200 rounded-bl-none shadow-sm'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-primary">
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
             <div className="max-w-[85%] rounded-2xl p-4 bg-surface border border-border rounded-bl-none shadow-sm flex items-center gap-3">
                <LoaderIcon className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm text-muted animate-pulse">
                  {status.step === 'thinking' ? 'Analyzing requirements...' : 'Generating code...'}
                </span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-background border-t border-border z-10">
        <div className="relative glass rounded-xl border border-border shadow-lg focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Build a landing page for a coffee shop..."
            className="w-full bg-transparent text-white placeholder-muted p-4 pr-12 resize-none focus:outline-none text-sm max-h-[120px] overflow-y-auto"
            rows={1}
            disabled={status.isGenerating}
          />
          <button
            onClick={onSend}
            disabled={!input.trim() || status.isGenerating}
            className="absolute right-2 bottom-2 p-2 bg-primary hover:bg-primary-hover text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status.isGenerating ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <SendIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};