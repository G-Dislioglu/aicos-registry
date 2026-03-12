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
  path.join(ROOT_DIR, 'MEC_PHASE4I_IMPLEMENTATION_PLAN.md'),
  path.join(ROOT_DIR, 'MEC_PHASE4I_REVIEW_ACTION_POSTURE_SURFACE_ACCEPTANCE.md'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-phase4i-review-action-posture-surface.js'),
  path.join(ROOT_DIR, 'tools', 'arena-lib.js'),
  path.join(ROOT_DIR, 'tools', 'arena.js'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-operator-ui-smoke.js'),
  path.join(ROOT_DIR, 'web', 'mec-operator.html')
];
const REQUIRED_UI_STRINGS = [
  'Review action posture',
  'Structured manual review posture over the 4H packet: visible manual actions, blocked actions, preconditions, and hold/escalation reads without recommendation or automation.',
  'detail-review-action-posture',
  'Manual posture summary',
  'Allowed manual actions',
  'Blocked manual actions'
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
    assert(fs.existsSync(filePath), `Missing required Phase 4I file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyDeskCopy() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'web', 'mec-operator.html'), 'utf-8');
  for (const expected of REQUIRED_UI_STRINGS) {
    assert(content.includes(expected), `Expected Phase 4I desk UI copy missing: ${expected}`);
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
      assert(!content.includes(pattern), `Disallowed Phase 4I drift pattern ${pattern} found in ${path.relative(ROOT_DIR, filePath)}`);
    }
  }
}

function verifyRuntimeActionPosture() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4i-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4i-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4i-reviews-'));

  const eventResult = createMecEvent({
    event_type: 'phase4i_probe',
    domain: 'mec_phase4i',
    summary: 'Phase 4I action posture probe',
    source_ref: 'verifier://phase4i/runtime',
    trace_ref: 'trace://phase4i/runtime'
  }, { eventOutputDir: tempEventDir });

  const invariant = createMecCandidateRecord({
    candidate_type: 'invariant_candidate',
    principle: 'Phase 4I invariant target',
    mechanism: 'The review action posture must stay canonical, compact, and read-only.',
    source_event_ids: [eventResult.event.id],
    fails_when: ['manual posture missing', 'manual posture unreadable'],
    edge_cases: ['pre-anchor contribution', 'post-anchor contribution'],
    severity: 'medium',
    distillation_mode: 'manual'
  }, { candidateOutputDir: tempCandidateDir, eventOutputDir: tempEventDir });

  createMecChallengeCounterexample(invariant.candidate.id, {
    case_description: 'Pre-anchor challenge line contributes to posture baseline.',
    resolution: 'Keep proposal-only.',
    impact_on_candidate: 'narrows_scope',
    challenge_source: 'phase4i_runtime_verifier_pre'
  }, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });

  reviewMecCandidate(invariant.candidate.id, {
    review_outcome: 'stabilize',
    review_rationale: 'Phase 4I anchor review.',
    review_source: 'phase4i_verifier'
  }, {
    candidateOutputDir: tempCandidateDir,
    mecReviewOutputDir: tempMecReviewDir
  });

  const postAnchorCounterexample = createMecCandidateRecord({
    candidate_type: 'counterexample_candidate',
    principle: 'Phase 4I post-anchor contribution',
    mechanism: 'A post-anchor contribution should remain visible in the action posture surface.',
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
      challenge_summary: 'Post-anchor posture contribution beta.',
      challenge_flags: ['phase4i_post_anchor_beta']
    }
  }, { candidateOutputDir: tempCandidateDir, eventOutputDir: tempEventDir });

  const primaryWorkspace = readMecReviewWorkspace(invariant.candidate.id, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });
  assert(primaryWorkspace && primaryWorkspace.review_action_posture_surface, 'Expected invariant workspace to expose additive review_action_posture_surface');
  assert(primaryWorkspace.review_action_posture_surface.review_action_posture_surface_version === 'phase4i-mec-review-action-posture/v1', 'Expected Phase 4I surface version marker');
  assert(Array.isArray(primaryWorkspace.review_action_posture_surface.allowed_manual_actions), 'Expected allowed_manual_actions array');
  assert(Array.isArray(primaryWorkspace.review_action_posture_surface.blocked_manual_actions), 'Expected blocked_manual_actions array');
  assert(Array.isArray(primaryWorkspace.review_action_posture_surface.action_preconditions), 'Expected action_preconditions array');
  assert(typeof primaryWorkspace.review_action_posture_surface.posture_bucket === 'string', 'Expected posture_bucket readability');
  assert(Array.isArray(primaryWorkspace.review_action_posture_surface.posture_flags), 'Expected posture_flags array');
  assert(typeof primaryWorkspace.review_action_posture_surface.manual_next_step_read === 'string' && primaryWorkspace.review_action_posture_surface.manual_next_step_read.length > 0, 'Expected manual_next_step_read readability');
  assert(Array.isArray(primaryWorkspace.review_action_posture_surface.hold_reasons), 'Expected hold_reasons array');
  assert(Array.isArray(primaryWorkspace.review_action_posture_surface.escalation_reasons), 'Expected escalation_reasons array');
  assert(primaryWorkspace.workspace_summary && typeof primaryWorkspace.workspace_summary.review_action_posture_bucket === 'string', 'Expected workspace_summary to expose Phase 4I posture bucket');

  const counterexampleWorkspace = readMecReviewWorkspace(postAnchorCounterexample.candidate.id, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });
  assert(counterexampleWorkspace && counterexampleWorkspace.review_action_posture_surface, 'Expected counterexample workspace to expose additive review_action_posture_surface');
  assert(Array.isArray(counterexampleWorkspace.review_action_posture_surface.allowed_manual_actions), 'Expected counterexample posture to expose allowed_manual_actions');
  assert(Array.isArray(counterexampleWorkspace.review_action_posture_surface.blocked_manual_actions), 'Expected counterexample posture to expose blocked_manual_actions');
}

function verifyCliActionPostureReadability() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4i-cli-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4i-cli-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4i-cli-reviews-'));

  const eventOutput = runCli([
    path.join('tools', 'arena.js'),
    'create-event',
    '--event-type', 'phase4i_cli_probe',
    '--domain', 'mec_phase4i',
    '--summary', 'Phase 4I CLI posture probe',
    '--source-ref', 'verifier://phase4i/cli',
    '--trace-ref', 'trace://phase4i/cli',
    '--event-dir', tempEventDir,
    '--json'
  ]);
  const createdEvent = JSON.parse(eventOutput);

  const candidateOutput = runCli([
    path.join('tools', 'arena.js'),
    'create-mec-candidate',
    '--candidate-type', 'invariant_candidate',
    '--principle', 'Phase 4I CLI invariant',
    '--mechanism', 'CLI should expose canonical action posture readability',
    '--source-event-id', createdEvent.event.id,
    '--boundary-fails-when', 'manual posture readability missing',
    '--boundary-fails-when', 'blocked action readability missing',
    '--boundary-edge-case', 'single cli posture probe',
    '--candidate-dir', tempCandidateDir,
    '--event-dir', tempEventDir,
    '--json'
  ]);
  const createdCandidate = JSON.parse(candidateOutput);

  runCli([
    path.join('tools', 'arena.js'),
    'challenge-mec-candidate',
    createdCandidate.candidate.id,
    '--case-description', 'CLI challenge creates a proposal-only counterexample for posture readability.',
    '--impact-on-candidate', 'narrows_scope',
    '--review-source', 'phase4i_cli_verifier',
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
  assert(workspaceOutput.includes('action-posture:'), 'Expected CLI workspace text output to expose Phase 4I action-posture field');
  assert(workspaceOutput.includes('allowed-actions:'), 'Expected CLI workspace text output to expose Phase 4I allowed-actions field');
  assert(workspaceOutput.includes('blocked-actions:'), 'Expected CLI workspace text output to expose Phase 4I blocked-actions field');
}

async function verifyHttpActionPostureReadability() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4i-http-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4i-http-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4i-http-reviews-'));
  const port = 3362;
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
    const timeout = setTimeout(() => reject(new Error('Timed out waiting for arena-server to start for Phase 4I HTTP verification')), 5000);
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
        event_type: 'phase4i_http_probe',
        domain: 'mec_phase4i',
        summary: 'Phase 4I HTTP posture event',
        source_ref: 'verifier://phase4i/http',
        trace_ref: 'trace://phase4i/http'
      })
    });

    const candidatePayload = await fetchJson(`http://127.0.0.1:${port}/arena/mec-candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidate_type: 'invariant_candidate',
        principle: 'Phase 4I HTTP invariant',
        mechanism: 'HTTP should expose canonical action posture semantics',
        source_event_ids: [eventPayload.event.id],
        fails_when: ['manual posture missing', 'manual posture unreadable'],
        edge_cases: ['single http posture probe'],
        severity: 'medium',
        distillation_mode: 'manual'
      })
    });

    await fetchJson(`http://127.0.0.1:${port}/arena/mec-candidates/${candidatePayload.candidate.id}/challenge-counterexamples`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        case_description: 'HTTP challenge creates a proposal-only counterexample for posture readability.',
        impact_on_candidate: 'narrows_scope',
        challenge_source: 'phase4i_http_verifier'
      })
    });

    const workspaceDetailPayload = await fetchJson(`http://127.0.0.1:${port}/arena/mec-review-workspace/${candidatePayload.candidate.id}`);
    assert(workspaceDetailPayload.review_action_posture_surface && typeof workspaceDetailPayload.review_action_posture_surface.posture_bucket === 'string', 'Expected HTTP workspace detail to expose Phase 4I posture_bucket');
    assert(Array.isArray(workspaceDetailPayload.review_action_posture_surface.allowed_manual_actions), 'Expected HTTP workspace detail to expose Phase 4I allowed_manual_actions');
    assert(typeof workspaceDetailPayload.workspace_summary.review_action_posture_bucket === 'string', 'Expected HTTP workspace detail workspace_summary to expose action posture bucket');
  } finally {
    serverProcess.kill();
  }
}

async function main() {
  verifyFilesExist();
  verifyDeskCopy();
  verifyNoDriftStrings();
  verifyRuntimeActionPosture();
  verifyCliActionPostureReadability();
  await verifyHttpActionPostureReadability();
  runVerifier(path.join('tools', 'verify-mec-phase4h-review-gate-decision-packet-surface.js'));
  console.log('MEC Phase 4I review action posture surface verification passed.');
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
