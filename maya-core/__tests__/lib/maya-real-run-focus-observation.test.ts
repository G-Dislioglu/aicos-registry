import { describe, expect, it } from 'vitest';

import { buildEpistemicGuardrail } from '../../lib/maya-epistemic-guardrail';
import { buildPreDispatchCrushLight } from '../../lib/maya-provider-dispatch';
import { buildMayaMainSurfaceDerivation } from '../../lib/maya-thread-digest';
import { ChatSession } from '../../lib/types';

function makeObservedSession(assistantReply: string): ChatSession {
  return {
    id: 'thread-real-run-focus',
    title: 'Runtime-Pfad fokussieren',
    intent: 'Nur den kleinsten sicheren Runtime-Fix prüfen.',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Bitte prüf zuerst die Architektur, die Navigation und alle Begleitpfade sehr breit.',
        timestamp: '10:00'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Ich schaue zuerst auf die Breite des Systems.',
        timestamp: '10:01'
      },
      {
        id: 'm3',
        role: 'user',
        content: 'Kannst du jetzt nur noch den kleinsten sicheren Runtime-Fix prüfen?',
        timestamp: '10:02'
      },
      {
        id: 'm4',
        role: 'assistant',
        content: assistantReply,
        timestamp: '10:03'
      }
    ],
    digest: {
      threadId: 'thread-real-run-focus',
      title: 'Alter Breiten-Digest',
      summary: 'Alte breite Architektur- und Navigationsprüfung.',
      currentState: 'Alter Digest-Zustand.',
      openLoops: ['Alte breite Schleife'],
      nextEntry: 'Alte breite Prüfung fortsetzen.',
      confidence: 'medium',
      updatedAt: '2026-03-28T09:59:00.000Z',
      sourceMessageCount: 1,
      needsRefresh: true
    },
    createdAt: '2026-03-28T09:58:00.000Z',
    updatedAt: '2026-03-28T10:03:00.000Z'
  };
}

describe('maya real-run focus observation', () => {
  it('keeps a near-simulated run aligned when focus, continuity fallback, and guardrail all stay bounded', () => {
    const assistantReply = 'Ich prüfe zuerst den Runtime-Pfad im Repo und schlage dann den kleinsten sicheren Fix vor. Stand 2026-03-28, Commit abc123.';
    const session = makeObservedSession(assistantReply);
    const latestUserMessage = session.messages[2]?.content || '';

    const crushLight = buildPreDispatchCrushLight(session.messages.map((message) => ({
      role: message.role,
      content: message.content
    })));
    const surface = buildMayaMainSurfaceDerivation(session, undefined);
    const guardrail = buildEpistemicGuardrail(latestUserMessage, assistantReply);

    expect(crushLight).toContain('nicht_wegstreichbarer_kern=Kannst du jetzt nur noch den kleinsten sicheren Runtime-Fix prüfen?');
    expect(crushLight).not.toContain('Navigation');
    expect(surface.briefing?.source).toBe('session');
    expect(surface.primaryFocus).toBe('Nur den kleinsten sicheren Runtime-Fix prüfen.');
    expect(surface.primaryFocus).not.toContain('Alte breite Architektur');
    expect(surface.primaryNextStep).not.toContain('Alte breite Prüfung fortsetzen');
    expect(guardrail.mirror).toContain('Kannst du jetzt nur noch den kleinsten sicheren Runtime-Fix prüfen?');
    expect(guardrail.overclaimWarning).toBeNull();
    expect(guardrail.freshnessWarning).toBeNull();
  });

  it('surfaces guardrail warnings when a near-simulated reply drifts while continuity still falls back to session truth', () => {
    const assistantReply = 'Das ist definitiv vollständig gelöst und aktuell die neueste Lösung.';
    const session = makeObservedSession(assistantReply);
    const latestUserMessage = session.messages[2]?.content || '';

    const crushLight = buildPreDispatchCrushLight(session.messages.map((message) => ({
      role: message.role,
      content: message.content
    })));
    const surface = buildMayaMainSurfaceDerivation(session, undefined);
    const guardrail = buildEpistemicGuardrail(latestUserMessage, assistantReply);

    expect(crushLight).toContain('nicht_wegstreichbarer_kern=Kannst du jetzt nur noch den kleinsten sicheren Runtime-Fix prüfen?');
    expect(surface.briefing?.source).toBe('session');
    expect(surface.primaryFocus).toBe('Nur den kleinsten sicheren Runtime-Fix prüfen.');
    expect(surface.primaryFocus).not.toContain('Alte breite Architektur');
    expect(guardrail.mirror).toContain('Kannst du jetzt nur noch den kleinsten sicheren Runtime-Fix prüfen?');
    expect(guardrail.overclaimWarning).toBe('Antwort klingt stellenweise zu sicher. Prüfe, ob die Behauptung wirklich durch Input, Repo-Stand oder Kontext gedeckt ist.');
    expect(guardrail.freshnessWarning).toBe('Antwort enthält zeitabhängige Aussagen ohne klaren Frischeanker. Prüfe, ob Stand, Commit oder Datum explizit benannt werden sollte.');
  });
});
