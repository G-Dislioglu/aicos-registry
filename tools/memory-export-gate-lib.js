#!/usr/bin/env node
const EXPORT_GATE_STATUSES = ['export_blocked', 'export_needs_human_decision', 'export_gate_passed_runtime'];
const EXPORT_GATE_DECISION_VERSION = 'phase4f-export-gate-decision/v1';

function dedupe(values = []) {
  return Array.from(new Set(values.filter(Boolean)));
}

function deriveExportGateDecision(candidate = {}, exportReadiness = {}, exportReviewSummary = {}) {
  const exportReadinessStatus = exportReadiness.export_readiness_status || 'not_ready';
  const exportReviewStatus = exportReviewSummary.current_export_review_status || null;
  const exportBlockers = Array.isArray(exportReadiness.export_blockers) ? exportReadiness.export_blockers : [];
  const hasBoundary = exportReadiness.has_boundary === true;
  const hasReviewRecord = exportReadiness.has_review_record === true;
  const reviewIntegrity = exportReadiness.review_integrity || 'unknown';
  const reviewCoverage = exportReadiness.review_coverage || 'missing';

  const reasons = [];
  const blockers = [...exportBlockers];
  let exportGateStatus = 'export_blocked';

  if (!hasBoundary) {
    blockers.push('boundary_not_preserved');
    reasons.push('Runtime boundary is not preserved.');
  }
  if (!hasReviewRecord) {
    blockers.push('review_record_missing');
    reasons.push('No runtime review record exists yet.');
  }
  if (reviewIntegrity !== 'consistent') {
    blockers.push('review_integrity_incomplete');
    reasons.push('Review integrity is not consistent.');
  }
  if (reviewCoverage === 'missing') {
    blockers.push('review_coverage_missing');
    reasons.push('Review coverage is missing.');
  }

  if (exportReadinessStatus === 'ready_for_export_review') {
    if (exportReviewStatus === 'approved_for_export_review' && blockers.length === 0) {
      exportGateStatus = 'export_gate_passed_runtime';
      reasons.push('Readiness and export-review status both support a runtime-only gate pass.');
    } else {
      exportGateStatus = 'export_needs_human_decision';
      if (!exportReviewStatus) {
        reasons.push('No formal export-review record exists yet.');
        blockers.push('export_review_missing');
      } else if (exportReviewStatus !== 'approved_for_export_review') {
        reasons.push(`Latest export-review status is ${exportReviewStatus}.`);
        blockers.push(`export_review_${exportReviewStatus}`);
      }
    }
  } else {
    exportGateStatus = 'export_blocked';
    reasons.push(`Export readiness is ${exportReadinessStatus}.`);
    if (exportReadinessStatus === 'needs_more_evidence') {
      blockers.push('export_readiness_needs_more_evidence');
    } else {
      blockers.push('export_readiness_not_ready');
    }
    if (exportReviewStatus) {
      reasons.push(`Latest export-review status is ${exportReviewStatus}.`);
    }
  }

  return {
    schema_version: EXPORT_GATE_DECISION_VERSION,
    runtime_only_gate: true,
    registry_mutation: false,
    export_executed: false,
    export_gate_status: exportGateStatus,
    export_gate_reasons: dedupe(reasons),
    export_gate_blockers: dedupe(blockers),
    gate_decision_summary: {
      candidate_id: candidate.candidate_id || null,
      export_readiness_status: exportReadinessStatus,
      current_export_review_status: exportReviewStatus,
      has_boundary: hasBoundary,
      has_review_record: hasReviewRecord,
      review_integrity: reviewIntegrity,
      review_coverage: reviewCoverage
    }
  };
}

module.exports = {
  EXPORT_GATE_DECISION_VERSION,
  EXPORT_GATE_STATUSES,
  deriveExportGateDecision
};
