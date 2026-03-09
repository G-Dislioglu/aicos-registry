#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const REQUIRED_FILES = [
  path.join(ROOT_DIR, 'MEC_PHASE3F_COMPARATIVE_REVIEW_FOCUS_ACCEPTANCE.md'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-phase3f-comparative-review-focus.js'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-phase3c-review-workspace.js'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-operator-ui-smoke.js'),
  path.join(ROOT_DIR, 'web', 'mec-operator.html')
];
const REQUIRED_UI_STRINGS = [
  'Focus context',
  'Compare context',
  'Signal-based focus framing that condenses real review tension',
  'Quick-compare surface over existing linkage, source overlap, review-state and history signals',
  'Compare state',
  'Use for compare',
  'Clear compare',
  'Focus: compare now',
  'Focus: reference tension'
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
    assert(fs.existsSync(filePath), `Missing required Phase 3F file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyDeskCopy() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'web', 'mec-operator.html'), 'utf-8');
  for (const expected of REQUIRED_UI_STRINGS) {
    assert(content.includes(expected), `Expected Phase 3F desk UI copy missing: ${expected}`);
  }
}

function main() {
  verifyFilesExist();
  verifyDeskCopy();
  runVerifier(path.join('tools', 'verify-mec-phase3c-review-workspace.js'));
  runVerifier(path.join('tools', 'verify-mec-operator-ui-smoke.js'));
  console.log('MEC Phase 3F comparative review and focus verification passed.');
}

main();
