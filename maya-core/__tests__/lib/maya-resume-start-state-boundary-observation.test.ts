import { describe, expect, it } from 'vitest';

import { buildResumeActions } from '../../lib/maya-thread-digest';

describe('maya resume start-state boundary observation', () => {
  it('starts emitting resume actions again as soon as nextStep leaves the start-state instruction, even if nearby guidance remains semantically similar', () => {
    const actions = buildResumeActions({
      title: 'Neuer Maya-Thread',
      focus: 'Anliegen fuer diesen Thread schaerfen',
      currentState: 'Es fehlt noch etwas mehr Konkretion fuer einen tragfaehigen Arbeitslauf.',
      openLoops: ['Es fehlt noch das konkrete Ziel oder die Entscheidung, auf die Maya den Arbeitslauf ausrichten soll.'],
      nextStep: 'Beschreibe jetzt kurz das konkrete Ziel, damit Maya den naechsten Arbeitsschritt sauber ausrichten kann.',
      lastUpdatedAt: '2026-03-29T10:41:00.000Z',
      confidence: 'pending',
      source: 'session'
    });

    expect(actions.map((action) => action.source)).toEqual(['next_step', 'open_loop', 'resume']);
    expect(actions[0]?.prompt).toContain('Beschreibe jetzt kurz das konkrete Ziel');
  });
});
