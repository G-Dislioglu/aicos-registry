#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const {
  ROOT_DIR,
  buildScaffoldArtifact,
  findStudioDossierConsistencyIssues,
  lintArtifact,
  readJson
} = require('./studio-schema-lib');

const REQUIRED_FILES = [
  path.join(ROOT_DIR, 'AICOS_STUDIO_DOSSIER_SPEC.md'),
  path.join(ROOT_DIR, 'AICOS_STUDIO_SUMMARY_REPORT_SPEC.md'),
  path.join(ROOT_DIR, 'schemas', 'studio', 'studio-dossier.schema.json'),
  path.join(ROOT_DIR, 'tools', 'studio-dossier.js'),
  path.join(ROOT_DIR, 'tools', 'studio-summary-report.js'),
  path.join(ROOT_DIR, 'tools', 'verify-aicos-studio-dossiers.js'),
  path.join(ROOT_DIR, 'examples', 'studio', 'scaffolded', 'studio-dossier.scaffolded.json'),
  path.join(ROOT_DIR, 'examples', 'studio', 'valid', 'studio-dossier-review.valid.json'),
  path.join(ROOT_DIR, 'examples', 'studio', 'valid', 'studio-dossier-contradiction.valid.json'),
  path.join(ROOT_DIR, 'examples', 'studio', 'valid', 'studio-dossier-review.summary.valid.md'),
  path.join(ROOT_DIR, 'examples', 'studio', 'valid', 'studio-dossier-contradiction.summary.valid.md'),
  path.join(ROOT_DIR, 'examples', 'studio', 'invalid', 'studio-dossier-runtime-member.invalid.json'),
  path.join(ROOT_DIR, 'examples', 'studio', 'invalid', 'studio-dossier-missing-gate-context.invalid.json'),
  path.join(ROOT_DIR, 'examples', 'studio', 'invalid', 'studio-dossier-approval-claim.invalid.json'),
  path.join(ROOT_DIR, 'examples', 'studio', 'invalid', 'studio-dossier-summary-suppressed-conflicts.invalid.md'),
  path.join(ROOT_DIR, 'examples', 'studio', 'invalid', 'studio-dossier-summary-missing-section.invalid.md')
];

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

function runNodeScript(scriptPath, args) {
  return execFileSync(process.execPath, [scriptPath, ...args], {
    cwd: ROOT_DIR,
    encoding: 'utf-8'
  });
}

function verifyFilesExist() {
  for (const filePath of REQUIRED_FILES) {
    assert(fs.existsSync(filePath), `Missing studio dossier file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyDocs() {
  const dossierSpec = fs.readFileSync(path.join(ROOT_DIR, 'AICOS_STUDIO_DOSSIER_SPEC.md'), 'utf-8');
  for (const expected of [
    '## What a Studio dossier is',
    '## Allowed included artifact types',
    '## Forbidden included artifact classes',
    '## Required sections',
    '## Forbidden automated next steps'
  ]) {
    assert(dossierSpec.includes(expected), `Expected dossier spec text missing: ${expected}`);
  }

  const summarySpec = fs.readFileSync(path.join(ROOT_DIR, 'AICOS_STUDIO_SUMMARY_REPORT_SPEC.md'), 'utf-8');
  for (const expected of [
    '## Required sections',
    '## Forbidden sections and language',
    '## Rendering rules',
    '## Boundary language'
  ]) {
    assert(summarySpec.includes(expected), `Expected summary spec text missing: ${expected}`);
  }
}

function verifyScaffoldCli() {
  const stdout = runNodeScript(path.join('tools', 'studio-dossier.js'), ['--scaffold']);
  const scaffolded = JSON.parse(stdout);
  const expected = buildScaffoldArtifact('studio-dossier');
  assert.deepStrictEqual(scaffolded, expected, 'Studio dossier scaffold CLI output drifted');

  const genericStdout = runNodeScript(path.join('tools', 'studio-scaffold.js'), ['studio-dossier']);
  const genericScaffolded = JSON.parse(genericStdout);
  assert.deepStrictEqual(genericScaffolded, expected, 'Generic studio scaffold output drifted for studio-dossier');

  const committed = readJson(path.join(ROOT_DIR, 'examples', 'studio', 'scaffolded', 'studio-dossier.scaffolded.json'));
  assert.deepStrictEqual(committed, expected, 'Committed dossier scaffold example drifted');
}

function verifyDossierBuilderCli() {
  const stdout = runNodeScript(path.join('tools', 'studio-dossier.js'), [
    path.join('examples', 'studio', 'scenarios', 'review-to-bundle', 'intake.packet.json'),
    path.join('examples', 'studio', 'scenarios', 'review-to-bundle', 'proposal.artifact.json'),
    path.join('examples', 'studio', 'scenarios', 'review-to-bundle', 'card-review-target.artifact.json'),
    path.join('examples', 'studio', 'scenarios', 'review-to-bundle', 'review-record.forward.json'),
    path.join('examples', 'studio', 'scenarios', 'review-to-bundle', 'gate-report.pass.json'),
    '--bundle-manifest', path.join('examples', 'studio', 'scenarios', 'review-to-bundle', 'bundle.manifest.json'),
    '--dossier-id', 'studio-dossier-review-001',
    '--title', 'Bounded nomination dossier for later human registry wording review',
    '--bundle-context-summary', 'The dossier aligns with the local review package bundle and keeps intake, proposal, nomination target, review record, and gate report together for human reading.',
    '--source-packet-summary', 'The source packet stays local and nominates one existing card boundary for later bounded human wording review without mutating the registry directly.',
    '--recommended-human-next-step', 'human_registry_review',
    '--open-conflicts', 'Final wording scope still requires human review.|participants still disagree on review priority timing',
    '--notes', 'This dossier is a local human review aid only.'
  ]);
  const report = JSON.parse(stdout);
  const expected = readJson(path.join(ROOT_DIR, 'examples', 'studio', 'valid', 'studio-dossier-review.valid.json'));
  assert.deepStrictEqual(report.dossier, expected, 'Studio dossier CLI output drifted for review dossier fixture');
  assert(report.no_forwarding === true, 'Expected studio-dossier CLI to stay non-forwarding');
  assert(report.no_runtime_write === true, 'Expected studio-dossier CLI to stay non-runtime');
  assert(report.no_truth_mutation === true, 'Expected studio-dossier CLI to stay non-mutating');
  assert(report.consistency_issues.length === 0, 'Expected zero consistency issues for valid review dossier build');
}

function verifySummaryCli() {
  const reviewOutput = runNodeScript(path.join('tools', 'studio-summary-report.js'), [path.join('examples', 'studio', 'valid', 'studio-dossier-review.valid.json')]);
  const reviewExpected = fs.readFileSync(path.join(ROOT_DIR, 'examples', 'studio', 'valid', 'studio-dossier-review.summary.valid.md'), 'utf-8');
  assert.strictEqual(reviewOutput, reviewExpected, 'Studio summary report output drifted for review dossier');

  const contradictionOutput = runNodeScript(path.join('tools', 'studio-summary-report.js'), [path.join('examples', 'studio', 'valid', 'studio-dossier-contradiction.valid.json')]);
  const contradictionExpected = fs.readFileSync(path.join(ROOT_DIR, 'examples', 'studio', 'valid', 'studio-dossier-contradiction.summary.valid.md'), 'utf-8');
  assert.strictEqual(contradictionOutput, contradictionExpected, 'Studio summary report output drifted for contradiction dossier');
}

function verifyValidDossiers() {
  const files = [
    path.join(ROOT_DIR, 'examples', 'studio', 'valid', 'studio-dossier-review.valid.json'),
    path.join(ROOT_DIR, 'examples', 'studio', 'valid', 'studio-dossier-contradiction.valid.json')
  ];
  for (const filePath of files) {
    const report = lintArtifact(readJson(filePath));
    assert(report.schemaErrors.length === 0, `Expected valid studio dossier schema pass: ${path.relative(ROOT_DIR, filePath)}`);
    assert(report.boundaryLints.length === 0, `Expected valid studio dossier boundary pass: ${path.relative(ROOT_DIR, filePath)}`);
    assert(findStudioDossierConsistencyIssues(readJson(filePath)).length === 0, `Expected zero dossier consistency issues: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyInvalidDossiers() {
  const checks = [
    {
      file: path.join(ROOT_DIR, 'examples', 'studio', 'invalid', 'studio-dossier-runtime-member.invalid.json'),
      code: 'runtime_write_attempt'
    },
    {
      file: path.join(ROOT_DIR, 'examples', 'studio', 'invalid', 'studio-dossier-missing-gate-context.invalid.json'),
      code: 'missing_gate_outcome_summary'
    },
    {
      file: path.join(ROOT_DIR, 'examples', 'studio', 'invalid', 'studio-dossier-approval-claim.invalid.json'),
      code: 'implicit_approval_claim'
    }
  ];

  for (const check of checks) {
    const report = lintArtifact(readJson(check.file));
    const codes = report.boundaryLints.map((entry) => entry.code);
    assert(report.schemaErrors.length === 0, `Expected schema-valid invalid dossier fixture: ${path.relative(ROOT_DIR, check.file)}`);
    assert(codes.includes(check.code), `Expected dossier lint code ${check.code}: ${path.relative(ROOT_DIR, check.file)}`);
  }
}

function verifySummarySections(content) {
  let lastIndex = -1;
  for (const section of REQUIRED_SUMMARY_SECTIONS) {
    const index = content.indexOf(section);
    assert(index >= 0, `Expected summary section missing: ${section}`);
    assert(index > lastIndex, `Expected summary sections in deterministic order at: ${section}`);
    lastIndex = index;
  }
}

function verifyValidSummaries() {
  const checks = [
    {
      summary: path.join(ROOT_DIR, 'examples', 'studio', 'valid', 'studio-dossier-review.summary.valid.md'),
      dossier: path.join(ROOT_DIR, 'examples', 'studio', 'valid', 'studio-dossier-review.valid.json')
    },
    {
      summary: path.join(ROOT_DIR, 'examples', 'studio', 'valid', 'studio-dossier-contradiction.summary.valid.md'),
      dossier: path.join(ROOT_DIR, 'examples', 'studio', 'valid', 'studio-dossier-contradiction.valid.json')
    }
  ];

  for (const check of checks) {
    const content = fs.readFileSync(check.summary, 'utf-8');
    const dossier = readJson(check.dossier);
    verifySummarySections(content);
    for (const conflict of dossier.open_conflicts) {
      assert(content.includes(conflict), `Expected summary to surface conflict: ${conflict}`);
    }
    assert(content.includes('Descriptive only; this report does not authorize forwarding or mutation.'), `Expected boundary language in summary: ${path.relative(ROOT_DIR, check.summary)}`);
  }
}

function verifyInvalidSummaries() {
  const suppressed = fs.readFileSync(path.join(ROOT_DIR, 'examples', 'studio', 'invalid', 'studio-dossier-summary-suppressed-conflicts.invalid.md'), 'utf-8');
  verifySummarySections(suppressed);
  assert(!suppressed.includes('participants still disagree on review priority timing'), 'Expected invalid summary to suppress a known conflict for verifier coverage');

  const missingSection = fs.readFileSync(path.join(ROOT_DIR, 'examples', 'studio', 'invalid', 'studio-dossier-summary-missing-section.invalid.md'), 'utf-8');
  let error = null;
  try {
    verifySummarySections(missingSection);
  } catch (caught) {
    error = caught;
  }
  assert(error, 'Expected missing-section invalid summary to fail section verification');
}

function verifyLintCliCoverage() {
  const output = runNodeScript(path.join('tools', 'studio-lint.js'), [path.join('examples', 'studio', 'valid', 'studio-dossier-review.valid.json'), '--json']);
  const report = JSON.parse(output);
  assert(report.checked_files === 1, 'Expected studio lint to check exactly one dossier file');
  assert(report.schema_error_count === 0, 'Expected valid dossier lint to have zero schema errors');
  assert(report.boundary_lint_count === 0, 'Expected valid dossier lint to have zero boundary lints');
}

function verifyReadmeAndPackage() {
  const readme = fs.readFileSync(path.join(ROOT_DIR, 'README.md'), 'utf-8');
  for (const expected of [
    'AICOS_STUDIO_DOSSIER_SPEC.md',
    'AICOS_STUDIO_SUMMARY_REPORT_SPEC.md',
    'tools/studio-dossier.js',
    'tools/studio-summary-report.js',
    'tools/verify-aicos-studio-dossiers.js',
    'npm run dossier:studio',
    'npm run summary:studio',
    'npm run verify:studio-dossiers'
  ]) {
    assert(readme.includes(expected), `Expected studio dossier README text missing: ${expected}`);
  }

  const packageJson = readJson(path.join(ROOT_DIR, 'package.json'));
  for (const scriptName of ['dossier:studio', 'summary:studio', 'verify:studio-dossiers', 'verify:studio']) {
    assert(packageJson.scripts && packageJson.scripts[scriptName], `Missing studio dossier script: ${scriptName}`);
  }
}

function main() {
  verifyFilesExist();
  verifyDocs();
  verifyScaffoldCli();
  verifyDossierBuilderCli();
  verifySummaryCli();
  verifyValidDossiers();
  verifyInvalidDossiers();
  verifyValidSummaries();
  verifyInvalidSummaries();
  verifyLintCliCoverage();
  verifyReadmeAndPackage();
  console.log('AICOS studio dossier verification passed.');
}

main();
