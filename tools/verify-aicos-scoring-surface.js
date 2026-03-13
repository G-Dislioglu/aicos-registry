#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { deriveScoreSummary, normalizeImpact } = require('./score-lib');

const ROOT_DIR = path.join(__dirname, '..');
const REQUIRED_FILES = [
  path.join(ROOT_DIR, 'AICOS_SCORING_CHARTER.md'),
  path.join(ROOT_DIR, 'AICOS_SCORING_AUDIT_INTERPRETATION.md'),
  path.join(ROOT_DIR, 'AICOS_SCORING_AUTHOR_GUIDELINES.md'),
  path.join(ROOT_DIR, 'AICOS_SCORING_S1_CLOSURE.md'),
  path.join(ROOT_DIR, 'tools', 'score-lib.js'),
  path.join(ROOT_DIR, 'tools', 'audit-card-scoring.js'),
  path.join(ROOT_DIR, 'tools', 'check-card-scoring-hygiene.js'),
  path.join(ROOT_DIR, 'tools', 'generate-index.js'),
  path.join(ROOT_DIR, 'tools', 'verify-aicos-scoring-surface.js'),
  path.join(ROOT_DIR, 'index', 'INDEX.json')
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function verifySupportingDocs() {
  const interpretation = fs.readFileSync(path.join(ROOT_DIR, 'AICOS_SCORING_AUDIT_INTERPRETATION.md'), 'utf-8');
  const guidelines = fs.readFileSync(path.join(ROOT_DIR, 'AICOS_SCORING_AUTHOR_GUIDELINES.md'), 'utf-8');
  const closure = fs.readFileSync(path.join(ROOT_DIR, 'AICOS_SCORING_S1_CLOSURE.md'), 'utf-8');
  for (const expected of ['top-compressed', 'scan surface, but not yet valid as a strong governance or truth-quality surface', 'semantic calibration']) {
    assert(interpretation.includes(expected), `Expected audit interpretation text missing: ${expected}`);
  }
  for (const expected of ['do not treat all three fields as praise', '`95+` should be rare', 'High `value` does not require high `confidence`']) {
    assert(guidelines.includes(expected), `Expected author guideline text missing: ${expected}`);
  }
  for (const expected of ['S1 scoring is complete as a registry-layer calibration and scan-surface workflow', 'one deliberate soft-flag exception remains: `meta-006`', 'S2 has not started']) {
    assert(closure.includes(expected), `Expected scoring closure text missing: ${expected}`);
  }
}

function runNodeScript(relativePath, args = []) {
  const result = spawnSync(process.execPath, [relativePath, ...args], {
    cwd: ROOT_DIR,
    encoding: 'utf-8'
  });
  assert(result.status === 0, `${relativePath} failed: ${(result.stderr || result.stdout || '').trim()}`);
  return result.stdout.trim();
}

function verifyFilesExist() {
  for (const filePath of REQUIRED_FILES) {
    assert(fs.existsSync(filePath), `Missing scoring file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyCharterCopy() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'AICOS_SCORING_CHARTER.md'), 'utf-8');
  const expectedSnippets = [
    'vector-first, scalar-last',
    'card_core',
    'runtime_review',
    'learning_intake',
    'scan_score',
    'promotion_readiness',
    'no mass rewrite of all cards'
  ];
  for (const expected of expectedSnippets) {
    assert(content.includes(expected), `Expected scoring charter text missing: ${expected}`);
  }
}

function verifyScoreLib() {
  const normalized = normalizeImpact({ value: 88, risk: 75, confidence: 92 });
  assert(normalized && normalized.value === 88 && normalized.risk === 75 && normalized.confidence === 92, 'Expected normalizeImpact to preserve valid score seeds');
  const summary = deriveScoreSummary({ impact: { value: 88, risk: 75, confidence: 92 } });
  assert(summary && summary.schema_version === 'aicos-score-summary/v1', 'Expected deriveScoreSummary to expose schema version');
  assert(typeof summary.scan_score === 'number', 'Expected deriveScoreSummary to expose scan_score');
  assert(typeof summary.trust_score === 'number', 'Expected deriveScoreSummary to expose trust_score');
  assert(typeof summary.learning_score === 'number', 'Expected deriveScoreSummary to expose learning_score');
  assert(typeof summary.promotion_readiness === 'number', 'Expected deriveScoreSummary to expose promotion_readiness');
  assert(deriveScoreSummary({ impact: { value: 88, risk: 75 } }) === null, 'Expected deriveScoreSummary to stay null for partial impact seeds');
}

function verifyGeneratedIndex() {
  const indexEntries = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'index', 'INDEX.json'), 'utf-8'));
  assert(Array.isArray(indexEntries) && indexEntries.length > 0, 'Expected INDEX.json to contain entries');
  const errApi004 = indexEntries.find(entry => entry.id === 'err-api-004');
  assert(errApi004, 'Expected INDEX.json to contain err-api-004');
  assert(errApi004.impact && errApi004.impact.value === 86, 'Expected INDEX.json to expose normalized impact for err-api-004');
  assert(errApi004.score_summary && errApi004.score_summary.schema_version === 'aicos-score-summary/v1', 'Expected INDEX.json to expose score_summary for err-api-004');
  const meta001 = indexEntries.find(entry => entry.id === 'meta-001');
  assert(meta001 && meta001.impact && meta001.score_summary, 'Expected INDEX.json to expose impact and score_summary for meta-001');
}

function verifyAudit() {
  const output = runNodeScript(path.join('tools', 'audit-card-scoring.js'), ['--json']);
  const audit = JSON.parse(output);
  assert(audit.schema_version === 'aicos-card-scoring-audit/v1', 'Expected scoring audit schema version');
  assert(audit.totals.cards > 0, 'Expected audit to see cards');
  assert(audit.totals.with_impact === audit.totals.cards, 'Expected all current cards to expose impact');
  assert(audit.totals.index_projection_gaps === 0, 'Expected no scoring projection gaps into INDEX.json');
  assert(Array.isArray(audit.top_scan_scores) && audit.top_scan_scores.length > 0, 'Expected audit to expose top_scan_scores');
}

function verifyHygieneCheck() {
  const output = runNodeScript(path.join('tools', 'check-card-scoring-hygiene.js'), ['--json']);
  const hygiene = JSON.parse(output);
  assert(hygiene.schema_version === 'aicos-card-scoring-hygiene/v1', 'Expected scoring hygiene schema version');
  assert(hygiene.checked_cards > 0, 'Expected scoring hygiene check to inspect cards');
  assert(hygiene.hard_failure_count === 0, 'Expected scoring hygiene check to report no hard failures for current registry cards');
  assert(hygiene.flag_definitions && typeof hygiene.flag_definitions === 'object', 'Expected scoring hygiene check to expose flag definitions');
}

function main() {
  verifyFilesExist();
  verifyCharterCopy();
  verifySupportingDocs();
  verifyScoreLib();
  runNodeScript(path.join('tools', 'generate-index.js'));
  verifyGeneratedIndex();
  verifyAudit();
  verifyHygieneCheck();
  console.log('AICOS scoring surface verification passed.');
}

main();
