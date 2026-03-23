import React from 'react';
import { LoaderIcon, SparklesIcon } from './Icons';

interface AuthPageProps {
  authMode: 'login' | 'signup';
  setAuthMode: (mode: 'login' | 'signup') => void;
  authEmail: string;
  setAuthEmail: (value: string) => void;
  authPassword: string;
  setAuthPassword: (value: string) => void;
  onAuthSubmit: () => void;
  onGoogleAuth: () => void;
  authBusy: boolean;
  authError: string | null;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  authMode,
  setAuthMode,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  onAuthSubmit,
  onGoogleAuth,
  authBusy,
  authError,
}) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onAuthSubmit();
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#05070b] px-4 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(0,198,255,0.18),transparent_32%),radial-gradient(circle_at_88%_10%,rgba(255,128,0,0.14),transparent_28%),radial-gradient(circle_at_50%_85%,rgba(90,255,173,0.10),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/10 bg-black/35 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.95)] backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative overflow-hidden border-b border-white/10 p-8 lg:border-b-0 lg:border-r lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.16),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_34%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-cyan-100">
              <SparklesIcon className="h-3.5 w-3.5" />
              Lovable Clone
            </div>

            <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-tight text-white md:text-5xl">
              Sign in once, then continue directly into your saved workspace.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-zinc-300">
              Every user gets private Firebase-backed chat history, generated files, and their latest workspace restored automatically after login.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm font-semibold text-white">Private history</p>
                <p className="mt-2 text-sm text-zinc-400">Chats are stored per user in Firestore.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm font-semibold text-white">Fast access</p>
                <p className="mt-2 text-sm text-zinc-400">Login takes you straight to the workspace.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm font-semibold text-white">Google or email</p>
                <p className="mt-2 text-sm text-zinc-400">Use whichever login flow you prefer.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="p-6 md:p-8 lg:p-10">
          <div className="mx-auto max-w-md">
            <div className="mb-6">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Authentication</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {authMode === 'signup' ? 'Create your account' : 'Welcome back'}
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                {authMode === 'signup'
                  ? 'Create an account to start saving your own chat sessions.'
                  : 'Login to open your saved workspace and continue building.'}
              </p>
            </div>

            <div className="mb-6 flex gap-2 rounded-full border border-white/10 bg-white/[0.04] p-1">
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                  authMode === 'login' ? 'bg-cyan-500 text-white' : 'text-zinc-300 hover:bg-white/10'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setAuthMode('signup')}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                  authMode === 'signup' ? 'bg-cyan-500 text-white' : 'text-zinc-300 hover:bg-white/10'
                }`}
              >
                Sign up
              </button>
            </div>

            <div className="space-y-4">
              <button
                onClick={onGoogleAuth}
                disabled={authBusy}
                className="inline-flex w-full items-center justify-center rounded-2xl border border-white/15 bg-white/[0.05] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {authBusy ? (
                  <span className="inline-flex items-center gap-2">
                    <LoaderIcon className="h-4 w-4 animate-spin" />
                    Please wait...
                  </span>
                ) : (
                  'Continue with Google'
                )}
              </button>

              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-zinc-500">
                <div className="h-px flex-1 bg-white/10" />
                <span>or use email</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <input
                type="email"
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Email address"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-cyan-300/40 focus:outline-none"
              />
              <input
                type="password"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Password"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-cyan-300/40 focus:outline-none"
              />

              {authError && (
                <div className="rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {authError}
                </div>
              )}

              <button
                onClick={onAuthSubmit}
                disabled={authBusy}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {authBusy ? (
                  <span className="inline-flex items-center gap-2">
                    <LoaderIcon className="h-4 w-4 animate-spin" />
                    Please wait...
                  </span>
                ) : authMode === 'signup' ? (
                  'Create account'
                ) : (
                  'Login'
                )}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
