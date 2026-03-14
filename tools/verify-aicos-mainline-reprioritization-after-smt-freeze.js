#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const NOTE_PATH = path.join(ROOT_DIR, 'docs', 'aicos-mainline-reprioritization-after-smt-freeze.md');
const SUMMARY_PATH = path.join(ROOT_DIR, 'examples', 'studio', 'priority-review', 'mainline-candidate-blocks-after-smt-freeze.json');
const RATIONALE_PATH = path.join(ROOT_DIR, 'examples', 'studio', 'priority-review', 'selected-next-block-rationale.json');
const DEFERRED_PATH = path.join(ROOT_DIR, 'examples', 'studio', 'priority-review', 'deferred-blocks-not-now.json');
const PUBLIC_COMMITS = ['59391de', 'fd9cecf', '0c50c84', '8cf6ba5', '388094a', '5b7ecbb'];
const EXPECTED_SELECTED_ID = 'studio_next_review_target_boundary_cases';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function verifyFilesExist() {
  assert(fs.existsSync(NOTE_PATH), 'Missing mainline reprioritization note markdown');
  assert(fs.existsSync(SUMMARY_PATH), 'Missing mainline candidate blocks summary JSON');
  assert(fs.existsSync(RATIONALE_PATH), 'Missing selected next block rationale JSON');
  assert(fs.existsSync(DEFERRED_PATH), 'Missing deferred blocks not-now JSON');
}

function verifyNote() {
  const content = fs.readFileSync(NOTE_PATH, 'utf-8');
  for (const expected of [
    '## Warum jetzt nicht weiter SMT',
    '## Geprüfte Hauptlinien-Kandidaten',
    '## Empfohlener nächster K2-Block',
    '## Warum genau dieser Block jetzt Vorrang hat',
    '## Warum die anderen jetzt nicht zuerst dran sind',
    '## Was ausdrücklich NICHT als nächster Schritt empfohlen wird',
    '## Deferred / Not-Now',
    '## Harte Anti-Drift-Regeln'
  ]) {
    assert(content.includes(expected), `Expected reprioritization note section missing: ${expected}`);
  }
  for (const commit of PUBLIC_COMMITS) {
    assert(content.includes(`\`${commit}\``), `Missing public commit reference in reprioritization note: ${commit}`);
  }
  for (const expected of [
    'SMT-Linie',
    'eingefroren',
    'K2 — Studio Next Review Target Boundary Cases',
    'kein Pilot jetzt',
    'kein O8 jetzt',
    'keine Integration jetzt'
  ]) {
    assert(content.includes(expected), `Expected freeze or selection statement missing in reprioritization note: ${expected}`);
  }
}

function verifySummary() {
  const summary = readJson(SUMMARY_PATH);
  assert(summary.reprioritization_version === 'v1', 'Candidate summary must declare version v1');
  assert(summary.status === 'proposal_only', 'Candidate summary must remain proposal_only');
  assert(summary.freeze_context === 'smt_frozen_for_now', 'Candidate summary must explicitly keep SMT frozen');
  assert(Array.isArray(summary.entries), 'Candidate summary entries must be an array');
  assert(summary.entries.length >= 3 && summary.entries.length <= 5, 'Candidate summary must contain exactly 3 to 5 candidates');
  const ranks = new Set();
  let selectedCount = 0;
  for (const entry of summary.entries) {
    for (const field of ['id', 'candidate_block', 'domain', 'expected_value', 'risk', 'prereq_status', 'why_now', 'why_not_now', 'recommended_rank']) {
      assert(Object.prototype.hasOwnProperty.call(entry, field), `Candidate summary entry missing field ${field}`);
    }
    assert(typeof entry.id === 'string' && entry.id.length > 0, 'Candidate id must be non-empty');
    assert(typeof entry.candidate_block === 'string' && entry.candidate_block.length > 0, 'Candidate block title must be non-empty');
    assert(typeof entry.why_now === 'string' && entry.why_now.length > 0, 'Candidate why_now must be non-empty');
    assert(typeof entry.why_not_now === 'string' && entry.why_not_now.length > 0, 'Candidate why_not_now must be non-empty');
    assert(Number.isInteger(entry.recommended_rank), 'Candidate recommended_rank must be integer');
    ranks.add(entry.recommended_rank);
    if (entry.id === EXPECTED_SELECTED_ID) {
      selectedCount += 1;
      assert(entry.recommended_rank === 1, 'Selected candidate must be rank 1');
    }
  }
  assert(selectedCount === 1, 'Candidate summary must contain exactly one selected rank-1 candidate');
}

function verifyRationale() {
  const rationale = readJson(RATIONALE_PATH);
  assert(rationale.reprioritization_version === 'v1', 'Rationale must declare version v1');
  assert(rationale.status === 'proposal_only', 'Rationale must remain proposal_only');
  assert(rationale.selected_next_k2_block && rationale.selected_next_k2_block.id === EXPECTED_SELECTED_ID, 'Rationale must select the expected next K2 block');
  assert(Array.isArray(rationale.selected_next_k2_block.already_satisfied_prerequisites) && rationale.selected_next_k2_block.already_satisfied_prerequisites.length >= 3, 'Rationale must list satisfied prerequisites');
  assert(Array.isArray(rationale.selected_next_k2_block.bounded_risks) && rationale.selected_next_k2_block.bounded_risks.length >= 3, 'Rationale must list bounded risks');
  for (const key of ['why_rank_2_not_first', 'why_rank_3_not_first']) {
    assert(rationale[key] && typeof rationale[key].reason === 'string' && rationale[key].reason.length > 0, `Rationale must explain ${key}`);
  }
  assert(Array.isArray(rationale.not_recommended_now) && rationale.not_recommended_now.includes('smt_continuation'), 'Rationale must explicitly keep SMT continuation out of the next step');
}

function verifyDeferred() {
  const deferred = readJson(DEFERRED_PATH);
  assert(deferred.reprioritization_version === 'v1', 'Deferred block list must declare version v1');
  assert(deferred.status === 'proposal_only', 'Deferred block list must remain proposal_only');
  assert(Array.isArray(deferred.not_now) && deferred.not_now.length >= 5, 'Deferred block list must contain explicit not-now entries');
  const ids = new Set(deferred.not_now.map((entry) => entry.id));
  for (const requiredId of ['smt_continuation', 'smt_pilot_build', 'o8_or_operator_build', 'broad_theory_or_schema_expansion', 'early_studio_or_scoring_reloops']) {
    assert(ids.has(requiredId), `Deferred block list missing required not-now id: ${requiredId}`);
  }
}

function verifyPackage() {
  const packageJson = readJson(path.join(ROOT_DIR, 'package.json'));
  assert(packageJson.scripts && packageJson.scripts['verify:mainline-reprioritization'], 'Missing mainline reprioritization verifier script');
  assert(typeof packageJson.scripts['verify:studio'] === 'string' && !packageJson.scripts['verify:studio'].includes('reprioritization'), 'verify:studio must remain unchanged by mainline reprioritization');
}

function main() {
  verifyFilesExist();
  verifyNote();
  verifySummary();
  verifyRationale();
  verifyDeferred();
  verifyPackage();
  console.log('AICOS mainline reprioritization after SMT freeze verification passed.');
}

main();
