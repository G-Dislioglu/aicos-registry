import { describe, expect, it } from 'vitest';

import { buildMayaMainSurfaceDerivation } from '../../lib/maya-thread-digest';
import { ChatSession } from '../../lib/types';

function makePrimaryFocusBoundarySession(): ChatSession {
  return {
    id: 'thread-primary-focus-boundary',
    title: 'Checkout-Risiko eingrenzen',
    intent: 'Das breitere Checkout-Risiko fuer Preisanker A sauber eingrenzen.',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Grenze das breitere Checkout-Risiko fuer Preisanker A ein, aber zieh als naechsten Schritt nur den ersten Test weiter.',
        timestamp: '12:00'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Gut, dann bleibt die Risikoeingrenzung der Lead und der erste Test ist der direkte Wiedereinstiegspunkt.',
        timestamp: '12:01'
      }
    ],
    digest: {
      threadId: 'thread-primary-focus-boundary',
      title: 'Checkout-Risiko eingrenzen',
      summary: 'Das breitere Checkout-Risiko fuer Preisanker A sauber eingrenzen.',
      currentState: 'Der erste Test fuer Preisanker A ist vorbereitet, das breitere Risiko bleibt die Leitfrage.',
      openLoops: ['Preisanker A als ersten Test weiterziehen.'],
      nextEntry: 'Preisanker A als ersten Test weiterziehen.',
      confidence: 'medium',
      updatedAt: '2026-03-29T09:58:00.000Z',
      sourceMessageCount: 2,
      needsRefresh: false
    },
    createdAt: '2026-03-29T09:57:00.000Z',
    updatedAt: '2026-03-29T09:58:00.000Z'
  };
}

describe('maya primary focus boundary observation', () => {
  it('keeps primary focus as the broader semantic lead when next-step and open-point collapse onto the same re-entry signal', () => {
    const surface = buildMayaMainSurfaceDerivation(makePrimaryFocusBoundarySession(), undefined);

    expect(surface.primaryFocus).toBe('Das breitere Checkout-Risiko fuer Preisanker A sauber eingrenzen.');
    expect(surface.primaryNextStep).toBe('Preisanker A als ersten Test weiterziehen.');
    expect(surface.primaryOpenPoint).toBe('Preisanker A als ersten Test weiterziehen.');
    expect(surface.primaryFocus).toBe(surface.briefing?.focus || null);
    expect(surface.primaryNextStep).toBe(surface.handoff?.nextEntry || null);
    expect(surface.primaryOpenPoint).toBe(surface.handoff?.openItems[0] || null);
    expect(surface.primaryFocus).not.toBe(surface.primaryNextStep);
    expect(surface.primaryFocus).not.toBe(surface.primaryOpenPoint);
    expect(surface.resumeActions.map((action) => action.source)).toEqual(['next_step', 'resume']);
    expect(surface.resumeActions[0]?.prompt).toContain('Preisanker A als ersten Test weiterziehen.');
    expect(surface.resumeActions[1]?.prompt).toContain('Das breitere Checkout-Risiko fuer Preisanker A sauber eingrenzen.');
  });
});
