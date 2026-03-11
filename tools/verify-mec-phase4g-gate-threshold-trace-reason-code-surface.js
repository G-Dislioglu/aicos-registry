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
  path.join(ROOT_DIR, 'MEC_PHASE4G_IMPLEMENTATION_PLAN.md'),
  path.join(ROOT_DIR, 'MEC_PHASE4G_GATE_THRESHOLD_TRACE_REASON_CODE_ACCEPTANCE.md'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-phase4g-gate-threshold-trace-reason-code-surface.js'),
  path.join(ROOT_DIR, 'tools', 'arena-lib.js'),
  path.join(ROOT_DIR, 'tools', 'arena.js'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-operator-ui-smoke.js'),
  path.join(ROOT_DIR, 'web', 'mec-operator.html')
];
const REQUIRED_UI_STRINGS = [
  'Gate threshold trace / reason codes',
  'Structured reason codes and threshold trace showing why the current gate bucket reads as it does, without introducing any recommendation layer.',
  'detail-review-gate-threshold-trace',
  'Bucket explanation summary',
  'Reason codes',
  'Threshold trace'
];
const DISALLOWED_PATTERNS = [
  'recommended_outcome',
  'recommended_action',
  'queue_position',
  'should_reopen',
  'should_queue',
  'next_action',
  'auto_review',
  'priority_rank'
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
    assert(fs.existsSync(filePath), `Missing required Phase 4G file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyDeskCopy() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'web', 'mec-operator.html'), 'utf-8');
  for (const expected of REQUIRED_UI_STRINGS) {
    assert(content.includes(expected), `Expected Phase 4G desk UI copy missing: ${expected}`);
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
      assert(!content.includes(pattern), `Disallowed Phase 4G drift pattern ${pattern} found in ${path.relative(ROOT_DIR, filePath)}`);
    }
  }
}

function verifyRuntimeTraceSurface() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4g-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4g-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4g-reviews-'));

  const eventResult = createMecEvent({
    event_type: 'phase4g_probe',
    domain: 'mec_phase4g',
    summary: 'Phase 4G threshold trace probe',
    source_ref: 'verifier://phase4g/runtime',
    trace_ref: 'trace://phase4g/runtime'
  }, { eventOutputDir: tempEventDir });

  const invariant = createMecCandidateRecord({
    candidate_type: 'invariant_candidate',
    principle: 'Phase 4G invariant target',
    mechanism: 'The threshold trace must explain the gate bucket without recommendation drift.',
    source_event_ids: [eventResult.event.id],
    fails_when: ['threshold trace missing', 'reason codes unreadable'],
    edge_cases: ['pre-anchor contribution', 'post-anchor contribution'],
    severity: 'medium',
    distillation_mode: 'manual'
  }, { candidateOutputDir: tempCandidateDir, eventOutputDir: tempEventDir });

  createMecChallengeCounterexample(invariant.candidate.id, {
    case_description: 'Pre-anchor challenge line contributes to trace baseline.',
    resolution: 'Keep proposal-only.',
    impact_on_candidate: 'narrows_scope',
    challenge_source: 'phase4g_runtime_verifier_pre'
  }, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });

  reviewMecCandidate(invariant.candidate.id, {
    review_outcome: 'stabilize',
    review_rationale: 'Phase 4G anchor review.',
    review_source: 'phase4g_verifier'
  }, {
    candidateOutputDir: tempCandidateDir,
    mecReviewOutputDir: tempMecReviewDir
  });

  const postAnchorCounterexample = createMecCandidateRecord({
    candidate_type: 'counterexample_candidate',
    principle: 'Phase 4G post-anchor contribution',
    mechanism: 'A post-anchor contribution should remain visible in reason codes and threshold trace.',
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
      challenge_summary: 'Post-anchor trace contribution beta.',
      challenge_flags: ['phase4g_post_anchor_beta']
    }
  }, { candidateOutputDir: tempCandidateDir, eventOutputDir: tempEventDir });

  const primaryWorkspace = readMecReviewWorkspace(invariant.candidate.id, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });
  assert(primaryWorkspace && primaryWorkspace.review_gate_threshold_trace, 'Expected invariant workspace to expose additive review_gate_threshold_trace');
  assert(primaryWorkspace.review_gate_threshold_trace.review_gate_threshold_trace_surface_version === 'phase4g-mec-review-gate-threshold-trace/v1', 'Expected Phase 4G surface version marker');
  assert(Array.isArray(primaryWorkspace.review_gate_threshold_trace.reason_codes) && primaryWorkspace.review_gate_threshold_trace.reason_codes.length > 0, 'Expected reason_codes readability');
  assert(Array.isArray(primaryWorkspace.review_gate_threshold_trace.threshold_trace) && primaryWorkspace.review_gate_threshold_trace.threshold_trace.length > 0, 'Expected threshold_trace readability');
  assert(Array.isArray(primaryWorkspace.review_gate_threshold_trace.signal_provenance_read) && primaryWorkspace.review_gate_threshold_trace.signal_provenance_read.length > 0, 'Expected signal provenance readability');
  assert(typeof primaryWorkspace.review_gate_threshold_trace.bucket_explanation_summary === 'string' && primaryWorkspace.review_gate_threshold_trace.bucket_explanation_summary.length > 0, 'Expected bucket explanation summary readability');
  assert(Array.isArray(primaryWorkspace.review_gate_threshold_trace.blocker_reasons), 'Expected blocker_reasons array');
  assert(Array.isArray(primaryWorkspace.review_gate_threshold_trace.concern_reasons), 'Expected concern_reasons array');
  assert(Array.isArray(primaryWorkspace.review_gate_threshold_trace.support_reasons), 'Expected support_reasons array');
  assert(primaryWorkspace.workspace_summary && typeof primaryWorkspace.workspace_summary.review_gate_reason_code_count === 'number', 'Expected workspace_summary to expose Phase 4G reason code count');

  const counterexampleWorkspace = readMecReviewWorkspace(postAnchorCounterexample.candidate.id, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });
  assert(counterexampleWorkspace && counterexampleWorkspace.review_gate_threshold_trace, 'Expected counterexample workspace to expose additive review_gate_threshold_trace');
  assert(Array.isArray(counterexampleWorkspace.review_gate_threshold_trace.reason_codes), 'Expected counterexample trace surface to expose reason_codes');
  assert(Array.isArray(counterexampleWorkspace.review_gate_threshold_trace.threshold_trace), 'Expected counterexample trace surface to expose threshold_trace');
}

function verifyCliTraceReadability() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4g-cli-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4g-cli-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4g-cli-reviews-'));

  const eventOutput = runCli([
    path.join('tools', 'arena.js'),
    'create-event',
    '--event-type', 'phase4g_cli_probe',
    '--domain', 'mec_phase4g',
    '--summary', 'Phase 4G CLI trace probe',
    '--source-ref', 'verifier://phase4g/cli',
    '--trace-ref', 'trace://phase4g/cli',
    '--event-dir', tempEventDir,
    '--json'
  ]);
  const createdEvent = JSON.parse(eventOutput);

  const candidateOutput = runCli([
    path.join('tools', 'arena.js'),
    'create-mec-candidate',
    '--candidate-type', 'invariant_candidate',
    '--principle', 'Phase 4G CLI invariant',
    '--mechanism', 'CLI should expose canonical threshold trace readability',
    '--source-event-id', createdEvent.event.id,
    '--boundary-fails-when', 'reason-code readability missing',
    '--boundary-fails-when', 'primary reason readability missing',
    '--boundary-edge-case', 'single cli trace probe',
    '--candidate-dir', tempCandidateDir,
    '--event-dir', tempEventDir,
    '--json'
  ]);
  const createdCandidate = JSON.parse(candidateOutput);

  runCli([
    path.join('tools', 'arena.js'),
    'challenge-mec-candidate',
    createdCandidate.candidate.id,
    '--case-description', 'CLI challenge creates a proposal-only counterexample for threshold trace readability.',
    '--impact-on-candidate', 'narrows_scope',
    '--review-source', 'phase4g_cli_verifier',
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
  assert(workspaceOutput.includes('reason-codes:'), 'Expected CLI workspace text output to expose Phase 4G reason-codes field');
  assert(workspaceOutput.includes('primary-reason:'), 'Expected CLI workspace text output to expose Phase 4G primary-reason field');
}

async function verifyHttpTraceReadability() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4g-http-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4g-http-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4g-http-reviews-'));
  const port = 3360;
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
    const timeout = setTimeout(() => reject(new Error('Timed out waiting for arena-server to start for Phase 4G HTTP verification')), 5000);
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
        event_type: 'phase4g_http_probe',
        domain: 'mec_phase4g',
        summary: 'Phase 4G HTTP trace event',
        source_ref: 'verifier://phase4g/http',
        trace_ref: 'trace://phase4g/http'
      })
    });

    const candidatePayload = await fetchJson(`http://127.0.0.1:${port}/arena/mec-candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidate_type: 'invariant_candidate',
        principle: 'Phase 4G HTTP invariant',
        mechanism: 'HTTP should expose canonical threshold trace semantics',
        source_event_ids: [eventPayload.event.id],
        fails_when: ['trace missing', 'reason codes unreadable'],
        edge_cases: ['single http trace probe'],
        severity: 'medium',
        distillation_mode: 'manual'
      })
    });

    await fetchJson(`http://127.0.0.1:${port}/arena/mec-candidates/${candidatePayload.candidate.id}/challenge-counterexamples`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        case_description: 'HTTP challenge creates a proposal-only counterexample for threshold trace readability.',
        impact_on_candidate: 'narrows_scope',
        challenge_source: 'phase4g_http_verifier'
      })
    });

    const workspaceDetailPayload = await fetchJson(`http://127.0.0.1:${port}/arena/mec-review-workspace/${candidatePayload.candidate.id}`);
    assert(workspaceDetailPayload.review_gate_threshold_trace && typeof workspaceDetailPayload.review_gate_threshold_trace.bucket_explanation_summary === 'string', 'Expected HTTP workspace detail to expose Phase 4G bucket explanation summary');
    assert(Array.isArray(workspaceDetailPayload.review_gate_threshold_trace.reason_codes), 'Expected HTTP workspace detail to expose Phase 4G reason_codes');
    assert(typeof workspaceDetailPayload.workspace_summary.review_gate_primary_reason_code === 'string' || workspaceDetailPayload.workspace_summary.review_gate_primary_reason_code === null, 'Expected HTTP workspace detail workspace_summary to expose primary reason code');
  } finally {
    serverProcess.kill();
  }
}

async function main() {
  verifyFilesExist();
  verifyDeskCopy();
  verifyNoDriftStrings();
  verifyRuntimeTraceSurface();
  verifyCliTraceReadability();
  await verifyHttpTraceReadability();
  runVerifier(path.join('tools', 'verify-mec-phase4f-review-gate-signal-surface.js'));
  console.log('MEC Phase 4G gate threshold trace and reason-code surface verification passed.');
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
