const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const SCHEMA_DIR = path.join(ROOT_DIR, 'schemas', 'studio');

const ARTIFACT_KINDS = {
  'studio-intake-packet': {
    artifactType: 'studio_intake_packet',
    schemaFile: 'studio-intake-packet.schema.json'
  },
  'proposal-artifact': {
    artifactType: 'proposal_artifact',
    schemaFile: 'proposal-artifact.schema.json'
  },
  'handoff-artifact': {
    artifactType: 'handoff_artifact',
    schemaFile: 'handoff-artifact.schema.json'
  },
  'reference-artifact': {
    artifactType: 'reference_artifact',
    schemaFile: 'reference-artifact.schema.json'
  },
  'card-review-target-artifact': {
    artifactType: 'card_review_target_artifact',
    schemaFile: 'card-review-target-artifact.schema.json'
  }
};

const ARTIFACT_KIND_ALIASES = {
  'studio-intake-packet': 'studio-intake-packet',
  'intake-packet': 'studio-intake-packet',
  packet: 'studio-intake-packet',
  studio_intake_packet: 'studio-intake-packet',
  'proposal-artifact': 'proposal-artifact',
  proposal: 'proposal-artifact',
  proposal_artifact: 'proposal-artifact',
  'handoff-artifact': 'handoff-artifact',
  handoff: 'handoff-artifact',
  handoff_artifact: 'handoff-artifact',
  'reference-artifact': 'reference-artifact',
  reference: 'reference-artifact',
  reference_artifact: 'reference-artifact',
  'card-review-target-artifact': 'card-review-target-artifact',
  'card-review-target': 'card-review-target-artifact',
  'card-target': 'card-review-target-artifact',
  card_review_target_artifact: 'card-review-target-artifact'
};

const SCHEMA_FILE_BY_ARTIFACT_TYPE = Object.fromEntries(
  Object.values(ARTIFACT_KINDS).map((entry) => [entry.artifactType, entry.schemaFile])
);

const PROPOSAL_TYPES = [
  'idea_probe',
  'card_review',
  'review_target_candidate',
  'registry_candidate_hint',
  'situation_analysis',
  'design_direction',
  'contradiction_packet',
  'challenge_dossier_seed'
];

const NEXT_REVIEW_TARGETS = [
  'none',
  'manual_design_followup',
  'request_human_decision',
  'human_registry_review'
];

const FORBIDDEN_NEXT_REVIEW_TARGETS = ['future_mec_context_review'];

const FORBIDDEN_PROPERTY_CODE = {
  runtime_review_object: 'runtime_write_attempt',
  runtime_state: 'runtime_write_attempt',
  truth_mutation_target: 'truth_mutation_attempt',
  card_write_target: 'truth_mutation_attempt',
  index_write_target: 'truth_mutation_attempt',
  alias_write_target: 'truth_mutation_attempt'
};

const TRUTH_SURFACE_STRINGS = ['cards/', 'index/INDEX.json', 'index/ALIASES.json'];
const RUNTIME_STRINGS = ['runtime review object', 'runtime_write', 'mec state'];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function formatPath(pathParts) {
  return pathParts.length === 0 ? '<root>' : pathParts.join('.');
}

function resolveArtifactKind(input) {
  if (!input) {
    return null;
  }
  return ARTIFACT_KIND_ALIASES[input] || null;
}

function getArtifactKinds() {
  return Object.keys(ARTIFACT_KINDS);
}

function getSchemaPathForKind(kind) {
  const resolvedKind = resolveArtifactKind(kind) || kind;
  const entry = ARTIFACT_KINDS[resolvedKind];
  if (!entry) {
    return null;
  }
  return path.join(SCHEMA_DIR, entry.schemaFile);
}

function getSchemaPathForArtifactType(artifactType) {
  const schemaFile = SCHEMA_FILE_BY_ARTIFACT_TYPE[artifactType];
  if (!schemaFile) {
    return null;
  }
  return path.join(SCHEMA_DIR, schemaFile);
}

function loadSchemaForKind(kind) {
  const schemaPath = getSchemaPathForKind(kind);
  if (!schemaPath) {
    return null;
  }
  return readJson(schemaPath);
}

function loadSchemaForArtifactType(artifactType) {
  const schemaPath = getSchemaPathForArtifactType(artifactType);
  if (!schemaPath) {
    return null;
  }
  return readJson(schemaPath);
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

function pushBoundaryLint(boundaryLints, code, message, pathParts) {
  boundaryLints.push({
    code,
    message,
    path: formatPath(pathParts)
  });
}

function scanBoundaryLints(value, boundaryLints, pathParts = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanBoundaryLints(item, boundaryLints, [...pathParts, String(index)]));
    return;
  }

  if (typeof value === 'object' && value !== null) {
    for (const [key, nestedValue] of Object.entries(value)) {
      const nextPath = [...pathParts, key];
      if (FORBIDDEN_PROPERTY_CODE[key]) {
        pushBoundaryLint(boundaryLints, FORBIDDEN_PROPERTY_CODE[key], `${key} is forbidden in Studio artifacts`, nextPath);
      }
      scanBoundaryLints(nestedValue, boundaryLints, nextPath);
    }
    return;
  }

  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase();
    const lastKey = pathParts[pathParts.length - 1] || '';
    if (TRUTH_SURFACE_STRINGS.some((entry) => value.includes(entry)) && /(write|mutat|target|instruction|path)/i.test(lastKey)) {
      pushBoundaryLint(boundaryLints, 'truth_mutation_attempt', `truth-facing target detected in ${lastKey}`, pathParts);
    }
    if (RUNTIME_STRINGS.some((entry) => lowerValue.includes(entry)) && /(runtime|state|target|instruction|object)/i.test(lastKey)) {
      pushBoundaryLint(boundaryLints, 'runtime_write_attempt', `runtime-facing target detected in ${lastKey}`, pathParts);
    }
  }
}

function lintArtifact(artifact) {
  const schemaErrors = [];
  const boundaryLints = [];
  const artifactType = artifact && artifact.artifact_type;
  const schemaPath = getSchemaPathForArtifactType(artifactType);

  if (!artifactType) {
    schemaErrors.push('artifact_type is required to select a Studio schema');
  } else if (!schemaPath) {
    schemaErrors.push(`Unknown Studio artifact_type: ${artifactType}`);
  } else {
    const schema = loadSchemaForArtifactType(artifactType);
    schemaErrors.push(...validateSchema(schema, artifact));
  }

  if (artifact && typeof artifact === 'object') {
    if (Object.prototype.hasOwnProperty.call(artifact, 'proposal_type') && !PROPOSAL_TYPES.includes(artifact.proposal_type)) {
      pushBoundaryLint(boundaryLints, 'unknown_proposal_type', `Unknown proposal_type: ${artifact.proposal_type}`, ['proposal_type']);
    }

    if (Object.prototype.hasOwnProperty.call(artifact, 'next_review_target')) {
      if (FORBIDDEN_NEXT_REVIEW_TARGETS.includes(artifact.next_review_target)) {
        pushBoundaryLint(boundaryLints, 'forbidden_target', `Forbidden next_review_target: ${artifact.next_review_target}`, ['next_review_target']);
      } else if (!NEXT_REVIEW_TARGETS.includes(artifact.next_review_target)) {
        pushBoundaryLint(boundaryLints, 'unknown_next_review_target', `Unknown next_review_target: ${artifact.next_review_target}`, ['next_review_target']);
      }
    }

    scanBoundaryLints(artifact, boundaryLints);
  }

  return {
    artifactType: artifactType || null,
    schemaPath,
    schemaErrors,
    boundaryLints
  };
}

function buildScaffoldArtifact(kindInput) {
  const kind = resolveArtifactKind(kindInput);
  if (!kind) {
    throw new Error(`Unknown Studio scaffold kind: ${kindInput}`);
  }

  if (kind === 'studio-intake-packet') {
    return {
      artifact_type: 'studio_intake_packet',
      source_mode: 'maya_council',
      participants: ['maya:moderator'],
      topic: 'TODO: topic',
      proposal_type: 'idea_probe',
      claim_status: 'insufficiently_formed',
      evidence_status: 'needs_evidence',
      challenge_status: 'unchallenged',
      drift_risk: 'medium',
      recommendation_scope: 'proposal_only',
      promotion_state: 'proposal_only',
      distilled_summary: 'TODO: distilled summary',
      open_conflicts: ['TODO: add open conflict or missing evidence'],
      next_review_target: 'none'
    };
  }

  if (kind === 'proposal-artifact') {
    return {
      artifact_type: 'proposal_artifact',
      topic: 'TODO: topic',
      participants: ['maya:distillator'],
      proposal_type: 'idea_probe',
      claim_status: 'insufficiently_formed',
      evidence_status: 'needs_evidence',
      challenge_status: 'unchallenged',
      drift_risk: 'medium',
      recommendation_scope: 'proposal_only',
      promotion_state: 'proposal_only',
      distilled_summary: 'TODO: distilled summary',
      open_conflicts: ['TODO: add open conflict or missing evidence'],
      next_review_target: 'none'
    };
  }

  if (kind === 'handoff-artifact') {
    return {
      artifact_type: 'handoff_artifact',
      handoff_scope: 'TODO: handoff scope',
      origin_artifact_type: 'proposal_artifact',
      topic: 'TODO: topic',
      proposal_type: 'review_target_candidate',
      evidence_status: 'needs_evidence',
      challenge_status: 'unchallenged',
      open_conflicts: ['TODO: add open conflict or missing evidence'],
      handoff_reason: 'TODO: handoff reason',
      required_gate_state: ['user_gate'],
      next_review_target: 'manual_design_followup',
      proposal_status: 'proposal_only'
    };
  }

  if (kind === 'reference-artifact') {
    return {
      artifact_type: 'reference_artifact',
      reference_scope: 'TODO: reference scope',
      topic: 'TODO: topic',
      artifact_source: 'TODO: artifact source',
      summary: 'TODO: summary',
      evidence_status: 'needs_evidence',
      open_conflicts: ['TODO: add open conflict or missing evidence'],
      proposal_status: 'reference_only'
    };
  }

  return {
    artifact_type: 'card_review_target_artifact',
    review_target_type: 'review_priority_nomination',
    topic: 'TODO: topic',
    proposal_type: 'review_target_candidate',
    target_scope: 'TODO: target scope',
    evidence_status: 'needs_evidence',
    challenge_status: 'unchallenged',
    open_conflicts: ['TODO: add open conflict or missing evidence'],
    review_reason: 'TODO: review reason',
    required_gate_state: ['user_gate', 'card_review_target_gate'],
    next_review_target: 'human_registry_review',
    promotion_state: 'not_promoted'
  };
}

module.exports = {
  ROOT_DIR,
  SCHEMA_DIR,
  PROPOSAL_TYPES,
  NEXT_REVIEW_TARGETS,
  FORBIDDEN_NEXT_REVIEW_TARGETS,
  ARTIFACT_KINDS,
  resolveArtifactKind,
  getArtifactKinds,
  getSchemaPathForKind,
  getSchemaPathForArtifactType,
  loadSchemaForKind,
  loadSchemaForArtifactType,
  validateSchema,
  readJson,
  writeJson,
  lintArtifact,
  buildScaffoldArtifact
};
