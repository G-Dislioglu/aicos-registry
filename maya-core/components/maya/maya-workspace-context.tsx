'use client';

import { type MayaActiveWorkspaceContext } from '@/lib/maya-thread-digest';
import { type ChatSession, type MayaWorkspaceContext } from '@/lib/types';

type MayaWorkspaceContextProps = {
  activeWorkspace: MayaActiveWorkspaceContext | null;
  visibleWorkspaces: MayaWorkspaceContext[];
  relatedWorkspaceThreads: ChatSession[];
  activeWorkspaceUpdatedAtLabel: string | null;
  workspaceMilestoneAddsSignal: boolean;
  workspaceStateAddsSignal: boolean;
  showWorkspaceOpenItems: boolean;
  workspaceOpenItems: string[];
  activeWorkspaceId: string | null;
  activeSessionId: string | null;
  hasActiveSession: boolean;
  loading: boolean;
  input: string;
  onCreateWorkspace: () => void | Promise<void>;
  onRenameActiveWorkspace: () => void | Promise<void>;
  onClearMessages: () => void | Promise<void>;
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
  workspaceStateAddsSignal,
  showWorkspaceOpenItems,
  workspaceOpenItems,
  activeWorkspaceId,
  activeSessionId,
  hasActiveSession,
  loading,
  input,
  onCreateWorkspace,
  onRenameActiveWorkspace,
  onClearMessages,
  onSetActiveWorkspace,
  onApplyResumeAction,
  onAssignActiveThreadToWorkspace,
  onSelectThread
}: MayaWorkspaceContextProps) {
  return (
    <section className="mb-4 rounded-[24px] border border-emerald-400/20 bg-emerald-500/8 p-4 text-sm text-slate-100 shadow-shell sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-emerald-300">Arbeitsraum-Kontext</div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Maya zeigt über dem einzelnen Thread den kleinen stabilen Projektkontext, damit Fokus, Gesamtziel und nächster größerer Block beim Threadwechsel sichtbar bleiben.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
          {activeWorkspace ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              Status: {activeWorkspace.status === 'completed' ? 'abgeschlossen' : activeWorkspace.status === 'paused' ? 'geparkt' : 'aktiv'}
            </span>
          ) : null}
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            Arbeitsräume: {visibleWorkspaces.length}
          </span>
          {activeWorkspace ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              Threads: {relatedWorkspaceThreads.length}
            </span>
          ) : null}
          {activeWorkspaceUpdatedAtLabel ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              Stand: {activeWorkspaceUpdatedAtLabel}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 rounded-[20px] border border-white/10 bg-white/5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Raumsteuerung</div>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Arbeitsräume lassen sich hier anlegen, umbenennen, aktiv setzen und direkt mit neuen Threads weiterführen.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void onCreateWorkspace()}
              disabled={loading}
              className="rounded-full border border-emerald-300/40 bg-emerald-400/15 px-4 py-2 text-xs uppercase tracking-[0.18em] text-emerald-50 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Arbeitsraum anlegen
            </button>
            <button
              type="button"
              onClick={() => void onRenameActiveWorkspace()}
              disabled={loading || !activeWorkspace || !input.trim()}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Aktiven Raum umbenennen
            </button>
            <button
              type="button"
              onClick={() => void onClearMessages()}
              disabled={loading || !activeWorkspaceId}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Neuer Thread im Raum
            </button>
          </div>
        </div>

        {visibleWorkspaces.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {visibleWorkspaces.map((workspace) => (
              <button
                key={workspace.id}
                type="button"
                onClick={() => void onSetActiveWorkspace(workspace.id)}
                disabled={loading || workspace.id === activeWorkspaceId}
                className={[
                  'rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-50',
                  workspace.id === activeWorkspaceId
                    ? 'border-emerald-300/40 bg-emerald-400/15 text-emerald-50'
                    : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                ].join(' ')}
              >
                {workspace.title}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Noch kein Arbeitsraum angelegt. Lege den ersten Raum direkt aus dem aktiven Thread an.
          </p>
        )}
      </div>

      {activeWorkspace ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Arbeitsraum</div>
            <div className="mt-2 text-base font-medium leading-7 text-slate-100">{activeWorkspace.title}</div>
            <p className="mt-3 text-sm leading-6 text-slate-200">{activeWorkspace.focus}</p>
          </div>

          <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Nächster größerer Block</div>
            <p className="mt-2 text-sm leading-6 text-slate-200">{activeWorkspace.nextMilestone}</p>
            {workspaceMilestoneAddsSignal ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void onApplyResumeAction(activeWorkspace.nextMilestone, false)}
                  disabled={loading}
                  className="rounded-full border border-emerald-300/40 bg-emerald-400/15 px-4 py-2 text-xs uppercase tracking-[0.18em] text-emerald-50 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  In Composer übernehmen
                </button>
              </div>
            ) : null}
          </div>

          {workspaceStateAddsSignal ? (
            <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Arbeitsraum-Stand</div>
              <p className="mt-2 text-sm leading-6 text-slate-200">{activeWorkspace.currentState}</p>
            </div>
          ) : null}

          <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Gesamtziel</div>
            <p className="mt-2 text-sm leading-6 text-slate-200">{activeWorkspace.goal}</p>
          </div>

          {showWorkspaceOpenItems ? (
            <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 lg:col-span-2">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Offene Kernpunkte</div>
              <div className="mt-3 space-y-2">
                {workspaceOpenItems.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm leading-6 text-slate-200">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Verbundene Threads</div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Der aktive Thread bleibt diesem Arbeitsraum zugeordnet und der Kontext bleibt beim Wechsel zwischen zusammengehörigen Threads sichtbar.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void onAssignActiveThreadToWorkspace(activeWorkspace.id)}
                disabled={!hasActiveSession || loading}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Aktiven Thread zuordnen
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {relatedWorkspaceThreads.length > 0 ? relatedWorkspaceThreads.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => void onSelectThread(session.id)}
                  disabled={loading || session.id === activeSessionId}
                  className={[
                    'rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-50',
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
