import { describe, expect, it } from 'vitest';

import { buildMayaMainSurfaceDerivation } from '../../lib/maya-thread-digest';
import { ChatSession, MayaWorkspaceContext } from '../../lib/types';

function makeAssistantShapedLowActivitySession(): ChatSession {
  return {
    id: 'thread-low-activity-precedence-assisted',
    title: '',
    intent: '',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Bitte Preisanker A und B für den ersten Checkout-Test vergleichen und die plausiblere Spur festhalten.',
        timestamp: '15:00'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Preisanker A zuerst gegen Checkout-Abbruchquote prüfen.',
        timestamp: '15:01'
      }
    ],
    createdAt: '2026-03-28T15:00:00.000Z',
    updatedAt: '2026-03-28T15:01:00.000Z'
  };
}

function makeManualWorkrunTruth(): ChatSession['workrun'] {
  return {
    focus: 'Preisanker B als bewusste Gegenspur zuerst prüfen.',
    status: 'open',
    lastOutput: 'Preisanker B bleibt als aktive Gegenspur sichtbar.',
    lastStep: 'Preisanker B als Alternative festhalten.',
    nextStep: 'Preisanker B zuerst gegen Checkout-Abbruchquote prüfen.',
    updatedAt: '2026-03-28T15:02:00.000Z',
    source: 'manual'
  };
}

function makeManualHandoffTruth(): ChatSession['handoff'] {
  return {
    status: 'paused',
    achieved: 'Preisanker C bleibt als offener Übergabestrang sichtbar.',
    openItems: ['Preisanker C gegen Checkout-Abbruchquote absichern.'],
    nextEntry: 'Mit Preisanker C als Übergabestrang wieder einsteigen.',
    updatedAt: '2026-03-28T15:02:30.000Z',
    source: 'manual'
  };
}

function makeManualWorkspaceTruth(): MayaWorkspaceContext {
  return {
    id: 'workspace-low-activity-precedence-manual',
    title: 'Checkout Workspace',
    focus: 'Persistierter Workspace-Fokus, der als eigener manueller Strang sichtbar bleibt.',
    goal: 'Persistiertes Workspace-Ziel',
    currentState: 'Persistierter Workspace-Zustand',
    openItems: ['Persistierter Workspace-Open-Point, der nur als Workspace-Wahrheit gelten soll.'],
    nextMilestone: 'Persistierter Workspace-Meilenstein, der nicht automatisch Primärvorrang bekommt.',
    threadIds: ['thread-low-activity-precedence-assisted'],
    updatedAt: '2026-03-28T15:03:00.000Z',
    source: 'manual',
    status: 'active'
  };
}

describe('maya primary surface low-activity manual truth precedence observation', () => {
  it('gives manual workrun precedence on focus and next-step lanes even when handoff and workspace disagree', () => {
    const session: ChatSession = {
      ...makeAssistantShapedLowActivitySession(),
      id: 'thread-low-activity-precedence-workrun',
      workrun: makeManualWorkrunTruth(),
      handoff: makeManualHandoffTruth()
    };
    const workspace = makeManualWorkspaceTruth();

    const surface = buildMayaMainSurfaceDerivation(session, workspace);

    expect(surface.workrun?.source).toBe('manual');
    expect(surface.handoff?.source).toBe('manual');
    expect(surface.workspace?.source).toBe('manual');
    expect(surface.primaryFocus).toBe('Preisanker B als bewusste Gegenspur zuerst prüfen.');
    expect(surface.primaryNextStep).toBe('Preisanker B zuerst gegen Checkout-Abbruchquote prüfen.');
    expect(surface.primaryOpenPoint).toBe('Preisanker C gegen Checkout-Abbruchquote absichern.');
    expect(surface.primaryFocus).toBe(surface.workrun?.focus || null);
    expect(surface.primaryNextStep).toBe(surface.workrun?.nextStep || null);
    expect(surface.primaryNextStep).not.toBe(surface.handoff?.nextEntry || null);
    expect(surface.primaryNextStep).not.toBe(surface.workspace?.nextMilestone || null);
    expect(surface.primaryFocus).not.toBe(surface.workspace?.focus || null);
  });

  it('gives manual handoff precedence only on the open-point lane when workrun remains derived', () => {
    const session: ChatSession = {
      ...makeAssistantShapedLowActivitySession(),
      id: 'thread-low-activity-precedence-handoff',
      handoff: makeManualHandoffTruth()
    };
    const workspace = makeManualWorkspaceTruth();

    const surface = buildMayaMainSurfaceDerivation(session, workspace);

    expect(surface.workrun?.source).toBe('derived');
    expect(surface.handoff?.source).toBe('manual');
    expect(surface.workspace?.source).toBe('manual');
    expect(surface.primaryFocus).toBe('Bitte Preisanker A und B für den ersten Checkout-Test vergleichen und die plausiblere Spur festhalten.');
    expect(surface.primaryNextStep).toBe('Preisanker A zuerst gegen Checkout-Abbruchquote prüfen.');
    expect(surface.primaryOpenPoint).toBe('Preisanker C gegen Checkout-Abbruchquote absichern.');
    expect(surface.primaryFocus).toBe(surface.workrun?.focus || null);
    expect(surface.primaryNextStep).toBe(surface.workrun?.nextStep || null);
    expect(surface.primaryOpenPoint).toBe(surface.handoff?.openItems[0] || null);
    expect(surface.primaryNextStep).not.toBe(surface.handoff?.nextEntry || null);
    expect(surface.primaryOpenPoint).not.toBe(surface.workspace?.openItems[0] || null);
  });

  it('keeps manual workspace truth visible but secondary when workrun and handoff already own the primary lanes', () => {
    const session: ChatSession = {
      ...makeAssistantShapedLowActivitySession(),
      id: 'thread-low-activity-precedence-workspace',
      workrun: makeManualWorkrunTruth(),
      handoff: makeManualHandoffTruth()
    };
    const workspace = makeManualWorkspaceTruth();

    const surface = buildMayaMainSurfaceDerivation(session, workspace);

    expect(surface.workspace?.focus).toBe('Persistierter Workspace-Fokus, der als eigener manueller Strang sichtbar bleibt.');
    expect(surface.workspace?.nextMilestone).toBe('Persistierter Workspace-Meilenstein, der nicht automatisch Primärvorrang bekommt.');
    expect(surface.workspace?.openItems[0]).toBe('Persistierter Workspace-Open-Point, der nur als Workspace-Wahrheit gelten soll.');
    expect(surface.primaryFocus).toBe(surface.workrun?.focus || null);
    expect(surface.primaryNextStep).toBe(surface.workrun?.nextStep || null);
    expect(surface.primaryOpenPoint).toBe(surface.handoff?.openItems[0] || null);
    expect(surface.primaryFocus).not.toBe(surface.workspace?.focus || null);
    expect(surface.primaryNextStep).not.toBe(surface.workspace?.nextMilestone || null);
    expect(surface.primaryOpenPoint).not.toBe(surface.workspace?.openItems[0] || null);
  });
});
