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
    id: 'thread-low-activity-persisted-partial-update-assisted',
    title: '',
    intent: '',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: THREAD_FOCUS,
        timestamp: '20:00'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: ACTION_LINE,
        timestamp: '20:01'
      }
    ],
    createdAt: '2026-03-28T20:00:00.000Z',
    updatedAt: '2026-03-28T20:01:00.000Z'
  };
}

describe('maya primary surface low-activity persisted partial update observation', () => {
  it('keeps the current next-step while a partial manual workrun update changes only focus', () => {
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

    expect(persistedWorkrun?.source).toBe('manual');
    expect(persistedWorkrun?.focus).toBe(MANUAL_WORKRUN_FOCUS);
    expect(persistedWorkrun?.nextStep).toBe(ACTION_LINE);
    expect(nextSurface.workrun?.source).toBe('manual');
    expect(nextSurface.primaryFocus).toBe(MANUAL_WORKRUN_FOCUS);
    expect(nextSurface.primaryNextStep).toBe(ACTION_LINE);
  });

  it('keeps the current re-entry while a partial manual handoff update changes only open-items', () => {
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

    expect(persistedHandoff?.source).toBe('manual');
    expect(persistedHandoff?.openItems[0]).toBe(MANUAL_HANDOFF_OPEN);
    expect(persistedHandoff?.nextEntry).toBe(ACTION_LINE);
    expect(nextSurface.handoff?.source).toBe('manual');
    expect(nextSurface.primaryNextStep).toBe(ACTION_LINE);
    expect(nextSurface.primaryOpenPoint).toBe(MANUAL_HANDOFF_OPEN);
  });

  it('keeps the current next-milestone while a partial manual workspace update changes only workspace open-items', () => {
    const session = makeAssistantShapedLowActivitySession();
    const initialSurface = buildMayaMainSurfaceDerivation(session, undefined);
    const persistedWorkspace = buildPersistedWorkspaceContext(session, initialSurface.workspace, {
      openItems: [MANUAL_WORKSPACE_OPEN],
      source: 'manual'
    });

    const nextSurface = buildMayaMainSurfaceDerivation(session, persistedWorkspace);

    expect(persistedWorkspace?.source).toBe('manual');
    expect(persistedWorkspace?.openItems[0]).toBe(MANUAL_WORKSPACE_OPEN);
    expect(persistedWorkspace?.nextMilestone).toBe(ACTION_LINE);
    expect(nextSurface.workspace?.source).toBe('manual');
    expect(nextSurface.workspace?.openItems[0]).toBe(MANUAL_WORKSPACE_OPEN);
    expect(nextSurface.workspace?.nextMilestone).toBe(ACTION_LINE);
    expect(nextSurface.primaryNextStep).toBe(ACTION_LINE);
    expect(nextSurface.primaryOpenPoint).toBe(ACTION_LINE);
  });
});
