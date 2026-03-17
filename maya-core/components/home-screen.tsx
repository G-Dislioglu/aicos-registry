 'use client';

import Link from 'next/link';

import { AppShell } from '@/components/app-shell';
import { useLanguage } from '@/components/language-provider';
import { getUiText } from '@/lib/i18n';

export function HomeScreen() {
  const { language } = useLanguage();
  const text = getUiText(language);

  return (
    <AppShell
      eyebrow={text.home.eyebrow}
      title={text.home.title}
      subtitle={text.home.subtitle}
      sidePanel={
        <div className="flex flex-col gap-4">
          <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-shell">
            <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">{text.home.primaryWorkspace}</div>
            <h2 className="mt-2 text-xl font-semibold text-white">{text.home.primaryWorkspaceTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">{text.home.primaryWorkspaceBody}</p>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-shell">
            <div className="text-xs uppercase tracking-[0.22em] text-amber-300">{text.home.classicChat}</div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{text.home.classicChatBody}</p>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-shell">
            <div className="text-xs uppercase tracking-[0.22em] text-violet-300">{text.home.contextPath}</div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{text.home.contextPathBody}</p>
          </section>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <section className="rounded-[32px] border border-violet-400/20 bg-slate-950/70 p-6 shadow-shell lg:p-8">
          <div className="text-xs uppercase tracking-[0.24em] text-violet-300">{text.home.primaryWorkspace}</div>
          <h2 className="mt-3 text-2xl font-semibold text-white lg:text-3xl">{text.home.primaryWorkspaceTitle}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 lg:text-base">{text.home.primaryWorkspaceBody}</p>
          <Link
            href="/maya"
            className="mt-6 inline-flex rounded-full border border-violet-400/50 bg-violet-500/15 px-5 py-3 text-sm font-semibold text-violet-50 transition hover:border-violet-300 hover:bg-violet-500/25"
          >
            {text.home.openMaya}
          </Link>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-shell">
            <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">{text.home.classicChat}</div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{text.home.classicChatBody}</p>
            <Link
              href="/chat"
              className="mt-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:border-cyan-300/40 hover:text-white"
            >
              {text.home.continueChat}
            </Link>
          </article>

          <article className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-shell">
            <div className="text-xs uppercase tracking-[0.22em] text-violet-300">{text.home.contextPath}</div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{text.home.contextPathBody}</p>
            <Link
              href="/context"
              className="mt-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:border-violet-300/40 hover:text-white"
            >
              {text.home.openContext}
            </Link>
          </article>
        </section>
      </div>
    </AppShell>
  );
}
