import React from 'react';
import { WorkspaceSummary } from '../types';
import { HistoryIcon, LoaderIcon, XIcon } from './Icons';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
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

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onClose,
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onStartNewChat,
  isWorkspaceLoading,
  isWorkspaceSaving,
  workspaceError,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-30 flex justify-end bg-black/45 backdrop-blur-[2px]">
      <button aria-label="Close history panel" className="flex-1 cursor-default" onClick={onClose} />
      <aside className="flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#090d14]/95 shadow-[-24px_0_60px_-30px_rgba(0,0,0,0.95)] backdrop-blur-xl">
        <div className="border-b border-white/10 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-cyan-100">
                <HistoryIcon className="h-3.5 w-3.5" />
                History
              </div>
              <h2 className="mt-4 text-xl font-semibold text-white">Your saved chats</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Open any previous workspace and continue from where you left off.
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-zinc-300 transition hover:bg-white/10 hover:text-white"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">{workspaces.length} chats</span>
            <button
              onClick={() => {
                onStartNewChat();
                onClose();
              }}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white transition hover:bg-white/10"
            >
              New chat
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isWorkspaceLoading ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-zinc-300">
              Loading chat history...
            </div>
          ) : workspaces.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-400">
              No saved chats yet. Start a new workspace and it will appear here.
            </div>
          ) : (
            <div className="space-y-3">
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => onSelectWorkspace(workspace.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    workspace.id === activeWorkspaceId
                      ? 'border-cyan-300/30 bg-cyan-300/10'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="line-clamp-2 text-sm font-medium text-white">{workspace.title}</span>
                    <span className="shrink-0 text-[11px] text-zinc-500">
                      {formatHistoryTimestamp(workspace.updatedAt)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-zinc-400">
                    <span>{workspace.messageCount} messages</span>
                    <span>{workspace.requestCount} requests</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {workspaceError && (
            <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {workspaceError}
            </div>
          )}
        </div>

        {isWorkspaceSaving && (
          <div className="border-t border-white/10 px-5 py-3 text-sm text-emerald-200">
            <span className="inline-flex items-center gap-2">
              <LoaderIcon className="h-4 w-4 animate-spin" />
              Syncing latest changes...
            </span>
          </div>
        )}
      </aside>
    </div>
  );
};
