#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { lintArtifact, NEXT_REVIEW_TARGETS } = require('./studio-schema-lib');

const ROOT_DIR = path.join(__dirname, '..');
const CASES_DIR = path.join(ROOT_DIR, 'examples', 'studio', 'review-target-boundary-cases');
const SUMMARY_PATH = path.join(CASES_DIR, 'selection-summary.json');
const REPORT_PATH = path.join(ROOT_DIR, 'AICOS_STUDIO_NEXT_REVIEW_TARGET_BOUNDARY_REPORT.md');
const EXPECTED_TARGETS = ['manual_design_followup', 'request_human_decision', 'human_registry_review'];
const EXPECTED_GROUP_COUNTS = {
  clear_manual_design_followup: 2,
  clear_escalation: 2,
  ambiguous_boundary: 2
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function verifyFilesExist() {
  assert(fs.existsSync(CASES_DIR), 'Missing review-target-boundary-cases directory');
  assert(fs.existsSync(SUMMARY_PATH), 'Missing selection summary JSON');
  assert(fs.existsSync(REPORT_PATH), 'Missing next review target boundary report');
}

function verifyReport() {
  const content = fs.readFileSync(REPORT_PATH, 'utf-8');
  for (const expected of [
    '## Status und Boundary',
    '## Welche Zielgrenzen wurden getestet',
    '## Warum genau diese 6 Fälle',
    '## Sichtbares Muster',
    '## Wo die bestehende Logik robust ist',
    '## Wo noch Drift-Risiko bleibt',
    '## Was dieser Block NICHT beweist'
  ]) {
    assert(content.includes(expected), `Expected boundary report section missing: ${expected}`);
  }
  for (const token of ['`59391de`', '`fd9cecf`', '`0c50c84`', '`8cf6ba5`', '`388094a`', '`5b7ecbb`']) {
    assert(content.includes(token), `Missing public reference in boundary report: ${token}`);
  }
  assert(content.includes('SMT bleibt vorerst Freeze'), 'Boundary report must keep SMT frozen');
}

function verifySummaryAndCases() {
  const summary = readJson(SUMMARY_PATH);
  assert(summary.boundary_block_version === 'v1', 'Boundary summary must declare version v1');
  assert(summary.status === 'proposal_only', 'Boundary summary must remain proposal_only');
  assert(Array.isArray(summary.tested_target_classes), 'Boundary summary must declare tested target classes');
  assert.deepStrictEqual(summary.tested_target_classes, EXPECTED_TARGETS, 'Boundary summary target classes must match the bounded existing set');
  assert(Array.isArray(summary.entries) && summary.entries.length === 6, 'Boundary summary must contain exactly 6 entries');

  const groupCounts = {
    clear_manual_design_followup: 0,
    clear_escalation: 0,
    ambiguous_boundary: 0
  };
  const seenIds = new Set();
  const seenFiles = new Set();

  for (const entry of summary.entries) {
    for (const field of ['id', 'case_file', 'case_group', 'boundary_reason', 'expected_target', 'why_not_adjacent_target', 'ambiguity_level']) {
      assert(typeof entry[field] === 'string' && entry[field].length > 0, `Boundary summary entry missing field ${field}`);
    }
    assert(!seenIds.has(entry.id), `Duplicate summary id: ${entry.id}`);
    assert(!seenFiles.has(entry.case_file), `Duplicate summary case_file: ${entry.case_file}`);
    seenIds.add(entry.id);
    seenFiles.add(entry.case_file);
    assert(Object.prototype.hasOwnProperty.call(groupCounts, entry.case_group), `Unexpected case_group: ${entry.case_group}`);
    groupCounts[entry.case_group] += 1;
    assert(EXPECTED_TARGETS.includes(entry.expected_target), `Unexpected expected_target: ${entry.expected_target}`);
    assert(['low', 'medium', 'high'].includes(entry.ambiguity_level), `Unexpected ambiguity_level: ${entry.ambiguity_level}`);

    const casePath = path.join(CASES_DIR, entry.case_file);
    assert(fs.existsSync(casePath), `Missing boundary case file: ${entry.case_file}`);
    const artifact = readJson(casePath);
    const lintReport = lintArtifact(artifact);
    assert(lintReport.schemaErrors.length === 0, `Boundary case must be schema-clean: ${entry.case_file}`);
    assert(lintReport.boundaryLints.length === 0, `Boundary case must be boundary-clean: ${entry.case_file}`);
    assert(artifact.artifact_type === 'studio_intake_packet', `Boundary case must be a studio_intake_packet: ${entry.case_file}`);
    assert(EXPECTED_TARGETS.includes(artifact.next_review_target), `Boundary case must use an allowed target class: ${entry.case_file}`);
    assert(!artifact.next_review_target || NEXT_REVIEW_TARGETS.includes(artifact.next_review_target), `Boundary case target must remain within existing next_review_target values: ${entry.case_file}`);
    assert(artifact.next_review_target === entry.expected_target, `Summary expected_target must match case file target: ${entry.case_file}`);
  }

  for (const [group, count] of Object.entries(EXPECTED_GROUP_COUNTS)) {
    assert(groupCounts[group] === count, `Expected ${count} entries for ${group}, got ${groupCounts[group]}`);
  }
}

function verifyPackage() {
  const packageJson = readJson(path.join(ROOT_DIR, 'package.json'));
  assert(packageJson.scripts && packageJson.scripts['verify:studio-review-target-boundaries'], 'Missing review target boundary verifier script');
  assert(typeof packageJson.scripts['verify:studio'] === 'string' && !packageJson.scripts['verify:studio'].includes('review-target-boundaries'), 'verify:studio must remain unchanged by boundary cases block');
}

function main() {
  verifyFilesExist();
  verifyReport();
  verifySummaryAndCases();
  verifyPackage();
  console.log('AICOS Studio next review target boundary cases verification passed.');
}

main();
