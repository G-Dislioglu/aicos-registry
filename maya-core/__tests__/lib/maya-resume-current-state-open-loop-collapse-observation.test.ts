import { describe, expect, it } from 'vitest';

import { buildResumeActions } from '../../lib/maya-thread-digest';

describe('maya resume current-state open-loop collapse observation', () => {
  it('collapses the resume action when current state repeats the open-loop signal and no distinct focus remains', () => {
    const actions = buildResumeActions({
      title: 'Checkout-Risiko offen halten',
      focus: '',
      currentState: 'Das breitere Checkout-Risiko fuer Preisanker A spaeter separat pruefen.',
      openLoops: ['Das breitere Checkout-Risiko fuer Preisanker A spaeter separat pruefen.'],
      nextStep: 'Preisanker A als ersten Test gegen Checkout-Abbruchquote pruefen.',
      lastUpdatedAt: '2026-03-29T10:22:00.000Z',
      confidence: 'medium',
      source: 'digest'
    });

    expect(actions.map((action) => action.source)).toEqual(['next_step', 'open_loop']);
    expect(actions.find((action) => action.source === 'resume')).toBeUndefined();
  });
});
