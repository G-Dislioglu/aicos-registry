#!/usr/bin/env node
const EXPORT_REVIEW_STATUSES = ['blocked', 'needs_more_evidence', 'approved_for_export_review'];
const EXPORT_REVIEW_SCHEMA_VERSION = 'phase4e-export-review/v1';
const EXPORT_REVIEW_DERIVATION_VERSION = 'phase4e-export-review-read-model/v1';
const EXPORT_REVIEW_DERIVATION_RULE = 'latest_valid_export_review_wins';

function toArray(value) {
  if (!value) {
    return [];
  }
  return Array.isArray(value)
    ? value.map(item => String(item).trim()).filter(Boolean)
    : [String(value).trim()].filter(Boolean);
}

function createExportReviewId() {
  return `exprev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeExportReviewInput(input = {}) {
  return {
    export_review_id: String(input.export_review_id || input.exportReviewId || '').trim(),
    reviewed_at: input.reviewed_at || input.reviewedAt || new Date().toISOString(),
    export_review_rationale: String(input.export_review_rationale || input.exportReviewRationale || '').trim(),
    review_source: String(input.review_source || input.reviewSource || 'manual_export_review').trim() || 'manual_export_review',
    reviewer_mode: String(input.reviewer_mode || input.reviewerMode || 'human').trim() || 'human',
    proof_notes: toArray(input.proof_notes || input.proofNotes),
    gate_notes: toArray(input.gate_notes || input.gateNotes),
    export_review_status: String(input.export_review_status || input.exportReviewStatus || '').trim()
  };
}

function deriveExportReviewStatus(exportReadinessStatus) {
  if (exportReadinessStatus === 'ready_for_export_review') {
    return 'approved_for_export_review';
  }
  if (exportReadinessStatus === 'needs_more_evidence') {
    return 'needs_more_evidence';
  }
  return 'blocked';
}

function sortExportReviewRecords(records = []) {
  return [...records].sort((left, right) => {
    const leftTime = new Date(left.reviewed_at || 0).getTime();
    const rightTime = new Date(right.reviewed_at || 0).getTime();
    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }
    return String(left.export_review_id || '').localeCompare(String(right.export_review_id || ''));
  });
}

function isValidExportReviewStatus(value) {
  return EXPORT_REVIEW_STATUSES.includes(value);
}

function buildExportReviewStatusCounts(records = []) {
  return EXPORT_REVIEW_STATUSES.reduce((acc, status) => {
    acc[status] = records.filter(record => record.export_review_status === status).length;
    return acc;
  }, {});
}

function deriveCandidateExportReviewState(records = []) {
  const sortedRecords = sortExportReviewRecords(records);
  const validRecords = sortedRecords.filter(record => isValidExportReviewStatus(record.export_review_status));
  const latestReview = validRecords.length > 0 ? validRecords[validRecords.length - 1] : null;
  const currentStatus = latestReview ? latestReview.export_review_status : null;
  return {
    derivation_version: EXPORT_REVIEW_DERIVATION_VERSION,
    derivation_rule: EXPORT_REVIEW_DERIVATION_RULE,
    export_review_count: sortedRecords.length,
    valid_export_review_count: validRecords.length,
    invalid_export_review_count: sortedRecords.length - validRecords.length,
    current_export_review_status: currentStatus,
    latest_export_review_id: latestReview ? latestReview.export_review_id : null,
    latest_reviewed_at: latestReview ? latestReview.reviewed_at : null,
    review_source: latestReview ? latestReview.review_source : null,
    reviewer_mode: latestReview ? latestReview.reviewer_mode : null,
    registry_mutation: latestReview ? latestReview.audit_meta.registry_mutation : false,
    export_executed: latestReview ? latestReview.audit_meta.export_executed : false,
    status_counts: buildExportReviewStatusCounts(validRecords),
    status_history: validRecords.map(record => ({
      export_review_id: record.export_review_id,
      export_review_status: record.export_review_status,
      reviewed_at: record.reviewed_at
    }))
  };
}

function createExportReviewRecord(candidate, normalizedInput, exportReadiness) {
  const derivedStatus = deriveExportReviewStatus(exportReadiness.export_readiness_status);
  if (normalizedInput.export_review_status && normalizedInput.export_review_status !== derivedStatus) {
    const error = new Error(`Export review status must match candidate readiness: expected ${derivedStatus}, received ${normalizedInput.export_review_status}`);
    error.code = 'invalid_export_review_status';
    error.expected_status = derivedStatus;
    throw error;
  }
  return {
    schema_version: EXPORT_REVIEW_SCHEMA_VERSION,
    export_review_id: normalizedInput.export_review_id || createExportReviewId(),
    candidate_id: candidate.candidate_id,
    source_run_id: candidate.source_run_id,
    reviewed_at: normalizedInput.reviewed_at,
    export_review_status: derivedStatus,
    export_review_rationale: normalizedInput.export_review_rationale,
    review_source: normalizedInput.review_source,
    reviewer_mode: normalizedInput.reviewer_mode,
    proof_notes: normalizedInput.proof_notes,
    gate_notes: normalizedInput.gate_notes,
    audit_meta: {
      source_surface: 'arena-lib',
      export_review_origin: 'phase4e_export_review_gate',
      export_review_model_version: EXPORT_REVIEW_DERIVATION_VERSION,
      export_review_rule: EXPORT_REVIEW_DERIVATION_RULE,
      candidate_file_status: candidate.status,
      current_runtime_status: candidate.current_status,
      export_readiness_status: exportReadiness.export_readiness_status,
      export_blockers: exportReadiness.export_blockers,
      registry_mutation: false,
      export_executed: false,
      proposal_only_candidate: candidate.status === 'proposal_only'
    }
  };
}

module.exports = {
  EXPORT_REVIEW_DERIVATION_RULE,
  EXPORT_REVIEW_DERIVATION_VERSION,
  EXPORT_REVIEW_SCHEMA_VERSION,
  EXPORT_REVIEW_STATUSES,
  createExportReviewRecord,
  deriveCandidateExportReviewState,
  deriveExportReviewStatus,
  isValidExportReviewStatus,
  normalizeExportReviewInput,
  sortExportReviewRecords
};
