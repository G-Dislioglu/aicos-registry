import { describe, expect, it } from 'vitest';

import { normalizeMayaStore } from '../../lib/maya-store';

describe('normalizeMayaStore', () => {
  it('preserves multiple sessions and the active Maya thread selection', () => {
    const store = normalizeMayaStore({
      sessions: [
        {
          id: 'thread-a',
          title: 'Thread A',
          intent: 'Keep working',
          messages: [
            {
              id: 'msg-a1',
              role: 'assistant',
              content: 'Persist me',
              timestamp: '2026-03-19T18:00:00.000Z'
            }
          ],
          digest: {
            threadId: 'thread-a',
            title: 'Thread A',
            summary: 'Summary A',
            currentState: 'Open',
            openLoops: ['Loop A'],
            nextEntry: 'Resume A',
            confidence: 'medium',
            updatedAt: '2026-03-19T18:00:00.000Z',
            sourceMessageCount: 1,
            needsRefresh: false
          }
        },
        {
          id: 'thread-b',
          title: 'Thread B',
          intent: 'Resume later',
          messages: [
            {
              id: 'msg-b1',
              role: 'user',
              content: 'Second thread',
              timestamp: '2026-03-19T19:00:00.000Z'
            }
          ]
        }
      ],
      activeSessionId: 'thread-b'
    });

    expect(store.sessions).toHaveLength(2);
    expect(store.activeSessionId).toBe('thread-b');
    expect(store.sessions[0].digest?.summary).toBe('Summary A');
    expect(store.sessions[1].messages[0].content).toBe('Second thread');
  });

  it('falls back to the first available Maya thread when the requested active session is invalid', () => {
    const store = normalizeMayaStore({
      sessions: [
        {
          id: 'thread-main',
          title: 'Main thread',
          intent: '',
          messages: []
        },
        {
          id: 'thread-alt',
          title: 'Alt thread',
          intent: '',
          messages: []
        }
      ],
      activeSessionId: 'missing-thread'
    });

    expect(store.activeSessionId).toBe('thread-main');
  });

  it('preserves a persisted workrun on the matching thread', () => {
    const store = normalizeMayaStore({
      sessions: [
        {
          id: 'thread-a',
          title: 'Thread A',
          intent: 'Keep working',
          messages: [
            {
              id: 'msg-a1',
              role: 'assistant',
              content: 'Persist me',
              timestamp: '2026-03-19T18:00:00.000Z'
            }
          ],
          workrun: {
            focus: 'Option A testen',
            status: 'completed',
            lastOutput: 'Option A ist geprüft.',
            lastStep: 'Hypothese formulieren',
            nextStep: 'Ergebnisse festhalten',
            updatedAt: '2026-03-19T18:05:00.000Z',
            source: 'manual'
          }
        }
      ],
      activeSessionId: 'thread-a'
    });

    expect(store.sessions[0].workrun).toBeDefined();
    expect(store.sessions[0].workrun?.focus).toBe('Option A testen');
    expect(store.sessions[0].workrun?.status).toBe('completed');
    expect(store.sessions[0].workrun?.source).toBe('manual');
  });

  it('normalizes invalid persisted workrun values to a safe small shape', () => {
    const store = normalizeMayaStore({
      sessions: [
        {
          id: 'thread-a',
          title: 'Thread A',
          intent: 'Keep working',
          messages: [],
          workrun: {
            focus: 'Arbeitslauf prüfen',
            status: 'paused',
            lastOutput: 'Zwischenstand',
            nextStep: '',
            updatedAt: '',
            source: 'unknown'
          } as unknown as NonNullable<ReturnType<typeof normalizeMayaStore>['sessions'][number]['workrun']>
        }
      ]
    });

    expect(store.sessions[0].workrun).toBeDefined();
    expect(store.sessions[0].workrun?.status).toBe('open');
    expect(store.sessions[0].workrun?.nextStep).toBe('Arbeitslauf prüfen');
    expect(store.sessions[0].workrun?.source).toBe('derived');
  });

  it('preserves a persisted checkpoint board on the matching thread', () => {
    const store = normalizeMayaStore({
      sessions: [
        {
          id: 'thread-a',
          title: 'Thread A',
          intent: 'Keep working',
          messages: [],
          checkpointBoard: {
            title: 'Arbeitsboard',
            focus: 'Onboarding priorisieren',
            updatedAt: '2026-03-19T18:05:00.000Z',
            source: 'manual',
            checkpoints: [
              {
                id: 'checkpoint-a',
                label: 'Option A testen',
                detail: 'Aktivierungsziel zuerst prüfen',
                status: 'completed',
                source: 'manual',
                updatedAt: '2026-03-19T18:05:00.000Z'
              },
              {
                id: 'checkpoint-b',
                label: 'Option B vergleichen',
                detail: null,
                status: 'open',
                source: 'manual',
                updatedAt: '2026-03-19T18:06:00.000Z'
              }
            ]
          }
        }
      ],
      activeSessionId: 'thread-a'
    });

    expect(store.sessions[0].checkpointBoard).toBeDefined();
    expect(store.sessions[0].checkpointBoard?.source).toBe('manual');
    expect(store.sessions[0].checkpointBoard?.checkpoints).toHaveLength(2);
    expect(store.sessions[0].checkpointBoard?.checkpoints[0].status).toBe('completed');
  });

  it('normalizes invalid persisted checkpoint board values to a safe small shape', () => {
    const store = normalizeMayaStore({
      sessions: [
        {
          id: 'thread-a',
          title: 'Thread A',
          intent: 'Keep working',
          messages: [],
          checkpointBoard: {
            title: '',
            focus: 'Arbeitsboard prüfen',
            updatedAt: '',
            source: 'unknown',
            checkpoints: [
              {
                id: '',
                label: 'Checkpoint 1',
                detail: 42,
                status: 'paused',
                source: 'unknown',
                updatedAt: ''
              }
            ]
          } as unknown as NonNullable<ReturnType<typeof normalizeMayaStore>['sessions'][number]['checkpointBoard']>
        }
      ]
    });

    expect(store.sessions[0].checkpointBoard).toBeDefined();
    expect(store.sessions[0].checkpointBoard?.title).toBe('Arbeitsboard');
    expect(store.sessions[0].checkpointBoard?.source).toBe('derived');
    expect(store.sessions[0].checkpointBoard?.checkpoints[0].status).toBe('open');
    expect(store.sessions[0].checkpointBoard?.checkpoints[0].detail).toBeNull();
  });

  it('preserves a persisted handoff on the matching thread', () => {
    const store = normalizeMayaStore({
      sessions: [
        {
          id: 'thread-a',
          title: 'Thread A',
          intent: 'Keep working',
          messages: [],
          handoff: {
            status: 'paused',
            achieved: 'Option A wurde vorbereitet.',
            openItems: ['Option B vergleichen', 'Nächsten Test dokumentieren'],
            nextEntry: 'Mit dem Vergleich von Option B wieder einsteigen.',
            updatedAt: '2026-03-19T18:08:00.000Z',
            source: 'manual'
          }
        }
      ],
      activeSessionId: 'thread-a'
    });

    expect(store.sessions[0].handoff).toBeDefined();
    expect(store.sessions[0].handoff?.status).toBe('paused');
    expect(store.sessions[0].handoff?.openItems).toHaveLength(2);
    expect(store.sessions[0].handoff?.source).toBe('manual');
  });

  it('normalizes invalid persisted handoff values to a safe small shape', () => {
    const store = normalizeMayaStore({
      sessions: [
        {
          id: 'thread-a',
          title: 'Thread A',
          intent: 'Keep working',
          messages: [],
          handoff: {
            status: 'unknown',
            achieved: 42,
            openItems: ['Option B vergleichen', null, 7],
            nextEntry: '',
            updatedAt: '',
            source: 'unknown'
          } as unknown as NonNullable<ReturnType<typeof normalizeMayaStore>['sessions'][number]['handoff']>
        }
      ]
    });

    expect(store.sessions[0].handoff).toBeDefined();
    expect(store.sessions[0].handoff?.status).toBe('active');
    expect(store.sessions[0].handoff?.achieved).toBe('');
    expect(store.sessions[0].handoff?.openItems).toEqual(['Option B vergleichen']);
    expect(store.sessions[0].handoff?.source).toBe('derived');
  });

  it('preserves persisted workspaces and keeps thread assignments on matching sessions', () => {
    const store = normalizeMayaStore({
      workspaces: [
        {
          id: 'workspace-alpha',
          title: 'Projekt Alpha',
          focus: 'Arbeitsräume verdrahten',
          goal: 'Projektkontext über mehrere Threads sichtbar halten',
          currentState: 'Thread A und B arbeiten am gleichen Block.',
          openItems: ['Persistenz prüfen', 'UI verifizieren'],
          nextMilestone: 'Lokale Verifikation abschließen',
          threadIds: ['thread-a', 'thread-b'],
          updatedAt: '2026-03-20T12:00:00.000Z',
          source: 'manual',
          status: 'active'
        }
      ],
      sessions: [
        {
          id: 'thread-a',
          title: 'Thread A',
          intent: 'Workspace A fortsetzen',
          messages: [],
          workspaceId: 'workspace-alpha'
        },
        {
          id: 'thread-b',
          title: 'Thread B',
          intent: 'Workspace A zweiter Thread',
          messages: [],
          workspaceId: 'workspace-alpha'
        }
      ],
      activeSessionId: 'thread-b'
    });

    expect(store.workspaces).toHaveLength(1);
    expect(store.workspaces[0].id).toBe('workspace-alpha');
    expect(store.workspaces[0].threadIds).toEqual(['thread-a', 'thread-b']);
    expect(store.sessions[0].workspaceId).toBe('workspace-alpha');
    expect(store.sessions[1].workspaceId).toBe('workspace-alpha');
    expect(store.activeSessionId).toBe('thread-b');
  });

  it('preserves a valid persisted active workspace selection and falls back to the active thread workspace when needed', () => {
    const preserved = normalizeMayaStore({
      workspaces: [
        {
          id: 'workspace-alpha',
          title: 'Projekt Alpha',
          focus: 'Alpha Fokus',
          goal: 'Alpha Ziel',
          currentState: 'Alpha Stand',
          openItems: [],
          nextMilestone: 'Alpha weiterführen',
          threadIds: ['thread-a'],
          updatedAt: '2026-03-20T12:00:00.000Z',
          source: 'manual',
          status: 'active'
        },
        {
          id: 'workspace-beta',
          title: 'Projekt Beta',
          focus: 'Beta Fokus',
          goal: 'Beta Ziel',
          currentState: 'Beta Stand',
          openItems: [],
          nextMilestone: 'Beta weiterführen',
          threadIds: ['thread-b'],
          updatedAt: '2026-03-20T12:05:00.000Z',
          source: 'manual',
          status: 'active'
        }
      ],
      sessions: [
        {
          id: 'thread-a',
          title: 'Thread A',
          intent: 'Workspace A fortsetzen',
          messages: [],
          workspaceId: 'workspace-alpha'
        },
        {
          id: 'thread-b',
          title: 'Thread B',
          intent: 'Workspace B fortsetzen',
          messages: [],
          workspaceId: 'workspace-beta'
        }
      ],
      activeSessionId: 'thread-a',
      activeWorkspaceId: 'workspace-beta'
    });

    const fallback = normalizeMayaStore({
      workspaces: [
        {
          id: 'workspace-alpha',
          title: 'Projekt Alpha',
          focus: 'Alpha Fokus',
          goal: 'Alpha Ziel',
          currentState: 'Alpha Stand',
          openItems: [],
          nextMilestone: 'Alpha weiterführen',
          threadIds: ['thread-a'],
          updatedAt: '2026-03-20T12:00:00.000Z',
          source: 'manual',
          status: 'active'
        }
      ],
      sessions: [
        {
          id: 'thread-a',
          title: 'Thread A',
          intent: 'Workspace A fortsetzen',
          messages: [],
          workspaceId: 'workspace-alpha'
        }
      ],
      activeSessionId: 'thread-a',
      activeWorkspaceId: 'missing-workspace'
    });

    expect(preserved.activeWorkspaceId).toBe('workspace-beta');
    expect(fallback.activeWorkspaceId).toBe('workspace-alpha');
  });

  it('normalizes invalid workspace values and drops dangling workspace references', () => {
    const store = normalizeMayaStore({
      workspaces: [
        {
          id: '',
          title: '',
          focus: 'Projektkontext prüfen',
          goal: 42,
          currentState: '',
          openItems: ['Offenen Punkt behalten', null, 7],
          nextMilestone: '',
          threadIds: ['thread-a', 'missing-thread'],
          updatedAt: '',
          source: 'unknown',
          status: 'unknown'
        } as unknown as NonNullable<ReturnType<typeof normalizeMayaStore>['workspaces'][number]>
      ],
      sessions: [
        {
          id: 'thread-a',
          title: 'Thread A',
          intent: 'Workspace prüfen',
          messages: [],
          workspaceId: 'workspace-1'
        },
        {
          id: 'thread-b',
          title: 'Thread B',
          intent: 'Fremde Referenz',
          messages: [],
          workspaceId: 'missing-workspace'
        }
      ]
    });

    expect(store.workspaces).toHaveLength(1);
    expect(store.workspaces[0].id).toBe('workspace-1');
    expect(store.workspaces[0].title).toBe('Projektkontext prüfen');
    expect(store.workspaces[0].goal).toBe('Projektkontext prüfen');
    expect(store.workspaces[0].openItems).toEqual(['Offenen Punkt behalten']);
    expect(store.workspaces[0].threadIds).toEqual(['thread-a']);
    expect(store.workspaces[0].status).toBe('active');
    expect(store.workspaces[0].source).toBe('derived');
    expect(store.sessions[0].workspaceId).toBe('workspace-1');
    expect(store.sessions[1].workspaceId).toBeNull();
  });
});
