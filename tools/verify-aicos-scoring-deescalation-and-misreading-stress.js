#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const REPORT_PATH = path.join(ROOT_DIR, 'AICOS_SCORING_DEESCALATION_AND_MISREADING_STRESS_REPORT.md');
const CASES_DIR = path.join(ROOT_DIR, 'examples', 'scoring', 'deescalation-stress-cases');
const SUMMARY_PATH = path.join(CASES_DIR, 'selection-summary.json');
const EXPECTED_FILES = [
  '01-symbolic-maximum-no-material-escalation.json',
  '02-domain-strength-without-registry-exception.json',
  '03-schema-proposal-looks-s2-near.json',
  '04-compact-gate-heuristic-overreads-materiality.json'
];
const REQUIRED_CASE_FIELDS = [
  'schema_version',
  'id',
  'status',
  'source_anchor',
  'case_family',
  'title',
  'scenario',
  'dominant_reading',
  'why_no_material_escalation',
  'why_not_s2_entry_relevant',
  'why_not_adjacent_escalation_readings',
  'notes'
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function verifyReport() {
  assert(fs.existsSync(REPORT_PATH), 'Missing scoring deescalation and misreading stress report');
  const content = fs.readFileSync(REPORT_PATH, 'utf-8');
  for (const section of [
    '## Status und Boundary',
    '## Warum dieser kleine Folgeblock noch nötig ist',
    '## Welche Fehllektüren getestet werden',
    '## Warum `no_material_escalation` keine neue Systemklasse ist',
    '## Warum der Block komplementär statt doppelt bleibt',
    '## Was der Block NICHT tut'
  ]) {
    assert(content.includes(section), `Missing report section: ${section}`);
  }
  assert(content.includes('`56b48e0`'), 'Report must anchor to public scoring reference 56b48e0');
  assert(content.includes('S2 bleibt ungebaut'), 'Report must keep S2 unbuilt');
  assert(content.includes('keine neue Registry-Klasse'), 'Report must reject no_material_escalation as a new registry class');
  assert(content.includes('kein S2-Build'), 'Report must explicitly reject S2 build');
}

function verifyCases() {
  assert(fs.existsSync(CASES_DIR), 'Missing deescalation stress cases directory');
  assert(fs.existsSync(SUMMARY_PATH), 'Missing deescalation stress summary');

  const caseFiles = fs.readdirSync(CASES_DIR).filter((file) => file.endsWith('.json') && file !== 'selection-summary.json').sort();
  assert.deepStrictEqual(caseFiles, EXPECTED_FILES, 'Deescalation stress corpus must contain exactly the expected 4 case files');

  const summary = readJson(SUMMARY_PATH);
  assert(summary.block_version === 'v1', 'Deescalation stress summary must declare version v1');
  assert(summary.status === 'proposal_only', 'Deescalation stress summary must remain proposal_only');
  assert(summary.dominant_reading === 'no_material_escalation', 'Deescalation stress summary must keep the interpretive dominant reading fixed');
  assert(typeof summary.purpose === 'string' && summary.purpose.length > 0, 'Deescalation stress summary must declare a purpose');
  assert(Array.isArray(summary.entries) && summary.entries.length === 4, 'Deescalation stress summary must contain exactly 4 entries');

  const seenIds = new Set();
  const seenFiles = new Set();
  for (const entry of summary.entries) {
    for (const field of ['id', 'case_file', 'stress_pattern', 'source_anchor', 'primary_misreading', 's2_entry_relation']) {
      assert(typeof entry[field] === 'string' && entry[field].length > 0, `Deescalation stress summary entry missing field ${field}`);
    }
    assert(!seenIds.has(entry.id), `Duplicate deescalation stress summary id: ${entry.id}`);
    assert(!seenFiles.has(entry.case_file), `Duplicate deescalation stress summary case_file: ${entry.case_file}`);
    seenIds.add(entry.id);
    seenFiles.add(entry.case_file);

    const casePath = path.join(CASES_DIR, entry.case_file);
    assert(fs.existsSync(casePath), `Missing deescalation stress case file: ${entry.case_file}`);
    const artifact = readJson(casePath);

    for (const field of REQUIRED_CASE_FIELDS) {
      assert(typeof artifact[field] === 'string' && artifact[field].length > 0, `Deescalation stress case missing field ${field}: ${entry.case_file}`);
    }
    assert(artifact.schema_version === 'aicos-scoring-deescalation-stress-case/v1', `Unexpected case schema_version: ${entry.case_file}`);
    assert(artifact.status === 'proposal_only', `Deescalation stress case must remain proposal_only: ${entry.case_file}`);
    assert(artifact.dominant_reading === 'no_material_escalation', `Deescalation stress case must keep dominant_reading as no_material_escalation: ${entry.case_file}`);
    assert(Array.isArray(artifact.signals_for_escalation) && artifact.signals_for_escalation.length > 0, `Case must declare signals_for_escalation: ${entry.case_file}`);
    assert(Array.isArray(artifact.signals_against_escalation) && artifact.signals_against_escalation.length > 0, `Case must declare signals_against_escalation: ${entry.case_file}`);
    for (const value of artifact.signals_for_escalation) {
      assert(typeof value === 'string' && value.length > 0, `Case has invalid signals_for_escalation item: ${entry.case_file}`);
    }
    for (const value of artifact.signals_against_escalation) {
      assert(typeof value === 'string' && value.length > 0, `Case has invalid signals_against_escalation item: ${entry.case_file}`);
    }
  }
}

function verifyPackage() {
  const packageJson = readJson(path.join(ROOT_DIR, 'package.json'));
  assert(packageJson.scripts && packageJson.scripts['verify:scoring-deescalation-stress'], 'Missing scoring deescalation stress verifier script');
  assert(typeof packageJson.scripts['check:scoring-s1'] === 'string' && !packageJson.scripts['check:scoring-s1'].includes('verify:scoring-deescalation-stress'), 'check:scoring-s1 must remain unchanged by the deescalation block');
}

function main() {
  verifyReport();
  verifyCases();
  verifyPackage();
  console.log('AICOS scoring deescalation and misreading stress verification passed.');
}

main();
