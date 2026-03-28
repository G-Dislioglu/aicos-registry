import { describe, expect, it } from 'vitest';

import {
  buildMayaMainSurfaceDerivation,
  buildPersistedThreadHandoff,
  buildPersistedWorkspaceContext,
  buildPersistedWorkrun
} from '../../lib/maya-thread-digest';
import { ChatSession } from '../../lib/types';

const THREAD_FOCUS = 'Bitte Preisanker A und B fuer den ersten Checkout-Test vergleichen und die plausiblere Spur festhalten.';
const ACTION_LINE = 'Preisanker A zuerst gegen Checkout-Abbruchquote pruefen.';

function makeAssistantShapedLowActivitySession(): ChatSession {
  return {
    id: 'thread-low-activity-persisted-partial-convergence-assisted',
    title: '',
    intent: '',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: THREAD_FOCUS,
        timestamp: '22:00'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: ACTION_LINE,
        timestamp: '22:01'
      }
    ],
    createdAt: '2026-03-28T22:00:00.000Z',
    updatedAt: '2026-03-28T22:01:00.000Z'
  };
}

describe('maya primary surface low-activity persisted partial update convergence observation', () => {
  it('keeps manual workrun ownership when a partial persisted focus update converges with the current derived focus lane', () => {
    const session = makeAssistantShapedLowActivitySession();
    const initialSurface = buildMayaMainSurfaceDerivation(session, undefined);
    const persistedWorkrun = buildPersistedWorkrun(session, initialSurface.workrun, {
      focus: THREAD_FOCUS,
      source: 'manual'
    });

    const nextSurface = buildMayaMainSurfaceDerivation(
      {
        ...session,
        workrun: persistedWorkrun
      },
      undefined
    );

    expect(initialSurface.workrun?.source).toBe('derived');
    expect(initialSurface.workrun?.focus).toBe(THREAD_FOCUS);
    expect(initialSurface.workrun?.nextStep).toBe(ACTION_LINE);
    expect(persistedWorkrun?.source).toBe('manual');
    expect(persistedWorkrun?.focus).toBe(initialSurface.workrun?.focus);
    expect(persistedWorkrun?.nextStep).toBe(initialSurface.workrun?.nextStep);
    expect(nextSurface.workrun?.source).toBe('manual');
    expect(nextSurface.primaryFocus).toBe(THREAD_FOCUS);
    expect(nextSurface.primaryNextStep).toBe(ACTION_LINE);
    expect(nextSurface.primaryFocus).toBe(nextSurface.workrun?.focus || null);
    expect(nextSurface.primaryNextStep).toBe(nextSurface.workrun?.nextStep || null);
  });

  it('keeps manual handoff ownership when a partial persisted open-items update converges with the current derived action line', () => {
    const session = makeAssistantShapedLowActivitySession();
    const initialSurface = buildMayaMainSurfaceDerivation(session, undefined);
    const persistedHandoff = buildPersistedThreadHandoff(session, initialSurface.handoff, {
      openItems: [ACTION_LINE],
      source: 'manual'
    });

    const nextSurface = buildMayaMainSurfaceDerivation(
      {
        ...session,
        handoff: persistedHandoff
      },
      undefined
    );

    expect(initialSurface.handoff?.source).toBe('derived');
    expect(initialSurface.handoff?.openItems[0]).toBe(ACTION_LINE);
    expect(initialSurface.handoff?.nextEntry).toBe(ACTION_LINE);
    expect(persistedHandoff?.source).toBe('manual');
    expect(persistedHandoff?.openItems[0]).toBe(initialSurface.handoff?.openItems[0]);
    expect(persistedHandoff?.nextEntry).toBe(initialSurface.handoff?.nextEntry);
    expect(nextSurface.handoff?.source).toBe('manual');
    expect(nextSurface.primaryNextStep).toBe(ACTION_LINE);
    expect(nextSurface.primaryOpenPoint).toBe(ACTION_LINE);
    expect(nextSurface.primaryNextStep).toBe(nextSurface.workrun?.nextStep || null);
    expect(nextSurface.primaryOpenPoint).toBe(nextSurface.handoff?.openItems[0] || null);
  });

  it('keeps manual workspace ownership when a partial persisted open-items update converges with the current derived workspace lane', () => {
    const session = makeAssistantShapedLowActivitySession();
    const initialSurface = buildMayaMainSurfaceDerivation(session, undefined);
    const persistedWorkspace = buildPersistedWorkspaceContext(session, initialSurface.workspace, {
      openItems: [ACTION_LINE],
      source: 'manual'
    });

    const nextSurface = buildMayaMainSurfaceDerivation(session, persistedWorkspace);

    expect(initialSurface.workspace?.source).toBe('derived');
    expect(initialSurface.workspace?.openItems[0]).toBe(ACTION_LINE);
    expect(initialSurface.workspace?.nextMilestone).toBe(ACTION_LINE);
    expect(persistedWorkspace?.source).toBe('manual');
    expect(persistedWorkspace?.openItems[0]).toBe(initialSurface.workspace?.openItems[0]);
    expect(persistedWorkspace?.nextMilestone).toBe(initialSurface.workspace?.nextMilestone);
    expect(nextSurface.workspace?.source).toBe('manual');
    expect(nextSurface.workspace?.openItems[0]).toBe(ACTION_LINE);
    expect(nextSurface.workspace?.nextMilestone).toBe(ACTION_LINE);
    expect(nextSurface.primaryNextStep).toBe(ACTION_LINE);
    expect(nextSurface.primaryOpenPoint).toBe(ACTION_LINE);
    expect(nextSurface.primaryOpenPoint).toBe(nextSurface.workspace?.openItems[0] || null);
  });
});
