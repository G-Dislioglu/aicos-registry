#!/usr/bin/env node
const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  DEFAULT_MEMORY_CANDIDATES_DIR,
  createArenaRunPacket,
  executeArenaRun,
  listMemoryCandidates,
  readAuditRecord,
  readMemoryCandidate
} = require('./arena-lib');

const ROOT_DIR = path.join(__dirname, '..');
const REQUIRED_FILES = [
  path.join(ROOT_DIR, 'PHASE4A_IMPLEMENTATION_PLAN.md'),
  path.join(ROOT_DIR, 'PHASE4A_MEMORY_PROPOSAL_SURFACE.md'),
  path.join(ROOT_DIR, 'tools', 'memory-proposal-lib.js'),
  path.join(ROOT_DIR, 'tools', 'verify-phase4a-memory-proposals.js'),
  path.join(ROOT_DIR, 'tools', 'arena-lib.js'),
  path.join(ROOT_DIR, 'tools', 'arena.js'),
  path.join(ROOT_DIR, 'tools', 'arena-server.js')
];
const REGISTRY_DIRS = [
  path.join(ROOT_DIR, 'cards'),
  path.join(ROOT_DIR, 'index'),
  path.join(ROOT_DIR, 'human'),
  path.join(ROOT_DIR, 'taxonomies')
];
const PHASE4A_JS_FILES = [
  path.join(ROOT_DIR, 'tools', 'arena-lib.js'),
  path.join(ROOT_DIR, 'tools', 'arena.js'),
  path.join(ROOT_DIR, 'tools', 'arena-server.js'),
  path.join(ROOT_DIR, 'tools', 'memory-proposal-lib.js'),
  path.join(ROOT_DIR, 'tools', 'verify-phase4a-memory-proposals.js')
];
const DISALLOWED_PATTERNS = [
  ['memory', 'promotion'].join('_'),
  ['institutional', 'memory'].join('_'),
  ['specialist', 'role'].join('_'),
  ['final', 'judge'].join('_'),
  ['bench', 'mark'].join('')
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
    assert(fs.existsSync(filePath), `Missing required Phase 4A file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyNoScopeDrift() {
  for (const filePath of PHASE4A_JS_FILES) {
    const content = fs.readFileSync(filePath, 'utf-8');
    for (const pattern of DISALLOWED_PATTERNS) {
      assert(!content.includes(pattern), `Disallowed Phase 4A pattern ${pattern} found in ${path.relative(ROOT_DIR, filePath)}`);
    }
  }
}

async function verifyMemoryProposalRuntime() {
  const registryBefore = snapshotRegistry();
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4a-runs-'));
  const tempAuditDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4a-audit-'));
  const tempMemoryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4a-memory-'));
  const packet = createArenaRunPacket({
    question: 'Capture proposal-only memory candidates',
    q: 'registry',
    type: 'solution_proof',
    profile: 'review_strict',
    memory_proposals: true,
    memory_tags: ['phase4a', 'review'],
    memory_notes: ['manual follow-up only']
  }, { outputDir: tempRunsDir, auditOutputDir: tempAuditDir, memoryOutputDir: tempMemoryDir });

  assert(packet.mode === 'proposal_only', 'Expected run mode to remain proposal_only');
  assert(packet.memory_candidates.enabled === true, 'Expected memory proposal generation to be enabled');
  assert(packet.memory_candidates.count >= 1, 'Expected at least one memory candidate');
  for (const item of packet.memory_candidates.items) {
    assert(item.status === 'proposal_only', 'Expected memory candidate status to remain proposal_only');
    assert(item.promoted === false, 'Expected memory candidate promoted flag to remain false');
    assert(item.source_run_id === packet.run_id, 'Expected memory candidate to link back to source run');
  }

  const persisted = executeArenaRun({
    question: 'Capture proposal-only memory candidates',
    q: 'registry',
    type: 'solution_proof',
    profile: 'review_strict',
    memory_proposals: true,
    memory_tags: ['phase4a', 'review'],
    memory_notes: ['manual follow-up only']
  }, { outputDir: tempRunsDir, auditOutputDir: tempAuditDir, memoryOutputDir: tempMemoryDir });

  assert(persisted.filePath.startsWith(tempRunsDir), 'Expected run packet outside registry');
  assert(persisted.auditFilePath.startsWith(tempAuditDir), 'Expected audit record outside registry');
  assert(Array.isArray(persisted.memoryCandidateFilePaths), 'Expected memory candidate file paths array');
  assert(persisted.memoryCandidateFilePaths.length >= 1, 'Expected persisted memory candidate files');
  for (const filePath of persisted.memoryCandidateFilePaths) {
    assert(filePath.startsWith(tempMemoryDir), 'Expected memory candidate files outside registry');
    assert(fs.existsSync(filePath), 'Expected persisted memory candidate file to exist');
  }

  const auditRecord = readAuditRecord(persisted.packet.run_id, { auditOutputDir: tempAuditDir });
  assert(auditRecord.memory_proposals.count >= 1, 'Expected audit record to include memory proposal summary');

  const listedCandidates = listMemoryCandidates({ memoryOutputDir: tempMemoryDir });
  assert(listedCandidates.length >= 1, 'Expected listMemoryCandidates to return persisted candidates');
  const loadedCandidate = readMemoryCandidate(listedCandidates[0].candidate_id, { memoryOutputDir: tempMemoryDir });
  assert(loadedCandidate && loadedCandidate.promoted === false, 'Expected memory candidate to remain non-promoted when read back');

  const registryAfter = snapshotRegistry();
  assert(JSON.stringify(registryBefore) === JSON.stringify(registryAfter), 'Registry files changed during Phase 4A verification');
}

async function verifyHttpSurface() {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4a-http-runs-'));
  const tempAuditDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4a-http-audit-'));
  const tempMemoryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4a-http-memory-'));
  const port = 3241;
  const serverProcess = spawn(process.execPath, ['tools/arena-server.js'], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      PORT: String(port),
      ARENA_RUNS_DIR: tempRunsDir,
      ARENA_AUDIT_DIR: tempAuditDir,
      ARENA_MEMORY_DIR: tempMemoryDir
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
    const createResponse = await fetch(`http://127.0.0.1:${port}/arena/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Phase 4A HTTP probe',
        q: 'env',
        type: 'error_pattern',
        profile: 'low_cost',
        memory_proposals: true,
        memory_tags: ['http-phase4a']
      })
    });
    assert(createResponse.status === 201, 'Expected POST /arena/runs to return 201');
    const createdRun = await createResponse.json();
    assert(createdRun.packet.memory_candidates.count >= 1, 'Expected HTTP-created run to include memory proposal summary');

    const memoryListResponse = await fetch(`http://127.0.0.1:${port}/arena/memory-candidates`);
    assert(memoryListResponse.ok, 'Expected GET /arena/memory-candidates to return 200');
    const memoryListPayload = await memoryListResponse.json();
    assert(Array.isArray(memoryListPayload.items) && memoryListPayload.items.length >= 1, 'Expected GET /arena/memory-candidates to return stored candidates');

    const candidateId = memoryListPayload.items[0].candidate_id;
    const memoryGetResponse = await fetch(`http://127.0.0.1:${port}/arena/memory-candidates/${candidateId}`);
    assert(memoryGetResponse.ok, 'Expected GET /arena/memory-candidates/:id to return 200');
    const memoryGetPayload = await memoryGetResponse.json();
    assert(memoryGetPayload.source_run_id === createdRun.packet.run_id, 'Expected GET /arena/memory-candidates/:id to preserve source run linkage');
    assert(memoryGetPayload.promoted === false, 'Expected HTTP-loaded memory candidate to remain non-promoted');
  } finally {
    serverProcess.kill();
  }
}

async function main() {
  verifyFilesExist();
  verifyNoScopeDrift();
  await verifyMemoryProposalRuntime();
  await verifyHttpSurface();
  assert(DEFAULT_MEMORY_CANDIDATES_DIR.includes(path.join('runtime', 'memory-candidates')), 'Expected default memory candidate directory outside registry files');
  console.log('Phase 4A memory-proposal verification passed.');
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
