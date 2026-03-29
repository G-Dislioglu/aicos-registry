import { describe, expect, it } from 'vitest';

import { buildResumeActions } from '../../lib/maya-thread-digest';

describe('maya resume collapse next-step observation', () => {
  it('collapses the resume action when focus repeats the next-step signal but keeps a distinct open-loop action', () => {
    const actions = buildResumeActions({
      title: 'Preisanker A priorisieren',
      focus: 'Preisanker A als ersten Test gegen Checkout-Abbruchquote pruefen.',
      currentState: 'Preisanker A ist als naechste Spur markiert.',
      openLoops: ['Das breitere Checkout-Risiko fuer Preisanker A spaeter separat pruefen.'],
      nextStep: 'Preisanker A als ersten Test gegen Checkout-Abbruchquote pruefen.',
      lastUpdatedAt: '2026-03-29T10:10:00.000Z',
      confidence: 'medium',
      source: 'digest'
    });

    expect(actions.map((action) => action.source)).toEqual(['next_step', 'open_loop']);
    expect(actions[0]?.prompt).toContain('Preisanker A als ersten Test gegen Checkout-Abbruchquote pruefen.');
    expect(actions[1]?.prompt).toContain('Das breitere Checkout-Risiko fuer Preisanker A spaeter separat pruefen.');
    expect(actions.find((action) => action.source === 'resume')).toBeUndefined();
  });
});
