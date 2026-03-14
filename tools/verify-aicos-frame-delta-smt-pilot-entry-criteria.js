#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const NOTE_PATH = path.join(ROOT_DIR, 'docs', 'frame-delta-smt-pilot-entry-criteria.md');
const SUMMARY_PATH = path.join(ROOT_DIR, 'examples', 'studio', 'frame-delta', 'smt-pilot-entry', 'go-no-go-summary.json');
const FAILURE_SIGNALS_PATH = path.join(ROOT_DIR, 'examples', 'studio', 'frame-delta', 'smt-pilot-entry', 'failure-signals.json');
const PUBLIC_COMMITS = ['59391de', 'fd9cecf', '0c50c84', '8cf6ba5', '388094a'];
const REQUIRED_OUTPUT_TYPES = ['new_question', 'boundary_clarification', 'evidence_gap', 'trigger_refinement', 'no_material_gain'];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function verifyFilesExist() {
  assert(fs.existsSync(NOTE_PATH), 'Missing SMT pilot entry criteria note markdown');
  assert(fs.existsSync(SUMMARY_PATH), 'Missing SMT pilot go/no-go summary JSON');
  assert(fs.existsSync(FAILURE_SIGNALS_PATH), 'Missing SMT pilot failure signals JSON');
}

function verifyNote() {
  const content = fs.readFileSync(NOTE_PATH, 'utf-8');
  for (const expected of [
    '## Zweck der Note',
    '## Warum nach der Candidate Note noch KEIN Pilot automatisch folgt',
    '## Mindestbedingungen für einen späteren Pilot',
    '### `entry_criteria_met`',
    '### `entry_criteria_not_met`',
    '### `needs_more_evidence`',
    '## Harte No-Go-Bedingungen',
    '## Abort- und Abbruch-Regeln',
    '## Realistische mögliche Pilot-Outputs',
    '## Candidate First Pilot Slot Recommendation',
    '## Was ausdrücklich NICHT behauptet wird',
    '## Harte Anti-Drift-Regeln'
  ]) {
    assert(content.includes(expected), `Expected SMT pilot entry criteria section missing: ${expected}`);
  }
  for (const commit of PUBLIC_COMMITS) {
    assert(content.includes(`\`${commit}\``), `Missing public commit reference in SMT pilot entry note: ${commit}`);
  }
  for (const expected of ['`new_question`', '`boundary_clarification`', '`evidence_gap`', '`trigger_refinement`', '`no_material_gain`']) {
    assert(content.includes(expected), `Expected bounded output type missing in note: ${expected}`);
  }
  assert(content.includes('kein Pilot'), 'Entry note must explicitly say no pilot now');
  assert(content.includes('kein Build'), 'Entry note must explicitly say no build now');
  assert(content.includes('kein Operator'), 'Entry note must explicitly say no operator now');
  assert(content.includes('keine Trigger-Policy'), 'Entry note must explicitly reject trigger policy');
  assert(content.includes('dass ein Pilot bereits beschlossen ist'), 'Entry note must explicitly reject the claim that a pilot is already decided');
}

function verifySummary() {
  const summary = readJson(SUMMARY_PATH);
  assert(summary.entry_criteria_version === 'v1', 'Go/no-go summary must declare version v1');
  assert(summary.status === 'proposal_only', 'Go/no-go summary must remain proposal_only');
  assert(Array.isArray(summary.entries) && summary.entries.length >= 6, 'Go/no-go summary must contain a small explicit entry set');
  const types = new Set();
  for (const entry of summary.entries) {
    for (const field of ['id', 'criterion', 'type', 'reason', 'required_now', 'notes']) {
      assert(Object.prototype.hasOwnProperty.call(entry, field), `Go/no-go entry missing field ${field}`);
    }
    assert(typeof entry.id === 'string' && entry.id.length > 0, 'Go/no-go entry id must be non-empty');
    assert(typeof entry.criterion === 'string' && entry.criterion.length > 0, 'Go/no-go entry criterion must be non-empty');
    assert(typeof entry.reason === 'string' && entry.reason.length > 0, 'Go/no-go entry reason must be non-empty');
    assert(typeof entry.notes === 'string' && entry.notes.length > 0, 'Go/no-go entry notes must be non-empty');
    assert(typeof entry.required_now === 'boolean', 'Go/no-go entry required_now must be boolean');
    assert(['go', 'no_go', 'evidence_gap'].includes(entry.type), `Unexpected go/no-go entry type: ${entry.type}`);
    types.add(entry.type);
  }
  for (const type of ['go', 'no_go', 'evidence_gap']) {
    assert(types.has(type), `Go/no-go summary must cover type ${type}`);
  }
}

function verifyFailureSignals() {
  const failureSignals = readJson(FAILURE_SIGNALS_PATH);
  assert(failureSignals.entry_criteria_version === 'v1', 'Failure signals must declare version v1');
  assert(failureSignals.status === 'proposal_only', 'Failure signals must remain proposal_only');
  assert(Array.isArray(failureSignals.signals) && failureSignals.signals.length >= 8, 'Failure signals must contain the expected compact signal set');
  const ids = new Set();
  for (const signal of failureSignals.signals) {
    for (const field of ['id', 'signal', 'effect', 'reason']) {
      assert(typeof signal[field] === 'string' && signal[field].length > 0, `Failure signal missing field ${field}`);
    }
    assert(['abort', 'disqualify'].includes(signal.effect), `Unexpected failure signal effect: ${signal.effect}`);
    ids.add(signal.id);
  }
  for (const requiredId of [
    'artificial_counterframing_without_material_gain',
    'high_false_split_rate',
    'high_shallow_split_rate',
    'diplomatic_merge_instead_of_tension_extraction',
    'no_clear_output_difference_vs_existing_line',
    'complexity_exceeds_learning_value',
    'unclear_success_criteria',
    'drift_toward_silent_integration_logic'
  ]) {
    assert(ids.has(requiredId), `Missing required failure signal: ${requiredId}`);
  }
  assert(Array.isArray(failureSignals.valid_pilot_outputs), 'Failure signals must declare valid_pilot_outputs');
  assert.deepStrictEqual(failureSignals.valid_pilot_outputs, REQUIRED_OUTPUT_TYPES, 'Failure signals valid_pilot_outputs must match required bounded set');
  assert(failureSignals.pilot_slot_recommendation.recommended_first_slot === 'P1 Frame Challenge', 'First pilot slot must stay P1 Frame Challenge');
  assert(failureSignals.pilot_slot_recommendation.later_secondary_candidate === 'P3 Improvement Gate', 'Secondary candidate must stay P3 Improvement Gate');
  assert(failureSignals.pilot_slot_recommendation.allow_parallel_slots_now === false, 'Parallel pilot slots must remain disabled');
  assert(failureSignals.pilot_slot_recommendation.pilot_now === false, 'Pilot must remain off for now');
  assert(failureSignals.pilot_slot_recommendation.build_now === false, 'Build must remain off for now');
  assert(failureSignals.pilot_slot_recommendation.operator_now === false, 'Operator must remain off for now');
}

function verifyPackage() {
  const packageJson = readJson(path.join(ROOT_DIR, 'package.json'));
  assert(packageJson.scripts && packageJson.scripts['verify:frame-delta-smt-pilot-entry'], 'Missing SMT pilot entry verifier script');
  assert(typeof packageJson.scripts['verify:studio'] === 'string' && !packageJson.scripts['verify:studio'].includes('smt-pilot-entry'), 'verify:studio must remain unchanged by SMT pilot entry criteria');
}

function main() {
  verifyFilesExist();
  verifyNote();
  verifySummary();
  verifyFailureSignals();
  verifyPackage();
  console.log('AICOS frame delta SMT pilot entry criteria verification passed.');
}

main();
