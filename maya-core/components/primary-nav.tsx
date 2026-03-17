'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useLanguage } from '@/components/language-provider';
import { getUiText } from '@/lib/i18n';

export function PrimaryNav() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const text = getUiText(language);
  const items = [
    { href: '/', label: text.nav.home, hint: text.nav.homeHint },
    { href: '/maya', label: text.nav.maya, hint: text.nav.mayaHint },
    { href: '/chat', label: text.nav.chat, hint: text.nav.chatHint },
    { href: '/context', label: text.nav.context, hint: text.nav.contextHint }
  ] as const;

  return (
    <nav className="fixed inset-x-4 bottom-4 z-50 rounded-[28px] border border-white/10 bg-slate-950/90 p-2 shadow-shell backdrop-blur lg:static lg:inset-auto lg:bottom-auto lg:border-none lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-0">
      <div className="grid grid-cols-4 gap-2 lg:flex lg:flex-col">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'rounded-2xl border px-4 py-3 transition',
                active
                  ? 'border-violet-400 bg-violet-500/15 text-white'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:border-cyan-300/40 hover:text-white'
              ].join(' ')}
            >
              <div className="text-sm font-semibold">{item.label}</div>
              <div className="text-xs text-slate-400">{item.hint}</div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
