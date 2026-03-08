#!/usr/bin/env node
const { spawn, spawnSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  executeArenaRun,
  createExportReviewForCandidate,
  listExportReviews,
  listMemoryCandidates,
  readExportReview,
  readMemoryCandidate,
  reviewMemoryCandidate
} = require('./arena-lib');

const ROOT_DIR = path.join(__dirname, '..');
const REQUIRED_FILES = [
  path.join(ROOT_DIR, 'PHASE4E_IMPLEMENTATION_PLAN.md'),
  path.join(ROOT_DIR, 'PHASE4E_EXPORT_REVIEW_GATE_RECORDS.md'),
  path.join(ROOT_DIR, 'tools', 'memory-export-review-lib.js'),
  path.join(ROOT_DIR, 'tools', 'verify-phase4e-export-review-gate-records.js'),
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
const PHASE4E_FILES = [
  path.join(ROOT_DIR, 'tools', 'memory-export-review-lib.js'),
  path.join(ROOT_DIR, 'tools', 'arena-lib.js'),
  path.join(ROOT_DIR, 'tools', 'arena.js'),
  path.join(ROOT_DIR, 'tools', 'arena-server.js'),
  path.join(ROOT_DIR, 'tools', 'verify-phase4e-export-review-gate-records.js')
];
const DISALLOWED_PATTERNS = [
  ['institutional', 'memory'].join('_'),
  ['specialist', 'role'].join('_'),
  ['final', 'judge'].join('_'),
  ['export', 'pipeline'].join('_')
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
    assert(fs.existsSync(filePath), `Missing required Phase 4E file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyNoScopeDrift() {
  for (const filePath of PHASE4E_FILES) {
    const content = fs.readFileSync(filePath, 'utf-8');
    for (const pattern of DISALLOWED_PATTERNS) {
      assert(!content.includes(pattern), `Disallowed Phase 4E pattern ${pattern} found in ${path.relative(ROOT_DIR, filePath)}`);
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
  runVerifier(path.join('tools', 'verify-phase4d-export-readiness.js'));
}

function pickCandidate(memoryCandidates, candidateType) {
  return memoryCandidates.find(candidate => candidate.candidate_type === candidateType) || null;
}

function verifyExportReviewRuntime() {
  const registryBefore = snapshotRegistry();
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4e-runs-'));
  const tempAuditDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4e-audit-'));
  const tempMemoryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4e-memory-'));
  const tempReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4e-reviews-'));
  const tempExportReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4e-export-reviews-'));

  const persisted = executeArenaRun({
    question: 'Create Phase 4E export review candidates',
    q: 'registry',
    type: 'solution_proof',
    profile: 'review_strict',
    memory_proposals: true,
    memory_tags: ['phase4e', 'export-review']
  }, { outputDir: tempRunsDir, auditOutputDir: tempAuditDir, memoryOutputDir: tempMemoryDir, memoryReviewOutputDir: tempReviewDir });

  assert(Array.isArray(persisted.memoryCandidates) && persisted.memoryCandidates.length >= 1, 'Expected persisted Phase 4E memory candidates');

  const registryGroundedCandidate = pickCandidate(persisted.memoryCandidates, 'registry_grounded_observation') || persisted.memoryCandidates[0];
  const evidenceGapCandidate = pickCandidate(persisted.memoryCandidates, 'evidence_gap_followup');

  const blockedReview = createExportReviewForCandidate(registryGroundedCandidate.candidate_id, {
    export_review_rationale: 'Candidate is still not formally ready for export review.',
    review_source: 'phase4e_verifier',
    reviewer_mode: 'human',
    proof_notes: ['review attempted before terminal acceptance']
  }, { memoryOutputDir: tempMemoryDir, memoryReviewOutputDir: tempReviewDir, exportReviewOutputDir: tempExportReviewDir });

  assert(blockedReview.exportReviewRecord.export_review_status === 'blocked', 'Expected unreveiwed candidate export review to be blocked');
  assert(blockedReview.candidate.status === 'proposal_only', 'Expected candidate file state to remain proposal_only after blocked export review');
  assert(blockedReview.candidate.current_export_review_status === 'blocked', 'Expected candidate read model to expose blocked export review status');

  const acceptedRegistryCandidate = reviewMemoryCandidate(registryGroundedCandidate.candidate_id, {
    review_status: 'accepted',
    review_rationale: 'Runtime acceptance before formal export-review record creation.',
    review_source: 'phase4e_verifier',
    reviewer_mode: 'human',
    confidence: 'high'
  }, { memoryOutputDir: tempMemoryDir, memoryReviewOutputDir: tempReviewDir, exportReviewOutputDir: tempExportReviewDir });

  assert(acceptedRegistryCandidate.candidate.export_readiness_status === 'ready_for_export_review', 'Expected accepted candidate to remain ready_for_export_review before export review record');

  const approvedReview = createExportReviewForCandidate(registryGroundedCandidate.candidate_id, {
    export_review_rationale: 'Candidate satisfies runtime export-readiness and is approved for export review discussion.',
    review_source: 'phase4e_verifier',
    reviewer_mode: 'human',
    proof_notes: ['terminal acceptance exists'],
    gate_notes: ['boundary preserved', 'no blockers observed']
  }, { memoryOutputDir: tempMemoryDir, memoryReviewOutputDir: tempReviewDir, exportReviewOutputDir: tempExportReviewDir });

  assert(approvedReview.exportReviewRecord.export_review_status === 'approved_for_export_review', 'Expected ready candidate export review to be approved_for_export_review');
  assert(approvedReview.exportReviewRecord.audit_meta.registry_mutation === false, 'Expected export review audit boundary to preserve registry mutation false');
  assert(approvedReview.exportReviewRecord.audit_meta.export_executed === false, 'Expected export review audit boundary to preserve export execution false');
  assert(approvedReview.candidate.current_export_review_status === 'approved_for_export_review', 'Expected candidate read model to expose approved export review status');
  assert(approvedReview.candidate.export_review_summary.export_review_count === 2, 'Expected candidate export review summary to count both blocked and approved export reviews');

  if (evidenceGapCandidate) {
    reviewMemoryCandidate(evidenceGapCandidate.candidate_id, {
      review_status: 'accepted',
      review_rationale: 'Accepted runtime-only but still evidence-gapped.',
      review_source: 'phase4e_verifier',
      reviewer_mode: 'human',
      confidence: 'medium'
    }, { memoryOutputDir: tempMemoryDir, memoryReviewOutputDir: tempReviewDir, exportReviewOutputDir: tempExportReviewDir });

    const evidenceReview = createExportReviewForCandidate(evidenceGapCandidate.candidate_id, {
      export_review_rationale: 'Candidate still needs more evidence before export review discussion.',
      review_source: 'phase4e_verifier',
      reviewer_mode: 'human',
      gate_notes: ['evidence gap still present']
    }, { memoryOutputDir: tempMemoryDir, memoryReviewOutputDir: tempReviewDir, exportReviewOutputDir: tempExportReviewDir });

    assert(evidenceReview.exportReviewRecord.export_review_status === 'needs_more_evidence', 'Expected evidence-gap candidate export review to remain needs_more_evidence');
  }

  const listedCandidates = listMemoryCandidates({ memoryOutputDir: tempMemoryDir, memoryReviewOutputDir: tempReviewDir, exportReviewOutputDir: tempExportReviewDir });
  const listedRegistryCandidate = listedCandidates.find(item => item.candidate_id === registryGroundedCandidate.candidate_id);
  assert(listedRegistryCandidate.current_export_review_status === 'approved_for_export_review', 'Expected memory candidate list to expose current export review status');
  assert(listedRegistryCandidate.export_review_count === 2, 'Expected memory candidate list to expose export review count');

  const listedExportReviews = listExportReviews({ exportReviewOutputDir: tempExportReviewDir });
  assert(listedExportReviews.length >= 2, 'Expected export review listing to return stored records');
  const latestReview = listedExportReviews.find(item => item.export_review_id === approvedReview.exportReviewRecord.export_review_id);
  assert(latestReview && latestReview.superseded === false, 'Expected latest export review record to be non-superseded');
  const blockedListedReview = listedExportReviews.find(item => item.export_review_id === blockedReview.exportReviewRecord.export_review_id);
  assert(blockedListedReview && blockedListedReview.superseded === true, 'Expected earlier blocked export review record to become superseded');

  const loadedExportReview = readExportReview(approvedReview.exportReviewRecord.export_review_id, { exportReviewOutputDir: tempExportReviewDir });
  assert(loadedExportReview.schema_version === 'phase4e-export-review/v1', 'Expected Phase 4E schema version on stored export review');
  assert(loadedExportReview.audit_meta.export_readiness_status === 'ready_for_export_review', 'Expected stored export review to preserve readiness snapshot');

  const loadedCandidate = readMemoryCandidate(registryGroundedCandidate.candidate_id, { memoryOutputDir: tempMemoryDir, memoryReviewOutputDir: tempReviewDir, exportReviewOutputDir: tempExportReviewDir });
  assert(loadedCandidate.export_review_summary.current_export_review_status === 'approved_for_export_review', 'Expected candidate read to expose latest export review status');
  assert(loadedCandidate.status === 'proposal_only', 'Expected candidate artifact to remain proposal_only after export review records');

  const registryAfter = snapshotRegistry();
  assert(JSON.stringify(registryBefore) === JSON.stringify(registryAfter), 'Registry files changed during Phase 4E verification');
}

function runNode(args, env = {}) {
  const result = spawnSync(process.execPath, args, {
    cwd: ROOT_DIR,
    encoding: 'utf-8',
    env: {
      ...process.env,
      ...env
    }
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `Command failed: ${args.join(' ')}`);
  }
  return result.stdout;
}

async function verifyCliSurface() {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4e-cli-runs-'));
  const tempAuditDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4e-cli-audit-'));
  const tempMemoryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4e-cli-memory-'));
  const tempReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4e-cli-reviews-'));
  const tempExportReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4e-cli-export-reviews-'));

  const runPayload = JSON.parse(runNode([
    'tools/arena.js',
    'run',
    '--question', 'Phase 4E CLI probe',
    '--q', 'registry',
    '--type', 'solution_proof',
    '--profile', 'review_strict',
    '--memory-proposals',
    '--memory-tag', 'phase4e-cli',
    '--output-dir', tempRunsDir,
    '--audit-dir', tempAuditDir,
    '--memory-dir', tempMemoryDir,
    '--memory-review-dir', tempReviewDir,
    '--json'
  ]));

  const candidateId = runPayload.memoryCandidates.find(item => item.candidate_type === 'registry_grounded_observation')?.candidate_id || runPayload.memoryCandidates[0].candidate_id;

  runNode([
    'tools/arena.js',
    'review-memory-candidate', candidateId,
    '--review-status', 'accepted',
    '--review-rationale', 'CLI runtime acceptance before export review.',
    '--review-source', 'phase4e_cli_verifier',
    '--reviewer-mode', 'human',
    '--memory-dir', tempMemoryDir,
    '--memory-review-dir', tempReviewDir,
    '--json'
  ]);

  const createdPayload = JSON.parse(runNode([
    'tools/arena.js',
    'export-review-memory-candidate', candidateId,
    '--export-review-rationale', 'CLI export review creation probe.',
    '--review-source', 'phase4e_cli_verifier',
    '--reviewer-mode', 'human',
    '--proof-note', 'cli-proof-note',
    '--gate-note', 'cli-gate-note',
    '--export-review-dir', tempExportReviewDir,
    '--memory-dir', tempMemoryDir,
    '--memory-review-dir', tempReviewDir,
    '--json'
  ]));
  assert(createdPayload.exportReviewRecord.export_review_status === 'approved_for_export_review', 'Expected CLI export review creation to return approved_for_export_review');

  const listPayload = JSON.parse(runNode([
    'tools/arena.js',
    'list-export-reviews',
    '--export-review-dir', tempExportReviewDir,
    '--json'
  ]));
  assert(Array.isArray(listPayload) && listPayload.length === 1, 'Expected CLI list-export-reviews to return one export review');

  const getPayload = JSON.parse(runNode([
    'tools/arena.js',
    'get-export-review', createdPayload.exportReviewRecord.export_review_id,
    '--export-review-dir', tempExportReviewDir,
    '--json'
  ]));
  assert(getPayload.export_review_rationale === 'CLI export review creation probe.', 'Expected CLI get-export-review to preserve rationale');
}

async function verifyHttpSurface() {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4e-http-runs-'));
  const tempAuditDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4e-http-audit-'));
  const tempMemoryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4e-http-memory-'));
  const tempReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4e-http-reviews-'));
  const tempExportReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4e-http-export-reviews-'));
  const port = 3246;
  const serverProcess = spawn(process.execPath, ['tools/arena-server.js'], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      PORT: String(port),
      ARENA_RUNS_DIR: tempRunsDir,
      ARENA_AUDIT_DIR: tempAuditDir,
      ARENA_MEMORY_DIR: tempMemoryDir,
      ARENA_MEMORY_REVIEW_DIR: tempReviewDir,
      ARENA_EXPORT_REVIEW_DIR: tempExportReviewDir
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
        question: 'Phase 4E HTTP probe',
        q: 'registry',
        type: 'solution_proof',
        profile: 'review_strict',
        memory_proposals: true,
        memory_tags: ['http-phase4e']
      })
    });
    assert(createRunResponse.status === 201, 'Expected POST /arena/runs to return 201 for Phase 4E');
    const createdRun = await createRunResponse.json();
    const candidateId = createdRun.memoryCandidates.find(item => item.candidate_type === 'registry_grounded_observation')?.candidate_id || createdRun.memoryCandidates[0].candidate_id;

    const acceptedResponse = await fetch(`http://127.0.0.1:${port}/arena/memory-candidates/${candidateId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        review_status: 'accepted',
        review_rationale: 'HTTP acceptance before export review.',
        review_source: 'phase4e_http_verifier',
        reviewer_mode: 'human'
      })
    });
    assert(acceptedResponse.status === 201, 'Expected accepted HTTP memory review for Phase 4E');

    const createExportReviewResponse = await fetch(`http://127.0.0.1:${port}/arena/memory-candidates/${candidateId}/export-reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        export_review_rationale: 'HTTP export review creation probe.',
        review_source: 'phase4e_http_verifier',
        reviewer_mode: 'human',
        proof_notes: ['http-proof-note'],
        gate_notes: ['http-gate-note']
      })
    });
    assert(createExportReviewResponse.status === 201, 'Expected POST /arena/memory-candidates/:id/export-reviews to return 201');
    const createdExportReview = await createExportReviewResponse.json();
    assert(createdExportReview.exportReviewRecord.export_review_status === 'approved_for_export_review', 'Expected HTTP export review creation to return approved_for_export_review');

    const candidateGetResponse = await fetch(`http://127.0.0.1:${port}/arena/memory-candidates/${candidateId}`);
    assert(candidateGetResponse.ok, 'Expected GET /arena/memory-candidates/:id to return 200 in Phase 4E');
    const candidatePayload = await candidateGetResponse.json();
    assert(candidatePayload.current_export_review_status === 'approved_for_export_review', 'Expected HTTP candidate payload to expose current export review status');
    assert(candidatePayload.export_review_summary.export_review_count === 1, 'Expected HTTP candidate payload to expose export review count');
    assert(candidatePayload.export_review_summary.export_executed === false, 'Expected HTTP candidate payload to preserve export execution false');

    const listResponse = await fetch(`http://127.0.0.1:${port}/arena/export-reviews`);
    assert(listResponse.ok, 'Expected GET /arena/export-reviews to return 200');
    const listPayload = await listResponse.json();
    assert(Array.isArray(listPayload.items) && listPayload.items.length === 1, 'Expected HTTP export review list to return one item');

    const getResponse = await fetch(`http://127.0.0.1:${port}/arena/export-reviews/${createdExportReview.exportReviewRecord.export_review_id}`);
    assert(getResponse.ok, 'Expected GET /arena/export-reviews/:id to return 200');
    const getPayload = await getResponse.json();
    assert(getPayload.audit_meta.registry_mutation === false, 'Expected stored HTTP export review to preserve registry mutation false');
    assert(getPayload.audit_meta.export_executed === false, 'Expected stored HTTP export review to preserve export execution false');
  } finally {
    serverProcess.kill();
  }
}

async function main() {
  verifyFilesExist();
  verifyNoScopeDrift();
  verifyExistingPhases();
  verifyExportReviewRuntime();
  await verifyCliSurface();
  await verifyHttpSurface();
  console.log('Phase 4E export review gate verification passed.');
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
