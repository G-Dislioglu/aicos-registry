#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { ROOT_DIR, buildBundleManifestFromArtifacts, readJson } = require('./studio-schema-lib');

const REQUIRED_FILES = [
  path.join(ROOT_DIR, 'AICOS_STUDIO_BUNDLE_REVIEW_CONTEXT.md'),
  path.join(ROOT_DIR, 'AICOS_STUDIO_TRACE_CONSISTENCY_RULES.md'),
  path.join(ROOT_DIR, 'tools', 'verify-aicos-studio-bundle-trace.js'),
  path.join(ROOT_DIR, 'examples', 'studio', 'invalid', 'studio-bundle-manifest-review-subject-outside.invalid.json'),
  path.join(ROOT_DIR, 'examples', 'studio', 'invalid', 'studio-bundle-manifest-topic-drift.invalid.json')
];

function runNodeScript(scriptPath, args) {
  return execFileSync(process.execPath, [scriptPath, ...args], {
    cwd: ROOT_DIR,
    encoding: 'utf-8'
  });
}

function verifyFilesExist() {
  for (const filePath of REQUIRED_FILES) {
    assert(fs.existsSync(filePath), `Missing studio bundle trace file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyDocs() {
  const reviewContext = fs.readFileSync(path.join(ROOT_DIR, 'AICOS_STUDIO_BUNDLE_REVIEW_CONTEXT.md'), 'utf-8');
  for (const expected of [
    '## How review records are interpreted inside a bundle',
    '## How gate reports are interpreted inside a bundle',
    '## Allowed cross-reference patterns',
    '## Forbidden trace patterns',
    '## Proposal-only and boundary limits'
  ]) {
    assert(reviewContext.includes(expected), `Expected bundle review context text missing: ${expected}`);
  }

  const traceRules = fs.readFileSync(path.join(ROOT_DIR, 'AICOS_STUDIO_TRACE_CONSISTENCY_RULES.md'), 'utf-8');
  for (const expected of [
    '## Rule 1 — Included subject rule',
    '## Rule 2 — Subject type match rule',
    '## Rule 3 — Topic legibility rule',
    '## Rule 4 — No implicit approval rule',
    '## Rule 5 — No runtime or truth trace rule',
    '## Rule 6 — Review/gate trace pairing rule'
  ]) {
    assert(traceRules.includes(expected), `Expected trace consistency rules text missing: ${expected}`);
  }
}

function verifyValidTraceExamples() {
  const cases = [
    {
      file: path.join(ROOT_DIR, 'examples', 'studio', 'valid', 'studio-bundle-manifest-review.valid.json'),
      expectedStatus: 'consistent'
    },
    {
      file: path.join(ROOT_DIR, 'examples', 'studio', 'valid', 'studio-bundle-manifest-handoff.valid.json'),
      expectedStatus: 'needs_review'
    }
  ];

  for (const entry of cases) {
    const artifact = readJson(entry.file);
    const lintOutput = runNodeScript(path.join('tools', 'studio-lint.js'), [path.relative(ROOT_DIR, entry.file), '--json']);
    const lintReport = JSON.parse(lintOutput);
    assert(lintReport.schema_error_count === 0, `Expected zero schema errors for valid trace case: ${path.basename(entry.file)}`);
    assert(lintReport.boundary_lint_count === 0, `Expected zero boundary lints for valid trace case: ${path.basename(entry.file)}`);
    assert(artifact.consistency_status === entry.expectedStatus, `Unexpected consistency_status in valid trace case: ${path.basename(entry.file)}`);
  }
}

function verifyBundleCliTraceOutput() {
  const artifactPaths = [
    path.join('examples', 'studio', 'valid', 'card-review-packet.valid.json'),
    path.join('examples', 'studio', 'valid', 'proposal-artifact.valid.json'),
    path.join('examples', 'studio', 'valid', 'card-review-target-artifact.valid.json'),
    path.join('examples', 'studio', 'valid', 'review-record-forward.valid.json'),
    path.join('examples', 'studio', 'valid', 'gate-report-pass.valid.json')
  ];
  const expected = buildBundleManifestFromArtifacts(artifactPaths.map((entry) => path.join(ROOT_DIR, entry)), {
    bundleId: 'studio-bundle-review-001',
    bundleType: 'review_package',
    intendedNextStep: 'human_registry_review',
    topic: 'Proposal-only nomination review package for bounded registry review',
    bundleSummary: 'Keeps proposal-only wording, target nomination, review record, and gate report together as one local reviewable package.'
  });
  assert(expected.consistencyIssues.length === 0, 'Expected trace-consistent bundle build fixture to have zero consistency issues');
}

function verifyInvalidTraceExamples() {
  const invalidExpectations = [
    {
      file: path.join('examples', 'studio', 'invalid', 'studio-bundle-manifest-review-subject-outside.invalid.json'),
      code: 'review_subject_outside_bundle'
    },
    {
      file: path.join('examples', 'studio', 'invalid', 'studio-bundle-manifest-topic-drift.invalid.json'),
      code: 'bundle_topic_drift'
    }
  ];

  for (const entry of invalidExpectations) {
    let output = '';
    let failed = false;
    try {
      output = runNodeScript(path.join('tools', 'studio-lint.js'), [entry.file, '--json']);
    } catch (error) {
      failed = true;
      output = error.stdout || '';
    }
    assert(failed, `Expected studio lint to fail for ${entry.file}`);
    const report = JSON.parse(output);
    const codes = report.files.flatMap((fileReport) => fileReport.boundary_lints.map((lint) => lint.code));
    assert(codes.includes(entry.code), `Expected bundle trace lint code ${entry.code} for ${entry.file}`);
  }
}

function verifyReadmeAndPackage() {
  const readme = fs.readFileSync(path.join(ROOT_DIR, 'README.md'), 'utf-8');
  for (const expected of [
    'AICOS_STUDIO_BUNDLE_REVIEW_CONTEXT.md',
    'AICOS_STUDIO_TRACE_CONSISTENCY_RULES.md',
    'local review packaging discipline only',
    'npm run verify:studio-bundle-trace'
  ]) {
    assert(readme.includes(expected), `Expected studio bundle trace README text missing: ${expected}`);
  }

  const packageJson = readJson(path.join(ROOT_DIR, 'package.json'));
  for (const scriptName of ['verify:studio-bundle-trace', 'verify:studio-bundles', 'verify:studio']) {
    assert(packageJson.scripts && packageJson.scripts[scriptName], `Missing studio bundle trace script: ${scriptName}`);
  }
}

function main() {
  verifyFilesExist();
  verifyDocs();
  verifyValidTraceExamples();
  verifyBundleCliTraceOutput();
  verifyInvalidTraceExamples();
  verifyReadmeAndPackage();
  console.log('AICOS studio bundle trace verification passed.');
}

main();
