#!/usr/bin/env node
const EXPORT_READINESS_STATUSES = ['not_ready', 'needs_more_evidence', 'ready_for_export_review'];
const EXPORT_READINESS_VERSION = 'phase4d-export-readiness/v1';

function hasEvidenceGap(candidate = {}) {
  const tags = Array.isArray(candidate.tags) ? candidate.tags : [];
  return candidate.candidate_type === 'evidence_gap_followup' || tags.includes('evidence-gap');
}

function hasRuntimeBoundary(candidate = {}, reviewSummary = {}) {
  const candidateBoundary = candidate.promoted === false
    && candidate.audit_meta
    && candidate.audit_meta.registry_mutation === false;
  const reviewBoundary = reviewSummary.registry_mutation === false
    && reviewSummary.promotion_executed === false;
  return Boolean(candidateBoundary && reviewBoundary);
}

function buildExportBlockers(candidate = {}, reviewSummary = {}, signals = {}) {
  const blockers = [];
  if (!signals.has_boundary) {
    blockers.push('boundary_not_preserved');
  }
  if (!signals.has_review_record) {
    blockers.push('review_record_missing');
  }
  if (reviewSummary.current_status === 'rejected') {
    blockers.push('runtime_status_not_exportable');
  }
  if (reviewSummary.current_status !== 'accepted') {
    blockers.push('terminal_acceptance_missing');
  }
  if (signals.proof_readiness !== 'supported') {
    blockers.push('proof_readiness_incomplete');
  }
  if (signals.gate_readiness !== 'supported') {
    blockers.push('gate_readiness_incomplete');
  }
  if (signals.review_integrity !== 'consistent') {
    blockers.push('review_integrity_incomplete');
  }
  if (signals.contradiction_pressure === 'present') {
    blockers.push('contradiction_pressure_present');
  }
  if (signals.evidence_gap_present) {
    blockers.push('evidence_gap_present');
  }
  return Array.from(new Set(blockers));
}

function deriveExportReadiness(candidate = {}, reviewSummary = {}) {
  const statusCounts = reviewSummary.status_counts || {};
  const currentStatus = reviewSummary.current_status || 'proposal_only';
  const hasBoundary = hasRuntimeBoundary(candidate, reviewSummary);
  const hasReviewRecord = (reviewSummary.valid_review_count || reviewSummary.review_count || 0) > 0;
  const contradictionPressure = statusCounts.accepted > 0 && statusCounts.rejected > 0 ? 'present' : 'none';
  const evidenceGapPresent = hasEvidenceGap(candidate);
  const proofReadiness = currentStatus === 'accepted' && !evidenceGapPresent ? 'supported' : 'missing';
  const gateReadiness = hasBoundary && hasReviewRecord && currentStatus === 'accepted' ? 'supported' : 'missing';
  const reviewCoverage = currentStatus === 'accepted'
    ? 'terminal_accepted'
    : currentStatus === 'rejected'
      ? 'terminal_rejected'
      : hasReviewRecord
        ? 'non_terminal'
        : 'missing';
  const reviewIntegrity = contradictionPressure === 'none' ? 'consistent' : 'conflicted';
  const signals = {
    has_boundary: hasBoundary,
    has_review_record: hasReviewRecord,
    terminal_runtime_status: reviewSummary.terminal ? currentStatus : null,
    proof_readiness: proofReadiness,
    gate_readiness: gateReadiness,
    review_coverage: reviewCoverage,
    review_integrity: reviewIntegrity,
    contradiction_pressure: contradictionPressure,
    evidence_gap_present: evidenceGapPresent
  };
  const exportBlockers = buildExportBlockers(candidate, reviewSummary, signals);

  let exportReadinessStatus = 'not_ready';
  if (hasBoundary && hasReviewRecord && currentStatus === 'accepted') {
    exportReadinessStatus = exportBlockers.length === 0
      ? 'ready_for_export_review'
      : 'needs_more_evidence';
  }

  return {
    schema_version: EXPORT_READINESS_VERSION,
    export_evaluation_boundary: 'runtime_only_preparation',
    export_executed: false,
    registry_mutation: false,
    export_readiness_status: exportReadinessStatus,
    export_blockers: exportBlockers,
    ...signals
  };
}

module.exports = {
  EXPORT_READINESS_STATUSES,
  EXPORT_READINESS_VERSION,
  deriveExportReadiness
};
