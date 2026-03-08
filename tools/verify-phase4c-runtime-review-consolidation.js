#!/usr/bin/env node
const { spawn, spawnSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  executeArenaRun,
  listMemoryReviews,
  readMemoryCandidate,
  reviewMemoryCandidate
} = require('./arena-lib');

const ROOT_DIR = path.join(__dirname, '..');
const REQUIRED_FILES = [
  path.join(ROOT_DIR, 'PHASE4C_IMPLEMENTATION_PLAN.md'),
  path.join(ROOT_DIR, 'PHASE4C_RUNTIME_REVIEW_CONSOLIDATION.md'),
  path.join(ROOT_DIR, 'tools', 'memory-review-lib.js'),
  path.join(ROOT_DIR, 'tools', 'verify-phase4c-runtime-review-consolidation.js'),
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
const PHASE4C_FILES = [
  path.join(ROOT_DIR, 'tools', 'memory-review-lib.js'),
  path.join(ROOT_DIR, 'tools', 'arena-lib.js'),
  path.join(ROOT_DIR, 'tools', 'arena.js'),
  path.join(ROOT_DIR, 'tools', 'arena-server.js'),
  path.join(ROOT_DIR, 'tools', 'verify-phase4c-runtime-review-consolidation.js')
];
const DISALLOWED_PATTERNS = [
  ['memory', 'promotion'].join('_'),
  ['institutional', 'memory'].join('_'),
  ['export', 'pipeline'].join('_'),
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
    assert(fs.existsSync(filePath), `Missing required Phase 4C file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyNoScopeDrift() {
  for (const filePath of PHASE4C_FILES) {
    const content = fs.readFileSync(filePath, 'utf-8');
    for (const pattern of DISALLOWED_PATTERNS) {
      assert(!content.includes(pattern), `Disallowed Phase 4C pattern ${pattern} found in ${path.relative(ROOT_DIR, filePath)}`);
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
}

function verifyRuntimeConsolidation() {
  const registryBefore = snapshotRegistry();
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4c-runs-'));
  const tempAuditDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4c-audit-'));
  const tempMemoryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4c-memory-'));
  const tempReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4c-reviews-'));

  const persisted = executeArenaRun({
    question: 'Create consolidated review candidate',
    q: 'registry',
    type: 'solution_proof',
    profile: 'review_strict',
    memory_proposals: true,
    memory_tags: ['phase4c', 'consolidation']
  }, { outputDir: tempRunsDir, auditOutputDir: tempAuditDir, memoryOutputDir: tempMemoryDir, memoryReviewOutputDir: tempReviewDir });

  assert(Array.isArray(persisted.memoryCandidateFilePaths) && persisted.memoryCandidateFilePaths.length >= 1, 'Expected persisted Phase 4C memory candidates');
  const candidateId = persisted.memoryCandidates[0].candidate_id;

  const reviewedResult = reviewMemoryCandidate(candidateId, {
    review_status: 'reviewed',
    review_rationale: 'Manual runtime review completed before terminal decision.',
    review_source: 'phase4c_verifier',
    reviewer_mode: 'human',
    confidence: 'medium',
    review_notes: ['intermediate review state']
  }, { memoryOutputDir: tempMemoryDir, memoryReviewOutputDir: tempReviewDir });

  assert(reviewedResult.candidate.current_status === 'reviewed', 'Expected intermediate review state to be derived as reviewed');
  assert(reviewedResult.candidate.review_summary.reviewable === true, 'Expected reviewed candidate to remain reviewable');
  assert(reviewedResult.candidate.status_derivation.rule === 'latest_valid_review_wins', 'Expected explicit status derivation rule on candidate read model');

  const acceptedResult = reviewMemoryCandidate(candidateId, {
    review_status: 'accepted',
    review_rationale: 'Terminal runtime-only acceptance after review consolidation.',
    review_source: 'phase4c_verifier',
    reviewer_mode: 'human',
    confidence: 'high',
    review_notes: ['terminal runtime-only state']
  }, { memoryOutputDir: tempMemoryDir, memoryReviewOutputDir: tempReviewDir });

  assert(acceptedResult.candidate.status === 'proposal_only', 'Expected stored candidate status to remain proposal_only');
  assert(acceptedResult.candidate.current_status === 'accepted', 'Expected latest valid review to drive current status');
  assert(acceptedResult.candidate.review_summary.review_count === 2, 'Expected both review records to be counted');
  assert(acceptedResult.candidate.review_summary.status_counts.reviewed === 1, 'Expected reviewed count to be tracked');
  assert(acceptedResult.candidate.review_summary.status_counts.accepted === 1, 'Expected accepted count to be tracked');
  assert(acceptedResult.candidate.review_summary.terminal === true, 'Expected accepted to be terminal');
  assert(acceptedResult.candidate.review_summary.reviewable === false, 'Expected accepted to be non-reviewable');
  assert(acceptedResult.candidate.review_summary.promotion_executed === false, 'Expected promotion boundary to remain false');
  assert(acceptedResult.candidate.review_summary.registry_mutation === false, 'Expected registry mutation boundary to remain false');

  const loadedCandidate = readMemoryCandidate(candidateId, { memoryOutputDir: tempMemoryDir, memoryReviewOutputDir: tempReviewDir });
  assert(loadedCandidate.review_summary.status_history.length === 2, 'Expected status history to expose both valid review steps');
  assert(loadedCandidate.status_derivation.terminal === true, 'Expected explicit terminal flag in status derivation');

  const listedReviews = listMemoryReviews({ memoryReviewOutputDir: tempReviewDir });
  assert(listedReviews.length === 2, 'Expected two stored Phase 4C reviews');
  assert(listedReviews.some(item => item.review_status === 'reviewed' && item.superseded === true), 'Expected intermediate reviewed record to be superseded');
  assert(listedReviews.some(item => item.review_status === 'accepted' && item.superseded === false), 'Expected latest accepted review to be active');

  let blocked = false;
  try {
    reviewMemoryCandidate(candidateId, {
      review_status: 'rejected',
      review_rationale: 'This should be blocked after terminal acceptance.',
      review_source: 'phase4c_verifier',
      reviewer_mode: 'human'
    }, { memoryOutputDir: tempMemoryDir, memoryReviewOutputDir: tempReviewDir });
  } catch (error) {
    blocked = error.code === 'memory_candidate_not_reviewable' && error.current_status === 'accepted';
  }
  assert(blocked, 'Expected additional review writes to be blocked after terminal runtime status');

  const reviewFiles = fs.readdirSync(tempReviewDir).filter(file => file.endsWith('.json'));
  const candidateFiles = fs.readdirSync(tempMemoryDir).filter(file => file.endsWith('.json'));
  assert(reviewFiles.length === 2, 'Expected review files to stay in the review directory');
  assert(candidateFiles.length >= 1, 'Expected candidate files to stay in the candidate directory');

  const registryAfter = snapshotRegistry();
  assert(JSON.stringify(registryBefore) === JSON.stringify(registryAfter), 'Registry files changed during Phase 4C verification');
}

async function verifyHttpSurface() {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4c-http-runs-'));
  const tempAuditDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4c-http-audit-'));
  const tempMemoryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4c-http-memory-'));
  const tempReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4c-http-reviews-'));
  const port = 3243;
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
        question: 'Phase 4C HTTP probe',
        q: 'registry',
        type: 'solution_proof',
        profile: 'review_strict',
        memory_proposals: true,
        memory_tags: ['http-phase4c']
      })
    });
    assert(createRunResponse.status === 201, 'Expected POST /arena/runs to return 201 for Phase 4C HTTP verification');
    const createdRun = await createRunResponse.json();
    const candidateId = createdRun.memoryCandidates[0].candidate_id;

    const reviewedResponse = await fetch(`http://127.0.0.1:${port}/arena/memory-candidates/${candidateId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        review_status: 'reviewed',
        review_rationale: 'HTTP review step before terminal decision.',
        review_source: 'phase4c_http_verifier',
        reviewer_mode: 'human'
      })
    });
    assert(reviewedResponse.status === 201, 'Expected reviewed HTTP write to succeed');

    const acceptedResponse = await fetch(`http://127.0.0.1:${port}/arena/memory-candidates/${candidateId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        review_status: 'accepted',
        review_rationale: 'HTTP terminal runtime-only acceptance.',
        review_source: 'phase4c_http_verifier',
        reviewer_mode: 'human'
      })
    });
    assert(acceptedResponse.status === 201, 'Expected accepted HTTP write to succeed');

    const candidateGetResponse = await fetch(`http://127.0.0.1:${port}/arena/memory-candidates/${candidateId}`);
    assert(candidateGetResponse.ok, 'Expected GET /arena/memory-candidates/:id to return 200 in Phase 4C');
    const candidatePayload = await candidateGetResponse.json();
    assert(candidatePayload.current_status === 'accepted', 'Expected HTTP candidate payload to show accepted runtime state');
    assert(candidatePayload.status === 'proposal_only', 'Expected HTTP candidate payload to preserve stored proposal_only state');
    assert(candidatePayload.status_derivation.rule === 'latest_valid_review_wins', 'Expected HTTP candidate payload to expose derivation rule');
    assert(candidatePayload.review_summary.terminal === true, 'Expected HTTP candidate payload to expose terminal state');

    const reviewListResponse = await fetch(`http://127.0.0.1:${port}/arena/memory-reviews`);
    assert(reviewListResponse.ok, 'Expected GET /arena/memory-reviews to return 200 in Phase 4C');
    const reviewListPayload = await reviewListResponse.json();
    assert(reviewListPayload.items.some(item => item.review_status === 'reviewed' && item.superseded === true), 'Expected HTTP review list to mark reviewed record as superseded');
    assert(reviewListPayload.items.some(item => item.review_status === 'accepted' && item.superseded === false), 'Expected HTTP review list to keep accepted record active');

    const blockedResponse = await fetch(`http://127.0.0.1:${port}/arena/memory-candidates/${candidateId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        review_status: 'rejected',
        review_rationale: 'Should fail after terminal state.',
        review_source: 'phase4c_http_verifier',
        reviewer_mode: 'human'
      })
    });
    assert(blockedResponse.status === 409, 'Expected terminal candidate to reject further HTTP review writes with 409');

    const blockedPayload = await blockedResponse.json();
    assert(blockedPayload.error === 'memory_candidate_not_reviewable', 'Expected explicit not-reviewable HTTP error after terminal state');
  } finally {
    serverProcess.kill();
  }
}

async function main() {
  verifyFilesExist();
  verifyNoScopeDrift();
  verifyExistingPhases();
  verifyRuntimeConsolidation();
  await verifyHttpSurface();
  console.log('Phase 4C runtime review consolidation verification passed.');
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
