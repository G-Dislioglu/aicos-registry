#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const CHECKS = [
  path.join('tools', 'verify-mec-phase2-candidates.js'),
  path.join('tools', 'verify-mec-operator-ui-smoke.js')
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
  const output = (result.stdout || '').trim();
  if (output) {
    console.log(output);
  }
}

function main() {
  CHECKS.forEach(runVerifier);
  console.log('MEC Phase 2 closure gate passed.');
}

main();
