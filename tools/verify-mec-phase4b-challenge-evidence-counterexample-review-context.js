#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const {
  createMecCandidateRecord,
  createMecChallengeCounterexample,
  createMecEvent,
  readMecReviewWorkspace
} = require('./arena-lib');

const ROOT_DIR = path.join(__dirname, '..');
const REQUIRED_FILES = [
  path.join(ROOT_DIR, 'MEC_PHASE4B_IMPLEMENTATION_PLAN.md'),
  path.join(ROOT_DIR, 'MEC_PHASE4B_CHALLENGE_EVIDENCE_COUNTEREXAMPLE_REVIEW_CONTEXT_ACCEPTANCE.md'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-phase4b-challenge-evidence-counterexample-review-context.js'),
  path.join(ROOT_DIR, 'tools', 'arena-lib.js'),
  path.join(ROOT_DIR, 'tools', 'arena.js'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-operator-ui-smoke.js'),
  path.join(ROOT_DIR, 'web', 'mec-operator.html')
];
const REQUIRED_UI_STRINGS = [
  'Refutation context',
  'Read-first counterexample and refuted-primary readability from the canonical workspace only.',
  'Challenge basis carry-through',
  'Visible counterexample posture'
];
const DISALLOWED_PATTERNS = [
  'recommended_outcome',
  'refutation_score',
  'priority_rank',
  'reopen_now',
  'should_reject',
  'next_best_counterexample'
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
    assert(fs.existsSync(filePath), `Missing required Phase 4B file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyDeskCopy() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'web', 'mec-operator.html'), 'utf-8');
  for (const expected of REQUIRED_UI_STRINGS) {
    assert(content.includes(expected), `Expected Phase 4B desk UI copy missing: ${expected}`);
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
      assert(!content.includes(pattern), `Disallowed Phase 4B drift pattern ${pattern} found in ${path.relative(ROOT_DIR, filePath)}`);
    }
  }
}

function verifyRuntimeRefutationContext() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4b-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4b-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4b-reviews-'));

  const eventResult = createMecEvent({
    event_type: 'phase4b_probe',
    domain: 'mec_phase4b',
    summary: 'Phase 4B refutation probe',
    source_ref: 'verifier://phase4b/runtime',
    trace_ref: 'trace://phase4b/runtime'
  }, { eventOutputDir: tempEventDir });

  const invariant = createMecCandidateRecord({
    candidate_type: 'invariant_candidate',
    principle: 'Phase 4B invariant target',
    mechanism: 'Refutation context should remain read-first and canonical.',
    source_event_ids: [eventResult.event.id],
    fails_when: ['counterexample remains unreadable', 'refutation context drifts into scoring'],
    edge_cases: ['single counterexample carry-through'],
    severity: 'medium',
    distillation_mode: 'manual'
  }, { candidateOutputDir: tempCandidateDir, eventOutputDir: tempEventDir });

  const workspaceBefore = readMecReviewWorkspace(invariant.candidate.id, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });
  assert(workspaceBefore && workspaceBefore.refutation_context, 'Expected invariant workspace detail to expose additive refutation_context');
  assert(workspaceBefore.refutation_context.refutation_present === false, 'Expected invariant workspace detail to remain without visible refutation before counterexample creation');

  const challengeResult = createMecChallengeCounterexample(invariant.candidate.id, {
    case_description: 'The supposed invariant fails under a directly visible runtime edge case.',
    resolution: 'Keep as proposal-only counterexample until explicit follow-up review.',
    impact_on_candidate: 'narrows_scope',
    challenge_source: 'phase4b_runtime_verifier'
  }, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });

  const invariantWorkspace = readMecReviewWorkspace(invariant.candidate.id, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });
  assert(invariantWorkspace && invariantWorkspace.refutation_context && invariantWorkspace.refutation_context.refutation_role === 'refuted_primary_candidate', 'Expected invariant workspace detail to expose refuted-primary refutation context after counterexample creation');
  assert(invariantWorkspace.refutation_context.visible_counterexample_count >= 1, 'Expected invariant workspace detail to expose visible counterexample posture in refutation context');
  assert(Array.isArray(invariantWorkspace.refutation_context.support_signals) && invariantWorkspace.refutation_context.support_signals.length >= 1, 'Expected invariant workspace detail refutation context to expose support signals');

  const counterexampleWorkspace = readMecReviewWorkspace(challengeResult.candidate.id, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });
  assert(counterexampleWorkspace && counterexampleWorkspace.refutation_context && counterexampleWorkspace.refutation_context.refutation_role === 'counterexample_candidate', 'Expected counterexample workspace detail to expose counterexample refutation role');
  assert(counterexampleWorkspace.refutation_context.primary_candidate_id === invariant.candidate.id, 'Expected counterexample workspace detail to preserve the refuted primary candidate in refutation context');
  assert(counterexampleWorkspace.refutation_context.challenge_basis_bucket === challengeResult.candidate.challenge_basis.contradiction_pressure_bucket, 'Expected counterexample workspace detail to carry through the visible challenge basis bucket');
  assert(typeof counterexampleWorkspace.refutation_context.challenge_basis_summary === 'string' && counterexampleWorkspace.refutation_context.challenge_basis_summary.length > 0, 'Expected counterexample workspace detail to expose challenge-basis summary readability');
}

function verifyCliWorkspaceReadability() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4b-cli-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4b-cli-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4b-cli-reviews-'));

  const eventOutput = runCli([
    path.join('tools', 'arena.js'),
    'create-event',
    '--event-type', 'phase4b_cli_probe',
    '--domain', 'mec_phase4b',
    '--summary', 'Phase 4B CLI workspace event',
    '--source-ref', 'verifier://phase4b/cli',
    '--trace-ref', 'trace://phase4b/cli',
    '--event-dir', tempEventDir,
    '--json'
  ]);
  const createdEvent = JSON.parse(eventOutput);

  const candidateOutput = runCli([
    path.join('tools', 'arena.js'),
    'create-mec-candidate',
    '--candidate-type', 'invariant_candidate',
    '--principle', 'Phase 4B CLI invariant',
    '--mechanism', 'CLI should expose canonical refutation readability',
    '--source-event-id', createdEvent.event.id,
    '--boundary-fails-when', 'refutation readability missing',
    '--boundary-fails-when', 'challenge basis disappears',
    '--boundary-edge-case', 'single cli probe',
    '--candidate-dir', tempCandidateDir,
    '--event-dir', tempEventDir,
    '--json'
  ]);
  const createdCandidate = JSON.parse(candidateOutput);

  runCli([
    path.join('tools', 'arena.js'),
    'challenge-mec-candidate',
    createdCandidate.candidate.id,
    '--case-description', 'CLI challenge creates a proposal-only counterexample for refutation readability.',
    '--impact-on-candidate', 'narrows_scope',
    '--review-source', 'phase4b_cli_verifier',
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
  assert(workspaceOutput.includes('refutation:refuted_primary_candidate') || workspaceOutput.includes('refutation:counterexample_candidate'), 'Expected CLI workspace text output to expose minimal Phase 4B refutation readability');
  assert(workspaceOutput.includes('visible-refutations:'), 'Expected CLI workspace text output to expose visible refutation counts');
}

function main() {
  verifyFilesExist();
  verifyDeskCopy();
  verifyNoDriftStrings();
  verifyRuntimeRefutationContext();
  verifyCliWorkspaceReadability();
  runVerifier(path.join('tools', 'verify-mec-phase4a-manual-challenge-counterexample-output.js'));
  runVerifier(path.join('tools', 'verify-mec-operator-ui-smoke.js'));
  console.log('MEC Phase 4B challenge evidence counterexample review context verification passed.');
}

main();
