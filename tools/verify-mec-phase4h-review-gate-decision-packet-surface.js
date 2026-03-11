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
  path.join(ROOT_DIR, 'MEC_PHASE4H_IMPLEMENTATION_PLAN.md'),
  path.join(ROOT_DIR, 'MEC_PHASE4H_REVIEW_GATE_DECISION_PACKET_ACCEPTANCE.md'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-phase4h-review-gate-decision-packet-surface.js'),
  path.join(ROOT_DIR, 'tools', 'arena-lib.js'),
  path.join(ROOT_DIR, 'tools', 'arena.js'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-operator-ui-smoke.js'),
  path.join(ROOT_DIR, 'web', 'mec-operator.html')
];
const REQUIRED_UI_STRINGS = [
  'Review gate decision packet',
  'Compact reviewer-taugliche decision packet read over 4E, 4F and 4G without creating a new truth, recommendation, or automation layer.',
  'detail-review-gate-decision-packet',
  'Decision packet summary',
  'Decision basis',
  'Decision risk / unresolved points'
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
    assert(fs.existsSync(filePath), `Missing required Phase 4H file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyDeskCopy() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'web', 'mec-operator.html'), 'utf-8');
  for (const expected of REQUIRED_UI_STRINGS) {
    assert(content.includes(expected), `Expected Phase 4H desk UI copy missing: ${expected}`);
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
      assert(!content.includes(pattern), `Disallowed Phase 4H drift pattern ${pattern} found in ${path.relative(ROOT_DIR, filePath)}`);
    }
  }
}

function verifyRuntimeDecisionPacket() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4h-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4h-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4h-reviews-'));

  const eventResult = createMecEvent({
    event_type: 'phase4h_probe',
    domain: 'mec_phase4h',
    summary: 'Phase 4H decision packet probe',
    source_ref: 'verifier://phase4h/runtime',
    trace_ref: 'trace://phase4h/runtime'
  }, { eventOutputDir: tempEventDir });

  const invariant = createMecCandidateRecord({
    candidate_type: 'invariant_candidate',
    principle: 'Phase 4H invariant target',
    mechanism: 'The decision packet must remain canonical, compact, and read-only.',
    source_event_ids: [eventResult.event.id],
    fails_when: ['decision packet missing', 'decision packet unreadable'],
    edge_cases: ['pre-anchor contribution', 'post-anchor contribution'],
    severity: 'medium',
    distillation_mode: 'manual'
  }, { candidateOutputDir: tempCandidateDir, eventOutputDir: tempEventDir });

  createMecChallengeCounterexample(invariant.candidate.id, {
    case_description: 'Pre-anchor challenge line contributes to packet baseline.',
    resolution: 'Keep proposal-only.',
    impact_on_candidate: 'narrows_scope',
    challenge_source: 'phase4h_runtime_verifier_pre'
  }, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });

  reviewMecCandidate(invariant.candidate.id, {
    review_outcome: 'stabilize',
    review_rationale: 'Phase 4H anchor review.',
    review_source: 'phase4h_verifier'
  }, {
    candidateOutputDir: tempCandidateDir,
    mecReviewOutputDir: tempMecReviewDir
  });

  const postAnchorCounterexample = createMecCandidateRecord({
    candidate_type: 'counterexample_candidate',
    principle: 'Phase 4H post-anchor contribution',
    mechanism: 'A post-anchor contribution should remain visible in the decision packet.',
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
      challenge_summary: 'Post-anchor packet contribution beta.',
      challenge_flags: ['phase4h_post_anchor_beta']
    }
  }, { candidateOutputDir: tempCandidateDir, eventOutputDir: tempEventDir });

  const primaryWorkspace = readMecReviewWorkspace(invariant.candidate.id, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });
  assert(primaryWorkspace && primaryWorkspace.review_gate_decision_packet, 'Expected invariant workspace to expose additive review_gate_decision_packet');
  assert(primaryWorkspace.review_gate_decision_packet.review_gate_decision_packet_surface_version === 'phase4h-mec-review-gate-decision-packet/v1', 'Expected Phase 4H surface version marker');
  assert(primaryWorkspace.review_gate_decision_packet.decision_snapshot && typeof primaryWorkspace.review_gate_decision_packet.decision_snapshot.review_readiness_bucket === 'string', 'Expected decision_snapshot readability');
  assert(primaryWorkspace.review_gate_decision_packet.decision_basis && Array.isArray(primaryWorkspace.review_gate_decision_packet.decision_basis.carried_fields), 'Expected decision_basis readability');
  assert(primaryWorkspace.review_gate_decision_packet.evidence_anchor_read && typeof primaryWorkspace.review_gate_decision_packet.evidence_anchor_read.evidence_summary === 'string', 'Expected evidence_anchor_read readability');
  assert(primaryWorkspace.review_gate_decision_packet.decision_risk_read && typeof primaryWorkspace.review_gate_decision_packet.decision_risk_read.risk_bucket === 'string', 'Expected decision_risk_read readability');
  assert(Array.isArray(primaryWorkspace.review_gate_decision_packet.unresolved_decision_points), 'Expected unresolved_decision_points array');
  assert(Array.isArray(primaryWorkspace.review_gate_decision_packet.packet_flags), 'Expected packet_flags array');
  assert(typeof primaryWorkspace.review_gate_decision_packet.decision_packet_summary === 'string' && primaryWorkspace.review_gate_decision_packet.decision_packet_summary.length > 0, 'Expected decision_packet_summary readability');
  assert(primaryWorkspace.workspace_summary && typeof primaryWorkspace.workspace_summary.review_gate_decision_risk_bucket === 'string', 'Expected workspace_summary to expose Phase 4H decision risk bucket');

  const counterexampleWorkspace = readMecReviewWorkspace(postAnchorCounterexample.candidate.id, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });
  assert(counterexampleWorkspace && counterexampleWorkspace.review_gate_decision_packet, 'Expected counterexample workspace to expose additive review_gate_decision_packet');
  assert(counterexampleWorkspace.review_gate_decision_packet.decision_snapshot, 'Expected counterexample packet to expose decision_snapshot');
  assert(Array.isArray(counterexampleWorkspace.review_gate_decision_packet.unresolved_decision_points), 'Expected counterexample packet to expose unresolved_decision_points');
}

function verifyCliDecisionPacketReadability() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4h-cli-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4h-cli-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4h-cli-reviews-'));

  const eventOutput = runCli([
    path.join('tools', 'arena.js'),
    'create-event',
    '--event-type', 'phase4h_cli_probe',
    '--domain', 'mec_phase4h',
    '--summary', 'Phase 4H CLI packet probe',
    '--source-ref', 'verifier://phase4h/cli',
    '--trace-ref', 'trace://phase4h/cli',
    '--event-dir', tempEventDir,
    '--json'
  ]);
  const createdEvent = JSON.parse(eventOutput);

  const candidateOutput = runCli([
    path.join('tools', 'arena.js'),
    'create-mec-candidate',
    '--candidate-type', 'invariant_candidate',
    '--principle', 'Phase 4H CLI invariant',
    '--mechanism', 'CLI should expose canonical decision packet readability',
    '--source-event-id', createdEvent.event.id,
    '--boundary-fails-when', 'decision packet readability missing',
    '--boundary-fails-when', 'open-point readability missing',
    '--boundary-edge-case', 'single cli packet probe',
    '--candidate-dir', tempCandidateDir,
    '--event-dir', tempEventDir,
    '--json'
  ]);
  const createdCandidate = JSON.parse(candidateOutput);

  runCli([
    path.join('tools', 'arena.js'),
    'challenge-mec-candidate',
    createdCandidate.candidate.id,
    '--case-description', 'CLI challenge creates a proposal-only counterexample for packet readability.',
    '--impact-on-candidate', 'narrows_scope',
    '--review-source', 'phase4h_cli_verifier',
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
  assert(workspaceOutput.includes('decision-risk:'), 'Expected CLI workspace text output to expose Phase 4H decision-risk field');
  assert(workspaceOutput.includes('open-points:'), 'Expected CLI workspace text output to expose Phase 4H open-points field');
}

async function verifyHttpDecisionPacketReadability() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4h-http-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4h-http-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4h-http-reviews-'));
  const port = 3361;
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
    const timeout = setTimeout(() => reject(new Error('Timed out waiting for arena-server to start for Phase 4H HTTP verification')), 5000);
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
        event_type: 'phase4h_http_probe',
        domain: 'mec_phase4h',
        summary: 'Phase 4H HTTP packet event',
        source_ref: 'verifier://phase4h/http',
        trace_ref: 'trace://phase4h/http'
      })
    });

    const candidatePayload = await fetchJson(`http://127.0.0.1:${port}/arena/mec-candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidate_type: 'invariant_candidate',
        principle: 'Phase 4H HTTP invariant',
        mechanism: 'HTTP should expose canonical decision packet semantics',
        source_event_ids: [eventPayload.event.id],
        fails_when: ['packet missing', 'packet unreadable'],
        edge_cases: ['single http packet probe'],
        severity: 'medium',
        distillation_mode: 'manual'
      })
    });

    await fetchJson(`http://127.0.0.1:${port}/arena/mec-candidates/${candidatePayload.candidate.id}/challenge-counterexamples`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        case_description: 'HTTP challenge creates a proposal-only counterexample for packet readability.',
        impact_on_candidate: 'narrows_scope',
        challenge_source: 'phase4h_http_verifier'
      })
    });

    const workspaceDetailPayload = await fetchJson(`http://127.0.0.1:${port}/arena/mec-review-workspace/${candidatePayload.candidate.id}`);
    assert(workspaceDetailPayload.review_gate_decision_packet && typeof workspaceDetailPayload.review_gate_decision_packet.decision_packet_summary === 'string', 'Expected HTTP workspace detail to expose Phase 4H decision_packet_summary');
    assert(Array.isArray(workspaceDetailPayload.review_gate_decision_packet.unresolved_decision_points), 'Expected HTTP workspace detail to expose Phase 4H unresolved_decision_points');
    assert(typeof workspaceDetailPayload.workspace_summary.review_gate_decision_risk_bucket === 'string', 'Expected HTTP workspace detail workspace_summary to expose decision risk bucket');
  } finally {
    serverProcess.kill();
  }
}

async function main() {
  verifyFilesExist();
  verifyDeskCopy();
  verifyNoDriftStrings();
  verifyRuntimeDecisionPacket();
  verifyCliDecisionPacketReadability();
  await verifyHttpDecisionPacketReadability();
  runVerifier(path.join('tools', 'verify-mec-phase4g-gate-threshold-trace-reason-code-surface.js'));
  console.log('MEC Phase 4H review gate decision packet surface verification passed.');
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
