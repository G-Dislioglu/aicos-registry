#!/usr/bin/env node
const { spawn } = require('child_process');
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
  path.join(ROOT_DIR, 'tools', 'registry-readonly-server.js'),
  path.join(ROOT_DIR, 'tools', 'verify-phase1-readonly.js')
];
const PHASE1_JS_FILES = [
  path.join(ROOT_DIR, 'tools', 'registry-readonly-lib.js'),
  path.join(ROOT_DIR, 'tools', 'registry-readonly.js'),
  path.join(ROOT_DIR, 'tools', 'registry-readonly-server.js'),
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

async function verifyHttpSurface() {
  const port = 3211;
  const serverProcess = spawn(process.execPath, ['tools/registry-readonly-server.js'], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      PORT: String(port)
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const ready = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timed out waiting for registry-readonly-server to start'));
    }, 5000);

    serverProcess.stdout.on('data', data => {
      const text = String(data);
      if (text.includes('registry-readonly-server listening')) {
        clearTimeout(timeout);
        resolve();
      }
    });

    serverProcess.stderr.on('data', data => {
      clearTimeout(timeout);
      reject(new Error(String(data)));
    });

    serverProcess.on('exit', code => {
      clearTimeout(timeout);
      reject(new Error(`registry-readonly-server exited early with code ${code}`));
    });
  });

  try {
    await ready;

    const healthResponse = await fetch(`http://127.0.0.1:${port}/health`);
    assert(healthResponse.ok, 'Expected /health endpoint to return 200');

    const statsResponse = await fetch(`http://127.0.0.1:${port}/stats`);
    assert(statsResponse.ok, 'Expected /stats endpoint to return 200');
    const statsPayload = await statsResponse.json();
    assert(statsPayload.totalCards > 0, 'Expected HTTP /stats to report cards');

    const listResponse = await fetch(`http://127.0.0.1:${port}/cards?type=solution_proof&domain=biology&limit=2`);
    assert(listResponse.ok, 'Expected filtered /cards endpoint to return 200');
    const listPayload = await listResponse.json();
    assert(Array.isArray(listPayload.items), 'Expected /cards payload to include items array');
    assert(listPayload.items.length > 0, 'Expected filtered /cards endpoint to return items');

    const resolveResponse = await fetch(`http://127.0.0.1:${port}/resolve/sol-maya-001`);
    assert(resolveResponse.ok, 'Expected /resolve endpoint to return 200');
    const resolvePayload = await resolveResponse.json();
    assert(resolvePayload.resolvedId === 'meta-001', 'Expected HTTP resolve to return meta-001');

    const getResponse = await fetch(`http://127.0.0.1:${port}/cards/err-api-004`);
    assert(getResponse.ok, 'Expected /cards/:id endpoint to return 200');
    const getPayload = await getResponse.json();
    assert(getPayload.card && getPayload.card.id === 'err-api-004', 'Expected HTTP full card lookup to return err-api-004');
  } finally {
    serverProcess.kill();
  }
}

async function main() {
  verifyFilesExist();
  verifyNoWriteApis();
  verifyReadOnlyQueries();
  await verifyHttpSurface();
  console.log('Phase 1 read-only verification passed.');
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
