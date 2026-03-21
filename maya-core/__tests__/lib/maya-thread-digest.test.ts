import { describe, expect, it } from 'vitest';

import { buildActiveCheckpointBoard, buildActiveThreadHandoff, buildActiveWorkrun, buildContinuityBriefing, buildDerivedWorkspaceContext, buildMayaMainSurfaceDerivation, buildPersistedCheckpointBoard, buildPersistedThreadHandoff, buildResumeActions, buildThreadDigest, shouldRefreshThreadDigest } from '@/lib/maya-thread-digest';
import { ChatSession } from '@/lib/types';

function makeSession(): ChatSession {
  return {
    id: 'thread-1',
    title: 'Onboarding Optionen',
    intent: 'Zwei Wege vergleichen und den nächsten Test festlegen.',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Ich habe zwei Optionen für das Onboarding und bin unsicher, was ich zuerst testen soll.',
        timestamp: '10:00'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Nenne mir die beiden Optionen kurz, dann priorisieren wir den ersten Test.',
        timestamp: '10:01'
      }
    ],
    createdAt: '2026-03-19T08:00:00.000Z',
    updatedAt: '2026-03-19T08:01:00.000Z'
  };
}

describe('maya thread digest', () => {
  it('builds a compact thread digest from a session', () => {
    const digest = buildThreadDigest(makeSession());

    expect(digest).toBeDefined();
    expect(digest?.threadId).toBe('thread-1');
    expect(digest?.title).toContain('Onboarding');
    expect(digest?.summary.length).toBeGreaterThan(0);
    expect(digest?.currentState).toContain('priorisieren');
    expect(digest?.openLoops.length).toBeGreaterThan(0);
    expect(digest?.nextEntry.length).toBeGreaterThan(0);
    expect(digest?.sourceMessageCount).toBe(2);
    expect(digest?.needsRefresh).toBe(false);
  });

  it('marks a digest stale when many new messages arrived since the last digest', () => {
    const session = makeSession();
    session.digest = {
      threadId: session.id,
      title: 'Onboarding Optionen',
      summary: 'Alter Digest',
      currentState: 'Alter Stand',
      openLoops: ['Optionen klären'],
      nextEntry: 'Mit den Optionen weitermachen.',
      confidence: 'medium',
      updatedAt: '2026-03-19T08:01:00.000Z',
      sourceMessageCount: 1,
      needsRefresh: false
    };

    session.messages = [
      ...session.messages,
      { id: 'm3', role: 'user', content: 'Option A ist schneller.', timestamp: '10:02' },
      { id: 'm4', role: 'assistant', content: 'Gut, und was ist Option B?', timestamp: '10:03' },
      { id: 'm5', role: 'user', content: 'Option B ist gründlicher.', timestamp: '10:04' },
      { id: 'm6', role: 'assistant', content: 'Welche Hypothese ist dir wichtiger?', timestamp: '10:05' },
      { id: 'm7', role: 'user', content: 'Ich will Aktivierung testen.', timestamp: '10:06' },
      { id: 'm8', role: 'assistant', content: 'Dann spricht mehr für A als ersten Test.', timestamp: '10:07' },
      { id: 'm9', role: 'user', content: 'Okay, dann starte ich damit.', timestamp: '10:08' }
    ];

    expect(shouldRefreshThreadDigest(session)).toBe(true);
  });

  it('builds a continuity briefing from an existing digest without creating a second truth', () => {
    const session = makeSession();
    session.digest = {
      threadId: session.id,
      title: 'Onboarding Optionen',
      summary: 'Wir klären gerade, welche Onboarding-Option zuerst getestet werden soll.',
      currentState: 'Option A wirkt als erster Aktivierungstest plausibel.',
      openLoops: ['Option B gegen Aktivierungsziel abgleichen'],
      nextEntry: 'Mit der Testhypothese für Option A weitermachen.',
      confidence: 'medium',
      updatedAt: '2026-03-19T08:01:00.000Z',
      sourceMessageCount: 2,
      needsRefresh: false
    };

    const briefing = buildContinuityBriefing(session);

    expect(briefing).toBeDefined();
    expect(briefing?.source).toBe('digest');
    expect(briefing?.focus).toContain('Onboarding-Option');
    expect(briefing?.openLoops[0]).toContain('Option B');
    expect(briefing?.nextStep).toContain('Option A');
  });

  it('falls back to session messages when no digest exists yet', () => {
    const briefing = buildContinuityBriefing(makeSession());

    expect(briefing).toBeDefined();
    expect(briefing?.source).toBe('session');
    expect(briefing?.confidence).toBe('pending');
    expect(briefing?.focus.length).toBeGreaterThan(0);
    expect(briefing?.currentState).toContain('priorisieren');
    expect(briefing?.nextStep.length).toBeGreaterThan(0);
  });

  it('builds resume actions that let Maya continue the active thread directly', () => {
    const session = makeSession();
    session.digest = {
      threadId: session.id,
      title: 'Onboarding Optionen',
      summary: 'Wir klären gerade, welche Onboarding-Option zuerst getestet werden soll.',
      currentState: 'Option A wirkt als erster Aktivierungstest plausibel.',
      openLoops: ['Option B gegen Aktivierungsziel abgleichen'],
      nextEntry: 'Mit der Testhypothese für Option A weitermachen.',
      confidence: 'medium',
      updatedAt: '2026-03-19T08:01:00.000Z',
      sourceMessageCount: 2,
      needsRefresh: false
    };

    const actions = buildResumeActions(buildContinuityBriefing(session));

    expect(actions).toHaveLength(3);
    expect(actions[0].source).toBe('next_step');
    expect(actions[0].emphasis).toBe('primary');
    expect(actions[0].prompt).toContain('Option A');
    expect(actions[1].source).toBe('open_loop');
    expect(actions[1].prompt).toContain('Option B');
    expect(actions[2].source).toBe('resume');
  });

  it('builds an active workrun from briefing, resume actions, and the active thread', () => {
    const session = makeSession();
    session.digest = {
      threadId: session.id,
      title: 'Onboarding Optionen',
      summary: 'Wir klären gerade, welche Onboarding-Option zuerst getestet werden soll.',
      currentState: 'Option A wirkt als erster Aktivierungstest plausibel.',
      openLoops: ['Option B gegen Aktivierungsziel abgleichen'],
      nextEntry: 'Mit der Testhypothese für Option A weitermachen.',
      confidence: 'medium',
      updatedAt: '2026-03-19T08:01:00.000Z',
      sourceMessageCount: 2,
      needsRefresh: false
    };

    const briefing = buildContinuityBriefing(session);
    const actions = buildResumeActions(briefing);
    const workrun = buildActiveWorkrun(session, briefing, actions);

    expect(workrun).toBeDefined();
    expect(workrun?.focus).toContain('Onboarding-Option');
    expect(workrun?.status).toBe('open');
    expect(workrun?.lastOutput).toContain('priorisieren');
    expect(workrun?.nextStep).toContain('Option A');
  });

  it('marks the active workrun completed when the latest thread message closes the loop', () => {
    const session = makeSession();
    session.messages = [
      ...session.messages,
      {
        id: 'm3',
        role: 'assistant',
        content: 'Der Arbeitslauf ist jetzt abgeschlossen und die Entscheidung ist fertig.',
        timestamp: '10:02'
      }
    ];

    const briefing = buildContinuityBriefing(session);
    const actions = buildResumeActions(briefing);
    const workrun = buildActiveWorkrun(session, briefing, actions);

    expect(workrun).toBeDefined();
    expect(workrun?.status).toBe('completed');
    expect(workrun?.lastOutput).toContain('abgeschlossen');
  });

  it('builds a small checkpoint board from the same thread truth as workrun and briefing', () => {
    const session = makeSession();
    session.digest = {
      threadId: session.id,
      title: 'Onboarding Optionen',
      summary: 'Wir klären gerade, welche Onboarding-Option zuerst getestet werden soll.',
      currentState: 'Option A wirkt als erster Aktivierungstest plausibel.',
      openLoops: ['Option B gegen Aktivierungsziel abgleichen'],
      nextEntry: 'Mit der Testhypothese für Option A weitermachen.',
      confidence: 'medium',
      updatedAt: '2026-03-19T08:01:00.000Z',
      sourceMessageCount: 2,
      needsRefresh: false
    };

    const briefing = buildContinuityBriefing(session);
    const actions = buildResumeActions(briefing);
    const workrun = buildActiveWorkrun(session, briefing, actions);
    const board = buildActiveCheckpointBoard(session, briefing, actions, workrun);

    expect(board).toBeDefined();
    expect(board?.checkpoints.length).toBeGreaterThan(0);
    expect(board?.checkpoints.length).toBeLessThanOrEqual(4);
    expect(board?.openCount).toBe(board?.checkpoints.length);
    expect(board?.completedCount).toBe(0);
    expect(board?.progressPercent).toBe(0);
  });

  it('does not turn generic resume action labels into derived board checkpoints', () => {
    const session = makeSession();
    session.digest = {
      threadId: session.id,
      title: 'Onboarding Optionen',
      summary: 'Wir klären gerade, welche Onboarding-Option zuerst getestet werden soll.',
      currentState: 'Option A wirkt als erster Aktivierungstest plausibel.',
      openLoops: ['Option B gegen Aktivierungsziel abgleichen'],
      nextEntry: 'Mit der Testhypothese für Option A weitermachen.',
      confidence: 'medium',
      updatedAt: '2026-03-19T08:01:00.000Z',
      sourceMessageCount: 2,
      needsRefresh: false
    };

    const briefing = buildContinuityBriefing(session);
    const actions = buildResumeActions(briefing);
    const workrun = buildActiveWorkrun(session, briefing, actions);
    const board = buildActiveCheckpointBoard(session, briefing, actions, workrun);

    expect(board).toBeDefined();
    expect(board?.checkpoints.map((checkpoint) => checkpoint.label)).not.toContain('Nächsten Schritt übernehmen');
    expect(board?.checkpoints.map((checkpoint) => checkpoint.label)).not.toContain('Offenen Punkt weiterführen');
    expect(board?.checkpoints.map((checkpoint) => checkpoint.label)).not.toContain('Thread sinnvoll fortsetzen');
  });

  it('gives a weak early thread a differentiated start-state focus, next step, and open point without inflated guidance', () => {
    const session: ChatSession = {
      id: 'thread-early',
      title: 'Neuer Maya-Thread',
      intent: '',
      messages: [
        {
          id: 'm1',
          role: 'user',
          content: 'hallo Maya',
          timestamp: '10:00'
        },
        {
          id: 'm2',
          role: 'assistant',
          content: 'Hier ist die kürzeste nützliche Lesart: Ich brauche noch etwas mehr Konkretion, um dir wirklich gut zu helfen. Im Moment ist Maya der stärkste aktive Kontext.',
          timestamp: '10:01'
        }
      ],
      createdAt: '2026-03-21T08:00:00.000Z',
      updatedAt: '2026-03-21T08:01:00.000Z'
    };

    const digest = buildThreadDigest(session);
    const briefing = buildContinuityBriefing(session);
    const actions = buildResumeActions(briefing);
    const workrun = buildActiveWorkrun(session, briefing, actions);
    const board = buildActiveCheckpointBoard(session, briefing, actions, workrun);
    const handoff = buildActiveThreadHandoff(session, briefing, workrun, board);

    expect(digest?.summary).toContain('zu unscharf');
    expect(briefing?.focus).toBe('Anliegen für diesen Thread schärfen');
    expect(workrun?.focus).toBe('Anliegen für diesen Thread schärfen');
    expect(workrun?.nextStep).toContain('Beschreibe kurz Ziel, Kontext oder Entscheidung');
    expect(briefing?.openLoops).toEqual([
      'Es fehlt noch das konkrete Ziel oder die Entscheidung, auf die Maya den Arbeitslauf ausrichten soll.'
    ]);
    expect(actions).toHaveLength(0);
    expect(board?.checkpoints.length).toBeLessThanOrEqual(2);
    expect(board?.checkpoints.map((checkpoint) => checkpoint.label)).not.toContain('hallo Maya');
    expect(handoff?.openItems).toEqual([
      'Es fehlt noch das konkrete Ziel oder die Entscheidung, auf die Maya den Arbeitslauf ausrichten soll.'
    ]);
  });

  it('prefers early-thread derivation over stale persisted surfaces from an older workspace context', () => {
    const session: ChatSession = {
      id: 'thread-early-stale',
      title: 'Neuer Maya-Thread',
      intent: '',
      workspaceId: 'workspace-daily-assist',
      messages: [
        {
          id: 'm1',
          role: 'user',
          content: 'hallo Maya',
          timestamp: '10:00'
        },
        {
          id: 'm2',
          role: 'assistant',
          content: 'Hier ist die kürzeste nützliche Lesart: Ich brauche noch etwas mehr Konkretion, um dir wirklich gut zu helfen. Im Moment ist Maya der stärkste aktive Kontext.',
          timestamp: '10:01'
        }
      ],
      digest: {
        threadId: 'thread-older',
        title: 'Maya Fadenkompass',
        summary: 'Ich bin Maya. Ich helfe dir dabei, laufende Arbeit klarer zu sehen, relevanten Kontext nach vorne zu holen und offenen Druck in einen nächsten Schritt zu verwandeln.',
        currentState: 'Ich bin Maya. Ich helfe dir dabei, laufende Arbeit klarer zu sehen, relevanten Kontext nach vorne zu holen und offenen Druck in einen nächsten Schritt zu verwandeln.',
        openLoops: ['Ich bin Maya. Ich helfe dir dabei, laufende Arbeit klarer zu sehen, relevanten Kontext nach vorne zu holen und offenen Druck in einen nächsten Schritt zu verwandeln.'],
        nextEntry: 'Ich bin Maya. Ich helfe dir dabei, laufende Arbeit klarer zu sehen, relevanten Kontext nach vorne zu holen und offenen Druck in einen nächsten Schritt zu verwandeln.',
        confidence: 'low',
        updatedAt: '2026-03-21T07:00:00.000Z',
        sourceMessageCount: 1,
        needsRefresh: false
      },
      workrun: {
        focus: 'Ich bin Maya. Ich helfe dir dabei, laufende Arbeit klarer zu sehen, relevanten Kontext nach vorne zu holen und offenen Druck in einen nächsten Schritt zu verwandeln.',
        status: 'open',
        lastOutput: 'Ich bin Maya. Ich helfe dir dabei, laufende Arbeit klarer zu sehen, relevanten Kontext nach vorne zu holen und offenen Druck in einen nächsten Schritt zu verwandeln.',
        lastStep: null,
        nextStep: 'Ich bin Maya. Ich helfe dir dabei, laufende Arbeit klarer zu sehen, relevanten Kontext nach vorne zu holen und offenen Druck in einen nächsten Schritt zu verwandeln.',
        updatedAt: '2026-03-21T07:00:00.000Z',
        source: 'derived'
      },
      checkpointBoard: {
        title: 'Arbeitsboard',
        focus: 'Ich bin Maya. Ich helfe dir dabei, laufende Arbeit klarer zu sehen, relevanten Kontext nach vorne zu holen und offenen Druck in einen nächsten Schritt zu verwandeln.',
        checkpoints: [
          {
            id: 'checkpoint-old',
            label: 'Ich bin Maya. Ich helfe dir dabei, laufende Arbeit klarer zu sehen, relevanten Kontext nach vorne zu holen und offenen Druck in einen nächsten Schritt zu verwandeln.',
            detail: null,
            status: 'open',
            source: 'derived',
            updatedAt: '2026-03-21T07:00:00.000Z'
          }
        ],
        updatedAt: '2026-03-21T07:00:00.000Z',
        source: 'derived'
      },
      handoff: {
        status: 'active',
        achieved: 'Ich bin Maya. Ich helfe dir dabei, laufende Arbeit klarer zu sehen, relevanten Kontext nach vorne zu holen und offenen Druck in einen nächsten Schritt zu verwandeln.',
        openItems: ['Ich bin Maya. Ich helfe dir dabei, laufende Arbeit klarer zu sehen, relevanten Kontext nach vorne zu holen und offenen Druck in einen nächsten Schritt zu verwandeln.'],
        nextEntry: 'Ich bin Maya. Ich helfe dir dabei, laufende Arbeit klarer zu sehen, relevanten Kontext nach vorne zu holen und offenen Druck in einen nächsten Schritt zu verwandeln.',
        updatedAt: '2026-03-21T07:00:00.000Z',
        source: 'derived'
      },
      createdAt: '2026-03-21T08:00:00.000Z',
      updatedAt: '2026-03-21T08:01:00.000Z'
    };

    const persistedWorkspace = {
      id: 'workspace-daily-assist',
      title: 'Deine tägliche Assistenz',
      focus: 'Klären, verdichten und aktive Kontexte lesbar halten.',
      goal: 'Deine tägliche Assistenz',
      currentState: 'Ich bin Maya. Ich helfe dir dabei, laufende Arbeit klarer zu sehen, relevanten Kontext nach vorne zu holen und offenen Druck in einen nächsten Schritt zu verwandeln.',
      openItems: ['Klären, verdichten und aktive Kontexte lesbar halten.'],
      nextMilestone: 'Ich bin Maya. Ich helfe dir dabei, laufende Arbeit klarer zu sehen, relevanten Kontext nach vorne zu holen und offenen Druck in einen nächsten Schritt zu verwandeln.',
      threadIds: ['thread-older'],
      updatedAt: '2026-03-21T07:00:00.000Z',
      source: 'derived' as const,
      status: 'active' as const
    };

    const briefing = buildContinuityBriefing(session);
    const actions = buildResumeActions(briefing);
    const workrun = buildActiveWorkrun(session, briefing, actions);
    const board = buildActiveCheckpointBoard(session, briefing, actions, workrun);
    const handoff = buildActiveThreadHandoff(session, briefing, workrun, board);
    const workspace = buildDerivedWorkspaceContext(session, persistedWorkspace, briefing, workrun, board, handoff);

    expect(briefing?.focus).toBe('Anliegen für diesen Thread schärfen');
    expect(workrun?.focus).toBe('Anliegen für diesen Thread schärfen');
    expect(workrun?.nextStep).toContain('Beschreibe kurz Ziel, Kontext oder Entscheidung');
    expect(handoff?.openItems).toEqual([
      'Es fehlt noch das konkrete Ziel oder die Entscheidung, auf die Maya den Arbeitslauf ausrichten soll.'
    ]);
    expect(board?.checkpoints.map((checkpoint) => checkpoint.label)).not.toContain('Ich bin Maya. Ich helfe dir dabei, laufende Arbeit klarer zu sehen, relevanten Kontext nach vorne zu holen und offenen Druck in einen nächsten Schritt zu verwandeln.');
    expect(workspace?.title).toBe('Neuer Maya-Thread');
    expect(workspace?.focus).toBe('Anliegen für diesen Thread schärfen');
    expect(workspace?.goal).toBe('Arbeitsziel klären');
    expect(workspace?.nextMilestone).toContain('Beschreibe kurz Ziel, Kontext oder Entscheidung');
  });

  it('builds the maya main surface from one authoritative derivation path', () => {
    const session = makeSession();
    session.digest = {
      threadId: session.id,
      title: 'Onboarding Optionen',
      summary: 'Wir klären gerade, welche Onboarding-Option zuerst getestet werden soll.',
      currentState: 'Option A wirkt als erster Aktivierungstest plausibel.',
      openLoops: ['Option B gegen Aktivierungsziel abgleichen'],
      nextEntry: 'Mit der Testhypothese für Option A weitermachen.',
      confidence: 'medium',
      updatedAt: '2026-03-19T08:01:00.000Z',
      sourceMessageCount: 2,
      needsRefresh: false
    };

    const workspace = {
      id: 'workspace-1',
      title: 'Onboarding Priorisierung',
      focus: 'Onboarding sauber priorisieren',
      goal: 'Den ersten sinnvollen Test festziehen',
      currentState: 'Option A ist aktuell die führende Spur.',
      openItems: ['Option B gegen Aktivierungsziel abgleichen'],
      nextMilestone: 'Testhypothese für Option A schärfen',
      threadIds: [session.id],
      updatedAt: '2026-03-19T08:01:00.000Z',
      source: 'manual' as const,
      status: 'active' as const
    };

    const surface = buildMayaMainSurfaceDerivation(session, workspace);

    expect(surface.briefing?.focus).toContain('Onboarding-Option');
    expect(surface.workrun?.focus).toContain('Onboarding-Option');
    expect(surface.board?.focus).toContain('Onboarding-Option');
    expect(surface.handoff?.nextEntry).toContain('Option A');
    expect(surface.workspace?.goal).toContain('Den ersten sinnvollen Test');
    expect(surface.primaryFocus).toBe(surface.workrun?.focus || null);
    expect(surface.primaryNextStep).toBe(surface.workrun?.nextStep || null);
    expect(surface.primaryOpenPoint).toBe(surface.handoff?.openItems[0] || null);
  });

  it('prefers a persisted manual checkpoint board when present on the thread', () => {
    const session = makeSession();
    session.checkpointBoard = {
      title: 'Arbeitsboard',
      focus: 'Onboarding priorisieren',
      source: 'manual',
      updatedAt: '2026-03-19T08:02:00.000Z',
      checkpoints: [
        {
          id: 'checkpoint-a',
          label: 'Option A testen',
          detail: 'Aktivierungsziel zuerst prüfen',
          status: 'completed',
          source: 'manual',
          updatedAt: '2026-03-19T08:02:00.000Z'
        },
        {
          id: 'checkpoint-b',
          label: 'Option B vergleichen',
          detail: null,
          status: 'open',
          source: 'manual',
          updatedAt: '2026-03-19T08:02:30.000Z'
        }
      ]
    };

    const board = buildActiveCheckpointBoard(session, buildContinuityBriefing(session), buildResumeActions(buildContinuityBriefing(session)), buildActiveWorkrun(session, buildContinuityBriefing(session), buildResumeActions(buildContinuityBriefing(session))));

    expect(board).toBeDefined();
    expect(board?.source).toBe('manual');
    expect(board?.completedCount).toBe(1);
    expect(board?.openCount).toBe(1);
    expect(board?.progressPercent).toBe(50);
    expect(board?.checkpoints[0].label).toBe('Option A testen');
  });

  it('builds a persisted checkpoint board that keeps manual checkpoint state small and bounded', () => {
    const session = makeSession();
    const board = buildPersistedCheckpointBoard(session, undefined, {
      focus: 'Onboarding priorisieren',
      source: 'manual',
      checkpoints: [
        {
          id: 'checkpoint-a',
          label: 'Option A testen',
          detail: 'Aktivierungsziel zuerst prüfen',
          status: 'completed',
          source: 'manual',
          updatedAt: '2026-03-19T08:02:00.000Z'
        },
        {
          id: 'checkpoint-b',
          label: 'Option B vergleichen',
          detail: '',
          status: 'open',
          source: 'manual',
          updatedAt: '2026-03-19T08:02:30.000Z'
        }
      ]
    });

    expect(board).toBeDefined();
    expect(board?.source).toBe('manual');
    expect(board?.checkpoints).toHaveLength(2);
    expect(board?.checkpoints[0].status).toBe('completed');
    expect(board?.focus).toContain('Onboarding');
  });

  it('builds a compact handoff from the same thread truth as workrun and board', () => {
    const session = makeSession();
    session.digest = {
      threadId: session.id,
      title: 'Onboarding Optionen',
      summary: 'Wir klären gerade, welche Onboarding-Option zuerst getestet werden soll.',
      currentState: 'Option A wirkt als erster Aktivierungstest plausibel.',
      openLoops: ['Option B gegen Aktivierungsziel abgleichen'],
      nextEntry: 'Mit der Testhypothese für Option A weitermachen.',
      confidence: 'medium',
      updatedAt: '2026-03-19T08:01:00.000Z',
      sourceMessageCount: 2,
      needsRefresh: false
    };

    const briefing = buildContinuityBriefing(session);
    const actions = buildResumeActions(briefing);
    const workrun = buildActiveWorkrun(session, briefing, actions);
    const board = buildActiveCheckpointBoard(session, briefing, actions, workrun);
    const handoff = buildActiveThreadHandoff(session, briefing, workrun, board);

    expect(handoff).toBeDefined();
    expect(handoff?.status).toBe('active');
    expect(handoff?.openItems.length).toBeGreaterThan(0);
    expect(handoff?.nextEntry).toContain('Option A');
  });

  it('prefers a persisted paused handoff when present on the thread', () => {
    const session = makeSession();
    session.handoff = {
      status: 'paused',
      achieved: 'Hypothese für Option A vorbereitet.',
      openItems: ['Option B gegen Aktivierungsziel abgleichen'],
      nextEntry: 'Mit dem Vergleich von Option B wieder einsteigen.',
      updatedAt: '2026-03-19T08:03:00.000Z',
      source: 'manual'
    };

    const handoff = buildActiveThreadHandoff(
      session,
      buildContinuityBriefing(session),
      buildActiveWorkrun(session, buildContinuityBriefing(session), buildResumeActions(buildContinuityBriefing(session))),
      buildActiveCheckpointBoard(session, buildContinuityBriefing(session), buildResumeActions(buildContinuityBriefing(session)), buildActiveWorkrun(session, buildContinuityBriefing(session), buildResumeActions(buildContinuityBriefing(session))))
    );

    expect(handoff).toBeDefined();
    expect(handoff?.status).toBe('paused');
    expect(handoff?.source).toBe('manual');
    expect(handoff?.achieved).toContain('Hypothese');
    expect(handoff?.nextEntry).toContain('Option B');
  });

  it('builds a persisted handoff that keeps active paused and completed states small and bounded', () => {
    const session = makeSession();
    const handoff = buildPersistedThreadHandoff(session, undefined, {
      status: 'completed',
      achieved: 'Option A wurde entschieden und als erster Test festgelegt.',
      openItems: ['Ergebnisse dokumentieren', 'Team informieren'],
      nextEntry: 'Beim nächsten Mal mit der Ergebnisdokumentation starten.',
      source: 'manual'
    });

    expect(handoff).toBeDefined();
    expect(handoff?.status).toBe('completed');
    expect(handoff?.openItems).toHaveLength(2);
    expect(handoff?.nextEntry).toContain('Ergebnisdokumentation');
    expect(handoff?.source).toBe('manual');
  });
});
