#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const SCHEMA_DIR = path.join(ROOT_DIR, 'schemas', 'studio');
const EXAMPLES_DIR = path.join(ROOT_DIR, 'examples', 'studio');
const NOTES_FILE = path.join(ROOT_DIR, 'AICOS_STUDIO_SCHEMA_NOTES.md');

const REQUIRED_SCHEMA_FILES = [
  'studio-intake-packet.schema.json',
  'proposal-artifact.schema.json',
  'handoff-artifact.schema.json',
  'reference-artifact.schema.json',
  'card-review-target-artifact.schema.json',
  'review-record.schema.json',
  'gate-report.schema.json',
  'studio-bundle-manifest.schema.json'
].map((name) => path.join(SCHEMA_DIR, name));

const VALID_EXAMPLES = [
  {
    file: path.join(EXAMPLES_DIR, 'valid', 'idea-origin-packet.valid.json'),
    schema: path.join(SCHEMA_DIR, 'studio-intake-packet.schema.json')
  },
  {
    file: path.join(EXAMPLES_DIR, 'valid', 'card-review-packet.valid.json'),
    schema: path.join(SCHEMA_DIR, 'studio-intake-packet.schema.json')
  },
  {
    file: path.join(EXAMPLES_DIR, 'valid', 'situation-analysis-packet.valid.json'),
    schema: path.join(SCHEMA_DIR, 'studio-intake-packet.schema.json')
  },
  {
    file: path.join(EXAMPLES_DIR, 'valid', 'contradiction-challenge-packet.valid.json'),
    schema: path.join(SCHEMA_DIR, 'studio-intake-packet.schema.json')
  },
  {
    file: path.join(EXAMPLES_DIR, 'valid', 'proposal-artifact.valid.json'),
    schema: path.join(SCHEMA_DIR, 'proposal-artifact.schema.json')
  },
  {
    file: path.join(EXAMPLES_DIR, 'valid', 'proposal-artifact-normalize-source.valid.json'),
    schema: path.join(SCHEMA_DIR, 'proposal-artifact.schema.json')
  },
  {
    file: path.join(EXAMPLES_DIR, 'valid', 'handoff-artifact.valid.json'),
    schema: path.join(SCHEMA_DIR, 'handoff-artifact.schema.json')
  },
  {
    file: path.join(EXAMPLES_DIR, 'valid', 'reference-artifact.valid.json'),
    schema: path.join(SCHEMA_DIR, 'reference-artifact.schema.json')
  },
  {
    file: path.join(EXAMPLES_DIR, 'valid', 'card-review-target-artifact.valid.json'),
    schema: path.join(SCHEMA_DIR, 'card-review-target-artifact.schema.json')
  },
  {
    file: path.join(EXAMPLES_DIR, 'valid', 'review-record-forward.valid.json'),
    schema: path.join(SCHEMA_DIR, 'review-record.schema.json')
  },
  {
    file: path.join(EXAMPLES_DIR, 'valid', 'review-record-hold.valid.json'),
    schema: path.join(SCHEMA_DIR, 'review-record.schema.json')
  },
  {
    file: path.join(EXAMPLES_DIR, 'valid', 'gate-report-pass.valid.json'),
    schema: path.join(SCHEMA_DIR, 'gate-report.schema.json')
  },
  {
    file: path.join(EXAMPLES_DIR, 'valid', 'gate-report-hard-stop.valid.json'),
    schema: path.join(SCHEMA_DIR, 'gate-report.schema.json')
  },
  {
    file: path.join(EXAMPLES_DIR, 'valid', 'studio-bundle-manifest-review.valid.json'),
    schema: path.join(SCHEMA_DIR, 'studio-bundle-manifest.schema.json')
  },
  {
    file: path.join(EXAMPLES_DIR, 'valid', 'studio-bundle-manifest-handoff.valid.json'),
    schema: path.join(SCHEMA_DIR, 'studio-bundle-manifest.schema.json')
  },
  {
    file: path.join(EXAMPLES_DIR, 'valid', 'bundle-normalize-source.valid.json'),
    schema: path.join(SCHEMA_DIR, 'studio-bundle-manifest.schema.json')
  },
  {
    file: path.join(EXAMPLES_DIR, 'valid', 'intake-convert-proposal-source.valid.json'),
    schema: path.join(SCHEMA_DIR, 'studio-intake-packet.schema.json')
  },
  {
    file: path.join(EXAMPLES_DIR, 'valid', 'intake-convert-handoff-source.valid.json'),
    schema: path.join(SCHEMA_DIR, 'studio-intake-packet.schema.json')
  }
];

const INVALID_EXAMPLES = [
  {
    file: path.join(EXAMPLES_DIR, 'invalid', 'missing-required-field.invalid.json'),
    schema: path.join(SCHEMA_DIR, 'studio-intake-packet.schema.json')
  },
  {
    file: path.join(EXAMPLES_DIR, 'invalid', 'forbidden-target.invalid.json'),
    schema: path.join(SCHEMA_DIR, 'studio-intake-packet.schema.json')
  },
  {
    file: path.join(EXAMPLES_DIR, 'invalid', 'truth-mutation-attempt.invalid.json'),
    schema: path.join(SCHEMA_DIR, 'proposal-artifact.schema.json')
  },
  {
    file: path.join(EXAMPLES_DIR, 'invalid', 'runtime-write-attempt.invalid.json'),
    schema: path.join(SCHEMA_DIR, 'handoff-artifact.schema.json')
  },
  {
    file: path.join(EXAMPLES_DIR, 'invalid', 'review-record-unknown-decision-code.invalid.json'),
    schema: path.join(SCHEMA_DIR, 'review-record.schema.json')
  },
  {
    file: path.join(EXAMPLES_DIR, 'invalid', 'gate-report-forbidden-outcome.invalid.json'),
    schema: path.join(SCHEMA_DIR, 'gate-report.schema.json')
  },
  {
    file: path.join(EXAMPLES_DIR, 'invalid', 'review-record-runtime-write-attempt.invalid.json'),
    schema: path.join(SCHEMA_DIR, 'review-record.schema.json')
  },
  {
    file: path.join(EXAMPLES_DIR, 'invalid', 'gate-report-truth-mutation-attempt.invalid.json'),
    schema: path.join(SCHEMA_DIR, 'gate-report.schema.json')
  },
  {
    file: path.join(EXAMPLES_DIR, 'invalid', 'studio-bundle-manifest-forbidden-member.invalid.json'),
    schema: path.join(SCHEMA_DIR, 'studio-bundle-manifest.schema.json')
  },
  {
    file: path.join(EXAMPLES_DIR, 'invalid', 'studio-bundle-manifest-missing-boundary.invalid.json'),
    schema: path.join(SCHEMA_DIR, 'studio-bundle-manifest.schema.json')
  },
  {
    file: path.join(EXAMPLES_DIR, 'invalid', 'proposal-artifact-illegal-promotion.invalid.json'),
    schema: path.join(SCHEMA_DIR, 'proposal-artifact.schema.json')
  },
  {
    file: path.join(EXAMPLES_DIR, 'invalid', 'bundle-normalize-truth-field.invalid.json'),
    schema: path.join(SCHEMA_DIR, 'studio-bundle-manifest.schema.json')
  },
  {
    file: path.join(EXAMPLES_DIR, 'invalid', 'intake-missing-summary.invalid.json'),
    schema: path.join(SCHEMA_DIR, 'studio-intake-packet.schema.json')
  }
];

const FORBIDDEN_PROPERTY_NAMES = [
  'runtime_review_object',
  'runtime_state',
  'truth_mutation_target',
  'card_write_target',
  'index_write_target',
  'alias_write_target'
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
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
  assert(fs.existsSync(NOTES_FILE), 'Missing studio schema notes file: AICOS_STUDIO_SCHEMA_NOTES.md');

  for (const filePath of [...REQUIRED_SCHEMA_FILES, ...VALID_EXAMPLES.map((entry) => entry.file), ...INVALID_EXAMPLES.map((entry) => entry.file)]) {
    assert(fs.existsSync(filePath), `Missing studio schema file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifySchemaNotes() {
  const content = fs.readFileSync(NOTES_FILE, 'utf-8');
  for (const expected of [
    '## What was formalized',
    '## What was deliberately not formalized',
    '## Schema limits',
    '## What would belong to S2 or an engine layer'
  ]) {
    assert(content.includes(expected), `Expected studio schema notes text missing: ${expected}`);
  }
}

function verifySchemas() {
  for (const filePath of REQUIRED_SCHEMA_FILES) {
    const schema = readJson(filePath);
    assert(schema.type === 'object', `Schema must declare object type: ${path.basename(filePath)}`);
    assert(schema.additionalProperties === false, `Schema must close object shape: ${path.basename(filePath)}`);

    const properties = schema.properties || {};
    for (const forbiddenName of FORBIDDEN_PROPERTY_NAMES) {
      assert(!Object.prototype.hasOwnProperty.call(properties, forbiddenName), `Schema exposes forbidden property ${forbiddenName}: ${path.basename(filePath)}`);
    }

    const serialized = JSON.stringify(schema);
    assert(!serialized.includes('future_mec_context_review'), `Schema must not authorize future_mec_context_review: ${path.basename(filePath)}`);
  }
}

function verifyValidExamples() {
  for (const entry of VALID_EXAMPLES) {
    const schema = readJson(entry.schema);
    const example = readJson(entry.file);
    const errors = validateSchema(schema, example);
    assert(errors.length === 0, `Expected valid example to pass: ${path.relative(ROOT_DIR, entry.file)}\n- ${errors.join('\n- ')}`);
  }
}

function verifyInvalidExamples() {
  for (const entry of INVALID_EXAMPLES) {
    const schema = readJson(entry.schema);
    const example = readJson(entry.file);
    const errors = validateSchema(schema, example);
    assert(errors.length > 0, `Expected invalid example to fail: ${path.relative(ROOT_DIR, entry.file)}`);
  }
}

function main() {
  verifyFilesExist();
  verifySchemaNotes();
  verifySchemas();
  verifyValidExamples();
  verifyInvalidExamples();
  console.log('AICOS studio schema verification passed.');
}

main();
