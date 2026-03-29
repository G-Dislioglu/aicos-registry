import { describe, expect, it } from 'vitest';

import { buildMayaMainSurfaceDerivation } from '../../lib/maya-thread-digest';
import { ChatSession } from '../../lib/types';

function makeFocusResumeBoundarySession(): ChatSession {
  return {
    id: 'thread-focus-resume-boundary',
    title: 'Checkout-Risiko sortieren',
    intent: 'Das breitere Checkout-Risiko fuer Preisanker A sauber sortieren.',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Sortiere das breitere Checkout-Risiko fuer Preisanker A, aber halte den Thread danach entlang der Leitfrage offen.',
        timestamp: '12:05'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Gut, dann bleibt die Leitfrage breit genug, waehrend der Wiedereinstieg nur den naechsten konkreten Schritt markiert.',
        timestamp: '12:06'
      }
    ],
    digest: {
      threadId: 'thread-focus-resume-boundary',
      title: 'Checkout-Risiko sortieren',
      summary: 'Das breitere Checkout-Risiko fuer Preisanker A sauber sortieren.',
      currentState: 'Die Leitfrage ist geklaert, der naechste konkrete Schritt ist kleiner als der Thread-Fokus.',
      openLoops: ['Preisanker A im ersten Test gegen Checkout-Abbruchquote pruefen.'],
      nextEntry: 'Preisanker A im ersten Test gegen Checkout-Abbruchquote pruefen.',
      confidence: 'medium',
      updatedAt: '2026-03-29T10:03:00.000Z',
      sourceMessageCount: 2,
      needsRefresh: false
    },
    createdAt: '2026-03-29T10:02:00.000Z',
    updatedAt: '2026-03-29T10:03:00.000Z'
  };
}

describe('maya focus resume boundary observation', () => {
  it('keeps primary focus broader than the resume action when next-step and open-point already own the re-entry lane', () => {
    const surface = buildMayaMainSurfaceDerivation(makeFocusResumeBoundarySession(), undefined);
    const resumeAction = surface.resumeActions.find((action) => action.source === 'resume');

    expect(surface.primaryFocus).toBe('Das breitere Checkout-Risiko fuer Preisanker A sauber sortieren.');
    expect(surface.primaryNextStep).toBe('Preisanker A im ersten Test gegen Checkout-Abbruchquote pruefen.');
    expect(surface.primaryOpenPoint).toBe('Preisanker A im ersten Test gegen Checkout-Abbruchquote pruefen.');
    expect(surface.primaryFocus).toBe(surface.briefing?.focus || null);
    expect(surface.primaryNextStep).toBe(surface.handoff?.nextEntry || null);
    expect(surface.primaryOpenPoint).toBe(surface.handoff?.openItems[0] || null);
    expect(surface.primaryFocus).not.toBe(surface.primaryNextStep);
    expect(surface.primaryFocus).not.toBe(surface.primaryOpenPoint);
    expect(resumeAction?.prompt).toContain('Das breitere Checkout-Risiko fuer Preisanker A sauber sortieren.');
    expect(resumeAction?.prompt).not.toContain('Preisanker A im ersten Test gegen Checkout-Abbruchquote pruefen.');
    expect(surface.resumeActions.map((action) => action.source)).toEqual(['next_step', 'resume']);
  });
});
