#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const REQUIRED_FILES = [
  path.join(ROOT_DIR, 'MEC_PHASE3H_DECISION_PACKET_CONTRADICTION_ACCEPTANCE.md'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-phase3h-decision-packet-contradiction.js'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-phase3c-review-workspace.js'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-operator-ui-smoke.js'),
  path.join(ROOT_DIR, 'web', 'mec-operator.html')
];
const REQUIRED_UI_STRINGS = [
  'Decision packet',
  'Signal-based decision condensation showing what supports, weakens or still underconstrains the current read without recommending an outcome.',
  'Contradiction context',
  'Visible signal contradictions that should be held together before a stabilize/reject decision is written.',
  'Decision readiness',
  'Support signals',
  'Friction signals',
  'Missing / open gaps',
  'Contradiction summary',
  'Contradiction signals',
  'Decision: ready',
  'Decision: fragile'
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
    assert(fs.existsSync(filePath), `Missing required Phase 3H file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyDeskCopy() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'web', 'mec-operator.html'), 'utf-8');
  for (const expected of REQUIRED_UI_STRINGS) {
    assert(content.includes(expected), `Expected Phase 3H desk UI copy missing: ${expected}`);
  }
}

function main() {
  verifyFilesExist();
  verifyDeskCopy();
  runVerifier(path.join('tools', 'verify-mec-phase3c-review-workspace.js'));
  runVerifier(path.join('tools', 'verify-mec-operator-ui-smoke.js'));
  console.log('MEC Phase 3H decision packet and contradiction verification passed.');
}

main();
