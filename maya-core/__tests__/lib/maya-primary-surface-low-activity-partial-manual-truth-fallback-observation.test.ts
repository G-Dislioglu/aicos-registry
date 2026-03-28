import { describe, expect, it } from 'vitest';

import { buildMayaMainSurfaceDerivation } from '../../lib/maya-thread-digest';
import { ChatSession, MayaWorkspaceContext } from '../../lib/types';

function makeAssistantShapedLowActivitySession(): ChatSession {
  return {
    id: 'thread-low-activity-partial-manual-assisted',
    title: '',
    intent: '',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Bitte Preisanker A und B fuer den ersten Checkout-Test vergleichen und die plausiblere Spur festhalten.',
        timestamp: '17:00'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Preisanker A zuerst gegen Checkout-Abbruchquote pruefen.',
        timestamp: '17:01'
      }
    ],
    createdAt: '2026-03-28T17:00:00.000Z',
    updatedAt: '2026-03-28T17:01:00.000Z'
  };
}

function makePartialManualWorkrunTruth(): ChatSession['workrun'] {
  return {
    focus: 'Preisanker B als bewusste Gegenspur zuerst pruefen.',
    status: 'open',
    lastOutput: 'Preisanker B bleibt als aktive Gegenspur sichtbar.',
    lastStep: 'Preisanker B als Alternative festhalten.',
    nextStep: '',
    updatedAt: '2026-03-28T17:02:00.000Z',
    source: 'manual'
  };
}

function makePartialManualHandoffTruth(): ChatSession['handoff'] {
  return {
    status: 'paused',
    achieved: '',
    openItems: [],
    nextEntry: 'Mit Preisanker C als Uebergabestrang wieder einsteigen.',
    updatedAt: '2026-03-28T17:02:30.000Z',
    source: 'manual'
  };
}

function makePartialManualWorkspaceTruth(): MayaWorkspaceContext {
  return {
    id: 'workspace-low-activity-partial-manual',
    title: 'Checkout Workspace',
    focus: '',
    goal: 'Persistiertes Workspace-Ziel D',
    currentState: 'Persistierter Workspace-Zustand D',
    openItems: [],
    nextMilestone: '',
    threadIds: ['thread-low-activity-partial-manual-assisted'],
    updatedAt: '2026-03-28T17:03:00.000Z',
    source: 'manual',
    status: 'active'
  };
}

describe('maya primary surface low-activity partial manual truth fallback observation', () => {
  it('keeps manual workrun focus while an empty manual next-step falls back inside the workrun lane', () => {
    const session: ChatSession = {
      ...makeAssistantShapedLowActivitySession(),
      id: 'thread-low-activity-partial-manual-workrun',
      workrun: makePartialManualWorkrunTruth(),
      handoff: makePartialManualHandoffTruth()
    };
    const workspace = makePartialManualWorkspaceTruth();

    const surface = buildMayaMainSurfaceDerivation(session, workspace);

    expect(surface.workrun?.source).toBe('manual');
    expect(surface.workrun?.focus).toBe('Preisanker B als bewusste Gegenspur zuerst pruefen.');
    expect(surface.workrun?.nextStep).toBe('Preisanker A zuerst gegen Checkout-Abbruchquote pruefen.');
    expect(surface.handoff?.nextEntry).toBe('Mit Preisanker C als Uebergabestrang wieder einsteigen.');
    expect(surface.primaryFocus).toBe(surface.workrun?.focus || null);
    expect(surface.primaryNextStep).toBe(surface.workrun?.nextStep || null);
    expect(surface.primaryNextStep).not.toBe(surface.handoff?.nextEntry || null);
  });

  it('keeps manual handoff as the owning lane while empty manual open-items fall back to derived handoff open-items', () => {
    const session: ChatSession = {
      ...makeAssistantShapedLowActivitySession(),
      id: 'thread-low-activity-partial-manual-handoff',
      handoff: makePartialManualHandoffTruth()
    };
    const workspace = makePartialManualWorkspaceTruth();

    const surface = buildMayaMainSurfaceDerivation(session, workspace);

    expect(surface.handoff?.source).toBe('manual');
    expect(surface.handoff?.openItems[0]).toBe('Preisanker A zuerst gegen Checkout-Abbruchquote pruefen.');
    expect(surface.handoff?.nextEntry).toBe('Mit Preisanker C als Uebergabestrang wieder einsteigen.');
    expect(surface.primaryOpenPoint).toBe(surface.handoff?.openItems[0] || null);
    expect(surface.workspace?.openItems[0]).toBe(surface.handoff?.openItems[0] || null);
  });

  it('keeps manual workspace source while empty workspace-owned fields fall back internally, even when values align with primary lanes', () => {
    const session: ChatSession = {
      ...makeAssistantShapedLowActivitySession(),
      id: 'thread-low-activity-partial-manual-workspace',
      handoff: makePartialManualHandoffTruth()
    };
    const workspace = makePartialManualWorkspaceTruth();

    const surface = buildMayaMainSurfaceDerivation(session, workspace);

    expect(surface.workspace?.source).toBe('manual');
    expect(surface.workspace?.focus).toBe('Bitte Preisanker A und B fuer den ersten Checkout-Test vergleichen und die plausiblere Spur festhalten.');
    expect(surface.workspace?.nextMilestone).toBe('Mit Preisanker C als Uebergabestrang wieder einsteigen.');
    expect(surface.workspace?.openItems[0]).toBe('Preisanker A zuerst gegen Checkout-Abbruchquote pruefen.');
    expect(surface.primaryFocus).toBe(surface.workrun?.focus || null);
    expect(surface.primaryNextStep).toBe(surface.workrun?.nextStep || null);
    expect(surface.primaryOpenPoint).toBe(surface.handoff?.openItems[0] || null);
    expect(surface.primaryFocus).toBe(surface.workspace?.focus || null);
    expect(surface.primaryNextStep).not.toBe(surface.workspace?.nextMilestone || null);
    expect(surface.primaryOpenPoint).toBe(surface.workspace?.openItems[0] || null);
  });
});
