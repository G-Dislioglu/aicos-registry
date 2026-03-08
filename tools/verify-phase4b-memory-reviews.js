#!/usr/bin/env node
const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  DEFAULT_MEMORY_REVIEWS_DIR,
  executeArenaRun,
  listMemoryCandidates,
  listMemoryReviews,
  listReviewableCandidates,
  readMemoryCandidate,
  readMemoryReview,
  reviewMemoryCandidate
} = require('./arena-lib');

const ROOT_DIR = path.join(__dirname, '..');
const REQUIRED_FILES = [
  path.join(ROOT_DIR, 'PHASE4B_IMPLEMENTATION_PLAN.md'),
  path.join(ROOT_DIR, 'PHASE4B_MEMORY_REVIEW_SURFACE.md'),
  path.join(ROOT_DIR, 'tools', 'memory-review-lib.js'),
  path.join(ROOT_DIR, 'tools', 'verify-phase4b-memory-reviews.js'),
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
const PHASE4B_JS_FILES = [
  path.join(ROOT_DIR, 'tools', 'arena-lib.js'),
  path.join(ROOT_DIR, 'tools', 'arena.js'),
  path.join(ROOT_DIR, 'tools', 'arena-server.js'),
  path.join(ROOT_DIR, 'tools', 'memory-review-lib.js'),
  path.join(ROOT_DIR, 'tools', 'verify-phase4b-memory-reviews.js')
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
    assert(fs.existsSync(filePath), `Missing required Phase 4B file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyNoScopeDrift() {
  for (const filePath of PHASE4B_JS_FILES) {
    const content = fs.readFileSync(filePath, 'utf-8');
    for (const pattern of DISALLOWED_PATTERNS) {
      assert(!content.includes(pattern), `Disallowed Phase 4B pattern ${pattern} found in ${path.relative(ROOT_DIR, filePath)}`);
    }
  }
}

async function verifyReviewRuntime() {
  const registryBefore = snapshotRegistry();
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4b-runs-'));
  const tempAuditDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4b-audit-'));
  const tempMemoryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4b-memory-'));
  const tempReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4b-reviews-'));

  const persisted = executeArenaRun({
    question: 'Create reviewable memory candidates',
    q: 'registry',
    type: 'solution_proof',
    profile: 'review_strict',
    memory_proposals: true,
    memory_tags: ['phase4b', 'review-ready']
  }, { outputDir: tempRunsDir, auditOutputDir: tempAuditDir, memoryOutputDir: tempMemoryDir, memoryReviewOutputDir: tempReviewDir });

  assert(Array.isArray(persisted.memoryCandidateFilePaths) && persisted.memoryCandidateFilePaths.length >= 1, 'Expected persisted Phase 4B memory candidates');

  const listedBeforeReview = listMemoryCandidates({ memoryOutputDir: tempMemoryDir, memoryReviewOutputDir: tempReviewDir });
  assert(listedBeforeReview.length >= 1, 'Expected listMemoryCandidates to return reviewable candidates');
  assert(listedBeforeReview[0].current_status === 'proposal_only', 'Expected current status to start at proposal_only');

  const reviewableBefore = listReviewableCandidates({ memoryOutputDir: tempMemoryDir, memoryReviewOutputDir: tempReviewDir });
  assert(reviewableBefore.length >= 1, 'Expected reviewable candidate list before review');

  const firstCandidateId = listedBeforeReview[0].candidate_id;
  const reviewResult = reviewMemoryCandidate(firstCandidateId, {
    review_status: 'accepted',
    review_rationale: 'Manual runtime-only acceptance for follow-up tracking.',
    review_source: 'phase4b_verifier',
    reviewer_mode: 'human',
    confidence: 'medium',
    review_notes: ['accepted remains runtime-only']
  }, { memoryOutputDir: tempMemoryDir, memoryReviewOutputDir: tempReviewDir });

  assert(reviewResult.reviewFilePath.startsWith(tempReviewDir), 'Expected review record outside registry');
  assert(reviewResult.reviewRecord.review_status === 'accepted', 'Expected accepted review record');
  assert(reviewResult.reviewRecord.audit_meta.registry_mutation === false, 'Expected review record to keep registry_mutation false');
  assert(reviewResult.reviewRecord.audit_meta.promotion_executed === false, 'Expected review record to keep promotion_executed false');

  const loadedCandidate = readMemoryCandidate(firstCandidateId, { memoryOutputDir: tempMemoryDir, memoryReviewOutputDir: tempReviewDir });
  assert(loadedCandidate.status === 'proposal_only', 'Expected stored candidate record to remain proposal_only');
  assert(loadedCandidate.current_status === 'accepted', 'Expected derived candidate status to reflect accepted review state');
  assert(loadedCandidate.review_summary.current_status === 'accepted', 'Expected review summary to reflect accepted status');
  assert(loadedCandidate.review_summary.registry_mutation === false, 'Expected review summary to preserve registry boundary');
  assert(loadedCandidate.review_summary.promotion_executed === false, 'Expected review summary to preserve promotion boundary');

  const reviews = listMemoryReviews({ memoryReviewOutputDir: tempReviewDir });
  assert(reviews.length >= 1, 'Expected stored memory reviews');
  const loadedReview = readMemoryReview(reviews[0].review_id, { memoryReviewOutputDir: tempReviewDir });
  assert(loadedReview && loadedReview.candidate_id === firstCandidateId, 'Expected review readback to preserve candidate linkage');

  const reviewableAfter = listReviewableCandidates({ memoryOutputDir: tempMemoryDir, memoryReviewOutputDir: tempReviewDir });
  assert(!reviewableAfter.some(item => item.candidate_id === firstCandidateId && item.current_status === 'accepted'), 'Expected accepted candidate to drop from reviewable listing');

  const registryAfter = snapshotRegistry();
  assert(JSON.stringify(registryBefore) === JSON.stringify(registryAfter), 'Registry files changed during Phase 4B verification');
}

async function verifyHttpSurface() {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4b-http-runs-'));
  const tempAuditDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4b-http-audit-'));
  const tempMemoryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4b-http-memory-'));
  const tempReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4b-http-reviews-'));
  const port = 3242;
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
    const createResponse = await fetch(`http://127.0.0.1:${port}/arena/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Phase 4B HTTP probe',
        q: 'registry',
        type: 'solution_proof',
        profile: 'review_strict',
        memory_proposals: true,
        memory_tags: ['http-phase4b']
      })
    });
    assert(createResponse.status === 201, 'Expected POST /arena/runs to return 201');
    const createdRun = await createResponse.json();
    assert(createdRun.packet.memory_candidates.count >= 1, 'Expected HTTP-created run to include memory candidates');

    const reviewableResponse = await fetch(`http://127.0.0.1:${port}/arena/memory-candidates/reviewable`);
    assert(reviewableResponse.ok, 'Expected GET /arena/memory-candidates/reviewable to return 200');
    const reviewablePayload = await reviewableResponse.json();
    assert(Array.isArray(reviewablePayload.items) && reviewablePayload.items.length >= 1, 'Expected reviewable candidates over HTTP');

    const candidateId = reviewablePayload.items[0].candidate_id;
    const createReviewResponse = await fetch(`http://127.0.0.1:${port}/arena/memory-candidates/${candidateId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        review_status: 'accepted',
        review_rationale: 'HTTP runtime-only acceptance.',
        review_source: 'phase4b_http_verifier',
        reviewer_mode: 'human',
        confidence: 'medium',
        review_notes: ['runtime only over http']
      })
    });
    assert(createReviewResponse.status === 201, 'Expected POST /arena/memory-candidates/:id/reviews to return 201');
    const createdReview = await createReviewResponse.json();
    assert(createdReview.reviewRecord.review_status === 'accepted', 'Expected HTTP review record to be accepted');

    const reviewListResponse = await fetch(`http://127.0.0.1:${port}/arena/memory-reviews`);
    assert(reviewListResponse.ok, 'Expected GET /arena/memory-reviews to return 200');
    const reviewListPayload = await reviewListResponse.json();
    assert(Array.isArray(reviewListPayload.items) && reviewListPayload.items.length >= 1, 'Expected HTTP review list to return stored review records');

    const reviewId = reviewListPayload.items[0].review_id;
    const reviewGetResponse = await fetch(`http://127.0.0.1:${port}/arena/memory-reviews/${reviewId}`);
    assert(reviewGetResponse.ok, 'Expected GET /arena/memory-reviews/:id to return 200');
    const reviewGetPayload = await reviewGetResponse.json();
    assert(reviewGetPayload.candidate_id === candidateId, 'Expected HTTP review readback to preserve candidate linkage');

    const candidateGetResponse = await fetch(`http://127.0.0.1:${port}/arena/memory-candidates/${candidateId}`);
    assert(candidateGetResponse.ok, 'Expected GET /arena/memory-candidates/:id to return 200');
    const candidatePayload = await candidateGetResponse.json();
    assert(candidatePayload.status === 'proposal_only', 'Expected HTTP candidate payload to keep stored candidate proposal_only');
    assert(candidatePayload.current_status === 'accepted', 'Expected HTTP candidate payload to expose accepted runtime state');
    assert(candidatePayload.review_summary.promotion_executed === false, 'Expected HTTP candidate payload to keep promotion boundary false');
    assert(candidatePayload.source_run_id === createdRun.packet.run_id, 'Expected HTTP candidate payload to preserve source run linkage');
  } finally {
    serverProcess.kill();
  }
}

async function main() {
  verifyFilesExist();
  verifyNoScopeDrift();
  await verifyReviewRuntime();
  await verifyHttpSurface();
  assert(DEFAULT_MEMORY_REVIEWS_DIR.includes(path.join('runtime', 'memory-reviews')), 'Expected default memory review directory outside registry files');
  console.log('Phase 4B memory-review verification passed.');
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
