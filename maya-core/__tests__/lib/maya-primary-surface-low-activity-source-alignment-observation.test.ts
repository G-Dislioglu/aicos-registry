import { describe, expect, it } from 'vitest';

import { buildMayaMainSurfaceDerivation } from '../../lib/maya-thread-digest';
import { ChatSession, MayaWorkspaceContext } from '../../lib/types';

function makeSingleMessageLowActivitySession(): ChatSession {
  return {
    id: 'thread-low-activity-source-single',
    title: '',
    intent: '',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Zwei Preisanker für den ersten Test vergleichen und den kleinsten Unterschied benennen.',
        timestamp: '13:00'
      }
    ],
    createdAt: '2026-03-28T13:00:00.000Z',
    updatedAt: '2026-03-28T13:00:00.000Z'
  };
}

function makeAssistantShapedLowActivitySession(): ChatSession {
  return {
    id: 'thread-low-activity-source-assisted',
    title: '',
    intent: '',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Bitte Preisanker A und B für den ersten Checkout-Test vergleichen und die plausiblere Spur festhalten.',
        timestamp: '13:05'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Preisanker A zuerst gegen Checkout-Abbruchquote prüfen.',
        timestamp: '13:06'
      }
    ],
    createdAt: '2026-03-28T13:05:00.000Z',
    updatedAt: '2026-03-28T13:06:00.000Z'
  };
}

function makeCompetingWorkspace(): MayaWorkspaceContext {
  return {
    id: 'workspace-low-activity-source-competing',
    title: 'Checkout Workspace',
    focus: 'Persistierter Workspace-Fokus, der als eigener manueller Strang sichtbar bleiben darf.',
    goal: 'Persistiertes Workspace-Ziel',
    currentState: 'Persistierter Workspace-Zustand',
    openItems: ['Persistierter Workspace-Open-Point, der von der Primärfläche getrennt bleiben soll.'],
    nextMilestone: 'Persistierter Workspace-Meilenstein, der nicht dieselbe Ableitung wie der Thread tragen muss.',
    threadIds: ['thread-low-activity-source-assisted'],
    updatedAt: '2026-03-28T13:06:00.000Z',
    source: 'manual',
    status: 'active'
  };
}

describe('maya primary surface low-activity source alignment observation', () => {
  it('keeps the derived focus lane aligned across briefing, workrun, workspace, and primary surface for a single substantive message', () => {
    const surface = buildMayaMainSurfaceDerivation(makeSingleMessageLowActivitySession(), undefined);

    expect(surface.briefing?.focus).toBe('Zwei Preisanker für den ersten Test vergleichen und den kleinsten Unterschied benennen.');
    expect(surface.workrun?.focus).toBe(surface.briefing?.focus);
    expect(surface.workspace?.focus).toBe(surface.workrun?.focus);
    expect(surface.primaryFocus).toBe(surface.workrun?.focus || null);
    expect(surface.briefing?.nextStep).toBe('Daran als Nächstes anknüpfen: Zwei Preisanker für den ersten Test vergleichen und den kleinsten Unterschied benennen.');
    expect(surface.workrun?.nextStep).toBe(surface.briefing?.nextStep);
    expect(surface.handoff?.nextEntry).toBe(surface.workrun?.nextStep);
    expect(surface.workspace?.nextMilestone).toBe(surface.handoff?.nextEntry);
    expect(surface.primaryNextStep).toBe(surface.workrun?.nextStep || null);
    expect(surface.primaryOpenPoint).toBe(surface.handoff?.openItems[0] || null);
    expect(surface.primaryOpenPoint).toBe(surface.primaryNextStep);
  });

  it('keeps the derived action lane aligned across workrun, handoff, workspace, and primary surface for assistant-shaped low activity', () => {
    const surface = buildMayaMainSurfaceDerivation(makeAssistantShapedLowActivitySession(), undefined);

    expect(surface.briefing?.focus).toBe('Bitte Preisanker A und B für den ersten Checkout-Test vergleichen und die plausiblere Spur festhalten.');
    expect(surface.workrun?.focus).toBe(surface.briefing?.focus);
    expect(surface.workspace?.focus).toBe(surface.workrun?.focus);
    expect(surface.primaryFocus).toBe(surface.workrun?.focus || null);
    expect(surface.briefing?.nextStep).toBe('Preisanker A zuerst gegen Checkout-Abbruchquote prüfen.');
    expect(surface.workrun?.nextStep).toBe(surface.briefing?.nextStep);
    expect(surface.handoff?.nextEntry).toBe(surface.workrun?.nextStep);
    expect(surface.workspace?.nextMilestone).toBe(surface.handoff?.nextEntry);
    expect(surface.primaryNextStep).toBe(surface.workrun?.nextStep || null);
    expect(surface.handoff?.achieved).toBe('Preisanker A zuerst gegen Checkout-Abbruchquote prüfen.');
    expect(surface.workspace?.currentState).toBe(surface.handoff?.achieved);
    expect(surface.primaryOpenPoint).toBe(surface.handoff?.openItems[0] || null);
    expect(surface.primaryOpenPoint).toBe(surface.primaryNextStep);
  });

  it('keeps low-activity source divergence explicit when a manual workspace intentionally carries different meaning', () => {
    const surface = buildMayaMainSurfaceDerivation(makeAssistantShapedLowActivitySession(), makeCompetingWorkspace());

    expect(surface.workrun?.focus).toBe('Bitte Preisanker A und B für den ersten Checkout-Test vergleichen und die plausiblere Spur festhalten.');
    expect(surface.handoff?.nextEntry).toBe('Preisanker A zuerst gegen Checkout-Abbruchquote prüfen.');
    expect(surface.primaryFocus).toBe(surface.workrun?.focus || null);
    expect(surface.primaryNextStep).toBe(surface.workrun?.nextStep || null);
    expect(surface.primaryOpenPoint).toBe(surface.handoff?.openItems[0] || null);
    expect(surface.workspace?.source).toBe('manual');
    expect(surface.workspace?.focus).toBe('Persistierter Workspace-Fokus, der als eigener manueller Strang sichtbar bleiben darf.');
    expect(surface.workspace?.nextMilestone).toBe('Persistierter Workspace-Meilenstein, der nicht dieselbe Ableitung wie der Thread tragen muss.');
    expect(surface.workspace?.openItems[0]).toBe('Persistierter Workspace-Open-Point, der von der Primärfläche getrennt bleiben soll.');
    expect(surface.primaryFocus).not.toBe(surface.workspace?.focus || null);
    expect(surface.primaryNextStep).not.toBe(surface.workspace?.nextMilestone || null);
    expect(surface.primaryOpenPoint).not.toBe(surface.workspace?.openItems[0] || null);
  });
});
