#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const REQUIRED_FILES = [
  path.join(ROOT_DIR, 'AICOS_STUDIO_INTAKE_CHARTER.md'),
  path.join(ROOT_DIR, 'AICOS_STUDIO_INTAKE_PACKET_SPEC.md'),
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

function main() {
  verifyFilesExist();
  verifyCharter();
  verifyPacketSpec();
  console.log('AICOS studio intake docs verification passed.');
}

main();
