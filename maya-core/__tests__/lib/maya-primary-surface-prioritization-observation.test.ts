import { describe, expect, it } from 'vitest';

import { buildMayaMainSurfaceDerivation } from '../../lib/maya-thread-digest';
import { ChatSession, MayaWorkspaceContext } from '../../lib/types';

function makePrimarySurfaceDistinctSession(): ChatSession {
  return {
    id: 'thread-primary-distinct',
    title: 'Activation priorisieren',
    intent: 'Option A als ersten Aktivierungstest festziehen.',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Option A scheint als erster Test sinnvoller.',
        timestamp: '10:00'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Vergleich abgeschlossen, jetzt können wir das Stakeholder-Update vorbereiten.',
        timestamp: '10:01'
      }
    ],
    digest: {
      threadId: 'thread-primary-distinct',
      title: 'Activation-Priorisierung abschließen',
      summary: 'Option A als ersten Aktivierungstest festziehen.',
      currentState: 'Vergleich abgeschlossen, Option A ist eingegrenzt.',
      openLoops: ['Stakeholder-Update vorbereiten.'],
      nextEntry: 'Testhypothese für Option A ausformulieren.',
      confidence: 'medium',
      updatedAt: '2026-03-28T10:01:00.000Z',
      sourceMessageCount: 2,
      needsRefresh: false
    },
    handoff: {
      status: 'active',
      achieved: 'Vergleich abgeschlossen und nächste Spur vorbereitet.',
      openItems: ['Stakeholder-Update vorbereiten.'],
      nextEntry: 'Testhypothese für Option A ausformulieren.',
      updatedAt: '2026-03-28T10:01:00.000Z',
      source: 'manual'
    },
    createdAt: '2026-03-28T09:58:00.000Z',
    updatedAt: '2026-03-28T10:01:00.000Z'
  };
}

function makePrimarySurfacePrioritySession(): ChatSession {
  return {
    id: 'thread-primary-priority',
    title: 'Onboarding priorisieren',
    intent: 'Den ersten sinnvollen Test festziehen.',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Option A wirkt als stärkste nächste Spur.',
        timestamp: '10:00'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Wir sollten die Testhypothese für Option A schärfen und danach das Team informieren.',
        timestamp: '10:01'
      }
    ],
    digest: {
      threadId: 'thread-primary-priority',
      title: 'Onboarding priorisieren',
      summary: 'Option A als ersten Test festziehen.',
      currentState: 'Option A ist aktuell die führende Spur.',
      openLoops: ['Team-Alignment vorbereiten.'],
      nextEntry: 'Testhypothese für Option A schärfen.',
      confidence: 'medium',
      updatedAt: '2026-03-28T10:01:00.000Z',
      sourceMessageCount: 2,
      needsRefresh: false
    },
    handoff: {
      status: 'active',
      achieved: 'Option A ist als nächste Spur gewählt.',
      openItems: ['Team-Alignment vorbereiten.'],
      nextEntry: 'Testhypothese für Option A schärfen.',
      updatedAt: '2026-03-28T10:01:00.000Z',
      source: 'manual'
    },
    createdAt: '2026-03-28T09:58:00.000Z',
    updatedAt: '2026-03-28T10:01:00.000Z'
  };
}

function makeCompetingWorkspace(): MayaWorkspaceContext {
  return {
    id: 'workspace-1',
    title: 'Onboarding Workspace',
    focus: 'Alte Workspace-Fokussierung, die nicht die Primärfläche übernehmen soll.',
    goal: 'Altes Ziel',
    currentState: 'Alter Zustand',
    openItems: ['Workspace-offener Punkt, der nicht den Handoff verdrängen soll.'],
    nextMilestone: 'Workspace-Meilenstein, der nicht vor den Workrun treten soll.',
    threadIds: ['thread-primary-priority'],
    updatedAt: '2026-03-28T09:55:00.000Z',
    source: 'manual',
    status: 'active'
  };
}

describe('maya primary surface prioritization observation', () => {
  it('keeps the primary surface semantically prioritized and separated when thread truth is differentiated', () => {
    const session = makePrimarySurfaceDistinctSession();

    const surface = buildMayaMainSurfaceDerivation(session, undefined);

    expect(surface.primaryFocus).toBe('Option A als ersten Aktivierungstest festziehen.');
    expect(surface.primaryNextStep).toBe('Testhypothese für Option A ausformulieren.');
    expect(surface.primaryOpenPoint).toBe('Stakeholder-Update vorbereiten.');
    expect(surface.primaryFocus).not.toBe(surface.primaryNextStep);
    expect(surface.primaryFocus).not.toBe(surface.primaryOpenPoint);
    expect(surface.primaryNextStep).not.toBe(surface.primaryOpenPoint);
  });

  it('prefers workrun and handoff primaries over competing workspace fallback signals', () => {
    const session = makePrimarySurfacePrioritySession();
    const workspace = makeCompetingWorkspace();

    const surface = buildMayaMainSurfaceDerivation(session, workspace);

    expect(surface.workspace?.focus).toBe('Alte Workspace-Fokussierung, die nicht die Primärfläche übernehmen soll.');
    expect(surface.workspace?.nextMilestone).toBe('Workspace-Meilenstein, der nicht vor den Workrun treten soll.');
    expect(surface.workspace?.openItems[0]).toBe('Workspace-offener Punkt, der nicht den Handoff verdrängen soll.');
    expect(surface.primaryFocus).toBe('Option A als ersten Test festziehen.');
    expect(surface.primaryNextStep).toBe('Testhypothese für Option A schärfen.');
    expect(surface.primaryOpenPoint).toBe('Team-Alignment vorbereiten.');
    expect(surface.primaryFocus).not.toBe(surface.workspace?.focus || null);
    expect(surface.primaryNextStep).not.toBe(surface.workspace?.nextMilestone || null);
    expect(surface.primaryOpenPoint).not.toBe(surface.workspace?.openItems[0] || null);
  });
});
