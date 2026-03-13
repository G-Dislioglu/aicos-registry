#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  ROOT_DIR,
  normalizeArtifact,
  convertArtifact,
  buildBundleManifestFromArtifacts,
  lintArtifact,
  readJson
} = require('./studio-schema-lib');

const SCENARIO_DIR = path.join(ROOT_DIR, 'examples', 'studio', 'scenarios');
const REQUIRED_FILES = [
  path.join(ROOT_DIR, 'AICOS_STUDIO_PIPELINE_SCENARIOS.md'),
  path.join(ROOT_DIR, 'tools', 'verify-aicos-studio-pipeline.js'),
  SCENARIO_DIR,
  path.join(SCENARIO_DIR, 'idea-to-proposal', 'scenario.json'),
  path.join(SCENARIO_DIR, 'idea-to-handoff', 'scenario.json'),
  path.join(SCENARIO_DIR, 'contradiction-to-review', 'scenario.json'),
  path.join(SCENARIO_DIR, 'review-to-bundle', 'scenario.json'),
  path.join(SCENARIO_DIR, 'invalid-truth-path', 'scenario.json'),
  path.join(SCENARIO_DIR, 'invalid-runtime-path', 'scenario.json'),
  path.join(SCENARIO_DIR, 'invalid-trace-drift', 'scenario.json'),
  path.join(SCENARIO_DIR, 'invalid-gated-conversion', 'scenario.json')
];

function verifyFilesExist() {
  for (const filePath of REQUIRED_FILES) {
    assert(fs.existsSync(filePath), `Missing studio pipeline file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyDocs() {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'AICOS_STUDIO_PIPELINE_SCENARIOS.md'), 'utf-8');
  for (const expected of [
    '## Scenario 1 — Idea to proposal flow',
    '## Scenario 2 — Idea to handoff flow',
    '## Scenario 3 — Contradiction to review flow',
    '## Scenario 4 — Review to bundle flow',
    '## Invalid scenario classes',
    '## Corpus location'
  ]) {
    assert(content.includes(expected), `Expected studio pipeline scenarios text missing: ${expected}`);
  }
}

function getScenarioDirectories() {
  return fs.readdirSync(SCENARIO_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(SCENARIO_DIR, entry.name))
    .filter((directory) => fs.existsSync(path.join(directory, 'scenario.json')))
    .sort((left, right) => left.localeCompare(right));
}

function readScenario(directory) {
  const scenarioPath = path.join(directory, 'scenario.json');
  const scenario = readJson(scenarioPath);
  scenario.__directory = directory;
  scenario.__relativeDirectory = path.relative(ROOT_DIR, directory).split(path.sep).join('/');
  return scenario;
}

function resolveScenarioFile(scenario, relativeFile) {
  return path.join(scenario.__directory, relativeFile);
}

function lintFile(filePath) {
  const report = lintArtifact(readJson(filePath));
  return {
    schemaErrors: report.schemaErrors,
    boundaryLints: report.boundaryLints
  };
}

function getLintCodes(lintResult) {
  return lintResult.boundaryLints.map((entry) => entry.code);
}

function verifyScenarioMetadata(scenario) {
  for (const key of ['scenario_id', 'title', 'valid', 'start_artifact', 'used_gates', 'allowed_conversions', 'review_artifacts', 'gate_artifacts', 'forbidden_alternative_paths', 'checks']) {
    assert(Object.prototype.hasOwnProperty.call(scenario, key), `Scenario missing required key ${key}: ${scenario.__relativeDirectory}`);
  }
  assert(Array.isArray(scenario.used_gates), `used_gates must be an array: ${scenario.scenario_id}`);
  assert(Array.isArray(scenario.allowed_conversions), `allowed_conversions must be an array: ${scenario.scenario_id}`);
  assert(Array.isArray(scenario.review_artifacts), `review_artifacts must be an array: ${scenario.scenario_id}`);
  assert(Array.isArray(scenario.gate_artifacts), `gate_artifacts must be an array: ${scenario.scenario_id}`);
  assert(Array.isArray(scenario.forbidden_alternative_paths), `forbidden_alternative_paths must be an array: ${scenario.scenario_id}`);
  assert(Array.isArray(scenario.checks) && scenario.checks.length > 0, `checks must be a non-empty array: ${scenario.scenario_id}`);
}

function verifyScenarioArtifactPresence(scenario) {
  assert(fs.existsSync(resolveScenarioFile(scenario, scenario.start_artifact)), `Missing scenario start artifact: ${scenario.scenario_id}/${scenario.start_artifact}`);
  for (const file of [...scenario.review_artifacts, ...scenario.gate_artifacts]) {
    assert(fs.existsSync(resolveScenarioFile(scenario, file)), `Missing scenario artifact file: ${scenario.scenario_id}/${file}`);
  }
  if (scenario.bundle_manifest) {
    assert(fs.existsSync(resolveScenarioFile(scenario, scenario.bundle_manifest)), `Missing scenario bundle manifest: ${scenario.scenario_id}/${scenario.bundle_manifest}`);
  }
}

function verifyAllowedConversionsShape(scenario) {
  for (const entry of scenario.allowed_conversions) {
    assert(entry && typeof entry === 'object', `allowed_conversions entry must be an object: ${scenario.scenario_id}`);
    assert(typeof entry.from === 'string' && entry.from.length > 0, `allowed_conversions.from required: ${scenario.scenario_id}`);
    assert(typeof entry.to === 'string' && entry.to.length > 0, `allowed_conversions.to required: ${scenario.scenario_id}`);
  }
}

function executeCheck(scenario, check) {
  if (check.type === 'lint_clean') {
    const lintResult = lintFile(resolveScenarioFile(scenario, check.target));
    assert(lintResult.schemaErrors.length === 0, `Expected schema-clean artifact for ${scenario.scenario_id}/${check.target}`);
    assert(lintResult.boundaryLints.length === 0, `Expected boundary-clean artifact for ${scenario.scenario_id}/${check.target}`);
    return;
  }

  if (check.type === 'lint_error') {
    const lintResult = lintFile(resolveScenarioFile(scenario, check.target));
    const codes = getLintCodes(lintResult);
    assert(lintResult.schemaErrors.length > 0 || lintResult.boundaryLints.length > 0, `Expected lint failure for ${scenario.scenario_id}/${check.target}`);
    assert(codes.includes(check.code), `Expected lint code ${check.code} for ${scenario.scenario_id}/${check.target}`);
    return;
  }

  if (check.type === 'normalize') {
    const input = readJson(resolveScenarioFile(scenario, check.input));
    const expected = readJson(resolveScenarioFile(scenario, check.output));
    const actual = normalizeArtifact(check.kind || null, input);
    assert.deepStrictEqual(actual, expected, `Normalization drifted for ${scenario.scenario_id}/${check.input}`);
    return;
  }

  if (check.type === 'normalize_error') {
    const input = readJson(resolveScenarioFile(scenario, check.input));
    let error = null;
    try {
      normalizeArtifact(check.kind || null, input);
    } catch (caught) {
      error = caught;
    }
    assert(error, `Expected normalization failure for ${scenario.scenario_id}/${check.input}`);
    assert(error.code === check.code, `Expected normalization error ${check.code} for ${scenario.scenario_id}/${check.input}`);
    return;
  }

  if (check.type === 'convert') {
    const input = readJson(resolveScenarioFile(scenario, check.input));
    const expected = readJson(resolveScenarioFile(scenario, check.output));
    const actual = convertArtifact(input, check.to);
    assert.deepStrictEqual(actual, expected, `Conversion drifted for ${scenario.scenario_id}/${check.input} -> ${check.to}`);
    const allowed = scenario.allowed_conversions.some((entry) => entry.from === input.artifact_type && entry.to === check.to);
    assert(allowed, `Scenario metadata missing allowed conversion ${input.artifact_type} -> ${check.to} in ${scenario.scenario_id}`);
    return;
  }

  if (check.type === 'convert_error') {
    const input = readJson(resolveScenarioFile(scenario, check.input));
    let error = null;
    try {
      convertArtifact(input, check.to);
    } catch (caught) {
      error = caught;
    }
    assert(error, `Expected conversion failure for ${scenario.scenario_id}/${check.input} -> ${check.to}`);
    assert(error.code === check.code, `Expected conversion error ${check.code} for ${scenario.scenario_id}/${check.input} -> ${check.to}`);
    return;
  }

  if (check.type === 'bundle_build') {
    const inputPaths = check.inputs.map((entry) => resolveScenarioFile(scenario, entry));
    const expected = readJson(resolveScenarioFile(scenario, check.output));
    const actual = buildBundleManifestFromArtifacts(inputPaths, check.options || {});
    assert.deepStrictEqual(actual.manifest, expected, `Bundle build drifted for ${scenario.scenario_id}/${check.output}`);
    assert(actual.consistencyIssues.length === 0, `Expected zero bundle consistency issues for ${scenario.scenario_id}/${check.output}`);
    return;
  }

  throw new Error(`Unknown scenario check type: ${check.type}`);
}

function verifyValidScenario(scenario) {
  const artifactFiles = fs.readdirSync(scenario.__directory)
    .filter((entry) => entry.endsWith('.json') && entry !== 'scenario.json');
  assert(artifactFiles.length >= 2, `Expected multiple artifact files in valid scenario ${scenario.scenario_id}`);
  for (const check of scenario.checks) {
    executeCheck(scenario, check);
  }
}

function verifyInvalidScenario(scenario) {
  for (const check of scenario.checks) {
    executeCheck(scenario, check);
  }
}

function verifyScenarioSet() {
  const directories = getScenarioDirectories();
  const scenarios = directories.map(readScenario);
  const validScenarios = scenarios.filter((entry) => entry.valid === true);
  const invalidScenarios = scenarios.filter((entry) => entry.valid === false);

  assert(validScenarios.length >= 4, 'Expected at least 4 valid pipeline scenarios');
  assert(invalidScenarios.length >= 3, 'Expected at least 3 invalid pipeline scenarios');

  for (const scenario of scenarios) {
    verifyScenarioMetadata(scenario);
    verifyScenarioArtifactPresence(scenario);
    verifyAllowedConversionsShape(scenario);
    if (scenario.valid) {
      verifyValidScenario(scenario);
    } else {
      verifyInvalidScenario(scenario);
    }
  }
}

function verifyReadmeAndPackage() {
  const readme = fs.readFileSync(path.join(ROOT_DIR, 'README.md'), 'utf-8');
  for (const expected of [
    'AICOS_STUDIO_PIPELINE_SCENARIOS.md',
    'examples/studio/scenarios/',
    'tools/verify-aicos-studio-pipeline.js',
    'local reference pipeline only',
    'npm run verify:studio-pipeline'
  ]) {
    assert(readme.includes(expected), `Expected studio pipeline README text missing: ${expected}`);
  }

  const packageJson = readJson(path.join(ROOT_DIR, 'package.json'));
  for (const scriptName of ['verify:studio-pipeline', 'verify:studio']) {
    assert(packageJson.scripts && packageJson.scripts[scriptName], `Missing studio pipeline script: ${scriptName}`);
  }
}

function main() {
  verifyFilesExist();
  verifyDocs();
  verifyScenarioSet();
  verifyReadmeAndPackage();
  console.log('AICOS studio pipeline verification passed.');
}

main();
