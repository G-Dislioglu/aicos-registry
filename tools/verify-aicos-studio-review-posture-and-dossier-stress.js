#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const {
  ROOT_DIR,
  lintArtifact,
  readJson,
  findStudioDossierConsistencyIssues
} = require('./studio-schema-lib');

const POSTURE_DIR = path.join(ROOT_DIR, 'examples', 'studio', 'review-posture-boundary-cases');
const DOSSIER_DIR = path.join(ROOT_DIR, 'examples', 'studio', 'dossier-readout-stress-cases');
const SUMMARY_PATH = path.join(POSTURE_DIR, 'selection-summary.json');
const REPORT_PATH = path.join(ROOT_DIR, 'AICOS_STUDIO_REVIEW_POSTURE_AND_DOSSIER_STRESS_REPORT.md');
const ALLOWED_POSTURES = ['forward', 'hold', 'split', 'downgrade', 'archive', 'discard'];
const EXPECTED_POSTURE_FILES = [
  '01-clear-forward-later-human-decision.json',
  '02-clear-hold-conflict-visible-proposal.json',
  '03-clear-split-mixed-destination-packet.json',
  '04-clear-downgrade-overstated-nomination.json',
  '05-clear-archive-bounded-superseded-note.json',
  '06-clear-discard-runtime-drift-attempt.json',
  '07-ambiguous-forward-vs-hold-thin-evidence.json',
  '08-ambiguous-split-vs-downgrade-mixed-seriousness.json'
];
const EXPECTED_DOSSIER_FILES = [
  '01-smooth-summary-conflict-tail-risk.json',
  '02-boundary-blur-handoff-vs-approval-risk.json',
  '03-priority-visibility-soft-fail-contradiction.json',
  '04-safe-core-vs-open-uncertainty.json'
];
const EXPECTED_GROUP_COUNTS = {
  clear_forward_or_hold: 2,
  clear_split_or_downgrade: 2,
  clear_archive_or_discard: 2,
  ambiguous_boundary: 2
};
const REQUIRED_SUMMARY_SECTIONS = [
  '# Studio Dossier Summary Report',
  '## Dossier Metadata',
  '## Source Packet Summary',
  '## Included Proposal Artifacts',
  '## Included Review Records',
  '## Included Gate Reports',
  '## Bundle Context',
  '## Open Conflicts',
  '## Gate Outcomes',
  '## Recommended Human Next Step',
  '## Forbidden Automated Next Steps',
  '## Boundary Flags'
];
const DOSSIER_STRESS_SIGNALS = {
  '01-smooth-summary-conflict-tail-risk.json': 'Stress focus: zu glatte Zusammenfassung.',
  '02-boundary-blur-handoff-vs-approval-risk.json': 'Stress focus: versteckte Grenzverwischung.',
  '03-priority-visibility-soft-fail-contradiction.json': 'Stress focus: schlechte Prioritätensicht.',
  '04-safe-core-vs-open-uncertainty.json': 'Stress focus: unklare Trennung zwischen sicherem Kern und offener Unsicherheit.'
};

function runNodeScript(scriptPath, args) {
  return execFileSync(process.execPath, [scriptPath, ...args], {
    cwd: ROOT_DIR,
    encoding: 'utf-8'
  });
}

function verifyFilesExist() {
  assert(fs.existsSync(POSTURE_DIR), 'Missing review-posture-boundary-cases directory');
  assert(fs.existsSync(DOSSIER_DIR), 'Missing dossier-readout-stress-cases directory');
  assert(fs.existsSync(SUMMARY_PATH), 'Missing posture selection summary JSON');
  assert(fs.existsSync(REPORT_PATH), 'Missing combined studio review report');
}

function verifyReport() {
  const content = fs.readFileSync(REPORT_PATH, 'utf-8');
  for (const expected of [
    '## Status und Boundary',
    '## Warum diese Kombination als gemeinsamer Block sinnvoll ist',
    '## Welche Posture-Grenzen wurden getestet',
    '## Welche Leseflächen-Stresssignale wurden getestet',
    '## Was robust ist',
    '## Wo Drift- und Leserisiko bleibt',
    '## Was der Block NICHT beweist'
  ]) {
    assert(content.includes(expected), `Expected combined report section missing: ${expected}`);
  }
  for (const token of ['`59391de`', '`fd9cecf`', '`0c50c84`', '`8cf6ba5`', '`388094a`', '`5b7ecbb`', '`6a33235`']) {
    assert(content.includes(token), `Missing public reference in combined report: ${token}`);
  }
  assert(content.includes('SMT bleibt weiter Freeze / not-now'), 'Combined report must keep SMT frozen');
  assert(content.includes('`Studio Next Review Target Boundary Cases`'), 'Combined report must name the prerequisite boundary block');
}

function verifyPostureCases() {
  const files = fs.readdirSync(POSTURE_DIR).filter((file) => file.endsWith('.json') && file !== 'selection-summary.json').sort();
  assert.deepStrictEqual(files, EXPECTED_POSTURE_FILES, 'Review posture boundary corpus must contain exactly the expected 8 case files');

  const summary = readJson(SUMMARY_PATH);
  assert(summary.boundary_block_version === 'v1', 'Posture selection summary must declare version v1');
  assert(summary.status === 'proposal_only', 'Posture selection summary must remain proposal_only');
  assert(Array.isArray(summary.tested_postures), 'Posture selection summary must declare tested_postures');
  assert.deepStrictEqual(summary.tested_postures, ALLOWED_POSTURES, 'Posture selection summary must stay inside the bounded posture set');
  assert(Array.isArray(summary.entries) && summary.entries.length === 8, 'Posture selection summary must contain exactly 8 entries');

  const groupCounts = {
    clear_forward_or_hold: 0,
    clear_split_or_downgrade: 0,
    clear_archive_or_discard: 0,
    ambiguous_boundary: 0
  };
  const seenIds = new Set();
  const seenFiles = new Set();

  for (const entry of summary.entries) {
    for (const field of ['id', 'case_file', 'case_group', 'boundary_reason', 'expected_posture', 'why_not_adjacent_posture', 'ambiguity_level']) {
      assert(typeof entry[field] === 'string' && entry[field].length > 0, `Posture summary entry missing field ${field}`);
    }
    assert(!seenIds.has(entry.id), `Duplicate posture summary id: ${entry.id}`);
    assert(!seenFiles.has(entry.case_file), `Duplicate posture summary case_file: ${entry.case_file}`);
    seenIds.add(entry.id);
    seenFiles.add(entry.case_file);
    assert(Object.prototype.hasOwnProperty.call(groupCounts, entry.case_group), `Unexpected posture case_group: ${entry.case_group}`);
    groupCounts[entry.case_group] += 1;
    assert(ALLOWED_POSTURES.includes(entry.expected_posture), `Unexpected expected_posture: ${entry.expected_posture}`);
    assert(['low', 'medium', 'high'].includes(entry.ambiguity_level), `Unexpected ambiguity_level: ${entry.ambiguity_level}`);

    const casePath = path.join(POSTURE_DIR, entry.case_file);
    assert(fs.existsSync(casePath), `Missing review posture case file: ${entry.case_file}`);
    const artifact = readJson(casePath);
    const lintReport = lintArtifact(artifact);
    assert(lintReport.schemaErrors.length === 0, `Posture case must be schema-clean: ${entry.case_file}`);
    assert(lintReport.boundaryLints.length === 0, `Posture case must be boundary-clean: ${entry.case_file}`);
    assert(artifact.artifact_type === 'review_record', `Posture case must be a review_record: ${entry.case_file}`);
    assert(ALLOWED_POSTURES.includes(artifact.decision_type), `Posture case must use an allowed posture: ${entry.case_file}`);
    assert(artifact.decision_type === entry.expected_posture, `Summary expected_posture must match case decision_type: ${entry.case_file}`);
  }

  for (const [group, count] of Object.entries(EXPECTED_GROUP_COUNTS)) {
    assert(groupCounts[group] === count, `Expected ${count} entries for ${group}, got ${groupCounts[group]}`);
  }
}

function verifySummarySections(content) {
  let lastIndex = -1;
  for (const section of REQUIRED_SUMMARY_SECTIONS) {
    const index = content.indexOf(section);
    assert(index >= 0, `Expected summary report section missing: ${section}`);
    assert(index > lastIndex, `Expected summary report sections in deterministic order at: ${section}`);
    lastIndex = index;
  }
}

function verifyDossierStressCases() {
  const files = fs.readdirSync(DOSSIER_DIR).filter((file) => file.endsWith('.json')).sort();
  assert.deepStrictEqual(files, EXPECTED_DOSSIER_FILES, 'Dossier stress corpus must contain exactly the expected 4 case files');

  for (const fileName of files) {
    const filePath = path.join(DOSSIER_DIR, fileName);
    const dossier = readJson(filePath);
    const lintReport = lintArtifact(dossier);
    assert(lintReport.schemaErrors.length === 0, `Dossier stress case must be schema-clean: ${fileName}`);
    assert(lintReport.boundaryLints.length === 0, `Dossier stress case must be boundary-clean: ${fileName}`);
    assert(findStudioDossierConsistencyIssues(dossier).length === 0, `Dossier stress case must be consistency-clean: ${fileName}`);
    assert(typeof dossier.notes === 'string' && dossier.notes.includes(DOSSIER_STRESS_SIGNALS[fileName]), `Dossier stress case must declare its stress focus in notes: ${fileName}`);

    const rendered = runNodeScript(path.join('tools', 'studio-summary-report.js'), [path.relative(ROOT_DIR, filePath)]);
    verifySummarySections(rendered);
    assert(rendered.includes('Descriptive only; this report does not authorize forwarding or mutation.'), `Dossier summary must keep boundary language: ${fileName}`);
    for (const conflict of dossier.open_conflicts) {
      assert(rendered.includes(conflict), `Rendered dossier summary must surface conflict: ${conflict}`);
    }
    assert(rendered.includes(dossier.source_packet_summary), `Rendered dossier summary must preserve source packet summary: ${fileName}`);
    assert(rendered.includes(dossier.bundle_context_summary), `Rendered dossier summary must preserve bundle context summary: ${fileName}`);
  }
}

function verifyPackage() {
  const packageJson = readJson(path.join(ROOT_DIR, 'package.json'));
  assert(packageJson.scripts && packageJson.scripts['verify:studio-review-posture-dossier-stress'], 'Missing combined review posture and dossier stress verifier script');
  assert(typeof packageJson.scripts['verify:studio'] === 'string' && !packageJson.scripts['verify:studio'].includes('review-posture-dossier-stress'), 'verify:studio must remain unchanged by this block');
}

function main() {
  verifyFilesExist();
  verifyReport();
  verifyPostureCases();
  verifyDossierStressCases();
  verifyPackage();
  console.log('AICOS Studio review posture and dossier stress verification passed.');
}

main();
