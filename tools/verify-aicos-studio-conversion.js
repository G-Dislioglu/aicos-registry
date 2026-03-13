#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { ROOT_DIR, normalizeArtifact, convertArtifact, readJson } = require('./studio-schema-lib');

const REQUIRED_FILES = [
  path.join(ROOT_DIR, 'AICOS_STUDIO_NORMALIZATION_RULES.md'),
  path.join(ROOT_DIR, 'AICOS_STUDIO_CONVERSION_MATRIX.md'),
  path.join(ROOT_DIR, 'tools', 'studio-normalize.js'),
  path.join(ROOT_DIR, 'tools', 'studio-convert.js'),
  path.join(ROOT_DIR, 'tools', 'verify-aicos-studio-conversion.js')
];

function runNodeScript(scriptPath, args) {
  return execFileSync(process.execPath, [scriptPath, ...args], {
    cwd: ROOT_DIR,
    encoding: 'utf-8'
  });
}

function verifyFilesExist() {
  for (const filePath of REQUIRED_FILES) {
    assert(fs.existsSync(filePath), `Missing studio conversion file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyDocs() {
  const normalizationRules = fs.readFileSync(path.join(ROOT_DIR, 'AICOS_STUDIO_NORMALIZATION_RULES.md'), 'utf-8');
  for (const expected of [
    '## Supported normalization targets',
    '## What normalization may do',
    '## What normalization may not do',
    '## Forbidden input and output fields',
    '## Promotion and boundary discipline'
  ]) {
    assert(normalizationRules.includes(expected), `Expected normalization rules text missing: ${expected}`);
  }

  const conversionMatrix = fs.readFileSync(path.join(ROOT_DIR, 'AICOS_STUDIO_CONVERSION_MATRIX.md'), 'utf-8');
  for (const expected of [
    '## Allowed source and target logic',
    '### `studio_intake_packet`',
    '### Normalize-only targets',
    '## Forbidden targets',
    '## Gated conversion expectations',
    '## What conversion may not do'
  ]) {
    assert(conversionMatrix.includes(expected), `Expected conversion matrix text missing: ${expected}`);
  }
}

function verifyNormalizeCli() {
  const input = path.join('examples', 'studio', 'valid', 'proposal-artifact-normalize-source.valid.json');
  const stdout = runNodeScript(path.join('tools', 'studio-normalize.js'), [input]);
  const report = JSON.parse(stdout);
  const expected = normalizeArtifact(null, readJson(path.join(ROOT_DIR, input)));
  assert(report.ok === true, 'Expected normalize CLI success report');
  assert.deepStrictEqual(report.normalized, expected, 'Normalize CLI output drifted');
  assert(report.no_forwarding === true, 'Normalize CLI must remain non-forwarding');
  assert(report.no_runtime_write === true, 'Normalize CLI must remain non-runtime');
  assert(report.no_truth_mutation === true, 'Normalize CLI must remain non-mutating');
}

function verifyConvertCli() {
  const input = path.join('examples', 'studio', 'valid', 'idea-origin-packet.valid.json');
  const stdout = runNodeScript(path.join('tools', 'studio-convert.js'), [input, '--to', 'proposal-artifact']);
  const report = JSON.parse(stdout);
  const expected = convertArtifact(readJson(path.join(ROOT_DIR, input)), 'proposal-artifact');
  assert(report.ok === true, 'Expected convert CLI success report');
  assert.deepStrictEqual(report.converted, expected, 'Convert CLI output drifted');
  assert(report.no_forwarding === true, 'Convert CLI must remain non-forwarding');
  assert(report.no_runtime_write === true, 'Convert CLI must remain non-runtime');
  assert(report.no_truth_mutation === true, 'Convert CLI must remain non-mutating');
}

function verifyValidExamples() {
  const validNormalization = [
    path.join('examples', 'studio', 'valid', 'proposal-artifact-normalize-source.valid.json'),
    path.join('examples', 'studio', 'valid', 'bundle-normalize-source.valid.json')
  ];
  for (const file of validNormalization) {
    const output = runNodeScript(path.join('tools', 'studio-normalize.js'), [file]);
    const report = JSON.parse(output);
    assert(report.ok === true, `Expected normalization success for ${file}`);
    const lintReport = JSON.parse(runNodeScript(path.join('tools', 'studio-lint.js'), [file, '--json']));
    assert(lintReport.schema_error_count === 0, `Expected schema-clean valid source example: ${file}`);
  }

  const validConversions = [
    {
      file: path.join('examples', 'studio', 'valid', 'idea-origin-packet.valid.json'),
      to: 'proposal-artifact'
    },
    {
      file: path.join('examples', 'studio', 'valid', 'card-review-packet.valid.json'),
      to: 'card-review-target-artifact'
    },
    {
      file: path.join('examples', 'studio', 'valid', 'idea-origin-packet.valid.json'),
      to: 'reference-artifact'
    },
    {
      file: path.join('examples', 'studio', 'valid', 'card-review-packet.valid.json'),
      to: 'handoff-artifact'
    }
  ];
  for (const entry of validConversions) {
    const output = runNodeScript(path.join('tools', 'studio-convert.js'), [entry.file, '--to', entry.to]);
    const report = JSON.parse(output);
    assert(report.ok === true, `Expected conversion success for ${entry.file} -> ${entry.to}`);
    const lintInputPath = path.join(ROOT_DIR, entry.file);
    const converted = convertArtifact(readJson(lintInputPath), entry.to);
    const tmpPath = path.join(ROOT_DIR, '.tmp', 'studio-conversion-check.json');
    fs.mkdirSync(path.dirname(tmpPath), { recursive: true });
    fs.writeFileSync(tmpPath, `${JSON.stringify(converted, null, 2)}\n`);
    const lintReport = JSON.parse(runNodeScript(path.join('tools', 'studio-lint.js'), [tmpPath, '--json']));
    assert(lintReport.schema_error_count === 0, `Expected converted output to be schema-clean for ${entry.file} -> ${entry.to}`);
    assert(lintReport.boundary_lint_count === 0, `Expected converted output to be boundary-clean for ${entry.file} -> ${entry.to}`);
  }
}

function verifyInvalidExamples() {
  const normalizeFailures = [
    {
      file: path.join('examples', 'studio', 'invalid', 'proposal-artifact-illegal-promotion.invalid.json'),
      code: 'illegal_promotion_state_carryover'
    },
    {
      file: path.join('examples', 'studio', 'invalid', 'bundle-normalize-truth-field.invalid.json'),
      code: 'forbidden_normalization_field'
    }
  ];

  for (const entry of normalizeFailures) {
    let output = '';
    let failed = false;
    try {
      output = runNodeScript(path.join('tools', 'studio-normalize.js'), [entry.file]);
    } catch (error) {
      failed = true;
      output = error.stderr || error.stdout || '';
    }
    assert(failed, `Expected normalization failure for ${entry.file}`);
    const report = JSON.parse(output);
    assert(report.error.code === entry.code, `Expected normalize error code ${entry.code} for ${entry.file}`);
  }

  const conversionFailures = [
    {
      file: path.join('examples', 'studio', 'invalid', 'convert-forbidden-runtime-target.invalid.json'),
      to: 'runtime-review-object',
      code: 'conversion_forbidden_target'
    },
    {
      file: path.join('examples', 'studio', 'invalid', 'convert-forbidden-registry-target.invalid.json'),
      to: 'registry-truth',
      code: 'conversion_forbidden_target'
    },
    {
      file: path.join('examples', 'studio', 'invalid', 'intake-missing-summary.invalid.json'),
      to: 'proposal-artifact',
      code: 'missing_required_source_field'
    },
    {
      file: path.join('examples', 'studio', 'invalid', 'intake-no-human-target.invalid.json'),
      to: 'handoff-artifact',
      code: 'conversion_gate_failed'
    }
  ];

  for (const entry of conversionFailures) {
    let output = '';
    let failed = false;
    try {
      output = runNodeScript(path.join('tools', 'studio-convert.js'), [entry.file, '--to', entry.to]);
    } catch (error) {
      failed = true;
      output = error.stderr || error.stdout || '';
    }
    assert(failed, `Expected conversion failure for ${entry.file} -> ${entry.to}`);
    const report = JSON.parse(output);
    assert(report.error.code === entry.code, `Expected convert error code ${entry.code} for ${entry.file} -> ${entry.to}`);
  }
}

function verifyReadmeAndPackage() {
  const readme = fs.readFileSync(path.join(ROOT_DIR, 'README.md'), 'utf-8');
  for (const expected of [
    'AICOS_STUDIO_NORMALIZATION_RULES.md',
    'AICOS_STUDIO_CONVERSION_MATRIX.md',
    'tools/studio-normalize.js',
    'tools/studio-convert.js',
    'Local prep tools only',
    'npm run normalize:studio',
    'npm run convert:studio',
    'npm run verify:studio-conversion'
  ]) {
    assert(readme.includes(expected), `Expected studio conversion README text missing: ${expected}`);
  }

  const packageJson = readJson(path.join(ROOT_DIR, 'package.json'));
  for (const scriptName of ['normalize:studio', 'convert:studio', 'verify:studio-conversion', 'verify:studio']) {
    assert(packageJson.scripts && packageJson.scripts[scriptName], `Missing studio conversion script: ${scriptName}`);
  }
}

function main() {
  verifyFilesExist();
  verifyDocs();
  verifyNormalizeCli();
  verifyConvertCli();
  verifyValidExamples();
  verifyInvalidExamples();
  verifyReadmeAndPackage();
  console.log('AICOS studio normalization and conversion verification passed.');
}

main();
