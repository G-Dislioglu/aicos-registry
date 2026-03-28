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
    id: 'thread-low-activity-ownership-stability-assisted',
    title: '',
    intent: '',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: THREAD_FOCUS,
        timestamp: '19:00'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: ACTION_LINE,
        timestamp: '19:01'
      }
    ],
    createdAt: '2026-03-28T19:00:00.000Z',
    updatedAt: '2026-03-28T19:01:00.000Z'
  };
}

describe('maya primary surface low-activity source ownership stability observation', () => {
  it('keeps manual workrun ownership after a semantic no-op persist and re-derive cycle', () => {
    const baseSession = makeAssistantShapedLowActivitySession();
    const initialSurface = buildMayaMainSurfaceDerivation(baseSession, undefined);
    const persistedWorkrun = buildPersistedWorkrun(baseSession, initialSurface.workrun, {
      focus: initialSurface.workrun?.focus,
      nextStep: initialSurface.workrun?.nextStep,
      source: 'manual'
    });

    const persistedSession: ChatSession = {
      ...baseSession,
      workrun: persistedWorkrun
    };

    const nextSurface = buildMayaMainSurfaceDerivation(persistedSession, undefined);

    expect(persistedWorkrun?.source).toBe('manual');
    expect(nextSurface.workrun?.source).toBe('manual');
    expect(nextSurface.workrun?.focus).toBe(THREAD_FOCUS);
    expect(nextSurface.workrun?.nextStep).toBe(ACTION_LINE);
    expect(nextSurface.primaryFocus).toBe(THREAD_FOCUS);
    expect(nextSurface.primaryNextStep).toBe(ACTION_LINE);
  });

  it('keeps manual handoff ownership after a semantic no-op persist and re-derive cycle', () => {
    const baseSession = makeAssistantShapedLowActivitySession();
    const initialSurface = buildMayaMainSurfaceDerivation(baseSession, undefined);
    const persistedHandoff = buildPersistedThreadHandoff(baseSession, initialSurface.handoff, {
      achieved: initialSurface.handoff?.achieved,
      openItems: initialSurface.handoff?.openItems,
      nextEntry: initialSurface.handoff?.nextEntry,
      source: 'manual'
    });

    const persistedSession: ChatSession = {
      ...baseSession,
      handoff: persistedHandoff
    };

    const nextSurface = buildMayaMainSurfaceDerivation(persistedSession, undefined);

    expect(persistedHandoff?.source).toBe('manual');
    expect(nextSurface.handoff?.source).toBe('manual');
    expect(nextSurface.handoff?.openItems[0]).toBe(ACTION_LINE);
    expect(nextSurface.handoff?.nextEntry).toBe(ACTION_LINE);
    expect(nextSurface.primaryOpenPoint).toBe(ACTION_LINE);
  });

  it('keeps manual workspace ownership after a semantic no-op persist and re-derive cycle', () => {
    const baseSession = makeAssistantShapedLowActivitySession();
    const initialSurface = buildMayaMainSurfaceDerivation(baseSession, undefined);
    const persistedWorkspace = buildPersistedWorkspaceContext(baseSession, initialSurface.workspace, {
      focus: initialSurface.workspace?.focus,
      goal: initialSurface.workspace?.goal,
      currentState: initialSurface.workspace?.currentState,
      openItems: initialSurface.workspace?.openItems,
      nextMilestone: initialSurface.workspace?.nextMilestone,
      source: 'manual'
    });

    const nextSurface = buildMayaMainSurfaceDerivation(baseSession, persistedWorkspace);

    expect(persistedWorkspace?.source).toBe('manual');
    expect(nextSurface.workspace?.source).toBe('manual');
    expect(nextSurface.workspace?.focus).toBe(THREAD_FOCUS);
    expect(nextSurface.workspace?.nextMilestone).toBe(ACTION_LINE);
    expect(nextSurface.workspace?.openItems[0]).toBe(ACTION_LINE);
    expect(nextSurface.primaryFocus).toBe(THREAD_FOCUS);
    expect(nextSurface.primaryNextStep).toBe(ACTION_LINE);
    expect(nextSurface.primaryOpenPoint).toBe(ACTION_LINE);
  });
});
