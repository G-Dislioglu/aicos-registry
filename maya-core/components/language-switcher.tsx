'use client';

import { useLanguage } from '@/components/language-provider';
import { getUiText } from '@/lib/i18n';
import { AppLanguage } from '@/lib/types';

const options: AppLanguage[] = ['de', 'en'];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const text = getUiText(language);

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">{text.languageLabel}</div>
      <div className="mt-3 flex gap-2">
        {options.map((option) => {
          const active = option === language;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setLanguage(option)}
              className={[
                'rounded-full border px-4 py-2 text-sm font-medium uppercase transition',
                active
                  ? 'border-violet-400 bg-violet-500/15 text-white'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:border-cyan-300/40 hover:text-white'
              ].join(' ')}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
