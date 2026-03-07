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

const ROOT_DIR = path.join(__dirname, '..');
const DEFAULT_RUNS_DIR = path.join(ROOT_DIR, 'runtime', 'arena-runs');
const DEFAULT_AUDIT_DIR = path.join(ROOT_DIR, 'runtime', 'audit-records');
const DEFAULT_MEMORY_CANDIDATES_DIR = path.join(ROOT_DIR, 'runtime', 'memory-candidates');

function toArray(value) {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
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

  return fs.readdirSync(memoryOutputDir)
    .filter(file => file.endsWith('.json'))
    .sort()
    .map(file => {
      const filePath = path.join(memoryOutputDir, file);
      const payload = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return {
        candidate_id: payload.candidate_id,
        source_run_id: payload.source_run_id,
        created_at: payload.created_at,
        candidate_type: payload.candidate_type,
        status: payload.status,
        promoted: payload.promoted,
        file_path: filePath
      };
    });
}

function readMemoryCandidate(candidateId, options = {}) {
  const memoryOutputDir = options.memoryOutputDir || process.env.ARENA_MEMORY_DIR || DEFAULT_MEMORY_CANDIDATES_DIR;
  const filePath = path.join(memoryOutputDir, `${candidateId}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

module.exports = {
  DEFAULT_AUDIT_DIR,
  DEFAULT_MEMORY_CANDIDATES_DIR,
  DEFAULT_RUNS_DIR,
  createArenaRunPacket,
  executeArenaRun,
  listArenaRuns,
  listMemoryCandidates,
  readArenaRun,
  readAuditRecord,
  readMemoryCandidate
};
