import { describe, expect, it } from 'vitest';

import { buildResumeActions } from '../../lib/maya-thread-digest';

describe('maya resume current-state distinctness observation', () => {
  it('keeps a resume action when current state carries distinct thread value beyond next-step and open-loop signals', () => {
    const actions = buildResumeActions({
      title: 'Checkout-Risiko sortieren',
      focus: '',
      currentState: 'Der groessere Thread-Zustand bleibt: Preisanker A ist eingegrenzt, aber das Risiko ist noch nicht sauber bewertet.',
      openLoops: ['Das breitere Checkout-Risiko fuer Preisanker A spaeter separat pruefen.'],
      nextStep: 'Preisanker A als ersten Test gegen Checkout-Abbruchquote pruefen.',
      lastUpdatedAt: '2026-03-29T10:20:00.000Z',
      confidence: 'medium',
      source: 'digest'
    });

    expect(actions.map((action) => action.source)).toEqual(['next_step', 'open_loop', 'resume']);
    expect(actions[2]?.prompt).toContain('Preisanker A ist eingegrenzt, aber das Risiko ist noch nicht sauber bewertet.');
    expect(actions[2]?.prompt).not.toContain('Preisanker A als ersten Test gegen Checkout-Abbruchquote pruefen.');
    expect(actions[2]?.prompt).not.toContain('Das breitere Checkout-Risiko fuer Preisanker A spaeter separat pruefen.');
  });
});
