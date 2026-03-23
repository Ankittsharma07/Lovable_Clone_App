import React, { useState } from 'react';
import { LoaderIcon, SparklesIcon } from './Icons';

interface ApiKeyGateProps {
  isOpen: boolean;
  apiKeyDraft: string;
  setApiKeyDraft: (value: string) => void;
  onSaveApiKey: () => void;
  onLogout: () => void;
  isSaving: boolean;
  error: string | null;
}

export const ApiKeyGate: React.FC<ApiKeyGateProps> = ({
  isOpen,
  apiKeyDraft,
  setApiKeyDraft,
  onSaveApiKey,
  onLogout,
  isSaving,
  error,
}) => {
  const [showApiKey, setShowApiKey] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onSaveApiKey();
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-[#090d14]/95 p-6 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.95)] md:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-cyan-100">
          <SparklesIcon className="h-3.5 w-3.5" />
          Gemini Key Required
        </div>

        <h2 className="mt-5 text-2xl font-semibold text-white">Save your own Gemini API key to unlock the workspace</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          This app now runs generation using the signed-in user&apos;s own Gemini key. Once you save it, the popup will
          not appear again unless you remove or change that key in Settings.
        </p>

        <div className="mt-6 space-y-3">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={apiKeyDraft}
            onChange={(event) => setApiKeyDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste your Gemini API key"
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-cyan-300/40 focus:outline-none"
          />

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setShowApiKey((current) => !current)}
              className="text-xs text-zinc-400 transition hover:text-white"
            >
              {showApiKey ? 'Hide key' : 'Show key'}
            </button>
            <p className="text-xs text-zinc-500">Your key is stored in your own Firestore account settings.</p>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onLogout}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/10"
          >
            Logout
          </button>
          <button
            onClick={onSaveApiKey}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving && <LoaderIcon className="h-4 w-4 animate-spin" />}
            Save API key
          </button>
        </div>
      </div>
    </div>
  );
};
