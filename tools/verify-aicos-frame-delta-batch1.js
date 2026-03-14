#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const BATCH1_DIR = path.join(ROOT_DIR, 'examples', 'studio', 'frame-delta', 'batch1', 'cases');
const REPORT_PATH = path.join(ROOT_DIR, 'AICOS_FRAME_DELTA_BATCH1_REPORT.md');
const REQUIRED_CASE_FILES = [
  'baseline-summary.json',
  'delta-preflight.json',
  'perspective-pass-selection.json',
  'frame-challenge-result.json',
  'comparison.scenario.json',
  'comparison.json'
];
const EXPECTED_CASE_IDS = [
  '01-idea-to-proposal-primary',
  '02-idea-to-proposal-boundary-variant',
  '03-idea-to-handoff-primary',
  '04-idea-to-handoff-boundary-variant',
  '05-contradiction-to-review-primary',
  '06-review-to-bundle-primary',
  '07-ambiguous-governance-ask',
  '08-over-clean-product-brief',
  '09-false-consensus-repair'
];
const EXPECTED_OUTCOMES = {
  '01-idea-to-proposal-primary': 'baseline_better',
  '02-idea-to-proposal-boundary-variant': 'mixed',
  '03-idea-to-handoff-primary': 'baseline_better',
  '04-idea-to-handoff-boundary-variant': 'delta_better',
  '05-contradiction-to-review-primary': 'mixed',
  '06-review-to-bundle-primary': 'mixed',
  '07-ambiguous-governance-ask': 'delta_better',
  '08-over-clean-product-brief': 'mixed',
  '09-false-consensus-repair': 'mixed'
};
const REQUIRED_AXES = [
  'misframing_detection',
  'constraint_fidelity',
  'premature_closure_resistance',
  'signal_gap_awareness',
  'actionability_after_challenge'
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function runNodeScript(scriptPath, args) {
  return execFileSync(process.execPath, [scriptPath, ...args], {
    cwd: ROOT_DIR,
    encoding: 'utf-8'
  });
}

function verifyFilesExist() {
  assert(fs.existsSync(REPORT_PATH), 'Missing Batch 1 report: AICOS_FRAME_DELTA_BATCH1_REPORT.md');
  assert(fs.existsSync(BATCH1_DIR), 'Missing Batch 1 case directory');
}

function verifyCaseDirectories() {
  const caseDirectories = fs.readdirSync(BATCH1_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  assert.deepStrictEqual(caseDirectories, EXPECTED_CASE_IDS, 'Batch 1 case set must contain exactly the expected 9 directories');

  for (const caseId of caseDirectories) {
    const caseDir = path.join(BATCH1_DIR, caseId);
    for (const fileName of REQUIRED_CASE_FILES) {
      assert(fs.existsSync(path.join(caseDir, fileName)), `Missing required Batch 1 file ${fileName} in ${caseId}`);
    }
    const hasLedger = fs.existsSync(path.join(caseDir, 'error-ledger-entry.json'));
    const hasMarker = fs.existsSync(path.join(caseDir, 'no-material-error-ledger-entry.json'));
    assert(hasLedger || hasMarker, `Batch 1 case must provide error-ledger-entry.json or no-material-error-ledger-entry.json: ${caseId}`);
  }
}

function verifyCaseShapeAndEvaluations() {
  for (const caseId of EXPECTED_CASE_IDS) {
    const caseDir = path.join(BATCH1_DIR, caseId);
    const baseline = readJson(path.join(caseDir, 'baseline-summary.json'));
    const preflight = readJson(path.join(caseDir, 'delta-preflight.json'));
    const passSelection = readJson(path.join(caseDir, 'perspective-pass-selection.json'));
    const challenge = readJson(path.join(caseDir, 'frame-challenge-result.json'));
    const comparisonScenario = readJson(path.join(caseDir, 'comparison.scenario.json'));
    const comparison = readJson(path.join(caseDir, 'comparison.json'));

    assert(baseline.comparison_only === true, `Baseline snapshot must be comparison_only: ${caseId}`);
    assert(baseline.non_authoritative === true, `Baseline snapshot must be non_authoritative: ${caseId}`);
    assert(preflight.artifact_type === 'frame_preflight', `delta-preflight.json must be frame_preflight: ${caseId}`);
    assert(Array.isArray(passSelection.selected_passes) && passSelection.selected_passes.length > 0, `Pass selection must list at least one pass: ${caseId}`);
    assert(challenge.artifact_type === 'frame_challenge_result', `frame-challenge-result.json must be frame_challenge_result: ${caseId}`);
    assert(comparison.artifact_type === 'frame_delta_evaluation', `comparison.json must be frame_delta_evaluation: ${caseId}`);
    assert(comparison.overall_result === EXPECTED_OUTCOMES[caseId], `Unexpected overall result for ${caseId}`);
    assert(Array.isArray(comparisonScenario.comparison_axes) && comparisonScenario.comparison_axes.length === REQUIRED_AXES.length, `comparison.scenario.json must define exactly 5 axes: ${caseId}`);

    const axisNames = comparisonScenario.comparison_axes.map((entry) => entry.axis);
    for (const axis of REQUIRED_AXES) {
      assert(axisNames.includes(axis), `Missing comparison axis ${axis} in ${caseId}`);
    }

    const hasLedger = fs.existsSync(path.join(caseDir, 'error-ledger-entry.json'));
    const hasMarker = fs.existsSync(path.join(caseDir, 'no-material-error-ledger-entry.json'));
    if (hasLedger) {
      const ledger = readJson(path.join(caseDir, 'error-ledger-entry.json'));
      assert(ledger.artifact_type === 'error_ledger_entry', `error-ledger-entry.json must be error_ledger_entry: ${caseId}`);
      assert(comparisonScenario.ledger_refs && comparisonScenario.ledger_refs.length > 0, `Scenario must include ledger_refs when a ledger entry exists: ${caseId}`);
    }
    if (hasMarker) {
      const marker = readJson(path.join(caseDir, 'no-material-error-ledger-entry.json'));
      assert(marker.marker_type === 'no_material_error_ledger_entry', `Marker must be no_material_error_ledger_entry: ${caseId}`);
      assert(typeof comparisonScenario.no_material_error_marker_ref === 'string', `Scenario must include no_material_error_marker_ref when marker exists: ${caseId}`);
    }

    const evalOutput = JSON.parse(runNodeScript(path.join('tools', 'frame-delta-eval.js'), [path.relative(ROOT_DIR, path.join(caseDir, 'comparison.scenario.json'))]));
    assert.deepStrictEqual(evalOutput, comparison, `Batch 1 comparison drifted for ${caseId}`);
  }
}

function verifyReport() {
  const content = fs.readFileSync(REPORT_PATH, 'utf-8');
  for (const expected of [
    '## Scope',
    '## Case list and outcomes',
    '## Outcome distribution',
    '## Axis distribution',
    '## Non-conclusions',
    'no automatic integration signal'
  ]) {
    assert(content.includes(expected), `Expected Batch 1 report text missing: ${expected}`);
  }
  for (const [caseId, outcome] of Object.entries(EXPECTED_OUTCOMES)) {
    assert(content.includes(`\`batch1-${caseId}\` => \`${outcome}\``), `Expected report case outcome missing: ${caseId}`);
  }
  assert(content.includes('`baseline_better`: 2'), 'Expected baseline_better count in Batch 1 report');
  assert(content.includes('`delta_better`: 2'), 'Expected delta_better count in Batch 1 report');
  assert(content.includes('`mixed`: 5'), 'Expected mixed count in Batch 1 report');
  assert(!content.toLowerCase().includes('replace studio now'), 'Batch 1 report must not imply immediate replacement');
}

function verifyReadmeAndPackage() {
  const readme = fs.readFileSync(path.join(ROOT_DIR, 'README.md'), 'utf-8');
  assert(readme.includes('AICOS_FRAME_DELTA_BATCH1_REPORT.md'), 'README must reference the Batch 1 report');
  assert(readme.includes('npm run verify:frame-delta-batch1'), 'README must reference the Batch 1 verifier command');

  const packageJson = readJson(path.join(ROOT_DIR, 'package.json'));
  assert(packageJson.scripts && packageJson.scripts['verify:frame-delta-batch1'], 'Missing Batch 1 verifier script');
  assert(typeof packageJson.scripts['verify:studio'] === 'string' && !packageJson.scripts['verify:studio'].includes('batch1'), 'verify:studio must remain unchanged by Batch 1');
}

function main() {
  verifyFilesExist();
  verifyCaseDirectories();
  verifyCaseShapeAndEvaluations();
  verifyReport();
  verifyReadmeAndPackage();
  console.log('AICOS frame delta batch 1 verification passed.');
}

main();
