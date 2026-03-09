#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const {
  getCardById
} = require('./registry-readonly-lib');
const {
  getEvent
} = require('./mec-event-lib');

const ROOT_DIR = path.join(__dirname, '..');
const DEFAULT_CANDIDATES_DIR = path.join(ROOT_DIR, 'runtime', 'candidates');
const MEC_CANDIDATE_TYPES = ['invariant_candidate', 'boundary_candidate', 'counterexample_candidate', 'curiosity_candidate'];
const MEC_CANDIDATE_STATUSES = ['proposal_only', 'challenged', 'needs_more_evidence', 'local_only', 'reconsolidation_pending', 'runtime_accepted', 'runtime_rejected', 'superseded'];
const SEVERITY_LEVELS = ['low', 'medium', 'high'];
const SCOPE_LEVELS = ['local', 'bounded', 'portable_with_constraints', 'portable'];
const LOCALITY_LEVELS = ['local_only', 'domain_local', 'portable_with_constraints', 'portable'];
const PROOF_STATES = ['not_started', 'collected', 'placeholder'];
const GATE_STATES = ['not_started', 'boundary_linked', 'not_applicable'];
const DISTILLATION_MODES = ['manual', 'semi_manual'];

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function toArray(value) {
  if (!value) {
    return [];
  }
  return Array.isArray(value)
    ? value.map(item => String(item).trim()).filter(Boolean)
    : [String(value).trim()].filter(Boolean);
}

function normalizeEnum(value, allowedValues, fallback) {
  const normalized = String(value || fallback).trim() || fallback;
  return allowedValues.includes(normalized) ? normalized : fallback;
}

function createCandidateId() {
  return `mecand-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function dedupe(values = []) {
  return Array.from(new Set(values));
}

function buildSourceRefs(sourceEventIds = [], sourceCardIds = [], options = {}) {
  const eventOutputDir = options.eventOutputDir || process.env.MEC_EVENT_DIR;
  return {
    event_refs: sourceEventIds.map(eventId => ({
      id: eventId,
      path: eventOutputDir ? path.join(eventOutputDir, `${eventId}.json`) : null
    })),
    card_refs: sourceCardIds.map(cardId => ({
      id: cardId,
      path: `cards/<type>/${cardId}.json`
    }))
  };
}

function normalizeCandidateInput(input = {}) {
  const createdAt = input.created_at || input.createdAt || new Date().toISOString();
  const updatedAt = input.updated_at || input.updatedAt || createdAt;
  return {
    id: String(input.id || '').trim(),
    candidate_type: String(input.candidate_type || input.candidateType || '').trim(),
    principle: String(input.principle || '').trim(),
    mechanism: String(input.mechanism || '').trim(),
    source_event_ids: dedupe(toArray(input.source_event_ids || input.sourceEventIds)),
    source_card_ids: dedupe(toArray(input.source_card_ids || input.sourceCardIds)),
    status: normalizeEnum(input.status, MEC_CANDIDATE_STATUSES, 'proposal_only'),
    created_at: createdAt,
    updated_at: updatedAt,
    scope: normalizeEnum(input.scope, SCOPE_LEVELS, 'local'),
    locality: normalizeEnum(input.locality, LOCALITY_LEVELS, 'domain_local'),
    applies_when: toArray(input.applies_when || input.appliesWhen),
    proof_ref: toArray(input.proof_ref || input.proofRef),
    proof_state: normalizeEnum(input.proof_state || input.proofState, PROOF_STATES, 'not_started'),
    gate_state: normalizeEnum(input.gate_state || input.gateState, GATE_STATES, 'not_started'),
    distillation_mode: normalizeEnum(input.distillation_mode || input.distillationMode, DISTILLATION_MODES, 'manual'),
    linked_candidate_id: String(input.linked_candidate_id || input.linkedCandidateId || '').trim(),
    refutes_candidate_id: String(input.refutes_candidate_id || input.refutesCandidateId || '').trim(),
    open_question: String(input.open_question || input.openQuestion || '').trim(),
    domain: String(input.domain || '').trim(),
    case_description: String(input.case_description || input.caseDescription || '').trim(),
    resolution: String(input.resolution || '').trim(),
    impact_on_candidate: String(input.impact_on_candidate || input.impactOnCandidate || '').trim(),
    blind_spot_score: Number.isFinite(Number(input.blind_spot_score || input.blindSpotScore)) ? Number(input.blind_spot_score || input.blindSpotScore) : 0,
    severity: normalizeEnum(input.severity, SEVERITY_LEVELS, 'medium'),
    fails_when: toArray(input.fails_when || input.failsWhen),
    edge_cases: toArray(input.edge_cases || input.edgeCases),
    challenge_origin: input.challenge_origin && typeof input.challenge_origin === 'object'
      ? { ...input.challenge_origin }
      : null,
    challenge_basis: input.challenge_basis && typeof input.challenge_basis === 'object'
      ? { ...input.challenge_basis }
      : null,
    metrics: {
      compression_gain: input.metrics && input.metrics.compression_gain !== undefined ? input.metrics.compression_gain : input.compression_gain || null,
      boundary_sharpness: input.metrics && input.metrics.boundary_sharpness !== undefined ? input.metrics.boundary_sharpness : input.boundary_sharpness || null,
      counterexample_pressure: input.metrics && input.metrics.counterexample_pressure !== undefined ? input.metrics.counterexample_pressure : input.counterexample_pressure || null,
      grade_source: String(input.metrics && input.metrics.grade_source || input.grade_source || 'human').trim() || 'human'
    }
  };
}

function validateSourceRefs(candidate, options = {}) {
  const eventOutputDir = options.eventOutputDir || process.env.MEC_EVENT_DIR;
  for (const eventId of candidate.source_event_ids) {
    const event = getEvent(eventId, { eventOutputDir });
    if (!event) {
      const error = new Error(`MEC source event not found: ${eventId}`);
      error.code = 'mec_source_event_not_found';
      error.event_id = eventId;
      throw error;
    }
  }
  for (const cardId of candidate.source_card_ids) {
    const result = getCardById(cardId);
    if (!result.card) {
      const error = new Error(`Registry source card not found: ${cardId}`);
      error.code = 'mec_source_card_not_found';
      error.card_id = cardId;
      throw error;
    }
  }
}

function validateCandidateInput(candidate) {
  if (!MEC_CANDIDATE_TYPES.includes(candidate.candidate_type)) {
    const error = new Error(`Invalid MEC candidate type: ${candidate.candidate_type || '(empty)'}`);
    error.code = 'invalid_mec_candidate_type';
    throw error;
  }
  if (!MEC_CANDIDATE_STATUSES.includes(candidate.status)) {
    const error = new Error(`Invalid MEC candidate status: ${candidate.status}`);
    error.code = 'invalid_mec_candidate_status';
    throw error;
  }
  if (candidate.candidate_type === 'invariant_candidate') {
    if (!candidate.principle) {
      const error = new Error('Invariant candidate principle is required.');
      error.code = 'missing_principle';
      throw error;
    }
    if (!candidate.mechanism) {
      const error = new Error('Invariant candidate mechanism is required.');
      error.code = 'missing_mechanism';
      throw error;
    }
    if (candidate.source_event_ids.length === 0) {
      const error = new Error('Invariant candidate requires at least one source event id.');
      error.code = 'missing_source_event_ids';
      throw error;
    }
    if (candidate.fails_when.length < 2) {
      const error = new Error('Invariant candidate requires at least two boundary failure conditions.');
      error.code = 'missing_boundary_fails_when';
      throw error;
    }
    if (candidate.edge_cases.length < 1) {
      const error = new Error('Invariant candidate requires at least one boundary edge case.');
      error.code = 'missing_boundary_edge_cases';
      throw error;
    }
  }
  if (candidate.candidate_type === 'boundary_candidate') {
    if (!candidate.linked_candidate_id) {
      const error = new Error('Boundary candidate requires linked_candidate_id.');
      error.code = 'missing_linked_candidate_id';
      throw error;
    }
    if (candidate.fails_when.length < 1) {
      const error = new Error('Boundary candidate requires at least one fails_when item.');
      error.code = 'missing_fails_when';
      throw error;
    }
  }
  if (candidate.candidate_type === 'counterexample_candidate') {
    if (!candidate.refutes_candidate_id) {
      const error = new Error('Counterexample candidate requires refutes_candidate_id.');
      error.code = 'missing_refutes_candidate_id';
      throw error;
    }
    if (!candidate.case_description) {
      const error = new Error('Counterexample candidate requires case_description.');
      error.code = 'missing_case_description';
      throw error;
    }
  }
  if (candidate.candidate_type === 'curiosity_candidate') {
    if (!candidate.open_question) {
      const error = new Error('Curiosity candidate requires open_question.');
      error.code = 'missing_open_question';
      throw error;
    }
    if (!candidate.domain) {
      const error = new Error('Curiosity candidate requires domain.');
      error.code = 'missing_domain';
      throw error;
    }
  }
}

function validateLinkedCandidateRefs(candidate, options = {}) {
  const candidateOutputDir = options.candidateOutputDir || process.env.MEC_CANDIDATE_DIR || DEFAULT_CANDIDATES_DIR;
  if (candidate.candidate_type === 'boundary_candidate' && candidate.linked_candidate_id) {
    const linkedCandidate = getCandidate(candidate.linked_candidate_id, { candidateOutputDir });
    if (!linkedCandidate) {
      const error = new Error(`Linked MEC candidate not found: ${candidate.linked_candidate_id}`);
      error.code = 'mec_linked_candidate_not_found';
      error.candidate_id = candidate.linked_candidate_id;
      throw error;
    }
  }
  if (candidate.candidate_type === 'counterexample_candidate' && candidate.refutes_candidate_id) {
    const refutedCandidate = getCandidate(candidate.refutes_candidate_id, { candidateOutputDir });
    if (!refutedCandidate) {
      const error = new Error(`Refuted MEC candidate not found: ${candidate.refutes_candidate_id}`);
      error.code = 'mec_refuted_candidate_not_found';
      error.candidate_id = candidate.refutes_candidate_id;
      throw error;
    }
  }
}

function buildInvariantCandidate(candidate, boundaryCandidateId, options = {}) {
  return {
    schema_version: 'mec-invariant-candidate/v1',
    id: candidate.id || createCandidateId(),
    candidate_type: 'invariant_candidate',
    principle: candidate.principle,
    mechanism: candidate.mechanism,
    scope: candidate.scope,
    locality: candidate.locality,
    applies_when: candidate.applies_when,
    source_event_ids: candidate.source_event_ids,
    source_card_ids: candidate.source_card_ids,
    metrics: candidate.metrics,
    proof_state: candidate.proof_state,
    proof_ref: candidate.proof_ref,
    gate_state: candidate.gate_state === 'not_started' ? 'boundary_linked' : candidate.gate_state,
    status: candidate.status,
    created_at: candidate.created_at,
    updated_at: candidate.updated_at,
    linked_boundary_candidate_id: boundaryCandidateId,
    boundary_outline: {
      fails_when: candidate.fails_when,
      edge_cases: candidate.edge_cases,
      severity: candidate.severity
    },
    distillation_mode: candidate.distillation_mode,
    source_refs: buildSourceRefs(candidate.source_event_ids, candidate.source_card_ids, options),
    candidate_boundary: {
      runtime_only: true,
      proposal_only: true,
      registry_mutation: false,
      canon_exported: false,
      review_integrated: false
    }
  };
}

function buildBoundaryCandidate(candidate, linkedCandidateId, options = {}) {
  return {
    schema_version: 'mec-boundary-candidate/v1',
    id: candidate.id || createCandidateId(),
    candidate_type: 'boundary_candidate',
    principle: candidate.principle,
    mechanism: candidate.mechanism,
    linked_candidate_id: linkedCandidateId,
    fails_when: candidate.fails_when,
    edge_cases: candidate.edge_cases,
    severity: candidate.severity,
    source_event_ids: candidate.source_event_ids,
    source_card_ids: candidate.source_card_ids,
    status: candidate.status,
    created_at: candidate.created_at,
    updated_at: candidate.updated_at,
    distillation_mode: candidate.distillation_mode,
    source_refs: buildSourceRefs(candidate.source_event_ids, candidate.source_card_ids, options),
    candidate_boundary: {
      runtime_only: true,
      proposal_only: true,
      registry_mutation: false,
      canon_exported: false,
      review_integrated: false
    }
  };
}

function buildCounterexampleCandidate(candidate, options = {}) {
  return {
    schema_version: 'mec-counterexample-candidate/v1',
    id: candidate.id || createCandidateId(),
    candidate_type: 'counterexample_candidate',
    principle: candidate.principle,
    mechanism: candidate.mechanism,
    refutes_candidate_id: candidate.refutes_candidate_id,
    case_description: candidate.case_description,
    resolution: candidate.resolution,
    impact_on_candidate: candidate.impact_on_candidate,
    source_event_ids: candidate.source_event_ids,
    source_card_ids: candidate.source_card_ids,
    status: candidate.status,
    created_at: candidate.created_at,
    updated_at: candidate.updated_at,
    distillation_mode: candidate.distillation_mode,
    challenge_origin: candidate.challenge_origin,
    challenge_basis: candidate.challenge_basis,
    source_refs: buildSourceRefs(candidate.source_event_ids, candidate.source_card_ids, options),
    candidate_boundary: {
      runtime_only: true,
      proposal_only: true,
      registry_mutation: false,
      canon_exported: false,
      review_integrated: false
    }
  };
}

function buildCuriosityCandidate(candidate, options = {}) {
  return {
    schema_version: 'mec-curiosity-candidate/v1',
    id: candidate.id || createCandidateId(),
    candidate_type: 'curiosity_candidate',
    principle: candidate.principle,
    mechanism: candidate.mechanism,
    open_question: candidate.open_question,
    domain: candidate.domain,
    blind_spot_score: candidate.blind_spot_score,
    source_event_ids: candidate.source_event_ids,
    source_card_ids: candidate.source_card_ids,
    status: candidate.status,
    created_at: candidate.created_at,
    updated_at: candidate.updated_at,
    distillation_mode: candidate.distillation_mode,
    source_refs: buildSourceRefs(candidate.source_event_ids, candidate.source_card_ids, options),
    candidate_boundary: {
      runtime_only: true,
      proposal_only: true,
      registry_mutation: false,
      canon_exported: false,
      review_integrated: false,
      auto_resolve: false
    }
  };
}

function saveCandidate(candidate, options = {}) {
  const candidateOutputDir = options.candidateOutputDir || process.env.MEC_CANDIDATE_DIR || DEFAULT_CANDIDATES_DIR;
  ensureDirectory(candidateOutputDir);
  const candidateFilePath = path.join(candidateOutputDir, `${candidate.id}.json`);
  fs.writeFileSync(candidateFilePath, JSON.stringify(candidate, null, 2));
  return {
    filePath: candidateFilePath,
    candidate
  };
}

function createInvariantCandidate(rawInput = {}, options = {}) {
  const normalized = normalizeCandidateInput({
    ...rawInput,
    candidate_type: 'invariant_candidate'
  });
  validateCandidateInput(normalized);
  validateSourceRefs(normalized, options);

  const invariantId = normalized.id || createCandidateId();
  const boundaryId = createCandidateId();
  const invariantCandidate = buildInvariantCandidate({
    ...normalized,
    id: invariantId
  }, boundaryId, options);
  const boundaryCandidate = buildBoundaryCandidate({
    ...normalized,
    id: boundaryId,
    candidate_type: 'boundary_candidate',
    linked_candidate_id: invariantId
  }, invariantId, options);

  const savedInvariant = saveCandidate(invariantCandidate, options);
  const savedBoundary = saveCandidate(boundaryCandidate, options);
  return {
    candidateFilePaths: [savedInvariant.filePath, savedBoundary.filePath],
    candidate: savedInvariant.candidate,
    linked_boundary_candidate: savedBoundary.candidate
  };
}

function createMecCandidate(rawInput = {}, options = {}) {
  const normalized = normalizeCandidateInput(rawInput);
  validateCandidateInput(normalized);
  validateSourceRefs(normalized, options);
  validateLinkedCandidateRefs(normalized, options);

  if (normalized.candidate_type === 'invariant_candidate') {
    return createInvariantCandidate(rawInput, options);
  }

  let candidateRecord = null;
  if (normalized.candidate_type === 'boundary_candidate') {
    candidateRecord = buildBoundaryCandidate(normalized, normalized.linked_candidate_id, options);
  } else if (normalized.candidate_type === 'counterexample_candidate') {
    candidateRecord = buildCounterexampleCandidate(normalized, options);
  } else if (normalized.candidate_type === 'curiosity_candidate') {
    candidateRecord = buildCuriosityCandidate(normalized, options);
  }

  const saved = saveCandidate(candidateRecord, options);
  return {
    candidateFilePaths: [saved.filePath],
    candidate: saved.candidate,
    linked_boundary_candidate: null
  };
}

function listCandidates(options = {}) {
  const candidateOutputDir = options.candidateOutputDir || process.env.MEC_CANDIDATE_DIR || DEFAULT_CANDIDATES_DIR;
  if (!fs.existsSync(candidateOutputDir)) {
    return [];
  }
  return fs.readdirSync(candidateOutputDir)
    .filter(file => file.endsWith('.json'))
    .sort()
    .map(file => {
      const filePath = path.join(candidateOutputDir, file);
      const payload = readJsonFile(filePath);
      return {
        id: payload.id,
        candidate_type: payload.candidate_type,
        principle: payload.principle || payload.open_question || '',
        case_description: payload.case_description || '',
        open_question: payload.open_question || '',
        mechanism: payload.mechanism || '',
        domain: payload.domain || '',
        blind_spot_score: payload.blind_spot_score ?? null,
        source_event_ids: payload.source_event_ids || [],
        source_card_ids: payload.source_card_ids || [],
        status: payload.status,
        created_at: payload.created_at || null,
        updated_at: payload.updated_at || null,
        refutes_candidate_id: payload.refutes_candidate_id || null,
        linked_candidate_id: payload.linked_candidate_id || null,
        linked_boundary_candidate_id: payload.linked_boundary_candidate_id || null,
        file_path: filePath
      };
    });
}

function getCandidate(candidateId, options = {}) {
  const candidateOutputDir = options.candidateOutputDir || process.env.MEC_CANDIDATE_DIR || DEFAULT_CANDIDATES_DIR;
  const filePath = path.join(candidateOutputDir, `${candidateId}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return readJsonFile(filePath);
}

module.exports = {
  DEFAULT_CANDIDATES_DIR,
  MEC_CANDIDATE_STATUSES,
  MEC_CANDIDATE_TYPES,
  createInvariantCandidate,
  createMecCandidate,
  getCandidate,
  listCandidates,
  normalizeCandidateInput
};
