#!/usr/bin/env node
const { spawn, spawnSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  executeArenaRun,
  listMemoryCandidates,
  readMemoryCandidate,
  reviewMemoryCandidate
} = require('./arena-lib');

const ROOT_DIR = path.join(__dirname, '..');
const REQUIRED_FILES = [
  path.join(ROOT_DIR, 'PHASE4D_IMPLEMENTATION_PLAN.md'),
  path.join(ROOT_DIR, 'PHASE4D_EXPORT_READINESS_SURFACE.md'),
  path.join(ROOT_DIR, 'tools', 'memory-export-readiness-lib.js'),
  path.join(ROOT_DIR, 'tools', 'verify-phase4d-export-readiness.js'),
  path.join(ROOT_DIR, 'tools', 'arena-lib.js'),
  path.join(ROOT_DIR, 'tools', 'arena.js')
];
const REGISTRY_DIRS = [
  path.join(ROOT_DIR, 'cards'),
  path.join(ROOT_DIR, 'index'),
  path.join(ROOT_DIR, 'human'),
  path.join(ROOT_DIR, 'taxonomies')
];
const PHASE4D_FILES = [
  path.join(ROOT_DIR, 'tools', 'memory-export-readiness-lib.js'),
  path.join(ROOT_DIR, 'tools', 'arena-lib.js'),
  path.join(ROOT_DIR, 'tools', 'arena.js'),
  path.join(ROOT_DIR, 'tools', 'verify-phase4d-export-readiness.js')
];
const DISALLOWED_PATTERNS = [
  ['institutional', 'memory'].join('_'),
  ['specialist', 'role'].join('_'),
  ['final', 'judge'].join('_')
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
    assert(fs.existsSync(filePath), `Missing required Phase 4D file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyNoScopeDrift() {
  for (const filePath of PHASE4D_FILES) {
    const content = fs.readFileSync(filePath, 'utf-8');
    for (const pattern of DISALLOWED_PATTERNS) {
      assert(!content.includes(pattern), `Disallowed Phase 4D pattern ${pattern} found in ${path.relative(ROOT_DIR, filePath)}`);
    }
  }
}

function runVerifier(relativePath) {
  const result = spawnSync(process.execPath, [relativePath], {
    cwd: ROOT_DIR,
    encoding: 'utf-8'
  });
  assert(result.status === 0, `${relativePath} failed: ${(result.stderr || result.stdout || '').trim()}`);
}

function verifyExistingPhases() {
  runVerifier(path.join('tools', 'verify-phase4a-memory-proposals.js'));
  runVerifier(path.join('tools', 'verify-phase4b-memory-reviews.js'));
  runVerifier(path.join('tools', 'verify-phase4c-runtime-review-consolidation.js'));
}

function pickCandidate(memoryCandidates, candidateType) {
  return memoryCandidates.find(candidate => candidate.candidate_type === candidateType) || null;
}

function verifyReadinessRuntime() {
  const registryBefore = snapshotRegistry();
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4d-runs-'));
  const tempAuditDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4d-audit-'));
  const tempMemoryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4d-memory-'));
  const tempReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4d-reviews-'));

  const persisted = executeArenaRun({
    question: 'Create Phase 4D readiness candidates',
    q: 'registry',
    type: 'solution_proof',
    profile: 'review_strict',
    memory_proposals: true,
    memory_tags: ['phase4d', 'readiness']
  }, { outputDir: tempRunsDir, auditOutputDir: tempAuditDir, memoryOutputDir: tempMemoryDir, memoryReviewOutputDir: tempReviewDir });

  assert(Array.isArray(persisted.memoryCandidates) && persisted.memoryCandidates.length >= 1, 'Expected persisted Phase 4D memory candidates');

  const registryGroundedCandidate = pickCandidate(persisted.memoryCandidates, 'registry_grounded_observation') || persisted.memoryCandidates[0];
  const evidenceGapCandidate = pickCandidate(persisted.memoryCandidates, 'evidence_gap_followup');

  const listedBeforeReview = listMemoryCandidates({ memoryOutputDir: tempMemoryDir, memoryReviewOutputDir: tempReviewDir });
  const listedRegistryGrounded = listedBeforeReview.find(item => item.candidate_id === registryGroundedCandidate.candidate_id);
  assert(listedRegistryGrounded.export_readiness_status === 'not_ready', 'Expected candidate without reviews to start as not_ready');
  assert(listedRegistryGrounded.export_blocker_count >= 1, 'Expected not_ready candidate to expose blockers');
  assert(listedRegistryGrounded.has_boundary === true, 'Expected boundary to remain explicit before export readiness review');

  const acceptedRegistryCandidate = reviewMemoryCandidate(registryGroundedCandidate.candidate_id, {
    review_status: 'accepted',
    review_rationale: 'Runtime-only acceptance for export readiness preparation.',
    review_source: 'phase4d_verifier',
    reviewer_mode: 'human',
    confidence: 'high'
  }, { memoryOutputDir: tempMemoryDir, memoryReviewOutputDir: tempReviewDir });

  assert(acceptedRegistryCandidate.candidate.status === 'proposal_only', 'Expected stored candidate artifact to remain proposal_only');
  assert(acceptedRegistryCandidate.candidate.export_readiness_status === 'ready_for_export_review', 'Expected accepted registry-grounded candidate to become ready_for_export_review');
  assert(acceptedRegistryCandidate.candidate.export_blockers.length === 0, 'Expected ready_for_export_review candidate to have no blockers');
  assert(acceptedRegistryCandidate.candidate.export_readiness.has_boundary === true, 'Expected ready candidate to preserve boundary');
  assert(acceptedRegistryCandidate.candidate.export_readiness.has_review_record === true, 'Expected ready candidate to record review coverage');
  assert(acceptedRegistryCandidate.candidate.export_readiness.terminal_runtime_status === 'accepted', 'Expected accepted terminal runtime status for ready candidate');
  assert(acceptedRegistryCandidate.candidate.export_readiness.export_executed === false, 'Expected export execution boundary to remain false');
  assert(acceptedRegistryCandidate.candidate.export_readiness.registry_mutation === false, 'Expected registry mutation boundary to remain false');

  if (evidenceGapCandidate) {
    const acceptedEvidenceGap = reviewMemoryCandidate(evidenceGapCandidate.candidate_id, {
      review_status: 'accepted',
      review_rationale: 'Accepted for runtime follow-up but still evidence-gapped.',
      review_source: 'phase4d_verifier',
      reviewer_mode: 'human',
      confidence: 'medium'
    }, { memoryOutputDir: tempMemoryDir, memoryReviewOutputDir: tempReviewDir });

    assert(acceptedEvidenceGap.candidate.export_readiness_status === 'needs_more_evidence', 'Expected evidence-gap candidate to remain needs_more_evidence');
    assert(acceptedEvidenceGap.candidate.export_blockers.includes('evidence_gap_present'), 'Expected evidence-gap blocker for needs_more_evidence candidate');
    assert(acceptedEvidenceGap.candidate.export_blockers.includes('proof_readiness_incomplete'), 'Expected proof readiness blocker for evidence-gap candidate');
  }

  const loadedRegistryCandidate = readMemoryCandidate(registryGroundedCandidate.candidate_id, { memoryOutputDir: tempMemoryDir, memoryReviewOutputDir: tempReviewDir });
  assert(loadedRegistryCandidate.export_readiness.schema_version === 'phase4d-export-readiness/v1', 'Expected Phase 4D readiness schema version on candidate read');
  assert(loadedRegistryCandidate.export_readiness.export_evaluation_boundary === 'runtime_only_preparation', 'Expected runtime-only export readiness boundary');

  const registryAfter = snapshotRegistry();
  assert(JSON.stringify(registryBefore) === JSON.stringify(registryAfter), 'Registry files changed during Phase 4D verification');
}

async function verifyHttpSurface() {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4d-http-runs-'));
  const tempAuditDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4d-http-audit-'));
  const tempMemoryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4d-http-memory-'));
  const tempReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4d-http-reviews-'));
  const port = 3244;
  const serverProcess = spawn(process.execPath, ['tools/arena-server.js'], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      PORT: String(port),
      ARENA_RUNS_DIR: tempRunsDir,
      ARENA_AUDIT_DIR: tempAuditDir,
      ARENA_MEMORY_DIR: tempMemoryDir,
      ARENA_MEMORY_REVIEW_DIR: tempReviewDir
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
    const createRunResponse = await fetch(`http://127.0.0.1:${port}/arena/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Phase 4D HTTP probe',
        q: 'registry',
        type: 'solution_proof',
        profile: 'review_strict',
        memory_proposals: true,
        memory_tags: ['http-phase4d']
      })
    });
    assert(createRunResponse.status === 201, 'Expected POST /arena/runs to return 201 for Phase 4D HTTP verification');
    const createdRun = await createRunResponse.json();
    const candidateId = createdRun.memoryCandidates.find(item => item.candidate_type === 'registry_grounded_observation')?.candidate_id || createdRun.memoryCandidates[0].candidate_id;

    const acceptedResponse = await fetch(`http://127.0.0.1:${port}/arena/memory-candidates/${candidateId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        review_status: 'accepted',
        review_rationale: 'HTTP runtime-only acceptance for readiness prep.',
        review_source: 'phase4d_http_verifier',
        reviewer_mode: 'human'
      })
    });
    assert(acceptedResponse.status === 201, 'Expected accepted HTTP review write for Phase 4D verification');

    const candidateGetResponse = await fetch(`http://127.0.0.1:${port}/arena/memory-candidates/${candidateId}`);
    assert(candidateGetResponse.ok, 'Expected GET /arena/memory-candidates/:id to return 200 in Phase 4D');
    const candidatePayload = await candidateGetResponse.json();
    assert(candidatePayload.export_readiness_status === 'ready_for_export_review', 'Expected HTTP candidate payload to expose ready_for_export_review');
    assert(Array.isArray(candidatePayload.export_blockers) && candidatePayload.export_blockers.length === 0, 'Expected HTTP candidate payload to expose no blockers for ready candidate');
    assert(candidatePayload.export_readiness.export_executed === false, 'Expected HTTP candidate payload to keep export execution false');
    assert(candidatePayload.export_readiness.registry_mutation === false, 'Expected HTTP candidate payload to keep registry mutation false');

    const candidateListResponse = await fetch(`http://127.0.0.1:${port}/arena/memory-candidates`);
    assert(candidateListResponse.ok, 'Expected GET /arena/memory-candidates to return 200 in Phase 4D');
    const candidateListPayload = await candidateListResponse.json();
    const listedCandidate = candidateListPayload.items.find(item => item.candidate_id === candidateId);
    assert(listedCandidate && listedCandidate.export_readiness_status === 'ready_for_export_review', 'Expected HTTP candidate list to expose readiness status');
    assert(listedCandidate.export_blocker_count === 0, 'Expected HTTP candidate list to expose zero blockers for ready candidate');
  } finally {
    serverProcess.kill();
  }
}

async function main() {
  verifyFilesExist();
  verifyNoScopeDrift();
  verifyExistingPhases();
  verifyReadinessRuntime();
  await verifyHttpSurface();
  console.log('Phase 4D export readiness verification passed.');
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
