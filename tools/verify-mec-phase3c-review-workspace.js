#!/usr/bin/env node
const { spawn, spawnSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  createMecCandidateRecord,
  createMecEvent,
  listMecReviewWorkspace,
  readMecReviewWorkspace,
  reviewMecCandidate
} = require('./arena-lib');

const ROOT_DIR = path.join(__dirname, '..');
const REQUIRED_FILES = [
  path.join(ROOT_DIR, 'MEC_PHASE3C_CANONICAL_REVIEW_WORKSPACE_ACCEPTANCE.md'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-phase3c-review-workspace.js'),
  path.join(ROOT_DIR, 'tools', 'arena-lib.js'),
  path.join(ROOT_DIR, 'tools', 'arena.js'),
  path.join(ROOT_DIR, 'tools', 'arena-server.js'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-operator-ui-smoke.js'),
  path.join(ROOT_DIR, 'web', 'mec-operator.html')
];
const REGISTRY_DIRS = [
  path.join(ROOT_DIR, 'cards'),
  path.join(ROOT_DIR, 'index'),
  path.join(ROOT_DIR, 'human'),
  path.join(ROOT_DIR, 'taxonomies')
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
    assert(fs.existsSync(filePath), `Missing required Phase 3C file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyRuntimeWorkspace() {
  const registryBefore = snapshotRegistry();
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase3c-runtime-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase3c-runtime-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase3c-runtime-reviews-'));

  const eventResult = createMecEvent({
    event_type: 'phase3c_probe',
    domain: 'mec_phase3c',
    summary: 'Phase 3C canonical workspace event',
    source_ref: 'verifier://phase3c/runtime',
    trace_ref: 'trace://phase3c/runtime'
  }, { eventOutputDir: tempEventDir });

  const invariant = createMecCandidateRecord({
    candidate_type: 'invariant_candidate',
    principle: 'Phase 3C invariant workspace object',
    mechanism: 'Workspace should consolidate linkage and review state',
    source_event_ids: [eventResult.event.id],
    fails_when: ['workspace derivation missing', 'pair linkage disappears'],
    edge_cases: ['single workspace derivation'],
    severity: 'medium',
    distillation_mode: 'manual'
  }, { candidateOutputDir: tempCandidateDir, eventOutputDir: tempEventDir });

  const boundary = createMecCandidateRecord({
    candidate_type: 'boundary_candidate',
    principle: 'Phase 3C boundary workspace object',
    mechanism: 'Boundary should stay visible in the same workspace',
    linked_candidate_id: invariant.candidate.id,
    source_event_ids: [eventResult.event.id],
    fails_when: ['linked candidate disappears'],
    edge_cases: ['runtime-only link drift'],
    severity: 'medium',
    distillation_mode: 'manual'
  }, { candidateOutputDir: tempCandidateDir, eventOutputDir: tempEventDir });

  const curiosity = createMecCandidateRecord({
    candidate_type: 'curiosity_candidate',
    principle: 'Phase 3C curiosity workspace object',
    mechanism: 'Workspace keeps raw and derived state separate',
    open_question: 'Can the workspace show the latest outcome consistently?',
    domain: 'mec_phase3c',
    blind_spot_score: 0.4,
    source_event_ids: [eventResult.event.id],
    distillation_mode: 'manual'
  }, { candidateOutputDir: tempCandidateDir, eventOutputDir: tempEventDir });

  reviewMecCandidate(curiosity.candidate.id, {
    review_outcome: 'reject',
    review_rationale: 'Phase 3C runtime workspace reject proof.',
    review_source: 'phase3c_runtime_verifier',
    reviewer_mode: 'human'
  }, { candidateOutputDir: tempCandidateDir, mecReviewOutputDir: tempMecReviewDir });

  const invariantWorkspaceBeforeRemoval = readMecReviewWorkspace(invariant.candidate.id, {
    candidateOutputDir: tempCandidateDir,
    mecReviewOutputDir: tempMecReviewDir,
    eventOutputDir: tempEventDir
  });
  assert(invariantWorkspaceBeforeRemoval && invariantWorkspaceBeforeRemoval.challenge_context && typeof invariantWorkspaceBeforeRemoval.challenge_context.contradiction_pressure_bucket === 'string', 'Expected invariant workspace item to expose additive Phase 4A challenge context before pair-removal setup');
  assert(invariantWorkspaceBeforeRemoval.challenge_context && invariantWorkspaceBeforeRemoval.challenge_context.manual_counterexample_allowed === true, 'Expected invariant workspace item to remain eligible for the locked manual Phase 4A challenge path');

  for (const candidateFilePath of invariant.candidateFilePaths || []) {
    if (fs.existsSync(candidateFilePath)) {
      fs.unlinkSync(candidateFilePath);
    }
  }
  fs.unlinkSync(path.join(tempEventDir, `${eventResult.event.id}.json`));

  const workspaceItems = listMecReviewWorkspace({
    candidateOutputDir: tempCandidateDir,
    mecReviewOutputDir: tempMecReviewDir,
    eventOutputDir: tempEventDir
  });
  assert(workspaceItems.length === 2, 'Expected workspace list to derive over the remaining runtime candidates');

  const boundaryWorkspace = workspaceItems.find(item => item.candidate_id === boundary.candidate.id);
  assert(boundaryWorkspace, 'Expected boundary candidate in runtime workspace list');
  assert(boundaryWorkspace.workspace_kind === 'mec_review_workspace', 'Expected canonical workspace kind on runtime workspace item');
  assert(boundaryWorkspace.unresolved_runtime_reference_count >= 2, 'Expected boundary workspace item to surface unresolved linked-candidate and source-event risks');
  assert(boundaryWorkspace.control_readiness.reviewable === true, 'Expected unresolved boundary workspace item to stay minimally reviewable');
  assert(boundaryWorkspace.control_readiness.available_outcomes.includes('stabilize') && boundaryWorkspace.control_readiness.available_outcomes.includes('reject'), 'Expected reviewable workspace item to expose minimal outcomes');
  assert(boundaryWorkspace.evidence_context && boundaryWorkspace.evidence_context.integrity_state === 'degraded', 'Expected unresolved boundary workspace item to expose degraded evidence integrity');
  assert(Array.isArray(boundaryWorkspace.evidence_context.reference_signals) && boundaryWorkspace.evidence_context.reference_signals.length >= 2, 'Expected unresolved boundary workspace item to expose reference risk signals');
  assert(boundaryWorkspace.state_explanation && Array.isArray(boundaryWorkspace.state_explanation.missing_visible_prerequisites) && boundaryWorkspace.state_explanation.missing_visible_prerequisites.length >= 2, 'Expected unresolved boundary workspace item to explain missing visible prerequisites');
  assert(boundaryWorkspace.review_history_context && boundaryWorkspace.review_history_context.history_state === 'awaiting_first_review', 'Expected unresolved boundary workspace item to expose pre-review history state');
  assert(Array.isArray(boundaryWorkspace.related_candidate_context) && boundaryWorkspace.related_candidate_context.length >= 1, 'Expected unresolved boundary workspace item to expose related candidate context additively');
  assert(boundaryWorkspace.focus_context && boundaryWorkspace.focus_context.focus_bucket === 'reviewable_reference_tension', 'Expected unresolved boundary workspace item to derive a focus bucket from visible reference tension');
  assert(boundaryWorkspace.focus_context && Array.isArray(boundaryWorkspace.focus_context.focus_signals) && boundaryWorkspace.focus_context.focus_signals.length >= 1, 'Expected unresolved boundary workspace item to expose additive focus signals');
  assert(boundaryWorkspace.compare_context && boundaryWorkspace.compare_context.compare_ready === true, 'Expected unresolved boundary workspace item to remain compare-ready from visible pair or related signals');
  assert(boundaryWorkspace.compare_context && Array.isArray(boundaryWorkspace.compare_context.compare_candidates) && boundaryWorkspace.compare_context.compare_candidates.length >= 1, 'Expected unresolved boundary workspace item to expose additive compare candidates');
  assert(boundaryWorkspace.delta_context && boundaryWorkspace.delta_context.movement_bucket === 'first_read_attention', 'Expected unresolved boundary workspace item to derive a first-read attention delta bucket from visible signals');
  assert(boundaryWorkspace.delta_context && typeof boundaryWorkspace.delta_context.why_now === 'string' && boundaryWorkspace.delta_context.why_now.length > 0, 'Expected unresolved boundary workspace item to expose additive why-now readability');
  assert(boundaryWorkspace.delta_context && Array.isArray(boundaryWorkspace.delta_context.delta_signals) && boundaryWorkspace.delta_context.delta_signals.length >= 1, 'Expected unresolved boundary workspace item to expose additive delta signals');
  assert(boundaryWorkspace.contradiction_context && boundaryWorkspace.contradiction_context.contradiction_present === true, 'Expected unresolved boundary workspace item to expose visible contradiction context');
  assert(boundaryWorkspace.contradiction_context && Array.isArray(boundaryWorkspace.contradiction_context.contradiction_signals) && boundaryWorkspace.contradiction_context.contradiction_signals.length >= 1, 'Expected unresolved boundary workspace item to expose contradiction signals');
  assert(boundaryWorkspace.decision_packet_context && boundaryWorkspace.decision_packet_context.decision_readiness === 'decision_fragile', 'Expected unresolved boundary workspace item to derive a fragile decision packet from visible friction and contradiction');
  assert(boundaryWorkspace.decision_packet_context && Array.isArray(boundaryWorkspace.decision_packet_context.friction_signals) && boundaryWorkspace.decision_packet_context.friction_signals.length >= 1, 'Expected unresolved boundary workspace item to expose decision friction signals');
  assert(boundaryWorkspace.challenge_context && boundaryWorkspace.challenge_context.manual_counterexample_allowed === false, 'Expected unresolved boundary workspace item to expose additive challenge context with the Phase 4A lock still blocking manual challenge output');
  assert(boundaryWorkspace.challenge_context && typeof boundaryWorkspace.challenge_context.challenge_summary === 'string', 'Expected unresolved boundary workspace item to expose additive challenge summary readability');
  assert(boundaryWorkspace.review_trace_context && boundaryWorkspace.review_trace_context.trace_present === false, 'Expected unresolved boundary workspace item to expose no post-decision trace before any review write');
  assert(boundaryWorkspace.state_explanation && boundaryWorkspace.state_explanation.terminal === false, 'Expected unresolved boundary workspace item to expose derived why-this-state explanation');

  const curiosityWorkspace = readMecReviewWorkspace(curiosity.candidate.id, {
    candidateOutputDir: tempCandidateDir,
    mecReviewOutputDir: tempMecReviewDir,
    eventOutputDir: tempEventDir
  });
  assert(curiosityWorkspace && curiosityWorkspace.current_review_state === 'reject', 'Expected read workspace item to expose derived reject state');
  assert(curiosityWorkspace.latest_review_outcome === 'reject', 'Expected read workspace item to expose latest review outcome');
  assert(curiosityWorkspace.review_summary.review_count === 1, 'Expected read workspace item to expose review count');
  assert(curiosityWorkspace.raw_candidate_artifact && curiosityWorkspace.raw_candidate_artifact.status === 'proposal_only', 'Expected raw candidate artifact to remain proposal-origin inside workspace');
  assert(curiosityWorkspace.control_readiness.terminal === true, 'Expected rejected workspace item to be terminal');
  assert(Array.isArray(curiosityWorkspace.control_readiness.available_outcomes) && curiosityWorkspace.control_readiness.available_outcomes.length === 0, 'Expected terminal workspace item to expose no further outcomes');
  assert(curiosityWorkspace.review_history_context && curiosityWorkspace.review_history_context.history_state === 'terminal_history', 'Expected terminal workspace item to expose compressed terminal review history');
  assert(Array.isArray(curiosityWorkspace.review_history_context.recent_reviews) && curiosityWorkspace.review_history_context.recent_reviews.length === 1, 'Expected terminal workspace item to expose recent review direction');
  assert(Array.isArray(curiosityWorkspace.raw_review_records) && curiosityWorkspace.raw_review_records.length === 1, 'Expected terminal workspace item to keep separate raw review records available');
  assert(Array.isArray(curiosityWorkspace.related_candidate_context), 'Expected terminal workspace item to expose related candidate context additively');
  assert(curiosityWorkspace.focus_context && typeof curiosityWorkspace.focus_context.focus_summary === 'string' && curiosityWorkspace.focus_context.focus_summary.length > 0, 'Expected terminal workspace item to expose an additive focus summary');
  assert(curiosityWorkspace.focus_context && ['recent_terminal_decision', 'terminal_reference_gap'].includes(curiosityWorkspace.focus_context.focus_bucket), 'Expected terminal workspace item to derive a terminal-history or terminal-reference-gap focus bucket from visible signals');
  assert(curiosityWorkspace.compare_context && typeof curiosityWorkspace.compare_context.compare_summary === 'string', 'Expected terminal workspace item to expose an additive compare summary');
  assert(curiosityWorkspace.compare_context && Array.isArray(curiosityWorkspace.compare_context.compare_candidates), 'Expected terminal workspace item to expose additive compare candidates even when none are present');
  assert(curiosityWorkspace.delta_context && ['post_review_change_terminal', 'terminal_without_visible_change'].includes(curiosityWorkspace.delta_context.movement_bucket), 'Expected terminal workspace item to derive a terminal-aware delta bucket from visible signals');
  assert(curiosityWorkspace.delta_context && typeof curiosityWorkspace.delta_context.why_not_now === 'string' && curiosityWorkspace.delta_context.why_not_now.length > 0, 'Expected terminal workspace item to expose additive why-not-now readability when no active why-now signal remains');
  assert(curiosityWorkspace.delta_context && typeof curiosityWorkspace.delta_context.delta_summary === 'string', 'Expected terminal workspace item to expose additive delta summary');
  assert(curiosityWorkspace.contradiction_context && typeof curiosityWorkspace.contradiction_context.contradiction_summary === 'string', 'Expected terminal workspace item to expose additive contradiction summary');
  assert(curiosityWorkspace.decision_packet_context && ['decision_closed', 'decision_fragile'].includes(curiosityWorkspace.decision_packet_context.decision_readiness), 'Expected terminal workspace item to derive a terminal-aware decision packet readiness');
  assert(curiosityWorkspace.decision_packet_context && typeof curiosityWorkspace.decision_packet_context.decision_summary === 'string', 'Expected terminal workspace item to expose additive decision packet summary');
  assert(curiosityWorkspace.review_trace_context && curiosityWorkspace.review_trace_context.trace_present === true, 'Expected terminal workspace item to expose a post-decision review trace');
  assert(curiosityWorkspace.review_trace_context && Array.isArray(curiosityWorkspace.review_trace_context.support_at_write), 'Expected terminal workspace item to expose write-time support signals');
  assert(curiosityWorkspace.latest_review && curiosityWorkspace.latest_review.rationale_snapshot && typeof curiosityWorkspace.latest_review.rationale_snapshot.decision_readiness === 'string', 'Expected terminal workspace item latest review to preserve its write-time rationale snapshot');
  assert(curiosityWorkspace.state_explanation && curiosityWorkspace.state_explanation.terminal === true, 'Expected terminal workspace item to expose derived why-this-state explanation');
  assert(curiosityWorkspace.challenge_context && typeof curiosityWorkspace.challenge_context.contradiction_pressure_bucket === 'string', 'Expected terminal workspace item to expose additive Phase 4A challenge bucket readability');

  const registryAfter = snapshotRegistry();
  assert(JSON.stringify(registryBefore) === JSON.stringify(registryAfter), 'Registry files changed during Phase 3C runtime workspace verification');
}

function verifyCliWorkspace() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase3c-cli-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase3c-cli-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase3c-cli-reviews-'));

  const eventOutput = runCli([
    path.join('tools', 'arena.js'),
    'create-event',
    '--event-type', 'phase3c_cli_probe',
    '--domain', 'mec_phase3c',
    '--summary', 'Phase 3C CLI workspace event',
    '--source-ref', 'verifier://phase3c/cli',
    '--trace-ref', 'trace://phase3c/cli',
    '--event-dir', tempEventDir,
    '--json'
  ]);
  const createdEvent = JSON.parse(eventOutput);

  const candidateOutput = runCli([
    path.join('tools', 'arena.js'),
    'create-mec-candidate',
    '--candidate-type', 'curiosity_candidate',
    '--principle', 'Phase 3C CLI curiosity',
    '--mechanism', 'CLI should read the canonical review workspace',
    '--open-question', 'Can CLI expose the same workspace semantics?',
    '--domain', 'mec_phase3c',
    '--blind-spot-score', '0.3',
    '--source-event-id', createdEvent.event.id,
    '--distillation-mode', 'manual',
    '--candidate-dir', tempCandidateDir,
    '--event-dir', tempEventDir,
    '--json'
  ]);
  const createdCandidate = JSON.parse(candidateOutput);

  runCli([
    path.join('tools', 'arena.js'),
    'review-mec-candidate',
    createdCandidate.candidate.id,
    '--review-outcome', 'stabilize',
    '--review-rationale', 'CLI workspace stabilize proof.',
    '--review-source', 'phase3c_cli_verifier',
    '--candidate-dir', tempCandidateDir,
    '--mec-review-dir', tempMecReviewDir,
    '--json'
  ]);

  const listedWorkspace = JSON.parse(runCli([
    path.join('tools', 'arena.js'),
    'list-mec-review-workspace',
    '--candidate-dir', tempCandidateDir,
    '--mec-review-dir', tempMecReviewDir,
    '--event-dir', tempEventDir,
    '--json'
  ]));
  assert(Array.isArray(listedWorkspace) && listedWorkspace.length === 1, 'Expected CLI workspace list to return one item');
  assert(listedWorkspace[0].workspace_kind === 'mec_review_workspace', 'Expected CLI workspace list item to expose canonical workspace kind');
  assert(listedWorkspace[0].current_review_state === 'stabilize', 'Expected CLI workspace list item to expose stabilize state');
  assert(listedWorkspace[0].focus_context && typeof listedWorkspace[0].focus_context.focus_bucket === 'string', 'Expected CLI workspace list item to expose Phase 3F focus context');
  assert(listedWorkspace[0].compare_context && typeof listedWorkspace[0].compare_context.compare_ready === 'boolean', 'Expected CLI workspace list item to expose Phase 3F compare context');
  assert(listedWorkspace[0].delta_context && typeof listedWorkspace[0].delta_context.movement_bucket === 'string', 'Expected CLI workspace list item to expose Phase 3G delta context');
  assert(listedWorkspace[0].contradiction_context && typeof listedWorkspace[0].contradiction_context.contradiction_present === 'boolean', 'Expected CLI workspace list item to expose Phase 3H contradiction context');
  assert(listedWorkspace[0].decision_packet_context && typeof listedWorkspace[0].decision_packet_context.decision_readiness === 'string', 'Expected CLI workspace list item to expose Phase 3H decision packet context');
  assert(listedWorkspace[0].challenge_context && typeof listedWorkspace[0].challenge_context.contradiction_pressure_bucket === 'string', 'Expected CLI workspace list item to expose additive Phase 4A challenge context');
  assert(listedWorkspace[0].review_trace_context && typeof listedWorkspace[0].review_trace_context.trace_present === 'boolean', 'Expected CLI workspace list item to expose Phase 3I review trace context');

  const loadedWorkspace = JSON.parse(runCli([
    path.join('tools', 'arena.js'),
    'get-mec-review-workspace',
    createdCandidate.candidate.id,
    '--candidate-dir', tempCandidateDir,
    '--mec-review-dir', tempMecReviewDir,
    '--event-dir', tempEventDir,
    '--json'
  ]));
  assert(loadedWorkspace.latest_review_outcome === 'stabilize', 'Expected CLI workspace detail to expose latest stabilize outcome');
  assert(loadedWorkspace.raw_candidate_artifact && loadedWorkspace.raw_candidate_artifact.status === 'proposal_only', 'Expected CLI workspace detail to preserve raw proposal-origin artifact');
  assert(loadedWorkspace.focus_context && typeof loadedWorkspace.focus_context.focus_summary === 'string', 'Expected CLI workspace detail to expose focus summary');
  assert(loadedWorkspace.compare_context && Array.isArray(loadedWorkspace.compare_context.compare_candidates), 'Expected CLI workspace detail to expose compare candidates');
  assert(loadedWorkspace.delta_context && typeof loadedWorkspace.delta_context.delta_summary === 'string', 'Expected CLI workspace detail to expose delta summary');
  assert(loadedWorkspace.delta_context && ('why_now' in loadedWorkspace.delta_context) && ('why_not_now' in loadedWorkspace.delta_context), 'Expected CLI workspace detail to expose why-now/why-not-now delta readability');
  assert(loadedWorkspace.contradiction_context && Array.isArray(loadedWorkspace.contradiction_context.contradiction_signals), 'Expected CLI workspace detail to expose contradiction signals');
  assert(loadedWorkspace.decision_packet_context && Array.isArray(loadedWorkspace.decision_packet_context.support_signals), 'Expected CLI workspace detail to expose decision support signals');
  assert(loadedWorkspace.decision_packet_context && Array.isArray(loadedWorkspace.decision_packet_context.friction_signals), 'Expected CLI workspace detail to expose decision friction signals');
  assert(loadedWorkspace.challenge_context && typeof loadedWorkspace.challenge_context.challenge_summary === 'string', 'Expected CLI workspace detail to expose additive Phase 4A challenge summary');
  assert(loadedWorkspace.review_trace_context && loadedWorkspace.review_trace_context.trace_present === true, 'Expected CLI workspace detail to expose a written review trace');
  assert(loadedWorkspace.review_trace_context && Array.isArray(loadedWorkspace.review_trace_context.support_at_write), 'Expected CLI workspace detail to expose write-time support signals');
  assert(loadedWorkspace.latest_review && loadedWorkspace.latest_review.rationale_snapshot && typeof loadedWorkspace.latest_review.rationale_snapshot.delta_movement_bucket === 'string', 'Expected CLI workspace detail latest review to expose its rationale snapshot');
}

async function verifyHttpWorkspace() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase3c-http-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase3c-http-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase3c-http-reviews-'));
  const port = 3348;
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
      reject(new Error('Timed out waiting for arena-server to start for Phase 3C HTTP verification'));
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
    const eventResponse = await fetch(`http://127.0.0.1:${port}/arena/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'phase3c_http_probe',
        domain: 'mec_phase3c',
        summary: 'Phase 3C HTTP workspace event',
        source_ref: 'verifier://phase3c/http',
        trace_ref: 'trace://phase3c/http'
      })
    });
    assert(eventResponse.ok, 'Expected HTTP event create for Phase 3C workspace verification');
    const createdEvent = await eventResponse.json();

    const candidateResponse = await fetch(`http://127.0.0.1:${port}/arena/mec-candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidate_type: 'curiosity_candidate',
        principle: 'Phase 3C HTTP curiosity',
        mechanism: 'HTTP should expose canonical workspace semantics',
        open_question: 'Can HTTP show the same latest outcome?',
        domain: 'mec_phase3c',
        blind_spot_score: 0.2,
        source_event_ids: [createdEvent.event.id],
        distillation_mode: 'manual'
      })
    });
    assert(candidateResponse.status === 201, 'Expected HTTP candidate create for Phase 3C workspace verification');
    const createdCandidate = await candidateResponse.json();

    const reviewResponse = await fetch(`http://127.0.0.1:${port}/arena/mec-candidates/${createdCandidate.candidate.id}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        review_outcome: 'reject',
        review_rationale: 'HTTP workspace reject proof.',
        review_source: 'phase3c_http_verifier',
        reviewer_mode: 'human'
      })
    });
    assert(reviewResponse.status === 201, 'Expected HTTP workspace review create');

    const workspaceListResponse = await fetch(`http://127.0.0.1:${port}/arena/mec-review-workspace`);
    assert(workspaceListResponse.ok, 'Expected GET /arena/mec-review-workspace to return 200');
    const workspaceListPayload = await workspaceListResponse.json();
    assert(Array.isArray(workspaceListPayload.items) && workspaceListPayload.items.length === 1, 'Expected one workspace item over HTTP');
    assert(workspaceListPayload.items[0].workspace_kind === 'mec_review_workspace', 'Expected HTTP workspace list item kind');
    assert(workspaceListPayload.items[0].current_review_state === 'reject', 'Expected HTTP workspace list item current review state');
    assert(workspaceListPayload.items[0].focus_context && typeof workspaceListPayload.items[0].focus_context.focus_bucket === 'string', 'Expected HTTP workspace list item to expose focus context');
    assert(workspaceListPayload.items[0].compare_context && typeof workspaceListPayload.items[0].compare_context.compare_ready === 'boolean', 'Expected HTTP workspace list item to expose compare context');
    assert(workspaceListPayload.items[0].delta_context && typeof workspaceListPayload.items[0].delta_context.movement_bucket === 'string', 'Expected HTTP workspace list item to expose delta context');
    assert(workspaceListPayload.items[0].contradiction_context && typeof workspaceListPayload.items[0].contradiction_context.contradiction_present === 'boolean', 'Expected HTTP workspace list item to expose contradiction context');
    assert(workspaceListPayload.items[0].decision_packet_context && typeof workspaceListPayload.items[0].decision_packet_context.decision_readiness === 'string', 'Expected HTTP workspace list item to expose decision packet context');
    assert(workspaceListPayload.items[0].challenge_context && typeof workspaceListPayload.items[0].challenge_context.contradiction_pressure_bucket === 'string', 'Expected HTTP workspace list item to expose additive Phase 4A challenge context');
    assert(workspaceListPayload.items[0].review_trace_context && typeof workspaceListPayload.items[0].review_trace_context.trace_present === 'boolean', 'Expected HTTP workspace list item to expose review trace context');

    const workspaceDetailResponse = await fetch(`http://127.0.0.1:${port}/arena/mec-review-workspace/${createdCandidate.candidate.id}`);
    assert(workspaceDetailResponse.ok, 'Expected GET /arena/mec-review-workspace/:id to return 200');
    const workspaceDetailPayload = await workspaceDetailResponse.json();
    assert(workspaceDetailPayload.latest_review_outcome === 'reject', 'Expected HTTP workspace detail latest review outcome');
    assert(workspaceDetailPayload.review_summary.review_count === 1, 'Expected HTTP workspace detail review count');
    assert(workspaceDetailPayload.raw_candidate_artifact && workspaceDetailPayload.raw_candidate_artifact.status === 'proposal_only', 'Expected HTTP workspace detail raw artifact to remain proposal-origin');
    assert(workspaceDetailPayload.focus_context && typeof workspaceDetailPayload.focus_context.focus_summary === 'string', 'Expected HTTP workspace detail to expose focus summary');
    assert(workspaceDetailPayload.compare_context && Array.isArray(workspaceDetailPayload.compare_context.compare_candidates), 'Expected HTTP workspace detail to expose compare candidates');
    assert(workspaceDetailPayload.delta_context && typeof workspaceDetailPayload.delta_context.delta_summary === 'string', 'Expected HTTP workspace detail to expose delta summary');
    assert(workspaceDetailPayload.delta_context && ('why_now' in workspaceDetailPayload.delta_context) && ('why_not_now' in workspaceDetailPayload.delta_context), 'Expected HTTP workspace detail to expose why-now/why-not-now delta readability');
    assert(workspaceDetailPayload.contradiction_context && Array.isArray(workspaceDetailPayload.contradiction_context.contradiction_signals), 'Expected HTTP workspace detail to expose contradiction signals');
    assert(workspaceDetailPayload.decision_packet_context && Array.isArray(workspaceDetailPayload.decision_packet_context.support_signals), 'Expected HTTP workspace detail to expose decision support signals');
    assert(workspaceDetailPayload.decision_packet_context && Array.isArray(workspaceDetailPayload.decision_packet_context.friction_signals), 'Expected HTTP workspace detail to expose decision friction signals');
    assert(workspaceDetailPayload.challenge_context && typeof workspaceDetailPayload.challenge_context.challenge_summary === 'string', 'Expected HTTP workspace detail to expose additive Phase 4A challenge summary');
    assert(workspaceDetailPayload.review_trace_context && workspaceDetailPayload.review_trace_context.trace_present === true, 'Expected HTTP workspace detail to expose a written review trace');
    assert(workspaceDetailPayload.review_trace_context && Array.isArray(workspaceDetailPayload.review_trace_context.support_at_write), 'Expected HTTP workspace detail to expose write-time support signals');
    assert(workspaceDetailPayload.latest_review && workspaceDetailPayload.latest_review.rationale_snapshot && typeof workspaceDetailPayload.latest_review.rationale_snapshot.decision_readiness === 'string', 'Expected HTTP workspace detail latest review to expose its rationale snapshot');
  } finally {
    serverProcess.kill();
  }
}

async function main() {
  verifyFilesExist();
  verifyRuntimeWorkspace();
  verifyCliWorkspace();
  await verifyHttpWorkspace();
  runVerifier(path.join('tools', 'verify-mec-operator-ui-smoke.js'));
  runVerifier(path.join('tools', 'verify-mec-phase3a-review-core.js'));
  console.log('MEC Phase 3C canonical review workspace verification passed.');
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
