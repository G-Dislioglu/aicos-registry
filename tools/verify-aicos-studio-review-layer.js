#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { ROOT_DIR, buildScaffoldArtifact, readJson } = require('./studio-schema-lib');

const REQUIRED_FILES = [
  path.join(ROOT_DIR, 'AICOS_STUDIO_REVIEW_RECORD_SPEC.md'),
  path.join(ROOT_DIR, 'AICOS_STUDIO_GATE_REPORT_SPEC.md'),
  path.join(ROOT_DIR, 'schemas', 'studio', 'review-record.schema.json'),
  path.join(ROOT_DIR, 'schemas', 'studio', 'gate-report.schema.json'),
  path.join(ROOT_DIR, 'tools', 'studio-review-record.js'),
  path.join(ROOT_DIR, 'tools', 'studio-gate-report.js'),
  path.join(ROOT_DIR, 'tools', 'verify-aicos-studio-review-layer.js'),
  path.join(ROOT_DIR, 'examples', 'studio', 'scaffolded', 'review-record.scaffolded.json'),
  path.join(ROOT_DIR, 'examples', 'studio', 'scaffolded', 'gate-report.scaffolded.json')
];

function verifyFilesExist() {
  for (const filePath of REQUIRED_FILES) {
    assert(fs.existsSync(filePath), `Missing studio review-layer file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function runNodeScript(scriptPath, args) {
  return execFileSync(process.execPath, [scriptPath, ...args], {
    cwd: ROOT_DIR,
    encoding: 'utf-8'
  });
}

function verifyScaffoldCli() {
  const checks = [
    {
      kind: 'review-record',
      script: path.join('tools', 'studio-review-record.js'),
      file: path.join(ROOT_DIR, 'examples', 'studio', 'scaffolded', 'review-record.scaffolded.json')
    },
    {
      kind: 'gate-report',
      script: path.join('tools', 'studio-gate-report.js'),
      file: path.join(ROOT_DIR, 'examples', 'studio', 'scaffolded', 'gate-report.scaffolded.json')
    }
  ];

  for (const check of checks) {
    const stdout = runNodeScript(check.script, []);
    const scaffolded = JSON.parse(stdout);
    const expected = buildScaffoldArtifact(check.kind);
    assert.deepStrictEqual(scaffolded, expected, `Dedicated review-layer CLI output drifted for ${check.kind}`);

    const genericStdout = runNodeScript(path.join('tools', 'studio-scaffold.js'), [check.kind]);
    const genericScaffolded = JSON.parse(genericStdout);
    assert.deepStrictEqual(genericScaffolded, expected, `Generic studio scaffold output drifted for ${check.kind}`);

    const committed = readJson(check.file);
    assert.deepStrictEqual(committed, expected, `Committed scaffold example drifted for ${check.kind}`);
  }
}

function verifyLintability() {
  const output = runNodeScript(path.join('tools', 'studio-lint.js'), [path.join('examples', 'studio', 'scaffolded'), '--json']);
  const report = JSON.parse(output);
  assert(report.checked_files >= 4, 'Expected studio lint to check the expanded scaffolded corpus');
  assert(report.schema_error_count === 0, 'Expected scaffolded review-layer examples to have zero schema errors');
  assert(report.boundary_lint_count === 0, 'Expected scaffolded review-layer examples to have zero boundary lints');
}

function verifyReadmeAndPackage() {
  const readme = fs.readFileSync(path.join(ROOT_DIR, 'README.md'), 'utf-8');
  for (const expected of [
    'AICOS_STUDIO_REVIEW_RECORD_SPEC.md',
    'AICOS_STUDIO_GATE_REPORT_SPEC.md',
    'tools/studio-review-record.js',
    'tools/studio-gate-report.js',
    'tools/verify-aicos-studio-review-layer.js',
    'npm run scaffold:studio-review-record',
    'npm run scaffold:studio-gate-report',
    'npm run verify:studio-review'
  ]) {
    assert(readme.includes(expected), `Expected studio review-layer README text missing: ${expected}`);
  }

  const packageJson = readJson(path.join(ROOT_DIR, 'package.json'));
  for (const scriptName of ['scaffold:studio-review-record', 'scaffold:studio-gate-report', 'verify:studio-review']) {
    assert(packageJson.scripts && packageJson.scripts[scriptName], `Missing studio review-layer script: ${scriptName}`);
  }
}

function main() {
  verifyFilesExist();
  verifyScaffoldCli();
  verifyLintability();
  verifyReadmeAndPackage();
  console.log('AICOS studio review-layer verification passed.');
}

main();
