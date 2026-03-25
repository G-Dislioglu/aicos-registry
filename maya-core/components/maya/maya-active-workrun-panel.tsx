'use client';

import { MayaCheckpointBoard } from '@/components/maya/maya-checkpoint-board';

import {
  type MayaActiveCheckpointBoard,
  type MayaActiveThreadHandoff,
  type MayaActiveWorkrun
} from '@/lib/maya-thread-digest';

type MayaActiveWorkrunPanelProps = {
  activeWorkrun: MayaActiveWorkrun;
  activeWorkrunUpdatedAtLabel: string | null;
  primaryFocus: string | null;
  primaryNextStep: string | null;
  primaryOpenPoint: string | null;
  loading: boolean;
  canRebuildWorkrunFromThread: boolean;
  showHandoffSection: boolean;
  activeThreadHandoff: MayaActiveThreadHandoff | null;
  activeThreadHandoffUpdatedAtLabel: string | null;
  handoffHasDistinctAchieved: boolean;
  handoffHasDistinctNextEntry: boolean;
  handoffOpenItems: string[];
  activeCheckpointBoard: MayaActiveCheckpointBoard | null;
  onApplyPrimaryNextStepToComposer: () => void | Promise<void>;
  onResumePrimaryNextStepNow: () => void | Promise<void>;
  onSetFocusFromInputOrNextStep: () => void | Promise<void>;
  onMarkWorkrunCompleted: () => void | Promise<void>;
  onReopenWorkrun: () => void | Promise<void>;
  onPauseThreadFromWorkrun: () => void | Promise<void>;
  onResumeThreadFromWorkrun: () => void | Promise<void>;
  onRebuildWorkrunFromThread: () => void | Promise<void>;
  onToggleCheckpointStatus: (checkpointId: string, status: 'open' | 'completed') => void | Promise<void>;
  onApplyCheckpointToComposer: (prompt: string) => void | Promise<void>;
  onAddBoardCheckpointFromFocus: () => void | Promise<void>;
};

export function MayaActiveWorkrunPanel({
  activeWorkrun,
  activeWorkrunUpdatedAtLabel,
  primaryFocus,
  primaryNextStep,
  primaryOpenPoint,
  loading,
  canRebuildWorkrunFromThread,
  showHandoffSection,
  activeThreadHandoff,
  activeThreadHandoffUpdatedAtLabel,
  handoffHasDistinctAchieved,
  handoffHasDistinctNextEntry,
  handoffOpenItems,
  activeCheckpointBoard,
  onApplyPrimaryNextStepToComposer,
  onResumePrimaryNextStepNow,
  onSetFocusFromInputOrNextStep,
  onMarkWorkrunCompleted,
  onReopenWorkrun,
  onPauseThreadFromWorkrun,
  onResumeThreadFromWorkrun,
  onRebuildWorkrunFromThread,
  onToggleCheckpointStatus,
  onApplyCheckpointToComposer,
  onAddBoardCheckpointFromFocus
}: MayaActiveWorkrunPanelProps) {
  return (
    <section className="mb-4 rounded-[24px] border border-fuchsia-400/20 bg-fuchsia-500/8 p-4 text-sm text-slate-100 shadow-shell sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-fuchsia-300">Aktiver Arbeitslauf</div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Maya trägt den aktuellen Arbeitsfokus dieses Threads sichtbar weiter und hält letzten Output, nächsten Schritt und Status auf derselben Hauptfläche zusammen.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            Status: {activeWorkrun.status === 'completed' ? 'abgeschlossen' : 'offen'}
          </span>
          {activeWorkrunUpdatedAtLabel ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              Zuletzt aktiv: {activeWorkrunUpdatedAtLabel}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 lg:col-span-2">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Aktueller Fokus</div>
          <p className="mt-2 text-base font-medium leading-7 text-slate-100">{primaryFocus || activeWorkrun.focus}</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Nächster sinnvoller Schritt</div>
              <p className="mt-2 text-sm leading-6 text-slate-200">{primaryNextStep || activeWorkrun.nextStep}</p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Wichtigster offener Kernpunkt</div>
              <p className="mt-2 text-sm leading-6 text-slate-200">{primaryOpenPoint || 'Kein offener Kernpunkt markiert. Der Rohchat bleibt führend.'}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void onApplyPrimaryNextStepToComposer()}
              disabled={loading}
              className="rounded-full border border-fuchsia-300/40 bg-fuchsia-400/15 px-4 py-2 text-xs uppercase tracking-[0.18em] text-fuchsia-50 transition hover:bg-fuchsia-400/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Schritt übernehmen
            </button>
            <button
              type="button"
              onClick={() => void onResumePrimaryNextStepNow()}
              disabled={loading}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Arbeitslauf fortsetzen
            </button>
          </div>
        </div>

        <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Letzter sinnvoller Schritt</div>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            {activeWorkrun.lastStep || 'Noch kein letzter Schritt für diesen Arbeitslauf festgehalten.'}
          </p>
        </div>

        <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Manuelle Steuerung</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void onSetFocusFromInputOrNextStep()}
              disabled={loading}
              className="rounded-full border border-fuchsia-300/40 bg-fuchsia-400/15 px-4 py-2 text-xs uppercase tracking-[0.18em] text-fuchsia-50 transition hover:bg-fuchsia-400/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Fokus setzen
            </button>
            <button
              type="button"
              onClick={() => void onMarkWorkrunCompleted()}
              disabled={loading || activeWorkrun.status === 'completed'}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Als abgeschlossen markieren
            </button>
            <button
              type="button"
              onClick={() => void onReopenWorkrun()}
              disabled={loading || activeWorkrun.status === 'open'}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Wieder öffnen
            </button>
            <button
              type="button"
              onClick={() => void onPauseThreadFromWorkrun()}
              disabled={loading || activeThreadHandoff?.status === 'paused'}
              className="rounded-full border border-amber-300/30 bg-amber-400/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-amber-50 transition hover:bg-amber-400/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Thread parken
            </button>
            <button
              type="button"
              onClick={() => void onResumeThreadFromWorkrun()}
              disabled={loading || activeThreadHandoff?.status === 'active'}
              className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-cyan-50 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Wieder aufnehmen
            </button>
            <button
              type="button"
              onClick={() => void onRebuildWorkrunFromThread()}
              disabled={!canRebuildWorkrunFromThread || loading}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Neu aus Thread ableiten
            </button>
          </div>
        </div>

        {showHandoffSection && activeThreadHandoff ? (
          <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 lg:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Abschluss und Übergabe</div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Diese Schicht bleibt für Parken, Abschluss oder einen wirklich abweichenden Wiedereinstieg sichtbar.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  Status: {activeThreadHandoff.status === 'completed' ? 'abgeschlossen' : activeThreadHandoff.status === 'paused' ? 'geparkt' : 'aktiv'}
                </span>
                {activeThreadHandoffUpdatedAtLabel ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    Übergabe: {activeThreadHandoffUpdatedAtLabel}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {handoffHasDistinctAchieved || activeThreadHandoff.status !== 'active' ? (
                <div className="rounded-[18px] border border-white/10 bg-slate-950/35 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Erreicht</div>
                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    {activeThreadHandoff.achieved || 'Noch kein kompakter Abschlussstand festgehalten.'}
                  </p>
                </div>
              ) : null}

              {handoffOpenItems.length > 0 ? (
                <div className="rounded-[18px] border border-white/10 bg-slate-950/35 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Bleibt offen</div>
                  <div className="mt-3 space-y-2">
                    {handoffOpenItems.map((item) => (
                      <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm leading-6 text-slate-200">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {handoffHasDistinctNextEntry || activeThreadHandoff.status !== 'active' ? (
                <div className="rounded-[18px] border border-white/10 bg-slate-950/35 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Nächster Wiedereinstieg</div>
                  <p className="mt-2 text-sm leading-6 text-slate-200">{activeThreadHandoff.nextEntry}</p>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {activeCheckpointBoard ? (
          <MayaCheckpointBoard
            activeCheckpointBoard={activeCheckpointBoard}
            loading={loading}
            toggleCheckpointStatus={onToggleCheckpointStatus}
            applyResumeAction={onApplyCheckpointToComposer}
            onAddCheckpointFromFocus={onAddBoardCheckpointFromFocus}
          />
        ) : null}

        <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 lg:col-span-2">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Letzter relevanter Output</div>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            {activeWorkrun.lastOutput || 'Noch kein Assistant-Output im aktiven Arbeitslauf vorhanden.'}
          </p>
        </div>
      </div>
    </section>
  );
}
