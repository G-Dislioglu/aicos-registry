#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const REQUIRED_FILES = [
  path.join(ROOT_DIR, 'MEC_PHASE3I_REVIEW_ACTION_RATIONALE_SNAPSHOT_TRACE_ACCEPTANCE.md'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-phase3i-review-action-rationale-snapshot-trace.js'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-phase3a-review-core.js'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-phase3c-review-workspace.js'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-operator-ui-smoke.js'),
  path.join(ROOT_DIR, 'tools', 'mec-review-lib.js'),
  path.join(ROOT_DIR, 'web', 'mec-operator.html')
];
const REQUIRED_UI_STRINGS = [
  'Review action trace',
  'Compact trace showing which visible decision, contradiction and delta signals were present when the latest review write was recorded.',
  'Signals at write',
  'Decision timing at write',
  'write snapshot | readiness'
];
const REQUIRED_CODE_STRINGS = [
  'rationale_snapshot',
  'review_trace_context',
  'phase3i-mec-review-rationale-snapshot/v1'
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runVerifier(relativePath) {
  const result = spawnSync(process.execPath, [relativePath], {
    cwd: ROOT_DIR,
    encoding: 'utf-8'
  });
  assert(result.status === 0, `${relativePath} failed: ${(result.stderr || result.stdout || '').trim()}`);
}

function verifyFilesExist() {
  for (const filePath of REQUIRED_FILES) {
    assert(fs.existsSync(filePath), `Missing required Phase 3I file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyDeskCopy() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'web', 'mec-operator.html'), 'utf-8');
  for (const expected of REQUIRED_UI_STRINGS) {
    assert(content.includes(expected), `Expected Phase 3I desk UI copy missing: ${expected}`);
  }
}

function verifyRuntimeBindings() {
  const arenaLib = fs.readFileSync(path.join(ROOT_DIR, 'tools', 'arena-lib.js'), 'utf-8');
  const reviewLib = fs.readFileSync(path.join(ROOT_DIR, 'tools', 'mec-review-lib.js'), 'utf-8');
  for (const expected of REQUIRED_CODE_STRINGS) {
    assert(arenaLib.includes(expected) || reviewLib.includes(expected), `Expected Phase 3I runtime binding missing: ${expected}`);
  }
}

function main() {
  verifyFilesExist();
  verifyDeskCopy();
  verifyRuntimeBindings();
  runVerifier(path.join('tools', 'verify-mec-phase3a-review-core.js'));
  runVerifier(path.join('tools', 'verify-mec-phase3c-review-workspace.js'));
  runVerifier(path.join('tools', 'verify-mec-operator-ui-smoke.js'));
  console.log('MEC Phase 3I review action rationale snapshot and trace verification passed.');
}

main();
