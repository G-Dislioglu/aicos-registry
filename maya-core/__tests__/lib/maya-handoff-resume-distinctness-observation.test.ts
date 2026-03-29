import { describe, expect, it } from 'vitest';

import {
  buildActiveCheckpointBoard,
  buildActiveThreadHandoff,
  buildActiveWorkrun,
  buildContinuityBriefing,
  buildResumeActions
} from '../../lib/maya-thread-digest';
import { ChatSession } from '../../lib/types';

function makeDistinctSignalsSession(): ChatSession {
  return {
    id: 'thread-distinct-signals',
    title: 'Option A priorisieren',
    intent: 'Option A als ersten Aktivierungstest festziehen.',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Option A wirkt stimmiger als Option B.',
        timestamp: '10:00'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Der Vergleich ist abgeschlossen und die Entscheidung ist vorbereitet.',
        timestamp: '10:01'
      }
    ],
    digest: {
      threadId: 'thread-distinct-signals',
      title: 'Option A priorisieren',
      summary: 'Option A als ersten Aktivierungstest festziehen.',
      currentState: 'Vergleich abgeschlossen und Entscheidung auf Option A eingegrenzt.',
      openLoops: ['Ergebnisse noch kurz im Experiment-Log dokumentieren.'],
      nextEntry: 'Die Testhypothese für Option A jetzt dokumentieren.',
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
          id: 'checkpoint-completed',
          label: 'Option A gegen Zielbild abgeglichen.',
          detail: null,
          status: 'completed',
          source: 'manual',
          updatedAt: '2026-03-28T10:01:00.000Z'
        },
        {
          id: 'checkpoint-open',
          label: 'Experiment-Log aktualisieren.',
          detail: null,
          status: 'open',
          source: 'manual',
          updatedAt: '2026-03-28T10:01:00.000Z'
        }
      ],
      updatedAt: '2026-03-28T10:01:00.000Z',
      source: 'manual'
    },
    createdAt: '2026-03-28T09:58:00.000Z',
    updatedAt: '2026-03-28T10:01:00.000Z'
  };
}

function makeCollapsedSignalsSession(): ChatSession {
  return {
    id: 'thread-collapsed-signals',
    title: 'Testhypothese dokumentieren',
    intent: 'Die Testhypothese für Option A jetzt dokumentieren.',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Die Testhypothese für Option A jetzt dokumentieren.',
        timestamp: '10:00'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Wir können damit weitermachen.',
        timestamp: '10:01'
      }
    ],
    digest: {
      threadId: 'thread-collapsed-signals',
      title: 'Testhypothese dokumentieren',
      summary: 'Die Testhypothese für Option A jetzt dokumentieren.',
      currentState: 'Die Testhypothese für Option A jetzt dokumentieren.',
      openLoops: ['Die Testhypothese für Option A jetzt dokumentieren.'],
      nextEntry: 'Die Testhypothese für Option A jetzt dokumentieren.',
      confidence: 'medium',
      updatedAt: '2026-03-28T10:01:00.000Z',
      sourceMessageCount: 2,
      needsRefresh: false
    },
    createdAt: '2026-03-28T09:58:00.000Z',
    updatedAt: '2026-03-28T10:01:00.000Z'
  };
}

describe('maya handoff resume distinctness observation', () => {
  it('keeps resume, handoff, and checkpoint-near signals semantically separated when the thread truth is differentiated', () => {
    const session = makeDistinctSignalsSession();
    const briefing = buildContinuityBriefing(session);
    const actions = buildResumeActions(briefing);
    const workrun = buildActiveWorkrun(session, briefing, actions);
    const board = buildActiveCheckpointBoard(session, briefing, actions, workrun);
    const handoff = buildActiveThreadHandoff(session, briefing, workrun, board);

    expect(actions.map((action) => action.source)).toEqual(['next_step', 'open_loop', 'resume']);
    expect(actions[0]?.prompt).toContain('Die Testhypothese für Option A jetzt dokumentieren.');
    expect(actions[1]?.prompt).toContain('Ergebnisse noch kurz im Experiment-Log dokumentieren.');
    expect(actions[2]?.prompt).toContain('Option A als ersten Aktivierungstest festziehen.');

    expect(board?.checkpoints.map((checkpoint) => checkpoint.label)).toEqual([
      'Option A gegen Zielbild abgeglichen.',
      'Experiment-Log aktualisieren.'
    ]);

    expect(handoff?.achieved).toContain('Der Vergleich ist abgeschlossen und die Entscheidung ist vorbereitet.');
    expect(handoff?.achieved).toContain('Option A gegen Zielbild abgeglichen.');
    expect(handoff?.openItems).toEqual([
      'Experiment-Log aktualisieren.',
      'Ergebnisse noch kurz im Experiment-Log dokumentieren.'
    ]);
    expect(handoff?.openItems).not.toContain(handoff?.nextEntry || '');
    expect(handoff?.nextEntry).toBe('Die Testhypothese für Option A jetzt dokumentieren.');
  });

  it('collapses repeated thread signals into a small bounded set instead of multiplying resume, board, and handoff noise', () => {
    const session = makeCollapsedSignalsSession();
    const briefing = buildContinuityBriefing(session);
    const actions = buildResumeActions(briefing);
    const workrun = buildActiveWorkrun(session, briefing, actions);
    const board = buildActiveCheckpointBoard(session, briefing, actions, workrun);
    const handoff = buildActiveThreadHandoff(session, briefing, workrun, board);

    expect(actions).toHaveLength(1);
    expect(actions[0]?.source).toBe('next_step');
    expect(board?.checkpoints.map((checkpoint) => checkpoint.label)).toEqual([
      'Die Testhypothese für Option A jetzt dokumentieren.'
    ]);
    expect(handoff?.openItems).toEqual([
      'Die Testhypothese für Option A jetzt dokumentieren.'
    ]);
    expect(handoff?.nextEntry).toBe('Die Testhypothese für Option A jetzt dokumentieren.');
  });
});
