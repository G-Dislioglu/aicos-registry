'use client';

import { type MayaContinuityBriefing, type MayaResumeAction } from '@/lib/maya-thread-digest';

type MayaContinuityBriefingProps = {
  continuityBriefing: MayaContinuityBriefing;
  continuityBriefingUpdatedAtLabel?: string | null;
  briefingHasDistinctFocus: boolean;
  briefingHasDistinctCurrentState: boolean;
  briefingHasDistinctNextStep: boolean;
  briefingOpenLoops: string[];
  showContinuityResumeActions: boolean;
  secondaryResumeActions: MayaResumeAction[];
  loading: boolean;
  onApplyResumeAction: (prompt: string, sendNow: boolean) => void | Promise<void>;
};

export function MayaContinuityBriefing({
  continuityBriefing,
  continuityBriefingUpdatedAtLabel,
  briefingHasDistinctFocus,
  briefingHasDistinctCurrentState,
  briefingHasDistinctNextStep,
  briefingOpenLoops,
  showContinuityResumeActions,
  secondaryResumeActions,
  loading,
  onApplyResumeAction
}: MayaContinuityBriefingProps) {
  return (
    <section className="mb-4 rounded-[24px] border border-violet-400/20 bg-violet-500/8 p-4 text-sm text-slate-100 shadow-shell sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-violet-300">Kontinuitäts-Briefing</div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Diese Schicht bleibt als knappe Wiedereinstiegslesart sichtbar, wenn sie gegenüber Arbeitslauf und Übergabe noch zusätzliche Orientierung liefert.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            Quelle: {continuityBriefing.source === 'digest' ? 'Fadenkompass' : 'Aktiver Thread'}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            Vertrauen: {continuityBriefing.confidence}
          </span>
          {continuityBriefingUpdatedAtLabel ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              Stand: {continuityBriefingUpdatedAtLabel}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {briefingHasDistinctFocus ? (
          <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Woran Maya gerade mit dir arbeitet</div>
            <div className="mt-2 text-base font-medium leading-7 text-slate-100">{continuityBriefing.title}</div>
            <p className="mt-3 text-sm leading-6 text-slate-200">{continuityBriefing.focus}</p>
          </div>
        ) : null}

        {briefingHasDistinctCurrentState ? (
          <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Knapper Stand</div>
            <p className="mt-2 text-sm leading-6 text-slate-200">{continuityBriefing.currentState}</p>
          </div>
        ) : null}

        {briefingHasDistinctNextStep ? (
          <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 lg:col-span-2">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Knapper Wiedereinstieg</div>
            <p className="mt-2 text-sm leading-6 text-slate-200">{continuityBriefing.nextStep}</p>
          </div>
        ) : null}

        {briefingOpenLoops.length > 0 ? (
          <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 lg:col-span-2">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Zusätzliche offene Punkte</div>
            <div className="mt-3 space-y-2">
              {briefingOpenLoops.map((loop) => (
                <div key={loop} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm leading-6 text-slate-200">
                  {loop}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {showContinuityResumeActions ? (
        <div className="mt-4 rounded-[20px] border border-white/10 bg-white/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Resume-Actions</div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Nur die zusätzlichen Wiedereinstiegsoptionen bleiben hier sichtbar, wenn sie vom Hauptschritt abweichen.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {secondaryResumeActions.map((action) => (
              <div key={action.id} className="rounded-[18px] border border-white/10 bg-slate-950/35 p-4">
                <div className="text-sm font-medium leading-6 text-slate-100">{action.label}</div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{action.prompt}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void onApplyResumeAction(action.prompt, false)}
                    disabled={loading}
                    className={[
                      'rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-50',
                      action.emphasis === 'primary'
                        ? 'border-violet-300/40 bg-violet-400/15 text-violet-50 hover:bg-violet-400/20'
                        : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                    ].join(' ')}
                  >
                    In Composer übernehmen
                  </button>
                  <button
                    type="button"
                    onClick={() => void onApplyResumeAction(action.prompt, true)}
                    disabled={loading}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Direkt fortsetzen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
