#!/usr/bin/env node
function toArray(value) {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

const MEC_REVIEW_OUTCOMES = ['stabilize', 'reject'];
const TERMINAL_MEC_REVIEW_OUTCOMES = ['stabilize', 'reject'];
const REVIEWABLE_MEC_REVIEW_STATES = ['proposal_only'];
const MEC_REVIEW_STATE_DERIVATION_VERSION = 'phase3a-mec-review-read-model/v1';
const MEC_REVIEW_STATE_DERIVATION_RULE = 'latest_valid_review_wins';

function createMecReviewId() {
  return `mecreview-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeMecReviewInput(input = {}) {
  return {
    review_outcome: String(input.review_outcome || input.reviewOutcome || input.review_status || input.reviewStatus || '').trim(),
    review_rationale: String(input.review_rationale || input.reviewRationale || '').trim(),
    review_source: String(input.review_source || input.reviewSource || 'manual').trim() || 'manual',
    reviewer_mode: String(input.reviewer_mode || input.reviewerMode || 'human').trim() || 'human',
    confidence: String(input.confidence || '').trim(),
    notes: toArray(input.review_notes || input.reviewNotes || input.notes),
    rationale_snapshot: input.rationale_snapshot && typeof input.rationale_snapshot === 'object'
      ? { ...input.rationale_snapshot }
      : null
  };
}

function isValidMecReviewOutcome(value) {
  return MEC_REVIEW_OUTCOMES.includes(value);
}

function isTerminalMecReviewOutcome(value) {
  return TERMINAL_MEC_REVIEW_OUTCOMES.includes(value);
}

function isReviewableMecReviewState(value) {
  return REVIEWABLE_MEC_REVIEW_STATES.includes(value);
}

function sortMecReviewRecords(records = []) {
  return [...records].sort((left, right) => {
    if (left.reviewed_at === right.reviewed_at) {
      return left.review_id.localeCompare(right.review_id);
    }
    return left.reviewed_at.localeCompare(right.reviewed_at);
  });
}

function getLatestMecReviewRecord(records = []) {
  const sorted = sortMecReviewRecords(records);
  return sorted.length > 0 ? sorted[sorted.length - 1] : null;
}

function buildMecReviewOutcomeCounts(records = []) {
  return MEC_REVIEW_OUTCOMES.reduce((acc, outcome) => {
    acc[outcome] = records.filter(record => record.review_outcome === outcome).length;
    return acc;
  }, {});
}

function deriveMecCandidateReviewState(records = []) {
  const sortedRecords = sortMecReviewRecords(records);
  const validReviewRecords = sortedRecords.filter(record => isValidMecReviewOutcome(record.review_outcome));
  const latestReview = validReviewRecords.length > 0 ? validReviewRecords[validReviewRecords.length - 1] : null;
  const currentState = latestReview ? latestReview.review_outcome : 'proposal_only';
  return {
    derivation_version: MEC_REVIEW_STATE_DERIVATION_VERSION,
    derivation_rule: MEC_REVIEW_STATE_DERIVATION_RULE,
    review_count: sortedRecords.length,
    valid_review_count: validReviewRecords.length,
    invalid_review_count: sortedRecords.length - validReviewRecords.length,
    current_state: currentState,
    latest_review_id: latestReview ? latestReview.review_id : null,
    latest_reviewed_at: latestReview ? latestReview.reviewed_at : null,
    review_source: latestReview ? latestReview.review_source : null,
    reviewer_mode: latestReview ? latestReview.reviewer_mode : null,
    registry_mutation: latestReview ? latestReview.audit_meta.registry_mutation : false,
    promotion_executed: latestReview ? latestReview.audit_meta.promotion_executed : false,
    terminal: isTerminalMecReviewOutcome(currentState),
    reviewable: isReviewableMecReviewState(currentState),
    outcome_counts: buildMecReviewOutcomeCounts(validReviewRecords),
    outcome_history: validReviewRecords.map(record => ({
      review_id: record.review_id,
      review_outcome: record.review_outcome,
      reviewed_at: record.reviewed_at
    }))
  };
}

function getCurrentMecReviewState(records = []) {
  return deriveMecCandidateReviewState(records).current_state;
}

function createMecReviewRecord(candidate, normalizedReviewInput, previousState) {
  return {
    schema_version: 'phase3a-mec-review/v1',
    review_id: createMecReviewId(),
    candidate_id: candidate.id,
    candidate_type: candidate.candidate_type,
    source_event_ids: candidate.source_event_ids || [],
    source_card_ids: candidate.source_card_ids || [],
    reviewed_at: new Date().toISOString(),
    review_outcome: normalizedReviewInput.review_outcome,
    review_rationale: normalizedReviewInput.review_rationale,
    review_source: normalizedReviewInput.review_source,
    reviewer_mode: normalizedReviewInput.reviewer_mode,
    confidence: normalizedReviewInput.confidence || null,
    notes: normalizedReviewInput.notes,
    rationale_snapshot: normalizedReviewInput.rationale_snapshot,
    audit_meta: {
      source_surface: 'arena-lib',
      candidate_state_before: previousState,
      candidate_state_after: normalizedReviewInput.review_outcome,
      review_state_model_version: MEC_REVIEW_STATE_DERIVATION_VERSION,
      status_derivation_rule: MEC_REVIEW_STATE_DERIVATION_RULE,
      registry_mutation: false,
      promotion_executed: false,
      runtime_review_only: true,
      raw_candidate_artifact_rewritten: false,
      terminal_state_after_write: isTerminalMecReviewOutcome(normalizedReviewInput.review_outcome)
    }
  };
}

module.exports = {
  MEC_REVIEW_OUTCOMES,
  MEC_REVIEW_STATE_DERIVATION_RULE,
  MEC_REVIEW_STATE_DERIVATION_VERSION,
  REVIEWABLE_MEC_REVIEW_STATES,
  TERMINAL_MEC_REVIEW_OUTCOMES,
  createMecReviewRecord,
  deriveMecCandidateReviewState,
  getCurrentMecReviewState,
  getLatestMecReviewRecord,
  isReviewableMecReviewState,
  isTerminalMecReviewOutcome,
  isValidMecReviewOutcome,
  normalizeMecReviewInput,
  sortMecReviewRecords
};
