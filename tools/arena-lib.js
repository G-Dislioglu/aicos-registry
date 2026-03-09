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
