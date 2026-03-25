'use client';

import { type MayaActiveWorkspaceContext } from '@/lib/maya-thread-digest';
import { type ChatSession, type MayaWorkspaceContext } from '@/lib/types';

type MayaWorkspaceContextProps = {
  activeWorkspace: MayaActiveWorkspaceContext | null;
  visibleWorkspaces: MayaWorkspaceContext[];
  relatedWorkspaceThreads: ChatSession[];
  activeWorkspaceUpdatedAtLabel: string | null;
  workspaceMilestoneAddsSignal: boolean;
  showWorkspaceOpenItems: boolean;
  workspaceOpenItems: string[];
  activeWorkspaceId: string | null;
  activeSessionId: string | null;
  hasActiveSession: boolean;
  loading: boolean;
  onCreateWorkspace: () => void | Promise<void>;
  onSetActiveWorkspace: (workspaceId: string) => void | Promise<void>;
  onApplyResumeAction: (prompt: string, immediate?: boolean) => void | Promise<void>;
  onAssignActiveThreadToWorkspace: (workspaceId: string) => void | Promise<void>;
  onSelectThread: (sessionId: string) => void | Promise<void>;
};

export function MayaWorkspaceContext({
  activeWorkspace,
  visibleWorkspaces,
  relatedWorkspaceThreads,
  activeWorkspaceUpdatedAtLabel,
  workspaceMilestoneAddsSignal,
  showWorkspaceOpenItems,
  workspaceOpenItems,
  activeWorkspaceId,
  activeSessionId,
  hasActiveSession,
  loading,
  onCreateWorkspace,
  onSetActiveWorkspace,
  onApplyResumeAction,
  onAssignActiveThreadToWorkspace,
  onSelectThread
}: MayaWorkspaceContextProps) {
  return (
    <section className="mb-4 rounded-[20px] border border-white/10 bg-white/5 p-3 text-sm text-slate-100 shadow-shell sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-emerald-300">Arbeitsraum-Steuerung</div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
            <span className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1">
              Räume: {visibleWorkspaces.length}
            </span>
            {activeWorkspace ? (
              <span className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1">
                Status: {activeWorkspace.status === 'completed' ? 'abgeschlossen' : activeWorkspace.status === 'paused' ? 'geparkt' : 'aktiv'}
              </span>
            ) : null}
            {activeWorkspaceUpdatedAtLabel ? (
              <span className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1">
                Stand: {activeWorkspaceUpdatedAtLabel}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void onCreateWorkspace()}
            disabled={loading}
            className="rounded-full border border-emerald-300/40 bg-emerald-400/15 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-emerald-50 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Arbeitsraum anlegen
          </button>
          {activeWorkspace ? (
            <button
              type="button"
              onClick={() => void onAssignActiveThreadToWorkspace(activeWorkspace.id)}
              disabled={!hasActiveSession || loading}
              className="rounded-full border border-white/10 bg-slate-950/40 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Aktiven Thread zuordnen
            </button>
          ) : null}
          {activeWorkspace && workspaceMilestoneAddsSignal ? (
            <button
              type="button"
              onClick={() => void onApplyResumeAction(activeWorkspace.nextMilestone, false)}
              disabled={loading}
              className="rounded-full border border-white/10 bg-slate-950/40 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Nächsten Block übernehmen
            </button>
          ) : null}
        </div>
      </div>

      {visibleWorkspaces.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {visibleWorkspaces.map((workspace) => (
            <button
              key={workspace.id}
              type="button"
              onClick={() => void onSetActiveWorkspace(workspace.id)}
              disabled={loading || workspace.id === activeWorkspaceId}
              className={[
                'rounded-full border px-3 py-2 text-[11px] uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-50',
                workspace.id === activeWorkspaceId
                  ? 'border-emerald-300/40 bg-emerald-400/15 text-emerald-50'
                  : 'border-white/10 bg-slate-950/40 text-slate-200 hover:bg-white/10'
              ].join(' ')}
            >
              {workspace.title}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Noch kein Arbeitsraum angelegt. Lege den ersten Raum aus dem aktiven Thread an.
        </p>
      )}

      {activeWorkspace ? (
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div className="rounded-[18px] border border-white/10 bg-slate-950/35 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Aktiver Arbeitsraum</div>
            <div className="mt-2 text-sm font-medium leading-6 text-slate-100">{activeWorkspace.title}</div>
            <p className="mt-2 text-sm leading-6 text-slate-300">{activeWorkspace.focus}</p>
            {showWorkspaceOpenItems ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {workspaceOpenItems.map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs leading-5 text-slate-200">
                    {item}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-[18px] border border-white/10 bg-slate-950/35 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Verbundene Threads</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {relatedWorkspaceThreads.length > 0 ? relatedWorkspaceThreads.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => void onSelectThread(session.id)}
                  disabled={loading || session.id === activeSessionId}
                  className={[
                    'rounded-full border px-3 py-2 text-[11px] uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-50',
                    session.id === activeSessionId
                      ? 'border-emerald-300/40 bg-emerald-400/15 text-emerald-50'
                      : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                  ].join(' ')}
                >
                  {session.title}
                </button>
              )) : (
                <p className="text-sm leading-6 text-slate-400">Aktuell ist nur der aktive Thread diesem Arbeitsraum zugeordnet.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
