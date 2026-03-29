import { describe, expect, it } from 'vitest';

import { buildResumeActions } from '../../lib/maya-thread-digest';

describe('maya resume start-state focus irrelevance observation', () => {
  it('does not let a distinct focus or currentState override the start-state hard stop while nextStep still equals the start-state instruction', () => {
    const actions = buildResumeActions({
      title: 'Neuer Maya-Thread',
      focus: 'Ein moeglicher Thread-Fokus ist schon angedeutet, aber noch nicht belastbar genug.',
      currentState: 'Der Zustand bleibt zu unscharf fuer eine echte Resume-Spur.',
      openLoops: ['Ein offener Punkt ist sichtbar, aber noch nicht tragfaehig operationalisiert.'],
      nextStep: 'Beschreibe kurz Ziel, Kontext oder Entscheidung, bei der Maya dich jetzt als Nächstes unterstützen soll.',
      lastUpdatedAt: '2026-03-29T10:42:00.000Z',
      confidence: 'pending',
      source: 'session'
    });

    expect(actions).toHaveLength(0);
  });
});
