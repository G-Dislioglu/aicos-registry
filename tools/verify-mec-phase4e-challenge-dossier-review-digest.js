#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const {
  createMecCandidateRecord,
  createMecChallengeCounterexample,
  createMecEvent,
  readMecReviewWorkspace,
  reviewMecCandidate
} = require('./arena-lib');

const ROOT_DIR = path.join(__dirname, '..');
const REQUIRED_FILES = [
  path.join(ROOT_DIR, 'MEC_PHASE4E_IMPLEMENTATION_PLAN.md'),
  path.join(ROOT_DIR, 'MEC_PHASE4E_CHALLENGE_DOSSIER_REVIEW_DIGEST_ACCEPTANCE.md'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-phase4e-challenge-dossier-review-digest.js'),
  path.join(ROOT_DIR, 'tools', 'arena-lib.js'),
  path.join(ROOT_DIR, 'tools', 'arena.js'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-operator-ui-smoke.js'),
  path.join(ROOT_DIR, 'web', 'mec-operator.html')
];
const REQUIRED_UI_STRINGS = [
  'Challenge dossier review digest',
  'Consolidated review read over coverage, delta, refutation pressure, chronology and unresolved watchpoints from the canonical workspace only.',
  'detail-challenge-dossier-digest',
  'Digest summary',
  'Chronology',
  'Watchpoints'
];
const DISALLOWED_PATTERNS = [
  'recommended_outcome',
  'digest_recommendation',
  'priority_rank',
  'queue_position',
  'reopen_now',
  'should_stabilize',
  'should_reject',
  'next_action'
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runVerifier(relativePath) {
  const result = spawnSync(process.execPath, [relativePath], {
    cwd: ROOT_DIR,
    encoding: 'utf-8'
  });
  assert(result.status === 0, `${relativePath} failed: ${(result.stderr || result.stdout || '').trim()}`);
}

function runCli(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: ROOT_DIR,
    encoding: 'utf-8'
  });
  assert(result.status === 0, `${args.join(' ')} failed: ${(result.stderr || result.stdout || '').trim()}`);
  return result.stdout.trim();
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json();
  assert(response.ok, `Request failed ${url}: ${response.status} ${(payload && payload.error) || ''}`);
  return payload;
}

function verifyFilesExist() {
  for (const filePath of REQUIRED_FILES) {
    assert(fs.existsSync(filePath), `Missing required Phase 4E file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyDeskCopy() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'web', 'mec-operator.html'), 'utf-8');
  for (const expected of REQUIRED_UI_STRINGS) {
    assert(content.includes(expected), `Expected Phase 4E desk UI copy missing: ${expected}`);
  }
}

function verifyNoDriftStrings() {
  const filePaths = [
    path.join(ROOT_DIR, 'tools', 'arena-lib.js'),
    path.join(ROOT_DIR, 'tools', 'arena.js'),
    path.join(ROOT_DIR, 'tools', 'verify-mec-operator-ui-smoke.js'),
    path.join(ROOT_DIR, 'web', 'mec-operator.html')
  ];
  for (const filePath of filePaths) {
    const content = fs.readFileSync(filePath, 'utf-8');
    for (const pattern of DISALLOWED_PATTERNS) {
      assert(!content.includes(pattern), `Disallowed Phase 4E drift pattern ${pattern} found in ${path.relative(ROOT_DIR, filePath)}`);
    }
  }
}

function verifyRuntimeDigest() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4e-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4e-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4e-reviews-'));

  const eventResult = createMecEvent({
    event_type: 'phase4e_probe',
    domain: 'mec_phase4e',
    summary: 'Phase 4E consolidated digest probe',
    source_ref: 'verifier://phase4e/runtime',
    trace_ref: 'trace://phase4e/runtime'
  }, { eventOutputDir: tempEventDir });

  const invariant = createMecCandidateRecord({
    candidate_type: 'invariant_candidate',
    principle: 'Phase 4E invariant target',
    mechanism: 'The consolidated digest must stay canonical, additive, and readable.',
    source_event_ids: [eventResult.event.id],
    fails_when: ['digest is missing', 'chronology is unreadable'],
    edge_cases: ['pre-anchor contribution', 'post-anchor contribution'],
    severity: 'medium',
    distillation_mode: 'manual'
  }, { candidateOutputDir: tempCandidateDir, eventOutputDir: tempEventDir });

  createMecChallengeCounterexample(invariant.candidate.id, {
    case_description: 'Pre-anchor challenge line contributes to digest history.',
    resolution: 'Keep proposal-only.',
    impact_on_candidate: 'narrows_scope',
    challenge_source: 'phase4e_runtime_verifier_pre'
  }, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });

  reviewMecCandidate(invariant.candidate.id, {
    review_outcome: 'stabilize',
    review_rationale: 'Phase 4E anchor review.',
    review_source: 'phase4e_verifier'
  }, {
    candidateOutputDir: tempCandidateDir,
    mecReviewOutputDir: tempMecReviewDir
  });

  const postAnchorCounterexample = createMecCandidateRecord({
    candidate_type: 'counterexample_candidate',
    principle: 'Phase 4E post-anchor contribution',
    mechanism: 'A post-anchor contribution should appear in the consolidated digest chronology.',
    refutes_candidate_id: invariant.candidate.id,
    case_description: 'Post-anchor challenge line enters after the review anchor.',
    resolution: 'Keep proposal-only.',
    impact_on_candidate: 'narrows_scope',
    source_event_ids: [eventResult.event.id],
    status: 'proposal_only',
    distillation_mode: 'manual',
    created_at: new Date(Date.now() + 2000).toISOString(),
    updated_at: new Date(Date.now() + 2000).toISOString(),
    challenge_basis: {
      contradiction_pressure_bucket: 'moderate_visible_pressure',
      challenge_summary: 'Post-anchor digest contribution beta.',
      challenge_flags: ['phase4e_post_anchor_beta']
    }
  }, { candidateOutputDir: tempCandidateDir, eventOutputDir: tempEventDir });

  const primaryWorkspace = readMecReviewWorkspace(invariant.candidate.id, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });
  assert(primaryWorkspace && primaryWorkspace.challenge_dossier_review_digest, 'Expected invariant workspace to expose additive challenge_dossier_review_digest');
  assert(primaryWorkspace.challenge_dossier_review_digest.challenge_dossier_review_digest_surface_version === 'phase4e-mec-challenge-dossier-review-digest/v1', 'Expected Phase 4E surface version marker');
  assert(primaryWorkspace.challenge_dossier_review_digest.digest_role === 'primary_candidate_review_digest', 'Expected primary_candidate_review_digest role for invariant');
  assert(typeof primaryWorkspace.challenge_dossier_review_digest.digest_bucket === 'string' && primaryWorkspace.challenge_dossier_review_digest.digest_bucket.length > 0, 'Expected digest bucket readability for primary candidate');
  assert(typeof primaryWorkspace.challenge_dossier_review_digest.coverage_read === 'string' && primaryWorkspace.challenge_dossier_review_digest.coverage_read.includes('Coverage currently reads as'), 'Expected consolidated coverage readability in digest');
  assert(typeof primaryWorkspace.challenge_dossier_review_digest.delta_read === 'string' && primaryWorkspace.challenge_dossier_review_digest.delta_read.length > 0, 'Expected consolidated delta readability in digest');
  assert(typeof primaryWorkspace.challenge_dossier_review_digest.refutation_read === 'string' && primaryWorkspace.challenge_dossier_review_digest.refutation_read.length > 0, 'Expected consolidated refutation readability in digest');
  assert(Array.isArray(primaryWorkspace.challenge_dossier_review_digest.chronology) && primaryWorkspace.challenge_dossier_review_digest.chronology.some(item => item.kind === 'review_anchor'), 'Expected digest chronology to preserve the visible review anchor');
  assert(Array.isArray(primaryWorkspace.challenge_dossier_review_digest.chronology) && primaryWorkspace.challenge_dossier_review_digest.chronology.some(item => item.kind === 'counterexample_visible'), 'Expected digest chronology to expose visible counterexample carry-through');
  assert(primaryWorkspace.workspace_summary && typeof primaryWorkspace.workspace_summary.challenge_dossier_review_digest_bucket === 'string', 'Expected workspace_summary to expose Phase 4E digest bucket');

  const counterexampleWorkspace = readMecReviewWorkspace(postAnchorCounterexample.candidate.id, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });
  assert(counterexampleWorkspace && counterexampleWorkspace.challenge_dossier_review_digest, 'Expected counterexample workspace to expose additive challenge_dossier_review_digest');
  assert(counterexampleWorkspace.challenge_dossier_review_digest.digest_role === 'counterexample_contribution_review_digest', 'Expected counterexample contribution digest role');
  assert(counterexampleWorkspace.challenge_dossier_review_digest.primary_candidate_id === invariant.candidate.id, 'Expected counterexample digest to preserve primary candidate linkage');
  assert(typeof counterexampleWorkspace.challenge_dossier_review_digest.digest_summary === 'string' && counterexampleWorkspace.challenge_dossier_review_digest.digest_summary.includes(invariant.candidate.id), 'Expected counterexample digest summary to mention primary candidate linkage');
}

function verifyCliDigestReadability() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4e-cli-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4e-cli-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4e-cli-reviews-'));

  const eventOutput = runCli([
    path.join('tools', 'arena.js'),
    'create-event',
    '--event-type', 'phase4e_cli_probe',
    '--domain', 'mec_phase4e',
    '--summary', 'Phase 4E CLI digest probe',
    '--source-ref', 'verifier://phase4e/cli',
    '--trace-ref', 'trace://phase4e/cli',
    '--event-dir', tempEventDir,
    '--json'
  ]);
  const createdEvent = JSON.parse(eventOutput);

  const candidateOutput = runCli([
    path.join('tools', 'arena.js'),
    'create-mec-candidate',
    '--candidate-type', 'invariant_candidate',
    '--principle', 'Phase 4E CLI invariant',
    '--mechanism', 'CLI should expose canonical digest readability',
    '--source-event-id', createdEvent.event.id,
    '--boundary-fails-when', 'digest readability missing',
    '--boundary-fails-when', 'watchpoint readability missing',
    '--boundary-edge-case', 'single cli digest probe',
    '--candidate-dir', tempCandidateDir,
    '--event-dir', tempEventDir,
    '--json'
  ]);
  const createdCandidate = JSON.parse(candidateOutput);

  runCli([
    path.join('tools', 'arena.js'),
    'challenge-mec-candidate',
    createdCandidate.candidate.id,
    '--case-description', 'CLI challenge creates a proposal-only counterexample for digest readability.',
    '--impact-on-candidate', 'narrows_scope',
    '--review-source', 'phase4e_cli_verifier',
    '--candidate-dir', tempCandidateDir,
    '--event-dir', tempEventDir,
    '--mec-review-dir', tempMecReviewDir,
    '--json'
  ]);

  const workspaceOutput = runCli([
    path.join('tools', 'arena.js'),
    'list-mec-review-workspace',
    '--candidate-dir', tempCandidateDir,
    '--mec-review-dir', tempMecReviewDir,
    '--event-dir', tempEventDir
  ]);
  assert(workspaceOutput.includes('digest:'), 'Expected CLI workspace text output to expose Phase 4E digest field');
  assert(workspaceOutput.includes('watchpoints:'), 'Expected CLI workspace text output to expose Phase 4E watchpoint count');
}

async function verifyHttpDigestReadability() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4e-http-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4e-http-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4e-http-reviews-'));
  const port = 3358;
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
      reject(new Error('Timed out waiting for arena-server to start for Phase 4E HTTP verification'));
    }, 5000);

    serverProcess.stdout.on('data', data => {
      if (String(data).includes('arena-server listening')) {
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
    const eventPayload = await fetchJson(`http://127.0.0.1:${port}/arena/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'phase4e_http_probe',
        domain: 'mec_phase4e',
        summary: 'Phase 4E HTTP digest event',
        source_ref: 'verifier://phase4e/http',
        trace_ref: 'trace://phase4e/http'
      })
    });

    const candidatePayload = await fetchJson(`http://127.0.0.1:${port}/arena/mec-candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidate_type: 'invariant_candidate',
        principle: 'Phase 4E HTTP invariant',
        mechanism: 'HTTP should expose canonical digest semantics',
        source_event_ids: [eventPayload.event.id],
        fails_when: ['digest missing', 'chronology unreadable'],
        edge_cases: ['single http digest probe'],
        severity: 'medium',
        distillation_mode: 'manual'
      })
    });

    await fetchJson(`http://127.0.0.1:${port}/arena/mec-candidates/${candidatePayload.candidate.id}/challenge-counterexamples`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        case_description: 'HTTP challenge creates a proposal-only counterexample for digest readability.',
        impact_on_candidate: 'narrows_scope',
        challenge_source: 'phase4e_http_verifier'
      })
    });

    const workspaceDetailPayload = await fetchJson(`http://127.0.0.1:${port}/arena/mec-review-workspace/${candidatePayload.candidate.id}`);
    assert(workspaceDetailPayload.challenge_dossier_review_digest && typeof workspaceDetailPayload.challenge_dossier_review_digest.digest_summary === 'string', 'Expected HTTP workspace detail to expose Phase 4E digest summary');
    assert(Array.isArray(workspaceDetailPayload.challenge_dossier_review_digest.chronology), 'Expected HTTP workspace detail to expose digest chronology');
    assert(typeof workspaceDetailPayload.workspace_summary.challenge_dossier_review_digest_bucket === 'string', 'Expected HTTP workspace detail workspace_summary to expose digest bucket');
  } finally {
    serverProcess.kill();
  }
}

async function main() {
  verifyFilesExist();
  verifyDeskCopy();
  verifyNoDriftStrings();
  verifyRuntimeDigest();
  verifyCliDigestReadability();
  await verifyHttpDigestReadability();
  runVerifier(path.join('tools', 'verify-mec-phase4d-challenge-dossier-delta-evolution-context.js'));
  console.log('MEC Phase 4E challenge dossier review digest verification passed.');
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
