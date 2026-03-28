import { describe, expect, it } from 'vitest';

import { buildMayaMainSurfaceDerivation } from '../../lib/maya-thread-digest';
import { ChatSession, MayaWorkspaceContext } from '../../lib/types';

const THREAD_FOCUS = 'Bitte Preisanker A und B fuer den ersten Checkout-Test vergleichen und die plausiblere Spur festhalten.';
const ACTION_LINE = 'Preisanker A zuerst gegen Checkout-Abbruchquote pruefen.';

function makeAssistantShapedLowActivitySession(): ChatSession {
  return {
    id: 'thread-low-activity-convergence-assisted',
    title: '',
    intent: '',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: THREAD_FOCUS,
        timestamp: '18:00'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: ACTION_LINE,
        timestamp: '18:01'
      }
    ],
    createdAt: '2026-03-28T18:00:00.000Z',
    updatedAt: '2026-03-28T18:01:00.000Z'
  };
}

function makeConvergentManualWorkrunTruth(): ChatSession['workrun'] {
  return {
    focus: THREAD_FOCUS,
    status: 'open',
    lastOutput: ACTION_LINE,
    lastStep: THREAD_FOCUS,
    nextStep: ACTION_LINE,
    updatedAt: '2026-03-28T18:02:00.000Z',
    source: 'manual'
  };
}

function makeConvergentManualHandoffTruth(): ChatSession['handoff'] {
  return {
    status: 'paused',
    achieved: ACTION_LINE,
    openItems: [ACTION_LINE],
    nextEntry: ACTION_LINE,
    updatedAt: '2026-03-28T18:02:30.000Z',
    source: 'manual'
  };
}

function makeConvergentManualWorkspaceTruth(): MayaWorkspaceContext {
  return {
    id: 'workspace-low-activity-convergence-manual',
    title: 'Checkout Workspace',
    focus: THREAD_FOCUS,
    goal: THREAD_FOCUS,
    currentState: ACTION_LINE,
    openItems: [ACTION_LINE],
    nextMilestone: ACTION_LINE,
    threadIds: ['thread-low-activity-convergence-assisted'],
    updatedAt: '2026-03-28T18:03:00.000Z',
    source: 'manual',
    status: 'active'
  };
}

describe('maya primary surface low-activity manual truth convergence observation', () => {
  it('keeps manual workrun source ownership even when manual values converge with the derived low-activity thread truth', () => {
    const session: ChatSession = {
      ...makeAssistantShapedLowActivitySession(),
      id: 'thread-low-activity-convergence-workrun',
      workrun: makeConvergentManualWorkrunTruth()
    };

    const surface = buildMayaMainSurfaceDerivation(session, undefined);

    expect(surface.workrun?.source).toBe('manual');
    expect(surface.workrun?.focus).toBe(THREAD_FOCUS);
    expect(surface.workrun?.nextStep).toBe(ACTION_LINE);
    expect(surface.primaryFocus).toBe(THREAD_FOCUS);
    expect(surface.primaryNextStep).toBe(ACTION_LINE);
    expect(surface.primaryFocus).toBe(surface.workrun?.focus || null);
    expect(surface.primaryNextStep).toBe(surface.workrun?.nextStep || null);
    expect(surface.primaryFocus).toBe(surface.briefing?.focus || null);
    expect(surface.primaryNextStep).toBe(surface.briefing?.nextStep || null);
  });

  it('keeps manual handoff source ownership even when handoff truth converges with the current low-activity action line', () => {
    const session: ChatSession = {
      ...makeAssistantShapedLowActivitySession(),
      id: 'thread-low-activity-convergence-handoff',
      handoff: makeConvergentManualHandoffTruth()
    };

    const surface = buildMayaMainSurfaceDerivation(session, undefined);

    expect(surface.workrun?.source).toBe('derived');
    expect(surface.handoff?.source).toBe('manual');
    expect(surface.handoff?.openItems[0]).toBe(ACTION_LINE);
    expect(surface.handoff?.nextEntry).toBe(ACTION_LINE);
    expect(surface.primaryNextStep).toBe(ACTION_LINE);
    expect(surface.primaryOpenPoint).toBe(ACTION_LINE);
    expect(surface.primaryNextStep).toBe(surface.workrun?.nextStep || null);
    expect(surface.primaryOpenPoint).toBe(surface.handoff?.openItems[0] || null);
  });

  it('keeps manual workspace source ownership even when workspace values converge with the visible primary lanes', () => {
    const session: ChatSession = {
      ...makeAssistantShapedLowActivitySession(),
      id: 'thread-low-activity-convergence-workspace',
      handoff: makeConvergentManualHandoffTruth()
    };
    const workspace = makeConvergentManualWorkspaceTruth();

    const surface = buildMayaMainSurfaceDerivation(session, workspace);

    expect(surface.workspace?.source).toBe('manual');
    expect(surface.workspace?.focus).toBe(THREAD_FOCUS);
    expect(surface.workspace?.nextMilestone).toBe(ACTION_LINE);
    expect(surface.workspace?.openItems[0]).toBe(ACTION_LINE);
    expect(surface.primaryFocus).toBe(THREAD_FOCUS);
    expect(surface.primaryNextStep).toBe(ACTION_LINE);
    expect(surface.primaryOpenPoint).toBe(ACTION_LINE);
    expect(surface.primaryFocus).toBe(surface.workspace?.focus || null);
    expect(surface.primaryNextStep).toBe(surface.workspace?.nextMilestone || null);
    expect(surface.primaryOpenPoint).toBe(surface.workspace?.openItems[0] || null);
  });
});
