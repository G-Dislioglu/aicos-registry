#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const {
  ROOT_DIR,
  buildScaffoldArtifact,
  buildBundleManifestFromArtifacts,
  readJson
} = require('./studio-schema-lib');

const REQUIRED_FILES = [
  path.join(ROOT_DIR, 'AICOS_STUDIO_BUNDLE_SPEC.md'),
  path.join(ROOT_DIR, 'AICOS_STUDIO_MANIFEST_SPEC.md'),
  path.join(ROOT_DIR, 'schemas', 'studio', 'studio-bundle-manifest.schema.json'),
  path.join(ROOT_DIR, 'tools', 'studio-bundle.js'),
  path.join(ROOT_DIR, 'tools', 'verify-aicos-studio-bundles.js'),
  path.join(ROOT_DIR, 'examples', 'studio', 'scaffolded', 'studio-bundle-manifest.scaffolded.json')
];

function runNodeScript(scriptPath, args) {
  return execFileSync(process.execPath, [scriptPath, ...args], {
    cwd: ROOT_DIR,
    encoding: 'utf-8'
  });
}

function verifyFilesExist() {
  for (const filePath of REQUIRED_FILES) {
    assert(fs.existsSync(filePath), `Missing studio bundle file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyScaffoldCli() {
  const stdout = runNodeScript(path.join('tools', 'studio-bundle.js'), []);
  const scaffolded = JSON.parse(stdout);
  const expected = buildScaffoldArtifact('studio-bundle-manifest');
  assert.deepStrictEqual(scaffolded, expected, 'Dedicated bundle CLI output drifted for studio-bundle-manifest');

  const genericStdout = runNodeScript(path.join('tools', 'studio-scaffold.js'), ['studio-bundle-manifest']);
  const genericScaffolded = JSON.parse(genericStdout);
  assert.deepStrictEqual(genericScaffolded, expected, 'Generic studio scaffold output drifted for studio-bundle-manifest');

  const committed = readJson(path.join(ROOT_DIR, 'examples', 'studio', 'scaffolded', 'studio-bundle-manifest.scaffolded.json'));
  assert.deepStrictEqual(committed, expected, 'Committed bundle scaffold example drifted for studio-bundle-manifest');
}

function verifyBundleBuildCli() {
  const artifactPaths = [
    path.join('examples', 'studio', 'valid', 'card-review-packet.valid.json'),
    path.join('examples', 'studio', 'valid', 'proposal-artifact.valid.json'),
    path.join('examples', 'studio', 'valid', 'card-review-target-artifact.valid.json'),
    path.join('examples', 'studio', 'valid', 'review-record-forward.valid.json'),
    path.join('examples', 'studio', 'valid', 'gate-report-pass.valid.json')
  ];

  const stdout = runNodeScript(path.join('tools', 'studio-bundle.js'), [
    ...artifactPaths,
    '--bundle-id', 'studio-bundle-review-001',
    '--bundle-type', 'review_package',
    '--intended-next-step', 'human_registry_review',
    '--topic', 'Proposal-only nomination review package for bounded registry review',
    '--bundle-summary', 'Keeps proposal-only wording, target nomination, review record, and gate report together as one local reviewable package.'
  ]);
  const report = JSON.parse(stdout);
  const expected = buildBundleManifestFromArtifacts(artifactPaths.map((entry) => path.join(ROOT_DIR, entry)), {
    bundleId: 'studio-bundle-review-001',
    bundleType: 'review_package',
    intendedNextStep: 'human_registry_review',
    topic: 'Proposal-only nomination review package for bounded registry review',
    bundleSummary: 'Keeps proposal-only wording, target nomination, review record, and gate report together as one local reviewable package.'
  });
  assert.deepStrictEqual(report.manifest, expected.manifest, 'Bundle CLI manifest output drifted');
  assert.deepStrictEqual(report.consistency_issues, expected.consistencyIssues, 'Bundle CLI consistency issue output drifted');
  assert(report.no_forwarding === true, 'Bundle CLI must remain non-forwarding');
  assert(report.no_runtime_write === true, 'Bundle CLI must remain non-runtime');
  assert(report.no_truth_mutation === true, 'Bundle CLI must remain non-mutating');
}

function verifyLintabilityAndFailures() {
  const scaffoldOutput = runNodeScript(path.join('tools', 'studio-lint.js'), [path.join('examples', 'studio', 'scaffolded'), '--json']);
  const scaffoldReport = JSON.parse(scaffoldOutput);
  assert(scaffoldReport.checked_files >= 5, 'Expected studio lint to check the expanded scaffolded corpus including bundle manifests');
  assert(scaffoldReport.schema_error_count === 0, 'Expected scaffolded bundle examples to have zero schema errors');
  assert(scaffoldReport.boundary_lint_count === 0, 'Expected scaffolded bundle examples to have zero boundary lints');

  const invalidExpectations = [
    {
      file: path.join('examples', 'studio', 'invalid', 'studio-bundle-manifest-inconsistent-refs.invalid.json'),
      code: 'inconsistent_source_packet_ref'
    },
    {
      file: path.join('examples', 'studio', 'invalid', 'studio-bundle-manifest-truth-mutation.invalid.json'),
      code: 'truth_mutation_attempt'
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
    assert(report.boundary_lint_count > 0 || report.schema_error_count > 0, `Expected lint findings for ${entry.file}`);
    const codes = report.files.flatMap((fileReport) => fileReport.boundary_lints.map((lint) => lint.code));
    assert(codes.includes(entry.code), `Expected bundle lint code ${entry.code} for ${entry.file}`);
  }
}

function verifyReadmeAndPackage() {
  const readme = fs.readFileSync(path.join(ROOT_DIR, 'README.md'), 'utf-8');
  for (const expected of [
    'AICOS_STUDIO_BUNDLE_SPEC.md',
    'AICOS_STUDIO_MANIFEST_SPEC.md',
    'tools/studio-bundle.js',
    'tools/verify-aicos-studio-bundles.js',
    'local packaging layer only',
    'npm run scaffold:studio-bundle',
    'npm run verify:studio-bundles'
  ]) {
    assert(readme.includes(expected), `Expected studio bundle README text missing: ${expected}`);
  }

  const packageJson = readJson(path.join(ROOT_DIR, 'package.json'));
  for (const scriptName of ['scaffold:studio-bundle', 'verify:studio-bundles', 'verify:studio']) {
    assert(packageJson.scripts && packageJson.scripts[scriptName], `Missing studio bundle script: ${scriptName}`);
  }
}

function main() {
  verifyFilesExist();
  verifyScaffoldCli();
  verifyBundleBuildCli();
  verifyLintabilityAndFailures();
  verifyReadmeAndPackage();
  console.log('AICOS studio bundle verification passed.');
}

main();
