import { describe, expect, it } from 'vitest';

import { buildResumeActions } from '../../lib/maya-thread-digest';

describe('maya resume focus fallback to current-state observation', () => {
  it('falls back to current state for the resume action when focus is empty and current state remains distinct', () => {
    const actions = buildResumeActions({
      title: 'Checkout-Risiko sortieren',
      focus: '',
      currentState: 'Preisanker A ist eingegrenzt, aber die breitere Risikospur ist noch nicht aufgeloest.',
      openLoops: ['Das breitere Checkout-Risiko fuer Preisanker A spaeter separat pruefen.'],
      nextStep: 'Preisanker A als ersten Test gegen Checkout-Abbruchquote pruefen.',
      lastUpdatedAt: '2026-03-29T10:31:00.000Z',
      confidence: 'medium',
      source: 'digest'
    });

    expect(actions.map((action) => action.source)).toEqual(['next_step', 'open_loop', 'resume']);
    expect(actions[2]?.prompt).toContain('Preisanker A ist eingegrenzt, aber die breitere Risikospur ist noch nicht aufgeloest.');
  });
});
