import { describe, expect, it } from 'vitest';

import { buildMayaMainSurfaceDerivation } from '../../lib/maya-thread-digest';
import { ChatSession, MayaWorkspaceContext } from '../../lib/types';

function makeEarlyThreadBoundarySession(): ChatSession {
  return {
    id: 'thread-primary-boundary-early',
    title: 'Neuer Maya-Thread',
    intent: 'Zwei Wege vergleichen und den nächsten Test festlegen.',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'hi',
        timestamp: '10:00'
      }
    ],
    digest: {
      threadId: 'thread-primary-boundary-early',
      title: 'Alter Digest-Titel',
      summary: 'Alter Digest-Fokus, der die Primärfläche hier nicht übernehmen soll.',
      currentState: 'Alter Digest-Zustand.',
      openLoops: ['Alte Digest-Schleife'],
      nextEntry: 'Alten Digest fortsetzen.',
      confidence: 'medium',
      updatedAt: '2026-03-28T10:01:00.000Z',
      sourceMessageCount: 2,
      needsRefresh: false
    },
    workrun: {
      focus: 'Persistierter Workrun-Fokus, der im frühen Thread nicht zurückleaken darf.',
      status: 'open',
      lastOutput: 'Persistierter Output',
      lastStep: 'Persistierter Step',
      nextStep: 'Persistierter nächster Schritt',
      updatedAt: '2026-03-28T10:01:00.000Z',
      source: 'manual'
    },
    checkpointBoard: {
      title: 'Persistiertes Board',
      focus: 'Persistierter Board-Fokus',
      checkpoints: [
        {
          id: 'checkpoint-1',
          label: 'Persistierter Board-Open-Point',
          detail: null,
          status: 'open',
          source: 'manual',
          updatedAt: '2026-03-28T10:01:00.000Z'
        }
      ],
      updatedAt: '2026-03-28T10:01:00.000Z',
      source: 'manual'
    },
    handoff: {
      status: 'active',
      achieved: 'Persistierter Handoff-Stand',
      openItems: ['Persistierter Handoff-Open-Point'],
      nextEntry: 'Persistierter Handoff-Einstieg',
      updatedAt: '2026-03-28T10:01:00.000Z',
      source: 'manual'
    },
    createdAt: '2026-03-28T09:58:00.000Z',
    updatedAt: '2026-03-28T10:01:00.000Z'
  };
}

function makeWorkspaceOnlyFallback(): MayaWorkspaceContext {
  return {
    id: 'workspace-fallback-only',
    title: 'Onboarding Workspace',
    focus: 'Workspace-Fokus für ruhende Threads.',
    goal: 'Workspace-Ziel',
    currentState: 'Workspace-Zustand',
    openItems: ['Workspace-offener Punkt für ruhende Threads.'],
    nextMilestone: 'Workspace-Meilenstein für ruhende Threads.',
    threadIds: ['thread-primary-boundary-empty'],
    updatedAt: '2026-03-28T10:01:00.000Z',
    source: 'manual',
    status: 'active'
  };
}

function makeEmptyBoundarySession(): ChatSession {
  return {
    id: 'thread-primary-boundary-empty',
    title: '',
    intent: '',
    messages: [],
    createdAt: '2026-03-28T09:58:00.000Z',
    updatedAt: '2026-03-28T10:01:00.000Z'
  };
}

describe('maya primary surface fallback boundary observation', () => {
  it('does not leak persisted workrun, handoff, or digest signals back into the primary surface during early-thread state', () => {
    const session = makeEarlyThreadBoundarySession();
    const workspace = {
      id: 'workspace-boundary-early',
      title: 'Persistierter Workspace',
      focus: 'Persistierter Workspace-Fokus',
      goal: 'Persistiertes Workspace-Ziel',
      currentState: 'Persistierter Workspace-Zustand',
      openItems: ['Persistierter Workspace-Open-Point'],
      nextMilestone: 'Persistierter Workspace-Meilenstein',
      threadIds: [session.id],
      updatedAt: '2026-03-28T10:01:00.000Z',
      source: 'manual' as const,
      status: 'active' as const
    };

    const surface = buildMayaMainSurfaceDerivation(session, workspace);

    expect(surface.briefing?.source).toBe('session');
    expect(surface.primaryFocus).toBe('Anliegen im Thread schärfen: Zwei Wege vergleichen und den nächsten Test festlegen.');
    expect(surface.primaryNextStep).toBe('Beschreibe kurz Ziel, Kontext oder Entscheidung, bei der Maya dich jetzt als Nächstes unterstützen soll.');
    expect(surface.primaryOpenPoint).toBe('Es fehlt noch das konkrete Ziel oder die Entscheidung, auf die Maya den Arbeitslauf ausrichten soll.');
    expect(surface.primaryFocus).not.toContain('Persistierter Workrun-Fokus');
    expect(surface.primaryNextStep).not.toContain('Persistierter');
    expect(surface.primaryOpenPoint).not.toContain('Persistierter');
    expect(surface.primaryFocus).not.toContain('Alter Digest');
  });

  it('keeps fallback boundaries explicit when a quiet thread falls back to derived defaults instead of persisted workspace signals', () => {
    const session = makeEmptyBoundarySession();
    const workspace = makeWorkspaceOnlyFallback();

    const surface = buildMayaMainSurfaceDerivation(session, workspace);

    expect(surface.briefing).toBeUndefined();
    expect(surface.workrun).toBeUndefined();
    expect(surface.handoff?.nextEntry).toBe('Mit diesem Thread sinnvoll wieder einsteigen.');
    expect(surface.handoff?.openItems).toEqual([]);
    expect(surface.workspace?.focus).toBe('Aktiver Arbeitsraum');
    expect(surface.workspace?.nextMilestone).toBe('Mit diesem Thread sinnvoll wieder einsteigen.');
    expect(surface.workspace?.openItems).toEqual([]);
    expect(surface.primaryFocus).toBe('Aktiver Arbeitsraum');
    expect(surface.primaryNextStep).toBe('Mit diesem Thread sinnvoll wieder einsteigen.');
    expect(surface.primaryOpenPoint).toBeNull();
    expect(surface.primaryFocus).toBe(surface.workspace?.focus || null);
    expect(surface.primaryNextStep).toBe(surface.handoff?.nextEntry || null);
    expect(surface.primaryOpenPoint).toBe(surface.workspace?.openItems[0] || null);
    expect(surface.primaryFocus).not.toBe('Workspace-Fokus für ruhende Threads.');
    expect(surface.primaryNextStep).not.toBe('Workspace-Meilenstein für ruhende Threads.');
  });
});
