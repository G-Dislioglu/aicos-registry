#!/usr/bin/env node
const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  createArenaRunPacket,
  executeArenaRun,
  listArenaRuns,
  readArenaRun
} = require('./arena-lib');

const ROOT_DIR = path.join(__dirname, '..');
const REQUIRED_FILES = [
  path.join(ROOT_DIR, 'PHASE2_IMPLEMENTATION_PLAN.md'),
  path.join(ROOT_DIR, 'PHASE2_MINIMAL_ARENA_SURFACE.md'),
  path.join(ROOT_DIR, 'tools', 'arena-lib.js'),
  path.join(ROOT_DIR, 'tools', 'arena.js'),
  path.join(ROOT_DIR, 'tools', 'arena-server.js'),
  path.join(ROOT_DIR, 'tools', 'verify-phase2-arena.js')
];
const REGISTRY_DIRS = [
  path.join(ROOT_DIR, 'cards'),
  path.join(ROOT_DIR, 'index'),
  path.join(ROOT_DIR, 'human'),
  path.join(ROOT_DIR, 'taxonomies')
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function hashFile(filePath) {
  const digest = crypto.createHash('sha256');
  digest.update(fs.readFileSync(filePath));
  return digest.digest('hex');
}

function snapshotDirectory(dirPath) {
  const snapshot = {};
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      Object.assign(snapshot, snapshotDirectory(fullPath));
    } else {
      snapshot[path.relative(ROOT_DIR, fullPath)] = hashFile(fullPath);
    }
  }
  return snapshot;
}

function snapshotRegistry() {
  return REGISTRY_DIRS.reduce((acc, dirPath) => {
    Object.assign(acc, snapshotDirectory(dirPath));
    return acc;
  }, {});
}

function verifyFilesExist() {
  for (const filePath of REQUIRED_FILES) {
    assert(fs.existsSync(filePath), `Missing required Phase 2 file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

async function verifyProposalOnlyRuntime() {
  const registryBefore = snapshotRegistry();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-arena-'));
  const packet = createArenaRunPacket({
    question: 'Find registry-grounded candidates for environment diagnosis',
    q: 'env',
    type: 'error_pattern',
    evidence_topic: 'environment diagnosis',
    requested_sources: ['registry_only']
  }, { outputDir: tempDir });

  assert(packet.mode === 'proposal_only', 'Expected arena packet mode to remain proposal_only');
  assert(packet.validation.eligible === false, 'Expected validation to remain ineligible without proof_ref and gates');
  assert(packet.observer_decision.apply_allowed === false, 'Expected apply_allowed to remain false');

  const persisted = executeArenaRun({
    question: 'Find registry-grounded candidates for environment diagnosis',
    q: 'env',
    type: 'error_pattern',
    evidence_topic: 'environment diagnosis'
  }, { outputDir: tempDir });

  assert(persisted.filePath.startsWith(tempDir), 'Expected trace output to be written outside the registry');
  assert(fs.existsSync(persisted.filePath), 'Expected persisted arena trace file to exist');

  const storedRuns = listArenaRuns({ outputDir: tempDir });
  assert(storedRuns.length >= 1, 'Expected at least one stored arena run');

  const loaded = readArenaRun(persisted.packet.run_id, { outputDir: tempDir });
  assert(loaded && loaded.run_id === persisted.packet.run_id, 'Expected stored run to be readable by ID');

  const registryAfter = snapshotRegistry();
  assert(JSON.stringify(registryBefore) === JSON.stringify(registryAfter), 'Registry files changed during Phase 2 verification');
}

async function verifyHttpArenaSurface() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-arena-http-'));
  const port = 3221;
  const serverProcess = spawn(process.execPath, ['tools/arena-server.js'], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      PORT: String(port),
      ARENA_RUNS_DIR: tempDir
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timed out waiting for arena-server to start'));
    }, 5000);

    serverProcess.stdout.on('data', data => {
      const text = String(data);
      if (text.includes('arena-server listening')) {
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
      reject(new Error(`arena-server exited early with code ${code}`));
    });
  });

  try {
    const healthResponse = await fetch(`http://127.0.0.1:${port}/arena/health`);
    assert(healthResponse.ok, 'Expected /arena/health to return 200');

    const createResponse = await fetch(`http://127.0.0.1:${port}/arena/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Registry-grounded arena probe',
        q: 'registry',
        type: 'solution_proof',
        evidence_topic: 'registry basis'
      })
    });
    assert(createResponse.status === 201, 'Expected POST /arena/runs to return 201');
    const createdRun = await createResponse.json();
    assert(createdRun.packet.mode === 'proposal_only', 'Expected HTTP-created run to remain proposal_only');

    const listResponse = await fetch(`http://127.0.0.1:${port}/arena/runs`);
    assert(listResponse.ok, 'Expected GET /arena/runs to return 200');
    const listPayload = await listResponse.json();
    assert(Array.isArray(listPayload.items) && listPayload.items.length >= 1, 'Expected GET /arena/runs to return stored items');

    const getResponse = await fetch(`http://127.0.0.1:${port}/arena/runs/${createdRun.packet.run_id}`);
    assert(getResponse.ok, 'Expected GET /arena/runs/:id to return 200');
    const loadedRun = await getResponse.json();
    assert(loadedRun.run_id === createdRun.packet.run_id, 'Expected GET /arena/runs/:id to return the created run');
  } finally {
    serverProcess.kill();
  }
}

async function main() {
  verifyFilesExist();
  await verifyProposalOnlyRuntime();
  await verifyHttpArenaSurface();
  console.log('Phase 2 arena verification passed.');
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
