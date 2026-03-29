import { describe, expect, it } from 'vitest';

import { buildMayaMainSurfaceDerivation } from '../../lib/maya-thread-digest';
import { ChatSession, MayaWorkspaceContext } from '../../lib/types';

function makeWorkspaceOpenPointBoundarySession(): ChatSession {
  return {
    id: 'thread-workspace-open-point-boundary',
    title: 'Option A weiterziehen',
    intent: 'Option A als aktive Arbeitsbahn weiterziehen.',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Option A bleibt die aktive Spur. Der offene Hauptpunkt soll im Handoff bleiben, nicht im Workspace.',
        timestamp: '10:00'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Gut, dann halten wir den offenen Hauptpunkt in der Uebergabespur und lassen den Workspace nur den breiteren Kontext tragen.',
        timestamp: '10:01'
      }
    ],
    digest: {
      threadId: 'thread-workspace-open-point-boundary',
      title: 'Option A weiterziehen',
      summary: 'Option A als aktive Arbeitsbahn weiterziehen.',
      currentState: 'Option A bleibt die laufende Arbeitsbahn.',
      openLoops: ['Workspace-Risiko separat festhalten.'],
      nextEntry: 'Mit Option A im laufenden Experiment weitermachen.',
      confidence: 'medium',
      updatedAt: '2026-03-29T01:02:00.000Z',
      sourceMessageCount: 2,
      needsRefresh: false
    },
    workrun: {
      focus: 'Option A als aktive Arbeitsbahn weiterziehen.',
      status: 'open',
      lastOutput: 'Option A wurde als laufende Spur bestaetigt.',
      lastStep: 'Option A gegen die Kernhypothese abgeglichen.',
      nextStep: 'Option A jetzt im Experiment weiter vertiefen.',
      updatedAt: '2026-03-29T01:03:00.000Z',
      source: 'manual'
    },
    handoff: {
      status: 'active',
      achieved: 'Option A bleibt die aktive Spur, Team-Update ist noch offen.',
      openItems: ['Team-Update fuer Option A vorbereiten.'],
      nextEntry: 'Mit Option A im laufenden Experiment weitermachen.',
      updatedAt: '2026-03-29T01:04:00.000Z',
      source: 'manual'
    },
    createdAt: '2026-03-29T01:01:00.000Z',
    updatedAt: '2026-03-29T01:04:00.000Z'
  };
}

function makeCompetingWorkspaceOpenPoint(): MayaWorkspaceContext {
  return {
    id: 'workspace-open-point-boundary',
    title: 'Onboarding Workspace',
    focus: 'Option A im Workspace beobachten.',
    goal: 'Option A absichern.',
    currentState: 'Workspace traegt noch einen breiteren offenen Kontext.',
    openItems: ['Workspace-Risiko separat festhalten.'],
    nextMilestone: 'Workspace-Synthese spaeter nachziehen.',
    threadIds: ['thread-workspace-open-point-boundary'],
    updatedAt: '2026-03-29T01:00:00.000Z',
    source: 'manual',
    status: 'active'
  };
}

describe('maya primary surface workspace open-point boundary observation', () => {
  it('keeps workspace open items on the fallback lane when handoff already owns the primary open point', () => {
    const surface = buildMayaMainSurfaceDerivation(
      makeWorkspaceOpenPointBoundarySession(),
      makeCompetingWorkspaceOpenPoint()
    );

    expect(surface.workspace?.source).toBe('manual');
    expect(surface.workspace?.openItems[0]).toBe('Workspace-Risiko separat festhalten.');
    expect(surface.handoff?.source).toBe('manual');
    expect(surface.handoff?.openItems[0]).toBe('Team-Update fuer Option A vorbereiten.');
    expect(surface.primaryOpenPoint).toBe(surface.handoff?.openItems[0] || null);
    expect(surface.primaryOpenPoint).not.toBe(surface.workspace?.openItems[0] || null);
    expect(surface.primaryNextStep).toBe(surface.workrun?.nextStep || null);
    expect(surface.primaryNextStep).not.toBe(surface.workspace?.nextMilestone || null);
  });
});
