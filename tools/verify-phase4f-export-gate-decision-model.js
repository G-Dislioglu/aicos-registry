#!/usr/bin/env node
const { spawn, spawnSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  executeArenaRun,
  createExportReviewForCandidate,
  listMemoryCandidates,
  readMemoryCandidate,
  reviewMemoryCandidate
} = require('./arena-lib');

const ROOT_DIR = path.join(__dirname, '..');
const REQUIRED_FILES = [
  path.join(ROOT_DIR, 'PHASE4F_IMPLEMENTATION_PLAN.md'),
  path.join(ROOT_DIR, 'PHASE4F_EXPORT_GATE_DECISION_MODEL.md'),
  path.join(ROOT_DIR, 'tools', 'memory-export-gate-lib.js'),
  path.join(ROOT_DIR, 'tools', 'verify-phase4f-export-gate-decision-model.js'),
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
const PHASE4F_FILES = [
  path.join(ROOT_DIR, 'tools', 'memory-export-gate-lib.js'),
  path.join(ROOT_DIR, 'tools', 'arena-lib.js'),
  path.join(ROOT_DIR, 'tools', 'arena.js'),
  path.join(ROOT_DIR, 'tools', 'arena-server.js'),
  path.join(ROOT_DIR, 'tools', 'verify-phase4f-export-gate-decision-model.js')
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
    assert(fs.existsSync(filePath), `Missing required Phase 4F file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyNoScopeDrift() {
  for (const filePath of PHASE4F_FILES) {
    const content = fs.readFileSync(filePath, 'utf-8');
    for (const pattern of DISALLOWED_PATTERNS) {
      assert(!content.includes(pattern), `Disallowed Phase 4F pattern ${pattern} found in ${path.relative(ROOT_DIR, filePath)}`);
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
  runVerifier(path.join('tools', 'verify-phase4e-export-review-gate-records.js'));
}

function pickCandidate(memoryCandidates, candidateType) {
  return memoryCandidates.find(candidate => candidate.candidate_type === candidateType) || null;
}

function verifyGateDecisionRuntime() {
  const registryBefore = snapshotRegistry();
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4f-runs-'));
  const tempAuditDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4f-audit-'));
  const tempMemoryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4f-memory-'));
  const tempReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4f-reviews-'));
  const tempExportReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4f-export-reviews-'));

  const persisted = executeArenaRun({
    question: 'Create Phase 4F gate candidates',
    q: 'registry',
    type: 'solution_proof',
    profile: 'review_strict',
    memory_proposals: true,
    memory_tags: ['phase4f', 'gate']
  }, { outputDir: tempRunsDir, auditOutputDir: tempAuditDir, memoryOutputDir: tempMemoryDir, memoryReviewOutputDir: tempReviewDir });

  assert(Array.isArray(persisted.memoryCandidates) && persisted.memoryCandidates.length >= 1, 'Expected persisted Phase 4F memory candidates');

  const registryGroundedCandidate = pickCandidate(persisted.memoryCandidates, 'registry_grounded_observation') || persisted.memoryCandidates[0];
  const evidenceGapCandidate = pickCandidate(persisted.memoryCandidates, 'evidence_gap_followup');

  const initialCandidate = readMemoryCandidate(registryGroundedCandidate.candidate_id, {
    memoryOutputDir: tempMemoryDir,
    memoryReviewOutputDir: tempReviewDir,
    exportReviewOutputDir: tempExportReviewDir
  });
  assert(initialCandidate.export_gate_status === 'export_blocked', 'Expected initial candidate gate state to be export_blocked');
  assert(initialCandidate.export_gate_blockers.includes('export_readiness_not_ready'), 'Expected blocked candidate to expose readiness blocker');

  const acceptedCandidate = reviewMemoryCandidate(registryGroundedCandidate.candidate_id, {
    review_status: 'accepted',
    review_rationale: 'Runtime acceptance before export review gate decision.',
    review_source: 'phase4f_verifier',
    reviewer_mode: 'human',
    confidence: 'high'
  }, {
    memoryOutputDir: tempMemoryDir,
    memoryReviewOutputDir: tempReviewDir,
    exportReviewOutputDir: tempExportReviewDir
  });
  assert(acceptedCandidate.candidate.export_gate_status === 'export_needs_human_decision', 'Expected accepted candidate without export review to require human gate decision');
  assert(acceptedCandidate.candidate.export_gate_blockers.includes('export_review_missing'), 'Expected missing export review blocker before gate pass');

  const approvedReview = createExportReviewForCandidate(registryGroundedCandidate.candidate_id, {
    export_review_rationale: 'Runtime signals support a gate pass review record.',
    review_source: 'phase4f_verifier',
    reviewer_mode: 'human',
    proof_notes: ['terminal acceptance exists'],
    gate_notes: ['formal export review approved']
  }, {
    memoryOutputDir: tempMemoryDir,
    memoryReviewOutputDir: tempReviewDir,
    exportReviewOutputDir: tempExportReviewDir
  });
  assert(approvedReview.candidate.export_gate_status === 'export_gate_passed_runtime', 'Expected candidate with approved export review to pass runtime gate');
  assert(approvedReview.candidate.export_gate_blockers.length === 0, 'Expected gate-passed candidate to expose no gate blockers');
  assert(approvedReview.candidate.export_gate_decision.export_executed === false, 'Expected gate decision boundary to preserve export_executed false');
  assert(approvedReview.candidate.export_gate_decision.registry_mutation === false, 'Expected gate decision boundary to preserve registry_mutation false');

  if (evidenceGapCandidate) {
    reviewMemoryCandidate(evidenceGapCandidate.candidate_id, {
      review_status: 'accepted',
      review_rationale: 'Accepted runtime-only but still evidence-gapped.',
      review_source: 'phase4f_verifier',
      reviewer_mode: 'human',
      confidence: 'medium'
    }, {
      memoryOutputDir: tempMemoryDir,
      memoryReviewOutputDir: tempReviewDir,
      exportReviewOutputDir: tempExportReviewDir
    });

    const evidenceReview = createExportReviewForCandidate(evidenceGapCandidate.candidate_id, {
      export_review_rationale: 'Still needs more evidence before any gate pass.',
      review_source: 'phase4f_verifier',
      reviewer_mode: 'human',
      gate_notes: ['evidence gap remains']
    }, {
      memoryOutputDir: tempMemoryDir,
      memoryReviewOutputDir: tempReviewDir,
      exportReviewOutputDir: tempExportReviewDir
    });

    assert(evidenceReview.candidate.export_gate_status === 'export_blocked', 'Expected evidence-gap candidate to remain export_blocked');
    assert(evidenceReview.candidate.export_gate_blockers.includes('export_readiness_needs_more_evidence'), 'Expected evidence-gap gate blocker');
  }

  const listedCandidates = listMemoryCandidates({
    memoryOutputDir: tempMemoryDir,
    memoryReviewOutputDir: tempReviewDir,
    exportReviewOutputDir: tempExportReviewDir
  });
  const listedRegistryCandidate = listedCandidates.find(item => item.candidate_id === registryGroundedCandidate.candidate_id);
  assert(listedRegistryCandidate.export_gate_status === 'export_gate_passed_runtime', 'Expected candidate list to expose runtime gate pass status');
  assert(listedRegistryCandidate.export_gate_blocker_count === 0, 'Expected candidate list to expose zero gate blockers for passed candidate');

  const loadedCandidate = readMemoryCandidate(registryGroundedCandidate.candidate_id, {
    memoryOutputDir: tempMemoryDir,
    memoryReviewOutputDir: tempReviewDir,
    exportReviewOutputDir: tempExportReviewDir
  });
  assert(loadedCandidate.export_gate_decision.gate_decision_summary.current_export_review_status === 'approved_for_export_review', 'Expected detailed gate summary to preserve current export review status');
  assert(loadedCandidate.status === 'proposal_only', 'Expected candidate artifact to remain proposal_only after gate decision derivation');

  const registryAfter = snapshotRegistry();
  assert(JSON.stringify(registryBefore) === JSON.stringify(registryAfter), 'Registry files changed during Phase 4F verification');
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
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4f-cli-runs-'));
  const tempAuditDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4f-cli-audit-'));
  const tempMemoryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4f-cli-memory-'));
  const tempReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4f-cli-reviews-'));
  const tempExportReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4f-cli-export-reviews-'));

  const runPayload = JSON.parse(runNode([
    'tools/arena.js',
    'run',
    '--question', 'Phase 4F CLI probe',
    '--q', 'registry',
    '--type', 'solution_proof',
    '--profile', 'review_strict',
    '--memory-proposals',
    '--memory-tag', 'phase4f-cli',
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
    '--review-rationale', 'CLI runtime acceptance before gate pass.',
    '--review-source', 'phase4f_cli_verifier',
    '--reviewer-mode', 'human',
    '--memory-dir', tempMemoryDir,
    '--memory-review-dir', tempReviewDir,
    '--export-review-dir', tempExportReviewDir,
    '--json'
  ]);

  runNode([
    'tools/arena.js',
    'export-review-memory-candidate', candidateId,
    '--export-review-rationale', 'CLI export review approval before gate read.',
    '--review-source', 'phase4f_cli_verifier',
    '--reviewer-mode', 'human',
    '--export-review-dir', tempExportReviewDir,
    '--memory-dir', tempMemoryDir,
    '--memory-review-dir', tempReviewDir,
    '--json'
  ]);

  const listPayload = JSON.parse(runNode([
    'tools/arena.js',
    'list-memory-candidates',
    '--memory-dir', tempMemoryDir,
    '--memory-review-dir', tempReviewDir,
    '--export-review-dir', tempExportReviewDir,
    '--json'
  ]));
  const listed = listPayload.find(item => item.candidate_id === candidateId);
  assert(listed && listed.export_gate_status === 'export_gate_passed_runtime', 'Expected CLI list-memory-candidates to expose gate pass status');

  const getPayload = JSON.parse(runNode([
    'tools/arena.js',
    'get-memory-candidate', candidateId,
    '--memory-dir', tempMemoryDir,
    '--memory-review-dir', tempReviewDir,
    '--export-review-dir', tempExportReviewDir,
    '--json'
  ]));
  assert(getPayload.export_gate_decision.export_gate_status === 'export_gate_passed_runtime', 'Expected CLI get-memory-candidate to expose detailed gate decision');
}

async function verifyHttpSurface() {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4f-http-runs-'));
  const tempAuditDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4f-http-audit-'));
  const tempMemoryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4f-http-memory-'));
  const tempReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4f-http-reviews-'));
  const tempExportReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4f-http-export-reviews-'));
  const port = 3247;
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
        question: 'Phase 4F HTTP probe',
        q: 'registry',
        type: 'solution_proof',
        profile: 'review_strict',
        memory_proposals: true,
        memory_tags: ['http-phase4f']
      })
    });
    assert(createRunResponse.status === 201, 'Expected POST /arena/runs to return 201 for Phase 4F');
    const createdRun = await createRunResponse.json();
    const candidateId = createdRun.memoryCandidates.find(item => item.candidate_type === 'registry_grounded_observation')?.candidate_id || createdRun.memoryCandidates[0].candidate_id;

    const acceptedResponse = await fetch(`http://127.0.0.1:${port}/arena/memory-candidates/${candidateId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        review_status: 'accepted',
        review_rationale: 'HTTP acceptance before gate pass.',
        review_source: 'phase4f_http_verifier',
        reviewer_mode: 'human'
      })
    });
    assert(acceptedResponse.status === 201, 'Expected accepted HTTP memory review for Phase 4F');

    const createExportReviewResponse = await fetch(`http://127.0.0.1:${port}/arena/memory-candidates/${candidateId}/export-reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        export_review_rationale: 'HTTP export review approval before gate read.',
        review_source: 'phase4f_http_verifier',
        reviewer_mode: 'human'
      })
    });
    assert(createExportReviewResponse.status === 201, 'Expected POST /arena/memory-candidates/:id/export-reviews to return 201 for Phase 4F');

    const candidateGetResponse = await fetch(`http://127.0.0.1:${port}/arena/memory-candidates/${candidateId}`);
    assert(candidateGetResponse.ok, 'Expected GET /arena/memory-candidates/:id to return 200 in Phase 4F');
    const candidatePayload = await candidateGetResponse.json();
    assert(candidatePayload.export_gate_status === 'export_gate_passed_runtime', 'Expected HTTP candidate payload to expose gate pass status');
    assert(candidatePayload.export_gate_decision.export_executed === false, 'Expected HTTP gate decision to preserve export execution false');
    assert(candidatePayload.export_gate_decision.registry_mutation === false, 'Expected HTTP gate decision to preserve registry mutation false');

    const candidateListResponse = await fetch(`http://127.0.0.1:${port}/arena/memory-candidates`);
    assert(candidateListResponse.ok, 'Expected GET /arena/memory-candidates to return 200 in Phase 4F');
    const candidateListPayload = await candidateListResponse.json();
    const listedCandidate = candidateListPayload.items.find(item => item.candidate_id === candidateId);
    assert(listedCandidate && listedCandidate.export_gate_status === 'export_gate_passed_runtime', 'Expected HTTP candidate list to expose gate pass status');
    assert(listedCandidate.export_gate_blocker_count === 0, 'Expected HTTP candidate list to expose zero gate blockers for passed candidate');
  } finally {
    serverProcess.kill();
  }
}

async function main() {
  verifyFilesExist();
  verifyNoScopeDrift();
  verifyExistingPhases();
  verifyGateDecisionRuntime();
  await verifyCliSurface();
  await verifyHttpSurface();
  console.log('Phase 4F export gate decision verification passed.');
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
