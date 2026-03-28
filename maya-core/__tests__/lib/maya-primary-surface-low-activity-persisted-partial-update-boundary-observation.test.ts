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
const MANUAL_WORKRUN_FOCUS = 'Preisanker B als manuelle Fokusspur vorziehen.';
const MANUAL_HANDOFF_OPEN = 'Preisanker C als manuellen offenen Punkt behalten.';
const MANUAL_WORKSPACE_OPEN = 'Persistierter Workspace-Open-Point D bleibt manuell sichtbar.';

function makeAssistantShapedLowActivitySession(): ChatSession {
  return {
    id: 'thread-low-activity-persisted-partial-boundary-assisted',
    title: '',
    intent: '',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: THREAD_FOCUS,
        timestamp: '21:00'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: ACTION_LINE,
        timestamp: '21:01'
      }
    ],
    createdAt: '2026-03-28T21:00:00.000Z',
    updatedAt: '2026-03-28T21:01:00.000Z'
  };
}

describe('maya primary surface low-activity persisted partial update boundary observation', () => {
  it('keeps a partial manual workrun focus update bounded away from handoff-owned and open-point lanes', () => {
    const session = makeAssistantShapedLowActivitySession();
    const initialSurface = buildMayaMainSurfaceDerivation(session, undefined);
    const persistedWorkrun = buildPersistedWorkrun(session, initialSurface.workrun, {
      focus: MANUAL_WORKRUN_FOCUS,
      source: 'manual'
    });

    const nextSurface = buildMayaMainSurfaceDerivation(
      {
        ...session,
        workrun: persistedWorkrun
      },
      undefined
    );

    expect(nextSurface.workrun?.focus).toBe(MANUAL_WORKRUN_FOCUS);
    expect(nextSurface.workrun?.nextStep).toBe(ACTION_LINE);
    expect(nextSurface.handoff?.nextEntry).toBe(ACTION_LINE);
    expect(nextSurface.primaryFocus).toBe(MANUAL_WORKRUN_FOCUS);
    expect(nextSurface.primaryNextStep).toBe(ACTION_LINE);
    expect(nextSurface.primaryOpenPoint).toBe(ACTION_LINE);
  });

  it('keeps a partial manual handoff open-items update bounded away from workrun-owned focus and next-step lanes', () => {
    const session = makeAssistantShapedLowActivitySession();
    const initialSurface = buildMayaMainSurfaceDerivation(session, undefined);
    const persistedHandoff = buildPersistedThreadHandoff(session, initialSurface.handoff, {
      openItems: [MANUAL_HANDOFF_OPEN],
      source: 'manual'
    });

    const nextSurface = buildMayaMainSurfaceDerivation(
      {
        ...session,
        handoff: persistedHandoff
      },
      undefined
    );

    expect(nextSurface.workrun?.focus).toBe(THREAD_FOCUS);
    expect(nextSurface.workrun?.nextStep).toBe(ACTION_LINE);
    expect(nextSurface.handoff?.openItems[0]).toBe(MANUAL_HANDOFF_OPEN);
    expect(nextSurface.handoff?.nextEntry).toBe(ACTION_LINE);
    expect(nextSurface.primaryFocus).toBe(THREAD_FOCUS);
    expect(nextSurface.primaryNextStep).toBe(ACTION_LINE);
    expect(nextSurface.primaryOpenPoint).toBe(MANUAL_HANDOFF_OPEN);
  });

  it('keeps a partial manual workspace open-items update bounded away from handoff-owned primary open-point lanes', () => {
    const session = makeAssistantShapedLowActivitySession();
    const initialSurface = buildMayaMainSurfaceDerivation(session, undefined);
    const persistedWorkspace = buildPersistedWorkspaceContext(session, initialSurface.workspace, {
      openItems: [MANUAL_WORKSPACE_OPEN],
      source: 'manual'
    });

    const nextSurface = buildMayaMainSurfaceDerivation(session, persistedWorkspace);

    expect(nextSurface.workspace?.openItems[0]).toBe(MANUAL_WORKSPACE_OPEN);
    expect(nextSurface.workspace?.nextMilestone).toBe(ACTION_LINE);
    expect(nextSurface.handoff?.openItems[0]).toBe(ACTION_LINE);
    expect(nextSurface.primaryFocus).toBe(THREAD_FOCUS);
    expect(nextSurface.primaryNextStep).toBe(ACTION_LINE);
    expect(nextSurface.primaryOpenPoint).toBe(ACTION_LINE);
    expect(nextSurface.primaryOpenPoint).not.toBe(MANUAL_WORKSPACE_OPEN);
  });
});
