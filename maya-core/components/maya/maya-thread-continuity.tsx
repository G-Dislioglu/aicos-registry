'use client';

import { type ChatSession } from '@/lib/types';

type MayaThreadContinuityProps = {
  sessionsLoaded: boolean;
  visibleSessions: ChatSession[];
  activeSessionId: string | null;
  activeSessionTitle?: string | null;
  loading: boolean;
  onSelectThread: (sessionId: string) => void | Promise<void>;
};

export function MayaThreadContinuity({
  sessionsLoaded,
  visibleSessions,
  activeSessionId,
  activeSessionTitle,
  loading,
  onSelectThread
}: MayaThreadContinuityProps) {
  return (
    <section className="mb-4 rounded-[24px] border border-cyan-400/20 bg-cyan-500/8 p-4 text-sm text-slate-100 shadow-shell sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">Thread-Kontinuität</div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Maya setzt den letzten aktiven Thread nach Reload oder Wiedereinstieg wieder auf derselben Hauptfläche fort.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            {sessionsLoaded ? `Threads: ${visibleSessions.length}` : 'Threads werden geladen'}
          </span>
          {activeSessionTitle ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              Aktiv: {activeSessionTitle}
            </span>
          ) : null}
        </div>
      </div>

      {visibleSessions.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {visibleSessions.slice(0, 6).map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => void onSelectThread(session.id)}
              disabled={loading || session.id === activeSessionId}
              className={[
                'rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em] transition',
                session.id === activeSessionId
                  ? 'border-cyan-300/40 bg-cyan-400/15 text-cyan-50'
                  : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10',
                loading ? 'disabled:cursor-not-allowed disabled:opacity-50' : ''
              ].join(' ')}
            >
              {session.title}
            </button>
          ))}
        </div>
      ) : sessionsLoaded ? (
        <p className="mt-4 text-sm leading-6 text-slate-300">
          Noch kein persistierter Thread vorhanden. Der nächste Einstieg wird hier als fortsetzbarer Maya-Thread gespeichert.
        </p>
      ) : null}
    </section>
  );
}
