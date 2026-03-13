#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const SCHEMA_DIR = path.join(ROOT_DIR, 'schemas', 'studio');
const DELTA_DIR = path.join(ROOT_DIR, 'examples', 'studio', 'frame-delta');

const REQUIRED_FILES = [
  path.join(ROOT_DIR, 'AICOS_FRAME_PREFLIGHT_SPEC.md'),
  path.join(ROOT_DIR, 'AICOS_ERROR_LEDGER_SPEC.md'),
  path.join(ROOT_DIR, 'AICOS_PERSPECTIVE_PASS_CONTRACTS.md'),
  path.join(ROOT_DIR, 'AICOS_FRAME_CHALLENGE_RESULT_SPEC.md'),
  path.join(ROOT_DIR, 'AICOS_FRAME_DELTA_EVALUATION.md'),
  path.join(SCHEMA_DIR, 'frame-preflight.schema.json'),
  path.join(SCHEMA_DIR, 'error-ledger-entry.schema.json'),
  path.join(SCHEMA_DIR, 'perspective-pass.schema.json'),
  path.join(SCHEMA_DIR, 'frame-challenge-result.schema.json'),
  path.join(SCHEMA_DIR, 'frame-delta-evaluation.schema.json'),
  path.join(ROOT_DIR, 'tools', 'frame-delta-eval.js'),
  path.join(ROOT_DIR, 'tools', 'verify-aicos-frame-delta.js'),
  path.join(DELTA_DIR, 'valid', 'ambiguous-governance-ask.preflight.valid.json'),
  path.join(DELTA_DIR, 'valid', 'over-clean-product-brief.preflight.valid.json'),
  path.join(DELTA_DIR, 'valid', 'false-consensus-repair.preflight.valid.json'),
  path.join(DELTA_DIR, 'scenarios', 'ambiguous-governance-ask-shadow.scenario.json'),
  path.join(DELTA_DIR, 'scenarios', 'review-to-bundle-shadow.scenario.json'),
  path.join(DELTA_DIR, 'scenarios', 'contradiction-to-review-shadow.scenario.json')
];

const FORBIDDEN_PROPERTY_NAMES = [
  'registry_write',
  'runtime_apply',
  'approval_authority',
  'truth_commit'
];

const REQUIRED_AXIS_NAMES = [
  'misframing_detection',
  'constraint_fidelity',
  'premature_closure_resistance',
  'signal_gap_awareness',
  'actionability_after_challenge'
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function runNodeScript(scriptPath, args) {
  return execFileSync(process.execPath, [scriptPath, ...args], {
    cwd: ROOT_DIR,
    encoding: 'utf-8'
  });
}

function formatPath(pathParts) {
  return pathParts.length === 0 ? '<root>' : pathParts.join('.');
}

function validateSchema(schema, value, pathParts = []) {
  const errors = [];

  if (schema.const !== undefined && value !== schema.const) {
    errors.push(`${formatPath(pathParts)} must equal ${JSON.stringify(schema.const)}`);
    return errors;
  }

  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${formatPath(pathParts)} must be one of ${schema.enum.join(', ')}`);
    return errors;
  }

  if (schema.type === 'object') {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      errors.push(`${formatPath(pathParts)} must be an object`);
      return errors;
    }

    const properties = schema.properties || {};
    const required = schema.required || [];

    for (const key of required) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) {
        errors.push(`${formatPath([...pathParts, key])} is required`);
      }
    }

    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!Object.prototype.hasOwnProperty.call(properties, key)) {
          errors.push(`${formatPath([...pathParts, key])} is not allowed`);
        }
      }
    }

    for (const [key, propertySchema] of Object.entries(properties)) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        errors.push(...validateSchema(propertySchema, value[key], [...pathParts, key]));
      }
    }

    return errors;
  }

  if (schema.type === 'array') {
    if (!Array.isArray(value)) {
      errors.push(`${formatPath(pathParts)} must be an array`);
      return errors;
    }
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${formatPath(pathParts)} must contain at least ${schema.minItems} items`);
    }
    if (schema.uniqueItems) {
      const seen = new Set();
      for (const item of value) {
        const serialized = JSON.stringify(item);
        if (seen.has(serialized)) {
          errors.push(`${formatPath(pathParts)} must not contain duplicate items`);
          break;
        }
        seen.add(serialized);
      }
    }
    if (schema.items) {
      value.forEach((item, index) => {
        errors.push(...validateSchema(schema.items, item, [...pathParts, String(index)]));
      });
    }
    return errors;
  }

  if (schema.type === 'string') {
    if (typeof value !== 'string') {
      errors.push(`${formatPath(pathParts)} must be a string`);
      return errors;
    }
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${formatPath(pathParts)} must be at least ${schema.minLength} characters long`);
    }
    return errors;
  }

  return errors;
}

function verifyFilesExist() {
  for (const filePath of REQUIRED_FILES) {
    assert(fs.existsSync(filePath), `Missing frame delta file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyDocs() {
  const docs = [
    {
      file: 'AICOS_FRAME_PREFLIGHT_SPEC.md',
      expected: ['## Boundary', '## Output contract', 'shadow-only', 'frame_risk_score is forbidden']
    },
    {
      file: 'AICOS_ERROR_LEDGER_SPEC.md',
      expected: ['## Why plausible', '## Forbidden content', 'non-authoritative']
    },
    {
      file: 'AICOS_PERSPECTIVE_PASS_CONTRACTS.md',
      expected: ['### `constraint_skeptic`', '### `counterframe_probe`', '### `signal_gap_probe`', 'persona name plus free notes is invalid']
    },
    {
      file: 'AICOS_FRAME_CHALLENGE_RESULT_SPEC.md',
      expected: ['## Challenge outcomes', '`confirmed` means', '`blocked` means']
    },
    {
      file: 'AICOS_FRAME_DELTA_EVALUATION.md',
      expected: ['## Comparison axes', 'Delta is a shadow comparison track', 'refusing premature integration']
    }
  ];

  for (const entry of docs) {
    const content = fs.readFileSync(path.join(ROOT_DIR, entry.file), 'utf-8');
    for (const expected of entry.expected) {
      assert(content.includes(expected), `Expected frame delta doc text missing in ${entry.file}: ${expected}`);
    }
    assert(!content.toLowerCase().includes('runtime apply'), `Frame delta doc must not suggest runtime apply semantics: ${entry.file}`);
  }
}

function verifySchemas() {
  const schemas = [
    'frame-preflight.schema.json',
    'error-ledger-entry.schema.json',
    'perspective-pass.schema.json',
    'frame-challenge-result.schema.json',
    'frame-delta-evaluation.schema.json'
  ];

  for (const name of schemas) {
    const schema = readJson(path.join(SCHEMA_DIR, name));
    assert(schema.type === 'object', `Schema must declare object type: ${name}`);
    assert(schema.additionalProperties === false, `Schema must close object shape: ${name}`);
    const properties = schema.properties || {};
    for (const forbiddenName of FORBIDDEN_PROPERTY_NAMES) {
      assert(!Object.prototype.hasOwnProperty.call(properties, forbiddenName), `Schema exposes forbidden property ${forbiddenName}: ${name}`);
    }
    const serialized = JSON.stringify(schema);
    assert(!serialized.includes('frame_risk_score'), `Schema must not authorize frame_risk_score: ${name}`);
  }
}

function verifyExampleCounts() {
  const validFiles = fs.readdirSync(path.join(DELTA_DIR, 'valid'));
  const invalidFiles = fs.readdirSync(path.join(DELTA_DIR, 'invalid'));
  const scenarioFiles = fs.readdirSync(path.join(DELTA_DIR, 'scenarios'));

  assert(validFiles.filter((name) => name.endsWith('.preflight.valid.json')).length >= 3, 'Expected at least 3 valid frame preflights');
  assert(invalidFiles.filter((name) => name.startsWith('frame-preflight-')).length >= 3, 'Expected at least 3 invalid frame preflights');
  assert(validFiles.filter((name) => name.endsWith('.error-ledger.valid.json')).length >= 3, 'Expected at least 3 valid error ledger entries');
  assert(invalidFiles.filter((name) => name.startsWith('error-ledger-')).length >= 2, 'Expected at least 2 invalid error ledger entries');
  assert(validFiles.filter((name) => name.endsWith('.pass.valid.json')).length >= 3, 'Expected 3 perspective pass contracts');
  assert(validFiles.filter((name) => name.endsWith('.challenge-result.valid.json')).length >= 3, 'Expected 3 frame challenge results');
  assert(validFiles.filter((name) => name.endsWith('.frame-delta-evaluation.valid.json')).length >= 3, 'Expected 3 frame delta evaluation outputs');
  assert(scenarioFiles.filter((name) => name.endsWith('.scenario.json')).length >= 3, 'Expected 3 frame delta scenarios');
}

function verifySchemaExamples() {
  const checks = [
    {
      schema: 'frame-preflight.schema.json',
      valid: [
        'ambiguous-governance-ask.preflight.valid.json',
        'over-clean-product-brief.preflight.valid.json',
        'false-consensus-repair.preflight.valid.json'
      ],
      invalid: [
        'frame-preflight-score.invalid.json',
        'frame-preflight-authority.invalid.json',
        'frame-preflight-missing-goal.invalid.json'
      ]
    },
    {
      schema: 'error-ledger-entry.schema.json',
      valid: [
        'ambiguous-governance-ask.error-ledger.valid.json',
        'over-clean-product-brief.error-ledger.valid.json',
        'false-consensus-repair.error-ledger.valid.json'
      ],
      invalid: [
        'error-ledger-missing-why-plausible.invalid.json',
        'error-ledger-authority.invalid.json'
      ]
    },
    {
      schema: 'perspective-pass.schema.json',
      valid: [
        'constraint-skeptic.pass.valid.json',
        'counterframe-probe.pass.valid.json',
        'signal-gap-probe.pass.valid.json'
      ],
      invalid: [
        'persona-only.pass.invalid.json'
      ]
    },
    {
      schema: 'frame-challenge-result.schema.json',
      valid: [
        'ambiguous-governance-ask.challenge-result.valid.json',
        'over-clean-product-brief.challenge-result.valid.json',
        'false-consensus-repair.challenge-result.valid.json'
      ],
      invalid: [
        'frame-challenge-authority.invalid.json'
      ]
    },
    {
      schema: 'frame-delta-evaluation.schema.json',
      valid: [
        'ambiguous-governance-ask.frame-delta-evaluation.valid.json',
        'review-to-bundle.frame-delta-evaluation.valid.json',
        'contradiction-to-review.frame-delta-evaluation.valid.json'
      ],
      invalid: []
    }
  ];

  for (const check of checks) {
    const schema = readJson(path.join(SCHEMA_DIR, check.schema));
    for (const name of check.valid) {
      const example = readJson(path.join(DELTA_DIR, 'valid', name));
      const errors = validateSchema(schema, example);
      assert(errors.length === 0, `Expected valid frame delta example to pass: ${name}\n- ${errors.join('\n- ')}`);
    }
    for (const name of check.invalid) {
      const example = readJson(path.join(DELTA_DIR, 'invalid', name));
      const errors = validateSchema(schema, example);
      assert(errors.length > 0, `Expected invalid frame delta example to fail: ${name}`);
    }
  }
}

function verifyScenarioShape() {
  const scenarioDir = path.join(DELTA_DIR, 'scenarios');
  const scenarioNames = fs.readdirSync(scenarioDir).filter((name) => name.endsWith('.scenario.json'));
  for (const name of scenarioNames) {
    const scenario = readJson(path.join(scenarioDir, name));
    for (const key of ['scenario_id', 'title', 'subject_ref', 'baseline_summary', 'delta_summary_tail', 'preflight_ref', 'challenge_result_ref', 'ledger_refs', 'pass_refs', 'comparison_axes', 'overall_result', 'integration_signal']) {
      assert(Object.prototype.hasOwnProperty.call(scenario, key), `Scenario missing required key ${key}: ${name}`);
    }
    assert(Array.isArray(scenario.comparison_axes) && scenario.comparison_axes.length === REQUIRED_AXIS_NAMES.length, `Scenario must define exactly ${REQUIRED_AXIS_NAMES.length} comparison axes: ${name}`);
    const axisNames = scenario.comparison_axes.map((entry) => entry.axis);
    for (const requiredAxis of REQUIRED_AXIS_NAMES) {
      assert(axisNames.includes(requiredAxis), `Scenario missing comparison axis ${requiredAxis}: ${name}`);
    }
  }
}

function verifyGuardrails() {
  const validDir = path.join(DELTA_DIR, 'valid');
  const validFiles = fs.readdirSync(validDir).filter((name) => name.endsWith('.json'));
  for (const name of validFiles) {
    const content = fs.readFileSync(path.join(validDir, name), 'utf-8');
    assert(!content.includes('frame_risk_score'), `Valid frame delta artifact must not contain frame_risk_score: ${name}`);
    assert(!content.includes('approval_authority'), `Valid frame delta artifact must not claim authority: ${name}`);
    assert(!content.includes('truth_commit'), `Valid frame delta artifact must not contain truth_commit: ${name}`);
  }

  const readme = fs.readFileSync(path.join(ROOT_DIR, 'README.md'), 'utf-8');
  assert(readme.includes('Parallel experimental tracks'), 'README must document the parallel experimental shadow track');
  assert(readme.includes('shadow-only'), 'README must describe frame delta as shadow-only');
  assert(readme.includes('not a replacement for the Studio baseline'), 'README must say frame delta is not a replacement for the Studio baseline');

  const packageJson = readJson(path.join(ROOT_DIR, 'package.json'));
  assert(packageJson.scripts && packageJson.scripts['eval:frame-delta'], 'Missing frame delta eval script');
  assert(packageJson.scripts && packageJson.scripts['verify:frame-delta'], 'Missing frame delta verifier script');
  assert(typeof packageJson.scripts['verify:studio'] === 'string' && !packageJson.scripts['verify:studio'].includes('frame-delta'), 'verify:studio must not silently include frame-delta');
}

function verifyEvalTool() {
  const checks = [
    {
      scenario: path.join('examples', 'studio', 'frame-delta', 'scenarios', 'ambiguous-governance-ask-shadow.scenario.json'),
      expected: path.join(DELTA_DIR, 'valid', 'ambiguous-governance-ask.frame-delta-evaluation.valid.json')
    },
    {
      scenario: path.join('examples', 'studio', 'frame-delta', 'scenarios', 'review-to-bundle-shadow.scenario.json'),
      expected: path.join(DELTA_DIR, 'valid', 'review-to-bundle.frame-delta-evaluation.valid.json')
    },
    {
      scenario: path.join('examples', 'studio', 'frame-delta', 'scenarios', 'contradiction-to-review-shadow.scenario.json'),
      expected: path.join(DELTA_DIR, 'valid', 'contradiction-to-review.frame-delta-evaluation.valid.json')
    }
  ];

  for (const check of checks) {
    const stdout = runNodeScript(path.join('tools', 'frame-delta-eval.js'), [check.scenario]);
    const actual = JSON.parse(stdout);
    const expected = readJson(check.expected);
    assert.deepStrictEqual(actual, expected, `Frame delta evaluation drifted for ${check.scenario}`);

    const markdown = runNodeScript(path.join('tools', 'frame-delta-eval.js'), [check.scenario, '--markdown']);
    assert(markdown.includes('# Frame Delta Evaluation Summary'), `Expected markdown heading for ${check.scenario}`);
    assert(markdown.includes('shadow-only'), `Expected boundary copy in markdown for ${check.scenario}`);
    assert(markdown.includes('not replace the Studio baseline'), `Expected baseline boundary copy in markdown for ${check.scenario}`);
  }
}

function main() {
  verifyFilesExist();
  verifyDocs();
  verifySchemas();
  verifyExampleCounts();
  verifySchemaExamples();
  verifyScenarioShape();
  verifyEvalTool();
  verifyGuardrails();
  console.log('AICOS frame delta verification passed.');
}

main();
