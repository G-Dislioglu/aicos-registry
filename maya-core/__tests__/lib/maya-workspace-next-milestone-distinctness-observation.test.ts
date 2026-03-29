import { describe, expect, it } from 'vitest';

import {
  buildActiveCheckpointBoard,
  buildActiveThreadHandoff,
  buildActiveWorkrun,
  buildContinuityBriefing,
  buildDerivedWorkspaceContext,
  buildResumeActions
} from '../../lib/maya-thread-digest';
import { ChatSession } from '../../lib/types';

function makeDistinctWorkspaceSession(): ChatSession {
  return {
    id: 'thread-workspace-distinct',
    title: 'Activation priorisieren',
    intent: 'Option A als ersten Aktivierungstest festziehen.',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Option A scheint als erster Test sinnvoller.',
        timestamp: '10:00'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Der Vergleich ist abgeschlossen und Option A ist als erste Spur eingegrenzt.',
        timestamp: '10:01'
      }
    ],
    digest: {
      threadId: 'thread-workspace-distinct',
      title: 'Activation-Priorisierung abschließen',
      summary: 'Option A als ersten Aktivierungstest festziehen.',
      currentState: 'Vergleich abgeschlossen, Entscheidung auf Option A eingegrenzt.',
      openLoops: ['Stakeholder-Update vorbereiten.'],
      nextEntry: 'Testhypothese für Option A ausformulieren.',
      confidence: 'medium',
      updatedAt: '2026-03-28T10:01:00.000Z',
      sourceMessageCount: 2,
      needsRefresh: false
    },
    checkpointBoard: {
      title: 'Arbeitsboard',
      focus: 'Option A als ersten Aktivierungstest festziehen.',
      checkpoints: [
        {
          id: 'checkpoint-open-log',
          label: 'Experiment-Log ergänzen.',
          detail: null,
          status: 'open',
          source: 'manual',
          updatedAt: '2026-03-28T10:01:00.000Z'
        }
      ],
      updatedAt: '2026-03-28T10:01:00.000Z',
      source: 'manual'
    },
    handoff: {
      status: 'active',
      achieved: 'Vergleich abgeschlossen und Option A als nächste Spur vorbereitet.',
      openItems: ['Stakeholder-Update vorbereiten.'],
      nextEntry: 'Testhypothese für Option A ausformulieren.',
      updatedAt: '2026-03-28T10:01:00.000Z',
      source: 'manual'
    },
    createdAt: '2026-03-28T09:58:00.000Z',
    updatedAt: '2026-03-28T10:01:00.000Z'
  };
}

function makeCollapsedWorkspaceSession(): ChatSession {
  return {
    id: 'thread-workspace-collapsed',
    title: 'Testhypothese für Option A ausformulieren',
    intent: 'Testhypothese für Option A ausformulieren.',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Testhypothese für Option A ausformulieren.',
        timestamp: '10:00'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Wir können direkt daran anknüpfen.',
        timestamp: '10:01'
      }
    ],
    digest: {
      threadId: 'thread-workspace-collapsed',
      title: 'Testhypothese für Option A ausformulieren',
      summary: 'Testhypothese für Option A ausformulieren.',
      currentState: 'Testhypothese für Option A ausformulieren.',
      openLoops: ['Testhypothese für Option A ausformulieren.'],
      nextEntry: 'Testhypothese für Option A ausformulieren.',
      confidence: 'medium',
      updatedAt: '2026-03-28T10:01:00.000Z',
      sourceMessageCount: 2,
      needsRefresh: false
    },
    checkpointBoard: {
      title: 'Arbeitsboard',
      focus: 'Testhypothese für Option A ausformulieren.',
      checkpoints: [
        {
          id: 'checkpoint-open-1',
          label: 'Testhypothese für Option A ausformulieren.',
          detail: null,
          status: 'open',
          source: 'manual',
          updatedAt: '2026-03-28T10:01:00.000Z'
        }
      ],
      updatedAt: '2026-03-28T10:01:00.000Z',
      source: 'manual'
    },
    handoff: {
      status: 'active',
      achieved: 'Testhypothese für Option A ausformulieren.',
      openItems: ['Testhypothese für Option A ausformulieren.'],
      nextEntry: 'Testhypothese für Option A ausformulieren.',
      updatedAt: '2026-03-28T10:01:00.000Z',
      source: 'manual'
    },
    createdAt: '2026-03-28T09:58:00.000Z',
    updatedAt: '2026-03-28T10:01:00.000Z'
  };
}

describe('maya workspace next-milestone distinctness observation', () => {
  it('keeps workspace goal, current state, next milestone, and open items semantically separated when thread truth is differentiated', () => {
    const session = makeDistinctWorkspaceSession();
    const briefing = buildContinuityBriefing(session);
    const actions = buildResumeActions(briefing);
    const workrun = buildActiveWorkrun(session, briefing, actions);
    const board = buildActiveCheckpointBoard(session, briefing, actions, workrun);
    const handoff = buildActiveThreadHandoff(session, briefing, workrun, board);
    const workspace = buildDerivedWorkspaceContext(session, undefined, briefing, workrun, board, handoff);

    expect(workspace).toBeDefined();
    expect(workspace?.goal).toBe('Activation-Priorisierung abschließen');
    expect(workspace?.currentState).toBe('Vergleich abgeschlossen und Option A als nächste Spur vorbereitet.');
    expect(workspace?.nextMilestone).toBe('Testhypothese für Option A ausformulieren.');
    expect(workspace?.openItems).toEqual([
      'Stakeholder-Update vorbereiten.',
      'Experiment-Log ergänzen.'
    ]);
    expect(workspace?.openItems).not.toContain(workspace?.nextMilestone || '');
    expect(workspace?.goal).not.toBe(workspace?.currentState);
    expect(workspace?.goal).not.toBe(workspace?.nextMilestone);
    expect(workspace?.currentState).not.toBe(workspace?.nextMilestone);
  });

  it('collapses repeated workspace signals into a small bounded set instead of multiplying milestone noise', () => {
    const session = makeCollapsedWorkspaceSession();
    const briefing = buildContinuityBriefing(session);
    const actions = buildResumeActions(briefing);
    const workrun = buildActiveWorkrun(session, briefing, actions);
    const board = buildActiveCheckpointBoard(session, briefing, actions, workrun);
    const handoff = buildActiveThreadHandoff(session, briefing, workrun, board);
    const workspace = buildDerivedWorkspaceContext(session, undefined, briefing, workrun, board, handoff);

    expect(workspace).toBeDefined();
    expect(workspace?.goal).toBe('Testhypothese für Option A ausformulieren');
    expect(workspace?.currentState).toBe('Testhypothese für Option A ausformulieren.');
    expect(workspace?.nextMilestone).toBe('Testhypothese für Option A ausformulieren.');
    expect(workspace?.openItems).toEqual([
      'Testhypothese für Option A ausformulieren.'
    ]);
  });
});
