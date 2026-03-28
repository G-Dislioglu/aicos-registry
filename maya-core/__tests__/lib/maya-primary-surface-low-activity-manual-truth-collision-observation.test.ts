import { describe, expect, it } from 'vitest';

import { buildMayaMainSurfaceDerivation } from '../../lib/maya-thread-digest';
import { ChatSession, MayaWorkspaceContext } from '../../lib/types';

function makeAssistantShapedLowActivitySession(): ChatSession {
  return {
    id: 'thread-low-activity-collision-assisted',
    title: '',
    intent: '',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Bitte Preisanker A und B fuer den ersten Checkout-Test vergleichen und die plausiblere Spur festhalten.',
        timestamp: '16:00'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Preisanker A zuerst gegen Checkout-Abbruchquote pruefen.',
        timestamp: '16:01'
      }
    ],
    createdAt: '2026-03-28T16:00:00.000Z',
    updatedAt: '2026-03-28T16:01:00.000Z'
  };
}

function makeManualWorkrunTruth(): ChatSession['workrun'] {
  return {
    focus: 'Preisanker B als bewusste Gegenspur zuerst pruefen.',
    status: 'open',
    lastOutput: 'Preisanker B bleibt als aktive Gegenspur sichtbar.',
    lastStep: 'Preisanker B als Alternative festhalten.',
    nextStep: 'Preisanker B zuerst gegen Checkout-Abbruchquote pruefen.',
    updatedAt: '2026-03-28T16:02:00.000Z',
    source: 'manual'
  };
}

function makeManualHandoffTruth(): ChatSession['handoff'] {
  return {
    status: 'paused',
    achieved: 'Preisanker C bleibt als offener Uebergabestrang sichtbar.',
    openItems: ['Preisanker C gegen Checkout-Abbruchquote absichern.'],
    nextEntry: 'Mit Preisanker C als Uebergabestrang wieder einsteigen.',
    updatedAt: '2026-03-28T16:02:30.000Z',
    source: 'manual'
  };
}

function makeManualWorkspaceTruth(): MayaWorkspaceContext {
  return {
    id: 'workspace-low-activity-collision-manual',
    title: 'Checkout Workspace',
    focus: 'Persistierter Workspace-Fokus D, der als eigener manueller Strang sichtbar bleibt.',
    goal: 'Persistiertes Workspace-Ziel D',
    currentState: 'Persistierter Workspace-Zustand D',
    openItems: ['Persistierter Workspace-Open-Point D, der nur als Workspace-Wahrheit gelten soll.'],
    nextMilestone: 'Persistierter Workspace-Meilenstein D, der nicht automatisch Primaervorrang bekommt.',
    threadIds: ['thread-low-activity-collision-assisted'],
    updatedAt: '2026-03-28T16:03:00.000Z',
    source: 'manual',
    status: 'active'
  };
}

describe('maya primary surface low-activity manual truth collision observation', () => {
  it('splits primary lanes deterministically when manual workrun, handoff, and workspace truths all collide at once', () => {
    const session: ChatSession = {
      ...makeAssistantShapedLowActivitySession(),
      id: 'thread-low-activity-collision-all-manual',
      workrun: makeManualWorkrunTruth(),
      handoff: makeManualHandoffTruth()
    };
    const workspace = makeManualWorkspaceTruth();

    const surface = buildMayaMainSurfaceDerivation(session, workspace);

    expect(surface.workrun?.source).toBe('manual');
    expect(surface.handoff?.source).toBe('manual');
    expect(surface.workspace?.source).toBe('manual');
    expect(surface.handoff?.nextEntry).toBe('Mit Preisanker C als Uebergabestrang wieder einsteigen.');
    expect(surface.workspace?.nextMilestone).toBe('Persistierter Workspace-Meilenstein D, der nicht automatisch Primaervorrang bekommt.');
    expect(surface.primaryFocus).toBe('Preisanker B als bewusste Gegenspur zuerst pruefen.');
    expect(surface.primaryNextStep).toBe('Preisanker B zuerst gegen Checkout-Abbruchquote pruefen.');
    expect(surface.primaryOpenPoint).toBe('Preisanker C gegen Checkout-Abbruchquote absichern.');
    expect(surface.primaryFocus).toBe(surface.workrun?.focus || null);
    expect(surface.primaryNextStep).toBe(surface.workrun?.nextStep || null);
    expect(surface.primaryOpenPoint).toBe(surface.handoff?.openItems[0] || null);
    expect(surface.primaryNextStep).not.toBe(surface.handoff?.nextEntry || null);
    expect(surface.primaryNextStep).not.toBe(surface.workspace?.nextMilestone || null);
    expect(surface.primaryOpenPoint).not.toBe(surface.workspace?.openItems[0] || null);
  });

  it('keeps manual handoff re-entry and manual workspace milestone colliding below the workrun-owned next-step lane', () => {
    const session: ChatSession = {
      ...makeAssistantShapedLowActivitySession(),
      id: 'thread-low-activity-collision-handoff-workspace',
      handoff: makeManualHandoffTruth()
    };
    const workspace = makeManualWorkspaceTruth();

    const surface = buildMayaMainSurfaceDerivation(session, workspace);

    expect(surface.workrun?.source).toBe('derived');
    expect(surface.handoff?.source).toBe('manual');
    expect(surface.workspace?.source).toBe('manual');
    expect(surface.handoff?.nextEntry).toBe('Mit Preisanker C als Uebergabestrang wieder einsteigen.');
    expect(surface.workspace?.nextMilestone).toBe('Persistierter Workspace-Meilenstein D, der nicht automatisch Primaervorrang bekommt.');
    expect(surface.primaryNextStep).toBe('Preisanker A zuerst gegen Checkout-Abbruchquote pruefen.');
    expect(surface.primaryNextStep).toBe(surface.workrun?.nextStep || null);
    expect(surface.primaryNextStep).not.toBe(surface.handoff?.nextEntry || null);
    expect(surface.primaryNextStep).not.toBe(surface.workspace?.nextMilestone || null);
    expect(surface.primaryOpenPoint).toBe('Preisanker C gegen Checkout-Abbruchquote absichern.');
    expect(surface.primaryOpenPoint).toBe(surface.handoff?.openItems[0] || null);
  });

  it('lets manual workspace keep conflicting workspace-owned truth while handoff still wins the primary open-point lane', () => {
    const session: ChatSession = {
      ...makeAssistantShapedLowActivitySession(),
      id: 'thread-low-activity-collision-workspace-owned',
      handoff: makeManualHandoffTruth()
    };
    const workspace = makeManualWorkspaceTruth();

    const surface = buildMayaMainSurfaceDerivation(session, workspace);

    expect(surface.workspace?.focus).toBe('Persistierter Workspace-Fokus D, der als eigener manueller Strang sichtbar bleibt.');
    expect(surface.workspace?.nextMilestone).toBe('Persistierter Workspace-Meilenstein D, der nicht automatisch Primaervorrang bekommt.');
    expect(surface.workspace?.openItems[0]).toBe('Persistierter Workspace-Open-Point D, der nur als Workspace-Wahrheit gelten soll.');
    expect(surface.workspace?.nextMilestone).not.toBe(surface.handoff?.nextEntry || null);
    expect(surface.workspace?.openItems[0]).not.toBe(surface.handoff?.openItems[0] || null);
    expect(surface.primaryFocus).toBe(surface.workrun?.focus || null);
    expect(surface.primaryNextStep).toBe(surface.workrun?.nextStep || null);
    expect(surface.primaryOpenPoint).toBe(surface.handoff?.openItems[0] || null);
    expect(surface.primaryOpenPoint).not.toBe(surface.workspace?.openItems[0] || null);
  });
});
