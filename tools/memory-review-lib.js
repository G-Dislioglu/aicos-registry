#!/usr/bin/env node
function toArray(value) {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

const MEMORY_CANDIDATE_REVIEW_STATUSES = ['proposal_only', 'reviewed', 'accepted', 'rejected'];
const REVIEW_DECISION_STATUSES = MEMORY_CANDIDATE_REVIEW_STATUSES.filter(status => status !== 'proposal_only');

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

function getCurrentCandidateStatus(records = []) {
  const latest = getLatestReviewRecord(records);
  return latest ? latest.review_status : 'proposal_only';
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
      registry_mutation: false,
      promotion_executed: false,
      runtime_review_only: true,
      accepted_means_runtime_only: normalizedReviewInput.review_status === 'accepted'
    }
  };
}

module.exports = {
  MEMORY_CANDIDATE_REVIEW_STATUSES,
  REVIEW_DECISION_STATUSES,
  createReviewRecord,
  getCurrentCandidateStatus,
  getLatestReviewRecord,
  isValidReviewDecisionStatus,
  normalizeReviewInput,
  sortReviewRecords
};
