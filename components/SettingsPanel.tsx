import React, { useEffect, useState } from 'react';
import { LoaderIcon, XIcon } from './Icons';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  apiKeyDraft: string;
  setApiKeyDraft: (value: string) => void;
  onSaveApiKey: () => void;
  onClearApiKey: () => void;
  onSendPasswordReset: () => void;
  isSaving: boolean;
  error: string | null;
  notice: string | null;
  hasSavedApiKey: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  userEmail,
  apiKeyDraft,
  setApiKeyDraft,
  onSaveApiKey,
  onClearApiKey,
  onSendPasswordReset,
  isSaving,
  error,
  notice,
  hasSavedApiKey,
}) => {
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setShowApiKey(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-40 flex justify-end bg-black/45 backdrop-blur-[2px]">
      <button aria-label="Close settings panel" className="flex-1 cursor-default" onClick={onClose} />
      <aside className="flex h-full w-full max-w-lg flex-col border-l border-white/10 bg-[#090d14]/95 shadow-[-24px_0_60px_-30px_rgba(0,0,0,0.95)] backdrop-blur-xl">
        <div className="border-b border-white/10 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Settings</p>
              <h2 className="mt-3 text-xl font-semibold text-white">Account and API</h2>
              <p className="mt-1 text-sm text-zinc-400">Manage your login details and the Gemini key used for generation.</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-zinc-300 transition hover:bg-white/10 hover:text-white"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Email</p>
            <p className="mt-3 text-sm font-medium text-white">{userEmail}</p>
            <p className="mt-2 text-sm text-zinc-400">
              Your Firebase account email is shown here. Use the password reset action below to manage your password.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Password</p>
                <p className="mt-2 text-sm text-zinc-400">Send a reset link to this account email.</p>
              </div>
              <button
                onClick={onSendPasswordReset}
                disabled={isSaving}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Send reset email
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Gemini API Key</p>
                <p className="mt-2 text-sm text-zinc-400">
                  Save your own Gemini key. All future chats and project generations will use it.
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] ${
                  hasSavedApiKey
                    ? 'border border-emerald-300/20 bg-emerald-400/10 text-emerald-100'
                    : 'border border-amber-300/20 bg-amber-400/10 text-amber-100'
                }`}
              >
                {hasSavedApiKey ? 'Saved' : 'Missing'}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKeyDraft}
                onChange={(event) => setApiKeyDraft(event.target.value)}
                placeholder="Paste your Gemini API key"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-cyan-300/40 focus:outline-none"
              />
              <button
                onClick={() => setShowApiKey((current) => !current)}
                className="text-xs text-zinc-400 transition hover:text-white"
              >
                {showApiKey ? 'Hide key' : 'Show key'}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={onSaveApiKey}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving && <LoaderIcon className="h-4 w-4 animate-spin" />}
                Save key
              </button>
              <button
                onClick={onClearApiKey}
                disabled={isSaving || !hasSavedApiKey}
                className="rounded-full border border-red-300/20 bg-red-500/10 px-4 py-2 text-sm text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Remove key
              </button>
            </div>
          </section>

          {error && (
            <div className="rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {notice && (
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {notice}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
