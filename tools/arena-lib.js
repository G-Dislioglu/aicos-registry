#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const {
  getCardById,
  getStats,
  listCards
} = require('./registry-readonly-lib');
const {
  getProfile
} = require('./model-control-lib');
const {
  buildMemoryCandidates,
  normalizeMemoryProposalInput
} = require('./memory-proposal-lib');
const {
  deriveExportReadiness
} = require('./memory-export-readiness-lib');
const {
  deriveExportGateDecision
} = require('./memory-export-gate-lib');
const {
  createExportReviewRecord,
  deriveCandidateExportReviewState,
  normalizeExportReviewInput
} = require('./memory-export-review-lib');
const {
  createReviewRecord,
  deriveCandidateReviewState,
  getCurrentCandidateStatus,
  isReviewableCandidateStatus,
  isValidReviewDecisionStatus,
  normalizeReviewInput,
  sortReviewRecords
} = require('./memory-review-lib');
const {
  createMecReviewRecord,
  deriveMecCandidateReviewState,
  getCurrentMecReviewState,
  getLatestMecReviewRecord,
  isReviewableMecReviewState,
  isValidMecReviewOutcome,
  normalizeMecReviewInput,
  sortMecReviewRecords
} = require('./mec-review-lib');
const {
  DEFAULT_EVENTS_DIR,
  createEvent,
  getEvent,
  listEvents
} = require('./mec-event-lib');
const {
  DEFAULT_CANDIDATES_DIR,
  createMecCandidate,
  getCandidate,
  listCandidates
} = require('./mec-candidate-lib');

const ROOT_DIR = path.join(__dirname, '..');
const DEFAULT_RUNS_DIR = path.join(ROOT_DIR, 'runtime', 'arena-runs');
const DEFAULT_AUDIT_DIR = path.join(ROOT_DIR, 'runtime', 'audit-records');
const DEFAULT_MEMORY_CANDIDATES_DIR = path.join(ROOT_DIR, 'runtime', 'memory-candidates');
const DEFAULT_EXPORT_REVIEWS_DIR = path.join(ROOT_DIR, 'runtime', 'export-reviews');
const DEFAULT_MEC_REVIEWS_DIR = path.join(ROOT_DIR, 'runtime', 'mec-reviews');
const DEFAULT_MEMORY_REVIEWS_DIR = path.join(ROOT_DIR, 'runtime', 'memory-reviews');
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toArray(value) {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

function parseTimestamp(value) {
  if (!value) {
    return null;
  }
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function deriveEventFreshnessState(payload, now = Date.now()) {
  const createdAt = parseTimestamp(payload && payload.created_at);
  const expiresAt = parseTimestamp(payload && payload.expires_at);
  if (expiresAt !== null && now >= expiresAt) {
    return 'expired';
  }
  if (createdAt === null) {
    return 'stale';
  }
  if (expiresAt !== null && expiresAt > createdAt) {
    const ratio = (now - createdAt) / (expiresAt - createdAt);
    if (ratio <= 0.34) {
      return 'fresh';
    }
    if (ratio <= 0.8) {
      return 'aging';
    }
    return 'stale';
  }
  const ageDays = (now - createdAt) / MS_PER_DAY;
  if (ageDays <= 1) {
    return 'fresh';
  }
  if (ageDays <= 7) {
    return 'aging';
  }
  return 'stale';
}

function deriveCandidateFreshnessState(payload, now = Date.now()) {
  const referenceAt = parseTimestamp(payload && (payload.updated_at || payload.created_at));
  if (referenceAt === null) {
    return 'stale';
  }
  const ageDays = (now - referenceAt) / MS_PER_DAY;
  if (ageDays <= 7) {
    return 'fresh';
  }
  if (ageDays <= 30) {
    return 'aging';
  }
  return 'stale';
}

function enrichMecEventFreshness(payload) {
  if (!payload) {
    return payload;
  }
  return {
    ...payload,
    freshness_state: deriveEventFreshnessState(payload)
  };
}

function enrichMecCandidateFreshness(payload) {
  if (!payload) {
    return payload;
  }
  return {
    ...payload,
    freshness_state: deriveCandidateFreshnessState(payload)
  };
}

function createRunId() {
  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeInput(input = {}) {
  return {
    question: String(input.question || '').trim(),
    target_ids: toArray(input.target_ids || input.targetIds),
    profile: String(input.profile || 'default').trim() || 'default',
    filters: {
      type: input.filters && input.filters.type ? input.filters.type : input.type,
      domain: input.filters && input.filters.domain ? input.filters.domain : input.domain,
      tag: input.filters && input.filters.tag ? input.filters.tag : input.tag,
      status: input.filters && input.filters.status ? input.filters.status : input.status,
      q: input.filters && input.filters.q ? input.filters.q : input.q
    },
    shared_evidence_input: {
      topic: input.shared_evidence_input && input.shared_evidence_input.topic ? input.shared_evidence_input.topic : String(input.evidence_topic || '').trim(),
      requested_sources: toArray(input.shared_evidence_input && input.shared_evidence_input.requested_sources ? input.shared_evidence_input.requested_sources : input.requested_sources),
      notes: toArray(input.shared_evidence_input && input.shared_evidence_input.notes ? input.shared_evidence_input.notes : input.evidence_notes)
    },
    memory_proposal_input: normalizeMemoryProposalInput(input)
  };
}

function summarizeCard(card) {
  return {
    id: card.id,
    type: card.type,
    token: card.token,
    title: card.title,
    domain: card.domain,
    tags: card.tags,
    status: card.status
  };
}

function buildRegistryContext(input) {
  const stats = getStats();
  const cardMap = new Map();

  for (const targetId of input.target_ids) {
    const result = getCardById(targetId);
    if (result.card) {
      cardMap.set(result.card.id, summarizeCard(result.card));
    }
  }

  const hasFilters = Object.values(input.filters).some(Boolean);
  if (hasFilters) {
    const filtered = listCards({
      type: input.filters.type,
      domain: input.filters.domain,
      tag: input.filters.tag,
      status: input.filters.status,
      q: input.filters.q,
      limit: 8
    });
    for (const card of filtered) {
      cardMap.set(card.id, summarizeCard(card));
    }
  }

  return {
    stats,
    candidate_cards: Array.from(cardMap.values()),
    requested_target_ids: input.target_ids,
    filter_snapshot: input.filters,
    source: {
      surface: 'registry-readonly-lib',
      source_of_truth: 'registry',
      index_file: 'index/INDEX.json',
      aliases_file: 'index/ALIASES.json',
      card_lookup: 'cards/<type>/<id>.json'
    }
  };
}

function buildSharedEvidencePack(input) {
  const topic = input.shared_evidence_input.topic || input.question || 'unspecified';
  return {
    status: 'placeholder',
    topic,
    requested_sources: input.shared_evidence_input.requested_sources,
    notes: input.shared_evidence_input.notes,
    items: [],
    placeholder_state: 'no_external_fetch_performed'
  };
}

function buildModelControl(input) {
  const selectedProfile = getProfile(input.profile);
  return {
    selected_profile: selectedProfile.id,
    profile: selectedProfile,
    provider_integration: 'not_configured',
    selection_mode: selectedProfile.selection_strategy,
    control_boundary: {
      proposal_only: true,
      validated_requires: ['proof_ref', 'gates'],
      auto_apply: false
    }
  };
}

function buildScoutOutput(input, registryContext, sharedEvidencePack) {
  const candidateIds = registryContext.candidate_cards.map(card => card.id);
  const hypotheses = candidateIds.length > 0
    ? ['Registry-grounded proposal candidates identified for manual review.']
    : ['No registry-grounded candidates identified yet; broaden evidence or query input.'];
  const frictionSignals = [];

  if (candidateIds.length === 0) {
    frictionSignals.push('no_candidate_cards');
  }
  if (sharedEvidencePack.items.length === 0) {
    frictionSignals.push('shared_evidence_placeholder');
  }
  if (!input.question) {
    frictionSignals.push('question_missing');
  }

  return {
    status: 'proposal_only_placeholder',
    candidate_card_ids: candidateIds,
    hypotheses,
    friction_signals: frictionSignals,
    evidence_gap: sharedEvidencePack.items.length === 0
  };
}

function buildObserverDecision(registryContext, scoutOutput, modelControl) {
  const reasons = [];
  const riskSignals = [];
  let decision = 'proposal_only_continue';

  if (registryContext.candidate_cards.length === 0) {
    decision = 'proposal_only_escalate';
    reasons.push('No registry-grounded candidate cards were found.');
    riskSignals.push('no_delta');
  }

  if (scoutOutput.evidence_gap) {
    reasons.push('Shared evidence remains placeholder-only.');
    riskSignals.push('evidence_gap');
  }

  if (modelControl.selected_profile === 'review_strict') {
    reasons.push('Strict review profile keeps the proposal-only boundary conservative.');
  }

  if (reasons.length === 0) {
    reasons.push('Minimal proposal-only arena run may continue without validation or apply.');
  }

  return {
    decision,
    reasons,
    risk_signals: riskSignals,
    validated: false,
    apply_allowed: false,
    promotion_eligible: false,
    validation_requirements: ['proof_ref', 'gates'],
    model_control_profile: modelControl.selected_profile
  };
}

function buildTrace(packet, outputDir, auditOutputDir) {
  const phaseTimestamps = {
    input_captured_at: packet.created_at,
    shared_evidence_evaluated_at: packet.created_at,
    scout_completed_at: packet.created_at,
    observer_completed_at: packet.created_at
  };

  return {
    schema_version: 'phase3-minimal-trace/v1',
    output_dir: outputDir,
    audit_output_dir: auditOutputDir,
    run_metadata: {
      run_id: packet.run_id,
      created_at: packet.created_at,
      status: packet.status,
      mode: packet.mode
    },
    proposal_only_status: {
      mode: packet.mode,
      validated: packet.validation.status,
      eligible: packet.validation.eligible,
      requires: packet.validation.requires
    },
    decision_boundary: {
      decision: packet.observer_decision.decision,
      apply_allowed: packet.observer_decision.apply_allowed,
      promotion_eligible: packet.observer_decision.promotion_eligible,
      validated: packet.observer_decision.validated
    },
    registry_context_source: packet.registry_context.source,
    evidence_placeholder_state: {
      status: packet.shared_evidence_pack.status,
      placeholder_state: packet.shared_evidence_pack.placeholder_state,
      item_count: packet.shared_evidence_pack.items.length
    },
    phase_timestamps: phaseTimestamps,
    phases: [
      { phase: 'input', status: 'captured', at: phaseTimestamps.input_captured_at },
      { phase: 'shared_evidence', status: packet.shared_evidence_pack.status, at: phaseTimestamps.shared_evidence_evaluated_at },
      { phase: 'scout', status: packet.scout_output.status, at: phaseTimestamps.scout_completed_at },
      { phase: 'observer', status: packet.observer_decision.decision, at: phaseTimestamps.observer_completed_at }
    ],
    memory_proposals: {
      enabled: packet.memory_candidates.enabled,
      count: packet.memory_candidates.count,
      storage_dir: packet.memory_candidate_storage.memory_output_dir,
      proposal_only: true,
      promoted: false
    },
    summary: {
      candidate_count: packet.registry_context.candidate_cards.length,
      evidence_item_count: packet.shared_evidence_pack.items.length,
      proposal_only: true,
      selected_profile: packet.model_control.selected_profile,
      audit_record_expected: true,
      memory_candidate_count: packet.memory_candidates.count
    }
  };
}

function buildAuditRecord(packet, outputDir, auditOutputDir) {
  return {
    schema_version: 'phase3-minimal-audit/v1',
    run_id: packet.run_id,
    created_at: packet.created_at,
    proposal_only_status: {
      mode: packet.mode,
      validated: packet.validation.status,
      eligible: packet.validation.eligible,
      apply_allowed: packet.observer_decision.apply_allowed
    },
    run_metadata: {
      status: packet.status,
      output_dir: outputDir,
      audit_output_dir: auditOutputDir
    },
    model_control: {
      selected_profile: packet.model_control.selected_profile,
      selection_mode: packet.model_control.selection_mode,
      provider_integration: packet.model_control.provider_integration,
      budget_posture: packet.model_control.profile.budget_posture,
      role_bindings: packet.model_control.profile.role_bindings
    },
    decision_boundary: {
      decision: packet.observer_decision.decision,
      reasons: packet.observer_decision.reasons,
      risk_signals: packet.observer_decision.risk_signals,
      validation_requirements: packet.observer_decision.validation_requirements
    },
    registry_context_source: packet.registry_context.source,
    evidence_placeholder_state: {
      status: packet.shared_evidence_pack.status,
      placeholder_state: packet.shared_evidence_pack.placeholder_state,
      topic: packet.shared_evidence_pack.topic,
      requested_sources: packet.shared_evidence_pack.requested_sources,
      item_count: packet.shared_evidence_pack.items.length
    },
    memory_proposals: {
      enabled: packet.memory_candidates.enabled,
      count: packet.memory_candidates.count,
      candidate_ids: packet.memory_candidates.items.map(item => item.candidate_id),
      promoted: false,
      storage_dir: packet.memory_candidate_storage.memory_output_dir
    },
    phase_summary: packet.trace.phases
  };
}

function createArenaRunPacket(rawInput = {}, options = {}) {
  const input = normalizeInput(rawInput);
  const outputDir = options.outputDir || process.env.ARENA_RUNS_DIR || DEFAULT_RUNS_DIR;
  const auditOutputDir = options.auditOutputDir || process.env.ARENA_AUDIT_DIR || DEFAULT_AUDIT_DIR;
  const memoryOutputDir = options.memoryOutputDir || process.env.ARENA_MEMORY_DIR || DEFAULT_MEMORY_CANDIDATES_DIR;
  const registryContext = buildRegistryContext(input);
  const sharedEvidencePack = buildSharedEvidencePack(input);
  const modelControl = buildModelControl(input);
  const scoutOutput = buildScoutOutput(input, registryContext, sharedEvidencePack);
  const observerDecision = buildObserverDecision(registryContext, scoutOutput, modelControl);
  const runId = createRunId();

  const packet = {
    schema_version: 'phase3-minimal-arena/v1',
    run_id: runId,
    created_at: new Date().toISOString(),
    mode: 'proposal_only',
    status: 'completed',
    input,
    shared_evidence_pack: sharedEvidencePack,
    registry_context: registryContext,
    model_control: modelControl,
    scout_output: scoutOutput,
    observer_decision: observerDecision,
    validation: {
      status: 'not_validated',
      eligible: false,
      requires: ['proof_ref', 'gates']
    },
    memory_candidate_storage: {
      memory_output_dir: memoryOutputDir,
      source_boundary: 'runtime_only',
      registry_mutation: false
    }
  };

  packet.memory_candidates = buildMemoryCandidates(packet);
  packet.trace = buildTrace(packet, outputDir, auditOutputDir);
  packet.audit = buildAuditRecord(packet, outputDir, auditOutputDir);
  return packet;
}

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function createMecEvent(eventInput = {}, options = {}) {
  const eventOutputDir = options.eventOutputDir || process.env.MEC_EVENT_DIR || DEFAULT_EVENTS_DIR;
  return createEvent(eventInput, { eventOutputDir });
}

function listMecEvents(options = {}) {
  const eventOutputDir = options.eventOutputDir || process.env.MEC_EVENT_DIR || DEFAULT_EVENTS_DIR;
  return listEvents({ eventOutputDir }).map(item => enrichMecEventFreshness(item));
}

function readMecEvent(eventId, options = {}) {
  const eventOutputDir = options.eventOutputDir || process.env.MEC_EVENT_DIR || DEFAULT_EVENTS_DIR;
  return enrichMecEventFreshness(getEvent(eventId, { eventOutputDir }));
}

function createMecCandidateRecord(candidateInput = {}, options = {}) {
  const candidateOutputDir = options.candidateOutputDir || process.env.MEC_CANDIDATE_DIR || DEFAULT_CANDIDATES_DIR;
  const eventOutputDir = options.eventOutputDir || process.env.MEC_EVENT_DIR || DEFAULT_EVENTS_DIR;
  return createMecCandidate(candidateInput, { candidateOutputDir, eventOutputDir });
}

function normalizeMecChallengeInput(challengeInput = {}) {
  return {
    principle: String(challengeInput.principle || '').trim(),
    mechanism: String(challengeInput.mechanism || '').trim(),
    case_description: String(challengeInput.case_description || '').trim(),
    resolution: String(challengeInput.resolution || '').trim(),
    impact_on_candidate: String(challengeInput.impact_on_candidate || '').trim(),
    source_event_ids: toArray(challengeInput.source_event_ids).map(item => String(item).trim()).filter(Boolean),
    source_card_ids: toArray(challengeInput.source_card_ids).map(item => String(item).trim()).filter(Boolean),
    challenge_source: String(challengeInput.challenge_source || challengeInput.review_source || 'mec_manual_challenge').trim() || 'mec_manual_challenge'
  };
}

function listMecCandidates(options = {}) {
  return listMecReviewWorkspace(options);
}

function readMecCandidate(candidateId, options = {}) {
  return readMecReviewWorkspace(candidateId, options);
}

function listMemoryReviewPayloads(options = {}) {
  const memoryReviewOutputDir = options.memoryReviewOutputDir || process.env.ARENA_MEMORY_REVIEW_DIR || DEFAULT_MEMORY_REVIEWS_DIR;
  if (!fs.existsSync(memoryReviewOutputDir)) {
    return [];
  }

  return fs.readdirSync(memoryReviewOutputDir)
    .filter(file => file.endsWith('.json'))
    .sort()
    .map(file => {
      const filePath = path.join(memoryReviewOutputDir, file);
      const payload = readJsonFile(filePath);
      return {
        payload,
        filePath
      };
    });
}

function listExportReviewPayloads(options = {}) {
  const exportReviewOutputDir = options.exportReviewOutputDir || process.env.ARENA_EXPORT_REVIEW_DIR || DEFAULT_EXPORT_REVIEWS_DIR;
  if (!fs.existsSync(exportReviewOutputDir)) {
    return [];
  }

  return fs.readdirSync(exportReviewOutputDir)
    .filter(file => file.endsWith('.json'))
    .sort()
    .map(file => {
      const filePath = path.join(exportReviewOutputDir, file);
      const payload = readJsonFile(filePath);
      return {
        payload,
        filePath
      };
    });
}

function getReviewRecordsByCandidate(options = {}) {
  const reviewMap = new Map();
  for (const item of listMemoryReviewPayloads(options)) {
    const records = reviewMap.get(item.payload.candidate_id) || [];
    records.push(item.payload);
    reviewMap.set(item.payload.candidate_id, records);
  }

  for (const [candidateId, records] of reviewMap.entries()) {
    reviewMap.set(candidateId, sortReviewRecords(records));
  }

  return reviewMap;
}

function getExportReviewRecordsByCandidate(options = {}) {
  const exportReviewMap = new Map();
  for (const item of listExportReviewPayloads(options)) {
    const records = exportReviewMap.get(item.payload.candidate_id) || [];
    records.push(item.payload);
    exportReviewMap.set(item.payload.candidate_id, records);
  }

  return exportReviewMap;
}

function getMecReviewRecordsByCandidate(options = {}) {
  const reviewMap = new Map();
  for (const item of listMecReviewPayloads(options)) {
    const records = reviewMap.get(item.payload.candidate_id) || [];
    records.push(item.payload);
    reviewMap.set(item.payload.candidate_id, records);
  }

  for (const [candidateId, records] of reviewMap.entries()) {
    reviewMap.set(candidateId, sortMecReviewRecords(records));
  }

  return reviewMap;
}

function buildReviewSummary(reviewRecords = []) {
  return deriveCandidateReviewState(reviewRecords);
}

function buildExportReviewSummary(exportReviewRecords = []) {
  return deriveCandidateExportReviewState(exportReviewRecords);
}

function buildMecReviewSummary(reviewRecords = []) {
  return deriveMecCandidateReviewState(reviewRecords);
}

function parseMecWorkspaceTimestamp(value) {
  if (!value) {
    return null;
  }
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function buildMecWorkspaceTitle(payload) {
  if (!payload) {
    return '-';
  }
  return payload.principle || payload.open_question || payload.case_description || payload.id;
}

function getMecEventMap(options = {}) {
  return new Map(listMecEvents(options).map(item => [item.id, item]));
}

function buildMecWorkspaceSourceLinkage(payload, candidateMap = new Map(), eventMap = new Map()) {
  const sourceEventIds = Array.isArray(payload && payload.source_event_ids) ? payload.source_event_ids.filter(Boolean) : [];
  const sourceCardIds = Array.isArray(payload && payload.source_card_ids) ? payload.source_card_ids.filter(Boolean) : [];
  const relatedCandidateIds = [
    payload && payload.linked_candidate_id ? payload.linked_candidate_id : null,
    payload && payload.linked_boundary_candidate_id ? payload.linked_boundary_candidate_id : null,
    payload && payload.refutes_candidate_id ? payload.refutes_candidate_id : null
  ].filter(Boolean);
  return {
    source_event_ids: sourceEventIds,
    source_event_count: sourceEventIds.length,
    source_card_ids: sourceCardIds,
    source_card_count: sourceCardIds.length,
    linked_candidate_id: payload && payload.linked_candidate_id ? payload.linked_candidate_id : null,
    linked_boundary_candidate_id: payload && payload.linked_boundary_candidate_id ? payload.linked_boundary_candidate_id : null,
    refutes_candidate_id: payload && payload.refutes_candidate_id ? payload.refutes_candidate_id : null,
    related_candidate_ids: relatedCandidateIds,
    pair_counterpart_id: payload && payload.candidate_type === 'invariant_candidate'
      ? (payload.linked_boundary_candidate_id || null)
      : payload && payload.candidate_type === 'boundary_candidate'
        ? (payload.linked_candidate_id || null)
        : null,
    pair_role: payload && payload.candidate_type === 'invariant_candidate'
      ? 'invariant'
      : payload && payload.candidate_type === 'boundary_candidate'
        ? 'boundary'
        : null,
    resolved_related_candidate_ids: relatedCandidateIds.filter(candidateId => candidateMap.has(candidateId)),
    unresolved_related_candidate_ids: relatedCandidateIds.filter(candidateId => !candidateMap.has(candidateId)),
    resolved_source_event_ids: sourceEventIds.filter(eventId => eventMap.has(eventId)),
    unresolved_source_event_ids: sourceEventIds.filter(eventId => !eventMap.has(eventId))
  };
}

function buildMecWorkspaceUnresolvedReferences(payload, sourceLinkage, candidateMap = new Map(), eventMap = new Map()) {
  const unresolvedReferences = [];
  if (payload && payload.candidate_type === 'invariant_candidate' && payload.linked_boundary_candidate_id && !candidateMap.has(payload.linked_boundary_candidate_id)) {
    unresolvedReferences.push({
      reference_kind: 'linked_boundary_candidate',
      reference_id: payload.linked_boundary_candidate_id,
      risk_code: 'missing_linked_boundary_candidate',
      label: 'Linked boundary candidate is missing from the current runtime candidate set.'
    });
  }
  if (payload && payload.candidate_type === 'boundary_candidate' && payload.linked_candidate_id && !candidateMap.has(payload.linked_candidate_id)) {
    unresolvedReferences.push({
      reference_kind: 'linked_candidate',
      reference_id: payload.linked_candidate_id,
      risk_code: 'missing_linked_candidate',
      label: 'Linked target candidate is missing from the current runtime candidate set.'
    });
  }
  if (payload && payload.candidate_type === 'counterexample_candidate' && payload.refutes_candidate_id && !candidateMap.has(payload.refutes_candidate_id)) {
    unresolvedReferences.push({
      reference_kind: 'refuted_candidate',
      reference_id: payload.refutes_candidate_id,
      risk_code: 'missing_refuted_candidate',
      label: 'Refuted candidate is missing from the current runtime candidate set.'
    });
  }
  for (const eventId of sourceLinkage.unresolved_source_event_ids || []) {
    unresolvedReferences.push({
      reference_kind: 'source_event',
      reference_id: eventId,
      risk_code: 'missing_source_event',
      label: 'Source event is missing from the current runtime event set.'
    });
  }
  return unresolvedReferences.map(item => ({
    ...item,
    present_in_event_runtime: item.reference_kind === 'source_event' ? eventMap.has(item.reference_id) : undefined
  }));
}

function buildMecWorkspaceControlReadiness(reviewSummary, unresolvedReferences = []) {
  const reviewable = Boolean(reviewSummary && reviewSummary.reviewable);
  const terminal = Boolean(reviewSummary && reviewSummary.terminal);
  const currentState = reviewSummary && reviewSummary.current_state ? reviewSummary.current_state : 'proposal_only';
  return {
    reviewable,
    terminal,
    available_outcomes: reviewable ? ['stabilize', 'reject'] : [],
    can_stabilize: reviewable,
    can_reject: reviewable,
    blocked_reason: reviewable ? null : `terminal review state: ${currentState}`,
    attention_required: unresolvedReferences.length > 0,
    unresolved_runtime_reference_count: unresolvedReferences.length
  };
}

function buildMecWorkspaceEvidenceContext(payload, sourceLinkage = {}, unresolvedReferences = [], candidateMap = new Map(), eventMap = new Map()) {
  const relatedCandidateIds = Array.isArray(sourceLinkage.related_candidate_ids) ? sourceLinkage.related_candidate_ids : [];
  const sourceEventIds = Array.isArray(sourceLinkage.source_event_ids) ? sourceLinkage.source_event_ids : [];
  const sourceCardIds = Array.isArray(sourceLinkage.source_card_ids) ? sourceLinkage.source_card_ids : [];
  const resolvedRelatedCandidateIds = Array.isArray(sourceLinkage.resolved_related_candidate_ids) ? sourceLinkage.resolved_related_candidate_ids : [];
  const unresolvedRelatedCandidateIds = Array.isArray(sourceLinkage.unresolved_related_candidate_ids) ? sourceLinkage.unresolved_related_candidate_ids : [];
  const resolvedSourceEventIds = Array.isArray(sourceLinkage.resolved_source_event_ids) ? sourceLinkage.resolved_source_event_ids : [];
  const unresolvedSourceEventIds = Array.isArray(sourceLinkage.unresolved_source_event_ids) ? sourceLinkage.unresolved_source_event_ids : [];
  const pairCounterpartId = sourceLinkage.pair_counterpart_id || null;
  const pairResolved = Boolean(pairCounterpartId && candidateMap.has(pairCounterpartId));
  const totalReferenceCount = relatedCandidateIds.length + sourceEventIds.length + sourceCardIds.length;
  const unresolvedReferenceCount = unresolvedReferences.length;
  return {
    integrity_state: unresolvedReferenceCount > 0 ? 'degraded' : (totalReferenceCount > 0 ? 'intact' : 'minimal'),
    attention_required: unresolvedReferenceCount > 0,
    total_reference_count: totalReferenceCount,
    resolved_reference_count: totalReferenceCount - unresolvedReferenceCount,
    unresolved_reference_count: unresolvedReferenceCount,
    source_event_count: sourceEventIds.length,
    resolved_source_event_count: resolvedSourceEventIds.length,
    unresolved_source_event_count: unresolvedSourceEventIds.length,
    source_event_context: sourceEventIds.map(eventId => {
      const event = eventMap.get(eventId) || null;
      return {
        event_id: eventId,
        resolved: Boolean(event),
        summary: event ? event.summary || null : null,
        event_type: event ? event.event_type || null : null,
        status: event ? event.status || null : null
      };
    }),
    source_card_count: sourceCardIds.length,
    related_candidate_count: relatedCandidateIds.length,
    resolved_related_candidate_count: resolvedRelatedCandidateIds.length,
    unresolved_related_candidate_count: unresolvedRelatedCandidateIds.length,
    pair_role: sourceLinkage.pair_role || null,
    pair_counterpart_id: pairCounterpartId,
    pair_integrity: pairCounterpartId ? (pairResolved ? 'resolved' : 'unresolved') : 'not_applicable',
    reference_signals: unresolvedReferences.map(item => ({
      reference_kind: item.reference_kind,
      reference_id: item.reference_id,
      risk_code: item.risk_code,
      label: item.label
    })),
    evidence_summary: unresolvedReferenceCount > 0
      ? `Reference integrity is degraded by ${unresolvedReferenceCount} unresolved runtime reference(s).`
      : totalReferenceCount > 0
        ? `Reference integrity is intact across ${totalReferenceCount} visible linkage signal(s).`
        : `Only minimal lineage signals are available on this workspace item.`
  };
}

function buildMecWorkspaceReviewHistoryContext(reviewSummary, latestReview, reviewRecords = []) {
  const recentHistory = Array.isArray(reviewSummary && reviewSummary.outcome_history)
    ? reviewSummary.outcome_history.slice(-3).reverse()
    : [];
  const validReviewCount = Number(reviewSummary && reviewSummary.valid_review_count || 0);
  const invalidReviewCount = Number(reviewSummary && reviewSummary.invalid_review_count || 0);
  const totalReviewCount = Number(reviewSummary && reviewSummary.review_count || 0);
  const terminal = Boolean(reviewSummary && reviewSummary.terminal);
  const currentState = reviewSummary && reviewSummary.current_state ? reviewSummary.current_state : 'proposal_only';
  return {
    total_review_count: totalReviewCount,
    valid_review_count: validReviewCount,
    invalid_review_count: invalidReviewCount,
    latest_review_outcome: latestReview ? latestReview.review_outcome : null,
    latest_reviewed_at: latestReview ? latestReview.reviewed_at : null,
    latest_review_source: latestReview ? latestReview.review_source || null : null,
    history_state: totalReviewCount < 1
      ? 'awaiting_first_review'
      : terminal
        ? 'terminal_history'
        : 'active_history',
    history_summary: totalReviewCount < 1
      ? 'No raw review records exist yet.'
      : terminal
        ? `History is terminal at ${currentState} after ${totalReviewCount} review record(s).`
        : `History remains reviewable with ${totalReviewCount} review record(s).`,
    recent_reviews: recentHistory.map(item => {
      const fullRecord = reviewRecords.find(record => record.review_id === item.review_id) || null;
      return {
        review_id: item.review_id,
        review_outcome: item.review_outcome,
        reviewed_at: item.reviewed_at,
        review_source: fullRecord ? fullRecord.review_source || null : null,
        reviewer_mode: fullRecord ? fullRecord.reviewer_mode || null : null
      };
    })
  };
}

function buildMecWorkspaceRelatedCandidates(payload, candidateMap = new Map(), reviewMap = new Map()) {
  const sourceEventIds = new Set(Array.isArray(payload && payload.source_event_ids) ? payload.source_event_ids.filter(Boolean) : []);
  const sourceCardIds = new Set(Array.isArray(payload && payload.source_card_ids) ? payload.source_card_ids.filter(Boolean) : []);
  const explicitRelatedIds = new Set([
    payload && payload.linked_candidate_id ? payload.linked_candidate_id : null,
    payload && payload.linked_boundary_candidate_id ? payload.linked_boundary_candidate_id : null,
    payload && payload.refutes_candidate_id ? payload.refutes_candidate_id : null
  ].filter(Boolean));
  const related = [];
  for (const [candidateId, candidate] of candidateMap.entries()) {
    if (!candidate || candidateId === (payload && payload.id)) {
      continue;
    }
    const relationSignals = [];
    if (explicitRelatedIds.has(candidateId)) {
      relationSignals.push('explicit_linkage');
    }
    const sharedEventIds = Array.isArray(candidate.source_event_ids)
      ? candidate.source_event_ids.filter(eventId => sourceEventIds.has(eventId))
      : [];
    if (sharedEventIds.length > 0) {
      relationSignals.push(`shared_source_event:${sharedEventIds.join(',')}`);
    }
    const sharedCardIds = Array.isArray(candidate.source_card_ids)
      ? candidate.source_card_ids.filter(cardId => sourceCardIds.has(cardId))
      : [];
    if (sharedCardIds.length > 0) {
      relationSignals.push(`shared_source_card:${sharedCardIds.join(',')}`);
    }
    if (relationSignals.length === 0) {
      continue;
    }
    const reviewSummary = buildMecReviewSummary(reviewMap.get(candidateId) || []);
    related.push({
      candidate_id: candidateId,
      title: buildMecWorkspaceTitle(candidate),
      candidate_type: candidate.candidate_type || null,
      status: candidate.status || null,
      freshness_state: candidate.freshness_state || null,
      current_review_state: reviewSummary.current_state,
      reviewable: reviewSummary.reviewable,
      terminal: reviewSummary.terminal,
      relation_signals: relationSignals,
      shared_source_event_count: sharedEventIds.length,
      shared_source_card_count: sharedCardIds.length,
      explicit_linkage: explicitRelatedIds.has(candidateId)
    });
  }
  return related.sort((left, right) => {
    const explicitRank = Number(Boolean(right.explicit_linkage)) - Number(Boolean(left.explicit_linkage));
    if (explicitRank !== 0) {
      return explicitRank;
    }
    const eventRank = right.shared_source_event_count - left.shared_source_event_count;
    if (eventRank !== 0) {
      return eventRank;
    }
    const cardRank = right.shared_source_card_count - left.shared_source_card_count;
    if (cardRank !== 0) {
      return cardRank;
    }
    return String(left.candidate_id).localeCompare(String(right.candidate_id));
  }).slice(0, 6);
}

function buildMecWorkspaceStateExplanation(reviewSummary, controlReadiness, unresolvedReferences = [], sourceLinkage = {}, reviewHistoryContext = null, relatedCandidates = []) {
  const currentState = reviewSummary && reviewSummary.current_state ? reviewSummary.current_state : 'proposal_only';
  const reviewable = Boolean(reviewSummary && reviewSummary.reviewable);
  const terminal = Boolean(reviewSummary && reviewSummary.terminal);
  const explanationLines = [];
  if (reviewable) {
    explanationLines.push(`Current derived state ${currentState} remains reviewable, so minimal outcomes stay available.`);
  } else {
    explanationLines.push(`Current derived state ${currentState} is terminal, so no further review outcomes are available.`);
  }
  if (unresolvedReferences.length > 0) {
    explanationLines.push(`${unresolvedReferences.length} unresolved runtime reference(s) are still visible in the workspace context.`);
  } else if ((sourceLinkage.related_candidate_ids || []).length > 0 || (sourceLinkage.source_event_ids || []).length > 0) {
    explanationLines.push('Visible linkage and source references currently resolve without runtime gaps.');
  } else {
    explanationLines.push('Only minimal linkage evidence is available on this workspace item.');
  }
  if (reviewHistoryContext && reviewHistoryContext.total_review_count > 0) {
    explanationLines.push(`Review history currently contains ${reviewHistoryContext.total_review_count} raw review record(s).`);
  } else {
    explanationLines.push('No raw review history exists yet, so this desk view is still anchored on the raw candidate artifact only.');
  }
  if (relatedCandidates.length > 0) {
    explanationLines.push(`${relatedCandidates.length} related candidate context item(s) are visible from existing linkage or shared-source signals.`);
  }
  return {
    current_state: currentState,
    reviewable,
    terminal,
    blocked_reason: controlReadiness && controlReadiness.blocked_reason ? controlReadiness.blocked_reason : null,
    unresolved_reference_count: unresolvedReferences.length,
    related_candidate_count: relatedCandidates.length,
    explanation_lines: explanationLines,
    missing_visible_prerequisites: unresolvedReferences.map(item => item.label)
  };
}

function buildMecWorkspaceFocusContext(reviewSummary, controlReadiness, unresolvedReferences = [], evidenceContext = null, reviewHistoryContext = null, relatedCandidates = [], sourceLinkage = {}) {
  const reviewable = Boolean(reviewSummary && reviewSummary.reviewable);
  const terminal = Boolean(reviewSummary && reviewSummary.terminal);
  const unresolvedCount = unresolvedReferences.length;
  const relatedCount = Array.isArray(relatedCandidates) ? relatedCandidates.length : 0;
  const pairCounterpartId = sourceLinkage && sourceLinkage.pair_counterpart_id ? sourceLinkage.pair_counterpart_id : null;
  const historyState = reviewHistoryContext && reviewHistoryContext.history_state ? reviewHistoryContext.history_state : 'awaiting_first_review';
  let focusBucket = 'single_item_context';
  if (reviewable && unresolvedCount > 0) {
    focusBucket = 'reviewable_reference_tension';
  } else if (pairCounterpartId) {
    focusBucket = 'linked_pair_review';
  } else if (reviewable && relatedCount > 0) {
    focusBucket = 'comparative_review_zone';
  } else if (reviewable && historyState === 'active_history') {
    focusBucket = 'history_carry_forward';
  } else if (terminal && unresolvedCount > 0) {
    focusBucket = 'terminal_reference_gap';
  } else if (terminal && historyState === 'terminal_history') {
    focusBucket = 'recent_terminal_decision';
  }
  const focusSignals = [
    reviewable ? 'reviewable_now' : 'not_reviewable',
    terminal ? 'terminal_state' : 'non_terminal_state',
    unresolvedCount > 0 ? `unresolved_reference_count:${unresolvedCount}` : null,
    pairCounterpartId ? 'paired_workspace_case' : null,
    relatedCount > 0 ? `related_candidates:${relatedCount}` : null,
    evidenceContext && evidenceContext.integrity_state ? `integrity:${evidenceContext.integrity_state}` : null,
    historyState ? `history:${historyState}` : null
  ].filter(Boolean);
  const focusSummary = focusBucket === 'reviewable_reference_tension'
    ? `Reviewable now, but visible runtime references still need attention.`
    : focusBucket === 'linked_pair_review'
      ? `This workspace item belongs to a linked pair and is best reviewed in comparison with its counterpart.`
      : focusBucket === 'comparative_review_zone'
        ? `This workspace item sits in a comparative zone with related candidates sharing existing linkage or source signals.`
        : focusBucket === 'history_carry_forward'
          ? `This workspace item remains reviewable while already carrying visible review history.`
          : focusBucket === 'terminal_reference_gap'
            ? `This workspace item is terminal, but visible reference gaps still shape its review context.`
            : focusBucket === 'recent_terminal_decision'
              ? `This workspace item is terminal and best read against its recent decision history.`
              : `This workspace item currently reads as a mostly standalone review context.`;
  return {
    focus_bucket: focusBucket,
    focus_signals: focusSignals,
    focus_summary: focusSummary,
    compare_ready: Boolean(pairCounterpartId || relatedCount > 0)
  };
}

function buildMecWorkspaceCompareContext(payload, candidateMap = new Map(), eventMap = new Map(), reviewMap = new Map(), sourceLinkage = {}, relatedCandidates = []) {
  const currentSourceEvents = new Set(Array.isArray(payload && payload.source_event_ids) ? payload.source_event_ids.filter(Boolean) : []);
  const currentSourceCards = new Set(Array.isArray(payload && payload.source_card_ids) ? payload.source_card_ids.filter(Boolean) : []);
  const currentExplicitRelatedIds = new Set(Array.isArray(sourceLinkage && sourceLinkage.related_candidate_ids) ? sourceLinkage.related_candidate_ids : []);
  const currentPairCounterpartId = sourceLinkage && sourceLinkage.pair_counterpart_id ? sourceLinkage.pair_counterpart_id : null;
  const currentReviewSummary = buildMecReviewSummary(reviewMap.get(payload.id) || []);
  const currentHistoryState = currentReviewSummary.review_count < 1
    ? 'awaiting_first_review'
    : currentReviewSummary.terminal
      ? 'terminal_history'
      : 'active_history';
  const currentUnresolved = buildMecWorkspaceUnresolvedReferences(payload, sourceLinkage, candidateMap, eventMap);
  const compareCandidates = [];
  for (const [candidateId, candidate] of candidateMap.entries()) {
    if (!candidate || candidateId === payload.id) {
      continue;
    }
    const candidateSourceLinkage = buildMecWorkspaceSourceLinkage(candidate, candidateMap, eventMap);
    const candidateReviewSummary = buildMecReviewSummary(reviewMap.get(candidateId) || []);
    const candidateHistoryState = candidateReviewSummary.review_count < 1
      ? 'awaiting_first_review'
      : candidateReviewSummary.terminal
        ? 'terminal_history'
        : 'active_history';
    const candidateUnresolved = buildMecWorkspaceUnresolvedReferences(candidate, candidateSourceLinkage, candidateMap, eventMap);
    const compareSignals = [];
    if (currentExplicitRelatedIds.has(candidateId)) {
      compareSignals.push('explicit_linkage');
    }
    if (currentPairCounterpartId && currentPairCounterpartId === candidateId) {
      compareSignals.push('pair_counterpart');
    }
    const sharedSourceEvents = Array.isArray(candidate.source_event_ids)
      ? candidate.source_event_ids.filter(eventId => currentSourceEvents.has(eventId))
      : [];
    if (sharedSourceEvents.length > 0) {
      compareSignals.push(`shared_source_event:${sharedSourceEvents.join(',')}`);
    }
    const sharedSourceCards = Array.isArray(candidate.source_card_ids)
      ? candidate.source_card_ids.filter(cardId => currentSourceCards.has(cardId))
      : [];
    if (sharedSourceCards.length > 0) {
      compareSignals.push(`shared_source_card:${sharedSourceCards.join(',')}`);
    }
    if (candidateReviewSummary.reviewable === currentReviewSummary.reviewable) {
      compareSignals.push(`same_reviewable:${candidateReviewSummary.reviewable ? 'yes' : 'no'}`);
    }
    if (candidateReviewSummary.current_state === currentReviewSummary.current_state) {
      compareSignals.push(`same_review_state:${candidateReviewSummary.current_state}`);
    }
    if (candidateHistoryState === currentHistoryState) {
      compareSignals.push(`same_history_state:${candidateHistoryState}`);
    }
    if (candidateUnresolved.length > 0 && currentUnresolved.length > 0) {
      compareSignals.push(`shared_reference_tension:${Math.min(candidateUnresolved.length, currentUnresolved.length)}`);
    }
    if (compareSignals.length === 0) {
      continue;
    }
    compareCandidates.push({
      candidate_id: candidateId,
      title: buildMecWorkspaceTitle(candidate),
      candidate_type: candidate.candidate_type || null,
      current_review_state: candidateReviewSummary.current_state,
      reviewable: candidateReviewSummary.reviewable,
      terminal: candidateReviewSummary.terminal,
      unresolved_runtime_reference_count: candidateUnresolved.length,
      history_state: candidateHistoryState,
      compare_signals: compareSignals,
      explicit_linkage: currentExplicitRelatedIds.has(candidateId),
      pair_counterpart: currentPairCounterpartId === candidateId,
      shared_source_event_count: sharedSourceEvents.length,
      shared_source_card_count: sharedSourceCards.length
    });
  }
  compareCandidates.sort((left, right) => {
    const pairRank = Number(Boolean(right.pair_counterpart)) - Number(Boolean(left.pair_counterpart));
    if (pairRank !== 0) {
      return pairRank;
    }
    const explicitRank = Number(Boolean(right.explicit_linkage)) - Number(Boolean(left.explicit_linkage));
    if (explicitRank !== 0) {
      return explicitRank;
    }
    const eventRank = right.shared_source_event_count - left.shared_source_event_count;
    if (eventRank !== 0) {
      return eventRank;
    }
    const cardRank = right.shared_source_card_count - left.shared_source_card_count;
    if (cardRank !== 0) {
      return cardRank;
    }
    return String(left.candidate_id).localeCompare(String(right.candidate_id));
  });
  return {
    compare_summary: compareCandidates.length > 0
      ? `Compare against ${compareCandidates.length} workspace item(s) sharing explicit linkage, source overlap, review-state, history, or visible tension signals.`
      : `No comparative workspace context is currently derivable from existing signals.`,
    compare_candidates: compareCandidates.slice(0, 6),
    compare_ready: compareCandidates.length > 0,
    pair_counterpart_id: currentPairCounterpartId,
    related_candidate_count: Array.isArray(relatedCandidates) ? relatedCandidates.length : 0
  };
}

function buildMecWorkspaceDeltaContext(payload, reviewSummary, latestReview, unresolvedReferences = [], sourceLinkage = {}, evidenceContext = null, reviewHistoryContext = null, controlReadiness = null, focusContext = null, compareContext = null) {
  const latestReviewedAt = latestReview && latestReview.reviewed_at ? latestReview.reviewed_at : (reviewHistoryContext && reviewHistoryContext.latest_reviewed_at ? reviewHistoryContext.latest_reviewed_at : null);
  const createdAt = payload && payload.created_at ? payload.created_at : null;
  const updatedAt = payload && payload.updated_at ? payload.updated_at : createdAt;
  const anchorKind = latestReviewedAt ? 'latest_review' : (createdAt ? 'candidate_created' : 'workspace_visible_now');
  const anchorAt = latestReviewedAt || createdAt || updatedAt || null;
  const anchorTimestamp = parseMecWorkspaceTimestamp(anchorAt);
  const updatedTimestamp = parseMecWorkspaceTimestamp(updatedAt);
  const changedSinceAnchor = Boolean(anchorTimestamp !== null && updatedTimestamp !== null && updatedTimestamp > anchorTimestamp);
  const unresolvedCount = Array.isArray(unresolvedReferences) ? unresolvedReferences.length : 0;
  const totalReviewCount = Number(reviewHistoryContext && reviewHistoryContext.total_review_count || reviewSummary && reviewSummary.review_count || 0);
  const reviewable = Boolean(controlReadiness && controlReadiness.reviewable);
  const terminal = Boolean(controlReadiness && controlReadiness.terminal);
  const compareReady = Boolean(compareContext && compareContext.compare_ready);
  const focusBucket = focusContext && focusContext.focus_bucket ? focusContext.focus_bucket : 'single_item_context';
  const integrityState = evidenceContext && evidenceContext.integrity_state ? evidenceContext.integrity_state : 'minimal';
  const relatedCandidateCount = Number(compareContext && compareContext.related_candidate_count || 0);
  const totalReferenceCount = Number(evidenceContext && evidenceContext.total_reference_count || 0);
  let movementBucket = 'no_material_delta_visible';
  if (!latestReviewedAt) {
    movementBucket = unresolvedCount > 0 || compareReady ? 'first_read_attention' : 'first_read_baseline';
  } else if (changedSinceAnchor && reviewable && unresolvedCount > 0) {
    movementBucket = 'post_review_change_attention';
  } else if (changedSinceAnchor && reviewable) {
    movementBucket = 'post_review_change_reviewable';
  } else if (changedSinceAnchor && terminal) {
    movementBucket = 'post_review_change_terminal';
  } else if (reviewable && unresolvedCount > 0) {
    movementBucket = 'anchored_attention_without_visible_change';
  } else if (terminal) {
    movementBucket = 'terminal_without_visible_change';
  }
  const changeCategories = {
    review_anchor: latestReviewedAt ? 'review_anchor_present' : 'no_review_anchor',
    update_timing: anchorAt ? (changedSinceAnchor ? 'updated_after_anchor' : 'no_visible_update_after_anchor') : 'no_time_anchor',
    unresolved_gap: unresolvedCount > 0
      ? (changedSinceAnchor ? 'unresolved_gap_visible_after_anchor' : 'unresolved_gap_still_visible')
      : (changedSinceAnchor ? 'no_unresolved_gap_visible_after_anchor' : 'no_unresolved_gap_visible'),
    readiness: terminal
      ? (changedSinceAnchor ? 'terminal_after_anchor' : 'terminal_unchanged')
      : reviewable
        ? (changedSinceAnchor ? 'reviewable_after_anchor' : 'reviewable_unchanged')
        : 'not_reviewable',
    evidence: totalReferenceCount > 0
      ? (changedSinceAnchor ? 'lineage_visible_after_anchor' : 'lineage_stable')
      : 'minimal_lineage',
    review_history: totalReviewCount < 1
      ? 'no_review_history_yet'
      : totalReviewCount === 1
        ? 'single_review_anchor'
        : 'extended_review_history'
  };
  const deltaSignals = [
    `anchor:${anchorKind}`,
    latestReviewedAt ? 'latest_review_anchor_present' : 'no_latest_review_anchor',
    changedSinceAnchor ? 'updated_after_anchor' : 'no_visible_update_after_anchor',
    unresolvedCount > 0 ? `unresolved_reference_count:${unresolvedCount}` : 'unresolved_reference_count:0',
    `integrity:${integrityState}`,
    `focus:${focusBucket}`,
    compareReady ? 'compare_ready_now' : null,
    relatedCandidateCount > 0 ? `related_candidates:${relatedCandidateCount}` : null,
    totalReviewCount > 0 ? `review_records:${totalReviewCount}` : 'review_records:0'
  ].filter(Boolean);
  const deltaSummary = movementBucket === 'first_read_attention'
    ? 'No prior review anchor exists yet, and the currently visible workspace signals already justify a first focused read.'
    : movementBucket === 'first_read_baseline'
      ? 'No prior review anchor exists yet, and the current workspace view mostly establishes the first decision baseline.'
      : movementBucket === 'post_review_change_attention'
        ? 'The candidate artifact moved after the latest review anchor while visible runtime gaps still remain.'
        : movementBucket === 'post_review_change_reviewable'
          ? 'The candidate artifact moved after the latest review anchor and remains reviewable under the current workspace signals.'
          : movementBucket === 'post_review_change_terminal'
            ? 'The candidate artifact moved after a terminal review anchor, so the current read should be checked against that prior decision.'
            : movementBucket === 'anchored_attention_without_visible_change'
              ? 'No new post-review movement is visible, but unresolved runtime references still keep this item attention-bearing.'
              : movementBucket === 'terminal_without_visible_change'
                ? 'No new post-review movement is visible and the current terminal read still matches the latest visible decision anchor.'
                : 'No material change signal is currently visible beyond the existing review anchor.';
  const whyNow = !latestReviewedAt
    ? (unresolvedCount > 0
      ? 'A first review is still pending and unresolved runtime references remain visible.'
      : compareReady
        ? 'A first review is still pending and comparable neighboring workspace objects are already visible.'
        : 'A first review is still pending, so the next read establishes the initial decision anchor.')
    : changedSinceAnchor && unresolvedCount > 0
      ? 'The raw candidate artifact changed after the latest review anchor and visible reference gaps are still present now.'
      : changedSinceAnchor && compareReady
        ? 'The raw candidate artifact changed after the latest review anchor and the current desk can contrast it against comparable neighbors.'
        : changedSinceAnchor && reviewable
          ? 'The raw candidate artifact changed after the latest review anchor while the workspace still permits a minimal review write.'
          : reviewable && unresolvedCount > 0
            ? 'Even without a newer raw candidate update, unresolved runtime references still keep the current review posture open.'
            : null;
  const whyNotNow = whyNow
    ? null
    : terminal
      ? 'No material post-anchor movement is visible, and the latest terminal decision still matches the currently visible workspace signals.'
      : latestReviewedAt
        ? 'No material post-anchor movement is visible beyond the current workspace baseline.'
        : 'No prior review anchor exists yet, but the visible workspace signals do not currently indicate stronger decision movement.';
  return {
    anchor_kind: anchorKind,
    anchor_at: anchorAt,
    current_updated_at: updatedAt,
    changed_since_anchor: changedSinceAnchor,
    movement_bucket: movementBucket,
    change_categories: changeCategories,
    delta_signals: deltaSignals,
    delta_summary: deltaSummary,
    why_now: whyNow,
    why_not_now: whyNotNow,
    review_attention_now: Boolean(whyNow),
    stable_since_anchor: Boolean(latestReviewedAt && !changedSinceAnchor && unresolvedCount < 1),
    compare_delta_ready: Boolean(compareReady && (changedSinceAnchor || !latestReviewedAt))
  };
}

function buildMecWorkspaceContradictionContext(reviewSummary, controlReadiness = null, unresolvedReferences = [], evidenceContext = null, reviewHistoryContext = null, focusContext = null, compareContext = null, deltaContext = null) {
  const reviewable = Boolean(reviewSummary && reviewSummary.reviewable);
  const terminal = Boolean(reviewSummary && reviewSummary.terminal);
  const unresolvedCount = Array.isArray(unresolvedReferences) ? unresolvedReferences.length : 0;
  const totalReferenceCount = Number(evidenceContext && evidenceContext.total_reference_count || 0);
  const totalReviewCount = Number(reviewHistoryContext && reviewHistoryContext.total_review_count || 0);
  const compareReady = Boolean(compareContext && compareContext.compare_ready);
  const integrityState = evidenceContext && evidenceContext.integrity_state ? evidenceContext.integrity_state : 'minimal';
  const contradictionSignals = [];
  if (reviewable && unresolvedCount > 0) {
    contradictionSignals.push('Review remains open while unresolved runtime references are still visible.');
  }
  if (reviewable && integrityState === 'degraded') {
    contradictionSignals.push('The workspace stays reviewable even though evidence integrity is currently degraded.');
  }
  if (terminal && deltaContext && deltaContext.changed_since_anchor) {
    contradictionSignals.push('The raw candidate artifact changed after a terminal review anchor.');
  }
  if (compareReady && unresolvedCount > 0) {
    contradictionSignals.push('Comparable neighboring context is visible, but reference gaps still weaken the current read.');
  }
  if (totalReviewCount > 0 && totalReferenceCount < 1) {
    contradictionSignals.push('Review history is present, but only minimal current linkage evidence is visible.');
  }
  if (deltaContext && deltaContext.review_attention_now && deltaContext.changed_since_anchor === false && unresolvedCount > 0) {
    contradictionSignals.push('No newer post-anchor artifact change is visible, yet unresolved runtime references still keep the item attention-bearing.');
  }
  if (focusContext && focusContext.focus_bucket === 'recent_terminal_decision' && controlReadiness && controlReadiness.reviewable) {
    contradictionSignals.push('Terminal-looking decision history is visible while the current control readiness still reads as reviewable.');
  }
  return {
    contradiction_present: contradictionSignals.length > 0,
    contradiction_signals: contradictionSignals,
    contradiction_summary: contradictionSignals.length > 0
      ? `The current workspace view contains ${contradictionSignals.length} visible contradiction signal(s) that should be read before deciding.`
      : 'No stronger contradiction signal is currently visible in the canonical workspace view.'
  };
}

function buildMecWorkspaceDecisionPacketContext(reviewSummary, latestReview, controlReadiness = null, unresolvedReferences = [], sourceLinkage = {}, evidenceContext = null, reviewHistoryContext = null, relatedCandidates = [], stateExplanation = null, focusContext = null, compareContext = null, deltaContext = null, contradictionContext = null) {
  const supportSignals = [];
  const frictionSignals = [];
  const missingSignals = [];
  const unresolvedCount = Array.isArray(unresolvedReferences) ? unresolvedReferences.length : 0;
  const totalReferenceCount = Number(evidenceContext && evidenceContext.total_reference_count || 0);
  const totalReviewCount = Number(reviewHistoryContext && reviewHistoryContext.total_review_count || 0);
  const compareReady = Boolean(compareContext && compareContext.compare_ready);
  const contradictionCount = Number(contradictionContext && Array.isArray(contradictionContext.contradiction_signals) ? contradictionContext.contradiction_signals.length : 0);
  const integrityState = evidenceContext && evidenceContext.integrity_state ? evidenceContext.integrity_state : 'minimal';
  const reviewable = Boolean(controlReadiness && controlReadiness.reviewable);
  const terminal = Boolean(controlReadiness && controlReadiness.terminal);

  if (integrityState === 'intact') {
    supportSignals.push('Visible linkage and evidence currently resolve without runtime gaps.');
  }
  if (totalReviewCount > 0 && latestReview) {
    supportSignals.push(`A visible review anchor already exists through ${totalReviewCount} raw review record(s).`);
  }
  if (compareReady) {
    supportSignals.push('Comparable neighboring workspace context is available for cross-reading.');
  }
  if (deltaContext && deltaContext.stable_since_anchor) {
    supportSignals.push('The visible workspace view appears stable since the latest decision anchor.');
  }
  if (sourceLinkage && sourceLinkage.pair_counterpart_id && evidenceContext && evidenceContext.pair_integrity === 'resolved') {
    supportSignals.push('The linked pair counterpart is visibly resolved in the current workspace.');
  }

  if (unresolvedCount > 0) {
    frictionSignals.push(`${unresolvedCount} unresolved runtime reference(s) still press against a clean decision read.`);
  }
  if (integrityState === 'degraded') {
    frictionSignals.push('Evidence integrity is degraded in the current workspace view.');
  }
  if (deltaContext && deltaContext.review_attention_now) {
    frictionSignals.push('Visible change signals indicate that the current read still needs renewed attention now.');
  }
  if (contradictionCount > 0) {
    frictionSignals.push(`${contradictionCount} contradiction signal(s) remain visible in the current workspace view.`);
  }
  if (terminal) {
    frictionSignals.push(`The current derived review state is already terminal at ${reviewSummary && reviewSummary.current_state ? reviewSummary.current_state : 'proposal_only'}.`);
  }

  if (totalReferenceCount < 1) {
    missingSignals.push('Only minimal visible linkage evidence is available right now.');
  }
  if (totalReviewCount < 1) {
    missingSignals.push('No visible review history anchor exists yet.');
  }
  if (stateExplanation && Array.isArray(stateExplanation.missing_visible_prerequisites)) {
    for (const prerequisite of stateExplanation.missing_visible_prerequisites) {
      missingSignals.push(`Missing visible prerequisite: ${prerequisite}`);
    }
  }
  if (!compareReady && Array.isArray(relatedCandidates) && relatedCandidates.length < 1) {
    missingSignals.push('No stronger compare or related-candidate context is currently visible.');
  }

  let decisionReadiness = 'decision_underconstrained';
  if (terminal) {
    decisionReadiness = 'decision_closed';
  } else if (unresolvedCount > 0 || contradictionCount > 0) {
    decisionReadiness = 'decision_fragile';
  } else if (totalReferenceCount > 0 && totalReviewCount > 0) {
    decisionReadiness = 'decision_ready';
  }

  const decisionSummary = decisionReadiness === 'decision_ready'
    ? 'The current workspace view looks decision-ready because visible evidence, history and linkage are present without stronger contradiction pressure.'
    : decisionReadiness === 'decision_fragile'
      ? 'The current workspace view is decision-fragile because visible friction or contradiction signals still qualify the read.'
      : decisionReadiness === 'decision_closed'
        ? 'The current workspace view is decision-closed because a terminal review state is already visible.'
        : 'The current workspace view is still underconstrained because visible decision support remains too thin.';

  return {
    decision_readiness: decisionReadiness,
    support_signals: supportSignals,
    friction_signals: frictionSignals,
    missing_signals: missingSignals,
    contradiction_count: contradictionCount,
    decision_summary: decisionSummary,
    stabilization_readable: supportSignals.length > 0,
    rejection_pressure_visible: frictionSignals.length > 0,
    open_gap_count: missingSignals.length
  };
}

function buildMecReviewRationaleSnapshot(workspaceItem) {
  if (!workspaceItem) {
    return null;
  }
  const decisionPacket = workspaceItem.decision_packet_context || {};
  const contradiction = workspaceItem.contradiction_context || {};
  const delta = workspaceItem.delta_context || {};
  const evidence = workspaceItem.evidence_context || {};
  const controlReadiness = workspaceItem.control_readiness || {};
  const unresolvedReferences = Array.isArray(workspaceItem.unresolved_runtime_references) ? workspaceItem.unresolved_runtime_references : [];
  return {
    snapshot_version: 'phase3i-mec-review-rationale-snapshot/v1',
    candidate_id: workspaceItem.candidate_id || workspaceItem.id || null,
    captured_at: new Date().toISOString(),
    decision_readiness: decisionPacket.decision_readiness || null,
    decision_summary: decisionPacket.decision_summary || null,
    support_signals: Array.isArray(decisionPacket.support_signals) ? decisionPacket.support_signals.slice(0, 4) : [],
    friction_signals: Array.isArray(decisionPacket.friction_signals) ? decisionPacket.friction_signals.slice(0, 4) : [],
    missing_signals: Array.isArray(decisionPacket.missing_signals) ? decisionPacket.missing_signals.slice(0, 4) : [],
    contradiction_signals: Array.isArray(contradiction.contradiction_signals) ? contradiction.contradiction_signals.slice(0, 4) : [],
    why_now: delta.why_now || null,
    why_not_now: delta.why_not_now || null,
    delta_movement_bucket: delta.movement_bucket || null,
    unresolved_runtime_reference_count: unresolvedReferences.length,
    unresolved_runtime_reference_labels: unresolvedReferences.map(item => item.label).slice(0, 4),
    evidence_integrity_state: evidence.integrity_state || null,
    control_reviewable: Boolean(controlReadiness.reviewable),
    control_terminal: Boolean(controlReadiness.terminal)
  };
}

function buildMecWorkspaceReviewTraceContext(latestReview = null, reviewSummary = null, decisionPacketContext = null, contradictionContext = null, deltaContext = null) {
  const rationaleSnapshot = latestReview && latestReview.rationale_snapshot && typeof latestReview.rationale_snapshot === 'object'
    ? latestReview.rationale_snapshot
    : null;
  if (!latestReview) {
    return {
      trace_present: false,
      trace_summary: 'No review action has been written yet, so no action rationale trace is available.',
      latest_action_outcome: null,
      latest_action_at: null,
      decision_readiness_at_write: null,
      support_at_write: [],
      friction_at_write: [],
      missing_at_write: [],
      contradiction_at_write: [],
      why_now_at_write: null,
      why_not_now_at_write: null
    };
  }
  const supportAtWrite = rationaleSnapshot && Array.isArray(rationaleSnapshot.support_signals)
    ? rationaleSnapshot.support_signals
    : Array.isArray(decisionPacketContext && decisionPacketContext.support_signals)
      ? decisionPacketContext.support_signals.slice(0, 4)
      : [];
  const frictionAtWrite = rationaleSnapshot && Array.isArray(rationaleSnapshot.friction_signals)
    ? rationaleSnapshot.friction_signals
    : Array.isArray(decisionPacketContext && decisionPacketContext.friction_signals)
      ? decisionPacketContext.friction_signals.slice(0, 4)
      : [];
  const missingAtWrite = rationaleSnapshot && Array.isArray(rationaleSnapshot.missing_signals)
    ? rationaleSnapshot.missing_signals
    : Array.isArray(decisionPacketContext && decisionPacketContext.missing_signals)
      ? decisionPacketContext.missing_signals.slice(0, 4)
      : [];
  const contradictionAtWrite = rationaleSnapshot && Array.isArray(rationaleSnapshot.contradiction_signals)
    ? rationaleSnapshot.contradiction_signals
    : Array.isArray(contradictionContext && contradictionContext.contradiction_signals)
      ? contradictionContext.contradiction_signals.slice(0, 4)
      : [];
  const decisionReadinessAtWrite = rationaleSnapshot && rationaleSnapshot.decision_readiness
    ? rationaleSnapshot.decision_readiness
    : decisionPacketContext && decisionPacketContext.decision_readiness
      ? decisionPacketContext.decision_readiness
      : null;
  const traceSummary = `Latest review write recorded ${latestReview.review_outcome || 'unknown'} from a ${decisionReadinessAtWrite || 'trace-unspecified'} desk read with ${supportAtWrite.length} support, ${frictionAtWrite.length} friction, ${missingAtWrite.length} missing, and ${contradictionAtWrite.length} contradiction signal(s).`;
  return {
    trace_present: true,
    trace_summary: traceSummary,
    latest_action_outcome: latestReview.review_outcome || null,
    latest_action_at: latestReview.reviewed_at || null,
    latest_review_id: latestReview.review_id || null,
    latest_review_source: latestReview.review_source || null,
    decision_readiness_at_write: decisionReadinessAtWrite,
    support_at_write: supportAtWrite,
    friction_at_write: frictionAtWrite,
    missing_at_write: missingAtWrite,
    contradiction_at_write: contradictionAtWrite,
    why_now_at_write: rationaleSnapshot ? (rationaleSnapshot.why_now || null) : (deltaContext ? deltaContext.why_now || null : null),
    why_not_now_at_write: rationaleSnapshot ? (rationaleSnapshot.why_not_now || null) : (deltaContext ? deltaContext.why_not_now || null : null),
    delta_movement_bucket_at_write: rationaleSnapshot ? (rationaleSnapshot.delta_movement_bucket || null) : (deltaContext ? deltaContext.movement_bucket || null : null)
  };
}

function buildMecWorkspaceChallengeContext(payload, latestReview = null, sourceLinkage = {}, unresolvedReferences = [], evidenceContext = null, reviewHistoryContext = null, relatedCandidates = [], deltaContext = null, contradictionContext = null, decisionPacketContext = null, reviewTraceContext = null, candidateMap = new Map()) {
  const candidateType = payload && payload.candidate_type ? payload.candidate_type : null;
  const primaryCandidateId = payload && payload.id ? payload.id : null;
  const challengeable = candidateType === 'invariant_candidate';
  const contradictionSignals = Array.isArray(contradictionContext && contradictionContext.contradiction_signals)
    ? contradictionContext.contradiction_signals
    : [];
  const unresolvedCount = Array.isArray(unresolvedReferences) ? unresolvedReferences.length : 0;
  const decisionMissingSignals = Array.isArray(decisionPacketContext && decisionPacketContext.missing_signals)
    ? decisionPacketContext.missing_signals
    : [];
  const existingCounterexamples = [];
  for (const candidate of candidateMap.values()) {
    if (candidate && candidate.candidate_type === 'counterexample_candidate' && candidate.refutes_candidate_id === primaryCandidateId) {
      existingCounterexamples.push({
        candidate_id: candidate.id,
        title: buildMecWorkspaceTitle(candidate),
        status: candidate.status || null,
        created_at: candidate.created_at || null,
        updated_at: candidate.updated_at || null
      });
    }
  }
  existingCounterexamples.sort((left, right) => parseMecWorkspaceTimestamp(right.updated_at || right.created_at) - parseMecWorkspaceTimestamp(left.updated_at || left.created_at));
  const pairCounterpartId = sourceLinkage && sourceLinkage.pair_counterpart_id ? sourceLinkage.pair_counterpart_id : null;
  const pairIntegrity = evidenceContext && evidenceContext.pair_integrity ? evidenceContext.pair_integrity : 'not_applicable';
  const challengeSignals = [];
  const stabilizingSignals = [];
  const challengeFlags = [];

  if (contradictionSignals.length > 0) {
    challengeSignals.push('Visible contradiction signals already press against a clean current read.');
    challengeFlags.push('contradiction_visible_now');
  }
  if (unresolvedCount > 0) {
    challengeSignals.push(`${unresolvedCount} unresolved runtime reference(s) still weaken the visible workspace read.`);
    challengeFlags.push('reference_gap_visible');
  }
  if (existingCounterexamples.length > 0) {
    challengeSignals.push(`${existingCounterexamples.length} existing counterexample candidate(s) already refute this primary candidate.`);
    challengeFlags.push('counterexample_history_present');
  }
  if (deltaContext && deltaContext.review_attention_now) {
    challengeSignals.push('Current delta context still marks this item as attention-bearing now.');
    challengeFlags.push('delta_attention_visible');
  }
  if (decisionMissingSignals.length > 0) {
    challengeSignals.push('Decision packet still exposes missing or open gaps around this candidate.');
    challengeFlags.push('decision_gaps_visible');
  }
  if (reviewTraceContext && reviewTraceContext.trace_present && reviewTraceContext.decision_readiness_at_write === 'decision_fragile') {
    challengeSignals.push('The latest visible review write was recorded from a decision-fragile read.');
    challengeFlags.push('fragile_write_anchor');
  }
  if (pairCounterpartId && pairIntegrity !== 'resolved') {
    challengeSignals.push('Boundary linkage for this primary candidate is missing or unresolved in the current runtime set.');
    challengeFlags.push('boundary_gap_visible');
  }

  if (pairCounterpartId && pairIntegrity === 'resolved') {
    stabilizingSignals.push('A paired boundary candidate is visibly resolved in the current workspace.');
  }
  if (evidenceContext && evidenceContext.integrity_state === 'intact') {
    stabilizingSignals.push('Current visible linkage and evidence integrity read as intact.');
  }
  if (existingCounterexamples.length < 1) {
    stabilizingSignals.push('No stored counterexample currently refutes this primary candidate.');
  }
  if (latestReview && latestReview.review_outcome === 'stabilize' && contradictionSignals.length < 1 && !(deltaContext && deltaContext.review_attention_now)) {
    stabilizingSignals.push('The latest visible review stabilized the candidate and no stronger current contradiction signal is visible now.');
  }
  if (Array.isArray(relatedCandidates) && relatedCandidates.some(item => item.candidate_type === 'counterexample_candidate')) {
    challengeFlags.push('related_counterexample_visible');
  }

  let contradictionPressureBucket = 'not_applicable';
  if (challengeable) {
    contradictionPressureBucket = challengeSignals.length >= 4
      ? 'high_visible_pressure'
      : challengeSignals.length >= 2
        ? 'moderate_visible_pressure'
        : 'low_visible_pressure';
  }

  const manualChallengeBlockers = [];
  if (!challengeable) {
    manualChallengeBlockers.push(`Phase 4A manual challenge is locked to visible invariant candidates only, not ${candidateType || 'unknown'} objects.`);
  }

  const challengeSummary = !challengeable
    ? 'This workspace item is outside the locked Phase 4A single-candidate manual challenge slice.'
    : contradictionPressureBucket === 'high_visible_pressure'
      ? 'Current workspace signals show high visible contradiction pressure, so an explicit manual counterexample proposal is readable now.'
      : contradictionPressureBucket === 'moderate_visible_pressure'
        ? 'Current workspace signals show moderate visible contradiction pressure, so a manual counterexample proposal is plausible without becoming automatic.'
        : 'Current workspace signals show only low visible contradiction pressure, so challenge remains available but lightly grounded.';

  return {
    challenge_present: challengeable,
    challenge_summary: challengeSummary,
    contradiction_pressure_bucket: contradictionPressureBucket,
    challenge_signals: challengeSignals.slice(0, 6),
    stabilizing_signals: stabilizingSignals.slice(0, 4),
    challenge_flags: Array.from(new Set(challengeFlags)),
    existing_counterexample_count: existingCounterexamples.length,
    existing_counterexamples: existingCounterexamples.slice(0, 4),
    boundary_candidate_id: pairCounterpartId,
    boundary_integrity: pairIntegrity,
    latest_review_outcome: latestReview ? latestReview.review_outcome || null : null,
    latest_review_trace_present: Boolean(reviewTraceContext && reviewTraceContext.trace_present),
    review_history_count: Number(reviewHistoryContext && reviewHistoryContext.total_review_count || 0),
    manual_counterexample_allowed: manualChallengeBlockers.length < 1,
    manual_counterexample_blockers: manualChallengeBlockers,
    selected_primary_candidate_id: primaryCandidateId,
    selected_primary_candidate_type: candidateType,
    challenge_surface_version: 'phase4a-mec-challenge-context/v1'
  };
}

 function buildMecWorkspaceRefutationContext(payload, reviewSummary = null, latestReview = null, sourceLinkage = {}, unresolvedReferences = [], evidenceContext = null, reviewHistoryContext = null, relatedCandidates = [], deltaContext = null, contradictionContext = null, decisionPacketContext = null, challengeContext = null, reviewTraceContext = null, candidateMap = new Map(), reviewMap = new Map()) {
   const candidateId = payload && payload.id ? payload.id : null;
   const candidateType = payload && payload.candidate_type ? payload.candidate_type : null;
   const refutesCandidateId = sourceLinkage && sourceLinkage.refutes_candidate_id ? sourceLinkage.refutes_candidate_id : null;
   const challengeBasis = payload && payload.challenge_basis && typeof payload.challenge_basis === 'object'
     ? payload.challenge_basis
     : null;
   const visibleCounterexamples = [];
   for (const candidate of candidateMap.values()) {
     if (!candidate || candidate.candidate_type !== 'counterexample_candidate') {
       continue;
     }
     const targetCandidateId = candidate.refutes_candidate_id || null;
     if (targetCandidateId !== candidateId && targetCandidateId !== refutesCandidateId) {
       continue;
     }
     const counterexampleReviewSummary = buildMecReviewSummary(reviewMap.get(candidate.id) || []);
     visibleCounterexamples.push({
       candidate_id: candidate.id,
       title: buildMecWorkspaceTitle(candidate),
       status: candidate.status || null,
       current_review_state: counterexampleReviewSummary.current_state,
       reviewable: counterexampleReviewSummary.reviewable,
       terminal: counterexampleReviewSummary.terminal,
       contradiction_pressure_bucket: candidate.challenge_basis && candidate.challenge_basis.contradiction_pressure_bucket
         ? candidate.challenge_basis.contradiction_pressure_bucket
         : null,
       challenge_summary: candidate.challenge_basis && candidate.challenge_basis.challenge_summary
         ? candidate.challenge_basis.challenge_summary
         : null,
       created_at: candidate.created_at || null,
       updated_at: candidate.updated_at || null
     });
   }
   visibleCounterexamples.sort((left, right) => parseMecWorkspaceTimestamp(right.updated_at || right.created_at) - parseMecWorkspaceTimestamp(left.updated_at || left.created_at));

   const primaryCandidateId = candidateType === 'counterexample_candidate'
     ? refutesCandidateId
     : candidateId;
   const primaryCandidate = primaryCandidateId ? candidateMap.get(primaryCandidateId) || null : null;
   const primaryReviewSummary = primaryCandidateId
     ? (primaryCandidateId === candidateId ? reviewSummary : buildMecReviewSummary(reviewMap.get(primaryCandidateId) || []))
     : null;
   const siblingCounterexamples = candidateType === 'counterexample_candidate'
     ? visibleCounterexamples.filter(item => item.candidate_id !== candidateId)
     : visibleCounterexamples;
   const supportSignals = [];
   const qualifyingSignals = [];
   const openQualifiers = [];

   if (candidateType === 'counterexample_candidate' && primaryCandidateId) {
     supportSignals.push(`This proposal-only counterexample explicitly refutes visible primary candidate ${primaryCandidateId}.`);
   }
   if (candidateType === 'counterexample_candidate' && challengeBasis && challengeBasis.challenge_summary) {
     supportSignals.push(challengeBasis.challenge_summary);
   }
   if (candidateType !== 'counterexample_candidate' && visibleCounterexamples.length > 0) {
     supportSignals.push(`${visibleCounterexamples.length} proposal-only counterexample candidate(s) already refute this primary candidate in the visible workspace.`);
   }
   if (candidateType !== 'counterexample_candidate' && challengeContext && challengeContext.existing_counterexample_count > 0) {
     supportSignals.push('Current challenge posture already records visible stored counterexample pressure against this primary candidate.');
   }
   if (primaryReviewSummary && primaryReviewSummary.current_state) {
     qualifyingSignals.push(`Primary candidate currently reads as ${primaryReviewSummary.current_state} in the canonical workspace.`);
   }
   if (candidateType === 'counterexample_candidate' && reviewTraceContext && reviewTraceContext.trace_present) {
     qualifyingSignals.push('A review trace is already visible in the canonical workspace for this counterexample or its current desk read.');
   }
   if (challengeBasis && Array.isArray(challengeBasis.stabilizing_signals)) {
     qualifyingSignals.push(...challengeBasis.stabilizing_signals.slice(0, 3));
   }
   if (challengeContext && Array.isArray(challengeContext.stabilizing_signals)) {
     qualifyingSignals.push(...challengeContext.stabilizing_signals.slice(0, 3));
   }
   if (Array.isArray(unresolvedReferences) && unresolvedReferences.length > 0) {
     openQualifiers.push(...unresolvedReferences.map(item => item.label).slice(0, 4));
   }
   if (candidateType === 'counterexample_candidate' && !primaryCandidate) {
     openQualifiers.push('The refuted primary candidate is not visible in the current runtime candidate set.');
   }
   if (decisionPacketContext && Array.isArray(decisionPacketContext.missing_signals)) {
     openQualifiers.push(...decisionPacketContext.missing_signals.slice(0, 2));
   }
   if (challengeBasis && challengeBasis.why_not_now) {
     openQualifiers.push(challengeBasis.why_not_now);
   }

   const dedupedSupportSignals = Array.from(new Set(supportSignals)).slice(0, 5);
   const dedupedQualifyingSignals = Array.from(new Set(qualifyingSignals)).slice(0, 5);
   const dedupedOpenQualifiers = Array.from(new Set(openQualifiers)).slice(0, 5);

   if (candidateType === 'counterexample_candidate') {
     const refutationSummary = primaryCandidate
       ? 'This proposal-only counterexample is canonically readable as a visible refutation object against the currently visible primary candidate.'
       : 'This proposal-only counterexample remains readable as a refutation object, but its refuted primary candidate is not currently visible in runtime.';
     return {
       refutation_present: true,
       refutation_role: 'counterexample_candidate',
       refutation_summary: refutationSummary,
       relation_summary: primaryCandidate
         ? `Refutes primary candidate ${primaryCandidateId} while keeping the refutation read separate from any review write.`
         : `Refutes primary candidate ${primaryCandidateId || 'unknown'}, but the primary candidate is not currently visible in runtime.`,
       primary_candidate_id: primaryCandidateId,
       primary_candidate_title: primaryCandidate ? buildMecWorkspaceTitle(primaryCandidate) : null,
       primary_candidate_current_review_state: primaryReviewSummary ? primaryReviewSummary.current_state : null,
       primary_candidate_reviewable: primaryReviewSummary ? Boolean(primaryReviewSummary.reviewable) : false,
       primary_candidate_terminal: primaryReviewSummary ? Boolean(primaryReviewSummary.terminal) : false,
       latest_primary_review_outcome: primaryReviewSummary ? primaryReviewSummary.latest_review_outcome || null : null,
       visible_sibling_counterexample_count: siblingCounterexamples.length,
       visible_sibling_counterexamples: siblingCounterexamples.slice(0, 4),
       challenge_basis_summary: challengeBasis && challengeBasis.challenge_summary ? challengeBasis.challenge_summary : (payload && payload.mechanism ? payload.mechanism : null),
       challenge_basis_bucket: challengeBasis && challengeBasis.contradiction_pressure_bucket ? challengeBasis.contradiction_pressure_bucket : null,
       challenge_basis_flags: Array.isArray(challengeBasis && challengeBasis.challenge_flags) ? challengeBasis.challenge_flags.slice(0, 6) : [],
       support_signals: dedupedSupportSignals,
       qualifying_signals: dedupedQualifyingSignals,
       open_qualifiers: dedupedOpenQualifiers,
       refutation_surface_version: 'phase4b-mec-refutation-context/v1'
     };
   }

   if (visibleCounterexamples.length > 0) {
     return {
       refutation_present: true,
       refutation_role: 'refuted_primary_candidate',
       refutation_summary: `${visibleCounterexamples.length} visible proposal-only counterexample candidate(s) currently refute this primary candidate in the canonical workspace.`,
       relation_summary: 'The canonical workspace now keeps the visible refutation posture readable without introducing a new write path or recommendation layer.',
       primary_candidate_id: candidateId,
       primary_candidate_title: buildMecWorkspaceTitle(payload),
       primary_candidate_current_review_state: reviewSummary ? reviewSummary.current_state : null,
       primary_candidate_reviewable: reviewSummary ? Boolean(reviewSummary.reviewable) : false,
       primary_candidate_terminal: reviewSummary ? Boolean(reviewSummary.terminal) : false,
       latest_primary_review_outcome: latestReview ? latestReview.review_outcome || null : null,
       visible_counterexample_count: visibleCounterexamples.length,
       visible_counterexamples: visibleCounterexamples.slice(0, 4),
       challenge_basis_summary: challengeContext && challengeContext.challenge_summary ? challengeContext.challenge_summary : null,
       challenge_basis_bucket: challengeContext && challengeContext.contradiction_pressure_bucket ? challengeContext.contradiction_pressure_bucket : null,
       challenge_basis_flags: Array.isArray(challengeContext && challengeContext.challenge_flags) ? challengeContext.challenge_flags.slice(0, 6) : [],
       support_signals: dedupedSupportSignals,
       qualifying_signals: dedupedQualifyingSignals,
       open_qualifiers: dedupedOpenQualifiers,
       refutation_surface_version: 'phase4b-mec-refutation-context/v1'
     };
   }

   return {
     refutation_present: false,
     refutation_role: 'not_applicable',
     refutation_summary: 'No explicit refutation relation is currently visible for this workspace item.',
     relation_summary: 'No proposal-only counterexample relation is currently visible in the canonical workspace for this item.',
     primary_candidate_id: primaryCandidateId,
     primary_candidate_title: primaryCandidate ? buildMecWorkspaceTitle(primaryCandidate) : null,
     primary_candidate_current_review_state: primaryReviewSummary ? primaryReviewSummary.current_state : null,
     primary_candidate_reviewable: primaryReviewSummary ? Boolean(primaryReviewSummary.reviewable) : false,
     primary_candidate_terminal: primaryReviewSummary ? Boolean(primaryReviewSummary.terminal) : false,
     latest_primary_review_outcome: latestReview ? latestReview.review_outcome || null : null,
     visible_counterexample_count: 0,
     visible_counterexamples: [],
     challenge_basis_summary: null,
     challenge_basis_bucket: null,
     challenge_basis_flags: [],
     support_signals: [],
     qualifying_signals: [],
     open_qualifiers: dedupedOpenQualifiers,
     refutation_surface_version: 'phase4b-mec-refutation-context/v1'
   };
 }

 function buildMecChallengeDossierLineSignature(candidate) {
  const challengeBasis = candidate && candidate.challenge_basis && typeof candidate.challenge_basis === 'object'
    ? candidate.challenge_basis
    : null;
  const bucket = challengeBasis && challengeBasis.contradiction_pressure_bucket
    ? challengeBasis.contradiction_pressure_bucket
    : 'not_visible';
  const flags = Array.isArray(challengeBasis && challengeBasis.challenge_flags)
    ? Array.from(new Set(challengeBasis.challenge_flags.map(item => String(item || '').trim()).filter(Boolean))).sort().join('|')
    : '';
  const summarySeed = String((challengeBasis && challengeBasis.challenge_summary) || (candidate && candidate.mechanism) || (candidate && candidate.case_description) || 'no_summary')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8)
    .join('_') || 'no_summary';
  return `${bucket}::${flags || `summary:${summarySeed}`}`;
 }

 function buildMecChallengeDossierLineLabel(candidate) {
  const challengeBasis = candidate && candidate.challenge_basis && typeof candidate.challenge_basis === 'object'
    ? candidate.challenge_basis
    : null;
  return (challengeBasis && challengeBasis.challenge_summary)
    || (candidate && candidate.case_description)
    || buildMecWorkspaceTitle(candidate)
    || 'Visible challenge line';
 }

 function deriveMecChallengeDossierBucket(counterexampleCount, distinctLineCount, reinforcingLineCount, qualifiedLineCount, coverageGapCount, challengePresent) {
  if (counterexampleCount < 1) {
    return challengePresent ? 'pressure_without_counterexample_coverage' : 'no_visible_challenge_dossier';
  }
  if (distinctLineCount >= 2 && reinforcingLineCount >= 1) {
    return coverageGapCount > 0 || qualifiedLineCount > 0
      ? 'multi_line_reinforced_with_open_gaps'
      : 'multi_line_reinforced_coverage';
  }
  if (distinctLineCount >= 2) {
    return coverageGapCount > 0 || qualifiedLineCount > 0
      ? 'multi_line_mixed_with_open_gaps'
      : 'multi_line_mixed_coverage';
  }
  if (reinforcingLineCount >= 1) {
    return coverageGapCount > 0 || qualifiedLineCount > 0
      ? 'single_line_reinforced_with_open_gaps'
      : 'single_line_reinforced_coverage';
  }
  return coverageGapCount > 0 || qualifiedLineCount > 0
    ? 'single_line_qualified_coverage'
    : 'single_line_visible_coverage';
 }

 function buildMecWorkspaceChallengeDossierContext(payload, reviewSummary = null, latestReview = null, sourceLinkage = {}, unresolvedReferences = [], evidenceContext = null, reviewHistoryContext = null, relatedCandidates = [], deltaContext = null, contradictionContext = null, decisionPacketContext = null, challengeContext = null, refutationContext = null, reviewTraceContext = null, candidateMap = new Map(), reviewMap = new Map()) {
   const candidateId = payload && payload.id ? payload.id : null;
   const candidateType = payload && payload.candidate_type ? payload.candidate_type : null;
   const refutesCandidateId = sourceLinkage && sourceLinkage.refutes_candidate_id ? sourceLinkage.refutes_candidate_id : null;
   const visibleCounterexamples = [];
   for (const candidate of candidateMap.values()) {
     if (!candidate || candidate.candidate_type !== 'counterexample_candidate') {
       continue;
     }
     const targetCandidateId = candidate.refutes_candidate_id || null;
     if (targetCandidateId !== candidateId && targetCandidateId !== refutesCandidateId) {
       continue;
     }
     const counterexampleReviewSummary = buildMecReviewSummary(reviewMap.get(candidate.id) || []);
     const challengeBasis = candidate.challenge_basis && typeof candidate.challenge_basis === 'object'
       ? candidate.challenge_basis
       : null;
     const qualifierCount = Number((candidate.refutation_context && Array.isArray(candidate.refutation_context.open_qualifiers)
       ? candidate.refutation_context.open_qualifiers.length
       : 0));
     visibleCounterexamples.push({
       candidate_id: candidate.id,
       title: buildMecWorkspaceTitle(candidate),
       status: candidate.status || null,
       current_review_state: counterexampleReviewSummary.current_state,
       reviewable: counterexampleReviewSummary.reviewable,
       terminal: counterexampleReviewSummary.terminal,
       challenge_basis_summary: challengeBasis && challengeBasis.challenge_summary ? challengeBasis.challenge_summary : null,
       challenge_basis_bucket: challengeBasis && challengeBasis.contradiction_pressure_bucket ? challengeBasis.contradiction_pressure_bucket : 'not_visible',
       challenge_basis_flags: Array.isArray(challengeBasis && challengeBasis.challenge_flags) ? challengeBasis.challenge_flags.slice(0, 6) : [],
       line_signature: buildMecChallengeDossierLineSignature(candidate),
       line_label: buildMecChallengeDossierLineLabel(candidate),
       open_qualifier_count: qualifierCount,
       created_at: candidate.created_at || null,
       updated_at: candidate.updated_at || null
     });
   }
   visibleCounterexamples.sort((left, right) => parseMecWorkspaceTimestamp(right.updated_at || right.created_at) - parseMecWorkspaceTimestamp(left.updated_at || left.created_at));

   const primaryCandidateId = candidateType === 'counterexample_candidate'
     ? refutesCandidateId
     : candidateId;
   const primaryCandidate = primaryCandidateId ? candidateMap.get(primaryCandidateId) || null : null;
   const primaryReviewSummary = primaryCandidateId
     ? (primaryCandidateId === candidateId ? reviewSummary : buildMecReviewSummary(reviewMap.get(primaryCandidateId) || []))
     : null;
   const lineMap = new Map();
   for (const counterexample of visibleCounterexamples) {
     const signature = counterexample.line_signature;
     if (!lineMap.has(signature)) {
       lineMap.set(signature, {
         line_signature: signature,
         line_label: counterexample.line_label,
         challenge_basis_bucket: counterexample.challenge_basis_bucket,
         challenge_basis_flags: Array.from(new Set(counterexample.challenge_basis_flags || [])),
         counterexample_ids: [],
         counterexample_titles: [],
         contribution_count: 0,
         open_qualifier_count: 0
       });
     }
     const line = lineMap.get(signature);
     line.counterexample_ids.push(counterexample.candidate_id);
     line.counterexample_titles.push(counterexample.title || counterexample.candidate_id);
     line.contribution_count += 1;
     line.open_qualifier_count += Number(counterexample.open_qualifier_count || 0);
   }
   const challengeLines = Array.from(lineMap.values()).map(line => {
     const contributionPosture = line.contribution_count >= 2
       ? (line.open_qualifier_count > 0 ? 'reinforced_but_qualified_line' : 'reinforced_visible_line')
       : line.open_qualifier_count > 0
         ? 'qualified_visible_line'
         : 'distinct_visible_line';
     return {
       ...line,
       contribution_posture: contributionPosture,
       counterexample_ids: line.counterexample_ids.slice(0, 4),
       counterexample_titles: line.counterexample_titles.slice(0, 4)
     };
   }).sort((left, right) => {
     const countRank = right.contribution_count - left.contribution_count;
     if (countRank !== 0) {
       return countRank;
     }
     return String(left.line_label).localeCompare(String(right.line_label));
   });

   const reinforcingLineCount = challengeLines.filter(line => line.contribution_count >= 2).length;
   const qualifiedLineCount = challengeLines.filter(line => line.open_qualifier_count > 0).length;
   const coverageGaps = [];
   if (challengeContext && challengeContext.challenge_present && visibleCounterexamples.length < 1 && Array.isArray(challengeContext.challenge_signals) && challengeContext.challenge_signals.length > 0) {
     coverageGaps.push('Visible challenge pressure is present, but no stored proposal-only counterexample currently contributes to dossier coverage.');
   }
   if (Array.isArray(unresolvedReferences) && unresolvedReferences.length > 0) {
     coverageGaps.push(...unresolvedReferences.map(item => item.label).slice(0, 4));
   }
   if (decisionPacketContext && Array.isArray(decisionPacketContext.missing_signals)) {
     coverageGaps.push(...decisionPacketContext.missing_signals.slice(0, 3));
   }
   if (qualifiedLineCount > 0) {
     coverageGaps.push('Some visible challenge lines remain qualified by open visible gaps or unresolved references.');
   }
   const dedupedCoverageGaps = Array.from(new Set(coverageGaps)).slice(0, 6);
   const challengePostureBucket = deriveMecChallengeDossierBucket(visibleCounterexamples.length, challengeLines.length, reinforcingLineCount, qualifiedLineCount, dedupedCoverageGaps.length, Boolean(challengeContext && challengeContext.challenge_present));
   const postureFlags = [];
   if (reinforcingLineCount > 0) {
     postureFlags.push('repeated_visible_basis');
   }
   if (challengeLines.length >= 2) {
     postureFlags.push('distinct_visible_lines');
   }
   if (dedupedCoverageGaps.length > 0) {
     postureFlags.push('open_visible_gaps');
   }
   if (visibleCounterexamples.length > 0) {
     postureFlags.push('counterexample_coverage_visible');
   }

   if (candidateType === 'counterexample_candidate') {
    const lineSignature = buildMecChallengeDossierLineSignature(payload);
    const lineEntry = challengeLines.find(item => Array.isArray(item.counterexample_ids) && item.counterexample_ids.includes(candidateId))
      || challengeLines.find(item => item.line_signature === lineSignature)
      || null;
    const contributionPosture = lineEntry
      ? lineEntry.contribution_posture
      : (Array.isArray(refutationContext && refutationContext.open_qualifiers) && refutationContext.open_qualifiers.length > 0
        ? 'qualified_visible_line'
        : 'distinct_visible_line');
     return {
       dossier_present: Boolean(primaryCandidateId),
       dossier_role: 'counterexample_contribution',
       dossier_summary: primaryCandidateId
         ? `This proposal-only counterexample contributes one visible challenge line into the current primary-candidate dossier for ${primaryCandidateId}.`
         : 'This proposal-only counterexample does not currently have a visible primary-candidate dossier anchor in runtime.',
       primary_candidate_id: primaryCandidateId,
       primary_candidate_title: primaryCandidate ? buildMecWorkspaceTitle(primaryCandidate) : null,
       primary_candidate_current_review_state: primaryReviewSummary ? primaryReviewSummary.current_state : null,
       challenge_posture_bucket: challengePostureBucket,
       dossier_posture_flags: postureFlags,
       visible_counterexample_count: visibleCounterexamples.length,
       distinct_challenge_line_count: challengeLines.length,
       reinforcing_line_count: reinforcingLineCount,
       open_coverage_gap_count: dedupedCoverageGaps.length,
       contribution_line_signature: lineSignature,
       contribution_line_label: buildMecChallengeDossierLineLabel(payload),
       contribution_posture: contributionPosture,
       contribution_summary: contributionPosture === 'reinforced_visible_line' || contributionPosture === 'reinforced_but_qualified_line'
         ? 'This counterexample reinforces a visible challenge line already present in the current primary-candidate dossier.'
         : contributionPosture === 'qualified_visible_line'
           ? 'This counterexample adds a visible challenge line, but the current dossier still shows open qualifiers around that contribution.'
           : 'This counterexample adds a distinct visible challenge line into the current primary-candidate dossier.',
       coverage_gaps: dedupedCoverageGaps,
       challenge_lines: challengeLines.slice(0, 4),
       challenge_dossier_surface_version: 'phase4c-mec-challenge-dossier-context/v1'
     };
   }

   if (visibleCounterexamples.length > 0 || (challengeContext && challengeContext.challenge_present)) {
     const dossierSummary = visibleCounterexamples.length < 1
       ? 'Visible challenge pressure exists for this primary candidate, but stored counterexample coverage is not yet present in the canonical dossier.'
       : challengeLines.length >= 2 && reinforcingLineCount >= 1
         ? 'This primary candidate currently carries multiple visible challenge lines, including at least one reinforced line, inside the canonical dossier.'
         : challengeLines.length >= 2
           ? 'This primary candidate currently carries multiple distinct visible challenge lines inside the canonical dossier.'
           : reinforcingLineCount >= 1
             ? 'This primary candidate currently carries one visible challenge line reinforced by more than one proposal-only counterexample.'
             : 'This primary candidate currently carries one visible challenge line inside the canonical dossier.';
     return {
       dossier_present: true,
       dossier_role: 'primary_candidate_challenge_dossier',
       dossier_summary: dossierSummary,
       primary_candidate_id: candidateId,
       primary_candidate_title: buildMecWorkspaceTitle(payload),
       primary_candidate_current_review_state: reviewSummary ? reviewSummary.current_state : null,
       primary_candidate_reviewable: reviewSummary ? Boolean(reviewSummary.reviewable) : false,
       primary_candidate_terminal: reviewSummary ? Boolean(reviewSummary.terminal) : false,
       latest_primary_review_outcome: latestReview ? latestReview.review_outcome || null : null,
       challenge_posture_bucket: challengePostureBucket,
       dossier_posture_flags: postureFlags,
       visible_counterexample_count: visibleCounterexamples.length,
       distinct_challenge_line_count: challengeLines.length,
       reinforcing_line_count: reinforcingLineCount,
       qualified_line_count: qualifiedLineCount,
       repeated_basis_count: reinforcingLineCount,
       challenge_lines: challengeLines.slice(0, 6),
       coverage_gaps: dedupedCoverageGaps,
       coverage_gap_count: dedupedCoverageGaps.length,
       challenge_dossier_surface_version: 'phase4c-mec-challenge-dossier-context/v1'
     };
   }

   return {
     dossier_present: false,
     dossier_role: 'not_applicable',
     dossier_summary: 'No compact primary-candidate challenge dossier is currently visible for this workspace item.',
     primary_candidate_id: primaryCandidateId,
     primary_candidate_title: primaryCandidate ? buildMecWorkspaceTitle(primaryCandidate) : null,
     primary_candidate_current_review_state: primaryReviewSummary ? primaryReviewSummary.current_state : null,
     primary_candidate_reviewable: primaryReviewSummary ? Boolean(primaryReviewSummary.reviewable) : false,
     primary_candidate_terminal: primaryReviewSummary ? Boolean(primaryReviewSummary.terminal) : false,
     latest_primary_review_outcome: latestReview ? latestReview.review_outcome || null : null,
     challenge_posture_bucket: deriveMecChallengeDossierBucket(0, 0, 0, 0, 0, Boolean(challengeContext && challengeContext.challenge_present)),
     dossier_posture_flags: [],
     visible_counterexample_count: 0,
     distinct_challenge_line_count: 0,
     reinforcing_line_count: 0,
     qualified_line_count: 0,
     repeated_basis_count: 0,
     challenge_lines: [],
     coverage_gaps: [],
     coverage_gap_count: 0,
     challenge_dossier_surface_version: 'phase4c-mec-challenge-dossier-context/v1'
   };
 }

 function buildMecWorkspaceChallengeDossierDeltaContext(payload, reviewSummary, latestReview, challengeDossierContext, reviewTraceContext, candidateMap) {
  const candidateId = payload && payload.id ? payload.id : null;
  const candidateType = payload && payload.candidate_type ? payload.candidate_type : null;
  const latestReviewedAtRaw = latestReview && latestReview.reviewed_at ? latestReview.reviewed_at : null;
  const latestReviewedAt = latestReviewedAtRaw ? parseMecWorkspaceTimestamp(latestReviewedAtRaw) : null;
  const candidateCreatedAtRaw = payload && payload.created_at ? payload.created_at : null;
  const candidateCreatedAt = candidateCreatedAtRaw ? parseMecWorkspaceTimestamp(candidateCreatedAtRaw) : null;
  let anchorAt = null;
  let anchorKind = 'no_anchor';
  if (latestReviewedAt !== null) {
    anchorAt = latestReviewedAt;
    anchorKind = 'last_review';
  } else if (candidateCreatedAt !== null) {
    anchorAt = candidateCreatedAt;
    anchorKind = 'candidate_created';
  }
  const dossierPresent = challengeDossierContext && challengeDossierContext.dossier_present;
  const currentPostureBucket = challengeDossierContext && challengeDossierContext.challenge_posture_bucket
    ? challengeDossierContext.challenge_posture_bucket
    : 'no_visible_challenge_dossier';
  const challengeLines = Array.isArray(challengeDossierContext && challengeDossierContext.challenge_lines)
    ? challengeDossierContext.challenge_lines
    : [];
  if (!dossierPresent && currentPostureBucket !== 'pressure_without_counterexample_coverage') {
    return {
      delta_present: false,
      delta_role: 'not_applicable',
      delta_summary: 'No visible challenge dossier is currently present, so no delta or evolution is derivable for this workspace item.',
      anchor_kind: anchorKind,
      anchor_at: latestReviewedAtRaw || candidateCreatedAtRaw || null,
      movement_bucket: 'not_derivable',
      new_line_count: 0,
      stable_line_count: 0,
      updated_line_count: 0,
      qualified_open_line_count: 0,
      new_lines: [],
      stable_lines: [],
      updated_lines: [],
      qualified_open_lines: [],
      posture_changed: false,
      previous_posture_bucket: null,
      current_posture_bucket: currentPostureBucket,
      evolution_signals: [],
      challenge_dossier_delta_surface_version: 'phase4d-mec-challenge-dossier-delta-context/v1'
    };
  }
  const newLines = [];
  const stableLines = [];
  const updatedLines = [];
  const qualifiedOpenLines = [];
  let preAnchorCounterexampleCount = 0;
  let preAnchorDistinctLineCount = 0;
  let preAnchorReinforcingLineCount = 0;
  let preAnchorQualifiedLineCount = 0;
  for (const line of challengeLines) {
    const counterexampleIds = Array.isArray(line.counterexample_ids) ? line.counterexample_ids : [];
    const isQualified = Number(line.open_qualifier_count || 0) > 0;
    const counterexampleTimings = counterexampleIds.map(id => {
      const ce = candidateMap.get(id);
      return {
        id,
        created_ts: ce && ce.created_at ? parseMecWorkspaceTimestamp(ce.created_at) : null,
        updated_ts: ce && ce.updated_at ? parseMecWorkspaceTimestamp(ce.updated_at) : null
      };
    }).filter(item => item.created_ts !== null);
    const lineSummary = {
      line_signature: line.line_signature,
      line_label: line.line_label,
      contribution_count: Number(line.contribution_count || 1),
      contribution_posture: line.contribution_posture || 'distinct_visible_line',
      open_qualifier_count: Number(line.open_qualifier_count || 0)
    };
    if (anchorAt === null || counterexampleTimings.length === 0) {
      stableLines.push(lineSummary);
    } else {
      const allAfterAnchor = counterexampleTimings.every(item => item.created_ts > anchorAt);
      const allBeforeAnchor = counterexampleTimings.every(item => item.created_ts <= anchorAt);
      const anyUpdatedAfterAnchor = counterexampleTimings.some(item =>
        item.updated_ts !== null && item.updated_ts > anchorAt && item.created_ts <= anchorAt
      );
      if (allAfterAnchor) {
        newLines.push(lineSummary);
      } else if (allBeforeAnchor && !anyUpdatedAfterAnchor) {
        stableLines.push(lineSummary);
        const preCount = counterexampleTimings.length;
        preAnchorCounterexampleCount += preCount;
        preAnchorDistinctLineCount += 1;
        if (preCount >= 2) preAnchorReinforcingLineCount += 1;
        if (isQualified) preAnchorQualifiedLineCount += 1;
      } else {
        updatedLines.push(lineSummary);
        const preAnchorCEs = counterexampleTimings.filter(item => item.created_ts <= anchorAt).length;
        preAnchorCounterexampleCount += preAnchorCEs;
        if (preAnchorCEs > 0) {
          preAnchorDistinctLineCount += 1;
          if (preAnchorCEs >= 2) preAnchorReinforcingLineCount += 1;
          if (isQualified) preAnchorQualifiedLineCount += 1;
        }
      }
    }
    if (isQualified) {
      qualifiedOpenLines.push(lineSummary);
    }
  }
  const coverageGapCount = Array.isArray(challengeDossierContext && challengeDossierContext.coverage_gaps)
    ? challengeDossierContext.coverage_gaps.length
    : 0;
  const challengePresent = Boolean(challengeDossierContext && challengeDossierContext.dossier_present);
  const preAnchorPostureBucket = anchorAt !== null
    ? deriveMecChallengeDossierBucket(preAnchorCounterexampleCount, preAnchorDistinctLineCount, preAnchorReinforcingLineCount, preAnchorQualifiedLineCount, coverageGapCount, challengePresent)
    : null;
  const postureChanged = anchorKind === 'last_review' && preAnchorPostureBucket !== null && preAnchorPostureBucket !== currentPostureBucket;
  let movementBucket;
  if (anchorAt === null) {
    movementBucket = 'not_derivable';
  } else if (currentPostureBucket === 'pressure_without_counterexample_coverage') {
    movementBucket = 'pressure_without_coverage';
  } else if (newLines.length > 0) {
    movementBucket = 'expanding';
  } else if (updatedLines.length > 0) {
    movementBucket = 'updated';
  } else if (postureChanged) {
    movementBucket = 'posture_shifted';
  } else if (stableLines.length > 0) {
    movementBucket = 'stabilizing';
  } else {
    movementBucket = 'unchanged';
  }
  const evolutionSignals = [];
  if (anchorKind === 'candidate_created') {
    evolutionSignals.push('No review anchor exists yet. Evolution signals are relative to candidate creation, not a review action.');
  }
  if (newLines.length > 0) {
    evolutionSignals.push(`${newLines.length} new challenge line(s) emerged since the last visible anchor.`);
  }
  if (stableLines.length > 0 && newLines.length === 0 && updatedLines.length === 0) {
    evolutionSignals.push(`${stableLines.length} visible challenge line(s) have been stable since before the last visible anchor.`);
  } else if (stableLines.length > 0) {
    evolutionSignals.push(`${stableLines.length} visible challenge line(s) were already present at the last visible anchor.`);
  }
  if (updatedLines.length > 0) {
    evolutionSignals.push(`${updatedLines.length} visible challenge line(s) carry counterexamples from both before and after the anchor.`);
  }
  if (qualifiedOpenLines.length > 0) {
    evolutionSignals.push(`${qualifiedOpenLines.length} visible challenge line(s) remain qualified by open gaps regardless of timing.`);
  }
  if (postureChanged && preAnchorPostureBucket) {
    evolutionSignals.push(`Challenge dossier posture moved from ${preAnchorPostureBucket} to ${currentPostureBucket} since the last review anchor.`);
  } else if (anchorKind === 'last_review' && !postureChanged && preAnchorPostureBucket !== null) {
    evolutionSignals.push(`Challenge dossier posture is stable at ${currentPostureBucket} since the last review anchor.`);
  }
  let deltaSummary;
  if (movementBucket === 'expanding') {
    deltaSummary = `The visible challenge dossier has grown since the last anchor, with ${newLines.length} new challenge line(s) that were not present at the previous review point.`;
  } else if (movementBucket === 'stabilizing') {
    deltaSummary = `The visible challenge dossier appears stable. All ${stableLines.length} visible challenge line(s) were already present before the last visible anchor.`;
  } else if (movementBucket === 'updated') {
    deltaSummary = `${updatedLines.length} visible challenge line(s) show partial updates since the last anchor, but no entirely new lines have appeared.`;
  } else if (movementBucket === 'posture_shifted') {
    deltaSummary = `No new challenge lines have appeared since the last anchor, but the visible dossier posture has shifted from ${preAnchorPostureBucket} to ${currentPostureBucket}.`;
  } else if (movementBucket === 'pressure_without_coverage') {
    deltaSummary = 'Challenge pressure is visible but no counterexample coverage is currently present in the canonical dossier.';
  } else if (movementBucket === 'not_derivable') {
    deltaSummary = 'No anchor is available, so the challenge dossier evolution cannot be derived from the current visible signals.';
  } else {
    deltaSummary = 'No visible change is currently detectable in the challenge dossier relative to the last anchor.';
  }
  const deltaRole = candidateType === 'counterexample_candidate'
    ? 'counterexample_contribution_delta'
    : 'primary_candidate_dossier_delta';
  return {
    delta_present: anchorAt !== null && (newLines.length + stableLines.length + updatedLines.length) > 0,
    delta_role: deltaRole,
    delta_summary: deltaSummary,
    anchor_kind: anchorKind,
    anchor_at: latestReviewedAtRaw || candidateCreatedAtRaw || null,
    movement_bucket: movementBucket,
    new_line_count: newLines.length,
    stable_line_count: stableLines.length,
    updated_line_count: updatedLines.length,
    qualified_open_line_count: qualifiedOpenLines.length,
    new_lines: newLines.slice(0, 4),
    stable_lines: stableLines.slice(0, 4),
    updated_lines: updatedLines.slice(0, 4),
    qualified_open_lines: qualifiedOpenLines.slice(0, 4),
    posture_changed: postureChanged,
    previous_posture_bucket: preAnchorPostureBucket,
    current_posture_bucket: currentPostureBucket,
    evolution_signals: evolutionSignals.slice(0, 6),
    challenge_dossier_delta_surface_version: 'phase4d-mec-challenge-dossier-delta-context/v1'
  };
 }

 function deriveMecChallengeDossierReviewDigestBucket(challengeDossierContext = null, challengeDossierDeltaContext = null, refutationContext = null, watchpointCount = 0) {
  const dossierPresent = Boolean(challengeDossierContext && challengeDossierContext.dossier_present);
  const dossierRole = challengeDossierContext && challengeDossierContext.dossier_role
    ? challengeDossierContext.dossier_role
    : 'not_applicable';
  const movementBucket = challengeDossierDeltaContext && challengeDossierDeltaContext.movement_bucket
    ? challengeDossierDeltaContext.movement_bucket
    : 'not_derivable';
  const refutationPresent = Boolean(refutationContext && refutationContext.refutation_present);
  if (!dossierPresent && !refutationPresent && watchpointCount < 1) {
    return 'not_applicable';
  }
  if (dossierRole === 'counterexample_contribution') {
    return watchpointCount > 0
      ? 'counterexample_contribution_with_watchpoints'
      : 'counterexample_contribution_visible';
  }
  if (movementBucket === 'pressure_without_coverage') {
    return 'pressure_without_counterexample_coverage';
  }
  if (movementBucket === 'expanding') {
    return watchpointCount > 0
      ? 'expanding_with_watchpoints'
      : 'expanding_visible_digest';
  }
  if (movementBucket === 'updated' || movementBucket === 'posture_shifted') {
    return watchpointCount > 0
      ? 'changed_with_watchpoints'
      : 'changed_visible_digest';
  }
  if (watchpointCount > 0) {
    return dossierPresent
      ? 'coverage_with_watchpoints'
      : 'watchpoints_without_dossier';
  }
  if (movementBucket === 'stabilizing' || movementBucket === 'unchanged') {
    return 'stable_visible_digest';
  }
  return dossierPresent || refutationPresent
    ? 'visible_digest'
    : 'not_applicable';
 }

 function buildMecWorkspaceChallengeDossierReviewDigest(payload, reviewSummary, latestReview, sourceLinkage = {}, unresolvedReferences = [], evidenceContext = null, reviewHistoryContext = null, relatedCandidates = [], deltaContext = null, contradictionContext = null, decisionPacketContext = null, challengeContext = null, refutationContext = null, challengeDossierContext = null, challengeDossierDeltaContext = null, reviewTraceContext = null, candidateMap = new Map(), reviewMap = new Map()) {
  const candidateId = payload && payload.id ? payload.id : null;
  const candidateType = payload && payload.candidate_type ? payload.candidate_type : null;
  const primaryCandidateId = candidateType === 'counterexample_candidate'
    ? ((refutationContext && refutationContext.primary_candidate_id)
      || (challengeDossierContext && challengeDossierContext.primary_candidate_id)
      || (sourceLinkage && sourceLinkage.refutes_candidate_id)
      || null)
    : candidateId;
  const primaryCandidate = primaryCandidateId ? candidateMap.get(primaryCandidateId) || null : null;
  const primaryReviewSummary = primaryCandidateId
    ? (primaryCandidateId === candidateId ? reviewSummary : buildMecReviewSummary(reviewMap.get(primaryCandidateId) || []))
    : null;
  const coverageGaps = Array.isArray(challengeDossierContext && challengeDossierContext.coverage_gaps)
    ? challengeDossierContext.coverage_gaps
    : [];
  const contradictionSignals = Array.isArray(contradictionContext && contradictionContext.contradiction_signals)
    ? contradictionContext.contradiction_signals
    : [];
  const decisionMissingSignals = Array.isArray(decisionPacketContext && decisionPacketContext.missing_signals)
    ? decisionPacketContext.missing_signals
    : [];
  const refutationOpenQualifiers = Array.isArray(refutationContext && refutationContext.open_qualifiers)
    ? refutationContext.open_qualifiers
    : [];
  const unresolvedReferenceLabels = Array.isArray(unresolvedReferences)
    ? unresolvedReferences.map(item => item.label).filter(Boolean)
    : [];
  const watchpoints = Array.from(new Set([
    ...coverageGaps,
    ...unresolvedReferenceLabels,
    ...decisionMissingSignals,
    ...contradictionSignals,
    ...refutationOpenQualifiers
  ])).slice(0, 6);
  const digestBucket = deriveMecChallengeDossierReviewDigestBucket(challengeDossierContext, challengeDossierDeltaContext, refutationContext, watchpoints.length);
  const coverageRead = challengeDossierContext && challengeDossierContext.dossier_present
    ? `Coverage currently reads as ${challengeDossierContext.challenge_posture_bucket || 'not_visible'} with ${Number(challengeDossierContext.visible_counterexample_count || 0)} visible counterexample(s) across ${Number(challengeDossierContext.distinct_challenge_line_count || 0)} visible line(s).`
    : 'No stronger consolidated challenge dossier coverage is currently visible in the canonical workspace.';
  const deltaRead = challengeDossierDeltaContext && challengeDossierDeltaContext.delta_summary
    ? challengeDossierDeltaContext.delta_summary
    : 'No stronger challenge dossier evolution read is currently visible.';
  const refutationRole = refutationContext && refutationContext.refutation_role
    ? refutationContext.refutation_role
    : 'not_applicable';
  const refutationBucket = (refutationContext && refutationContext.challenge_basis_bucket)
    || (challengeContext && challengeContext.contradiction_pressure_bucket)
    || 'not_visible';
  const refutationRead = refutationContext && refutationContext.refutation_present
    ? `Refutation currently reads as ${refutationRole} with visible pressure bucket ${refutationBucket}.`
    : 'No explicit refutation relation is currently visible inside this consolidated digest.';
  const chronology = [];
  if (latestReview && latestReview.reviewed_at) {
    chronology.push({
      kind: 'review_anchor',
      label: `Latest review anchor ${latestReview.review_outcome || 'written'}`,
      at: latestReview.reviewed_at,
      detail: `Latest review source ${latestReview.review_source || 'not_visible'}`,
      timing_bucket: 'anchor'
    });
  }
  const newLines = Array.isArray(challengeDossierDeltaContext && challengeDossierDeltaContext.new_lines)
    ? challengeDossierDeltaContext.new_lines
    : [];
  const updatedLines = Array.isArray(challengeDossierDeltaContext && challengeDossierDeltaContext.updated_lines)
    ? challengeDossierDeltaContext.updated_lines
    : [];
  const stableLines = Array.isArray(challengeDossierDeltaContext && challengeDossierDeltaContext.stable_lines)
    ? challengeDossierDeltaContext.stable_lines
    : [];
  for (const line of newLines.slice(0, 2)) {
    chronology.push({
      kind: 'new_challenge_line',
      label: line.line_label || line.line_signature || 'visible challenge line',
      at: null,
      detail: `New visible line since anchor | ${line.contribution_posture || 'visible_line'}`,
      timing_bucket: 'since_anchor'
    });
  }
  for (const line of updatedLines.slice(0, 2)) {
    chronology.push({
      kind: 'updated_challenge_line',
      label: line.line_label || line.line_signature || 'visible challenge line',
      at: null,
      detail: `Updated across anchor | ${line.contribution_posture || 'visible_line'}`,
      timing_bucket: 'across_anchor'
    });
  }
  for (const line of stableLines.slice(0, chronology.length < 2 ? 2 : 1)) {
    chronology.push({
      kind: 'stable_challenge_line',
      label: line.line_label || line.line_signature || 'visible challenge line',
      at: null,
      detail: `Stable before anchor | ${line.contribution_posture || 'visible_line'}`,
      timing_bucket: 'pre_anchor'
    });
  }
  const latestReviewedAt = latestReview && latestReview.reviewed_at
    ? parseMecWorkspaceTimestamp(latestReview.reviewed_at)
    : null;
  const visibleCounterexamples = [];
  for (const candidate of candidateMap.values()) {
    if (!candidate || candidate.candidate_type !== 'counterexample_candidate') {
      continue;
    }
    if ((candidate.refutes_candidate_id || null) !== primaryCandidateId) {
      continue;
    }
    visibleCounterexamples.push(candidate);
  }
  visibleCounterexamples.sort((left, right) => parseMecWorkspaceTimestamp(right.updated_at || right.created_at) - parseMecWorkspaceTimestamp(left.updated_at || left.created_at));
  for (const counterexample of visibleCounterexamples.slice(0, 3)) {
    const createdAt = counterexample.created_at ? parseMecWorkspaceTimestamp(counterexample.created_at) : null;
    chronology.push({
      kind: 'counterexample_visible',
      label: buildMecWorkspaceTitle(counterexample),
      candidate_id: counterexample.id,
      at: counterexample.updated_at || counterexample.created_at || null,
      detail: `basis ${(counterexample.challenge_basis && counterexample.challenge_basis.contradiction_pressure_bucket) || 'not_visible'} | stored ${counterexample.status || 'proposal_only'}`,
      timing_bucket: latestReviewedAt !== null && createdAt !== null && createdAt > latestReviewedAt
        ? 'post_anchor'
        : 'visible'
    });
  }
  const digestFlags = [];
  if (challengeDossierContext && challengeDossierContext.dossier_role === 'counterexample_contribution') {
    digestFlags.push('counterexample_contribution_visible');
  }
  if (newLines.length > 0) {
    digestFlags.push('new_dossier_lines_visible');
  }
  if (updatedLines.length > 0) {
    digestFlags.push('updated_dossier_lines_visible');
  }
  if (stableLines.length > 0) {
    digestFlags.push('stable_dossier_lines_visible');
  }
  if (watchpoints.length > 0) {
    digestFlags.push('watchpoints_visible');
  }
  if (refutationContext && refutationContext.refutation_present) {
    digestFlags.push('refutation_visible');
  }
  if (reviewTraceContext && reviewTraceContext.trace_present) {
    digestFlags.push('review_trace_visible');
  }
  const visibleCounterexampleCount = Number((challengeDossierContext && challengeDossierContext.visible_counterexample_count)
    || (refutationContext && (refutationContext.visible_counterexample_count || refutationContext.visible_sibling_counterexample_count))
    || 0);
  const distinctChallengeLineCount = Number(challengeDossierContext && challengeDossierContext.distinct_challenge_line_count || 0);
  let digestSummary = 'No consolidated challenge dossier review digest is currently derivable for this workspace item.';
  if (candidateType === 'counterexample_candidate' && primaryCandidateId) {
    digestSummary = `This proposal-only counterexample contributes into the consolidated review digest for ${primaryCandidateId}. Coverage reads as ${challengeDossierContext && challengeDossierContext.challenge_posture_bucket ? challengeDossierContext.challenge_posture_bucket : 'not_visible'}, evolution reads as ${challengeDossierDeltaContext && challengeDossierDeltaContext.movement_bucket ? challengeDossierDeltaContext.movement_bucket : 'not_derivable'}, and ${watchpoints.length} watchpoint(s) remain visible.`;
  } else if (challengeDossierContext && challengeDossierContext.dossier_present) {
    digestSummary = `This primary-candidate review digest currently spans ${visibleCounterexampleCount} visible counterexample(s) across ${distinctChallengeLineCount} visible challenge line(s). Coverage reads as ${challengeDossierContext.challenge_posture_bucket || 'not_visible'}, evolution reads as ${challengeDossierDeltaContext && challengeDossierDeltaContext.movement_bucket ? challengeDossierDeltaContext.movement_bucket : 'not_derivable'}, and ${watchpoints.length > 0 ? `${watchpoints.length} watchpoint(s) remain visible.` : 'no stronger watchpoint remains visible.'}`;
  } else if (watchpoints.length > 0 || (refutationContext && refutationContext.refutation_present)) {
    digestSummary = `A compact consolidated review digest is still readable even without a stronger visible dossier snapshot. Refutation reads as ${refutationRole}, and ${watchpoints.length} watchpoint(s) remain visible.`;
  }
  return {
    digest_present: Boolean((challengeDossierContext && challengeDossierContext.dossier_present) || (refutationContext && refutationContext.refutation_present) || watchpoints.length > 0),
    digest_role: candidateType === 'counterexample_candidate'
      ? 'counterexample_contribution_review_digest'
      : (challengeDossierContext && challengeDossierContext.dossier_present)
        ? 'primary_candidate_review_digest'
        : 'not_applicable',
    digest_summary: digestSummary,
    primary_candidate_id: primaryCandidateId,
    primary_candidate_title: primaryCandidate
      ? buildMecWorkspaceTitle(primaryCandidate)
      : (challengeDossierContext && challengeDossierContext.primary_candidate_title) || null,
    primary_candidate_current_review_state: primaryReviewSummary ? primaryReviewSummary.current_state : null,
    primary_candidate_reviewable: primaryReviewSummary ? Boolean(primaryReviewSummary.reviewable) : false,
    primary_candidate_terminal: primaryReviewSummary ? Boolean(primaryReviewSummary.terminal) : false,
    digest_bucket: digestBucket,
    coverage_read: coverageRead,
    delta_read: deltaRead,
    refutation_read: refutationRead,
    visible_counterexample_count: visibleCounterexampleCount,
    distinct_challenge_line_count: distinctChallengeLineCount,
    reinforcing_line_count: Number(challengeDossierContext && challengeDossierContext.reinforcing_line_count || 0),
    new_line_count: Number(challengeDossierDeltaContext && challengeDossierDeltaContext.new_line_count || 0),
    stable_line_count: Number(challengeDossierDeltaContext && challengeDossierDeltaContext.stable_line_count || 0),
    updated_line_count: Number(challengeDossierDeltaContext && challengeDossierDeltaContext.updated_line_count || 0),
    coverage_gap_count: coverageGaps.length,
    watchpoint_count: watchpoints.length,
    chronology: chronology.slice(0, 8),
    watchpoints,
    digest_flags: Array.from(new Set(digestFlags)).slice(0, 8),
    challenge_dossier_review_digest_surface_version: 'phase4e-mec-challenge-dossier-review-digest/v1'
  };
 }

 function buildMecWorkspaceReviewGateSignalSurface(payload, reviewSummary, latestReview, contradictionContext = null, decisionPacketContext = null, challengeContext = null, refutationContext = null, challengeDossierContext = null, challengeDossierDeltaContext = null, challengeDossierReviewDigest = null) {
  const digestPresent = Boolean(challengeDossierReviewDigest && challengeDossierReviewDigest.digest_present);
  const watchpointCount = Number(challengeDossierReviewDigest && challengeDossierReviewDigest.watchpoint_count || 0);
  const contradictionCount = Array.isArray(contradictionContext && contradictionContext.contradiction_signals)
    ? contradictionContext.contradiction_signals.length
    : 0;
  const coverageGapCount = Number(challengeDossierContext && (challengeDossierContext.coverage_gap_count || challengeDossierContext.open_coverage_gap_count) || 0);
  const movementBucket = challengeDossierDeltaContext && challengeDossierDeltaContext.movement_bucket
    ? challengeDossierDeltaContext.movement_bucket
    : 'not_derivable';
  const challengePostureBucket = challengeDossierContext && challengeDossierContext.challenge_posture_bucket
    ? challengeDossierContext.challenge_posture_bucket
    : 'no_visible_challenge_dossier';
  const challengePressureBucket = (challengeContext && challengeContext.contradiction_pressure_bucket)
    || (refutationContext && refutationContext.challenge_basis_bucket)
    || 'not_visible';
  let coverageSignal = 'no_visible_dossier';
  if (challengeDossierContext && challengeDossierContext.dossier_role === 'counterexample_contribution') {
    coverageSignal = coverageGapCount > 0 ? 'contribution_with_open_gaps' : 'counterexample_contribution_visible';
  } else if (challengePostureBucket === 'pressure_without_counterexample_coverage') {
    coverageSignal = 'pressure_without_counterexample_coverage';
  } else if (coverageGapCount > 0) {
    coverageSignal = 'coverage_gaps_visible';
  } else if (Number(challengeDossierContext && challengeDossierContext.reinforcing_line_count || 0) > 0) {
    coverageSignal = 'reinforced_coverage_visible';
  } else if (Number(challengeDossierContext && challengeDossierContext.distinct_challenge_line_count || 0) >= 2) {
    coverageSignal = 'multi_line_coverage_visible';
  } else if (digestPresent) {
    coverageSignal = 'single_line_coverage_visible';
  }
  let stabilitySignal = 'anchor_not_derivable';
  if (movementBucket === 'expanding') {
    stabilitySignal = 'expanding_since_anchor';
  } else if (movementBucket === 'updated' || movementBucket === 'posture_shifted') {
    stabilitySignal = 'changed_since_anchor';
  } else if (movementBucket === 'stabilizing' || movementBucket === 'unchanged') {
    stabilitySignal = 'stable_since_anchor';
  } else if (movementBucket === 'pressure_without_coverage') {
    stabilitySignal = 'pressure_without_coverage';
  }
  let contradictionPressureSignal = 'not_visible';
  if (challengePressureBucket === 'high_visible_pressure' || contradictionCount >= 3) {
    contradictionPressureSignal = 'high_pressure_visible';
  } else if (challengePressureBucket === 'moderate_visible_pressure' || contradictionCount >= 1 || Boolean(refutationContext && refutationContext.refutation_present)) {
    contradictionPressureSignal = 'moderate_pressure_visible';
  } else if (digestPresent || challengePressureBucket === 'low_visible_pressure') {
    contradictionPressureSignal = 'low_pressure_visible';
  }
  let unresolvedWatchpointSignal = 'not_visible';
  if (watchpointCount >= 4) {
    unresolvedWatchpointSignal = 'watchpoints_elevated';
  } else if (watchpointCount >= 1) {
    unresolvedWatchpointSignal = 'watchpoints_present';
  } else if (digestPresent) {
    unresolvedWatchpointSignal = 'watchpoints_clear';
  }
  const decisionReadiness = decisionPacketContext && decisionPacketContext.decision_readiness
    ? decisionPacketContext.decision_readiness
    : 'decision_underconstrained';
  let reviewReadinessBucket = 'gate_not_ready';
  if (reviewSummary && reviewSummary.terminal) {
    reviewReadinessBucket = 'gate_closed';
  } else if (coverageSignal === 'pressure_without_counterexample_coverage' || contradictionPressureSignal === 'high_pressure_visible' || unresolvedWatchpointSignal === 'watchpoints_elevated') {
    reviewReadinessBucket = 'gate_restricted';
  } else if (decisionReadiness === 'decision_ready' && stabilitySignal === 'stable_since_anchor' && unresolvedWatchpointSignal === 'watchpoints_clear') {
    reviewReadinessBucket = 'gate_clear_read';
  } else if (digestPresent) {
    reviewReadinessBucket = 'gate_qualified_read';
  }
  const gateFlags = [];
  if (coverageSignal === 'pressure_without_counterexample_coverage') gateFlags.push('counterexample_coverage_missing');
  if (coverageSignal === 'coverage_gaps_visible' || coverageSignal === 'contribution_with_open_gaps') gateFlags.push('coverage_gaps_visible');
  if (stabilitySignal === 'expanding_since_anchor') gateFlags.push('expanding_since_anchor');
  if (stabilitySignal === 'changed_since_anchor') gateFlags.push('changed_since_anchor');
  if (contradictionPressureSignal === 'high_pressure_visible') gateFlags.push('high_contradiction_pressure');
  if (contradictionPressureSignal === 'moderate_pressure_visible') gateFlags.push('contradiction_pressure_visible');
  if (unresolvedWatchpointSignal === 'watchpoints_elevated') gateFlags.push('watchpoints_elevated');
  if (unresolvedWatchpointSignal === 'watchpoints_present') gateFlags.push('watchpoints_present');
  if (decisionReadiness === 'decision_fragile') gateFlags.push('decision_fragile');
  if (decisionReadiness === 'decision_underconstrained') gateFlags.push('decision_underconstrained');
  if (reviewSummary && reviewSummary.terminal) gateFlags.push('review_terminal');
  let reviewReadinessSummary = 'No stronger review gate signal surface is currently derivable.';
  if (reviewReadinessBucket === 'gate_closed') {
    reviewReadinessSummary = `Review gate stays closed because the current review state is already terminal at ${reviewSummary.current_state || 'proposal_only'}.`;
  } else if (reviewReadinessBucket === 'gate_restricted') {
    reviewReadinessSummary = `Gate signals remain restricted: coverage reads as ${coverageSignal}, stability reads as ${stabilitySignal}, contradiction pressure reads as ${contradictionPressureSignal}, and watchpoints read as ${unresolvedWatchpointSignal}.`;
  } else if (reviewReadinessBucket === 'gate_clear_read') {
    reviewReadinessSummary = `Gate signals currently read clear: coverage is ${coverageSignal}, stability is ${stabilitySignal}, contradiction pressure is ${contradictionPressureSignal}, and no unresolved watchpoint remains visible.`;
  } else if (reviewReadinessBucket === 'gate_qualified_read') {
    reviewReadinessSummary = `Gate signals are readable but qualified: coverage is ${coverageSignal}, stability is ${stabilitySignal}, contradiction pressure is ${contradictionPressureSignal}, and watchpoints are ${unresolvedWatchpointSignal}.`;
  }
  return {
    gate_surface_present: digestPresent || contradictionCount > 0 || watchpointCount > 0,
    review_readiness_bucket: reviewReadinessBucket,
    coverage_signal: coverageSignal,
    stability_signal: stabilitySignal,
    contradiction_pressure_signal: contradictionPressureSignal,
    unresolved_watchpoint_signal: unresolvedWatchpointSignal,
    review_readiness_summary: reviewReadinessSummary,
    decision_readiness_carry_through: decisionReadiness,
    gate_flags: Array.from(new Set(gateFlags)).slice(0, 8),
    review_gate_signal_surface_version: 'phase4f-mec-review-gate-signal-surface/v1'
  };
 }

 function buildMecWorkspaceReviewGateThresholdTrace(payload, reviewSummary, latestReview, challengeDossierReviewDigest = null, reviewGateSignalSurface = null, challengeDossierContext = null, challengeDossierDeltaContext = null, contradictionContext = null, decisionPacketContext = null) {
  const readinessBucket = reviewGateSignalSurface && reviewGateSignalSurface.review_readiness_bucket
    ? reviewGateSignalSurface.review_readiness_bucket
    : 'gate_not_ready';
  const coverageSignal = reviewGateSignalSurface && reviewGateSignalSurface.coverage_signal
    ? reviewGateSignalSurface.coverage_signal
    : 'no_visible_dossier';
  const stabilitySignal = reviewGateSignalSurface && reviewGateSignalSurface.stability_signal
    ? reviewGateSignalSurface.stability_signal
    : 'anchor_not_derivable';
  const contradictionPressureSignal = reviewGateSignalSurface && reviewGateSignalSurface.contradiction_pressure_signal
    ? reviewGateSignalSurface.contradiction_pressure_signal
    : 'not_visible';
  const unresolvedWatchpointSignal = reviewGateSignalSurface && reviewGateSignalSurface.unresolved_watchpoint_signal
    ? reviewGateSignalSurface.unresolved_watchpoint_signal
    : 'not_visible';
  const watchpoints = Array.isArray(challengeDossierReviewDigest && challengeDossierReviewDigest.watchpoints)
    ? challengeDossierReviewDigest.watchpoints
    : [];
  const movementBucket = challengeDossierDeltaContext && challengeDossierDeltaContext.movement_bucket
    ? challengeDossierDeltaContext.movement_bucket
    : 'not_derivable';
  const challengePostureBucket = challengeDossierContext && challengeDossierContext.challenge_posture_bucket
    ? challengeDossierContext.challenge_posture_bucket
    : 'no_visible_challenge_dossier';
  const decisionReadiness = decisionPacketContext && decisionPacketContext.decision_readiness
    ? decisionPacketContext.decision_readiness
    : 'decision_underconstrained';
  const contradictionSignals = Array.isArray(contradictionContext && contradictionContext.contradiction_signals)
    ? contradictionContext.contradiction_signals
    : [];
  const reasonCodes = [];
  const blockerReasons = [];
  const concernReasons = [];
  const supportReasons = [];
  const thresholdTrace = [];
  const signalProvenanceRead = [];
  const pushReason = (code, bucket, label, provenance) => {
    const entry = {
      code,
      bucket,
      label,
      provenance: Array.isArray(provenance) ? provenance.slice(0, 4) : []
    };
    reasonCodes.push(code);
    if (bucket === 'blocker') {
      blockerReasons.push(entry);
    } else if (bucket === 'support') {
      supportReasons.push(entry);
    } else {
      concernReasons.push(entry);
    }
    thresholdTrace.push({
      reason_code: code,
      bucket,
      label,
      carried_signals: entry.provenance,
      effect_on_review_bucket: readinessBucket
    });
  };
  const pushProvenance = (field, value, sourceField, sourceSurface) => {
    signalProvenanceRead.push({
      field,
      value,
      source_field: sourceField,
      source_surface: sourceSurface
    });
  };
  pushProvenance('coverage_signal', coverageSignal, 'challenge_posture_bucket', 'challenge_dossier_context');
  pushProvenance('stability_signal', stabilitySignal, 'movement_bucket', 'challenge_dossier_delta_context');
  pushProvenance('contradiction_pressure_signal', contradictionPressureSignal, 'contradiction_signals', 'contradiction_context');
  pushProvenance('unresolved_watchpoint_signal', unresolvedWatchpointSignal, 'watchpoints', 'challenge_dossier_review_digest');
  pushProvenance('review_readiness_bucket', readinessBucket, 'decision_readiness', 'review_gate_signal_surface');
  if (coverageSignal === 'pressure_without_counterexample_coverage') {
    pushReason('coverage_thin_counterexample_missing', 'blocker', 'Challenge pressure is visible but counterexample coverage is still missing.', ['coverage_signal:pressure_without_counterexample_coverage', `challenge_posture:${challengePostureBucket}`]);
  } else if (coverageSignal === 'coverage_gaps_visible' || coverageSignal === 'contribution_with_open_gaps') {
    pushReason('coverage_thin_open_gaps_visible', 'concern', 'Visible coverage gaps still qualify the current gate read.', ['coverage_signal:' + coverageSignal, `coverage_gap_count:${Number(challengeDossierContext && (challengeDossierContext.coverage_gap_count || challengeDossierContext.open_coverage_gap_count) || 0)}`]);
  } else if (coverageSignal === 'reinforced_coverage_visible' || coverageSignal === 'multi_line_coverage_visible') {
    pushReason('coverage_reinforced_visible', 'support', 'Coverage is carried by multiple or reinforcing visible challenge lines.', ['coverage_signal:' + coverageSignal, `challenge_posture:${challengePostureBucket}`]);
  } else if (coverageSignal === 'single_line_coverage_visible' || coverageSignal === 'counterexample_contribution_visible') {
    pushReason('coverage_visible_single_line', 'support', 'At least one visible counterexample contribution is available for gate reading.', ['coverage_signal:' + coverageSignal, `challenge_posture:${challengePostureBucket}`]);
  }
  if (stabilitySignal === 'expanding_since_anchor') {
    pushReason('stability_unstable_expanding', 'blocker', 'The dossier is still expanding relative to the active review anchor.', ['stability_signal:expanding_since_anchor', `movement_bucket:${movementBucket}`]);
  } else if (stabilitySignal === 'changed_since_anchor') {
    pushReason('stability_changed_since_anchor', 'concern', 'The dossier changed across the active review anchor and still qualifies the current read.', ['stability_signal:changed_since_anchor', `movement_bucket:${movementBucket}`]);
  } else if (stabilitySignal === 'pressure_without_coverage') {
    pushReason('stability_unreadable_without_coverage', 'concern', 'Stability cannot be read cleanly because pressure is visible without coverage.', ['stability_signal:pressure_without_coverage', `movement_bucket:${movementBucket}`]);
  } else if (stabilitySignal === 'stable_since_anchor') {
    pushReason('stability_stable_since_anchor', 'support', 'The visible dossier reads as stable relative to the active anchor.', ['stability_signal:stable_since_anchor', `movement_bucket:${movementBucket}`]);
  }
  if (contradictionPressureSignal === 'high_pressure_visible') {
    pushReason('contradiction_pressure_elevated', 'blocker', 'Contradiction pressure is elevated and directly constrains the readiness bucket.', ['contradiction_pressure_signal:high_pressure_visible', `contradiction_count:${contradictionSignals.length}`]);
  } else if (contradictionPressureSignal === 'moderate_pressure_visible') {
    pushReason('contradiction_pressure_present', 'concern', 'Contradiction pressure remains visibly present in the current gate read.', ['contradiction_pressure_signal:moderate_pressure_visible', `contradiction_count:${contradictionSignals.length}`]);
  } else if (contradictionPressureSignal === 'low_pressure_visible') {
    pushReason('contradiction_pressure_low_visible', 'support', 'Only low visible contradiction pressure is currently exposed.', ['contradiction_pressure_signal:low_pressure_visible']);
  }
  if (unresolvedWatchpointSignal === 'watchpoints_elevated') {
    pushReason('watchpoint_elevated', 'blocker', 'Multiple unresolved watchpoints are still driving the current gate bucket.', ['unresolved_watchpoint_signal:watchpoints_elevated', `watchpoint_count:${watchpoints.length}`]);
  } else if (unresolvedWatchpointSignal === 'watchpoints_present') {
    pushReason('watchpoint_present', 'concern', 'Unresolved watchpoints remain visible in the current gate read.', ['unresolved_watchpoint_signal:watchpoints_present', `watchpoint_count:${watchpoints.length}`]);
  } else if (unresolvedWatchpointSignal === 'watchpoints_clear') {
    pushReason('watchpoint_clear', 'support', 'No unresolved watchpoint remains visible in the current gate read.', ['unresolved_watchpoint_signal:watchpoints_clear']);
  }
  if (decisionReadiness === 'decision_fragile') {
    pushReason('decision_packet_fragile', 'concern', 'Decision readiness remains fragile in the carried-through decision packet.', ['decision_readiness:' + decisionReadiness]);
  } else if (decisionReadiness === 'decision_ready') {
    pushReason('decision_packet_ready', 'support', 'Decision readiness currently reads as ready in the carried-through packet.', ['decision_readiness:' + decisionReadiness]);
  } else if (decisionReadiness === 'decision_underconstrained') {
    pushReason('decision_packet_underconstrained', 'concern', 'Decision readiness still reads as underconstrained.', ['decision_readiness:' + decisionReadiness]);
  }
  if (reviewSummary && reviewSummary.terminal) {
    pushReason('review_terminal_state_visible', 'blocker', 'The current review state is already terminal and closes the gate bucket.', ['review_state:' + reviewSummary.current_state]);
  }
  const dedupedReasonCodes = Array.from(new Set(reasonCodes));
  const traceFlags = [];
  if (blockerReasons.length > 0) traceFlags.push('blockers_present');
  if (concernReasons.length > 0) traceFlags.push('concerns_present');
  if (supportReasons.length > 0) traceFlags.push('supports_present');
  if (watchpoints.length > 0) traceFlags.push('watchpoint_provenance_visible');
  if (contradictionSignals.length > 0) traceFlags.push('contradiction_provenance_visible');
  if (readinessBucket === 'gate_closed') traceFlags.push('gate_closed');
  if (readinessBucket === 'gate_restricted') traceFlags.push('gate_restricted');
  if (readinessBucket === 'gate_clear_read') traceFlags.push('gate_clear_read');
  const bucketExplanationSummary = blockerReasons.length > 0
    ? `Review readiness bucket ${readinessBucket} is primarily carried by ${blockerReasons.length} blocker reason(s), with ${concernReasons.length} concern reason(s) and ${supportReasons.length} support reason(s).`
    : concernReasons.length > 0
      ? `Review readiness bucket ${readinessBucket} is qualified by ${concernReasons.length} concern reason(s) while ${supportReasons.length} support reason(s) remain visible.`
      : `Review readiness bucket ${readinessBucket} is currently carried by ${supportReasons.length} support reason(s) without stronger blocker pressure.`;
  return {
    trace_present: Boolean(thresholdTrace.length > 0 || signalProvenanceRead.length > 0),
    review_readiness_bucket: readinessBucket,
    threshold_trace: thresholdTrace.slice(0, 10),
    reason_codes: dedupedReasonCodes.slice(0, 12),
    blocker_reasons: blockerReasons.slice(0, 6),
    concern_reasons: concernReasons.slice(0, 6),
    support_reasons: supportReasons.slice(0, 6),
    signal_provenance_read: signalProvenanceRead.slice(0, 8),
    bucket_explanation_summary: bucketExplanationSummary,
    trace_flags: Array.from(new Set(traceFlags)).slice(0, 8),
    review_gate_threshold_trace_surface_version: 'phase4g-mec-review-gate-threshold-trace/v1'
  };
 }

 function buildMecWorkspaceReviewGateDecisionPacket(payload, reviewSummary, latestReview, evidenceContext = null, challengeContext = null, refutationContext = null, challengeDossierReviewDigest = null, reviewGateSignalSurface = null, reviewGateThresholdTrace = null, decisionPacketContext = null) {
  const readinessBucket = reviewGateSignalSurface && reviewGateSignalSurface.review_readiness_bucket
    ? reviewGateSignalSurface.review_readiness_bucket
    : 'gate_not_ready';
  const primaryReasonCode = Array.isArray(reviewGateThresholdTrace && reviewGateThresholdTrace.reason_codes) && reviewGateThresholdTrace.reason_codes.length > 0
    ? reviewGateThresholdTrace.reason_codes[0]
    : null;
  const reasonCodeCount = Array.isArray(reviewGateThresholdTrace && reviewGateThresholdTrace.reason_codes)
    ? reviewGateThresholdTrace.reason_codes.length
    : 0;
  const gateFlags = Array.isArray(reviewGateSignalSurface && reviewGateSignalSurface.gate_flags)
    ? reviewGateSignalSurface.gate_flags
    : [];
  const digestWatchpoints = Array.isArray(challengeDossierReviewDigest && challengeDossierReviewDigest.watchpoints)
    ? challengeDossierReviewDigest.watchpoints
    : [];
  const blockerReasons = Array.isArray(reviewGateThresholdTrace && reviewGateThresholdTrace.blocker_reasons)
    ? reviewGateThresholdTrace.blocker_reasons
    : [];
  const concernReasons = Array.isArray(reviewGateThresholdTrace && reviewGateThresholdTrace.concern_reasons)
    ? reviewGateThresholdTrace.concern_reasons
    : [];
  const supportReasons = Array.isArray(reviewGateThresholdTrace && reviewGateThresholdTrace.support_reasons)
    ? reviewGateThresholdTrace.support_reasons
    : [];
  const unresolvedDecisionPoints = Array.from(new Set([
    ...digestWatchpoints,
    ...(Array.isArray(decisionPacketContext && decisionPacketContext.missing_signals) ? decisionPacketContext.missing_signals : []),
    ...(Array.isArray(refutationContext && refutationContext.open_qualifiers) ? refutationContext.open_qualifiers : []),
    ...(Array.isArray(challengeContext && challengeContext.challenge_signals) ? challengeContext.challenge_signals.slice(0, 2) : []),
    ...(Array.isArray(refutationContext && refutationContext.qualifying_signals) ? refutationContext.qualifying_signals.slice(0, 2) : [])
  ])).slice(0, 6);
  const riskBucket = blockerReasons.length > 0
    ? 'blocker_weighted'
    : concernReasons.length > 0
      ? 'concern_weighted'
      : supportReasons.length > 0
        ? 'support_weighted'
        : 'not_visible';
  const decisionSnapshot = {
    review_readiness_bucket: readinessBucket,
    review_readiness_summary: reviewGateSignalSurface && reviewGateSignalSurface.review_readiness_summary
      ? reviewGateSignalSurface.review_readiness_summary
      : 'No stronger review gate signal surface is currently derivable.',
    primary_reason_code: primaryReasonCode,
    reason_code_count: reasonCodeCount,
    gate_flags: gateFlags.slice(0, 6),
    watchpoints: digestWatchpoints.slice(0, 4),
    contradiction_pressure_signal: reviewGateSignalSurface && reviewGateSignalSurface.contradiction_pressure_signal
      ? reviewGateSignalSurface.contradiction_pressure_signal
      : 'not_visible',
    stability_signal: reviewGateSignalSurface && reviewGateSignalSurface.stability_signal
      ? reviewGateSignalSurface.stability_signal
      : 'not_visible',
    coverage_signal: reviewGateSignalSurface && reviewGateSignalSurface.coverage_signal
      ? reviewGateSignalSurface.coverage_signal
      : 'not_visible',
    unresolved_watchpoint_signal: reviewGateSignalSurface && reviewGateSignalSurface.unresolved_watchpoint_signal
      ? reviewGateSignalSurface.unresolved_watchpoint_signal
      : 'not_visible'
  };
  const decisionBasis = {
    carried_fields: [
      {
        source_surface: 'challenge_dossier_review_digest',
        field: 'digest_bucket',
        value: challengeDossierReviewDigest && challengeDossierReviewDigest.digest_bucket
          ? challengeDossierReviewDigest.digest_bucket
          : 'not_applicable'
      },
      {
        source_surface: 'review_gate_signal_surface',
        field: 'review_readiness_bucket',
        value: readinessBucket
      },
      {
        source_surface: 'review_gate_signal_surface',
        field: 'coverage_signal',
        value: reviewGateSignalSurface && reviewGateSignalSurface.coverage_signal
          ? reviewGateSignalSurface.coverage_signal
          : 'not_visible'
      },
      {
        source_surface: 'review_gate_signal_surface',
        field: 'stability_signal',
        value: reviewGateSignalSurface && reviewGateSignalSurface.stability_signal
          ? reviewGateSignalSurface.stability_signal
          : 'not_visible'
      },
      {
        source_surface: 'review_gate_threshold_trace',
        field: 'primary_reason_code',
        value: primaryReasonCode || 'not_visible'
      },
      {
        source_surface: 'review_gate_threshold_trace',
        field: 'trace_flags',
        value: Array.isArray(reviewGateThresholdTrace && reviewGateThresholdTrace.trace_flags)
          ? reviewGateThresholdTrace.trace_flags.slice(0, 4).join(', ')
          : 'not_visible'
      }
    ],
    basis_summary: `This packet is carried by 4E digest ${challengeDossierReviewDigest && challengeDossierReviewDigest.digest_bucket ? challengeDossierReviewDigest.digest_bucket : 'not_applicable'}, 4F gate bucket ${readinessBucket}, and ${reasonCodeCount} visible 4G reason code(s).`
  };
  const evidenceAnchorRead = {
    evidence_summary: evidenceContext && evidenceContext.evidence_summary
      ? evidenceContext.evidence_summary
      : 'Only minimal lineage signals are available on this workspace item.',
    source_anchor: evidenceContext && Array.isArray(evidenceContext.source_event_context) && evidenceContext.source_event_context.length > 0
      ? evidenceContext.source_event_context.slice(0, 2).map(item => `${item.event_id}${item.summary ? ` | ${item.summary}` : ''}`)
      : [],
    challenge_anchor: challengeContext && challengeContext.challenge_summary
      ? challengeContext.challenge_summary
      : 'No stronger challenge anchor is currently visible.',
    refutation_anchor: refutationContext && refutationContext.refutation_summary
      ? refutationContext.refutation_summary
      : 'No stronger refutation anchor is currently visible.',
    digest_anchor: challengeDossierReviewDigest && challengeDossierReviewDigest.digest_summary
      ? challengeDossierReviewDigest.digest_summary
      : 'No stronger digest anchor is currently visible.'
  };
  const decisionRiskRead = {
    risk_bucket: riskBucket,
    blocker_count: blockerReasons.length,
    concern_count: concernReasons.length,
    support_count: supportReasons.length,
    blocker_read: blockerReasons.slice(0, 3).map(item => item.label),
    concern_read: concernReasons.slice(0, 3).map(item => item.label),
    support_read: supportReasons.slice(0, 3).map(item => item.label),
    risk_summary: blockerReasons.length > 0
      ? `Decision risk currently reads blocker-weighted with ${blockerReasons.length} blocker reason(s) still visible.`
      : concernReasons.length > 0
        ? `Decision risk currently reads concern-weighted with ${concernReasons.length} concern reason(s) still qualifying the packet.`
        : `Decision risk currently reads support-weighted with ${supportReasons.length} support reason(s) and no stronger blocker pressure.`
  };
  const packetFlags = [];
  if (readinessBucket === 'gate_closed') packetFlags.push('decision_packet_closed');
  if (readinessBucket === 'gate_restricted') packetFlags.push('decision_packet_restricted');
  if (readinessBucket === 'gate_clear_read') packetFlags.push('decision_packet_clear_read');
  if (blockerReasons.length > 0) packetFlags.push('blocker_weighted_packet');
  if (concernReasons.length > 0) packetFlags.push('concern_weighted_packet');
  if (supportReasons.length > 0) packetFlags.push('support_weighted_packet');
  if (unresolvedDecisionPoints.length > 0) packetFlags.push('open_decision_points_visible');
  if (evidenceContext && evidenceContext.integrity_state === 'degraded') packetFlags.push('evidence_integrity_degraded');
  const decisionPacketSummary = blockerReasons.length > 0
    ? `Decision packet reads ${readinessBucket} with ${primaryReasonCode || 'no primary reason code'} as the leading explanation, ${digestWatchpoints.length} visible watchpoint(s), and ${unresolvedDecisionPoints.length} open decision point(s) still in view.`
    : `Decision packet reads ${readinessBucket} with ${reasonCodeCount} visible reason code(s), ${supportReasons.length} support reason(s), and ${unresolvedDecisionPoints.length} open decision point(s).`;
  return {
    packet_present: Boolean((reviewGateSignalSurface && reviewGateSignalSurface.gate_surface_present) || reasonCodeCount > 0 || unresolvedDecisionPoints.length > 0),
    decision_snapshot: decisionSnapshot,
    decision_basis: decisionBasis,
    evidence_anchor_read: evidenceAnchorRead,
    decision_risk_read: decisionRiskRead,
    unresolved_decision_points: unresolvedDecisionPoints,
    packet_flags: Array.from(new Set(packetFlags)).slice(0, 8),
    decision_packet_summary: decisionPacketSummary,
    review_gate_decision_packet_surface_version: 'phase4h-mec-review-gate-decision-packet/v1'
  };
 }

 function buildMecWorkspaceReviewActionPostureSurface(payload, reviewSummary, latestReview, controlReadiness = null, evidenceContext = null, challengeContext = null, refutationContext = null, challengeDossierReviewDigest = null, reviewGateSignalSurface = null, reviewGateThresholdTrace = null, reviewGateDecisionPacket = null, reviewTraceContext = null) {
  const readinessBucket = reviewGateDecisionPacket && reviewGateDecisionPacket.decision_snapshot && reviewGateDecisionPacket.decision_snapshot.review_readiness_bucket
    ? reviewGateDecisionPacket.decision_snapshot.review_readiness_bucket
    : reviewGateSignalSurface && reviewGateSignalSurface.review_readiness_bucket
      ? reviewGateSignalSurface.review_readiness_bucket
      : 'gate_not_ready';
  const blockerReasons = Array.isArray(reviewGateThresholdTrace && reviewGateThresholdTrace.blocker_reasons)
    ? reviewGateThresholdTrace.blocker_reasons
    : [];
  const concernReasons = Array.isArray(reviewGateThresholdTrace && reviewGateThresholdTrace.concern_reasons)
    ? reviewGateThresholdTrace.concern_reasons
    : [];
  const watchpoints = Array.isArray(challengeDossierReviewDigest && challengeDossierReviewDigest.watchpoints)
    ? challengeDossierReviewDigest.watchpoints
    : [];
  const unresolvedDecisionPoints = Array.isArray(reviewGateDecisionPacket && reviewGateDecisionPacket.unresolved_decision_points)
    ? reviewGateDecisionPacket.unresolved_decision_points
    : [];
  const contradictionPressureSignal = reviewGateDecisionPacket && reviewGateDecisionPacket.decision_snapshot && reviewGateDecisionPacket.decision_snapshot.contradiction_pressure_signal
    ? reviewGateDecisionPacket.decision_snapshot.contradiction_pressure_signal
    : reviewGateSignalSurface && reviewGateSignalSurface.contradiction_pressure_signal
      ? reviewGateSignalSurface.contradiction_pressure_signal
      : 'not_visible';
  const reviewable = Boolean(controlReadiness && controlReadiness.reviewable);
  const terminal = Boolean(controlReadiness && controlReadiness.terminal);
  const evidenceDegraded = Boolean(evidenceContext && evidenceContext.integrity_state === 'degraded');
  const tracePresent = Boolean(reviewTraceContext && reviewTraceContext.trace_present);
  const holdReasons = [];
  const escalationReasons = [];
  if (!reviewable || terminal) {
    holdReasons.push(`Manual review writes are not currently available because the workspace reads as ${reviewSummary && reviewSummary.current_state ? reviewSummary.current_state : 'not_reviewable'}.`);
  }
  if (readinessBucket === 'gate_closed') {
    holdReasons.push('The current 4H packet reads gate_closed, so manual write posture remains on hold.');
  }
  if (blockerReasons.length > 0) {
    holdReasons.push(`${blockerReasons.length} blocker reason(s) remain visible in the 4G threshold trace.`);
  }
  if (evidenceDegraded) {
    holdReasons.push('Evidence integrity is degraded, so manual write posture remains qualified by unresolved runtime references.');
  }
  if (watchpoints.length > 0) {
    escalationReasons.push(`${watchpoints.length} digest watchpoint(s) remain visible in the consolidated review read.`);
  }
  if (concernReasons.length > 0) {
    escalationReasons.push(`${concernReasons.length} concern reason(s) remain visible in the 4G threshold trace.`);
  }
  if (unresolvedDecisionPoints.length > 0) {
    escalationReasons.push(`${unresolvedDecisionPoints.length} open decision point(s) remain visible in the 4H packet.`);
  }
  if (contradictionPressureSignal !== 'not_visible' && contradictionPressureSignal !== 'low_visible_pressure') {
    escalationReasons.push(`Contradiction pressure still reads as ${contradictionPressureSignal}.`);
  }
  const postureBucket = !reviewable || terminal
    ? 'manual_locked'
    : holdReasons.length > 0
      ? 'manual_hold'
      : escalationReasons.length > 0 && concernReasons.length > 0
        ? 'manual_escalation_read'
        : readinessBucket === 'gate_restricted' || unresolvedDecisionPoints.length > 0
          ? 'manual_qualified_read'
          : readinessBucket === 'gate_clear_read'
            ? 'manual_clear_read'
            : 'manual_reviewable_read';
  const allowedManualActions = [];
  const blockedManualActions = [];
  const actionPreconditions = [];
  function registerAction(action, actionClass, requirements, satisfied, basis, blockedBy = []) {
    const normalizedRequirements = requirements.slice(0, 4);
    actionPreconditions.push({
      action,
      action_class: actionClass,
      status: satisfied ? 'satisfied' : 'blocked',
      requirements: normalizedRequirements
    });
    const entry = {
      action,
      action_class: actionClass,
      basis,
      requirements: normalizedRequirements
    };
    if (satisfied) {
      allowedManualActions.push(entry);
      return;
    }
    blockedManualActions.push({
      ...entry,
      blocked_by: blockedBy.slice(0, 4)
    });
  }
  registerAction(
    'inspect_decision_packet',
    'manual_read',
    ['4H decision packet is visible in the canonical workspace'],
    Boolean(reviewGateDecisionPacket && reviewGateDecisionPacket.packet_present),
    'Read the compact 4H packet without selecting or automating any action.',
    ['No stronger decision packet is currently visible on this workspace item.']
  );
  registerAction(
    'inspect_evidence_lineage',
    'manual_read',
    ['Evidence context remains visible in the canonical workspace'],
    Boolean(evidenceContext),
    'Inspect evidence anchors and runtime reference integrity before any manual write.',
    ['No stronger evidence context is currently visible.']
  );
  registerAction(
    'inspect_watchpoints',
    'manual_read',
    ['One or more consolidated digest watchpoints remain visible'],
    watchpoints.length > 0,
    'Inspect watchpoints that still qualify the current manual review posture.',
    ['No stronger watchpoint is currently visible.']
  );
  registerAction(
    'inspect_open_decision_points',
    'manual_read',
    ['One or more open decision points remain visible'],
    unresolvedDecisionPoints.length > 0,
    'Inspect open decision points that remain unresolved in the current packet read.',
    ['No stronger open decision point is currently visible.']
  );
  registerAction(
    'inspect_refutation_context',
    'manual_read',
    ['Refutation or counterexample context remains visible'],
    Boolean(refutationContext && refutationContext.refutation_present),
    'Inspect visible refutation context before changing the manual review posture.',
    ['No stronger refutation context is currently visible.']
  );
  registerAction(
    'inspect_review_trace',
    'manual_read',
    ['A latest review trace is visible on the workspace'],
    tracePresent,
    'Inspect what was visible when the latest manual review write occurred.',
    ['No stronger review trace is currently visible.']
  );
  registerAction(
    'write_stabilize_review',
    'manual_write',
    ['workspace remains reviewable', 'gate bucket reads gate_clear_read', 'no blocker reason remains visible', 'evidence integrity is not degraded'],
    reviewable && !terminal && readinessBucket === 'gate_clear_read' && blockerReasons.length < 1 && !evidenceDegraded,
    'A manual stabilize write remains visible only when the canonical read is clear enough to support it without automation.',
    !reviewable || terminal
      ? ['The workspace is no longer reviewable for a manual stabilize write.']
      : readinessBucket !== 'gate_clear_read'
        ? [`The current gate bucket reads ${readinessBucket}, not gate_clear_read.`]
        : blockerReasons.length > 0
          ? [`${blockerReasons.length} blocker reason(s) still qualify the gate trace.`]
          : ['Evidence integrity is degraded by unresolved runtime references.']
  );
  registerAction(
    'write_reject_review',
    'manual_write',
    ['workspace remains reviewable', 'no terminal review state is present', 'review rationale must be written manually'],
    reviewable && !terminal,
    'A manual reject write stays visible as a human action, not as an automatic recommendation.',
    ['The workspace is no longer reviewable for a manual reject write.']
  );
  const postureFlags = [];
  if (postureBucket === 'manual_locked') postureFlags.push('manual_posture_locked');
  if (postureBucket === 'manual_hold') postureFlags.push('manual_posture_hold');
  if (postureBucket === 'manual_escalation_read') postureFlags.push('manual_posture_escalation_read');
  if (postureBucket === 'manual_qualified_read') postureFlags.push('manual_posture_qualified_read');
  if (postureBucket === 'manual_clear_read') postureFlags.push('manual_posture_clear_read');
  if (allowedManualActions.some(item => item.action === 'write_stabilize_review')) postureFlags.push('stabilize_write_visible');
  if (allowedManualActions.some(item => item.action === 'write_reject_review')) postureFlags.push('reject_write_visible');
  if (watchpoints.length > 0) postureFlags.push('watchpoints_visible');
  if (unresolvedDecisionPoints.length > 0) postureFlags.push('open_points_visible');
  if (blockerReasons.length > 0) postureFlags.push('blockers_visible');
  if (concernReasons.length > 0) postureFlags.push('concerns_visible');
  if (evidenceDegraded) postureFlags.push('evidence_integrity_degraded');
  if (tracePresent) postureFlags.push('review_trace_visible');
  const manualNextStepRead = postureBucket === 'manual_locked'
    ? 'Manual posture is locked; the workspace remains readable, but no further manual review write is currently visible.'
    : postureBucket === 'manual_hold'
      ? `Manual posture is hold-weighted; ${holdReasons.length} hold reason(s) remain visible while read-only inspection actions stay available.`
      : postureBucket === 'manual_escalation_read'
        ? `Manual posture is escalation-weighted; ${escalationReasons.length} escalation reason(s) remain visible for human judgment before any write.`
        : postureBucket === 'manual_qualified_read'
          ? `Manual posture is qualified rather than blocked; ${unresolvedDecisionPoints.length} open decision point(s) and ${concernReasons.length} concern reason(s) remain visible.`
          : postureBucket === 'manual_clear_read'
            ? 'Manual posture is clear-read; manual write actions remain visible, but no action is selected automatically.'
            : 'Manual posture remains readable with mixed inspection and write visibility.';
  return {
    posture_bucket: postureBucket,
    allowed_manual_actions: allowedManualActions.slice(0, 8),
    blocked_manual_actions: blockedManualActions.slice(0, 8),
    action_preconditions: actionPreconditions.slice(0, 10),
    posture_flags: Array.from(new Set(postureFlags)).slice(0, 10),
    manual_next_step_read: manualNextStepRead,
    hold_reasons: holdReasons.slice(0, 6),
    escalation_reasons: escalationReasons.slice(0, 6),
    review_action_posture_surface_version: 'phase4i-mec-review-action-posture/v1'
  };
 }

 function buildMecReviewWorkspaceItem(payload, reviewRecords = [], context = {}) {
  if (!payload) {
    return null;
  }
  const candidateMap = context.candidateMap || new Map();
  const eventMap = context.eventMap || new Map();
  const reviewMap = context.reviewMap || new Map();
  const freshnessPayload = enrichMecCandidateFreshness(payload);
  const reviewSummary = buildMecReviewSummary(reviewRecords);
  const latestReview = getLatestMecReviewRecord(reviewRecords);
  const sourceLinkage = buildMecWorkspaceSourceLinkage(payload, candidateMap, eventMap);
  const unresolvedRuntimeReferences = buildMecWorkspaceUnresolvedReferences(payload, sourceLinkage, candidateMap, eventMap);
  const controlReadiness = buildMecWorkspaceControlReadiness(reviewSummary, unresolvedRuntimeReferences);
  const evidenceContext = buildMecWorkspaceEvidenceContext(payload, sourceLinkage, unresolvedRuntimeReferences, candidateMap, eventMap);
  const reviewHistoryContext = buildMecWorkspaceReviewHistoryContext(reviewSummary, latestReview, reviewRecords);
  const relatedCandidates = buildMecWorkspaceRelatedCandidates(payload, candidateMap, reviewMap);
  const stateExplanation = buildMecWorkspaceStateExplanation(reviewSummary, controlReadiness, unresolvedRuntimeReferences, sourceLinkage, reviewHistoryContext, relatedCandidates);
  const focusContext = buildMecWorkspaceFocusContext(reviewSummary, controlReadiness, unresolvedRuntimeReferences, evidenceContext, reviewHistoryContext, relatedCandidates, sourceLinkage);
  const compareContext = buildMecWorkspaceCompareContext(payload, candidateMap, eventMap, reviewMap, sourceLinkage, relatedCandidates);
  const deltaContext = buildMecWorkspaceDeltaContext(payload, reviewSummary, latestReview, unresolvedRuntimeReferences, sourceLinkage, evidenceContext, reviewHistoryContext, controlReadiness, focusContext, compareContext);
  const contradictionContext = buildMecWorkspaceContradictionContext(reviewSummary, controlReadiness, unresolvedRuntimeReferences, evidenceContext, reviewHistoryContext, focusContext, compareContext, deltaContext);
  const decisionPacketContext = buildMecWorkspaceDecisionPacketContext(reviewSummary, latestReview, controlReadiness, unresolvedRuntimeReferences, sourceLinkage, evidenceContext, reviewHistoryContext, relatedCandidates, stateExplanation, focusContext, compareContext, deltaContext, contradictionContext);
  const reviewTraceContext = buildMecWorkspaceReviewTraceContext(latestReview, reviewSummary, decisionPacketContext, contradictionContext, deltaContext);
  const challengeContext = buildMecWorkspaceChallengeContext(payload, latestReview, sourceLinkage, unresolvedRuntimeReferences, evidenceContext, reviewHistoryContext, relatedCandidates, deltaContext, contradictionContext, decisionPacketContext, reviewTraceContext, candidateMap);
  const refutationContext = buildMecWorkspaceRefutationContext(payload, reviewSummary, latestReview, sourceLinkage, unresolvedRuntimeReferences, evidenceContext, reviewHistoryContext, relatedCandidates, deltaContext, contradictionContext, decisionPacketContext, challengeContext, reviewTraceContext, candidateMap, reviewMap);
  const challengeDossierContext = buildMecWorkspaceChallengeDossierContext(payload, reviewSummary, latestReview, sourceLinkage, unresolvedRuntimeReferences, evidenceContext, reviewHistoryContext, relatedCandidates, deltaContext, contradictionContext, decisionPacketContext, challengeContext, refutationContext, reviewTraceContext, candidateMap, reviewMap);
  const challengeDossierDeltaContext = buildMecWorkspaceChallengeDossierDeltaContext(payload, reviewSummary, latestReview, challengeDossierContext, reviewTraceContext, candidateMap);
  const challengeDossierReviewDigest = buildMecWorkspaceChallengeDossierReviewDigest(payload, reviewSummary, latestReview, sourceLinkage, unresolvedRuntimeReferences, evidenceContext, reviewHistoryContext, relatedCandidates, deltaContext, contradictionContext, decisionPacketContext, challengeContext, refutationContext, challengeDossierContext, challengeDossierDeltaContext, reviewTraceContext, candidateMap, reviewMap);
  const reviewGateSignalSurface = buildMecWorkspaceReviewGateSignalSurface(payload, reviewSummary, latestReview, contradictionContext, decisionPacketContext, challengeContext, refutationContext, challengeDossierContext, challengeDossierDeltaContext, challengeDossierReviewDigest);
  const reviewGateThresholdTrace = buildMecWorkspaceReviewGateThresholdTrace(payload, reviewSummary, latestReview, challengeDossierReviewDigest, reviewGateSignalSurface, challengeDossierContext, challengeDossierDeltaContext, contradictionContext, decisionPacketContext);
  const reviewGateDecisionPacket = buildMecWorkspaceReviewGateDecisionPacket(payload, reviewSummary, latestReview, evidenceContext, challengeContext, refutationContext, challengeDossierReviewDigest, reviewGateSignalSurface, reviewGateThresholdTrace, decisionPacketContext);
  const reviewActionPostureSurface = buildMecWorkspaceReviewActionPostureSurface(payload, reviewSummary, latestReview, controlReadiness, evidenceContext, challengeContext, refutationContext, challengeDossierReviewDigest, reviewGateSignalSurface, reviewGateThresholdTrace, reviewGateDecisionPacket, reviewTraceContext);
  return {
    workspace_kind: 'mec_review_workspace',
    workspace_version: 'phase3c-mec-review-workspace/v1',
    workspace_id: freshnessPayload.id,
    candidate_id: freshnessPayload.id,
    candidate_type: freshnessPayload.candidate_type,
    title: buildMecWorkspaceTitle(freshnessPayload),
    current_review_state: reviewSummary.current_state,
    latest_review_outcome: latestReview ? latestReview.review_outcome : null,
    latest_review: latestReview ? {
      review_id: latestReview.review_id,
      review_outcome: latestReview.review_outcome,
      reviewed_at: latestReview.reviewed_at,
      review_source: latestReview.review_source,
      reviewer_mode: latestReview.reviewer_mode,
      confidence: latestReview.confidence || null,
      notes: Array.isArray(latestReview.notes) ? latestReview.notes : [],
      rationale_snapshot: latestReview.rationale_snapshot && typeof latestReview.rationale_snapshot === 'object'
        ? { ...latestReview.rationale_snapshot }
        : null
    } : null,
    review_summary: reviewSummary,
    status_derivation: {
      schema_version: reviewSummary.derivation_version,
      rule: reviewSummary.derivation_rule,
      reviewable: reviewSummary.reviewable,
      terminal: reviewSummary.terminal
    },
    freshness_state: freshnessPayload.freshness_state,
    source_linkage: sourceLinkage,
    unresolved_runtime_references: unresolvedRuntimeReferences,
    unresolved_runtime_reference_count: unresolvedRuntimeReferences.length,
    reviewable: reviewSummary.reviewable,
    terminal: reviewSummary.terminal,
    control_readiness: controlReadiness,
    evidence_context: evidenceContext,
    review_history_context: reviewHistoryContext,
    related_candidate_context: relatedCandidates,
    state_explanation: stateExplanation,
    focus_context: focusContext,
    compare_context: compareContext,
    delta_context: deltaContext,
    contradiction_context: contradictionContext,
    decision_packet_context: decisionPacketContext,
    challenge_context: challengeContext,
    refutation_context: refutationContext,
    challenge_dossier_context: challengeDossierContext,
    challenge_dossier_delta_context: challengeDossierDeltaContext,
    challenge_dossier_review_digest: challengeDossierReviewDigest,
    review_gate_signal_surface: reviewGateSignalSurface,
    review_gate_threshold_trace: reviewGateThresholdTrace,
    review_gate_decision_packet: reviewGateDecisionPacket,
    review_action_posture_surface: reviewActionPostureSurface,
    review_trace_context: reviewTraceContext,
    workspace_summary: {
      review_count: reviewSummary.review_count,
      latest_review_outcome: latestReview ? latestReview.review_outcome : null,
      linked_relevance: sourceLinkage.related_candidate_ids.length > 0,
      unresolved_runtime_reference_count: unresolvedRuntimeReferences.length,
      attention_required: controlReadiness.attention_required,
      delta_attention: deltaContext.review_attention_now,
      decision_readiness: decisionPacketContext.decision_readiness,
      contradiction_present: contradictionContext.contradiction_present,
      challenge_pressure_bucket: challengeContext.contradiction_pressure_bucket,
      refutation_present: refutationContext.refutation_present,
      refutation_role: refutationContext.refutation_role,
      visible_refutation_count: Number(refutationContext.visible_counterexample_count || refutationContext.visible_sibling_counterexample_count || 0),
      challenge_dossier_present: challengeDossierContext.dossier_present,
      challenge_dossier_role: challengeDossierContext.dossier_role,
      challenge_posture_bucket: challengeDossierContext.challenge_posture_bucket,
      challenge_line_count: Number(challengeDossierContext.distinct_challenge_line_count || 0),
      challenge_dossier_delta_movement: challengeDossierDeltaContext.movement_bucket,
      challenge_dossier_new_lines: challengeDossierDeltaContext.new_line_count,
      challenge_dossier_review_digest_present: challengeDossierReviewDigest.digest_present,
      challenge_dossier_review_digest_bucket: challengeDossierReviewDigest.digest_bucket,
      challenge_dossier_review_watchpoints: challengeDossierReviewDigest.watchpoint_count,
      review_gate_readiness_bucket: reviewGateSignalSurface.review_readiness_bucket,
      review_gate_coverage_signal: reviewGateSignalSurface.coverage_signal,
      review_gate_watchpoint_signal: reviewGateSignalSurface.unresolved_watchpoint_signal,
      review_gate_reason_code_count: Array.isArray(reviewGateThresholdTrace.reason_codes) ? reviewGateThresholdTrace.reason_codes.length : 0,
      review_gate_primary_reason_code: Array.isArray(reviewGateThresholdTrace.reason_codes) && reviewGateThresholdTrace.reason_codes.length > 0 ? reviewGateThresholdTrace.reason_codes[0] : null,
      review_gate_decision_risk_bucket: reviewGateDecisionPacket && reviewGateDecisionPacket.decision_risk_read ? reviewGateDecisionPacket.decision_risk_read.risk_bucket : 'not_visible',
      review_gate_decision_open_point_count: reviewGateDecisionPacket && Array.isArray(reviewGateDecisionPacket.unresolved_decision_points) ? reviewGateDecisionPacket.unresolved_decision_points.length : 0,
      review_action_posture_bucket: reviewActionPostureSurface ? reviewActionPostureSurface.posture_bucket : 'not_visible',
      review_action_allowed_count: reviewActionPostureSurface && Array.isArray(reviewActionPostureSurface.allowed_manual_actions) ? reviewActionPostureSurface.allowed_manual_actions.length : 0,
      review_action_blocked_count: reviewActionPostureSurface && Array.isArray(reviewActionPostureSurface.blocked_manual_actions) ? reviewActionPostureSurface.blocked_manual_actions.length : 0,
      review_action_hold_count: reviewActionPostureSurface && Array.isArray(reviewActionPostureSurface.hold_reasons) ? reviewActionPostureSurface.hold_reasons.length : 0,
      review_action_escalation_count: reviewActionPostureSurface && Array.isArray(reviewActionPostureSurface.escalation_reasons) ? reviewActionPostureSurface.escalation_reasons.length : 0,
      trace_present: reviewTraceContext.trace_present
    },
    raw_review_records: reviewRecords.map(record => ({ ...record })),
    raw_candidate_artifact: payload,
    ...freshnessPayload
  };
}

function listMecReviewWorkspace(options = {}) {
  const candidateOutputDir = options.candidateOutputDir || process.env.MEC_CANDIDATE_DIR || DEFAULT_CANDIDATES_DIR;
  const rawCandidates = listCandidates({ candidateOutputDir });
  const candidateMap = new Map(rawCandidates.map(item => [item.id, item]));
  const eventMap = getMecEventMap(options);
  const reviewMap = getMecReviewRecordsByCandidate(options);
  return rawCandidates.map(item => buildMecReviewWorkspaceItem(item, reviewMap.get(item.id) || [], { candidateMap, eventMap, reviewMap }));
}

function readMecReviewWorkspace(candidateId, options = {}) {
  const candidateOutputDir = options.candidateOutputDir || process.env.MEC_CANDIDATE_DIR || DEFAULT_CANDIDATES_DIR;
  const payload = getCandidate(candidateId, { candidateOutputDir });
  if (!payload) {
    return null;
  }
  const rawCandidates = listCandidates({ candidateOutputDir });
  const candidateMap = new Map(rawCandidates.map(item => [item.id, item]));
  const eventMap = getMecEventMap(options);
  const reviewMap = getMecReviewRecordsByCandidate(options);
  return buildMecReviewWorkspaceItem(payload, reviewMap.get(candidateId) || [], { candidateMap, eventMap, reviewMap });
}

function enrichMemoryCandidate(payload, reviewRecords = [], exportReviewRecords = []) {
  const reviewSummary = buildReviewSummary(reviewRecords);
  const exportReadiness = deriveExportReadiness(payload, reviewSummary);
  const exportReviewSummary = buildExportReviewSummary(exportReviewRecords);
  const exportGateDecision = deriveExportGateDecision(payload, exportReadiness, exportReviewSummary);
  return {
    ...payload,
    current_status: reviewSummary.current_status,
    review_summary: reviewSummary,
    status_derivation: {
      schema_version: reviewSummary.derivation_version,
      rule: reviewSummary.derivation_rule,
      reviewable: reviewSummary.reviewable,
      terminal: reviewSummary.terminal
    },
    export_readiness_status: exportReadiness.export_readiness_status,
    export_blockers: exportReadiness.export_blockers,
    export_readiness: exportReadiness,
    current_export_review_status: exportReviewSummary.current_export_review_status,
    export_review_summary: exportReviewSummary,
    export_gate_status: exportGateDecision.export_gate_status,
    export_gate_reasons: exportGateDecision.export_gate_reasons,
    export_gate_blockers: exportGateDecision.export_gate_blockers,
    export_gate_decision: exportGateDecision
  };
}

function enrichMecCandidate(payload, reviewRecords = []) {
  const freshnessPayload = enrichMecCandidateFreshness(payload);
  const reviewSummary = buildMecReviewSummary(reviewRecords);
  return {
    ...freshnessPayload,
    current_review_state: reviewSummary.current_state,
    review_summary: reviewSummary,
    status_derivation: {
      schema_version: reviewSummary.derivation_version,
      rule: reviewSummary.derivation_rule,
      reviewable: reviewSummary.reviewable,
      terminal: reviewSummary.terminal
    }
  };
}

function readStoredMemoryCandidate(candidateId, options = {}) {
  const memoryOutputDir = options.memoryOutputDir || process.env.ARENA_MEMORY_DIR || DEFAULT_MEMORY_CANDIDATES_DIR;
  const filePath = path.join(memoryOutputDir, `${candidateId}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return readJsonFile(filePath);
}

function saveRunTrace(packet, options = {}) {
  const outputDir = options.outputDir || process.env.ARENA_RUNS_DIR || DEFAULT_RUNS_DIR;
  ensureDirectory(outputDir);
  const filePath = path.join(outputDir, `${packet.run_id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(packet, null, 2));
  return {
    filePath,
    packet
  };
}

function saveAuditRecord(packet, options = {}) {
  const auditOutputDir = options.auditOutputDir || process.env.ARENA_AUDIT_DIR || DEFAULT_AUDIT_DIR;
  ensureDirectory(auditOutputDir);
  const auditFilePath = path.join(auditOutputDir, `${packet.run_id}.json`);
  fs.writeFileSync(auditFilePath, JSON.stringify(packet.audit, null, 2));
  return {
    auditFilePath,
    auditRecord: packet.audit
  };
}

function saveMemoryCandidates(packet, options = {}) {
  const memoryOutputDir = options.memoryOutputDir || process.env.ARENA_MEMORY_DIR || DEFAULT_MEMORY_CANDIDATES_DIR;
  ensureDirectory(memoryOutputDir);
  const memoryCandidateFilePaths = [];
  for (const candidate of packet.memory_candidates.items) {
    const filePath = path.join(memoryOutputDir, `${candidate.candidate_id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(candidate, null, 2));
    memoryCandidateFilePaths.push(filePath);
  }
  return {
    memoryCandidateFilePaths,
    memoryCandidates: packet.memory_candidates.items
  };
}

function saveMemoryReview(reviewRecord, options = {}) {
  const memoryReviewOutputDir = options.memoryReviewOutputDir || process.env.ARENA_MEMORY_REVIEW_DIR || DEFAULT_MEMORY_REVIEWS_DIR;
  ensureDirectory(memoryReviewOutputDir);
  const reviewFilePath = path.join(memoryReviewOutputDir, `${reviewRecord.review_id}.json`);
  fs.writeFileSync(reviewFilePath, JSON.stringify(reviewRecord, null, 2));
  return {
    reviewFilePath,
    reviewRecord
  };
}

function saveMecReview(reviewRecord, options = {}) {
  const mecReviewOutputDir = options.mecReviewOutputDir || process.env.MEC_REVIEW_DIR || DEFAULT_MEC_REVIEWS_DIR;
  ensureDirectory(mecReviewOutputDir);
  const reviewFilePath = path.join(mecReviewOutputDir, `${reviewRecord.review_id}.json`);
  fs.writeFileSync(reviewFilePath, JSON.stringify(reviewRecord, null, 2));
  return {
    reviewFilePath,
    reviewRecord
  };
}

function saveExportReview(exportReviewRecord, options = {}) {
  const exportReviewOutputDir = options.exportReviewOutputDir || process.env.ARENA_EXPORT_REVIEW_DIR || DEFAULT_EXPORT_REVIEWS_DIR;
  ensureDirectory(exportReviewOutputDir);
  const exportReviewFilePath = path.join(exportReviewOutputDir, `${exportReviewRecord.export_review_id}.json`);
  fs.writeFileSync(exportReviewFilePath, JSON.stringify(exportReviewRecord, null, 2));
  return {
    exportReviewFilePath,
    exportReviewRecord
  };
}

function executeArenaRun(input = {}, options = {}) {
  const packet = createArenaRunPacket(input, options);
  if (options.persist === false) {
    return {
      filePath: null,
      auditFilePath: null,
      memoryCandidateFilePaths: [],
      packet
    };
  }
  const runResult = saveRunTrace(packet, options);
  const auditResult = saveAuditRecord(packet, options);
  const memoryResult = saveMemoryCandidates(packet, options);
  return {
    ...runResult,
    ...auditResult,
    ...memoryResult
  };
}

function listArenaRuns(options = {}) {
  const outputDir = options.outputDir || process.env.ARENA_RUNS_DIR || DEFAULT_RUNS_DIR;
  if (!fs.existsSync(outputDir)) {
    return [];
  }

  return fs.readdirSync(outputDir)
    .filter(file => file.endsWith('.json'))
    .sort()
    .map(file => {
      const filePath = path.join(outputDir, file);
      const payload = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return {
        run_id: payload.run_id,
        created_at: payload.created_at,
        decision: payload.observer_decision ? payload.observer_decision.decision : null,
        profile: payload.model_control ? payload.model_control.selected_profile : null,
        memory_candidate_count: payload.memory_candidates ? payload.memory_candidates.count : 0,
        file_path: filePath
      };
    });
}

function readArenaRun(runId, options = {}) {
  const outputDir = options.outputDir || process.env.ARENA_RUNS_DIR || DEFAULT_RUNS_DIR;
  const filePath = path.join(outputDir, `${runId}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function readAuditRecord(runId, options = {}) {
  const auditOutputDir = options.auditOutputDir || process.env.ARENA_AUDIT_DIR || DEFAULT_AUDIT_DIR;
  const filePath = path.join(auditOutputDir, `${runId}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function listMemoryCandidates(options = {}) {
  const memoryOutputDir = options.memoryOutputDir || process.env.ARENA_MEMORY_DIR || DEFAULT_MEMORY_CANDIDATES_DIR;
  if (!fs.existsSync(memoryOutputDir)) {
    return [];
  }
  const reviewMap = getReviewRecordsByCandidate(options);
  const exportReviewMap = getExportReviewRecordsByCandidate(options);

  return fs.readdirSync(memoryOutputDir)
    .filter(file => file.endsWith('.json'))
    .sort()
    .map(file => {
      const filePath = path.join(memoryOutputDir, file);
      const payload = readJsonFile(filePath);
      const reviewRecords = reviewMap.get(payload.candidate_id) || [];
      const exportReviewRecords = exportReviewMap.get(payload.candidate_id) || [];
      const reviewSummary = buildReviewSummary(reviewRecords);
      const exportReadiness = deriveExportReadiness(payload, reviewSummary);
      const exportReviewSummary = buildExportReviewSummary(exportReviewRecords);
      const exportGateDecision = deriveExportGateDecision(payload, exportReadiness, exportReviewSummary);
      return {
        candidate_id: payload.candidate_id,
        source_run_id: payload.source_run_id,
        created_at: payload.created_at,
        candidate_type: payload.candidate_type,
        status: payload.status,
        current_status: reviewSummary.current_status,
        promoted: payload.promoted,
        review_count: reviewSummary.review_count,
        reviewable: reviewSummary.reviewable,
        terminal: reviewSummary.terminal,
        derivation_version: reviewSummary.derivation_version,
        export_readiness_status: exportReadiness.export_readiness_status,
        export_blocker_count: exportReadiness.export_blockers.length,
        current_export_review_status: exportReviewSummary.current_export_review_status,
        export_review_count: exportReviewSummary.export_review_count,
        export_gate_status: exportGateDecision.export_gate_status,
        export_gate_blocker_count: exportGateDecision.export_gate_blockers.length,
        has_boundary: exportReadiness.has_boundary,
        file_path: filePath
      };
    });
}

function readMemoryCandidate(candidateId, options = {}) {
  const payload = readStoredMemoryCandidate(candidateId, options);
  if (!payload) {
    return null;
  }
  const reviewMap = getReviewRecordsByCandidate(options);
  const exportReviewMap = getExportReviewRecordsByCandidate(options);
  const reviewRecords = reviewMap.get(candidateId) || [];
  const exportReviewRecords = exportReviewMap.get(candidateId) || [];
  return enrichMemoryCandidate(payload, reviewRecords, exportReviewRecords);
}

function listReviewableCandidates(options = {}) {
  return listMemoryCandidates(options).filter(item => isReviewableCandidateStatus(item.current_status));
}

function listMemoryReviews(options = {}) {
  const reviewMap = getReviewRecordsByCandidate(options);
  return listMemoryReviewPayloads(options).map(item => {
    const reviewSummary = buildReviewSummary(reviewMap.get(item.payload.candidate_id) || []);
    return {
      review_id: item.payload.review_id,
      candidate_id: item.payload.candidate_id,
      source_run_id: item.payload.source_run_id,
      reviewed_at: item.payload.reviewed_at,
      review_status: item.payload.review_status,
      review_source: item.payload.review_source,
      reviewer_mode: item.payload.reviewer_mode,
      current_candidate_status: reviewSummary.current_status,
      candidate_reviewable: reviewSummary.reviewable,
      candidate_terminal: reviewSummary.terminal,
      superseded: item.payload.review_id !== reviewSummary.latest_review_id,
      file_path: item.filePath
    };
  });
}

function readMemoryReview(reviewId, options = {}) {
  const memoryReviewOutputDir = options.memoryReviewOutputDir || process.env.ARENA_MEMORY_REVIEW_DIR || DEFAULT_MEMORY_REVIEWS_DIR;
  const filePath = path.join(memoryReviewOutputDir, `${reviewId}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return readJsonFile(filePath);
}

function listExportReviews(options = {}) {
  const exportReviewMap = getExportReviewRecordsByCandidate(options);
  return listExportReviewPayloads(options).map(item => {
    const exportReviewSummary = buildExportReviewSummary(exportReviewMap.get(item.payload.candidate_id) || []);
    return {
      export_review_id: item.payload.export_review_id,
      candidate_id: item.payload.candidate_id,
      source_run_id: item.payload.source_run_id,
      reviewed_at: item.payload.reviewed_at,
      export_review_status: item.payload.export_review_status,
      review_source: item.payload.review_source,
      reviewer_mode: item.payload.reviewer_mode,
      current_candidate_export_review_status: exportReviewSummary.current_export_review_status,
      superseded: item.payload.export_review_id !== exportReviewSummary.latest_export_review_id,
      file_path: item.filePath
    };
  });
}

function readExportReview(exportReviewId, options = {}) {
  const exportReviewOutputDir = options.exportReviewOutputDir || process.env.ARENA_EXPORT_REVIEW_DIR || DEFAULT_EXPORT_REVIEWS_DIR;
  const filePath = path.join(exportReviewOutputDir, `${exportReviewId}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return readJsonFile(filePath);
}

function createExportReviewForCandidate(candidateId, exportReviewInput = {}, options = {}) {
  const candidate = readMemoryCandidate(candidateId, options);
  if (!candidate) {
    const error = new Error(`Memory candidate not found: ${candidateId}`);
    error.code = 'memory_candidate_not_found';
    throw error;
  }

  const normalizedInput = normalizeExportReviewInput(exportReviewInput);
  if (!normalizedInput.export_review_rationale) {
    const error = new Error('Export review rationale is required.');
    error.code = 'missing_export_review_rationale';
    throw error;
  }

  const exportReviewRecord = createExportReviewRecord(candidate, normalizedInput, candidate.export_readiness);
  const saved = saveExportReview(exportReviewRecord, options);
  const reviewMap = getReviewRecordsByCandidate(options);
  const exportReviewMap = getExportReviewRecordsByCandidate(options);
  const reviewRecords = reviewMap.get(candidateId) || [];
  const existingExportReviewRecords = exportReviewMap.get(candidateId) || [];
  return {
    ...saved,
    candidate: enrichMemoryCandidate(candidate, reviewRecords, existingExportReviewRecords)
  };
}

function reviewMemoryCandidate(candidateId, reviewInput = {}, options = {}) {
  const candidate = readStoredMemoryCandidate(candidateId, options);
  if (!candidate) {
    const error = new Error(`Memory candidate not found: ${candidateId}`);
    error.code = 'memory_candidate_not_found';
    throw error;
  }

  const normalizedReviewInput = normalizeReviewInput(reviewInput);
  if (!isValidReviewDecisionStatus(normalizedReviewInput.review_status)) {
    const error = new Error(`Invalid review status: ${normalizedReviewInput.review_status || '(empty)'}`);
    error.code = 'invalid_review_status';
    throw error;
  }
  if (!normalizedReviewInput.review_rationale) {
    const error = new Error('Review rationale is required.');
    error.code = 'missing_review_rationale';
    throw error;
  }

  const reviewMap = getReviewRecordsByCandidate(options);
  const existingReviewRecords = reviewMap.get(candidateId) || [];
  const currentStatus = getCurrentCandidateStatus(existingReviewRecords);
  if (!isReviewableCandidateStatus(currentStatus)) {
    const error = new Error(`Memory candidate is no longer reviewable: ${candidateId} (${currentStatus})`);
    error.code = 'memory_candidate_not_reviewable';
    error.current_status = currentStatus;
    throw error;
  }

  const reviewRecord = createReviewRecord(candidate, normalizedReviewInput, currentStatus);
  const saved = saveMemoryReview(reviewRecord, options);
  const exportReviewMap = getExportReviewRecordsByCandidate(options);
  const exportReviewRecords = exportReviewMap.get(candidateId) || [];
  return {
    ...saved,
    candidate: enrichMemoryCandidate(candidate, [...existingReviewRecords, reviewRecord], exportReviewRecords)
  };
}

function listMecReviewPayloads(options = {}) {
  const mecReviewOutputDir = options.mecReviewOutputDir || process.env.MEC_REVIEW_DIR || DEFAULT_MEC_REVIEWS_DIR;
  if (!fs.existsSync(mecReviewOutputDir)) {
    return [];
  }

  return fs.readdirSync(mecReviewOutputDir)
    .filter(file => file.endsWith('.json'))
    .sort()
    .map(file => {
      const filePath = path.join(mecReviewOutputDir, file);
      const payload = readJsonFile(filePath);
      return {
        payload,
        filePath
      };
    });
}

function listMecReviews(options = {}) {
  const reviewMap = getMecReviewRecordsByCandidate(options);
  const workspaceMap = new Map(listMecReviewWorkspace(options).map(item => [item.candidate_id, item]));
  return listMecReviewPayloads(options).map(item => {
    const workspaceItem = workspaceMap.get(item.payload.candidate_id);
    const reviewSummary = workspaceItem ? workspaceItem.review_summary : buildMecReviewSummary(reviewMap.get(item.payload.candidate_id) || []);
    return {
      review_id: item.payload.review_id,
      candidate_id: item.payload.candidate_id,
      candidate_type: item.payload.candidate_type,
      reviewed_at: item.payload.reviewed_at,
      review_outcome: item.payload.review_outcome,
      review_source: item.payload.review_source,
      reviewer_mode: item.payload.reviewer_mode,
      current_candidate_review_state: reviewSummary.current_state,
      latest_review_outcome: workspaceItem ? workspaceItem.latest_review_outcome : null,
      candidate_reviewable: reviewSummary.reviewable,
      candidate_terminal: reviewSummary.terminal,
      candidate_freshness_state: workspaceItem ? workspaceItem.freshness_state : null,
      unresolved_runtime_reference_count: workspaceItem ? workspaceItem.unresolved_runtime_reference_count : 0,
      superseded: item.payload.review_id !== reviewSummary.latest_review_id,
      file_path: item.filePath
    };
  });
}

function readMecReview(reviewId, options = {}) {
  const mecReviewOutputDir = options.mecReviewOutputDir || process.env.MEC_REVIEW_DIR || DEFAULT_MEC_REVIEWS_DIR;
  const filePath = path.join(mecReviewOutputDir, `${reviewId}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return readJsonFile(filePath);
}

function createMecChallengeCounterexample(candidateId, challengeInput = {}, options = {}) {
  const candidateOutputDir = options.candidateOutputDir || process.env.MEC_CANDIDATE_DIR || DEFAULT_CANDIDATES_DIR;
  const eventOutputDir = options.eventOutputDir || process.env.MEC_EVENT_DIR || DEFAULT_EVENTS_DIR;
  const mecReviewOutputDir = options.mecReviewOutputDir || process.env.MEC_REVIEW_DIR || DEFAULT_MEC_REVIEWS_DIR;
  const workspaceItem = readMecReviewWorkspace(candidateId, { candidateOutputDir, eventOutputDir, mecReviewOutputDir });
  if (!workspaceItem) {
    const error = new Error(`MEC candidate not found for manual challenge: ${candidateId}`);
    error.code = 'mec_candidate_not_found';
    throw error;
  }
  const challengeContext = workspaceItem.challenge_context || null;
  if (!challengeContext || !challengeContext.manual_counterexample_allowed) {
    const error = new Error(`MEC candidate is outside the locked Phase 4A manual challenge slice: ${candidateId}`);
    error.code = 'mec_candidate_not_challengeable';
    error.candidate_id = candidateId;
    error.blockers = challengeContext && Array.isArray(challengeContext.manual_counterexample_blockers)
      ? challengeContext.manual_counterexample_blockers
      : [];
    throw error;
  }

  const normalizedChallengeInput = normalizeMecChallengeInput(challengeInput);
  if (!normalizedChallengeInput.case_description) {
    const error = new Error('Manual challenge case_description is required.');
    error.code = 'missing_manual_challenge_case_description';
    throw error;
  }

  const rawCandidate = workspaceItem.raw_candidate_artifact || getCandidate(candidateId, { candidateOutputDir });
  const resolvedSourceEventIds = workspaceItem.evidence_context && Array.isArray(workspaceItem.evidence_context.source_event_context)
    ? workspaceItem.evidence_context.source_event_context.filter(item => item.resolved).map(item => item.event_id)
    : [];
  const counterexampleInput = {
    candidate_type: 'counterexample_candidate',
    principle: normalizedChallengeInput.principle || `Counterexample against ${buildMecWorkspaceTitle(rawCandidate)}`,
    mechanism: normalizedChallengeInput.mechanism || (challengeContext.challenge_summary || 'Manual challenge proposal from the canonical MEC review workspace.'),
    refutes_candidate_id: candidateId,
    case_description: normalizedChallengeInput.case_description,
    resolution: normalizedChallengeInput.resolution,
    impact_on_candidate: normalizedChallengeInput.impact_on_candidate || `challenge_bucket:${challengeContext.contradiction_pressure_bucket || 'low_visible_pressure'}`,
    source_event_ids: normalizedChallengeInput.source_event_ids.length > 0 ? normalizedChallengeInput.source_event_ids : resolvedSourceEventIds.slice(0, 4),
    source_card_ids: normalizedChallengeInput.source_card_ids.length > 0
      ? normalizedChallengeInput.source_card_ids
      : Array.isArray(rawCandidate && rawCandidate.source_card_ids)
        ? rawCandidate.source_card_ids.slice(0, 4)
        : [],
    status: 'proposal_only',
    distillation_mode: 'manual',
    challenge_origin: {
      source_surface: normalizedChallengeInput.challenge_source,
      manual_challenge: true,
      selected_primary_candidate_id: candidateId,
      selected_primary_candidate_type: workspaceItem.candidate_type || null,
      selected_workspace_kind: workspaceItem.workspace_kind || 'mec_review_workspace'
    },
    challenge_basis: {
      contradiction_pressure_bucket: challengeContext.contradiction_pressure_bucket || null,
      challenge_flags: Array.isArray(challengeContext.challenge_flags) ? challengeContext.challenge_flags.slice(0, 6) : [],
      challenge_summary: challengeContext.challenge_summary || null,
      challenge_signals: Array.isArray(challengeContext.challenge_signals) ? challengeContext.challenge_signals.slice(0, 6) : [],
      stabilizing_signals: Array.isArray(challengeContext.stabilizing_signals) ? challengeContext.stabilizing_signals.slice(0, 4) : [],
      existing_counterexample_ids: Array.isArray(challengeContext.existing_counterexamples)
        ? challengeContext.existing_counterexamples.map(item => item.candidate_id).slice(0, 4)
        : [],
      boundary_candidate_id: challengeContext.boundary_candidate_id || null,
      boundary_integrity: challengeContext.boundary_integrity || null,
      latest_review_outcome: challengeContext.latest_review_outcome || null,
      latest_review_trace_present: Boolean(challengeContext.latest_review_trace_present),
      why_now: workspaceItem.delta_context ? workspaceItem.delta_context.why_now || null : null,
      why_not_now: workspaceItem.delta_context ? workspaceItem.delta_context.why_not_now || null : null
    }
  };

  const result = createMecCandidate(counterexampleInput, { candidateOutputDir, eventOutputDir });
  return {
    ...result,
    primary_candidate_id: candidateId,
    challenge_context: challengeContext
  };
}

function reviewMecCandidate(candidateId, reviewInput = {}, options = {}) {
  const candidateOutputDir = options.candidateOutputDir || process.env.MEC_CANDIDATE_DIR || DEFAULT_CANDIDATES_DIR;
  const candidate = getCandidate(candidateId, { candidateOutputDir });
  if (!candidate) {
    const error = new Error(`MEC candidate not found: ${candidateId}`);
    error.code = 'mec_candidate_not_found';
    throw error;
  }

  const normalizedReviewInput = normalizeMecReviewInput(reviewInput);
  if (!isValidMecReviewOutcome(normalizedReviewInput.review_outcome)) {
    const error = new Error(`Invalid MEC review outcome: ${normalizedReviewInput.review_outcome || '(empty)'}`);
    error.code = 'invalid_mec_review_outcome';
    throw error;
  }
  if (!normalizedReviewInput.review_rationale) {
    const error = new Error('MEC review rationale is required.');
    error.code = 'missing_mec_review_rationale';
    throw error;
  }

  const reviewMap = getMecReviewRecordsByCandidate(options);
  const existingReviewRecords = reviewMap.get(candidateId) || [];
  const currentState = getCurrentMecReviewState(existingReviewRecords);
  if (!isReviewableMecReviewState(currentState)) {
    const error = new Error(`MEC candidate is no longer reviewable: ${candidateId} (${currentState})`);
    error.code = 'mec_candidate_not_reviewable';
    error.current_status = currentState;
    throw error;
  }

  const workspaceBeforeWrite = readMecReviewWorkspace(candidateId, options);
  if (!normalizedReviewInput.rationale_snapshot) {
    normalizedReviewInput.rationale_snapshot = buildMecReviewRationaleSnapshot(workspaceBeforeWrite);
  }

  const reviewRecord = createMecReviewRecord(candidate, normalizedReviewInput, currentState);
  const saved = saveMecReview(reviewRecord, options);
  return {
    ...saved,
    candidate: readMecCandidate(candidateId, options)
  };
}

module.exports = {
  DEFAULT_AUDIT_DIR,
  DEFAULT_CANDIDATES_DIR,
  DEFAULT_EVENTS_DIR,
  DEFAULT_EXPORT_REVIEWS_DIR,
  DEFAULT_MEC_REVIEWS_DIR,
  DEFAULT_MEMORY_CANDIDATES_DIR,
  DEFAULT_MEMORY_REVIEWS_DIR,
  DEFAULT_RUNS_DIR,
  createMecChallengeCounterexample,
  createExportReviewForCandidate,
  createMecCandidateRecord,
  createMecEvent,
  createArenaRunPacket,
  executeArenaRun,
  listExportReviews,
  listMecCandidates,
  listMecEvents,
  listMecReviewWorkspace,
  listMecReviews,
  listArenaRuns,
  listMemoryCandidates,
  listMemoryReviews,
  listReviewableCandidates,
  readExportReview,
  readMecCandidate,
  readMecEvent,
  readMecReviewWorkspace,
  readMecReview,
  readArenaRun,
  readAuditRecord,
  readMemoryCandidate,
  readMemoryReview,
  reviewMecCandidate,
  reviewMemoryCandidate
};
