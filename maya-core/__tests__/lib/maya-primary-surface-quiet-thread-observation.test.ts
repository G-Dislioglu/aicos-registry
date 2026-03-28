import { describe, expect, it } from 'vitest';

import { buildMayaMainSurfaceDerivation } from '../../lib/maya-thread-digest';
import { ChatSession } from '../../lib/types';

function makeEmptyQuietThreadSession(): ChatSession {
  return {
    id: 'thread-quiet-empty',
    title: '',
    intent: '',
    messages: [],
    createdAt: '2026-03-28T11:00:00.000Z',
    updatedAt: '2026-03-28T11:00:00.000Z'
  };
}

function makeWeakEarlyThreadSession(): ChatSession {
  return {
    id: 'thread-quiet-early',
    title: 'Neuer Maya-Thread',
    intent: '',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'hallo Maya',
        timestamp: '11:00'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Hier ist die kürzeste nützliche Lesart: Ich brauche noch etwas mehr Konkretion, um dir wirklich gut zu helfen. Im Moment ist Maya der stärkste aktive Kontext.',
        timestamp: '11:01'
      }
    ],
    createdAt: '2026-03-28T11:00:00.000Z',
    updatedAt: '2026-03-28T11:01:00.000Z'
  };
}

function makeQuietSubstantiveThreadSession(): ChatSession {
  return {
    id: 'thread-quiet-substantive',
    title: '',
    intent: '',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Zwei Preisanker für den ersten Test vergleichen und den kleinsten Unterschied benennen.',
        timestamp: '11:02'
      }
    ],
    createdAt: '2026-03-28T11:02:00.000Z',
    updatedAt: '2026-03-28T11:02:00.000Z'
  };
}

describe('maya primary surface quiet-thread observation', () => {
  it('keeps empty quiet threads on minimal derived defaults instead of inflating thread truth', () => {
    const surface = buildMayaMainSurfaceDerivation(makeEmptyQuietThreadSession(), undefined);

    expect(surface.briefing).toBeUndefined();
    expect(surface.workrun).toBeUndefined();
    expect(surface.handoff?.nextEntry).toBe('Mit diesem Thread sinnvoll wieder einsteigen.');
    expect(surface.workspace?.focus).toBe('Aktiver Arbeitsraum');
    expect(surface.primaryFocus).toBe('Aktiver Arbeitsraum');
    expect(surface.primaryNextStep).toBe('Mit diesem Thread sinnvoll wieder einsteigen.');
    expect(surface.primaryOpenPoint).toBeNull();
  });

  it('keeps weak early threads on start-state guidance instead of quiet-thread defaults', () => {
    const surface = buildMayaMainSurfaceDerivation(makeWeakEarlyThreadSession(), undefined);

    expect(surface.briefing?.source).toBe('session');
    expect(surface.primaryFocus).toBe('Anliegen für diesen Thread schärfen');
    expect(surface.primaryNextStep).toBe('Beschreibe kurz Ziel, Kontext oder Entscheidung, bei der Maya dich jetzt als Nächstes unterstützen soll.');
    expect(surface.primaryOpenPoint).toBe('Es fehlt noch das konkrete Ziel oder die Entscheidung, auf die Maya den Arbeitslauf ausrichten soll.');
    expect(surface.primaryFocus).not.toBe('Aktiver Arbeitsraum');
    expect(surface.primaryNextStep).not.toBe('Mit diesem Thread sinnvoll wieder einsteigen.');
  });

  it('keeps a quiet but substantive thread grounded in thread truth without collapsing back to start-state or empty-thread defaults', () => {
    const surface = buildMayaMainSurfaceDerivation(makeQuietSubstantiveThreadSession(), undefined);

    expect(surface.briefing?.source).toBe('session');
    expect(surface.workrun?.focus).toBe('Zwei Preisanker für den ersten Test vergleichen und den kleinsten Unterschied benennen.');
    expect(surface.workrun?.nextStep).toBe('Daran als Nächstes anknüpfen: Zwei Preisanker für den ersten Test vergleichen und den kleinsten Unterschied benennen.');
    expect(surface.handoff?.nextEntry).toBe('Daran als Nächstes anknüpfen: Zwei Preisanker für den ersten Test vergleichen und den kleinsten Unterschied benennen.');
    expect(surface.primaryFocus).toBe(surface.workrun?.focus || null);
    expect(surface.primaryNextStep).toBe(surface.workrun?.nextStep || null);
    expect(surface.primaryOpenPoint).toBe(surface.handoff?.openItems[0] || null);
    expect(surface.primaryFocus).toBe('Zwei Preisanker für den ersten Test vergleichen und den kleinsten Unterschied benennen.');
    expect(surface.primaryNextStep).not.toBe('Beschreibe kurz Ziel, Kontext oder Entscheidung, bei der Maya dich jetzt als Nächstes unterstützen soll.');
    expect(surface.primaryNextStep).not.toBe('Mit diesem Thread sinnvoll wieder einsteigen.');
    expect(surface.primaryOpenPoint).not.toBe('Es fehlt noch das konkrete Ziel oder die Entscheidung, auf die Maya den Arbeitslauf ausrichten soll.');
  });
});
