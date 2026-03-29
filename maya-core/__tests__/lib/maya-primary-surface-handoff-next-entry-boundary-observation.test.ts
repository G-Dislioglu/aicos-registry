import { describe, expect, it } from 'vitest';

import { buildMayaMainSurfaceDerivation } from '../../lib/maya-thread-digest';
import { ChatSession } from '../../lib/types';

function makeHandoffNextEntryBoundarySession(): ChatSession {
  return {
    id: 'thread-handoff-next-entry-boundary',
    title: 'Onboarding Option A weiterziehen',
    intent: 'Option A als aktiven Testpfad weiterziehen.',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Option A ist der aktive Testpfad. Option B bleibt nur als möglicher Wiedereinstieg offen.',
        timestamp: '10:00'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Gut, dann halten wir Option A als Arbeitsbahn und Option B nur als spätere Übergabespur getrennt.',
        timestamp: '10:01'
      }
    ],
    digest: {
      threadId: 'thread-handoff-next-entry-boundary',
      title: 'Onboarding Option A weiterziehen',
      summary: 'Option A als aktiven Testpfad weiterziehen.',
      currentState: 'Option A bleibt die laufende Arbeitsbahn.',
      openLoops: ['Option B nur als spätere Gegenspur offenhalten.'],
      nextEntry: 'Mit Option A als aktivem Testpfad weitermachen.',
      confidence: 'medium',
      updatedAt: '2026-03-29T00:05:00.000Z',
      sourceMessageCount: 2,
      needsRefresh: false
    },
    workrun: {
      focus: 'Option A als aktiven Testpfad weiterziehen.',
      status: 'open',
      lastOutput: 'Option A wurde als aktiv priorisiert.',
      lastStep: 'Option A gegen Aktivierungsziel abgeglichen.',
      nextStep: 'Option A jetzt im laufenden Experiment vertiefen.',
      updatedAt: '2026-03-29T00:06:00.000Z',
      source: 'manual'
    },
    handoff: {
      status: 'paused',
      achieved: 'Option A ist priorisiert, Option B bleibt dokumentiert.',
      openItems: ['Option B als Gegenspur nur dokumentieren.'],
      nextEntry: 'Falls Option A kippt, mit Option B als Gegenspur wieder einsteigen.',
      updatedAt: '2026-03-29T00:07:00.000Z',
      source: 'manual'
    },
    createdAt: '2026-03-29T00:00:00.000Z',
    updatedAt: '2026-03-29T00:07:00.000Z'
  };
}

describe('maya primary surface handoff next-entry boundary observation', () => {
  it('keeps a paused handoff nextEntry off the primary next-step lane when workrun already owns the active step', () => {
    const surface = buildMayaMainSurfaceDerivation(makeHandoffNextEntryBoundarySession(), undefined);

    expect(surface.workrun?.source).toBe('manual');
    expect(surface.workrun?.nextStep).toBe('Option A jetzt im laufenden Experiment vertiefen.');
    expect(surface.handoff?.source).toBe('manual');
    expect(surface.handoff?.status).toBe('paused');
    expect(surface.handoff?.nextEntry).toBe('Falls Option A kippt, mit Option B als Gegenspur wieder einsteigen.');
    expect(surface.primaryNextStep).toBe(surface.workrun?.nextStep || null);
    expect(surface.primaryNextStep).not.toBe(surface.handoff?.nextEntry || null);
    expect(surface.primaryOpenPoint).toBe(surface.handoff?.openItems[0] || null);
  });
});
