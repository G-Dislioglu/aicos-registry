#!/usr/bin/env node
const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  DEFAULT_AUDIT_DIR,
  createArenaRunPacket,
  executeArenaRun,
  readAuditRecord
} = require('./arena-lib');
const {
  getProfile,
  listProfiles
} = require('./model-control-lib');

const ROOT_DIR = path.join(__dirname, '..');
const REQUIRED_FILES = [
  path.join(ROOT_DIR, 'PHASE3_IMPLEMENTATION_PLAN.md'),
  path.join(ROOT_DIR, 'PHASE3_AUDIT_MODEL_CONTROL_SURFACE.md'),
  path.join(ROOT_DIR, 'tools', 'arena-lib.js'),
  path.join(ROOT_DIR, 'tools', 'arena.js'),
  path.join(ROOT_DIR, 'tools', 'arena-server.js'),
  path.join(ROOT_DIR, 'tools', 'model-control-lib.js'),
  path.join(ROOT_DIR, 'tools', 'verify-phase3-audit-control.js')
];
const REGISTRY_DIRS = [
  path.join(ROOT_DIR, 'cards'),
  path.join(ROOT_DIR, 'index'),
  path.join(ROOT_DIR, 'human'),
  path.join(ROOT_DIR, 'taxonomies')
];
const PHASE3_JS_FILES = [
  path.join(ROOT_DIR, 'tools', 'arena-lib.js'),
  path.join(ROOT_DIR, 'tools', 'arena.js'),
  path.join(ROOT_DIR, 'tools', 'arena-server.js'),
  path.join(ROOT_DIR, 'tools', 'model-control-lib.js'),
  path.join(ROOT_DIR, 'tools', 'verify-phase3-audit-control.js')
];
const DISALLOWED_PATTERNS = [
  ['memory', 'promotion'].join('_'),
  ['specialist', 'role'].join('_'),
  ['distill', 'ation'].join(''),
  ['final', 'judge'].join('_'),
  ['curator', 'admin'].join('_')
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
    assert(fs.existsSync(filePath), `Missing required Phase 3 file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyNoPhase4Drift() {
  for (const filePath of PHASE3_JS_FILES) {
    const content = fs.readFileSync(filePath, 'utf-8');
    for (const pattern of DISALLOWED_PATTERNS) {
      assert(!content.includes(pattern), `Disallowed Phase 4 pattern ${pattern} found in ${path.relative(ROOT_DIR, filePath)}`);
    }
  }
}

function verifyProfiles() {
  const profiles = listProfiles();
  assert(Array.isArray(profiles) && profiles.length >= 3, 'Expected at least three local model-control profiles');
  const strictProfile = getProfile('review_strict');
  assert(strictProfile.id === 'review_strict', 'Expected review_strict profile to be available');
}

async function verifyAuditRuntime() {
  const registryBefore = snapshotRegistry();
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase3-runs-'));
  const tempAuditDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase3-audit-'));
  const packet = createArenaRunPacket({
    question: 'Review registry-grounded diagnosis candidates',
    q: 'registry',
    type: 'solution_proof',
    profile: 'review_strict',
    evidence_topic: 'registry diagnosis'
  }, { outputDir: tempRunsDir, auditOutputDir: tempAuditDir });

  assert(packet.mode === 'proposal_only', 'Expected Phase 3 arena packet mode to remain proposal_only');
  assert(packet.model_control.selected_profile === 'review_strict', 'Expected selected profile to be review_strict');
  assert(packet.model_control.provider_integration === 'not_configured', 'Expected provider integration to remain local-only');
  assert(packet.trace.decision_boundary.apply_allowed === false, 'Expected apply boundary to remain false');
  assert(packet.trace.registry_context_source.surface === 'registry-readonly-lib', 'Expected registry context source to remain read-only');

  const persisted = executeArenaRun({
    question: 'Review registry-grounded diagnosis candidates',
    q: 'registry',
    type: 'solution_proof',
    profile: 'review_strict',
    evidence_topic: 'registry diagnosis'
  }, { outputDir: tempRunsDir, auditOutputDir: tempAuditDir });

  assert(persisted.filePath.startsWith(tempRunsDir), 'Expected run packet to be written outside the registry');
  assert(persisted.auditFilePath.startsWith(tempAuditDir), 'Expected audit record to be written outside the registry');
  assert(fs.existsSync(persisted.auditFilePath), 'Expected persisted audit record to exist');

  const auditRecord = readAuditRecord(persisted.packet.run_id, { auditOutputDir: tempAuditDir });
  assert(auditRecord && auditRecord.run_id === persisted.packet.run_id, 'Expected audit record to be readable by run ID');
  assert(auditRecord.proposal_only_status.mode === 'proposal_only', 'Expected audit record to preserve proposal-only status');

  const registryAfter = snapshotRegistry();
  assert(JSON.stringify(registryBefore) === JSON.stringify(registryAfter), 'Registry files changed during Phase 3 verification');
}

async function verifyHttpArenaSurface() {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase3-http-runs-'));
  const tempAuditDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase3-http-audit-'));
  const port = 3231;
  const serverProcess = spawn(process.execPath, ['tools/arena-server.js'], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      PORT: String(port),
      ARENA_RUNS_DIR: tempRunsDir,
      ARENA_AUDIT_DIR: tempAuditDir
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
    const profilesResponse = await fetch(`http://127.0.0.1:${port}/arena/profiles`);
    assert(profilesResponse.ok, 'Expected /arena/profiles to return 200');
    const profilesPayload = await profilesResponse.json();
    assert(Array.isArray(profilesPayload.items) && profilesPayload.items.length >= 3, 'Expected /arena/profiles to return local profiles');

    const createResponse = await fetch(`http://127.0.0.1:${port}/arena/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Phase 3 audit probe',
        q: 'env',
        type: 'error_pattern',
        profile: 'low_cost',
        evidence_topic: 'env review'
      })
    });
    assert(createResponse.status === 201, 'Expected POST /arena/runs to return 201');
    const createdRun = await createResponse.json();
    assert(createdRun.packet.model_control.selected_profile === 'low_cost', 'Expected HTTP-created run to use the requested profile');

    const auditResponse = await fetch(`http://127.0.0.1:${port}/arena/audit/${createdRun.packet.run_id}`);
    assert(auditResponse.ok, 'Expected GET /arena/audit/:id to return 200');
    const auditPayload = await auditResponse.json();
    assert(auditPayload.run_id === createdRun.packet.run_id, 'Expected GET /arena/audit/:id to return the audit record');
    assert(auditPayload.model_control.selected_profile === 'low_cost', 'Expected audit payload to preserve profile selection');
  } finally {
    serverProcess.kill();
  }
}

async function main() {
  verifyFilesExist();
  verifyNoPhase4Drift();
  verifyProfiles();
  await verifyAuditRuntime();
  await verifyHttpArenaSurface();
  assert(DEFAULT_AUDIT_DIR.includes(path.join('runtime', 'audit-records')), 'Expected default audit directory to remain outside registry files');
  console.log('Phase 3 audit/model-control verification passed.');
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
