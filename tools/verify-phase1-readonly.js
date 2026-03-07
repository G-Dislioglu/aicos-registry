#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const {
  getCardById,
  getStats,
  listCards,
  resolveId
} = require('./registry-readonly-lib');

const ROOT_DIR = path.join(__dirname, '..');
const REQUIRED_FILES = [
  path.join(ROOT_DIR, 'PHASE1_IMPLEMENTATION_PLAN.md'),
  path.join(ROOT_DIR, 'PHASE1_READONLY_SURFACE.md'),
  path.join(ROOT_DIR, 'tools', 'registry-readonly-lib.js'),
  path.join(ROOT_DIR, 'tools', 'registry-readonly.js'),
  path.join(ROOT_DIR, 'tools', 'verify-phase1-readonly.js')
];
const PHASE1_JS_FILES = [
  path.join(ROOT_DIR, 'tools', 'registry-readonly-lib.js'),
  path.join(ROOT_DIR, 'tools', 'registry-readonly.js'),
  path.join(ROOT_DIR, 'tools', 'verify-phase1-readonly.js')
];
const DISALLOWED_PATTERNS = [
  ['write', 'FileSync'].join(''),
  ['write', 'File('].join(''),
  ['append', 'File'].join(''),
  ['rm', 'Sync'].join(''),
  ['unlink', 'Sync'].join(''),
  ['mkdir', 'Sync'].join(''),
  ['rmdir', 'Sync'].join(''),
  ['rename', 'Sync'].join(''),
  ['copyFile', 'Sync'].join('')
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function verifyFilesExist() {
  for (const filePath of REQUIRED_FILES) {
    assert(fs.existsSync(filePath), `Missing required Phase 1 file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyNoWriteApis() {
  for (const filePath of PHASE1_JS_FILES) {
    const content = fs.readFileSync(filePath, 'utf-8');
    for (const pattern of DISALLOWED_PATTERNS) {
      assert(!content.includes(pattern), `Disallowed write pattern ${pattern} found in ${path.relative(ROOT_DIR, filePath)}`);
    }
  }
}

function verifyReadOnlyQueries() {
  const stats = getStats();
  assert(stats.totalCards > 0, 'Expected registry stats to report cards');

  const listResult = listCards({ type: 'solution_proof', domain: 'biology', limit: 3 });
  assert(Array.isArray(listResult), 'Expected listCards to return an array');
  assert(listResult.length > 0, 'Expected filtered list to return at least one biology solution');

  const aliasResult = resolveId('sol-maya-001');
  assert(aliasResult.resolvedViaAlias === true, 'Expected alias resolution for sol-maya-001');
  assert(aliasResult.resolvedId === 'meta-001', 'Expected sol-maya-001 to resolve to meta-001');

  const cardResult = getCardById('err-api-004');
  assert(cardResult.existsInIndex === true, 'Expected err-api-004 to exist in the index');
  assert(cardResult.card && cardResult.card.id === 'err-api-004', 'Expected full card lookup for err-api-004');
}

function main() {
  verifyFilesExist();
  verifyNoWriteApis();
  verifyReadOnlyQueries();
  console.log('Phase 1 read-only verification passed.');
}

main();
