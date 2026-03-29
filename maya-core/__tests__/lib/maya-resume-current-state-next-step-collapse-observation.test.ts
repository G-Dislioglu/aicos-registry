import { describe, expect, it } from 'vitest';

import { buildResumeActions } from '../../lib/maya-thread-digest';

describe('maya resume current-state next-step collapse observation', () => {
  it('collapses the resume action when current state repeats the next-step signal and no distinct focus remains', () => {
    const actions = buildResumeActions({
      title: 'Preisanker A priorisieren',
      focus: '',
      currentState: 'Preisanker A als ersten Test gegen Checkout-Abbruchquote pruefen.',
      openLoops: ['Das breitere Checkout-Risiko fuer Preisanker A spaeter separat pruefen.'],
      nextStep: 'Preisanker A als ersten Test gegen Checkout-Abbruchquote pruefen.',
      lastUpdatedAt: '2026-03-29T10:21:00.000Z',
      confidence: 'medium',
      source: 'digest'
    });

    expect(actions.map((action) => action.source)).toEqual(['next_step', 'open_loop']);
    expect(actions.find((action) => action.source === 'resume')).toBeUndefined();
  });
});
