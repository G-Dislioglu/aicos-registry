'use client';

export function MayaHydrationSkeleton({ className }: { className?: string }) {
  return (
    <div className={className}>
      <section className="mb-4 rounded-[24px] border border-cyan-400/20 bg-cyan-500/8 p-4 text-sm text-slate-100 shadow-shell sm:p-5">
        <div className="animate-pulse space-y-4">
          <div className="h-3 w-36 rounded bg-white/10" />
          <div className="h-5 w-80 max-w-full rounded bg-white/10" />
          <div className="h-4 w-64 max-w-full rounded bg-white/10" />
        </div>
      </section>

      <section className="mb-4 rounded-[24px] border border-white/10 bg-white/5 p-5 shadow-shell">
        <div className="animate-pulse space-y-4">
          <div className="h-3 w-40 rounded bg-white/10" />
          <div className="h-8 w-72 max-w-full rounded bg-white/10" />
          <div className="h-4 w-full rounded bg-white/10" />
          <div className="h-4 w-11/12 rounded bg-white/10" />
        </div>
      </section>
    </div>
  );
}
