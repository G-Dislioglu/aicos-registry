#!/usr/bin/env node
function toArray(value) {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

function toBoolean(value) {
  if (value === true || value === false) {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }
  return false;
}

function createCandidateId() {
  return `memcand-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeMemoryProposalInput(input = {}) {
  return {
    enabled: toBoolean(input.memory_proposals || input.memoryProposals),
    candidate_type: String(input.memory_candidate_type || input.memoryCandidateType || '').trim(),
    tags: toArray(input.memory_tags || input.memoryTags),
    notes: toArray(input.memory_notes || input.memoryNotes)
  };
}

function createCandidate(packet, config) {
  return {
    schema_version: 'phase4a-memory-candidate/v1',
    candidate_id: createCandidateId(),
    source_run_id: packet.run_id,
    created_at: packet.created_at,
    status: 'proposal_only',
    promoted: false,
    candidate_type: config.candidate_type,
    rationale: config.rationale,
    confidence: config.confidence,
    priority: config.priority,
    tags: config.tags,
    notes: config.notes,
    audit_meta: {
      source_surface: 'arena-lib',
      proposal_origin: 'phase4a_memory_proposal',
      source_mode: packet.mode,
      selected_profile: packet.model_control.selected_profile,
      validation_status: packet.validation.status,
      non_promoted_state: 'explicit_false',
      registry_mutation: false
    }
  };
}

function buildMemoryCandidates(packet) {
  const proposalInput = packet.input.memory_proposal_input;
  if (!proposalInput.enabled) {
    return {
      enabled: false,
      count: 0,
      items: []
    };
  }

  const items = [];
  const notes = proposalInput.notes;
  const requestedType = proposalInput.candidate_type;
  const baseTags = proposalInput.tags;
  const candidateCards = packet.registry_context.candidate_cards;

  if (candidateCards.length > 0) {
    const selectedIds = candidateCards.slice(0, 3).map(card => card.id);
    items.push(createCandidate(packet, {
      candidate_type: requestedType || 'registry_grounded_observation',
      rationale: `Run ${packet.run_id} identified registry-grounded cards for later manual memory review: ${selectedIds.join(', ')}.`,
      confidence: candidateCards.length >= 2 ? 'medium' : 'low',
      priority: packet.observer_decision.decision === 'proposal_only_escalate' ? 'medium' : 'low',
      tags: baseTags,
      notes
    }));
  }

  if (packet.shared_evidence_pack.items.length === 0) {
    items.push(createCandidate(packet, {
      candidate_type: requestedType || 'evidence_gap_followup',
      rationale: `Run ${packet.run_id} completed with placeholder-only shared evidence and should remain a follow-up proposal for manual review.`,
      confidence: 'low',
      priority: 'medium',
      tags: Array.from(new Set([...baseTags, 'evidence-gap'])),
      notes
    }));
  }

  return {
    enabled: true,
    count: items.length,
    items
  };
}

module.exports = {
  buildMemoryCandidates,
  normalizeMemoryProposalInput
};
