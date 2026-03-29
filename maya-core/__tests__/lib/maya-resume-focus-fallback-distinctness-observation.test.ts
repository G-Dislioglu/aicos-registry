import { describe, expect, it } from 'vitest';

import { buildResumeActions } from '../../lib/maya-thread-digest';

describe('maya resume focus fallback distinctness observation', () => {
  it('prefers a distinct focus-based resume action over current-state wording when focus still carries the stronger thread lead', () => {
    const actions = buildResumeActions({
      title: 'Checkout-Risiko sortieren',
      focus: 'Das breitere Checkout-Risiko fuer Preisanker A sauber sortieren.',
      currentState: 'Preisanker A ist als erste Spur eingegrenzt.',
      openLoops: ['Das breitere Checkout-Risiko fuer Preisanker A spaeter separat pruefen.'],
      nextStep: 'Preisanker A als ersten Test gegen Checkout-Abbruchquote pruefen.',
      lastUpdatedAt: '2026-03-29T10:30:00.000Z',
      confidence: 'medium',
      source: 'digest'
    });

    expect(actions.map((action) => action.source)).toEqual(['next_step', 'open_loop', 'resume']);
    expect(actions[2]?.prompt).toContain('Das breitere Checkout-Risiko fuer Preisanker A sauber sortieren.');
    expect(actions[2]?.prompt).not.toContain('Preisanker A ist als erste Spur eingegrenzt.');
  });
});
