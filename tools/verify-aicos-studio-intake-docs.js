#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const REQUIRED_FILES = [
  path.join(ROOT_DIR, 'AICOS_STUDIO_INTAKE_CHARTER.md'),
  path.join(ROOT_DIR, 'AICOS_STUDIO_INTAKE_PACKET_SPEC.md'),
  path.join(ROOT_DIR, 'AICOS_STUDIO_EXAMPLE_PACKETS.md'),
  path.join(ROOT_DIR, 'AICOS_STUDIO_ROLE_PROMPT_CONTRACTS.md'),
  path.join(ROOT_DIR, 'AICOS_STUDIO_ROUTING_MATRIX.md'),
  path.join(ROOT_DIR, 'AICOS_STUDIO_REVIEW_TARGET_MAPPING.md'),
  path.join(ROOT_DIR, 'AICOS_STUDIO_ARTIFACT_TEMPLATES.md'),
  path.join(ROOT_DIR, 'AICOS_STUDIO_GATE_CHECKLISTS.md'),
  path.join(ROOT_DIR, 'AICOS_STUDIO_LIFECYCLE_STATE_MODEL.md'),
  path.join(ROOT_DIR, 'AICOS_STUDIO_REVIEW_PROCEDURE.md'),
  path.join(ROOT_DIR, 'AICOS_STUDIO_DECISION_CODES.md'),
  path.join(ROOT_DIR, 'AICOS_STUDIO_REVIEW_RECORD_SPEC.md'),
  path.join(ROOT_DIR, 'AICOS_STUDIO_GATE_REPORT_SPEC.md'),
  path.join(ROOT_DIR, 'AICOS_STUDIO_BUNDLE_SPEC.md'),
  path.join(ROOT_DIR, 'AICOS_STUDIO_MANIFEST_SPEC.md'),
  path.join(ROOT_DIR, 'AICOS_STUDIO_BUNDLE_REVIEW_CONTEXT.md'),
  path.join(ROOT_DIR, 'AICOS_STUDIO_TRACE_CONSISTENCY_RULES.md'),
  path.join(ROOT_DIR, 'tools', 'verify-aicos-studio-intake-docs.js')
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function verifyFilesExist() {
  for (const filePath of REQUIRED_FILES) {
    assert(fs.existsSync(filePath), `Missing studio intake file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyCharter() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'AICOS_STUDIO_INTAKE_CHARTER.md'), 'utf-8');
  for (const expected of [
    'AICOS Studio / Maya Council is proposal-only under this charter',
    'What Studio must not do',
    'Proposal vs truth boundary',
    '`moderator`',
    '`observer`',
    '`distillator`',
    'User gate is mandatory',
    'No auto-promotion path',
    'It may not silently become a second truth system'
  ]) {
    assert(content.includes(expected), `Expected studio charter text missing: ${expected}`);
  }
}

function verifyPacketSpec() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'AICOS_STUDIO_INTAKE_PACKET_SPEC.md'), 'utf-8');
  for (const expected of [
    'Conversation artifact',
    'Proposal artifact',
    'Registry truth',
    'Runtime review object',
    '`source_mode`',
    '`participants`',
    '`proposal_type`',
    '`claim_status`',
    '`evidence_status`',
    '`challenge_status`',
    '`drift_risk`',
    '`recommendation_scope`',
    '`promotion_state`',
    '`distilled_summary`',
    '`open_conflicts`',
    '`next_review_target`',
    'must not imply canon truth'
  ]) {
    assert(content.includes(expected), `Expected studio packet spec text missing: ${expected}`);
  }
}

function verifyExamplePackets() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'AICOS_STUDIO_EXAMPLE_PACKETS.md'), 'utf-8');
  for (const expected of [
    '## Example 1 — Idea-origin packet',
    '## Example 2 — Card-review packet',
    '## Example 3 — Situation-analysis packet',
    '## Example 4 — Contradiction/challenge packet',
    '`topic`',
    '`participants`',
    '`proposal_type`',
    '`claim_status`',
    '`evidence_status`',
    '`challenge_status`',
    '`drift_risk`',
    '`promotion_state`',
    '`distilled_summary`',
    '`open_conflicts`',
    '`next_review_target`'
  ]) {
    assert(content.includes(expected), `Expected studio example packet text missing: ${expected}`);
  }
}

function verifyRolePromptContracts() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'AICOS_STUDIO_ROLE_PROMPT_CONTRACTS.md'), 'utf-8');
  for (const expected of [
    '## Maya moderator contract',
    '## Maya observer contract',
    '## Maya distillator contract',
    '## External expert participant contract',
    '## Challenge participant contract',
    '### Allowed moves',
    '### Forbidden moves',
    '### Required outputs',
    '### Uncertainty behavior',
    '### No-truth-mutation rule',
    '### Proposal-only rule'
  ]) {
    assert(content.includes(expected), `Expected studio role contract text missing: ${expected}`);
  }
}

function verifyRoutingMatrix() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'AICOS_STUDIO_ROUTING_MATRIX.md'), 'utf-8');
  for (const expected of [
    '## Artifact classes',
    '### Conversation artifact',
    '### Studio intake packet',
    '### Proposal artifact',
    '### Handoff artifact',
    '### Reference artifact',
    '### Card candidate / review target',
    '### Runtime review object',
    '### Registry truth',
    '`allowed`',
    '`allowed with gate`',
    '`forbidden`',
    '### User gate',
    '### Evidence gate',
    '### Conflict visibility gate',
    '### No-silent-promotion gate',
    '### No-runtime-write gate',
    '### No-truth-mutation gate',
    '### Studio packet -> proposal artifact',
    '### Studio packet -> handoff artifact',
    '### Studio packet -> reference draft',
    '### Studio packet -> card review target',
    '### Studio packet -> runtime review object',
    '### Proposal artifact -> registry truth',
    '### Reference artifact -> registry truth',
    '### Handoff -> runtime review object',
    '### Any Studio output -> direct index/alias mutation'
  ]) {
    assert(content.includes(expected), `Expected studio routing matrix text missing: ${expected}`);
  }
}

function verifyReviewTargetMapping() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'AICOS_STUDIO_REVIEW_TARGET_MAPPING.md'), 'utf-8');
  for (const expected of [
    'proposal_type',
    'next_review_target',
    '`normal`',
    '`gated`',
    '`forbidden`',
    '### `idea_probe`',
    '### `card_review`',
    '### `situation_analysis`',
    '### `contradiction_packet`',
    '### User gate',
    '### Evidence gate',
    '### Conflict visibility gate',
    '### No-silent-promotion gate',
    '### No-runtime-write gate',
    '### No-truth-mutation gate'
  ]) {
    assert(content.includes(expected), `Expected studio review target mapping text missing: ${expected}`);
  }
}

function verifyArtifactTemplates() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'AICOS_STUDIO_ARTIFACT_TEMPLATES.md'), 'utf-8');
  for (const expected of [
    '## Template 1 — Conversation artifact',
    '## Template 2 — Proposal artifact',
    '## Template 3 — Handoff artifact',
    '## Template 4 — Reference artifact',
    '## Template 5 — Card review target artifact',
    '### Purpose',
    '### Required fields',
    '### Optional fields',
    '### Forbidden content',
    '### Truth/proposal status',
    '### Allowed next destinations',
    '### Forbidden destinations'
  ]) {
    assert(content.includes(expected), `Expected studio artifact template text missing: ${expected}`);
  }
}

function verifyGateChecklists() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'AICOS_STUDIO_GATE_CHECKLISTS.md'), 'utf-8');
  for (const expected of [
    '## Checklist 1 — Intake completeness gate',
    '## Checklist 2 — Evidence gate',
    '## Checklist 3 — Contradiction visibility gate',
    '## Checklist 4 — Proposal-only gate',
    '## Checklist 5 — No-truth-mutation gate',
    '## Checklist 6 — No-runtime-write gate',
    '## Checklist 7 — Handoff quality gate',
    '## Checklist 8 — Card-review-target gate',
    '### Pass criteria',
    '### Soft-fail criteria',
    '### Hard-stop criteria',
    '### Required user approval if applicable'
  ]) {
    assert(content.includes(expected), `Expected studio gate checklist text missing: ${expected}`);
  }
}

function verifyLifecycleStateModel() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'AICOS_STUDIO_LIFECYCLE_STATE_MODEL.md'), 'utf-8');
  for (const expected of [
    '`captured`',
    '`normalized`',
    '`challenged`',
    '`gated`',
    '`forwarded`',
    '`held`',
    '`split`',
    '`archived`',
    '`discarded`',
    'proposal-layer only',
    'None of them means registry truth or runtime review state',
    'No state in this lifecycle model implies',
    'registry truth',
    'runtime review object creation'
  ]) {
    assert(content.includes(expected), `Expected studio lifecycle text missing: ${expected}`);
  }
}

function verifyReviewProcedure() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'AICOS_STUDIO_REVIEW_PROCEDURE.md'), 'utf-8');
  for (const expected of [
    '## Review sequence',
    '## Minimum review questions',
    '## Decision types',
    '`forward`',
    '`hold`',
    '`split`',
    '`downgrade`',
    '`archive`',
    '`discard`',
    '## When user gate is mandatory',
    '## When conflict visibility gate is mandatory',
    '## When evidence gate is mandatory',
    '## When nothing may be forwarded'
  ]) {
    assert(content.includes(expected), `Expected studio review procedure text missing: ${expected}`);
  }
}

function verifyDecisionCodes() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'AICOS_STUDIO_DECISION_CODES.md'), 'utf-8');
  for (const expected of [
    '## Decision and outcome codes',
    '`insufficient_evidence`',
    '`unresolved_conflict`',
    '`proposal_only_keep`',
    '`handoff_ready`',
    '`reference_draft_only`',
    '`registry_review_nomination_only`',
    '`runtime_forbidden`',
    '`truth_mutation_forbidden`',
    '- meaning:',
    '- typical use:',
    '- forbidden interpretation:'
  ]) {
    assert(content.includes(expected), `Expected studio decision code text missing: ${expected}`);
  }
}

function verifyReviewRecordSpec() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'AICOS_STUDIO_REVIEW_RECORD_SPEC.md'), 'utf-8');
  for (const expected of [
    '## Purpose',
    '## Artifact boundary',
    '## Required fields',
    '## Optional fields',
    '## Forbidden fields',
    '## Allowed decision types',
    '## Allowed decision codes',
    '`review_record_id`',
    '`subject_artifact_type`',
    '`decision_type`',
    '`decision_codes`',
    '`user_gate_status`',
    '`resulting_next_posture`',
    '`record_scope`',
    'runtime_review_object',
    'truth_mutation_target',
    'review_layer_only'
  ]) {
    assert(content.includes(expected), `Expected review record spec text missing: ${expected}`);
  }
}

function verifyGateReportSpec() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'AICOS_STUDIO_GATE_REPORT_SPEC.md'), 'utf-8');
  for (const expected of [
    '## Purpose',
    '## Artifact boundary',
    '## Required fields',
    '## Optional fields',
    '## Forbidden fields',
    '## Allowed gate names',
    '## Allowed gate outcomes',
    '## Allowed decision codes',
    '`gate_report_id`',
    '`gate_name`',
    '`gate_outcome`',
    '`approval_requirement`',
    '`record_scope`',
    '`pass`',
    '`soft_fail`',
    '`hard_stop`',
    'runtime_review_object',
    'truth_mutation_target',
    'review_layer_only'
  ]) {
    assert(content.includes(expected), `Expected gate report spec text missing: ${expected}`);
  }
}

function verifyBundleSpec() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'AICOS_STUDIO_BUNDLE_SPEC.md'), 'utf-8');
  for (const expected of [
    '## Purpose',
    '## Bundle boundary',
    '## Allowed bundle members',
    '## Forbidden bundle members',
    '## Proposal-only boundary',
    '## Relationship to manifests',
    '`studio_intake_packet`',
    '`proposal_artifact`',
    '`review_record`',
    '`gate_report`',
    'runtime review objects',
    'registry truth objects'
  ]) {
    assert(content.includes(expected), `Expected bundle spec text missing: ${expected}`);
  }
}

function verifyManifestSpec() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'AICOS_STUDIO_MANIFEST_SPEC.md'), 'utf-8');
  for (const expected of [
    '## Purpose',
    '## Artifact boundary',
    '## Required fields',
    '## Optional fields',
    '## Forbidden fields',
    '## Allowed bundle types',
    '## Allowed bundle members',
    '## Consistency rules',
    '## Allowed intended next steps',
    '`bundle_id`',
    '`bundle_type`',
    '`included_artifacts`',
    '`source_packet_ref`',
    '`review_refs`',
    '`gate_report_refs`',
    '`consistency_status`',
    '`intended_next_step`',
    '`proposal_only`',
    '`no_truth_mutation`',
    '`no_runtime_write`',
    '`studio_bundle_manifest`'
  ]) {
    assert(content.includes(expected), `Expected manifest spec text missing: ${expected}`);
  }
}

function verifyBundleReviewContext() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'AICOS_STUDIO_BUNDLE_REVIEW_CONTEXT.md'), 'utf-8');
  for (const expected of [
    '## Purpose',
    '## How review records are interpreted inside a bundle',
    '## How gate reports are interpreted inside a bundle',
    '## Allowed cross-reference patterns',
    '## Forbidden trace patterns',
    '## Topic and trace discipline',
    '`subject_ref`',
    '`subject_artifact_type`',
    '`review_refs`',
    '`gate_report_refs`'
  ]) {
    assert(content.includes(expected), `Expected bundle review context text missing: ${expected}`);
  }
}

function verifyTraceConsistencyRules() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'AICOS_STUDIO_TRACE_CONSISTENCY_RULES.md'), 'utf-8');
  for (const expected of [
    '## Purpose',
    '## Rule 1 — Included subject rule',
    '## Rule 2 — Subject type match rule',
    '## Rule 3 — Topic legibility rule',
    '## Rule 4 — No implicit approval rule',
    '## Rule 5 — No runtime or truth trace rule',
    '## Rule 6 — Review/gate trace pairing rule',
    '`consistent`',
    '`needs_review`',
    '`conflict_present`'
  ]) {
    assert(content.includes(expected), `Expected trace consistency rules text missing: ${expected}`);
  }
}

function main() {
  verifyFilesExist();
  verifyCharter();
  verifyPacketSpec();
  verifyExamplePackets();
  verifyRolePromptContracts();
  verifyRoutingMatrix();
  verifyReviewTargetMapping();
  verifyArtifactTemplates();
  verifyGateChecklists();
  verifyLifecycleStateModel();
  verifyReviewProcedure();
  verifyDecisionCodes();
  verifyReviewRecordSpec();
  verifyGateReportSpec();
  verifyBundleSpec();
  verifyManifestSpec();
  verifyBundleReviewContext();
  verifyTraceConsistencyRules();
  console.log('AICOS studio intake docs verification passed.');
}

main();
