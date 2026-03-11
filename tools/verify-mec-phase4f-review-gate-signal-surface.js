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
  path.join(ROOT_DIR, 'MEC_PHASE4F_IMPLEMENTATION_PLAN.md'),
  path.join(ROOT_DIR, 'MEC_PHASE4F_REVIEW_GATE_SIGNAL_SURFACE_ACCEPTANCE.md'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-phase4f-review-gate-signal-surface.js'),
  path.join(ROOT_DIR, 'tools', 'arena-lib.js'),
  path.join(ROOT_DIR, 'tools', 'arena.js'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-operator-ui-smoke.js'),
  path.join(ROOT_DIR, 'web', 'mec-operator.html')
];
const REQUIRED_UI_STRINGS = [
  'Review gate signal surface',
  'Normalized review gate signals derived from the canonical digest only: coverage, stability, contradiction pressure, watchpoints, and gate flags.',
  'detail-review-gate-signals',
  'Review readiness summary',
  'coverage_signal',
  'Gate flags'
];
const DISALLOWED_PATTERNS = [
  'recommended_outcome',
  'gate_recommendation',
  'should_reopen',
  'should_queue',
  'queue_position',
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
    assert(fs.existsSync(filePath), `Missing required Phase 4F file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyDeskCopy() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'web', 'mec-operator.html'), 'utf-8');
  for (const expected of REQUIRED_UI_STRINGS) {
    assert(content.includes(expected), `Expected Phase 4F desk UI copy missing: ${expected}`);
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
      assert(!content.includes(pattern), `Disallowed Phase 4F drift pattern ${pattern} found in ${path.relative(ROOT_DIR, filePath)}`);
    }
  }
}

function verifyRuntimeGateSignals() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4f-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4f-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4f-reviews-'));

  const eventResult = createMecEvent({
    event_type: 'phase4f_probe',
    domain: 'mec_phase4f',
    summary: 'Phase 4F review gate signal probe',
    source_ref: 'verifier://phase4f/runtime',
    trace_ref: 'trace://phase4f/runtime'
  }, { eventOutputDir: tempEventDir });

  const invariant = createMecCandidateRecord({
    candidate_type: 'invariant_candidate',
    principle: 'Phase 4F invariant target',
    mechanism: 'The review gate signal surface must stay canonical and additive.',
    source_event_ids: [eventResult.event.id],
    fails_when: ['gate signals missing', 'readiness unreadable'],
    edge_cases: ['pre-anchor contribution', 'post-anchor contribution'],
    severity: 'medium',
    distillation_mode: 'manual'
  }, { candidateOutputDir: tempCandidateDir, eventOutputDir: tempEventDir });

  createMecChallengeCounterexample(invariant.candidate.id, {
    case_description: 'Pre-anchor challenge line contributes to gate baseline.',
    resolution: 'Keep proposal-only.',
    impact_on_candidate: 'narrows_scope',
    challenge_source: 'phase4f_runtime_verifier_pre'
  }, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });

  reviewMecCandidate(invariant.candidate.id, {
    review_outcome: 'stabilize',
    review_rationale: 'Phase 4F anchor review.',
    review_source: 'phase4f_verifier'
  }, {
    candidateOutputDir: tempCandidateDir,
    mecReviewOutputDir: tempMecReviewDir
  });

  const postAnchorCounterexample = createMecCandidateRecord({
    candidate_type: 'counterexample_candidate',
    principle: 'Phase 4F post-anchor contribution',
    mechanism: 'A post-anchor contribution should remain visible in normalized gate signals.',
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
      challenge_summary: 'Post-anchor gate contribution beta.',
      challenge_flags: ['phase4f_post_anchor_beta']
    }
  }, { candidateOutputDir: tempCandidateDir, eventOutputDir: tempEventDir });

  const primaryWorkspace = readMecReviewWorkspace(invariant.candidate.id, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });
  assert(primaryWorkspace && primaryWorkspace.review_gate_signal_surface, 'Expected invariant workspace to expose additive review_gate_signal_surface');
  assert(primaryWorkspace.review_gate_signal_surface.review_gate_signal_surface_version === 'phase4f-mec-review-gate-signal-surface/v1', 'Expected Phase 4F surface version marker');
  assert(typeof primaryWorkspace.review_gate_signal_surface.coverage_signal === 'string' && primaryWorkspace.review_gate_signal_surface.coverage_signal.length > 0, 'Expected coverage_signal readability');
  assert(typeof primaryWorkspace.review_gate_signal_surface.stability_signal === 'string' && primaryWorkspace.review_gate_signal_surface.stability_signal.length > 0, 'Expected stability_signal readability');
  assert(typeof primaryWorkspace.review_gate_signal_surface.contradiction_pressure_signal === 'string' && primaryWorkspace.review_gate_signal_surface.contradiction_pressure_signal.length > 0, 'Expected contradiction_pressure_signal readability');
  assert(typeof primaryWorkspace.review_gate_signal_surface.unresolved_watchpoint_signal === 'string' && primaryWorkspace.review_gate_signal_surface.unresolved_watchpoint_signal.length > 0, 'Expected unresolved_watchpoint_signal readability');
  assert(typeof primaryWorkspace.review_gate_signal_surface.review_readiness_summary === 'string' && primaryWorkspace.review_gate_signal_surface.review_readiness_summary.length > 0, 'Expected review_readiness_summary readability');
  assert(Array.isArray(primaryWorkspace.review_gate_signal_surface.gate_flags), 'Expected gate_flags array');
  assert(primaryWorkspace.workspace_summary && typeof primaryWorkspace.workspace_summary.review_gate_readiness_bucket === 'string', 'Expected workspace_summary to expose Phase 4F readiness bucket');

  const counterexampleWorkspace = readMecReviewWorkspace(postAnchorCounterexample.candidate.id, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });
  assert(counterexampleWorkspace && counterexampleWorkspace.review_gate_signal_surface, 'Expected counterexample workspace to expose additive review_gate_signal_surface');
  assert(typeof counterexampleWorkspace.review_gate_signal_surface.coverage_signal === 'string', 'Expected counterexample gate surface to expose coverage_signal');
  assert(Array.isArray(counterexampleWorkspace.review_gate_signal_surface.gate_flags), 'Expected counterexample gate surface to expose gate_flags');
}

function verifyCliGateReadability() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4f-cli-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4f-cli-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4f-cli-reviews-'));

  const eventOutput = runCli([
    path.join('tools', 'arena.js'),
    'create-event',
    '--event-type', 'phase4f_cli_probe',
    '--domain', 'mec_phase4f',
    '--summary', 'Phase 4F CLI gate probe',
    '--source-ref', 'verifier://phase4f/cli',
    '--trace-ref', 'trace://phase4f/cli',
    '--event-dir', tempEventDir,
    '--json'
  ]);
  const createdEvent = JSON.parse(eventOutput);

  const candidateOutput = runCli([
    path.join('tools', 'arena.js'),
    'create-mec-candidate',
    '--candidate-type', 'invariant_candidate',
    '--principle', 'Phase 4F CLI invariant',
    '--mechanism', 'CLI should expose canonical gate signal readability',
    '--source-event-id', createdEvent.event.id,
    '--boundary-fails-when', 'gate readability missing',
    '--boundary-fails-when', 'coverage signal readability missing',
    '--boundary-edge-case', 'single cli gate probe',
    '--candidate-dir', tempCandidateDir,
    '--event-dir', tempEventDir,
    '--json'
  ]);
  const createdCandidate = JSON.parse(candidateOutput);

  runCli([
    path.join('tools', 'arena.js'),
    'challenge-mec-candidate',
    createdCandidate.candidate.id,
    '--case-description', 'CLI challenge creates a proposal-only counterexample for gate readability.',
    '--impact-on-candidate', 'narrows_scope',
    '--review-source', 'phase4f_cli_verifier',
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
  assert(workspaceOutput.includes('gate:'), 'Expected CLI workspace text output to expose Phase 4F gate field');
  assert(workspaceOutput.includes('coverage-signal:'), 'Expected CLI workspace text output to expose Phase 4F coverage signal field');
  assert(workspaceOutput.includes('watchpoint-signal:'), 'Expected CLI workspace text output to expose Phase 4F watchpoint signal field');
}

async function verifyHttpGateReadability() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4f-http-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4f-http-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4f-http-reviews-'));
  const port = 3359;
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
    const timeout = setTimeout(() => reject(new Error('Timed out waiting for arena-server to start for Phase 4F HTTP verification')), 5000);
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
        event_type: 'phase4f_http_probe',
        domain: 'mec_phase4f',
        summary: 'Phase 4F HTTP gate event',
        source_ref: 'verifier://phase4f/http',
        trace_ref: 'trace://phase4f/http'
      })
    });

    const candidatePayload = await fetchJson(`http://127.0.0.1:${port}/arena/mec-candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidate_type: 'invariant_candidate',
        principle: 'Phase 4F HTTP invariant',
        mechanism: 'HTTP should expose canonical gate signal semantics',
        source_event_ids: [eventPayload.event.id],
        fails_when: ['gate missing', 'signal unreadable'],
        edge_cases: ['single http gate probe'],
        severity: 'medium',
        distillation_mode: 'manual'
      })
    });

    await fetchJson(`http://127.0.0.1:${port}/arena/mec-candidates/${candidatePayload.candidate.id}/challenge-counterexamples`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        case_description: 'HTTP challenge creates a proposal-only counterexample for gate readability.',
        impact_on_candidate: 'narrows_scope',
        challenge_source: 'phase4f_http_verifier'
      })
    });

    const workspaceDetailPayload = await fetchJson(`http://127.0.0.1:${port}/arena/mec-review-workspace/${candidatePayload.candidate.id}`);
    assert(workspaceDetailPayload.review_gate_signal_surface && typeof workspaceDetailPayload.review_gate_signal_surface.review_readiness_summary === 'string', 'Expected HTTP workspace detail to expose Phase 4F review readiness summary');
    assert(Array.isArray(workspaceDetailPayload.review_gate_signal_surface.gate_flags), 'Expected HTTP workspace detail to expose Phase 4F gate_flags');
    assert(typeof workspaceDetailPayload.workspace_summary.review_gate_readiness_bucket === 'string', 'Expected HTTP workspace detail workspace_summary to expose readiness bucket');
  } finally {
    serverProcess.kill();
  }
}

async function main() {
  verifyFilesExist();
  verifyDeskCopy();
  verifyNoDriftStrings();
  verifyRuntimeGateSignals();
  verifyCliGateReadability();
  await verifyHttpGateReadability();
  runVerifier(path.join('tools', 'verify-mec-phase4e-challenge-dossier-review-digest.js'));
  console.log('MEC Phase 4F review gate signal surface verification passed.');
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
