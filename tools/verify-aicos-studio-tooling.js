#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { ROOT_DIR, buildScaffoldArtifact, readJson } = require('./studio-schema-lib');

const REQUIRED_FILES = [
  path.join(ROOT_DIR, 'tools', 'studio-schema-lib.js'),
  path.join(ROOT_DIR, 'tools', 'studio-scaffold.js'),
  path.join(ROOT_DIR, 'tools', 'studio-lint.js'),
  path.join(ROOT_DIR, 'tools', 'verify-aicos-studio-tooling.js'),
  path.join(ROOT_DIR, 'examples', 'studio', 'scaffolded', 'studio-intake-packet.scaffolded.json'),
  path.join(ROOT_DIR, 'examples', 'studio', 'scaffolded', 'proposal-artifact.scaffolded.json')
];

function verifyFilesExist() {
  for (const filePath of REQUIRED_FILES) {
    assert(fs.existsSync(filePath), `Missing studio tooling file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function runNodeScript(scriptPath, args) {
  return execFileSync(process.execPath, [scriptPath, ...args], {
    cwd: ROOT_DIR,
    encoding: 'utf-8'
  });
}

function verifyScaffoldExamples() {
  const checks = [
    {
      kind: 'studio-intake-packet',
      file: path.join(ROOT_DIR, 'examples', 'studio', 'scaffolded', 'studio-intake-packet.scaffolded.json')
    },
    {
      kind: 'proposal-artifact',
      file: path.join(ROOT_DIR, 'examples', 'studio', 'scaffolded', 'proposal-artifact.scaffolded.json')
    }
  ];

  for (const check of checks) {
    const stdout = runNodeScript(path.join('tools', 'studio-scaffold.js'), [check.kind]);
    const scaffolded = JSON.parse(stdout);
    const expected = buildScaffoldArtifact(check.kind);
    assert.deepStrictEqual(scaffolded, expected, `Scaffold CLI output drifted for ${check.kind}`);
    const committed = readJson(check.file);
    assert.deepStrictEqual(committed, expected, `Committed scaffold example drifted for ${check.kind}`);
  }
}

function verifyLintCli() {
  const singleFileOutput = runNodeScript(path.join('tools', 'studio-lint.js'), [path.join('examples', 'studio', 'scaffolded', 'studio-intake-packet.scaffolded.json'), '--json']);
  const singleFileReport = JSON.parse(singleFileOutput);
  assert(singleFileReport.checked_files === 1, 'Expected single-file studio lint to check exactly one file');
  assert(singleFileReport.schema_error_count === 0, 'Expected scaffolded single-file lint to have zero schema errors');
  assert(singleFileReport.boundary_lint_count === 0, 'Expected scaffolded single-file lint to have zero boundary lints');

  const directoryOutput = runNodeScript(path.join('tools', 'studio-lint.js'), [path.join('examples', 'studio', 'scaffolded'), '--json']);
  const directoryReport = JSON.parse(directoryOutput);
  assert(directoryReport.checked_files >= 2, 'Expected directory studio lint to check scaffolded examples');
  assert(directoryReport.schema_error_count === 0, 'Expected scaffolded directory lint to have zero schema errors');
  assert(directoryReport.boundary_lint_count === 0, 'Expected scaffolded directory lint to have zero boundary lints');
}

function verifyReadmeAndPackage() {
  const readme = fs.readFileSync(path.join(ROOT_DIR, 'README.md'), 'utf-8');
  for (const expected of [
    'tools/studio-scaffold.js',
    'tools/studio-lint.js',
    'Local prep tools only',
    'npm run scaffold:studio',
    'npm run lint:studio'
  ]) {
    assert(readme.includes(expected), `Expected studio tooling README text missing: ${expected}`);
  }

  const packageJson = readJson(path.join(ROOT_DIR, 'package.json'));
  for (const scriptName of ['scaffold:studio', 'lint:studio', 'verify:studio-tooling', 'verify:studio']) {
    assert(packageJson.scripts && packageJson.scripts[scriptName], `Missing studio tooling script: ${scriptName}`);
  }
}

function main() {
  verifyFilesExist();
  verifyScaffoldExamples();
  verifyLintCli();
  verifyReadmeAndPackage();
  console.log('AICOS studio tooling verification passed.');
}

main();
