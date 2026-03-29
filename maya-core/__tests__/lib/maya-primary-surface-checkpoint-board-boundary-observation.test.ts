import { describe, expect, it } from 'vitest';

import { buildContinuityBriefing, buildMayaMainSurfaceDerivation, buildResumeActions } from '../../lib/maya-thread-digest';
import { ChatSession } from '../../lib/types';

function makeCheckpointBoardBoundarySession(): ChatSession {
  return {
    id: 'thread-checkpoint-board-boundary',
    title: 'Option A weiterziehen',
    intent: 'Option A als aktive Arbeitsbahn weiterziehen.',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Option A bleibt die aktive Arbeitsbahn. Das Board soll nur noch die Dokumentation offenhalten.',
        timestamp: '10:00'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Gut, dann halten wir die laufende Arbeit auf Option A und lassen das Board nur die nachgelagerte Dokumentation tragen.',
        timestamp: '10:01'
      }
    ],
    digest: {
      threadId: 'thread-checkpoint-board-boundary',
      title: 'Option A weiterziehen',
      summary: 'Option A als aktive Arbeitsbahn weiterziehen.',
      currentState: 'Option A bleibt die laufende Arbeitsbahn.',
      openLoops: ['Dokumentation im Board noch ergänzen.'],
      nextEntry: 'Mit Option A im laufenden Experiment weitermachen.',
      confidence: 'medium',
      updatedAt: '2026-03-29T00:40:00.000Z',
      sourceMessageCount: 2,
      needsRefresh: false
    },
    workrun: {
      focus: 'Option A als aktive Arbeitsbahn weiterziehen.',
      status: 'open',
      lastOutput: 'Option A wurde als laufende Spur bestätigt.',
      lastStep: 'Option A gegen die Kernhypothese abgeglichen.',
      nextStep: 'Option A jetzt im Experiment weiter vertiefen.',
      updatedAt: '2026-03-29T00:41:00.000Z',
      source: 'manual'
    },
    checkpointBoard: {
      title: 'Arbeitsboard',
      focus: 'Dokumentation und Nachpflege im Blick behalten.',
      checkpoints: [
        {
          id: 'checkpoint-open-docs',
          label: 'Experiment-Log fuer Option A nachziehen.',
          detail: null,
          status: 'open',
          source: 'manual',
          updatedAt: '2026-03-29T00:42:00.000Z'
        }
      ],
      updatedAt: '2026-03-29T00:42:00.000Z',
      source: 'manual'
    },
    handoff: {
      status: 'active',
      achieved: 'Option A bleibt die aktive Spur, Dokumentation ist separat offen.',
      openItems: ['Team-Update fuer Option A vorbereiten.'],
      nextEntry: 'Mit Option A im laufenden Experiment weitermachen.',
      updatedAt: '2026-03-29T00:43:00.000Z',
      source: 'manual'
    },
    createdAt: '2026-03-29T00:39:00.000Z',
    updatedAt: '2026-03-29T00:43:00.000Z'
  };
}

describe('maya primary surface checkpoint board boundary observation', () => {
  it('keeps a manual checkpoint board on its own lane when workrun and handoff already own the primary and resume-near signals', () => {
    const session = makeCheckpointBoardBoundarySession();
    const briefing = buildContinuityBriefing(session);
    const actions = buildResumeActions(briefing);
    const surface = buildMayaMainSurfaceDerivation(session, undefined);

    expect(surface.board?.source).toBe('manual');
    expect(surface.board?.focus).toBe('Dokumentation und Nachpflege im Blick behalten.');
    expect(surface.board?.checkpoints.map((checkpoint) => checkpoint.label)).toEqual(['Experiment-Log fuer Option A nachziehen.']);

    expect(actions[0]?.source).toBe('next_step');
    expect(actions[0]?.prompt).toContain('Mit Option A im laufenden Experiment weitermachen.');
    expect(actions[0]?.prompt).not.toContain('Experiment-Log fuer Option A nachziehen.');

    expect(surface.workrun?.nextStep).toBe('Option A jetzt im Experiment weiter vertiefen.');
    expect(surface.handoff?.nextEntry).toBe('Mit Option A im laufenden Experiment weitermachen.');
    expect(surface.primaryNextStep).toBe(surface.workrun?.nextStep || null);
    expect(surface.primaryNextStep).not.toBe(surface.board?.checkpoints[0]?.label || null);
    expect(surface.primaryOpenPoint).toBe(surface.handoff?.openItems[0] || null);
    expect(surface.primaryOpenPoint).not.toBe(surface.board?.checkpoints[0]?.label || null);
  });
});
