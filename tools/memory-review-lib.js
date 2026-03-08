#!/usr/bin/env node
function toArray(value) {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

const MEMORY_CANDIDATE_REVIEW_STATUSES = ['proposal_only', 'reviewed', 'accepted', 'rejected'];
const REVIEW_DECISION_STATUSES = MEMORY_CANDIDATE_REVIEW_STATUSES.filter(status => status !== 'proposal_only');
const TERMINAL_REVIEW_DECISION_STATUSES = ['accepted', 'rejected'];
const REVIEWABLE_CANDIDATE_STATUSES = ['proposal_only', 'reviewed'];
const REVIEW_STATE_DERIVATION_VERSION = 'phase4c-memory-review-read-model/v1';
const REVIEW_STATE_DERIVATION_RULE = 'latest_valid_review_wins';

function createReviewId() {
  return `memreview-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeReviewInput(input = {}) {
  return {
    review_status: String(input.review_status || input.reviewStatus || '').trim(),
    review_rationale: String(input.review_rationale || input.reviewRationale || '').trim(),
    review_source: String(input.review_source || input.reviewSource || 'manual').trim() || 'manual',
    reviewer_mode: String(input.reviewer_mode || input.reviewerMode || 'human').trim() || 'human',
    confidence: String(input.confidence || '').trim(),
    notes: toArray(input.review_notes || input.reviewNotes || input.notes)
  };
}

function isValidReviewDecisionStatus(value) {
  return REVIEW_DECISION_STATUSES.includes(value);
}

function isTerminalReviewDecisionStatus(value) {
  return TERMINAL_REVIEW_DECISION_STATUSES.includes(value);
}

function isReviewableCandidateStatus(value) {
  return REVIEWABLE_CANDIDATE_STATUSES.includes(value);
}

function sortReviewRecords(records = []) {
  return [...records].sort((left, right) => {
    if (left.reviewed_at === right.reviewed_at) {
      return left.review_id.localeCompare(right.review_id);
    }
    return left.reviewed_at.localeCompare(right.reviewed_at);
  });
}

function getLatestReviewRecord(records = []) {
  const sorted = sortReviewRecords(records);
  return sorted.length > 0 ? sorted[sorted.length - 1] : null;
}

function buildReviewStatusCounts(records = []) {
  return MEMORY_CANDIDATE_REVIEW_STATUSES.reduce((acc, status) => {
    acc[status] = records.filter(record => record.review_status === status).length;
    return acc;
  }, {});
}

function deriveCandidateReviewState(records = []) {
  const sortedRecords = sortReviewRecords(records);
  const validReviewRecords = sortedRecords.filter(record => isValidReviewDecisionStatus(record.review_status));
  const latestReview = validReviewRecords.length > 0 ? validReviewRecords[validReviewRecords.length - 1] : null;
  const currentStatus = latestReview ? latestReview.review_status : 'proposal_only';
  return {
    derivation_version: REVIEW_STATE_DERIVATION_VERSION,
    derivation_rule: REVIEW_STATE_DERIVATION_RULE,
    review_count: sortedRecords.length,
    valid_review_count: validReviewRecords.length,
    invalid_review_count: sortedRecords.length - validReviewRecords.length,
    current_status: currentStatus,
    latest_review_id: latestReview ? latestReview.review_id : null,
    latest_reviewed_at: latestReview ? latestReview.reviewed_at : null,
    review_source: latestReview ? latestReview.review_source : null,
    reviewer_mode: latestReview ? latestReview.reviewer_mode : null,
    registry_mutation: latestReview ? latestReview.audit_meta.registry_mutation : false,
    promotion_executed: latestReview ? latestReview.audit_meta.promotion_executed : false,
    terminal: isTerminalReviewDecisionStatus(currentStatus),
    reviewable: isReviewableCandidateStatus(currentStatus),
    status_counts: buildReviewStatusCounts(validReviewRecords),
    status_history: validReviewRecords.map(record => ({
      review_id: record.review_id,
      review_status: record.review_status,
      reviewed_at: record.reviewed_at
    }))
  };
}

function getCurrentCandidateStatus(records = []) {
  return deriveCandidateReviewState(records).current_status;
}

function createReviewRecord(candidate, normalizedReviewInput, previousStatus) {
  return {
    schema_version: 'phase4b-memory-review/v1',
    review_id: createReviewId(),
    candidate_id: candidate.candidate_id,
    source_run_id: candidate.source_run_id,
    reviewed_at: new Date().toISOString(),
    review_status: normalizedReviewInput.review_status,
    review_rationale: normalizedReviewInput.review_rationale,
    review_source: normalizedReviewInput.review_source,
    reviewer_mode: normalizedReviewInput.reviewer_mode,
    confidence: normalizedReviewInput.confidence || null,
    notes: normalizedReviewInput.notes,
    audit_meta: {
      source_surface: 'arena-lib',
      candidate_status_before: previousStatus,
      candidate_status_after: normalizedReviewInput.review_status,
      review_state_model_version: REVIEW_STATE_DERIVATION_VERSION,
      status_derivation_rule: REVIEW_STATE_DERIVATION_RULE,
      registry_mutation: false,
      promotion_executed: false,
      runtime_review_only: true,
      accepted_means_runtime_only: normalizedReviewInput.review_status === 'accepted',
      terminal_status_after_write: isTerminalReviewDecisionStatus(normalizedReviewInput.review_status)
    }
  };
}

module.exports = {
  MEMORY_CANDIDATE_REVIEW_STATUSES,
  REVIEW_DECISION_STATUSES,
  REVIEW_STATE_DERIVATION_RULE,
  REVIEW_STATE_DERIVATION_VERSION,
  REVIEWABLE_CANDIDATE_STATUSES,
  TERMINAL_REVIEW_DECISION_STATUSES,
  createReviewRecord,
  deriveCandidateReviewState,
  getCurrentCandidateStatus,
  getLatestReviewRecord,
  isReviewableCandidateStatus,
  isTerminalReviewDecisionStatus,
  isValidReviewDecisionStatus,
  normalizeReviewInput,
  sortReviewRecords
};
