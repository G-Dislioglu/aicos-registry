import { type MayaMainSurfaceDerivation } from '@/lib/maya-thread-digest';

export type MayaBluepilotReview = {
  recommendedFocus: string | null;
  reviewRisk: string | null;
  suggestedNextReviewAngle: string | null;
};

function normalize(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed || null;
}

function normalizeKey(value: string | null | undefined) {
  const normalized = normalize(value);
  return normalized ? normalized.toLowerCase().replace(/[\s.!?,;:]+/g, ' ').trim() : null;
}

export function buildBluepilotPlanningReview(
  surface: MayaMainSurfaceDerivation | null | undefined
): MayaBluepilotReview | null {
  if (!surface) {
    return null;
  }

  const primaryFocus = normalize(surface.primaryFocus);
  const primaryNextStep = normalize(surface.primaryNextStep);
  const primaryOpenPoint = normalize(surface.primaryOpenPoint);
  const briefingFocus = normalize(surface.briefing?.focus);
  const briefingCurrentState = normalize(surface.briefing?.currentState);
  const reviewSources = [
    primaryFocus,
    primaryNextStep,
    primaryOpenPoint,
    briefingFocus,
    briefingCurrentState
  ].filter((value): value is string => Boolean(value));

  if (reviewSources.length === 0) {
    return null;
  }

  const recommendedFocus = primaryFocus || briefingFocus || briefingCurrentState || primaryNextStep || primaryOpenPoint;
  const focusKey = normalizeKey(primaryFocus || briefingFocus || briefingCurrentState);
  const nextStepKey = normalizeKey(primaryNextStep);
  const openPointKey = normalizeKey(primaryOpenPoint);

  const reviewRisk = focusKey && nextStepKey && focusKey !== nextStepKey
    ? 'Fokus und nächster Schritt laufen derzeit nicht vollständig auf dieselbe Spur; vor einem Build-Block zuerst die führende Bahn benennen.'
    : null;

  const suggestedNextReviewAngle = surface.resumeActions.length === 0 && primaryOpenPoint
    ? `Prüfe zuerst, ob der offene Punkt bewusst sekundär bleiben soll oder ob er einen klareren Review-Anker braucht: ${primaryOpenPoint}`
    : openPointKey && nextStepKey && openPointKey !== nextStepKey
      ? `Prüfe die Trennung zwischen Re-Entry und offenem Punkt, bevor neue Planung darauf aufsetzt: ${primaryOpenPoint}`
      : primaryNextStep
        ? `Prüfe, ob der nächste Schritt als kleinster belastbarer Review-Anker reicht: ${primaryNextStep}`
        : null;

  if (!recommendedFocus && !reviewRisk && !suggestedNextReviewAngle) {
    return null;
  }

  return {
    recommendedFocus,
    reviewRisk,
    suggestedNextReviewAngle
  };
}
