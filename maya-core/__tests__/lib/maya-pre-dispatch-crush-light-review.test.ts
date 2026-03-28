import { describe, expect, it } from 'vitest';

import { buildEpistemicGuardrail } from '../../lib/maya-epistemic-guardrail';
import { buildPreDispatchCrushLight } from '../../lib/maya-provider-dispatch';
import { buildMayaMainSurfaceDerivation } from '../../lib/maya-thread-digest';
import { ChatSession } from '../../lib/types';

function makeObservedSession(userMessage: string, assistantReply: string): ChatSession {
  return {
    id: 'thread-pre-dispatch-review',
    title: 'Fokusreview für Crush Light',
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
        content: userMessage,
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
      threadId: 'thread-pre-dispatch-review',
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

describe('maya pre-dispatch crush light review', () => {
  it('keeps the latest narrow request ahead of earlier broad context in a near-simulated run', () => {
    const userMessage = 'Die alte Breite war nur Kontext. Kannst du jetzt bitte nur noch den kleinsten sicheren Runtime-Fix prüfen und alles andere nachrangig behandeln?';
    const assistantReply = 'Ich prüfe jetzt nur den kleinsten sicheren Runtime-Fix im Repo und halte Nebenpfade nachrangig. Stand 2026-03-28, Commit abc123.';
    const session = makeObservedSession(userMessage, assistantReply);

    const crushLight = buildPreDispatchCrushLight(session.messages.map((message) => ({
      role: message.role,
      content: message.content
    })));
    const surface = buildMayaMainSurfaceDerivation(session, undefined);
    const guardrail = buildEpistemicGuardrail(userMessage, assistantReply);

    expect(crushLight).toContain('nicht_wegstreichbarer_kern=Kannst du jetzt bitte nur noch den kleinsten sicheren Runtime-Fix prüfen und alles andere nachrangig behandeln?');
    expect(crushLight).not.toContain('Architektur');
    expect(surface.briefing?.source).toBe('session');
    expect(surface.primaryFocus).toContain('kleinsten sicheren Runtime-Fix');
    expect(surface.primaryFocus).not.toContain('Alte breite Architektur');
    expect(guardrail.mirror).toContain('Kannst du jetzt bitte nur noch den kleinsten sicheren Runtime-Fix prüfen');
    expect(guardrail.overclaimWarning).toBeNull();
    expect(guardrail.freshnessWarning).toBeNull();
  });

  it('prefers the explicit request segment inside the latest user message instead of its broad lead-in', () => {
    const userMessage = 'Zur Einordnung gab es vorher viel Architektur- und Routingbreite. Bitte prüf jetzt nur noch den kleinsten sicheren Runtime-Fix und zieh die alte Breite nicht wieder hoch.';
    const assistantReply = 'Ich bleibe beim kleinsten sicheren Runtime-Fix und hole die alte Breite nicht zurück. Stand 2026-03-28 im Repo.';
    const session = makeObservedSession(userMessage, assistantReply);

    const crushLight = buildPreDispatchCrushLight(session.messages.map((message) => ({
      role: message.role,
      content: message.content
    })));
    const surface = buildMayaMainSurfaceDerivation(session, undefined);

    expect(crushLight).toContain('nicht_wegstreichbarer_kern=Bitte prüf jetzt nur noch den kleinsten sicheren Runtime-Fix und zieh die alte Breite nicht wieder hoch.');
    expect(crushLight).not.toContain('Zur Einordnung gab es vorher viel Architektur- und Routingbreite.');
    expect(surface.primaryFocus).toContain('kleinsten sicheren Runtime-Fix');
    expect(surface.primaryNextStep).not.toContain('Alte breite Prüfung fortsetzen');
  });

  it('still finds the active pressure from the latest user message when no explicit request phrase is present', () => {
    const userMessage = 'Kurzer Auftakt. Der eigentliche Druck liegt darin, dass nur der kleinste belastbare Runtime-Eingriff zählt und jede Rückkehr in die alte Breite jetzt schaden würde.';
    const assistantReply = 'Ich halte mich an den kleinsten belastbaren Runtime-Eingriff. Stand 2026-03-28, Commit def456.';
    const session = makeObservedSession(userMessage, assistantReply);

    const crushLight = buildPreDispatchCrushLight(session.messages.map((message) => ({
      role: message.role,
      content: message.content
    })));
    const guardrail = buildEpistemicGuardrail(userMessage, assistantReply);

    expect(crushLight).toContain('nicht_wegstreichbarer_kern=Der eigentliche Druck liegt darin, dass nur der kleinste belastbare Runtime-Eingriff zählt und jede Rückkehr in die alte Breite jetzt schaden würde.');
    expect(guardrail.mirror).toContain('Der eigentliche Druck liegt darin');
    expect(guardrail.overclaimWarning).toBeNull();
    expect(guardrail.freshnessWarning).toBeNull();
  });

  it('does not suppress guardrail warnings when the reply drifts even though crush light stays narrowly focused', () => {
    const userMessage = 'Kannst du jetzt bitte nur noch den kleinsten sicheren Runtime-Fix prüfen und keine alte Breite wieder aufmachen?';
    const assistantReply = 'Das ist definitiv vollständig gelöst und aktuell die neueste Lösung.';
    const session = makeObservedSession(userMessage, assistantReply);

    const crushLight = buildPreDispatchCrushLight(session.messages.map((message) => ({
      role: message.role,
      content: message.content
    })));
    const surface = buildMayaMainSurfaceDerivation(session, undefined);
    const guardrail = buildEpistemicGuardrail(userMessage, assistantReply);

    expect(crushLight).toContain('nicht_wegstreichbarer_kern=Kannst du jetzt bitte nur noch den kleinsten sicheren Runtime-Fix prüfen und keine alte Breite wieder aufmachen?');
    expect(surface.primaryFocus).toContain('kleinsten sicheren Runtime-Fix');
    expect(guardrail.mirror).toContain('Kannst du jetzt bitte nur noch den kleinsten sicheren Runtime-Fix prüfen');
    expect(guardrail.overclaimWarning).toBe('Antwort klingt stellenweise zu sicher. Prüfe, ob die Behauptung wirklich durch Input, Repo-Stand oder Kontext gedeckt ist.');
    expect(guardrail.freshnessWarning).toBe('Antwort enthält zeitabhängige Aussagen ohne klaren Frischeanker. Prüfe, ob Stand, Commit oder Datum explizit benannt werden sollte.');
  });
});
