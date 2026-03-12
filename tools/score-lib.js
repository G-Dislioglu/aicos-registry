#!/usr/bin/env node

const SCORE_PROFILE_VERSION = 'aicos-score/v1';
const SCORE_SUMMARY_VERSION = 'aicos-score-summary/v1';

function clampScore(value) {
  if (!Number.isFinite(value)) {
    return null;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function toScoreNumber(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? clampScore(numeric) : null;
}

function normalizeImpact(impact = null) {
  if (!impact || typeof impact !== 'object') {
    return null;
  }
  const normalized = {
    value: toScoreNumber(impact.value),
    risk: toScoreNumber(impact.risk),
    confidence: toScoreNumber(impact.confidence)
  };
  return normalized.value === null && normalized.risk === null && normalized.confidence === null
    ? null
    : normalized;
}

function hasCompleteImpact(impact = null) {
  return Boolean(
    impact
    && impact.value !== null
    && impact.risk !== null
    && impact.confidence !== null
  );
}

function buildScoreProfile(card = {}) {
  const impact = normalizeImpact(card.impact);
  return {
    schema_version: SCORE_PROFILE_VERSION,
    seed_status: !impact
      ? 'not_seeded'
      : hasCompleteImpact(impact)
        ? 'impact_seeded'
        : 'partial_impact_seeded',
    impact_seed: {
      value: impact ? impact.value : null,
      risk: impact ? impact.risk : null,
      confidence: impact ? impact.confidence : null
    },
    card_core: {
      evidence_strength: null,
      learning_value: null,
      salvage_potential: null,
      reuse_potential: null,
      drift_risk: null
    }
  };
}

function deriveScoreSummary(card = {}) {
  const impact = normalizeImpact(card.impact);
  if (!hasCompleteImpact(impact)) {
    return null;
  }
  const value = impact.value;
  const risk = impact.risk;
  const confidence = impact.confidence;
  const safety = 100 - risk;
  return {
    schema_version: SCORE_SUMMARY_VERSION,
    source: 'impact_seed_only',
    derivation_basis: ['impact.value', 'impact.risk', 'impact.confidence'],
    scan_score: clampScore((value * 0.45) + (confidence * 0.35) + (safety * 0.20)),
    trust_score: clampScore((confidence * 0.65) + (safety * 0.35)),
    learning_score: clampScore((value * 0.50) + (confidence * 0.25) + (safety * 0.25)),
    promotion_readiness: clampScore((confidence * 0.45) + (safety * 0.35) + (value * 0.20))
  };
}

module.exports = {
  SCORE_PROFILE_VERSION,
  SCORE_SUMMARY_VERSION,
  buildScoreProfile,
  clampScore,
  deriveScoreSummary,
  hasCompleteImpact,
  normalizeImpact
};
