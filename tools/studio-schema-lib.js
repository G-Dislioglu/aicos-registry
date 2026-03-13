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
  },
  'review-record': {
    artifactType: 'review_record',
    schemaFile: 'review-record.schema.json'
  },
  'gate-report': {
    artifactType: 'gate_report',
    schemaFile: 'gate-report.schema.json'
  },
  'studio-bundle-manifest': {
    artifactType: 'studio_bundle_manifest',
    schemaFile: 'studio-bundle-manifest.schema.json'
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
  card_review_target_artifact: 'card-review-target-artifact',
  'review-record': 'review-record',
  review_record: 'review-record',
  review: 'review-record',
  'gate-report': 'gate-report',
  gate_report: 'gate-report',
  gate: 'gate-report',
  'studio-bundle-manifest': 'studio-bundle-manifest',
  'bundle-manifest': 'studio-bundle-manifest',
  bundle: 'studio-bundle-manifest',
  studio_bundle_manifest: 'studio-bundle-manifest'
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

const DECISION_CODES = [
  'insufficient_evidence',
  'unresolved_conflict',
  'proposal_only_keep',
  'handoff_ready',
  'reference_draft_only',
  'registry_review_nomination_only',
  'runtime_forbidden',
  'truth_mutation_forbidden',
  'user_gate_required',
  'archive_preferred',
  'split_required'
];

const GATE_OUTCOMES = ['pass', 'soft_fail', 'hard_stop'];
const FORBIDDEN_GATE_OUTCOMES = ['runtime_write_authorized', 'truth_mutation_authorized'];
const BUNDLE_TYPES = ['review_package', 'handoff_package', 'reference_package', 'mixed_review_package'];
const CONSISTENCY_STATUSES = ['consistent', 'needs_review', 'incomplete', 'conflict_present'];
const INTENDED_NEXT_STEPS = [
  'retain_in_review_layer',
  'manual_design_followup',
  'request_human_decision',
  'human_registry_review',
  'archive_only'
];
const BUNDLE_MEMBER_TYPES = [
  'studio_intake_packet',
  'proposal_artifact',
  'handoff_artifact',
  'reference_artifact',
  'card_review_target_artifact',
  'review_record',
  'gate_report'
];

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
const TRACE_RUNTIME_STRINGS = ['runtime/', 'runtime review object', 'runtime_review_object'];
const TRACE_TRUTH_STRINGS = ['cards/', 'index/index.json', 'index/aliases.json'];
const IMPLICIT_APPROVAL_TERMS = ['auto-approved', 'approval granted', 'automatically approved', 'forward automatically', 'auto-forward'];

function normalizeTextForTrace(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokenizeTraceText(value) {
  return new Set(
    normalizeTextForTrace(value)
      .split(/\s+/)
      .filter((token) => token.length >= 4)
  );
}

function haveTraceTokenOverlap(left, right) {
  if (!left || !right) {
    return true;
  }
  const leftTokens = tokenizeTraceText(left);
  const rightTokens = tokenizeTraceText(right);
  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      return true;
    }
  }
  return false;
}

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

function normalizeRelativeRef(filePath) {
  return path.relative(ROOT_DIR, filePath).split(path.sep).join('/');
}

function findBundleManifestConsistencyIssues(artifact) {
  const issues = [];
  if (!artifact || artifact.artifact_type !== 'studio_bundle_manifest' || !Array.isArray(artifact.included_artifacts)) {
    return issues;
  }

  const includedRefs = new Map();
  const includedArtifacts = new Map();
  const reviewArtifacts = [];
  const gateArtifacts = [];
  for (const entry of artifact.included_artifacts) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    if (typeof entry.ref === 'string') {
      if (includedRefs.has(entry.ref) && includedRefs.get(entry.ref) !== entry.artifact_type) {
        issues.push({
          code: 'duplicate_included_ref',
          message: `included ref ${entry.ref} is associated with multiple artifact types`,
          path: `included_artifacts.${entry.ref}`
        });
      }
      includedRefs.set(entry.ref, entry.artifact_type);
    }

    if (typeof entry.ref === 'string') {
      const absoluteRefPath = path.join(ROOT_DIR, entry.ref);
      if (fs.existsSync(absoluteRefPath)) {
        try {
          const nestedArtifact = readJson(absoluteRefPath);
          includedArtifacts.set(entry.ref, nestedArtifact);
          if (entry.artifact_type === 'review_record') {
            reviewArtifacts.push({ ref: entry.ref, artifact: nestedArtifact });
          }
          if (entry.artifact_type === 'gate_report') {
            gateArtifacts.push({ ref: entry.ref, artifact: nestedArtifact });
          }
        } catch (error) {
          issues.push({
            code: 'unreadable_included_artifact',
            message: `included artifact could not be read: ${entry.ref}`,
            path: 'included_artifacts'
          });
        }
      }
    }

    if (!BUNDLE_MEMBER_TYPES.includes(entry.artifact_type)) {
      issues.push({
        code: 'forbidden_bundle_member',
        message: `Forbidden bundle member type: ${entry.artifact_type}`,
        path: 'included_artifacts'
      });
    }

    if (typeof entry.ref === 'string') {
      const lowerRef = entry.ref.toLowerCase();
      if (lowerRef.includes('runtime/') || lowerRef.includes('runtime_review_object')) {
        issues.push({
          code: 'runtime_write_attempt',
          message: `runtime-facing bundle ref detected: ${entry.ref}`,
          path: 'included_artifacts'
        });
      }
      if (lowerRef.startsWith('cards/') || lowerRef.startsWith('index/')) {
        issues.push({
          code: 'truth_mutation_attempt',
          message: `truth-facing bundle ref detected: ${entry.ref}`,
          path: 'included_artifacts'
        });
      }
    }
  }

  const includedGateIds = new Set(
    gateArtifacts
      .map((entry) => entry.artifact && entry.artifact.gate_report_id)
      .filter((value) => typeof value === 'string' && value.length > 0)
  );

  if (artifact.proposal_only !== true) {
    issues.push({
      code: 'proposal_only_required',
      message: 'bundle manifests must keep proposal_only set to true',
      path: 'proposal_only'
    });
  }

  if (artifact.no_truth_mutation !== true) {
    issues.push({
      code: 'no_truth_mutation_required',
      message: 'bundle manifests must keep no_truth_mutation set to true',
      path: 'no_truth_mutation'
    });
  }

  if (artifact.no_runtime_write !== true) {
    issues.push({
      code: 'no_runtime_write_required',
      message: 'bundle manifests must keep no_runtime_write set to true',
      path: 'no_runtime_write'
    });
  }

  if (typeof artifact.source_packet_ref === 'string') {
    if (!includedRefs.has(artifact.source_packet_ref)) {
      issues.push({
        code: 'inconsistent_source_packet_ref',
        message: `source_packet_ref is not present in included_artifacts: ${artifact.source_packet_ref}`,
        path: 'source_packet_ref'
      });
    } else if (includedRefs.get(artifact.source_packet_ref) !== 'studio_intake_packet') {
      issues.push({
        code: 'source_packet_not_packet',
        message: `source_packet_ref must point to a studio_intake_packet: ${artifact.source_packet_ref}`,
        path: 'source_packet_ref'
      });
    }
  }

  if (Array.isArray(artifact.review_refs)) {
    artifact.review_refs.forEach((ref, index) => {
      if (!includedRefs.has(ref)) {
        issues.push({
          code: 'inconsistent_review_ref',
          message: `review_refs entry is not present in included_artifacts: ${ref}`,
          path: `review_refs.${index}`
        });
      } else if (includedRefs.get(ref) !== 'review_record') {
        issues.push({
          code: 'review_ref_not_review_record',
          message: `review_refs entry must point to a review_record: ${ref}`,
          path: `review_refs.${index}`
        });
      }
    });
  }

  if (Array.isArray(artifact.gate_report_refs)) {
    artifact.gate_report_refs.forEach((ref, index) => {
      if (!includedRefs.has(ref)) {
        issues.push({
          code: 'inconsistent_gate_report_ref',
          message: `gate_report_refs entry is not present in included_artifacts: ${ref}`,
          path: `gate_report_refs.${index}`
        });
      } else if (includedRefs.get(ref) !== 'gate_report') {
        issues.push({
          code: 'gate_report_ref_not_gate_report',
          message: `gate_report_refs entry must point to a gate_report: ${ref}`,
          path: `gate_report_refs.${index}`
        });
      }
    });
  }

  for (const reviewEntry of reviewArtifacts) {
    const reviewArtifact = reviewEntry.artifact || {};
    const subjectRef = reviewArtifact.subject_ref;
    if (typeof subjectRef === 'string') {
      if (!includedRefs.has(subjectRef)) {
        issues.push({
          code: 'review_subject_outside_bundle',
          message: `review record subject_ref is outside included_artifacts: ${subjectRef}`,
          path: `included_artifacts.${reviewEntry.ref}`
        });
      } else if (includedRefs.get(subjectRef) !== reviewArtifact.subject_artifact_type) {
        issues.push({
          code: 'review_subject_type_mismatch',
          message: `review record subject_artifact_type does not match bundled subject for ${subjectRef}`,
          path: `included_artifacts.${reviewEntry.ref}`
        });
      }
    }

    if (Array.isArray(reviewArtifact.gate_report_refs)) {
      reviewArtifact.gate_report_refs.forEach((gateId, index) => {
        if (!includedGateIds.has(gateId)) {
          issues.push({
            code: 'review_gate_id_outside_bundle',
            message: `review record gate_report_refs entry is not represented by an included gate report id: ${gateId}`,
            path: `included_artifacts.${reviewEntry.ref}.gate_report_refs.${index}`
          });
        }
      });
    }

    if (typeof artifact.topic === 'string' && typeof reviewArtifact.topic === 'string' && !haveTraceTokenOverlap(artifact.topic, reviewArtifact.topic)) {
      issues.push({
        code: 'bundle_topic_drift',
        message: `bundle topic drifts from review record topic: ${reviewEntry.ref}`,
        path: `included_artifacts.${reviewEntry.ref}.topic`
      });
    }
  }

  for (const gateEntry of gateArtifacts) {
    const gateArtifact = gateEntry.artifact || {};
    const subjectRef = gateArtifact.subject_ref;
    if (typeof subjectRef === 'string') {
      if (!includedRefs.has(subjectRef)) {
        issues.push({
          code: 'gate_subject_outside_bundle',
          message: `gate report subject_ref is outside included_artifacts: ${subjectRef}`,
          path: `included_artifacts.${gateEntry.ref}`
        });
      } else if (includedRefs.get(subjectRef) !== gateArtifact.subject_artifact_type) {
        issues.push({
          code: 'gate_subject_type_mismatch',
          message: `gate report subject_artifact_type does not match bundled subject for ${subjectRef}`,
          path: `included_artifacts.${gateEntry.ref}`
        });
      }
    }

    if (typeof artifact.topic === 'string' && typeof gateArtifact.topic === 'string' && !haveTraceTokenOverlap(artifact.topic, gateArtifact.topic)) {
      issues.push({
        code: 'bundle_topic_drift',
        message: `bundle topic drifts from gate report topic: ${gateEntry.ref}`,
        path: `included_artifacts.${gateEntry.ref}.topic`
      });
    }
  }

  for (const [key, value] of Object.entries(artifact)) {
    if (typeof value !== 'string') {
      continue;
    }
    const lowerValue = value.toLowerCase();
    if (IMPLICIT_APPROVAL_TERMS.some((term) => lowerValue.includes(term))) {
      issues.push({
        code: 'implicit_approval_claim',
        message: `bundle manifest text must not imply approval or automatic forwarding: ${value}`,
        path: key
      });
    }
    if (TRACE_RUNTIME_STRINGS.some((term) => lowerValue.includes(term))) {
      issues.push({
        code: 'trace_points_to_runtime',
        message: `bundle trace must not point into runtime-facing surfaces: ${value}`,
        path: key
      });
    }
    if (TRACE_TRUTH_STRINGS.some((term) => lowerValue.includes(term))) {
      issues.push({
        code: 'trace_points_to_truth',
        message: `bundle trace must not point into truth-facing surfaces: ${value}`,
        path: key
      });
    }
  }

  return issues;
}

function buildBundleManifestFromArtifacts(filePaths, options = {}) {
  const includedArtifacts = [];

  for (const filePath of filePaths) {
    const artifact = readJson(filePath);
    includedArtifacts.push({
      artifact_type: artifact.artifact_type,
      ref: normalizeRelativeRef(filePath)
    });
  }

  includedArtifacts.sort((left, right) => left.ref.localeCompare(right.ref));

  const sourcePacketRef = options.sourcePacketRef
    || (includedArtifacts.find((entry) => entry.artifact_type === 'studio_intake_packet') || {}).ref
    || 'examples/studio/scaffolded/studio-intake-packet.scaffolded.json';

  const reviewRefs = includedArtifacts
    .filter((entry) => entry.artifact_type === 'review_record')
    .map((entry) => entry.ref);

  const gateReportRefs = includedArtifacts
    .filter((entry) => entry.artifact_type === 'gate_report')
    .map((entry) => entry.ref);

  const manifest = {
    artifact_type: 'studio_bundle_manifest',
    bundle_id: options.bundleId || 'TODO: bundle-id',
    bundle_type: options.bundleType || 'review_package',
    included_artifacts: includedArtifacts,
    source_packet_ref: sourcePacketRef,
    review_refs: reviewRefs,
    gate_report_refs: gateReportRefs,
    consistency_status: 'consistent',
    intended_next_step: options.intendedNextStep || 'retain_in_review_layer',
    proposal_only: true,
    no_truth_mutation: true,
    no_runtime_write: true
  };

  if (options.topic) {
    manifest.topic = options.topic;
  }

  if (options.bundleSummary) {
    manifest.bundle_summary = options.bundleSummary;
  }

  if (options.notes) {
    manifest.notes = options.notes;
  }

  const consistencyIssues = findBundleManifestConsistencyIssues(manifest);
  if (consistencyIssues.length > 0) {
    manifest.consistency_status = 'needs_review';
  }

  return {
    manifest,
    consistencyIssues
  };
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

    if (Array.isArray(artifact.decision_codes)) {
      artifact.decision_codes.forEach((code, index) => {
        if (!DECISION_CODES.includes(code)) {
          pushBoundaryLint(boundaryLints, 'unknown_decision_code', `Unknown decision code: ${code}`, ['decision_codes', String(index)]);
        }
      });
    }

    if (Object.prototype.hasOwnProperty.call(artifact, 'next_review_target')) {
      if (FORBIDDEN_NEXT_REVIEW_TARGETS.includes(artifact.next_review_target)) {
        pushBoundaryLint(boundaryLints, 'forbidden_target', `Forbidden next_review_target: ${artifact.next_review_target}`, ['next_review_target']);
      } else if (!NEXT_REVIEW_TARGETS.includes(artifact.next_review_target)) {
        pushBoundaryLint(boundaryLints, 'unknown_next_review_target', `Unknown next_review_target: ${artifact.next_review_target}`, ['next_review_target']);
      }
    }

    if (Object.prototype.hasOwnProperty.call(artifact, 'gate_outcome')) {
      if (FORBIDDEN_GATE_OUTCOMES.includes(artifact.gate_outcome)) {
        pushBoundaryLint(boundaryLints, 'forbidden_gate_outcome', `Forbidden gate_outcome: ${artifact.gate_outcome}`, ['gate_outcome']);
      } else if (!GATE_OUTCOMES.includes(artifact.gate_outcome)) {
        pushBoundaryLint(boundaryLints, 'unknown_gate_outcome', `Unknown gate_outcome: ${artifact.gate_outcome}`, ['gate_outcome']);
      }
    }

    if (artifactType === 'studio_bundle_manifest') {
      for (const issue of findBundleManifestConsistencyIssues(artifact)) {
        boundaryLints.push(issue);
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

  if (kind === 'review-record') {
    return {
      artifact_type: 'review_record',
      review_record_id: 'TODO: review-record-id',
      subject_artifact_type: 'proposal_artifact',
      subject_ref: 'examples/studio/scaffolded/proposal-artifact.scaffolded.json',
      topic: 'TODO: topic',
      lifecycle_state: 'gated',
      decision_type: 'hold',
      decision_codes: ['proposal_only_keep'],
      review_summary: 'TODO: review summary',
      user_gate_status: 'not_required',
      resulting_next_posture: 'retain_in_review_layer',
      record_scope: 'review_layer_only'
    };
  }

  if (kind === 'gate-report') {
    return {
      artifact_type: 'gate_report',
      gate_report_id: 'TODO: gate-report-id',
      subject_artifact_type: 'proposal_artifact',
      subject_ref: 'examples/studio/scaffolded/proposal-artifact.scaffolded.json',
      topic: 'TODO: topic',
      gate_name: 'proposal_only_gate',
      gate_outcome: 'pass',
      gate_summary: 'TODO: gate summary',
      decision_codes: ['proposal_only_keep'],
      approval_requirement: 'not_required',
      record_scope: 'review_layer_only'
    };
  }

  if (kind === 'studio-bundle-manifest') {
    return {
      artifact_type: 'studio_bundle_manifest',
      bundle_id: 'TODO: bundle-id',
      bundle_type: 'review_package',
      included_artifacts: [
        {
          artifact_type: 'studio_intake_packet',
          ref: 'examples/studio/scaffolded/studio-intake-packet.scaffolded.json'
        },
        {
          artifact_type: 'proposal_artifact',
          ref: 'examples/studio/scaffolded/proposal-artifact.scaffolded.json'
        },
        {
          artifact_type: 'review_record',
          ref: 'examples/studio/scaffolded/review-record.scaffolded.json'
        },
        {
          artifact_type: 'gate_report',
          ref: 'examples/studio/scaffolded/gate-report.scaffolded.json'
        }
      ],
      source_packet_ref: 'examples/studio/scaffolded/studio-intake-packet.scaffolded.json',
      review_refs: ['examples/studio/scaffolded/review-record.scaffolded.json'],
      gate_report_refs: ['examples/studio/scaffolded/gate-report.scaffolded.json'],
      consistency_status: 'incomplete',
      intended_next_step: 'retain_in_review_layer',
      proposal_only: true,
      no_truth_mutation: true,
      no_runtime_write: true,
      topic: 'TODO: topic',
      bundle_summary: 'TODO: bundle summary'
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
  DECISION_CODES,
  GATE_OUTCOMES,
  FORBIDDEN_GATE_OUTCOMES,
  BUNDLE_TYPES,
  CONSISTENCY_STATUSES,
  INTENDED_NEXT_STEPS,
  BUNDLE_MEMBER_TYPES,
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
  findBundleManifestConsistencyIssues,
  buildBundleManifestFromArtifacts,
  lintArtifact,
  buildScaffoldArtifact
};
