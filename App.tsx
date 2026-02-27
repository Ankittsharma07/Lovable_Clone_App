import React, { useState, useCallback, useRef } from 'react';
import { ChatMessage, FileNode, GenerationStatus, ViewMode } from './types';
import { generateApp } from './services/geminiService';
import { ChatArea } from './components/ChatArea';
import { PreviewArea } from './components/PreviewArea';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<FileNode[]>([]);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.PREVIEW);
  const [status, setStatus] = useState<GenerationStatus>({ isGenerating: false, step: 'idle' });
  const isRequestInFlightRef = useRef(false);
  const requestCountRef = useRef(0);

  const handleSend = useCallback(async () => {
    if (!input.trim() || status.isGenerating || isRequestInFlightRef.current) return;

    isRequestInFlightRef.current = true;
    requestCountRef.current += 1;
    const requestId = `req-${requestCountRef.current}-${Date.now()}`;
    console.info(`[UI] User request #${requestCountRef.current} started (${requestId}). Dispatching 1 Gemini API call.`);

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
      console.info(`[UI] User request #${requestCountRef.current} completed (${requestId}).`);
      
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
      console.error(`[UI] User request #${requestCountRef.current} failed (${requestId}).`);
    } finally {
      isRequestInFlightRef.current = false;
    }
  }, [input, messages, status.isGenerating]);

  return (
    <div className="flex h-screen w-screen bg-background text-white overflow-hidden">
      {/* Left Panel: Chat */}
      <div className="w-[400px] flex-shrink-0 h-full">
        <ChatArea 
          messages={messages}
          input={input}
          setInput={setInput}
          onSend={handleSend}
          status={status}
        />
      </div>

      {/* Right Panel: Preview/Code */}
      <div className="flex-1 h-full shadow-2xl">
        <PreviewArea 
          files={files}
          previewHtml={previewHtml}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      </div>
    </div>
  );
};

export default App;
