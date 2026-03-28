import { describe, expect, it } from 'vitest';

import { buildMayaMainSurfaceDerivation } from '../../lib/maya-thread-digest';
import { ChatSession, MayaWorkspaceContext } from '../../lib/types';

function makeSingleMessageLowActivitySession(): ChatSession {
  return {
    id: 'thread-low-activity-single',
    title: '',
    intent: '',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Zwei Preisanker für den ersten Test vergleichen und den kleinsten Unterschied benennen.',
        timestamp: '12:00'
      }
    ],
    createdAt: '2026-03-28T12:00:00.000Z',
    updatedAt: '2026-03-28T12:00:00.000Z'
  };
}

function makeAssistantShapedLowActivitySession(): ChatSession {
  return {
    id: 'thread-low-activity-assisted',
    title: '',
    intent: '',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Bitte Preisanker A und B für den ersten Checkout-Test vergleichen und die plausiblere Spur festhalten.',
        timestamp: '12:05'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Preisanker A zuerst gegen Checkout-Abbruchquote prüfen.',
        timestamp: '12:06'
      }
    ],
    createdAt: '2026-03-28T12:05:00.000Z',
    updatedAt: '2026-03-28T12:06:00.000Z'
  };
}

function makeCompetingWorkspace(): MayaWorkspaceContext {
  return {
    id: 'workspace-low-activity-competing',
    title: 'Checkout Workspace',
    focus: 'Persistierter Workspace-Fokus, der die Primärfläche hier nicht übernehmen soll.',
    goal: 'Persistiertes Workspace-Ziel',
    currentState: 'Persistierter Workspace-Zustand',
    openItems: ['Persistierter Workspace-Open-Point, der keine zusätzliche Primärduplikation erzeugen soll.'],
    nextMilestone: 'Persistierter Workspace-Meilenstein, der nicht vor den Thread ziehen soll.',
    threadIds: ['thread-low-activity-assisted'],
    updatedAt: '2026-03-28T12:06:00.000Z',
    source: 'manual',
    status: 'active'
  };
}

describe('maya primary surface low-activity repetition observation', () => {
  it('collapses a single substantive low-activity thread into a bounded pair instead of multiplying primary meanings', () => {
    const surface = buildMayaMainSurfaceDerivation(makeSingleMessageLowActivitySession(), undefined);

    expect(surface.primaryFocus).toBe('Zwei Preisanker für den ersten Test vergleichen und den kleinsten Unterschied benennen.');
    expect(surface.primaryNextStep).toBe('Daran als Nächstes anknüpfen: Zwei Preisanker für den ersten Test vergleichen und den kleinsten Unterschied benennen.');
    expect(surface.primaryOpenPoint).toBe(surface.primaryNextStep);
    expect(surface.primaryFocus).not.toBe(surface.primaryNextStep);
    expect(surface.handoff?.openItems.slice(0, 2)).toEqual([
      'Daran als Nächstes anknüpfen: Zwei Preisanker für den ersten Test vergleichen und den kleinsten Unterschied benennen.',
      'Zwei Preisanker für den ersten Test vergleichen und den kleinsten Unterschied benennen.'
    ]);
    expect(surface.workspace?.openItems.slice(0, 2)).toEqual(surface.handoff?.openItems.slice(0, 2));
  });

  it('keeps low-activity assistant shaping bounded by one actionable re-entry plus one thread focus', () => {
    const surface = buildMayaMainSurfaceDerivation(makeAssistantShapedLowActivitySession(), undefined);

    expect(surface.primaryFocus).toBe('Bitte Preisanker A und B für den ersten Checkout-Test vergleichen und die plausiblere Spur festhalten.');
    expect(surface.primaryNextStep).toBe('Preisanker A zuerst gegen Checkout-Abbruchquote prüfen.');
    expect(surface.primaryOpenPoint).toBe('Preisanker A zuerst gegen Checkout-Abbruchquote prüfen.');
    expect(surface.primaryFocus).not.toBe(surface.primaryNextStep);
    expect(surface.handoff?.openItems.slice(0, 2)).toEqual([
      'Preisanker A zuerst gegen Checkout-Abbruchquote prüfen.',
      'Bitte Preisanker A und B für den ersten Checkout-Test vergleichen und die plausiblere Spur festhalten.'
    ]);
    expect(surface.workspace?.nextMilestone).toBe('Preisanker A zuerst gegen Checkout-Abbruchquote prüfen.');
    expect(surface.workspace?.openItems.slice(0, 2)).toEqual(surface.handoff?.openItems.slice(0, 2));
  });

  it('prevents a competing workspace fallback from overriding or inflating the bounded low-activity primary pair', () => {
    const workspace = makeCompetingWorkspace();
    const surface = buildMayaMainSurfaceDerivation(makeAssistantShapedLowActivitySession(), workspace);

    expect(surface.workspace?.focus).toBe('Persistierter Workspace-Fokus, der die Primärfläche hier nicht übernehmen soll.');
    expect(surface.workspace?.nextMilestone).toBe('Persistierter Workspace-Meilenstein, der nicht vor den Thread ziehen soll.');
    expect(surface.workspace?.openItems[0]).toBe('Persistierter Workspace-Open-Point, der keine zusätzliche Primärduplikation erzeugen soll.');
    expect(surface.primaryFocus).toBe('Bitte Preisanker A und B für den ersten Checkout-Test vergleichen und die plausiblere Spur festhalten.');
    expect(surface.primaryNextStep).toBe('Preisanker A zuerst gegen Checkout-Abbruchquote prüfen.');
    expect(surface.primaryOpenPoint).toBe('Preisanker A zuerst gegen Checkout-Abbruchquote prüfen.');
    expect(surface.primaryFocus).not.toBe(surface.workspace?.focus || null);
    expect(surface.primaryNextStep).not.toBe(surface.workspace?.nextMilestone || null);
    expect(surface.primaryOpenPoint).not.toBe(surface.workspace?.openItems[0] || null);
  });
});
