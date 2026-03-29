import { describe, expect, it } from 'vitest';

import { buildBluepilotPlanningReview } from '../../lib/maya-bluepilot-review';
import { type MayaMainSurfaceDerivation } from '../../lib/maya-thread-digest';

function makeSurface(overrides: Partial<MayaMainSurfaceDerivation> = {}): MayaMainSurfaceDerivation {
  return {
    briefing: {
      title: 'Checkout-Risiko sortieren',
      focus: 'Preisanker A sauber gegen die breitere Risikospur einordnen.',
      currentState: 'Preisanker A ist eingegrenzt, aber die breitere Risikospur ist noch offen.',
      openLoops: ['Das breitere Checkout-Risiko separat prüfen.'],
      nextStep: 'Preisanker A als ersten Test gegen Checkout-Abbruchquote prüfen.',
      lastUpdatedAt: '2026-03-29T11:10:00.000Z',
      confidence: 'medium',
      source: 'digest'
    },
    resumeActions: [
      {
        id: 'resume-next-step',
        label: 'Nächsten Schritt übernehmen',
        prompt: 'Lass uns direkt damit weitermachen: Preisanker A als ersten Test gegen Checkout-Abbruchquote prüfen.',
        source: 'next_step',
        emphasis: 'primary'
      }
    ],
    workrun: undefined,
    board: undefined,
    handoff: undefined,
    workspace: undefined,
    primaryFocus: 'Preisanker A sauber gegen die breitere Risikospur einordnen.',
    primaryNextStep: 'Preisanker A als ersten Test gegen Checkout-Abbruchquote prüfen.',
    primaryOpenPoint: 'Das breitere Checkout-Risiko separat prüfen.',
    ...overrides
  };
}

describe('maya bluepilot planning review', () => {
  it('returns null when no usable surface signals are present', () => {
    const result = buildBluepilotPlanningReview({
      briefing: undefined,
      resumeActions: [],
      workrun: undefined,
      board: undefined,
      handoff: undefined,
      workspace: undefined,
      primaryFocus: null,
      primaryNextStep: null,
      primaryOpenPoint: null
    });

    expect(result).toBeNull();
  });

  it('recommends the current primary focus as the leading review anchor when usable signals exist', () => {
    const surface = makeSurface();

    const result = buildBluepilotPlanningReview(surface);

    expect(result).toEqual({
      recommendedFocus: 'Preisanker A sauber gegen die breitere Risikospur einordnen.',
      reviewRisk: 'Fokus und nächster Schritt laufen derzeit nicht vollständig auf dieselbe Spur; vor einem Build-Block zuerst die führende Bahn benennen.',
      suggestedNextReviewAngle: 'Prüfe die Trennung zwischen Re-Entry und offenem Punkt, bevor neue Planung darauf aufsetzt: Das breitere Checkout-Risiko separat prüfen.'
    });
    expect(surface.primaryFocus).toBe('Preisanker A sauber gegen die breitere Risikospur einordnen.');
    expect(surface.primaryNextStep).toBe('Preisanker A als ersten Test gegen Checkout-Abbruchquote prüfen.');
    expect(surface.primaryOpenPoint).toBe('Das breitere Checkout-Risiko separat prüfen.');
  });

  it('highlights an open-point review angle when no resume actions exist yet', () => {
    const result = buildBluepilotPlanningReview(
      makeSurface({
        resumeActions: []
      })
    );

    expect(result?.suggestedNextReviewAngle).toBe(
      'Prüfe zuerst, ob der offene Punkt bewusst sekundär bleiben soll oder ob er einen klareren Review-Anker braucht: Das breitere Checkout-Risiko separat prüfen.'
    );
  });

  it('falls back to a next-step review angle when open point and next step already align', () => {
    const result = buildBluepilotPlanningReview(
      makeSurface({
        primaryOpenPoint: 'Preisanker A als ersten Test gegen Checkout-Abbruchquote prüfen.'
      })
    );

    expect(result?.suggestedNextReviewAngle).toBe(
      'Prüfe, ob der nächste Schritt als kleinster belastbarer Review-Anker reicht: Preisanker A als ersten Test gegen Checkout-Abbruchquote prüfen.'
    );
  });
});
