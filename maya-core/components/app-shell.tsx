 'use client';

import { ReactNode } from 'react';

import { LanguageSwitcher } from '@/components/language-switcher';
import { useLanguage } from '@/components/language-provider';
import { useMayaState } from '@/components/maya-state-provider';
import { PrimaryNav } from '@/components/primary-nav';
import { PwaRegister } from '@/components/pwa-register';
import { getUiText } from '@/lib/i18n';
import { getMayaProductText } from '@/lib/maya-product-text';

type AppShellProps = {
  title: string;
  subtitle: string;
  eyebrow: string;
  children: ReactNode;
  sidePanel: ReactNode;
};

export function AppShell({ title, subtitle, eyebrow, children, sidePanel }: AppShellProps) {
  const { language } = useLanguage();
  const text = getUiText(language);
  const productText = getMayaProductText(language);
  const { state, activeProject, error, isLoading, refresh } = useMayaState();
  const profile = state?.profile;
  const focusItems = profile?.currentFocus || [];

  return (
    <div className="min-h-screen bg-ink bg-radial text-slate-100">
      <PwaRegister />
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-4 px-4 pb-28 pt-4 lg:flex-row lg:px-6 lg:pb-8 lg:pt-6">
        <aside className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-64 lg:self-start lg:min-h-0">
          <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto rounded-[32px] border border-white/10 bg-slate-950/60 p-4 shadow-shell backdrop-blur">
            <div className="px-1 pb-1">
              <div className="text-xs uppercase tracking-[0.24em] text-cyan-300">{text.appName}</div>
              <div className="mt-2 text-sm font-medium text-white">{profile?.displayName || text.appName}</div>
            </div>
            {activeProject ? (
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-amber-300">{productText.shell.activeProject}</div>
                <div className="mt-2 text-base font-semibold text-white">{activeProject.title}</div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{activeProject.nextMove}</p>
              </div>
            ) : null}
            {error ? (
              <div className="rounded-[24px] border border-rose-400/20 bg-rose-500/10 p-4">
                <p className="text-sm leading-6 text-rose-100">{error}</p>
                <button
                  type="button"
                  onClick={() => refresh()}
                  className="mt-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100"
                >
                  {productText.common.retry}
                </button>
              </div>
            ) : null}
            {isLoading ? (
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">{productText.common.loading}</div>
            ) : null}
            <div className="hidden lg:mt-auto lg:flex lg:flex-col lg:gap-4">
              <PrimaryNav />
              <LanguageSwitcher />
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="rounded-[32px] border border-white/10 bg-slate-950/60 p-5 shadow-shell backdrop-blur">
            <div className="text-xs uppercase tracking-[0.24em] text-cyan-300">{eyebrow}</div>
            <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-4xl">{title}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 lg:text-base">{subtitle}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                {focusItems.map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </header>

          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="min-w-0">{children}</section>
            <aside className="min-w-0">{sidePanel}</aside>
          </div>
        </div>
      </div>
      <div className="lg:hidden">
        <PrimaryNav />
      </div>
    </div>
  );
}
