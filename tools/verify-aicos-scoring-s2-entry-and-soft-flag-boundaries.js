#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const NOTE_PATH = path.join(ROOT_DIR, 'docs', 'scoring-s2-entry-criteria.md');
const CASES_DIR = path.join(ROOT_DIR, 'examples', 'scoring', 'soft-flag-boundary-cases');
const SUMMARY_PATH = path.join(CASES_DIR, 'selection-summary.json');
const REPORT_PATH = path.join(ROOT_DIR, 'AICOS_SCORING_S2_ENTRY_AND_SOFT_FLAG_BOUNDARY_REPORT.md');
const EXPECTED_FILES = [
  '01-clear-proposal-synthesis-overvaluation.json',
  '02-clear-broad-architecture-overvaluation.json',
  '03-clear-bounded-fix-justified-exception.json',
  '04-clear-production-fallback-justified-exception.json',
  '05-ambiguous-numeric-gate-proposal-borderline.json',
  '06-ambiguous-high-value-domain-solution.json'
];
const EXPECTED_GROUP_COUNTS = {
  clear_likely_overvaluation: 2,
  clear_justified_exception: 2,
  ambiguous_boundary: 2
};
const ALLOWED_CLASSIFICATIONS = [
  'likely_overvaluation',
  'justified_exception',
  'borderline_but_defensible'
];
const ALLOWED_SOFT_FLAG_SIGNALS = [
  'all_three_90_plus',
  'value_95_plus',
  'confidence_95_plus',
  'proposed_high_confidence',
  'meta_extreme_confidence',
  'critical_risk_low_confidence_review'
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function verifyNote() {
  assert(fs.existsSync(NOTE_PATH), 'Missing scoring S2 entry criteria note');
  const content = fs.readFileSync(NOTE_PATH, 'utf-8');
  for (const section of [
    '## Status und Boundary',
    '## Warum aus S1 nicht automatisch S2 folgt',
    '## Mindestbedingungen, bevor S2 überhaupt erwogen werden darf',
    '## No-Go-Bedingungen, die S2 aktuell blockieren',
    '## Warum S2 jetzt noch nicht gebaut wird',
    '## Anti-Drift-Regeln'
  ]) {
    assert(content.includes(section), `Expected S2 entry note section missing: ${section}`);
  }
  for (const token of ['`59391de`', '`fd9cecf`', '`0c50c84`', '`8cf6ba5`', '`388094a`', '`5b7ecbb`', '`6a33235`', '`9f95871`']) {
    assert(content.includes(token), `Missing public reference in S2 entry note: ${token}`);
  }
  assert(content.includes('SMT bleibt Freeze / not-now'), 'S2 entry note must keep SMT frozen');
  assert(content.includes('Diese Notiz baut kein S2.'), 'S2 entry note must explicitly refuse building S2 now');
  assert(content.includes('nur als enge Ausnahmezone zulässig'), 'S2 entry note must explicitly narrow borderline_but_defensible');
  assert(content.includes('mindestens ein reales Overvaluation-Signal und mindestens ein reales Defensibility- oder Exception-Signal'), 'S2 entry note must require both overvaluation and defensibility pressure for borderline cases');
}

function verifyReport() {
  assert(fs.existsSync(REPORT_PATH), 'Missing combined scoring report');
  const content = fs.readFileSync(REPORT_PATH, 'utf-8');
  for (const section of [
    '## Status und Boundary',
    '## Warum diese Kombination als gemeinsamer Block sinnvoll ist',
    '## Welche Entry-Bedingungen für S2 geprüft wurden',
    '## Welche Soft-Flag-Grenzen getestet wurden',
    '## Was robust ist',
    '## Wo Drift- und Übertheorisierungsrisiko bleibt',
    '## Was der Block NICHT beweist'
  ]) {
    assert(content.includes(section), `Expected combined scoring report section missing: ${section}`);
  }
  assert(content.includes('`borderline_but_defensible`'), 'Combined scoring report must explain the reused borderline label');
  assert(content.includes('keine bequeme Restkategorie'), 'Combined scoring report must reject borderline as a catch-all');
  assert(content.includes('beide Adjacent-Rejections lesbar bleiben'), 'Combined scoring report must require readable adjacent rejection for borderline cases');
}

function verifyCasesAndSummary() {
  assert(fs.existsSync(CASES_DIR), 'Missing soft-flag boundary cases directory');
  assert(fs.existsSync(SUMMARY_PATH), 'Missing soft-flag selection summary');

  const caseFiles = fs.readdirSync(CASES_DIR).filter((file) => file.endsWith('.json') && file !== 'selection-summary.json').sort();
  assert.deepStrictEqual(caseFiles, EXPECTED_FILES, 'Soft-flag boundary corpus must contain exactly the expected 6 case files');

  const summary = readJson(SUMMARY_PATH);
  assert(summary.boundary_block_version === 'v1', 'Soft-flag summary must declare version v1');
  assert(summary.status === 'proposal_only', 'Soft-flag summary must remain proposal_only');
  assert(Array.isArray(summary.tested_soft_flag_signals), 'Soft-flag summary must declare tested_soft_flag_signals');
  for (const signal of summary.tested_soft_flag_signals) {
    assert(ALLOWED_SOFT_FLAG_SIGNALS.includes(signal), `Unexpected tested soft-flag signal: ${signal}`);
  }
  assert(Array.isArray(summary.review_labels), 'Soft-flag summary must declare review_labels');
  assert.deepStrictEqual(summary.review_labels, ALLOWED_CLASSIFICATIONS, 'Soft-flag summary review_labels must remain in the bounded existing review language');
  assert(typeof summary.borderline_guardrail === 'string' && summary.borderline_guardrail.length > 0, 'Soft-flag summary must declare a borderline_guardrail');
  assert(summary.borderline_guardrail.includes('real overvaluation pressure') && summary.borderline_guardrail.includes('real defensibility pressure'), 'Soft-flag summary borderline_guardrail must bind borderline to both pressures');
  assert(Array.isArray(summary.entries) && summary.entries.length === 6, 'Soft-flag summary must contain exactly 6 entries');

  const groupCounts = {
    clear_likely_overvaluation: 0,
    clear_justified_exception: 0,
    ambiguous_boundary: 0
  };
  const seenIds = new Set();
  const seenFiles = new Set();

  for (const entry of summary.entries) {
    for (const field of ['id', 'case_file', 'case_group', 'boundary_reason', 'classification_rationale', 'expected_classification', 'why_not_likely_overvaluation', 'why_not_justified_exception', 'why_not_adjacent_classification', 'ambiguity_level']) {
      assert(typeof entry[field] === 'string' && entry[field].length > 0, `Soft-flag summary entry missing field ${field}`);
    }
    assert(!seenIds.has(entry.id), `Duplicate soft-flag summary id: ${entry.id}`);
    assert(!seenFiles.has(entry.case_file), `Duplicate soft-flag summary case_file: ${entry.case_file}`);
    seenIds.add(entry.id);
    seenFiles.add(entry.case_file);
    assert(Object.prototype.hasOwnProperty.call(groupCounts, entry.case_group), `Unexpected soft-flag case_group: ${entry.case_group}`);
    groupCounts[entry.case_group] += 1;
    assert(ALLOWED_CLASSIFICATIONS.includes(entry.expected_classification), `Unexpected expected_classification: ${entry.expected_classification}`);
    assert(['low', 'medium', 'high'].includes(entry.ambiguity_level), `Unexpected ambiguity_level: ${entry.ambiguity_level}`);
    if (entry.expected_classification === 'borderline_but_defensible') {
      assert(entry.why_not_likely_overvaluation.length > 0, `Borderline entry must explain why not likely_overvaluation: ${entry.case_file}`);
      assert(entry.why_not_justified_exception.length > 0, `Borderline entry must explain why not justified_exception: ${entry.case_file}`);
    }

    const casePath = path.join(CASES_DIR, entry.case_file);
    assert(fs.existsSync(casePath), `Missing soft-flag case file: ${entry.case_file}`);
    const artifact = readJson(casePath);
    for (const field of ['schema_version', 'id', 'status', 'case_group', 'boundary_reason', 'classification_rationale', 'expected_classification', 'why_not_likely_overvaluation', 'why_not_justified_exception', 'why_not_adjacent_classification', 'ambiguity_level', 'bounded_reading']) {
      assert(typeof artifact[field] === 'string' && artifact[field].length > 0, `Soft-flag case missing field ${field}: ${entry.case_file}`);
    }
    assert(artifact.schema_version === 'aicos-scoring-soft-flag-boundary-case/v1', `Unexpected soft-flag case schema_version: ${entry.case_file}`);
    assert(artifact.status === 'proposal_only', `Soft-flag case must remain proposal_only: ${entry.case_file}`);
    assert(ALLOWED_CLASSIFICATIONS.includes(artifact.expected_classification), `Soft-flag case must use an allowed classification: ${entry.case_file}`);
    assert(Array.isArray(artifact.soft_flag_signals) && artifact.soft_flag_signals.length > 0, `Soft-flag case must declare soft_flag_signals: ${entry.case_file}`);
    for (const signal of artifact.soft_flag_signals) {
      assert(ALLOWED_SOFT_FLAG_SIGNALS.includes(signal), `Unexpected soft-flag signal in case ${entry.case_file}: ${signal}`);
    }
    assert(artifact.expected_classification === entry.expected_classification, `Summary expected_classification must match case file: ${entry.case_file}`);
    assert(typeof artifact.source_snapshot === 'object' && artifact.source_snapshot !== null, `Soft-flag case must declare source_snapshot: ${entry.case_file}`);
    assert(typeof artifact.source_snapshot.overvaluation_signal === 'string' && artifact.source_snapshot.overvaluation_signal.length > 0, `Soft-flag case must name an overvaluation signal in the snapshot: ${entry.case_file}`);
    assert(typeof artifact.source_snapshot.defensibility_signal === 'string' && artifact.source_snapshot.defensibility_signal.length > 0, `Soft-flag case must name a defensibility signal in the snapshot: ${entry.case_file}`);
    if (artifact.expected_classification === 'borderline_but_defensible') {
      assert(artifact.source_snapshot.overvaluation_signal.length > 0, `Borderline case must name an overvaluation signal in the snapshot: ${entry.case_file}`);
      assert(artifact.source_snapshot.defensibility_signal.length > 0, `Borderline case must name a defensibility signal in the snapshot: ${entry.case_file}`);
      assert(artifact.why_not_likely_overvaluation.length > 0, `Borderline case must explain why not likely_overvaluation: ${entry.case_file}`);
      assert(artifact.why_not_justified_exception.length > 0, `Borderline case must explain why not justified_exception: ${entry.case_file}`);
    }
  }

  for (const [group, count] of Object.entries(EXPECTED_GROUP_COUNTS)) {
    assert(groupCounts[group] === count, `Expected ${count} entries for ${group}, got ${groupCounts[group]}`);
  }
}

function verifyPackage() {
  const packageJson = readJson(path.join(ROOT_DIR, 'package.json'));
  assert(packageJson.scripts && packageJson.scripts['verify:scoring-s2-entry-soft-flags'], 'Missing scoring S2 entry soft-flag verifier script');
  assert(typeof packageJson.scripts['check:scoring-s1'] === 'string' && !packageJson.scripts['check:scoring-s1'].includes('verify:scoring-s2-entry-soft-flags'), 'check:scoring-s1 must remain unchanged by this block');
}

function main() {
  verifyNote();
  verifyReport();
  verifyCasesAndSummary();
  verifyPackage();
  console.log('AICOS scoring S2 entry and soft-flag boundary verification passed.');
}

main();
