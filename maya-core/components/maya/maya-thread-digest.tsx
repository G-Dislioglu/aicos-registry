'use client';

import { type ThreadDigest } from '@/lib/types';

type MayaThreadDigestProps = {
  threadDigest: ThreadDigest | null;
  loading: boolean;
  canBuildDigest: boolean;
  digestNeedsRefresh: boolean;
  digestHasDistinctSummary: boolean;
  digestHasDistinctCurrentState: boolean;
  digestOpenLoops: string[];
  digestHasDistinctNextEntry: boolean;
  threadDigestUpdatedAtLabel: string | null;
  onRefresh: () => void;
};

export function MayaThreadDigest({
  threadDigest,
  loading,
  canBuildDigest,
  digestNeedsRefresh,
  digestHasDistinctSummary,
  digestHasDistinctCurrentState,
  digestOpenLoops,
  digestHasDistinctNextEntry,
  threadDigestUpdatedAtLabel,
  onRefresh
}: MayaThreadDigestProps) {
  return (
    <section className="mb-4 rounded-[24px] border border-emerald-400/20 bg-emerald-500/8 p-4 text-sm text-slate-100 shadow-shell sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-emerald-300">Fadenkompass</div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Rohchat bleibt führend. Der Fadenkompass ist nur die kompakte Orientierungsschicht für den aktuellen Maya-Thread.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={!canBuildDigest || loading}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Faden verdichten
        </button>
      </div>

      {threadDigest ? (
        <div className="mt-4 space-y-4">
          {digestNeedsRefresh ? (
            <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm leading-6 text-amber-100">
              Seit dem letzten Digest sind neue Nachrichten dazugekommen.
            </div>
          ) : null}

          {digestHasDistinctSummary ? (
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Faden-Kern</div>
              <p className="mt-2 text-sm leading-6 text-slate-200">{threadDigest.summary}</p>
            </div>
          ) : null}

          {digestHasDistinctCurrentState ? (
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Aktueller Stand</div>
              <p className="mt-2 text-sm leading-6 text-slate-200">{threadDigest.currentState}</p>
            </div>
          ) : null}

          {digestOpenLoops.length > 0 ? (
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Offene Punkte</div>
              <div className="mt-2 space-y-2">
                {digestOpenLoops.map((loop) => (
                  <div key={loop} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-200">
                    {loop}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {digestHasDistinctNextEntry ? (
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Nächster Einstieg</div>
              <p className="mt-2 text-sm leading-6 text-slate-200">{threadDigest.nextEntry}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Vertrauen: {threadDigest.confidence}</span>
            {threadDigestUpdatedAtLabel ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Aktualisiert: {threadDigestUpdatedAtLabel}</span>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-slate-300">
          Noch kein Digest vorhanden. Verdichte den Faden, wenn du eine kompakte Orientierung für diesen Maya-Thread willst.
        </p>
      )}
    </section>
  );
}
