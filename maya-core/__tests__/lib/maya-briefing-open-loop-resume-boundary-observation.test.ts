import { describe, expect, it } from 'vitest';

import { buildContinuityBriefing, buildMayaMainSurfaceDerivation } from '../../lib/maya-thread-digest';
import { ChatSession } from '../../lib/types';

function makeBriefingOpenLoopBoundarySession(): ChatSession {
  return {
    id: 'thread-briefing-open-loop-boundary',
    title: 'Option A Arbeitslauf halten',
    intent: 'Option A als aktive Arbeitsbahn halten.',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Option A bleibt die aktive Bahn. Halte den naechsten Schritt bei der Umsetzung, aber den breiteren offenen Punkt nur als Thread-Schleife sichtbar.',
        timestamp: '10:00'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Gut, dann bleibt die Umsetzung der naechste Schritt und die breitere Schleife nur ein nachgeordneter offener Punkt.',
        timestamp: '10:01'
      }
    ],
    digest: {
      threadId: 'thread-briefing-open-loop-boundary',
      title: 'Option A Arbeitslauf halten',
      summary: 'Option A als aktive Arbeitsbahn halten.',
      currentState: 'Die Umsetzungsbahn ist aktiv, das breitere Risiko bleibt separat sichtbar.',
      openLoops: ['Das breitere Risiko fuer Option A spaeter separat pruefen.'],
      nextEntry: 'Die aktive Umsetzungsbahn fuer Option A jetzt weiterziehen.',
      confidence: 'medium',
      updatedAt: '2026-03-29T08:59:00.000Z',
      sourceMessageCount: 2,
      needsRefresh: false
    },
    handoff: {
      status: 'active',
      achieved: 'Die aktive Umsetzungsbahn fuer Option A ist vorbereitet.',
      openItems: ['Team-Update fuer Option A vorbereiten.'],
      nextEntry: 'Die aktive Umsetzungsbahn fuer Option A jetzt weiterziehen.',
      updatedAt: '2026-03-29T09:00:00.000Z',
      source: 'manual'
    },
    createdAt: '2026-03-29T08:58:00.000Z',
    updatedAt: '2026-03-29T09:00:00.000Z'
  };
}

function makeBriefingOpenLoopCollapsedSession(): ChatSession {
  return {
    id: 'thread-briefing-open-loop-collapsed',
    title: 'Option A weiterziehen',
    intent: 'Option A weiterziehen.',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Option A weiterziehen.',
        timestamp: '10:00'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Dann ziehen wir Option A weiter.',
        timestamp: '10:01'
      }
    ],
    digest: {
      threadId: 'thread-briefing-open-loop-collapsed',
      title: 'Option A weiterziehen',
      summary: 'Option A weiterziehen.',
      currentState: 'Option A weiterziehen.',
      openLoops: ['Option A weiterziehen.'],
      nextEntry: 'Option A weiterziehen.',
      confidence: 'medium',
      updatedAt: '2026-03-29T09:01:00.000Z',
      sourceMessageCount: 2,
      needsRefresh: false
    },
    createdAt: '2026-03-29T09:00:00.000Z',
    updatedAt: '2026-03-29T09:01:00.000Z'
  };
}

describe('maya briefing open-loop resume boundary observation', () => {
  it('keeps the briefing open-loop resume action secondary when handoff already owns the primary open-point lane', () => {
    const session = makeBriefingOpenLoopBoundarySession();
    const briefing = buildContinuityBriefing(session);
    const surface = buildMayaMainSurfaceDerivation(session, undefined);
    const openLoopAction = surface.resumeActions.find((action) => action.source === 'open_loop');

    expect(briefing?.openLoops[0]).toBe('Das breitere Risiko fuer Option A spaeter separat pruefen.');
    expect(surface.primaryNextStep).toBe(surface.handoff?.nextEntry || null);
    expect(surface.primaryOpenPoint).toBe(surface.handoff?.openItems[0] || null);
    expect(surface.primaryOpenPoint).not.toBe(briefing?.openLoops[0] || null);
    expect(openLoopAction?.prompt).toContain('Das breitere Risiko fuer Option A spaeter separat pruefen.');
    expect(openLoopAction?.emphasis).toBe('secondary');
    expect(surface.resumeActions.map((action) => action.source)).toEqual(['next_step', 'open_loop', 'resume']);
  });

  it('collapses a repeated briefing open-loop instead of duplicating next-step and resume actions around the same signal', () => {
    const session = makeBriefingOpenLoopCollapsedSession();
    const briefing = buildContinuityBriefing(session);
    const surface = buildMayaMainSurfaceDerivation(session, undefined);

    expect(briefing?.openLoops[0]).toBe('Option A weiterziehen.');
    expect(surface.resumeActions).toHaveLength(1);
    expect(surface.resumeActions[0]?.source).toBe('next_step');
    expect(surface.resumeActions[0]?.prompt).toContain('Option A weiterziehen.');
    expect(surface.primaryOpenPoint).toBe('Option A weiterziehen.');
    expect(surface.primaryNextStep).toBe('Option A weiterziehen.');
  });
});
