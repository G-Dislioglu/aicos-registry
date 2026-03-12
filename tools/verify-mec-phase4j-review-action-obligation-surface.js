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
  path.join(ROOT_DIR, 'MEC_PHASE4J_IMPLEMENTATION_PLAN.md'),
  path.join(ROOT_DIR, 'MEC_PHASE4J_REVIEW_ACTION_OBLIGATION_SURFACE_ACCEPTANCE.md'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-phase4j-review-action-obligation-surface.js'),
  path.join(ROOT_DIR, 'tools', 'arena-lib.js'),
  path.join(ROOT_DIR, 'tools', 'arena.js'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-operator-ui-smoke.js'),
  path.join(ROOT_DIR, 'web', 'mec-operator.html')
];
const REQUIRED_UI_STRINGS = [
  'Review action obligations',
  'Structured manual review obligation read over the 4I posture: visible proof burden, evidence expectations, blocking gaps, contradiction watchpoints, and defer reads without recommendation or automation.',
  'detail-review-action-obligation',
  'Action readiness summary',
  'Manual action obligations',
  'Attention / contradiction / defer reads'
];
const DISALLOWED_PATTERNS = [
  'recommended_outcome',
  'recommended_action',
  'queue_position',
  'should_reopen',
  'should_queue',
  'auto_review',
  'priority_rank',
  'auto_select_action',
  'recommended_next_step'
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
    assert(fs.existsSync(filePath), `Missing required Phase 4J file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyDeskCopy() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'web', 'mec-operator.html'), 'utf-8');
  for (const expected of REQUIRED_UI_STRINGS) {
    assert(content.includes(expected), `Expected Phase 4J desk UI copy missing: ${expected}`);
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
      assert(!content.includes(pattern), `Disallowed Phase 4J drift pattern ${pattern} found in ${path.relative(ROOT_DIR, filePath)}`);
    }
  }
}

function verifyRuntimeActionObligation() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4j-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4j-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4j-reviews-'));

  const eventResult = createMecEvent({
    event_type: 'phase4j_probe',
    domain: 'mec_phase4j',
    summary: 'Phase 4J action obligation probe',
    source_ref: 'verifier://phase4j/runtime',
    trace_ref: 'trace://phase4j/runtime'
  }, { eventOutputDir: tempEventDir });

  const invariant = createMecCandidateRecord({
    candidate_type: 'invariant_candidate',
    principle: 'Phase 4J invariant target',
    mechanism: 'The review action obligation surface must stay canonical, compact, and read-only.',
    source_event_ids: [eventResult.event.id],
    fails_when: ['manual obligation surface missing', 'manual obligation surface unreadable'],
    edge_cases: ['pre-anchor contribution', 'post-anchor contribution'],
    severity: 'medium',
    distillation_mode: 'manual'
  }, { candidateOutputDir: tempCandidateDir, eventOutputDir: tempEventDir });

  createMecChallengeCounterexample(invariant.candidate.id, {
    case_description: 'Pre-anchor challenge line contributes to obligation baseline.',
    resolution: 'Keep proposal-only.',
    impact_on_candidate: 'narrows_scope',
    challenge_source: 'phase4j_runtime_verifier_pre'
  }, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });

  reviewMecCandidate(invariant.candidate.id, {
    review_outcome: 'stabilize',
    review_rationale: 'Phase 4J anchor review.',
    review_source: 'phase4j_verifier'
  }, {
    candidateOutputDir: tempCandidateDir,
    mecReviewOutputDir: tempMecReviewDir
  });

  const postAnchorCounterexample = createMecCandidateRecord({
    candidate_type: 'counterexample_candidate',
    principle: 'Phase 4J post-anchor contribution',
    mechanism: 'A post-anchor contribution should remain visible in the action obligation surface.',
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
      challenge_summary: 'Post-anchor obligation contribution beta.',
      challenge_flags: ['phase4j_post_anchor_beta']
    }
  }, { candidateOutputDir: tempCandidateDir, eventOutputDir: tempEventDir });

  const primaryWorkspace = readMecReviewWorkspace(invariant.candidate.id, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });
  assert(primaryWorkspace && primaryWorkspace.review_action_obligation_surface, 'Expected invariant workspace to expose additive review_action_obligation_surface');
  assert(primaryWorkspace.review_action_obligation_surface.review_action_obligation_surface_version === 'phase4j-mec-review-action-obligation/v1', 'Expected Phase 4J surface version marker');
  assert(Array.isArray(primaryWorkspace.review_action_obligation_surface.manual_action_obligations), 'Expected manual_action_obligations array');
  assert(Array.isArray(primaryWorkspace.review_action_obligation_surface.required_evidence_by_action), 'Expected required_evidence_by_action array');
  assert(Array.isArray(primaryWorkspace.review_action_obligation_surface.blocking_gaps_by_action), 'Expected blocking_gaps_by_action array');
  assert(Array.isArray(primaryWorkspace.review_action_obligation_surface.reviewer_attention_points), 'Expected reviewer_attention_points array');
  assert(Array.isArray(primaryWorkspace.review_action_obligation_surface.contradiction_watchpoints), 'Expected contradiction_watchpoints array');
  assert(Array.isArray(primaryWorkspace.review_action_obligation_surface.action_risk_notes), 'Expected action_risk_notes array');
  assert(typeof primaryWorkspace.review_action_obligation_surface.action_readiness_summary === 'string' && primaryWorkspace.review_action_obligation_surface.action_readiness_summary.length > 0, 'Expected action_readiness_summary readability');
  assert(Array.isArray(primaryWorkspace.review_action_obligation_surface.defer_reasons), 'Expected defer_reasons array');
  assert(primaryWorkspace.workspace_summary && typeof primaryWorkspace.workspace_summary.review_action_obligation_count === 'number', 'Expected workspace_summary to expose Phase 4J obligation count');
  assert(typeof primaryWorkspace.workspace_summary.review_action_gap_count === 'number', 'Expected workspace_summary to expose Phase 4J gap count');
  assert(typeof primaryWorkspace.workspace_summary.review_action_attention_count === 'number', 'Expected workspace_summary to expose Phase 4J attention count');
  assert(typeof primaryWorkspace.workspace_summary.review_action_defer_count === 'number', 'Expected workspace_summary to expose Phase 4J defer count');

  const counterexampleWorkspace = readMecReviewWorkspace(postAnchorCounterexample.candidate.id, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });
  assert(counterexampleWorkspace && counterexampleWorkspace.review_action_obligation_surface, 'Expected counterexample workspace to expose additive review_action_obligation_surface');
  assert(Array.isArray(counterexampleWorkspace.review_action_obligation_surface.manual_action_obligations), 'Expected counterexample obligation surface to expose manual_action_obligations');
  assert(Array.isArray(counterexampleWorkspace.review_action_obligation_surface.blocking_gaps_by_action), 'Expected counterexample obligation surface to expose blocking_gaps_by_action');
}

function verifyCliActionObligationReadability() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4j-cli-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4j-cli-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4j-cli-reviews-'));

  const eventOutput = runCli([
    path.join('tools', 'arena.js'),
    'create-event',
    '--event-type', 'phase4j_cli_probe',
    '--domain', 'mec_phase4j',
    '--summary', 'Phase 4J CLI obligation probe',
    '--source-ref', 'verifier://phase4j/cli',
    '--trace-ref', 'trace://phase4j/cli',
    '--event-dir', tempEventDir,
    '--json'
  ]);
  const createdEvent = JSON.parse(eventOutput);

  const candidateOutput = runCli([
    path.join('tools', 'arena.js'),
    'create-mec-candidate',
    '--candidate-type', 'invariant_candidate',
    '--principle', 'Phase 4J CLI invariant',
    '--mechanism', 'CLI should expose canonical action obligation readability',
    '--source-event-id', createdEvent.event.id,
    '--boundary-fails-when', 'manual obligation readability missing',
    '--boundary-fails-when', 'defer readability missing',
    '--boundary-edge-case', 'single cli obligation probe',
    '--candidate-dir', tempCandidateDir,
    '--event-dir', tempEventDir,
    '--json'
  ]);
  const createdCandidate = JSON.parse(candidateOutput);

  runCli([
    path.join('tools', 'arena.js'),
    'challenge-mec-candidate',
    createdCandidate.candidate.id,
    '--case-description', 'CLI challenge creates a proposal-only counterexample for obligation readability.',
    '--impact-on-candidate', 'narrows_scope',
    '--review-source', 'phase4j_cli_verifier',
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
  assert(workspaceOutput.includes('obligations:'), 'Expected CLI workspace text output to expose Phase 4J obligations field');
  assert(workspaceOutput.includes('obligation-gaps:'), 'Expected CLI workspace text output to expose Phase 4J obligation-gaps field');
  assert(workspaceOutput.includes('attention-points:'), 'Expected CLI workspace text output to expose Phase 4J attention-points field');
  assert(workspaceOutput.includes('defer-reasons:'), 'Expected CLI workspace text output to expose Phase 4J defer-reasons field');
}

async function verifyHttpActionObligationReadability() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4j-http-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4j-http-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4j-http-reviews-'));
  const port = 3363;
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
    const timeout = setTimeout(() => reject(new Error('Timed out waiting for arena-server to start for Phase 4J HTTP verification')), 5000);
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
        event_type: 'phase4j_http_probe',
        domain: 'mec_phase4j',
        summary: 'Phase 4J HTTP obligation event',
        source_ref: 'verifier://phase4j/http',
        trace_ref: 'trace://phase4j/http'
      })
    });

    const candidatePayload = await fetchJson(`http://127.0.0.1:${port}/arena/mec-candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidate_type: 'invariant_candidate',
        principle: 'Phase 4J HTTP invariant',
        mechanism: 'HTTP should expose canonical action obligation semantics',
        source_event_ids: [eventPayload.event.id],
        fails_when: ['obligation surface missing', 'obligation surface unreadable'],
        edge_cases: ['single http obligation probe'],
        severity: 'medium',
        distillation_mode: 'manual'
      })
    });

    await fetchJson(`http://127.0.0.1:${port}/arena/mec-candidates/${candidatePayload.candidate.id}/challenge-counterexamples`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        case_description: 'HTTP challenge creates a proposal-only counterexample for obligation readability.',
        impact_on_candidate: 'narrows_scope',
        challenge_source: 'phase4j_http_verifier'
      })
    });

    const workspaceDetailPayload = await fetchJson(`http://127.0.0.1:${port}/arena/mec-review-workspace/${candidatePayload.candidate.id}`);
    assert(workspaceDetailPayload.review_action_obligation_surface && typeof workspaceDetailPayload.review_action_obligation_surface.action_readiness_summary === 'string', 'Expected HTTP workspace detail to expose Phase 4J action_readiness_summary');
    assert(Array.isArray(workspaceDetailPayload.review_action_obligation_surface.manual_action_obligations), 'Expected HTTP workspace detail to expose Phase 4J manual_action_obligations');
    assert(typeof workspaceDetailPayload.workspace_summary.review_action_obligation_count === 'number', 'Expected HTTP workspace detail workspace_summary to expose obligation count');
    assert(typeof workspaceDetailPayload.workspace_summary.review_action_gap_count === 'number', 'Expected HTTP workspace detail workspace_summary to expose obligation gap count');
  } finally {
    serverProcess.kill();
  }
}

async function main() {
  verifyFilesExist();
  verifyDeskCopy();
  verifyNoDriftStrings();
  verifyRuntimeActionObligation();
  verifyCliActionObligationReadability();
  await verifyHttpActionObligationReadability();
  runVerifier(path.join('tools', 'verify-mec-operator-ui-smoke.js'));
  runVerifier(path.join('tools', 'verify-mec-phase4i-review-action-posture-surface.js'));
  console.log('MEC Phase 4J review action obligation surface verification passed.');
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
