import { describe, expect, it } from 'vitest';

import { buildResumeActions } from '../../lib/maya-thread-digest';

describe('maya resume collapse open-loop observation', () => {
  it('collapses the resume action when focus repeats the open-loop signal and only the open loop remains distinct from the next step', () => {
    const actions = buildResumeActions({
      title: 'Checkout-Risiko sortieren',
      focus: 'Das breitere Checkout-Risiko fuer Preisanker A spaeter separat pruefen.',
      currentState: 'Die breitere Risikospur bleibt offen.',
      openLoops: ['Das breitere Checkout-Risiko fuer Preisanker A spaeter separat pruefen.'],
      nextStep: 'Preisanker A als ersten Test gegen Checkout-Abbruchquote pruefen.',
      lastUpdatedAt: '2026-03-29T10:11:00.000Z',
      confidence: 'medium',
      source: 'digest'
    });

    expect(actions.map((action) => action.source)).toEqual(['next_step', 'open_loop']);
    expect(actions[0]?.prompt).toContain('Preisanker A als ersten Test gegen Checkout-Abbruchquote pruefen.');
    expect(actions[1]?.prompt).toContain('Das breitere Checkout-Risiko fuer Preisanker A spaeter separat pruefen.');
    expect(actions.find((action) => action.source === 'resume')).toBeUndefined();
  });
});
