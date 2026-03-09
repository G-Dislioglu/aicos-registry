#!/usr/bin/env node
const { spawn, spawnSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  DEFAULT_MEC_REVIEWS_DIR,
  createMecCandidateRecord,
  createMecEvent,
  listMecCandidates,
  listMecReviews,
  readMecCandidate,
  readMecReview,
  reviewMecCandidate
} = require('./arena-lib');

const ROOT_DIR = path.join(__dirname, '..');
const REQUIRED_FILES = [
  path.join(ROOT_DIR, 'MEC_ARCHITECTURE_LOCKED.md'),
  path.join(ROOT_DIR, 'MEC_MVP_PHASE_PLAN.md'),
  path.join(ROOT_DIR, 'MEC_PHASE3A_REVIEW_CORE_ACCEPTANCE.md'),
  path.join(ROOT_DIR, 'tools', 'mec-review-lib.js'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-phase3a-review-core.js'),
  path.join(ROOT_DIR, 'tools', 'arena-lib.js'),
  path.join(ROOT_DIR, 'tools', 'arena.js'),
  path.join(ROOT_DIR, 'tools', 'arena-server.js'),
  path.join(ROOT_DIR, 'web', 'mec-operator.html')
];
const REGISTRY_DIRS = [
  path.join(ROOT_DIR, 'cards'),
  path.join(ROOT_DIR, 'index'),
  path.join(ROOT_DIR, 'human'),
  path.join(ROOT_DIR, 'taxonomies')
];
const PHASE3A_FILES = [
  path.join(ROOT_DIR, 'tools', 'mec-review-lib.js'),
  path.join(ROOT_DIR, 'tools', 'arena-lib.js'),
  path.join(ROOT_DIR, 'tools', 'arena.js'),
  path.join(ROOT_DIR, 'tools', 'arena-server.js'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-phase3a-review-core.js'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-operator-ui-smoke.js'),
  path.join(ROOT_DIR, 'web', 'mec-operator.html')
];
const DISALLOWED_PATTERNS = [
  ['registry', 'write'].join('_'),
  ['institutional', 'memory'].join('_')
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

function runCli(args, options = {}) {
  const result = spawnSync(process.execPath, args, {
    cwd: ROOT_DIR,
    encoding: 'utf-8',
    env: {
      ...process.env,
      ...(options.env || {})
    }
  });
  assert(result.status === 0, `${args.join(' ')} failed: ${(result.stderr || result.stdout || '').trim()}`);
  return result.stdout.trim();
}

function runVerifier(relativePath) {
  const result = spawnSync(process.execPath, [relativePath], {
    cwd: ROOT_DIR,
    encoding: 'utf-8'
  });
  assert(result.status === 0, `${relativePath} failed: ${(result.stderr || result.stdout || '').trim()}`);
}

function verifyFilesExist() {
  for (const filePath of REQUIRED_FILES) {
    assert(fs.existsSync(filePath), `Missing required Phase 3A file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyNoScopeDrift() {
  for (const filePath of PHASE3A_FILES) {
    const content = fs.readFileSync(filePath, 'utf-8');
    for (const pattern of DISALLOWED_PATTERNS) {
      assert(!content.includes(pattern), `Disallowed Phase 3A pattern ${pattern} found in ${path.relative(ROOT_DIR, filePath)}`);
    }
  }
}

function verifyExistingPhases() {
  runVerifier(path.join('tools', 'verify-mec-phase2-candidates.js'));
  runVerifier(path.join('tools', 'verify-phase4b-memory-reviews.js'));
}

function verifyRuntimeCore() {
  const registryBefore = snapshotRegistry();
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase3a-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase3a-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase3a-reviews-'));

  const eventResult = createMecEvent({
    event_type: 'phase3a_probe',
    domain: 'mec_phase3a',
    summary: 'Phase 3A runtime review probe event',
    source_ref: 'verifier://phase3a/runtime',
    trace_ref: 'trace://phase3a/runtime',
    confidence: 'medium',
    privacy_class: 'internal',
    ttl_days: 7,
    priority_score: 0.7,
    salience_signals: ['phase3a', 'review']
  }, { eventOutputDir: tempEventDir });

  const stabilizeCandidate = createMecCandidateRecord({
    candidate_type: 'invariant_candidate',
    principle: 'Phase 3A stabilize runtime invariant',
    mechanism: 'Derived review state is separated from raw proposal artifacts',
    source_event_ids: [eventResult.event.id],
    fails_when: ['review record missing', 'read model mutates raw candidate'],
    edge_cases: ['single review record'],
    severity: 'medium',
    distillation_mode: 'manual'
  }, { candidateOutputDir: tempCandidateDir, eventOutputDir: tempEventDir });

  const rejectCandidate = createMecCandidateRecord({
    candidate_type: 'curiosity_candidate',
    principle: 'Phase 3A reject runtime curiosity',
    mechanism: 'Reject outcome remains runtime-only and derived',
    open_question: 'Should this curiosity remain unresolved forever?',
    domain: 'mec_phase3a',
    blind_spot_score: 0.4,
    source_event_ids: [eventResult.event.id],
    distillation_mode: 'manual'
  }, { candidateOutputDir: tempCandidateDir, eventOutputDir: tempEventDir });

  const listedBefore = listMecCandidates({ candidateOutputDir: tempCandidateDir, mecReviewOutputDir: tempMecReviewDir });
  assert(listedBefore.some(item => item.id === stabilizeCandidate.candidate.id && item.current_review_state === 'proposal_only'), 'Expected stabilize candidate to start as proposal_only in derived review state');
  assert(listedBefore.some(item => item.id === rejectCandidate.candidate.id && item.current_review_state === 'proposal_only'), 'Expected reject candidate to start as proposal_only in derived review state');

  const stabilized = reviewMecCandidate(stabilizeCandidate.candidate.id, {
    review_outcome: 'stabilize',
    review_rationale: 'Stabilize runtime-only candidate review core proof.',
    review_source: 'phase3a_runtime_verifier',
    reviewer_mode: 'human',
    confidence: 'medium',
    review_notes: ['stabilize remains runtime-only']
  }, { candidateOutputDir: tempCandidateDir, mecReviewOutputDir: tempMecReviewDir });
  assert(stabilized.reviewFilePath.startsWith(tempMecReviewDir), 'Expected MEC stabilize review record outside registry');
  assert(stabilized.reviewRecord.review_outcome === 'stabilize', 'Expected stabilize review outcome');
  assert(stabilized.reviewRecord.audit_meta.registry_mutation === false, 'Expected stabilize review record to preserve registry boundary');
  assert(stabilized.reviewRecord.audit_meta.raw_candidate_artifact_rewritten === false, 'Expected stabilize review record to preserve raw artifact boundary');

  const rejected = reviewMecCandidate(rejectCandidate.candidate.id, {
    review_outcome: 'reject',
    review_rationale: 'Reject runtime-only candidate review core proof.',
    review_source: 'phase3a_runtime_verifier',
    reviewer_mode: 'human',
    confidence: 'medium',
    review_notes: ['reject remains runtime-only']
  }, { candidateOutputDir: tempCandidateDir, mecReviewOutputDir: tempMecReviewDir });
  assert(rejected.reviewRecord.review_outcome === 'reject', 'Expected reject review outcome');

  const rawStabilizeCandidate = JSON.parse(fs.readFileSync(stabilizeCandidate.candidateFilePaths[0], 'utf-8'));
  const rawRejectCandidate = JSON.parse(fs.readFileSync(rejectCandidate.candidateFilePaths[0], 'utf-8'));
  assert(rawStabilizeCandidate.status === 'proposal_only', 'Expected stabilized raw candidate artifact to remain proposal_only');
  assert(rawRejectCandidate.status === 'proposal_only', 'Expected rejected raw candidate artifact to remain proposal_only');
  assert(!Object.prototype.hasOwnProperty.call(rawStabilizeCandidate, 'current_review_state'), 'Expected derived stabilize state to stay out of raw candidate artifact');
  assert(!Object.prototype.hasOwnProperty.call(rawRejectCandidate, 'current_review_state'), 'Expected derived reject state to stay out of raw candidate artifact');

  const loadedStabilizeCandidate = readMecCandidate(stabilizeCandidate.candidate.id, { candidateOutputDir: tempCandidateDir, mecReviewOutputDir: tempMecReviewDir });
  const loadedRejectCandidate = readMecCandidate(rejectCandidate.candidate.id, { candidateOutputDir: tempCandidateDir, mecReviewOutputDir: tempMecReviewDir });
  assert(loadedStabilizeCandidate.current_review_state === 'stabilize', 'Expected derived stabilize state on MEC candidate read model');
  assert(loadedRejectCandidate.current_review_state === 'reject', 'Expected derived reject state on MEC candidate read model');
  assert(loadedStabilizeCandidate.review_summary.review_count === 1, 'Expected stabilize candidate review count to be tracked');
  assert(loadedRejectCandidate.review_summary.review_count === 1, 'Expected reject candidate review count to be tracked');
  assert(loadedStabilizeCandidate.review_summary.registry_mutation === false, 'Expected derived stabilize state to preserve registry boundary');
  assert(loadedRejectCandidate.review_summary.promotion_executed === false, 'Expected derived reject state to preserve promotion boundary');

  const reviews = listMecReviews({ mecReviewOutputDir: tempMecReviewDir });
  assert(reviews.length === 2, 'Expected two stored MEC review records');
  assert(reviews.some(item => item.review_outcome === 'stabilize' && item.current_candidate_review_state === 'stabilize'), 'Expected MEC review list to expose stabilize state');
  assert(reviews.some(item => item.review_outcome === 'reject' && item.current_candidate_review_state === 'reject'), 'Expected MEC review list to expose reject state');

  const loadedReview = readMecReview(stabilized.reviewRecord.review_id, { mecReviewOutputDir: tempMecReviewDir });
  assert(loadedReview && loadedReview.candidate_id === stabilizeCandidate.candidate.id, 'Expected MEC review readback to preserve candidate linkage');

  const registryAfter = snapshotRegistry();
  assert(JSON.stringify(registryBefore) === JSON.stringify(registryAfter), 'Registry files changed during Phase 3A runtime verification');
}

function verifyCliSurface() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase3a-cli-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase3a-cli-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase3a-cli-reviews-'));

  const eventOutput = runCli([
    path.join('tools', 'arena.js'),
    'create-event',
    '--event-type', 'phase3a_cli_probe',
    '--domain', 'mec_phase3a',
    '--summary', 'Phase 3A CLI review event',
    '--source-ref', 'verifier://phase3a/cli',
    '--trace-ref', 'trace://phase3a/cli',
    '--event-dir', tempEventDir,
    '--json'
  ]);
  const createdEvent = JSON.parse(eventOutput);

  const candidateOutput = runCli([
    path.join('tools', 'arena.js'),
    'create-mec-candidate',
    '--candidate-type', 'curiosity_candidate',
    '--principle', 'Phase 3A CLI curiosity',
    '--mechanism', 'CLI review core remains runtime-only',
    '--open-question', 'Can CLI apply stabilize cleanly?',
    '--domain', 'mec_phase3a',
    '--blind-spot-score', '0.2',
    '--source-event-id', createdEvent.event.id,
    '--distillation-mode', 'manual',
    '--candidate-dir', tempCandidateDir,
    '--event-dir', tempEventDir,
    '--json'
  ]);
  const createdCandidate = JSON.parse(candidateOutput);

  const reviewOutput = runCli([
    path.join('tools', 'arena.js'),
    'review-mec-candidate',
    createdCandidate.candidate.id,
    '--review-outcome', 'stabilize',
    '--review-rationale', 'CLI stabilize proof.',
    '--review-source', 'phase3a_cli_verifier',
    '--candidate-dir', tempCandidateDir,
    '--mec-review-dir', tempMecReviewDir,
    '--json'
  ]);
  const createdReview = JSON.parse(reviewOutput);
  assert(createdReview.reviewRecord.review_outcome === 'stabilize', 'Expected CLI MEC review outcome to be stabilize');

  const listedCandidates = JSON.parse(runCli([
    path.join('tools', 'arena.js'),
    'list-mec-candidates',
    '--candidate-dir', tempCandidateDir,
    '--mec-review-dir', tempMecReviewDir,
    '--json'
  ]));
  assert(Array.isArray(listedCandidates) && listedCandidates.some(item => item.id === createdCandidate.candidate.id && item.current_review_state === 'stabilize'), 'Expected CLI candidate list to expose derived stabilize state');

  const listedReviews = JSON.parse(runCli([
    path.join('tools', 'arena.js'),
    'list-mec-reviews',
    '--mec-review-dir', tempMecReviewDir,
    '--json'
  ]));
  assert(Array.isArray(listedReviews) && listedReviews.length === 1, 'Expected CLI MEC review list to return one review');

  const loadedCandidate = JSON.parse(runCli([
    path.join('tools', 'arena.js'),
    'get-mec-candidate',
    createdCandidate.candidate.id,
    '--candidate-dir', tempCandidateDir,
    '--mec-review-dir', tempMecReviewDir,
    '--json'
  ]));
  assert(loadedCandidate.status === 'proposal_only', 'Expected CLI candidate detail to keep raw status proposal_only');
  assert(loadedCandidate.current_review_state === 'stabilize', 'Expected CLI candidate detail to expose derived stabilize state');

  const loadedReview = JSON.parse(runCli([
    path.join('tools', 'arena.js'),
    'get-mec-review',
    createdReview.reviewRecord.review_id,
    '--mec-review-dir', tempMecReviewDir,
    '--json'
  ]));
  assert(loadedReview.candidate_id === createdCandidate.candidate.id, 'Expected CLI MEC review detail to preserve candidate linkage');
}

async function verifyHttpSurface() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase3a-http-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase3a-http-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase3a-http-reviews-'));
  const port = 3347;
  const serverProcess = spawn(process.execPath, ['tools/arena-server.js'], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      PORT: String(port),
      MEC_EVENT_DIR: tempEventDir,
      MEC_CANDIDATE_DIR: tempCandidateDir,
      MEC_REVIEW_DIR: tempMecReviewDir
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timed out waiting for arena-server to start for Phase 3A HTTP verification'));
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
    assert(healthResponse.ok, 'Expected GET /arena/health to return 200 for Phase 3A HTTP verification');
    const healthPayload = await healthResponse.json();
    assert(String(healthPayload.mec_review_output_dir || '').includes('phase3a-http-reviews'), 'Expected health payload to expose MEC review output dir');

    const eventResponse = await fetch(`http://127.0.0.1:${port}/arena/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'phase3a_http_probe',
        domain: 'mec_phase3a',
        summary: 'Phase 3A HTTP review event',
        source_ref: 'verifier://phase3a/http',
        trace_ref: 'trace://phase3a/http'
      })
    });
    assert(eventResponse.status === 201, 'Expected POST /arena/events to return 201');
    const createdEvent = await eventResponse.json();

    const candidateResponse = await fetch(`http://127.0.0.1:${port}/arena/mec-candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidate_type: 'curiosity_candidate',
        principle: 'Phase 3A HTTP candidate',
        mechanism: 'HTTP review core remains derived/runtime-side',
        open_question: 'Can HTTP apply reject cleanly?',
        domain: 'mec_phase3a',
        blind_spot_score: 0.3,
        source_event_ids: [createdEvent.event.id],
        distillation_mode: 'manual'
      })
    });
    assert(candidateResponse.status === 201, 'Expected POST /arena/mec-candidates to return 201');
    const createdCandidate = await candidateResponse.json();

    const reviewResponse = await fetch(`http://127.0.0.1:${port}/arena/mec-candidates/${createdCandidate.candidate.id}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        review_outcome: 'reject',
        review_rationale: 'HTTP reject proof.',
        review_source: 'phase3a_http_verifier',
        reviewer_mode: 'human'
      })
    });
    assert(reviewResponse.status === 201, 'Expected POST /arena/mec-candidates/:id/reviews to return 201');
    const createdReview = await reviewResponse.json();
    assert(createdReview.reviewRecord.review_outcome === 'reject', 'Expected HTTP MEC review outcome to be reject');

    const candidateGetResponse = await fetch(`http://127.0.0.1:${port}/arena/mec-candidates/${createdCandidate.candidate.id}`);
    assert(candidateGetResponse.ok, 'Expected GET /arena/mec-candidates/:id to return 200');
    const candidatePayload = await candidateGetResponse.json();
    assert(candidatePayload.status === 'proposal_only', 'Expected HTTP MEC candidate detail to keep raw status proposal_only');
    assert(candidatePayload.current_review_state === 'reject', 'Expected HTTP MEC candidate detail to expose derived reject state');
    assert(candidatePayload.review_summary.review_count === 1, 'Expected HTTP MEC candidate detail to expose review count');

    const reviewListResponse = await fetch(`http://127.0.0.1:${port}/arena/mec-reviews`);
    assert(reviewListResponse.ok, 'Expected GET /arena/mec-reviews to return 200');
    const reviewListPayload = await reviewListResponse.json();
    assert(Array.isArray(reviewListPayload.items) && reviewListPayload.items.length === 1, 'Expected HTTP MEC review list to return one review');

    const reviewGetResponse = await fetch(`http://127.0.0.1:${port}/arena/mec-reviews/${createdReview.reviewRecord.review_id}`);
    assert(reviewGetResponse.ok, 'Expected GET /arena/mec-reviews/:id to return 200');
    const reviewGetPayload = await reviewGetResponse.json();
    assert(reviewGetPayload.candidate_id === createdCandidate.candidate.id, 'Expected HTTP MEC review readback to preserve candidate linkage');
  } finally {
    serverProcess.kill();
  }
}

function verifyOperatorSurface() {
  runVerifier(path.join('tools', 'verify-mec-operator-ui-smoke.js'));
}

async function main() {
  verifyFilesExist();
  verifyNoScopeDrift();
  verifyExistingPhases();
  verifyRuntimeCore();
  verifyCliSurface();
  await verifyHttpSurface();
  verifyOperatorSurface();
  assert(DEFAULT_MEC_REVIEWS_DIR.includes(path.join('runtime', 'mec-reviews')), 'Expected default MEC review directory outside registry files');
  console.log('MEC Phase 3A review-core verification passed.');
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
