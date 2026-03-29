import { describe, expect, it } from 'vitest';

import { buildResumeActions } from '../../lib/maya-thread-digest';

describe('maya resume start-state hard-stop observation', () => {
  it('returns no resume actions when nextStep is the start-state instruction even if focus, current state, and open loop are populated', () => {
    const actions = buildResumeActions({
      title: 'Neuer Maya-Thread',
      focus: 'Anliegen fuer diesen Thread schaerfen',
      currentState: 'Es fehlt noch ein belastbarer Arbeitskontext.',
      openLoops: ['Es fehlt noch das konkrete Ziel oder die Entscheidung, auf die Maya den Arbeitslauf ausrichten soll.'],
      nextStep: 'Beschreibe kurz Ziel, Kontext oder Entscheidung, bei der Maya dich jetzt als Nächstes unterstützen soll.',
      lastUpdatedAt: '2026-03-29T10:40:00.000Z',
      confidence: 'pending',
      source: 'session'
    });

    expect(actions).toEqual([]);
  });
});
