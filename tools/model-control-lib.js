#!/usr/bin/env node
const MODEL_PROFILES = {
  default: {
    id: 'default',
    description: 'Balanced local review profile for minimal proposal-only arena runs.',
    selection_strategy: 'fixed_local_profile',
    adaptive_routing: false,
    budget_posture: 'balanced',
    role_bindings: {
      shared_evidence: 'registry_grounded_placeholder',
      scout: 'balanced_placeholder',
      observer: 'default_observer'
    }
  },
  low_cost: {
    id: 'low_cost',
    description: 'Lower-cost local profile that prefers narrow proposal-only review.',
    selection_strategy: 'fixed_low_cost_profile',
    adaptive_routing: false,
    budget_posture: 'low_cost',
    role_bindings: {
      shared_evidence: 'minimal_placeholder',
      scout: 'narrow_placeholder',
      observer: 'cost_guard_observer'
    }
  },
  review_strict: {
    id: 'review_strict',
    description: 'Stricter local review profile for conservative proposal-only decisions.',
    selection_strategy: 'fixed_review_strict_profile',
    adaptive_routing: false,
    budget_posture: 'review_strict',
    role_bindings: {
      shared_evidence: 'registry_grounded_placeholder',
      scout: 'friction_first_placeholder',
      observer: 'strict_boundary_observer'
    }
  }
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function listProfiles() {
  return Object.values(MODEL_PROFILES).map(profile => clone(profile));
}

function getProfile(requestedProfile = 'default') {
  return clone(MODEL_PROFILES[requestedProfile] || MODEL_PROFILES.default);
}

module.exports = {
  getProfile,
  listProfiles
};
