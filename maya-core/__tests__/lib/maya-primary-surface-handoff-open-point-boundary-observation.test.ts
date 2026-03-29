import { describe, expect, it } from 'vitest';

import { buildContinuityBriefing, buildMayaMainSurfaceDerivation } from '../../lib/maya-thread-digest';
import { ChatSession } from '../../lib/types';

function makeHandoffOpenPointBoundarySession(): ChatSession {
  return {
    id: 'thread-handoff-open-point-boundary',
    title: 'Option A weiterziehen',
    intent: 'Option A als aktive Arbeitsbahn weiterziehen.',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Option A bleibt die aktive Spur. Der offene Hauptpunkt soll in der Uebergabe bleiben, auch wenn im Thread noch eine eigene offene Schleife steht.',
        timestamp: '10:00'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Gut, dann halten wir den Hauptpunkt in der Handoff-Spur und lassen die weitere offene Schleife nur als Thread-Kontext sichtbar.',
        timestamp: '10:01'
      }
    ],
    digest: {
      threadId: 'thread-handoff-open-point-boundary',
      title: 'Option A weiterziehen',
      summary: 'Option A als aktive Arbeitsbahn weiterziehen.',
      currentState: 'Option A bleibt die laufende Arbeitsbahn.',
      openLoops: ['Das breitere Risiko im Thread noch spaeter einsammeln.'],
      nextEntry: 'Mit Option A im laufenden Experiment weitermachen.',
      confidence: 'medium',
      updatedAt: '2026-03-29T01:40:00.000Z',
      sourceMessageCount: 2,
      needsRefresh: false
    },
    handoff: {
      status: 'active',
      achieved: 'Option A bleibt die aktive Spur, Team-Update ist noch offen.',
      openItems: ['Team-Update fuer Option A vorbereiten.'],
      nextEntry: 'Mit Option A im laufenden Experiment weitermachen.',
      updatedAt: '2026-03-29T01:41:00.000Z',
      source: 'manual'
    },
    createdAt: '2026-03-29T01:39:00.000Z',
    updatedAt: '2026-03-29T01:41:00.000Z'
  };
}

describe('maya primary surface handoff open-point boundary observation', () => {
  it('keeps handoff open items on the primary open-point lane when briefing still carries a competing open loop', () => {
    const session = makeHandoffOpenPointBoundarySession();
    const briefing = buildContinuityBriefing(session);
    const surface = buildMayaMainSurfaceDerivation(session, undefined);

    expect(briefing?.openLoops[0]).toBe('Das breitere Risiko im Thread noch spaeter einsammeln.');
    expect(surface.handoff?.source).toBe('manual');
    expect(surface.handoff?.openItems[0]).toBe('Team-Update fuer Option A vorbereiten.');
    expect(surface.primaryOpenPoint).toBe(surface.handoff?.openItems[0] || null);
    expect(surface.primaryOpenPoint).not.toBe(briefing?.openLoops[0] || null);
    expect(surface.primaryNextStep).toBe(surface.handoff?.nextEntry || null);
  });
});
