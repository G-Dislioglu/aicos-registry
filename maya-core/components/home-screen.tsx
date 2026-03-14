 'use client';

import Link from 'next/link';

import { AppShell } from '@/components/app-shell';
import { useLanguage } from '@/components/language-provider';
import { useMayaState } from '@/components/maya-state-provider';
import { getPriorityLabel, getStageLabel, getUiText } from '@/lib/i18n';
import { getMayaProductText } from '@/lib/maya-product-text';
import { getMayaState } from '@/lib/seed-data';

export function HomeScreen() {
  const { language } = useLanguage();
  const text = getUiText(language);
  const productText = getMayaProductText(language);
  const { state, activeProject, activeSession, isLoading, setActiveProjectId, selectSession } = useMayaState();
  const focusCards = getMayaState(language).focusCards;
  const activeProjects = (state?.projects || []).filter((project) => project.stage === 'active');
  const memoryItems = [...(state?.memoryItems || [])]
    .sort((left, right) => Number(Boolean(right.pinned)) - Number(Boolean(left.pinned)) || left.title.localeCompare(right.title))
    .slice(0, 3);
  const recentSessions = [...(state?.sessions || [])]
    .sort((left, right) => (right.updatedAt || '').localeCompare(left.updatedAt || ''))
    .slice(0, 4);

  return (
    <AppShell
      eyebrow={text.home.eyebrow}
      title={text.home.title}
      subtitle={text.home.subtitle}
      sidePanel={
        <div className="flex flex-col gap-4">
          <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-shell">
            <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">{text.home.posture}</div>
            <p className="mt-3 text-sm leading-6 text-slate-200">{state?.profile.mission || productText.common.loading}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(state?.profile.communicationStyle || []).map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                  {item}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-shell">
            <div className="text-xs uppercase tracking-[0.22em] text-amber-300">{productText.home.activeFocusTitle}</div>
            {activeProject ? (
              <>
                <h2 className="mt-2 text-xl font-semibold text-white">{activeProject.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">{activeProject.nextMove}</p>
                <button
                  type="button"
                  onClick={() => setActiveProjectId(null)}
                  className="mt-4 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100"
                >
                  {productText.home.clearFocus}
                </button>
              </>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slate-300">{productText.home.activeFocusBody}</p>
            )}
          </section>

          <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-shell">
            <div className="text-xs uppercase tracking-[0.22em] text-violet-300">{text.home.memoryAnchors}</div>
            <div className="mt-4 space-y-3">
              {memoryItems.map((item) => (
                <article key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-semibold text-white">{item.title}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.summary}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <section className="grid gap-4 md:grid-cols-3">
          {focusCards.map((card) => (
            <article key={card.id} className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-shell">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">{card.eyebrow}</div>
              <h2 className="mt-3 text-xl font-semibold text-white">{card.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{card.body}</p>
              <Link href={card.href} className="mt-5 inline-flex rounded-full border border-violet-400/40 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-100">
                {card.actionLabel}
              </Link>
            </article>
          ))}
        </section>

        <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-shell">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">{text.home.activeProjects}</div>
              <h2 className="mt-2 text-2xl font-semibold text-white">{text.home.activeProjectsTitle}</h2>
            </div>
            <Link href="/context" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
              {text.home.openContext}
            </Link>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {activeProjects.map((project) => (
              <article key={project.id} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-cyan-200">{getStageLabel(project.stage, language)}</span>
                  <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-amber-200">{getPriorityLabel(project.priority, language)}</span>
                  {activeProject?.id === project.id ? (
                    <span className="rounded-full bg-violet-400/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-violet-200">{productText.common.active}</span>
                  ) : null}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{project.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{project.summary}</p>
                <div className="mt-4 grid gap-3 text-sm text-slate-300">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{text.home.nextMove}</div>
                    <div className="mt-1">{project.nextMove}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{text.home.risk}</div>
                    <div className="mt-1">{project.risk}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveProjectId(activeProject?.id === project.id ? null : project.id)}
                  className="mt-5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100"
                >
                  {activeProject?.id === project.id ? productText.home.clearFocus : productText.home.setFocus}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-shell">
          <div className="text-xs uppercase tracking-[0.22em] text-violet-300">{productText.home.recentSessions}</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">{activeSession?.title || text.home.sessionTitle}</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {recentSessions.length > 0 ? recentSessions.map((session) => (
              <article key={session.id} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white">{session.title}</div>
                  {activeSession?.id === session.id ? (
                    <span className="rounded-full bg-violet-400/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-violet-200">{productText.common.active}</span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{session.intent}</p>
                <div className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-500">{productText.home.latestMessage}</div>
                <p className="mt-2 text-sm leading-6 text-slate-400">{session.messages[session.messages.length - 1]?.content || productText.home.emptySessions}</p>
                <div className="mt-5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => selectSession(session.id)}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100"
                  >
                    {productText.home.continueSession}
                  </button>
                  <Link href="/chat" className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100">
                    {text.home.continueChat}
                  </Link>
                </div>
              </article>
            )) : (
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">{isLoading ? productText.common.loading : productText.home.emptySessions}</div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
