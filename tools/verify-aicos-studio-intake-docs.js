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

function main() {
  verifyFilesExist();
  verifyCharter();
  verifyPacketSpec();
  verifyExamplePackets();
  verifyRolePromptContracts();
  verifyRoutingMatrix();
  verifyReviewTargetMapping();
  console.log('AICOS studio intake docs verification passed.');
}

main();
