import { describe, expect, it } from 'vitest';

import { buildResumeActions } from '../../lib/maya-thread-digest';

describe('maya resume focus fallback collapse observation', () => {
  it('does not fall through to current state when focus exists but already collapses against next-step or open-loop signals', () => {
    const actions = buildResumeActions({
      title: 'Checkout-Risiko sortieren',
      focus: 'Preisanker A als ersten Test gegen Checkout-Abbruchquote pruefen.',
      currentState: 'Preisanker A ist eingegrenzt, aber die breitere Risikospur ist noch nicht aufgeloest.',
      openLoops: ['Das breitere Checkout-Risiko fuer Preisanker A spaeter separat pruefen.'],
      nextStep: 'Preisanker A als ersten Test gegen Checkout-Abbruchquote pruefen.',
      lastUpdatedAt: '2026-03-29T10:32:00.000Z',
      confidence: 'medium',
      source: 'digest'
    });

    expect(actions.map((action) => action.source)).toEqual(['next_step', 'open_loop']);
    expect(actions.find((action) => action.source === 'resume')).toBeUndefined();
  });
});
