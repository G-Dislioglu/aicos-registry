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
  path.join(ROOT_DIR, 'MEC_PHASE4C_IMPLEMENTATION_PLAN.md'),
  path.join(ROOT_DIR, 'MEC_PHASE4C_PRIMARY_CANDIDATE_CHALLENGE_DOSSIER_COUNTEREXAMPLE_COVERAGE_ACCEPTANCE.md'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-phase4c-primary-candidate-challenge-dossier-counterexample-coverage.js'),
  path.join(ROOT_DIR, 'tools', 'arena-lib.js'),
  path.join(ROOT_DIR, 'tools', 'arena.js'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-operator-ui-smoke.js'),
  path.join(ROOT_DIR, 'web', 'mec-operator.html')
];
const REQUIRED_UI_STRINGS = [
  'Challenge dossier context',
  'Primary-candidate-centered challenge posture over already visible counterexample relations from the canonical workspace only.',
  'Challenge dossier summary',
  'Challenge lines',
  'Coverage gaps'
];
const DISALLOWED_PATTERNS = [
  'recommended_outcome',
  'priority_rank',
  'refutation_score',
  'reopen_now',
  'should_reject',
  'next_best_counterexample',
  'challenge_queue_position'
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
    assert(fs.existsSync(filePath), `Missing required Phase 4C file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyDeskCopy() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'web', 'mec-operator.html'), 'utf-8');
  for (const expected of REQUIRED_UI_STRINGS) {
    assert(content.includes(expected), `Expected Phase 4C desk UI copy missing: ${expected}`);
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
      assert(!content.includes(pattern), `Disallowed Phase 4C drift pattern ${pattern} found in ${path.relative(ROOT_DIR, filePath)}`);
    }
  }
}

function verifyRuntimeChallengeDossierContext() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4c-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4c-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4c-reviews-'));

  const eventResult = createMecEvent({
    event_type: 'phase4c_probe',
    domain: 'mec_phase4c',
    summary: 'Phase 4C challenge dossier probe',
    source_ref: 'verifier://phase4c/runtime',
    trace_ref: 'trace://phase4c/runtime'
  }, { eventOutputDir: tempEventDir });

  const invariant = createMecCandidateRecord({
    candidate_type: 'invariant_candidate',
    principle: 'Phase 4C invariant target',
    mechanism: 'Primary challenge dossier should remain canonical and read-first.',
    source_event_ids: [eventResult.event.id],
    fails_when: ['challenge dossier remains unreadable', 'coverage drifts into recommendation'],
    edge_cases: ['repeated visible line', 'distinct visible line'],
    severity: 'medium',
    distillation_mode: 'manual'
  }, { candidateOutputDir: tempCandidateDir, eventOutputDir: tempEventDir });

  const firstManual = createMecChallengeCounterexample(invariant.candidate.id, {
    case_description: 'First visible challenge line contradicts the invariant under one runtime edge case.',
    resolution: 'Keep proposal-only until further review.',
    impact_on_candidate: 'narrows_scope',
    challenge_source: 'phase4c_runtime_verifier_manual_1'
  }, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });

  const secondManual = createMecChallengeCounterexample(invariant.candidate.id, {
    case_description: 'Second visible challenge still supports the same carried challenge basis.',
    resolution: 'Keep proposal-only until further review.',
    impact_on_candidate: 'narrows_scope',
    challenge_source: 'phase4c_runtime_verifier_manual_2'
  }, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });

  const directCounterexample = createMecCandidateRecord({
    candidate_type: 'counterexample_candidate',
    principle: 'Phase 4C distinct line',
    mechanism: 'A visibly different challenge basis should create a distinct dossier line.',
    refutes_candidate_id: invariant.candidate.id,
    case_description: 'A distinct visible challenge basis appears through a separate counterexample contribution.',
    resolution: 'Keep local and inspect as a separate contribution line.',
    impact_on_candidate: 'narrows_scope',
    source_event_ids: [eventResult.event.id],
    distillation_mode: 'manual',
    challenge_basis: {
      contradiction_pressure_bucket: 'moderate_visible_pressure',
      challenge_summary: 'A separate visible challenge basis is carried by this distinct counterexample contribution.',
      challenge_flags: ['separate_visible_basis', 'counterexample_history_present'],
      stabilizing_signals: ['Primary claim still keeps some stabilizing visible context.']
    }
  }, { candidateOutputDir: tempCandidateDir, eventOutputDir: tempEventDir });

  const primaryWorkspace = readMecReviewWorkspace(invariant.candidate.id, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });
  assert(primaryWorkspace && primaryWorkspace.challenge_dossier_context, 'Expected invariant workspace detail to expose additive challenge_dossier_context');
  assert(primaryWorkspace.challenge_dossier_context.dossier_role === 'primary_candidate_challenge_dossier', 'Expected invariant workspace detail to expose a primary-candidate dossier role');
  assert(primaryWorkspace.challenge_dossier_context.visible_counterexample_count >= 3, 'Expected invariant challenge dossier to expose all visible counterexample contributions');
  assert(primaryWorkspace.challenge_dossier_context.distinct_challenge_line_count >= 2, 'Expected invariant challenge dossier to expose more than one visible challenge line');
  assert(primaryWorkspace.challenge_dossier_context.reinforcing_line_count >= 1, 'Expected invariant challenge dossier to expose at least one reinforced visible line');
  assert(Array.isArray(primaryWorkspace.challenge_dossier_context.challenge_lines) && primaryWorkspace.challenge_dossier_context.challenge_lines.some(item => Number(item.contribution_count || 0) >= 2), 'Expected invariant challenge dossier to expose a repeated visible challenge line');
  assert(typeof primaryWorkspace.challenge_dossier_context.challenge_posture_bucket === 'string' && primaryWorkspace.challenge_dossier_context.challenge_posture_bucket.length > 0, 'Expected invariant challenge dossier to expose a compact posture bucket');

  const repeatedContributionWorkspace = readMecReviewWorkspace(secondManual.candidate.id, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });
  assert(repeatedContributionWorkspace && repeatedContributionWorkspace.challenge_dossier_context && repeatedContributionWorkspace.challenge_dossier_context.dossier_role === 'counterexample_contribution', 'Expected repeated counterexample workspace detail to expose counterexample contribution readability');
  assert(repeatedContributionWorkspace.challenge_dossier_context.contribution_posture === 'reinforced_visible_line' || repeatedContributionWorkspace.challenge_dossier_context.contribution_posture === 'reinforced_but_qualified_line', 'Expected repeated counterexample contribution to expose reinforced-line readability');
  assert(repeatedContributionWorkspace.challenge_dossier_context.primary_candidate_id === invariant.candidate.id, 'Expected repeated counterexample contribution to preserve the primary candidate linkage');

  const distinctContributionWorkspace = readMecReviewWorkspace(directCounterexample.candidate.id, {
    candidateOutputDir: tempCandidateDir,
    eventOutputDir: tempEventDir,
    mecReviewOutputDir: tempMecReviewDir
  });
  assert(distinctContributionWorkspace && distinctContributionWorkspace.challenge_dossier_context && distinctContributionWorkspace.challenge_dossier_context.dossier_role === 'counterexample_contribution', 'Expected distinct counterexample workspace detail to expose counterexample contribution readability');
  assert(distinctContributionWorkspace.challenge_dossier_context.contribution_posture === 'distinct_visible_line' || distinctContributionWorkspace.challenge_dossier_context.contribution_posture === 'qualified_visible_line', 'Expected distinct counterexample contribution to expose a distinct or qualified visible line posture');
  assert(typeof distinctContributionWorkspace.challenge_dossier_context.contribution_line_signature === 'string' && distinctContributionWorkspace.challenge_dossier_context.contribution_line_signature.length > 0, 'Expected distinct counterexample contribution to expose a compact line signature');
}

function verifyCliWorkspaceReadability() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4c-cli-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4c-cli-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-phase4c-cli-reviews-'));

  const eventOutput = runCli([
    path.join('tools', 'arena.js'),
    'create-event',
    '--event-type', 'phase4c_cli_probe',
    '--domain', 'mec_phase4c',
    '--summary', 'Phase 4C CLI workspace event',
    '--source-ref', 'verifier://phase4c/cli',
    '--trace-ref', 'trace://phase4c/cli',
    '--event-dir', tempEventDir,
    '--json'
  ]);
  const createdEvent = JSON.parse(eventOutput);

  const candidateOutput = runCli([
    path.join('tools', 'arena.js'),
    'create-mec-candidate',
    '--candidate-type', 'invariant_candidate',
    '--principle', 'Phase 4C CLI invariant',
    '--mechanism', 'CLI should expose canonical challenge dossier readability',
    '--source-event-id', createdEvent.event.id,
    '--boundary-fails-when', 'challenge dossier readability missing',
    '--boundary-fails-when', 'coverage posture disappears',
    '--boundary-edge-case', 'single cli dossier probe',
    '--candidate-dir', tempCandidateDir,
    '--event-dir', tempEventDir,
    '--json'
  ]);
  const createdCandidate = JSON.parse(candidateOutput);

  runCli([
    path.join('tools', 'arena.js'),
    'challenge-mec-candidate',
    createdCandidate.candidate.id,
    '--case-description', 'CLI challenge creates a proposal-only counterexample for dossier readability.',
    '--impact-on-candidate', 'narrows_scope',
    '--review-source', 'phase4c_cli_verifier',
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
  assert(workspaceOutput.includes('dossier:primary_candidate_challenge_dossier') || workspaceOutput.includes('dossier:counterexample_contribution'), 'Expected CLI workspace text output to expose minimal Phase 4C dossier readability');
  assert(workspaceOutput.includes('posture:'), 'Expected CLI workspace text output to expose challenge posture bucket readability');
  assert(workspaceOutput.includes('lines:'), 'Expected CLI workspace text output to expose challenge line counts');
}

function main() {
  verifyFilesExist();
  verifyDeskCopy();
  verifyNoDriftStrings();
  verifyRuntimeChallengeDossierContext();
  verifyCliWorkspaceReadability();
  runVerifier(path.join('tools', 'verify-mec-phase4b-challenge-evidence-counterexample-review-context.js'));
  console.log('MEC Phase 4C primary-candidate challenge dossier counterexample coverage verification passed.');
}

main();
