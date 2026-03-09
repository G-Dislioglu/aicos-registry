#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const REQUIRED_FILES = [
  path.join(ROOT_DIR, 'MEC_PHASE3D_REVIEW_DESK_ACCEPTANCE.md'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-phase3d-review-desk.js'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-phase3c-review-workspace.js'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-operator-ui-smoke.js'),
  path.join(ROOT_DIR, 'web', 'mec-operator.html')
];
const REQUIRED_UI_STRINGS = [
  'MEC Review Desk',
  'Desk context',
  'Derived review state',
  'Raw review records',
  'Raw candidate artifact',
  'Reproducible desk state',
  'Ready for first review',
  'Attention-bearing workspace'
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
    assert(fs.existsSync(filePath), `Missing required Phase 3D file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyDeskCopy() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'web', 'mec-operator.html'), 'utf-8');
  for (const expected of REQUIRED_UI_STRINGS) {
    assert(content.includes(expected), `Expected Phase 3D desk UI copy missing: ${expected}`);
  }
}

function main() {
  verifyFilesExist();
  verifyDeskCopy();
  runVerifier(path.join('tools', 'verify-mec-operator-ui-smoke.js'));
  runVerifier(path.join('tools', 'verify-mec-phase3c-review-workspace.js'));
  console.log('MEC Phase 3D review-desk verification passed.');
}

main();
