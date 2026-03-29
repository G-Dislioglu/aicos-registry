import { describe, expect, it } from 'vitest';

import { buildMayaMainSurfaceDerivation } from '../../lib/maya-thread-digest';
import { ChatSession } from '../../lib/types';

function makePartialRepetitionSession(): ChatSession {
  return {
    id: 'thread-primary-partial-repetition',
    title: 'Preisanker A weiterziehen',
    intent: 'Preisanker A als naechsten Test festziehen.',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Preisanker A als naechsten Test festziehen und das breitere Risiko nur separat offen halten.',
        timestamp: '11:00'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Gut, dann ziehen wir Preisanker A jetzt weiter und halten das breitere Risiko nur als separaten offenen Punkt sichtbar.',
        timestamp: '11:01'
      }
    ],
    digest: {
      threadId: 'thread-primary-partial-repetition',
      title: 'Preisanker A weiterziehen',
      summary: 'Preisanker A als naechsten Test festziehen.',
      currentState: 'Preisanker A ist die fuehrende Spur.',
      openLoops: ['Das breitere Risiko fuer Preisanker A spaeter separat pruefen.'],
      nextEntry: 'Preisanker A als naechsten Test festziehen.',
      confidence: 'medium',
      updatedAt: '2026-03-29T09:40:00.000Z',
      sourceMessageCount: 2,
      needsRefresh: false
    },
    createdAt: '2026-03-29T09:39:00.000Z',
    updatedAt: '2026-03-29T09:40:00.000Z'
  };
}

describe('maya primary surface partial repetition observation', () => {
  it('allows next-step and open-point to align while primary focus stays semantically separate in a repetition-near thread', () => {
    const surface = buildMayaMainSurfaceDerivation(makePartialRepetitionSession(), undefined);

    expect(surface.primaryFocus).toBe('Preisanker A als naechsten Test festziehen.');
    expect(surface.primaryNextStep).toBe('Preisanker A als naechsten Test festziehen.');
    expect(surface.primaryOpenPoint).toBe('Preisanker A als naechsten Test festziehen.');
    expect(surface.primaryFocus).toBe(surface.briefing?.focus || null);
    expect(surface.primaryNextStep).toBe(surface.handoff?.nextEntry || null);
    expect(surface.primaryOpenPoint).toBe(surface.handoff?.openItems[0] || null);
    expect(surface.briefing?.openLoops[0]).toBe('Das breitere Risiko fuer Preisanker A spaeter separat pruefen.');
    expect(surface.primaryOpenPoint).not.toBe(surface.briefing?.openLoops[0] || null);
    expect(surface.resumeActions.map((action) => action.source)).toEqual(['next_step', 'open_loop']);
    expect(surface.resumeActions[0]?.prompt).toContain('Preisanker A als naechsten Test festziehen.');
    expect(surface.resumeActions[1]?.prompt).toContain('Das breitere Risiko fuer Preisanker A spaeter separat pruefen.');
  });
});
