'use client';

import { FormEvent, useState } from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';

type LoginScreenProps = {
  mode?: string;
  nextPath: Route;
};

export function LoginScreen({ mode, nextPath }: LoginScreenProps) {
  const router = useRouter();
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ passphrase })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || 'login_failed');
      }

      router.replace(nextPath);
      router.refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'login_failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-ink bg-radial px-4 py-8 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center">
        <div className="w-full rounded-[32px] border border-white/10 bg-slate-950/70 p-6 shadow-shell backdrop-blur">
          <div className="text-xs uppercase tracking-[0.24em] text-cyan-300">Maya</div>
          <h1 className="mt-3 text-2xl font-semibold text-white">Single-user access</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">Enter your Maya passphrase to open your personal workspace.</p>
          {mode === 'misconfigured' ? <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">Maya auth is not configured yet. Set the required runtime secrets before using this deploy.</p> : null}
          {error ? <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</p> : null}
          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="text-sm text-slate-300">
              Passphrase
              <input
                type="password"
                value={passphrase}
                onChange={(event) => setPassphrase(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
                autoComplete="current-password"
              />
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full border border-violet-400 bg-violet-500/15 px-4 py-3 text-sm font-medium text-white transition hover:border-cyan-300/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Opening Maya…' : 'Open Maya'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
