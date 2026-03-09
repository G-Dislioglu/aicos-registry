#!/usr/bin/env node
const fs = require('fs');
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
  path.join(ROOT_DIR, 'MEC_PHASE4A_IMPLEMENTATION_PLAN.md'),
  path.join(ROOT_DIR, 'MEC_PHASE4A_MANUAL_CHALLENGE_COUNTEREXAMPLE_OUTPUT_ACCEPTANCE.md'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-phase4a-manual-challenge-counterexample-output.js'),
  path.join(ROOT_DIR, 'tools', 'arena-lib.js'),
  path.join(ROOT_DIR, 'tools', 'arena.js'),
  path.join(ROOT_DIR, 'tools', 'arena-server.js'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-phase3c-review-workspace.js'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-operator-ui-smoke.js'),
  path.join(ROOT_DIR, 'web', 'mec-operator.html')
];
const REQUIRED_UI_STRINGS = [
  'Challenge context',
  'Single-candidate challenge reading from the canonical workspace only.',
  'Manual counterexample proposal',
  'Create proposal-only counterexample'
];
const REQUIRED_RUNTIME_STRINGS = [
  'createMecChallengeCounterexample',
  'challenge_context',
  'phase4a-mec-challenge-context/v1',
  'challenge-counterexamples'
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

function verifyFilesExist() {
  for (const filePath of REQUIRED_FILES) {
    assert(fs.existsSync(filePath), `Missing required Phase 4A file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyDeskCopy() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'web', 'mec-operator.html'), 'utf-8');
  for (const expected of REQUIRED_UI_STRINGS) {
    assert(content.includes(expected), `Expected Phase 4A desk UI copy missing: ${expected}`);
  }
}

function verifyRuntimeBindings() {
  const arenaLib = fs.readFileSync(path.join(ROOT_DIR, 'tools', 'arena-lib.js'), 'utf-8');
  const arenaCli = fs.readFileSync(path.join(ROOT_DIR, 'tools', 'arena.js'), 'utf-8');
  const arenaServer = fs.readFileSync(path.join(ROOT_DIR, 'tools', 'arena-server.js'), 'utf-8');
  for (const expected of REQUIRED_RUNTIME_STRINGS) {
    assert(arenaLib.includes(expected) || arenaCli.includes(expected) || arenaServer.includes(expected), `Expected Phase 4A runtime binding missing: ${expected}`);
  }
}

function verifyManualChallengeRuntime() {
  const os = require('os');
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4a-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4a-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4a-reviews-'));

  const eventResult = createMecEvent({
    event_type: 'phase4a_probe',
    domain: 'mec_phase4a',
    summary: 'Phase 4A manual challenge probe',
    source_ref: 'verifier://phase4a/runtime',
    trace_ref: 'trace://phase4a/runtime'
  }, { eventOutputDir: tempEventDir });

  const invariant = createMecCandidateRecord({
    candidate_type: 'invariant_candidate',
    principle: 'Phase 4A invariant challenge target',
    mechanism: 'Manual challenge should stay tied to a selected primary candidate',
    source_event_ids: [eventResult.event.id],
    fails_when: ['boundary is too weak', 'counterexample remains unresolved'],
    edge_cases: ['single challenge path'],
    severity: 'medium',
    distillation_mode: 'manual'
  }, { candidateOutputDir: tempCandidateDir, eventOutputDir: tempEventDir });

  const workspaceBefore = readMecReviewWorkspace(invariant.candidate.id, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });
  assert(workspaceBefore && workspaceBefore.challenge_context, 'Expected invariant workspace detail to expose additive challenge_context');
  assert(workspaceBefore.challenge_context.manual_counterexample_allowed === true, 'Expected invariant workspace detail to allow the locked manual challenge path');
  assert(typeof workspaceBefore.challenge_context.contradiction_pressure_bucket === 'string', 'Expected invariant workspace detail to expose a compact contradiction pressure bucket');

  const challengeResult = createMecChallengeCounterexample(invariant.candidate.id, {
    case_description: 'The supposed invariant fails under a directly visible runtime edge case.',
    resolution: 'Keep as proposal-only counterexample until explicit follow-up review.',
    impact_on_candidate: 'narrows_scope',
    challenge_source: 'phase4a_runtime_verifier'
  }, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });

  assert(challengeResult && challengeResult.candidate && challengeResult.candidate.candidate_type === 'counterexample_candidate', 'Expected manual challenge path to create a counterexample candidate');
  assert(challengeResult.candidate.refutes_candidate_id === invariant.candidate.id, 'Expected manual challenge output to remain tied to the selected primary candidate');
  assert(challengeResult.candidate.status === 'proposal_only', 'Expected manual challenge output to remain proposal-only');
  assert(challengeResult.candidate.challenge_origin && challengeResult.candidate.challenge_origin.manual_challenge === true, 'Expected manual challenge output to persist explicit challenge origin metadata');
  assert(challengeResult.candidate.challenge_basis && typeof challengeResult.candidate.challenge_basis.contradiction_pressure_bucket === 'string', 'Expected manual challenge output to persist compact challenge basis metadata');

  const workspaceAfter = readMecReviewWorkspace(invariant.candidate.id, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });
  assert(workspaceAfter && workspaceAfter.challenge_context && workspaceAfter.challenge_context.existing_counterexample_count >= 1, 'Expected invariant workspace detail to reflect stored counterexample posture after manual challenge output');
}

function main() {
  verifyFilesExist();
  verifyDeskCopy();
  verifyRuntimeBindings();
  verifyManualChallengeRuntime();
  runVerifier(path.join('tools', 'verify-mec-phase3c-review-workspace.js'));
  runVerifier(path.join('tools', 'verify-mec-operator-ui-smoke.js'));
  console.log('MEC Phase 4A manual challenge counterexample output verification passed.');
}

main();
