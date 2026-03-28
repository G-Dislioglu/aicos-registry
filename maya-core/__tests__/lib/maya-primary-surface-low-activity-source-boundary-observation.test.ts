import { describe, expect, it } from 'vitest';

import { buildMayaMainSurfaceDerivation } from '../../lib/maya-thread-digest';
import { ChatSession, MayaWorkspaceContext } from '../../lib/types';

function makeAssistantShapedLowActivitySession(): ChatSession {
  return {
    id: 'thread-low-activity-boundary-assisted',
    title: '',
    intent: '',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Bitte Preisanker A und B für den ersten Checkout-Test vergleichen und die plausiblere Spur festhalten.',
        timestamp: '14:00'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Preisanker A zuerst gegen Checkout-Abbruchquote prüfen.',
        timestamp: '14:01'
      }
    ],
    createdAt: '2026-03-28T14:00:00.000Z',
    updatedAt: '2026-03-28T14:01:00.000Z'
  };
}

function makeManualWorkrunBoundarySession(): ChatSession {
  return {
    ...makeAssistantShapedLowActivitySession(),
    id: 'thread-low-activity-boundary-workrun',
    workrun: {
      focus: 'Preisanker B als bewusste Gegenspur zuerst prüfen.',
      status: 'open',
      lastOutput: 'Preisanker B bleibt als aktive Gegenspur sichtbar.',
      lastStep: 'Preisanker B als Alternative festhalten.',
      nextStep: 'Preisanker B zuerst gegen Checkout-Abbruchquote prüfen.',
      updatedAt: '2026-03-28T14:02:00.000Z',
      source: 'manual'
    }
  };
}

function makeManualHandoffBoundarySession(): ChatSession {
  return {
    ...makeAssistantShapedLowActivitySession(),
    id: 'thread-low-activity-boundary-handoff',
    handoff: {
      status: 'paused',
      achieved: 'Preisanker B bleibt als offene Gegenspur sichtbar.',
      openItems: ['Preisanker B gegen Checkout-Abbruchquote absichern.'],
      nextEntry: 'Mit Preisanker B als Gegenspur wieder einsteigen.',
      updatedAt: '2026-03-28T14:02:00.000Z',
      source: 'manual'
    }
  };
}

function makeManualWorkspaceBoundary(): MayaWorkspaceContext {
  return {
    id: 'workspace-low-activity-boundary-manual',
    title: 'Checkout Workspace',
    focus: 'Persistierter Workspace-Fokus, der als eigener Strang getrennt bleiben soll.',
    goal: 'Persistiertes Workspace-Ziel',
    currentState: 'Persistierter Workspace-Zustand',
    openItems: ['Persistierter Workspace-Open-Point, der nicht still in die Primärfläche rutschen darf.'],
    nextMilestone: 'Persistierter Workspace-Meilenstein, der bewusst von der Threadspur abweicht.',
    threadIds: ['thread-low-activity-boundary-assisted'],
    updatedAt: '2026-03-28T14:02:00.000Z',
    source: 'manual',
    status: 'active'
  };
}

describe('maya primary surface low-activity source boundary observation', () => {
  it('lets a manual workrun intentionally override the low-activity briefing lane without losing explicit session truth', () => {
    const surface = buildMayaMainSurfaceDerivation(makeManualWorkrunBoundarySession(), undefined);

    expect(surface.briefing?.focus).toBe('Bitte Preisanker A und B für den ersten Checkout-Test vergleichen und die plausiblere Spur festhalten.');
    expect(surface.briefing?.nextStep).toBe('Preisanker A zuerst gegen Checkout-Abbruchquote prüfen.');
    expect(surface.workrun?.source).toBe('manual');
    expect(surface.workrun?.focus).toBe('Preisanker B als bewusste Gegenspur zuerst prüfen.');
    expect(surface.workrun?.nextStep).toBe('Preisanker B zuerst gegen Checkout-Abbruchquote prüfen.');
    expect(surface.primaryFocus).toBe(surface.workrun?.focus || null);
    expect(surface.primaryNextStep).toBe(surface.workrun?.nextStep || null);
    expect(surface.handoff?.nextEntry).toBe(surface.workrun?.nextStep);
    expect(surface.workspace?.focus).toBe(surface.workrun?.focus);
    expect(surface.primaryFocus).not.toBe(surface.briefing?.focus || null);
    expect(surface.primaryNextStep).not.toBe(surface.briefing?.nextStep || null);
  });

  it('lets a manual handoff diverge from the low-activity workrun only on the handoff-owned lanes', () => {
    const surface = buildMayaMainSurfaceDerivation(makeManualHandoffBoundarySession(), undefined);

    expect(surface.workrun?.source).toBe('derived');
    expect(surface.workrun?.focus).toBe('Bitte Preisanker A und B für den ersten Checkout-Test vergleichen und die plausiblere Spur festhalten.');
    expect(surface.workrun?.nextStep).toBe('Preisanker A zuerst gegen Checkout-Abbruchquote prüfen.');
    expect(surface.handoff?.source).toBe('manual');
    expect(surface.handoff?.status).toBe('paused');
    expect(surface.handoff?.nextEntry).toBe('Mit Preisanker B als Gegenspur wieder einsteigen.');
    expect(surface.handoff?.openItems[0]).toBe('Preisanker B gegen Checkout-Abbruchquote absichern.');
    expect(surface.workspace?.currentState).toBe('Preisanker B bleibt als offene Gegenspur sichtbar.');
    expect(surface.workspace?.nextMilestone).toBe('Mit Preisanker B als Gegenspur wieder einsteigen.');
    expect(surface.primaryFocus).toBe(surface.workrun?.focus || null);
    expect(surface.primaryNextStep).toBe(surface.workrun?.nextStep || null);
    expect(surface.primaryOpenPoint).toBe(surface.handoff?.openItems[0] || null);
    expect(surface.primaryNextStep).not.toBe(surface.handoff?.nextEntry || null);
  });

  it('lets a manual workspace stay explicitly separate from low-activity thread truth without taking over the primary surface', () => {
    const surface = buildMayaMainSurfaceDerivation(makeAssistantShapedLowActivitySession(), makeManualWorkspaceBoundary());

    expect(surface.workrun?.focus).toBe('Bitte Preisanker A und B für den ersten Checkout-Test vergleichen und die plausiblere Spur festhalten.');
    expect(surface.workrun?.nextStep).toBe('Preisanker A zuerst gegen Checkout-Abbruchquote prüfen.');
    expect(surface.handoff?.openItems[0]).toBe('Preisanker A zuerst gegen Checkout-Abbruchquote prüfen.');
    expect(surface.workspace?.source).toBe('manual');
    expect(surface.workspace?.focus).toBe('Persistierter Workspace-Fokus, der als eigener Strang getrennt bleiben soll.');
    expect(surface.workspace?.nextMilestone).toBe('Persistierter Workspace-Meilenstein, der bewusst von der Threadspur abweicht.');
    expect(surface.workspace?.openItems[0]).toBe('Persistierter Workspace-Open-Point, der nicht still in die Primärfläche rutschen darf.');
    expect(surface.primaryFocus).toBe(surface.workrun?.focus || null);
    expect(surface.primaryNextStep).toBe(surface.workrun?.nextStep || null);
    expect(surface.primaryOpenPoint).toBe(surface.handoff?.openItems[0] || null);
    expect(surface.primaryFocus).not.toBe(surface.workspace?.focus || null);
    expect(surface.primaryNextStep).not.toBe(surface.workspace?.nextMilestone || null);
    expect(surface.primaryOpenPoint).not.toBe(surface.workspace?.openItems[0] || null);
  });
});
