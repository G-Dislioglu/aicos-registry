'use client';

import {
  type MayaActiveWorkrun
} from '@/lib/maya-thread-digest';

type MayaActiveWorkrunPanelProps = {
  activeWorkrun: MayaActiveWorkrun;
  activeWorkrunUpdatedAtLabel: string | null;
  primaryFocus: string | null;
  primaryNextStep: string | null;
  primaryOpenPoint: string | null;
  loading: boolean;
  onApplyPrimaryNextStepToComposer: () => void | Promise<void>;
  onResumePrimaryNextStepNow: () => void | Promise<void>;
  onOpenDetailsLens: () => void;
};

export function MayaActiveWorkrunPanel({
  activeWorkrun,
  activeWorkrunUpdatedAtLabel,
  primaryFocus,
  primaryNextStep,
  primaryOpenPoint,
  loading,
  onApplyPrimaryNextStepToComposer,
  onResumePrimaryNextStepNow,
  onOpenDetailsLens
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
            <button
              type="button"
              onClick={onOpenDetailsLens}
              className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-cyan-50 transition hover:bg-cyan-400/15"
            >
              Details in Lens
            </button>
          </div>
        </div>

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
