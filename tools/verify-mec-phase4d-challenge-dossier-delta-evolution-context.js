#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const {
  createMecCandidateRecord,
  createMecChallengeCounterexample,
  createMecEvent,
  reviewMecCandidate,
  readMecReviewWorkspace
} = require('./arena-lib');

const ROOT_DIR = path.join(__dirname, '..');
const REQUIRED_FILES = [
  path.join(ROOT_DIR, 'MEC_PHASE4D_IMPLEMENTATION_PLAN.md'),
  path.join(ROOT_DIR, 'MEC_PHASE4D_CHALLENGE_DOSSIER_DELTA_ACCEPTANCE.md'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-phase4d-challenge-dossier-delta-evolution-context.js'),
  path.join(ROOT_DIR, 'tools', 'arena-lib.js'),
  path.join(ROOT_DIR, 'tools', 'arena.js'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-operator-ui-smoke.js'),
  path.join(ROOT_DIR, 'web', 'mec-operator.html')
];
const REQUIRED_UI_STRINGS = [
  'Challenge dossier delta / evolution',
  'How the visible challenge dossier has changed since the last review anchor: new lines, stable lines, posture shift.',
  'detail-challenge-dossier-delta',
  'Dossier evolution summary',
  'Evolution signals',
  'New lines since anchor',
  'Stable lines since anchor',
  'movement_bucket'
];
const DISALLOWED_PATTERNS = [
  'recommended_outcome',
  'priority_rank',
  'refutation_score',
  'reopen_now',
  'should_reject',
  'next_best_counterexample',
  'challenge_queue_position',
  'delta_recommendation'
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

function verifyFilesExist() {
  for (const filePath of REQUIRED_FILES) {
    assert(fs.existsSync(filePath), `Missing required Phase 4D file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyDeskCopy() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'web', 'mec-operator.html'), 'utf-8');
  for (const expected of REQUIRED_UI_STRINGS) {
    assert(content.includes(expected), `Expected Phase 4D desk UI copy missing: ${expected}`);
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
      assert(!content.includes(pattern), `Disallowed Phase 4D drift pattern ${pattern} found in ${path.relative(ROOT_DIR, filePath)}`);
    }
  }
}

function verifyExpandingMovement() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4d-expanding-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4d-expanding-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4d-expanding-reviews-'));

  const eventResult = createMecEvent({
    event_type: 'phase4d_probe',
    domain: 'mec_phase4d',
    summary: 'Phase 4D expanding dossier probe',
    source_ref: 'verifier://phase4d/expanding',
    trace_ref: 'trace://phase4d/expanding'
  }, { eventOutputDir: tempEventDir });

  const invariant = createMecCandidateRecord({
    candidate_type: 'invariant_candidate',
    principle: 'Phase 4D expanding invariant target',
    mechanism: 'Challenge dossier delta must show expanding when new lines appear after last review.',
    source_event_ids: [eventResult.event.id],
    fails_when: ['delta context is missing', 'movement bucket is not expanding after post-anchor counterexample'],
    edge_cases: ['one pre-anchor counterexample', 'one post-anchor counterexample'],
    severity: 'medium',
    distillation_mode: 'manual'
  }, { candidateOutputDir: tempCandidateDir, eventOutputDir: tempEventDir });

  const anchorTs = new Date().toISOString();

  createMecCandidateRecord({
    candidate_type: 'counterexample_candidate',
    principle: 'Pre-anchor counterexample for Phase 4D expanding test',
    mechanism: 'A pre-anchor challenge line that should be classified as stable.',
    refutes_candidate_id: invariant.candidate.id,
    case_description: 'Pre-anchor challenge line exists before the review anchor.',
    resolution: 'Keep proposal-only.',
    impact_on_candidate: 'narrows_scope',
    source_event_ids: [eventResult.event.id],
    status: 'proposal_only',
    distillation_mode: 'manual',
    created_at: anchorTs,
    updated_at: anchorTs,
    challenge_basis: {
      contradiction_pressure_bucket: 'low_visible_pressure',
      challenge_summary: 'Pre-anchor distinct challenge basis line alpha.',
      challenge_flags: ['pre_anchor_line_alpha']
    }
  }, { candidateOutputDir: tempCandidateDir, eventOutputDir: tempEventDir });

  reviewMecCandidate(invariant.candidate.id, {
    review_outcome: 'stabilize',
    review_rationale: 'Phase 4D anchor review for expanding test.',
    review_source: 'phase4d_verifier'
  }, {
    candidateOutputDir: tempCandidateDir,
    mecReviewOutputDir: tempMecReviewDir
  });

  const postAnchorTs = new Date(Date.now() + 2000).toISOString();

  createMecCandidateRecord({
    candidate_type: 'counterexample_candidate',
    principle: 'Post-anchor counterexample for Phase 4D expanding test',
    mechanism: 'A post-anchor challenge line that should be classified as new.',
    refutes_candidate_id: invariant.candidate.id,
    case_description: 'Post-anchor distinct challenge line appeared after the review anchor.',
    resolution: 'Keep proposal-only.',
    impact_on_candidate: 'narrows_scope',
    source_event_ids: [eventResult.event.id],
    status: 'proposal_only',
    distillation_mode: 'manual',
    created_at: postAnchorTs,
    updated_at: postAnchorTs,
    challenge_basis: {
      contradiction_pressure_bucket: 'moderate_visible_pressure',
      challenge_summary: 'Post-anchor distinct challenge basis line beta.',
      challenge_flags: ['post_anchor_line_beta']
    }
  }, { candidateOutputDir: tempCandidateDir, eventOutputDir: tempEventDir });

  const primaryWorkspace = readMecReviewWorkspace(invariant.candidate.id, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });

  assert(primaryWorkspace && primaryWorkspace.challenge_dossier_delta_context, 'Expected invariant workspace to expose additive challenge_dossier_delta_context');
  assert(primaryWorkspace.challenge_dossier_delta_context.challenge_dossier_delta_surface_version === 'phase4d-mec-challenge-dossier-delta-context/v1', 'Expected Phase 4D surface version marker');
  assert(primaryWorkspace.challenge_dossier_delta_context.delta_role === 'primary_candidate_dossier_delta', 'Expected primary_candidate_dossier_delta role for invariant');
  assert(primaryWorkspace.challenge_dossier_delta_context.anchor_kind === 'last_review', 'Expected anchor_kind to be last_review after a review record exists');
  assert(primaryWorkspace.challenge_dossier_delta_context.movement_bucket === 'expanding', `Expected movement_bucket expanding when post-anchor counterexample exists, got: ${primaryWorkspace.challenge_dossier_delta_context.movement_bucket}`);
  assert(primaryWorkspace.challenge_dossier_delta_context.new_line_count >= 1, 'Expected at least one new line since anchor');
  assert(primaryWorkspace.workspace_summary && primaryWorkspace.workspace_summary.challenge_dossier_delta_movement === 'expanding', 'Expected workspace_summary.challenge_dossier_delta_movement to be expanding');
}

function verifyStabilizingMovement() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4d-stable-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4d-stable-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4d-stable-reviews-'));

  const eventResult = createMecEvent({
    event_type: 'phase4d_probe',
    domain: 'mec_phase4d',
    summary: 'Phase 4D stabilizing dossier probe',
    source_ref: 'verifier://phase4d/stabilizing',
    trace_ref: 'trace://phase4d/stabilizing'
  }, { eventOutputDir: tempEventDir });

  const invariant = createMecCandidateRecord({
    candidate_type: 'invariant_candidate',
    principle: 'Phase 4D stabilizing invariant target',
    mechanism: 'Challenge dossier delta must show stabilizing when all lines pre-date the last review anchor.',
    source_event_ids: [eventResult.event.id],
    fails_when: ['delta context is missing', 'movement bucket is not stabilizing when all counterexamples are pre-anchor'],
    edge_cases: ['single pre-anchor challenge line'],
    severity: 'medium',
    distillation_mode: 'manual'
  }, { candidateOutputDir: tempCandidateDir, eventOutputDir: tempEventDir });

  createMecChallengeCounterexample(invariant.candidate.id, {
    case_description: 'Pre-anchor challenge line that will stay stable after review.',
    resolution: 'Keep proposal-only.',
    impact_on_candidate: 'narrows_scope',
    challenge_source: 'phase4d_verifier_stabilizing'
  }, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });

  reviewMecCandidate(invariant.candidate.id, {
    review_outcome: 'stabilize',
    review_rationale: 'Phase 4D anchor review after pre-anchor counterexample.',
    review_source: 'phase4d_verifier'
  }, {
    candidateOutputDir: tempCandidateDir,
    mecReviewOutputDir: tempMecReviewDir
  });

  const primaryWorkspace = readMecReviewWorkspace(invariant.candidate.id, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });

  assert(primaryWorkspace && primaryWorkspace.challenge_dossier_delta_context, 'Expected invariant workspace to expose additive challenge_dossier_delta_context (stabilizing)');
  assert(primaryWorkspace.challenge_dossier_delta_context.anchor_kind === 'last_review', 'Expected anchor_kind to be last_review (stabilizing test)');
  assert(primaryWorkspace.challenge_dossier_delta_context.movement_bucket === 'stabilizing', `Expected movement_bucket stabilizing when all counterexamples pre-date anchor, got: ${primaryWorkspace.challenge_dossier_delta_context.movement_bucket}`);
  assert(primaryWorkspace.challenge_dossier_delta_context.stable_line_count >= 1, 'Expected at least one stable line');
  assert(primaryWorkspace.challenge_dossier_delta_context.new_line_count === 0, 'Expected zero new lines in stabilizing scenario');
}

function verifyCandidateCreatedAnchor() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4d-noanchor-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4d-noanchor-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4d-noanchor-reviews-'));

  const eventResult = createMecEvent({
    event_type: 'phase4d_probe',
    domain: 'mec_phase4d',
    summary: 'Phase 4D no-review anchor probe',
    source_ref: 'verifier://phase4d/noanchor',
    trace_ref: 'trace://phase4d/noanchor'
  }, { eventOutputDir: tempEventDir });

  const invariant = createMecCandidateRecord({
    candidate_type: 'invariant_candidate',
    principle: 'Phase 4D no-review anchor invariant',
    mechanism: 'When no review exists, anchor_kind must be candidate_created.',
    source_event_ids: [eventResult.event.id],
    fails_when: ['anchor_kind is not candidate_created when no reviews exist', 'evolution_signals array is missing when no review anchor is set'],
    edge_cases: ['no review anchor yet'],
    severity: 'medium',
    distillation_mode: 'manual'
  }, { candidateOutputDir: tempCandidateDir, eventOutputDir: tempEventDir });

  createMecChallengeCounterexample(invariant.candidate.id, {
    case_description: 'Challenge line with no review anchor present yet.',
    resolution: 'Keep proposal-only.',
    impact_on_candidate: 'narrows_scope',
    challenge_source: 'phase4d_verifier_noanchor'
  }, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });

  const primaryWorkspace = readMecReviewWorkspace(invariant.candidate.id, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });

  assert(primaryWorkspace && primaryWorkspace.challenge_dossier_delta_context, 'Expected workspace to expose challenge_dossier_delta_context even without review anchor');
  assert(primaryWorkspace.challenge_dossier_delta_context.anchor_kind === 'candidate_created', `Expected anchor_kind candidate_created when no reviews exist, got: ${primaryWorkspace.challenge_dossier_delta_context.anchor_kind}`);
  assert(typeof primaryWorkspace.challenge_dossier_delta_context.movement_bucket === 'string', 'Expected movement_bucket to be a string');
  assert(Array.isArray(primaryWorkspace.challenge_dossier_delta_context.evolution_signals), 'Expected evolution_signals to be an array');
  assert(primaryWorkspace.challenge_dossier_delta_context.evolution_signals.some(signal => signal.includes('No review anchor')), 'Expected evolution_signals to mention missing review anchor');
}

function verifyCliDeltaReadability() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4d-cli-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4d-cli-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4d-cli-reviews-'));

  const eventOutput = runCli([
    path.join('tools', 'arena.js'),
    'create-event',
    '--event-type', 'phase4d_cli_probe',
    '--domain', 'mec_phase4d',
    '--summary', 'Phase 4D CLI delta probe',
    '--source-ref', 'verifier://phase4d/cli',
    '--trace-ref', 'trace://phase4d/cli',
    '--event-dir', tempEventDir,
    '--json'
  ]);
  const createdEvent = JSON.parse(eventOutput);

  const candidateOutput = runCli([
    path.join('tools', 'arena.js'),
    'create-mec-candidate',
    '--candidate-type', 'invariant_candidate',
    '--principle', 'Phase 4D CLI invariant',
    '--mechanism', 'CLI must expose canonical challenge dossier delta readability',
    '--source-event-id', createdEvent.event.id,
    '--boundary-fails-when', 'delta movement missing from workspace',
    '--boundary-fails-when', 'anchor kind not visible in CLI',
    '--boundary-edge-case', 'single cli delta probe',
    '--candidate-dir', tempCandidateDir,
    '--event-dir', tempEventDir,
    '--json'
  ]);
  const createdCandidate = JSON.parse(candidateOutput);

  runCli([
    path.join('tools', 'arena.js'),
    'challenge-mec-candidate',
    createdCandidate.candidate.id,
    '--case-description', 'CLI challenge creates a proposal-only counterexample for delta readability.',
    '--impact-on-candidate', 'narrows_scope',
    '--review-source', 'phase4d_cli_verifier',
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
  assert(workspaceOutput.includes('delta-movement:'), 'Expected CLI workspace text output to expose Phase 4D delta-movement field');
  assert(workspaceOutput.includes('new-lines:'), 'Expected CLI workspace text output to expose Phase 4D new-lines field');
}

function main() {
  verifyFilesExist();
  verifyDeskCopy();
  verifyNoDriftStrings();
  verifyExpandingMovement();
  verifyStabilizingMovement();
  verifyCandidateCreatedAnchor();
  verifyCliDeltaReadability();
  runVerifier(path.join('tools', 'verify-mec-phase4c-primary-candidate-challenge-dossier-counterexample-coverage.js'));
  console.log('MEC Phase 4D challenge dossier delta evolution context verification passed.');
}

main();
