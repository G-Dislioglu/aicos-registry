#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const REQUIRED_FILES = [
  path.join(ROOT_DIR, 'MEC_PHASE3B_OPERATOR_FRONTEND_ACCEPTANCE.md'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-operator-ui-smoke.js'),
  path.join(ROOT_DIR, 'web', 'mec-operator.html')
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

function main() {
  for (const filePath of REQUIRED_FILES) {
    assert(fs.existsSync(filePath), `Missing required Phase 3B frontend file: ${path.relative(ROOT_DIR, filePath)}`);
  }
  runVerifier(path.join('tools', 'verify-mec-operator-ui-smoke.js'));
  console.log('MEC Phase 3B operator frontend verification passed.');
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
