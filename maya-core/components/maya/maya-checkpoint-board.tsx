'use client';

import { type MayaActiveCheckpointBoard } from '@/lib/maya-thread-digest';

type MayaCheckpointBoardProps = {
  activeCheckpointBoard: MayaActiveCheckpointBoard;
  loading: boolean;
  toggleCheckpointStatus: (checkpointId: string, status: 'open' | 'completed') => void | Promise<void>;
  applyResumeAction: (text: string, append: boolean) => void | Promise<void>;
  onAddCheckpointFromFocus: () => void | Promise<void>;
};

export function MayaCheckpointBoard({
  activeCheckpointBoard,
  loading,
  toggleCheckpointStatus,
  applyResumeAction,
  onAddCheckpointFromFocus
}: MayaCheckpointBoardProps) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 lg:col-span-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Arbeitsboard</div>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Kleine sichtbare Checkpoints halten den Arbeitslauf dieses Threads offen, erledigt und wiederaufnehmbar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            Fortschritt: {activeCheckpointBoard.progressPercent}%
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            Offen: {activeCheckpointBoard.openCount}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            Erledigt: {activeCheckpointBoard.completedCount}
          </span>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-900/80">
        <div
          className="h-full rounded-full bg-fuchsia-400/80 transition-all"
          style={{ width: `${activeCheckpointBoard.progressPercent}%` }}
        />
      </div>

      <div className="mt-4 grid gap-3">
        {activeCheckpointBoard.checkpoints.map((checkpoint) => (
          <div key={checkpoint.id} className="rounded-[18px] border border-white/10 bg-slate-950/35 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-sm font-medium leading-6 text-slate-100">{checkpoint.label}</div>
                {checkpoint.detail ? (
                  <p className="mt-2 text-sm leading-6 text-slate-300">{checkpoint.detail}</p>
                ) : null}
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
                {checkpoint.status === 'completed' ? 'erledigt' : 'offen'}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void toggleCheckpointStatus(checkpoint.id, 'completed')}
                disabled={loading || checkpoint.status === 'completed'}
                className="rounded-full border border-fuchsia-300/40 bg-fuchsia-400/15 px-4 py-2 text-xs uppercase tracking-[0.18em] text-fuchsia-50 transition hover:bg-fuchsia-400/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Abhaken
              </button>
              <button
                type="button"
                onClick={() => void toggleCheckpointStatus(checkpoint.id, 'open')}
                disabled={loading || checkpoint.status === 'open'}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Wieder öffnen
              </button>
              <button
                type="button"
                onClick={() => void applyResumeAction(checkpoint.label, false)}
                disabled={loading}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                In Composer übernehmen
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void onAddCheckpointFromFocus()}
          disabled={loading || activeCheckpointBoard.checkpoints.length >= 4}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Checkpoint ergänzen
        </button>
      </div>
    </div>
  );
}
