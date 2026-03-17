'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { AppShell } from '@/components/app-shell';
import { useLanguage } from '@/components/language-provider';
import { useMayaState } from '@/components/maya-state-provider';
import { getUiText } from '@/lib/i18n';
import { getMayaProductText } from '@/lib/maya-product-text';

export function ChatScreen() {
  const { language } = useLanguage();
  const text = getUiText(language);
  const productText = getMayaProductText(language);
  const { state, activeSession, activeProject, isLoading, isSaving, createSession, selectSession, sendMessage, setActiveProjectId } = useMayaState();
  const [draft, setDraft] = useState<string>(text.chat.defaultDraft);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionIntent, setNewSessionIntent] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setDraft((current) => (current.trim().length > 0 ? current : text.chat.defaultDraft));
  }, [text.chat.defaultDraft]);

  const sessions = useMemo(() => {
    return [...(state?.sessions || [])].sort((left, right) => (right.updatedAt || '').localeCompare(left.updatedAt || ''));
  }, [state?.sessions]);

  const contextMessage = useMemo(() => {
    return [...(activeSession?.messages || [])].reverse().find((message) => (message.relatedProjectIds?.length || 0) > 0 || (message.relatedMemoryIds?.length || 0) > 0);
  }, [activeSession]);

  const visibleProjects = useMemo(() => {
    const projectIds = contextMessage?.relatedProjectIds?.length ? contextMessage.relatedProjectIds : activeProject ? [activeProject.id] : [];
    return (state?.projects || []).filter((project) => projectIds.includes(project.id));
  }, [activeProject, contextMessage, state?.projects]);

  const visibleMemory = useMemo(() => {
    const memoryIds = contextMessage?.relatedMemoryIds?.length
      ? contextMessage.relatedMemoryIds
      : (state?.memoryItems || []).filter((item) => item.pinned).map((item) => item.id).slice(0, 3);

    return (state?.memoryItems || []).filter((item) => memoryIds.includes(item.id));
  }, [contextMessage, state?.memoryItems]);

  async function handleCreateSession() {
    const sessionId = await createSession({
      title: newSessionTitle,
      intent: newSessionIntent
    });

    setNewSessionTitle('');
    setNewSessionIntent('');

    if (sessionId) {
      await selectSession(sessionId);
    }
  }

  async function submitMessage() {
    const content = draft.trim();
    if (!content || isSaving) {
      return;
    }

    setLocalError(null);
    setDraft('');

    try {
      await sendMessage(content);
    } catch {
      setLocalError(text.chat.error);
      setDraft(content);
    }
  }

  return (
    <AppShell
      eyebrow={text.chat.eyebrow}
      title={text.chat.title}
      subtitle={text.chat.subtitle}
      sidePanel={
        <div className="flex flex-col gap-4">
          <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-shell">
            <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">{productText.chat.currentSession}</div>
            <h2 className="mt-2 text-xl font-semibold text-white">{activeSession?.title || productText.common.loading}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">{activeSession?.intent || text.chat.subtitle}</p>
            <p className="mt-4 text-sm leading-6 text-slate-400">{state?.profile.assistantContract || text.chat.helper}</p>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-shell">
            <div className="text-xs uppercase tracking-[0.22em] text-violet-300">{productText.chat.createSession}</div>
            <div className="mt-4 space-y-3">
              <input
                value={newSessionTitle}
                onChange={(event) => setNewSessionTitle(event.target.value)}
                placeholder={productText.chat.newSessionTitle}
                className="w-full rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
              />
              <textarea
                value={newSessionIntent}
                onChange={(event) => setNewSessionIntent(event.target.value)}
                placeholder={productText.chat.newSessionIntent}
                className="min-h-24 w-full rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={handleCreateSession}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100"
              >
                {productText.chat.createSession}
              </button>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-shell">
            <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">{productText.chat.sessionHistory}</div>
            <div className="mt-4 space-y-3">
              {sessions.map((session) => (
                <article key={session.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white">{session.title}</div>
                    {activeSession?.id === session.id ? (
                      <span className="rounded-full bg-violet-400/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-violet-200">{productText.common.active}</span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{session.intent}</p>
                  <button
                    type="button"
                    onClick={() => selectSession(session.id)}
                    className="mt-4 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100"
                  >
                    {productText.chat.selectSession}
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-shell">
            <div className="text-xs uppercase tracking-[0.22em] text-violet-300">{productText.chat.activeProject}</div>
            {visibleProjects.length > 0 ? (
              <div className="mt-4 space-y-3">
                {visibleProjects.map((project) => (
                  <article key={project.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-semibold text-white">{project.title}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{project.nextMove}</p>
                    <button
                      type="button"
                      onClick={() => setActiveProjectId(activeProject?.id === project.id ? null : project.id)}
                      className="mt-4 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100"
                    >
                      {activeProject?.id === project.id ? productText.chat.clearFocus : productText.chat.pinProject}
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slate-300">{productText.chat.noActiveProject}</p>
            )}
          </section>

          <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-shell">
            <div className="text-xs uppercase tracking-[0.22em] text-amber-300">{text.chat.memoryContext}</div>
            <div className="mt-4 space-y-3">
              {visibleMemory.map((item) => (
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
        <section className="rounded-[28px] border border-violet-400/20 bg-violet-500/10 p-4 shadow-shell sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-violet-200">{text.chat.primaryWorkspace}</div>
              <p className="mt-2 text-sm leading-6 text-slate-200">{text.chat.primaryWorkspaceBody}</p>
            </div>
            <Link
              href="/maya"
              className="inline-flex rounded-full border border-violet-300/40 bg-violet-500/15 px-4 py-2 text-sm font-medium text-violet-50 transition hover:border-violet-200 hover:bg-violet-500/25"
            >
              {text.chat.openMaya}
            </Link>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-4 shadow-shell sm:p-5">
          <div className="space-y-4">
            {activeSession?.messages && activeSession.messages.length > 0 ? activeSession.messages.map((message) => {
              const isAssistant = message.role === 'assistant';
              return (
                <article
                  key={message.id}
                  className={[
                    'rounded-[24px] border p-4 sm:p-5',
                    isAssistant
                      ? 'border-cyan-400/20 bg-cyan-400/10 text-slate-100'
                      : 'border-white/10 bg-white/5 text-slate-200'
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                    <span>{isAssistant ? 'Maya' : text.chat.userLabel}</span>
                    <span>{message.timestamp}</span>
                  </div>
                  <div className="mt-3 whitespace-pre-wrap text-sm leading-7 sm:text-[15px]">{message.content}</div>
                </article>
              );
            }) : (
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-300">{isLoading ? productText.common.loading : productText.chat.emptySession}</div>
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-4 shadow-shell sm:p-5">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-400">{text.chat.composer}</div>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={text.chat.placeholder}
            className="mt-4 min-h-40 w-full rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-400/50 focus:bg-white/[0.07]"
          />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm leading-6 text-slate-400">{text.chat.helper}</p>
              {localError ? <p className="mt-2 text-sm text-rose-300">{localError}</p> : null}
            </div>
            <button
              type="button"
              onClick={submitMessage}
              disabled={isSaving}
              className="rounded-full border border-violet-400/40 bg-violet-500/10 px-5 py-3 text-sm font-medium text-violet-100 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? text.chat.thinking : text.chat.send}
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
