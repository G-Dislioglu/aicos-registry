#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const NOTE_PATH = path.join(ROOT_DIR, 'docs', 'frame-delta-smt-candidate-note.md');
const SUMMARY_PATH = path.join(ROOT_DIR, 'examples', 'studio', 'frame-delta', 'smt-candidate', 'pattern-summary.json');
const BOUNDARIES_PATH = path.join(ROOT_DIR, 'examples', 'studio', 'frame-delta', 'smt-candidate', 'adoption-boundaries.json');
const PUBLIC_COMMITS = ['59391de', 'fd9cecf', '0c50c84', '8cf6ba5'];
const REQUIRED_PATTERNS = [
  'separated_counterframing',
  'non_mediating_merge',
  'agreement_zone_and_tension_points',
  'hidden_assumption_and_failure_condition',
  'false_split_and_shallow_split',
  'multi_output_realism'
];
const REQUIRED_BOUNDARY_KEYS = ['adopt_now_as_note', 'defer_for_later_pilot', 'do_not_claim', 'out_of_scope_now'];
const REQUIRED_OUTPUT_TYPES = ['new_question', 'boundary_clarification', 'evidence_gap', 'trigger_refinement', 'no_material_gain'];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function verifyFilesExist() {
  assert(fs.existsSync(NOTE_PATH), 'Missing SMT candidate note markdown');
  assert(fs.existsSync(SUMMARY_PATH), 'Missing SMT pattern summary JSON');
  assert(fs.existsSync(BOUNDARIES_PATH), 'Missing SMT adoption boundaries JSON');
}

function verifyNote() {
  const content = fs.readFileSync(NOTE_PATH, 'utf-8');
  for (const expected of [
    '## Kurze Problemstellung',
    '## Was am Pattern wertvoll ist',
    '## Was daran riskant, überzogen oder zu früh ist',
    '## Welche Teile AICOS übernehmen könnte',
    '## Welche Teile ausdrücklich NICHT übernommen werden',
    '## Realistischere mögliche Output-Typen',
    '## Pilot Position Recommendation',
    '## Harte Anti-Drift-Regeln'
  ]) {
    assert(content.includes(expected), `Expected SMT candidate section missing: ${expected}`);
  }
  for (const commit of PUBLIC_COMMITS) {
    assert(content.includes(`\`${commit}\``), `Missing public commit reference in SMT note: ${commit}`);
  }
  for (const expected of ['`agreement_zone`', '`tension_points`', '`hidden_assumption`', '`failure_condition`', '`false_split`', '`shallow_split`']) {
    assert(content.includes(expected), `Expected SMT concept missing in note: ${expected}`);
  }
  assert(content.includes('kein neuer kanonischer Hauptoperator `O8`'), 'SMT note must explicitly reject immediate O8 adoption');
  assert(content.includes('keine Provider-Bindung'), 'SMT note must explicitly reject provider binding');
  assert(content.includes('`no_material_gain`'), 'SMT note must explicitly allow no_material_gain');
  assert(!content.toLowerCase().includes('muss immer eine `transcendent_question`'), 'SMT note must not require transcendent_question');
}

function verifyPatternSummary() {
  const summary = readJson(SUMMARY_PATH);
  assert(summary.candidate_note_version === 'v1', 'Pattern summary must declare version v1');
  assert(summary.status === 'proposal_only', 'Pattern summary must remain proposal_only');
  assert(Array.isArray(summary.entries) && summary.entries.length === REQUIRED_PATTERNS.length, 'Pattern summary must contain the expected compact entry set');
  const ids = summary.entries.map((entry) => entry.id);
  assert.deepStrictEqual(ids, REQUIRED_PATTERNS, 'Pattern summary ids must match the expected compact SMT set');
  for (const entry of summary.entries) {
    for (const field of ['id', 'candidate_pattern', 'valuable_core', 'known_risks', 'adoption_status', 'not_adopted_yet', 'notes']) {
      assert(typeof entry[field] === 'string' && entry[field].length > 0, `Pattern summary entry missing field ${field}`);
    }
  }
}

function verifyAdoptionBoundaries() {
  const boundaries = readJson(BOUNDARIES_PATH);
  assert(boundaries.candidate_note_version === 'v1', 'Adoption boundaries must declare version v1');
  assert(boundaries.status === 'proposal_only', 'Adoption boundaries must remain proposal_only');
  for (const key of REQUIRED_BOUNDARY_KEYS) {
    assert(Array.isArray(boundaries[key]) && boundaries[key].length > 0, `Adoption boundaries must define ${key}`);
  }
  assert(boundaries.adopt_now_as_note.includes('separated_counterframing'), 'Adoption boundaries must include separated_counterframing');
  assert(boundaries.adopt_now_as_note.includes('non_mediating_merge'), 'Adoption boundaries must include non_mediating_merge');
  assert(boundaries.adopt_now_as_note.includes('failure_condition'), 'Adoption boundaries must include failure_condition');
  assert(boundaries.adopt_now_as_note.includes('false_split'), 'Adoption boundaries must include false_split');
  assert(boundaries.adopt_now_as_note.includes('shallow_split'), 'Adoption boundaries must include shallow_split');
  assert(boundaries.do_not_claim.includes('no_immediate_o8_operator'), 'Adoption boundaries must reject immediate O8');
  assert(boundaries.do_not_claim.includes('no_immediate_four_position_embedding'), 'Adoption boundaries must reject four-position embedding');
  assert(boundaries.do_not_claim.includes('no_provider_or_model_role_assignment'), 'Adoption boundaries must reject provider binding');
  assert(boundaries.do_not_claim.includes('no_transcendent_question_requirement'), 'Adoption boundaries must reject transcendent_question requirement');
  assert(boundaries.pilot_position_recommendation.recommended_primary === 'P1 Frame Challenge', 'Primary pilot recommendation must stay P1 Frame Challenge');
  assert(boundaries.pilot_position_recommendation.recommended_alternative === 'P3 Improvement Gate', 'Alternative pilot recommendation must stay P3 Improvement Gate');
  assert(boundaries.pilot_position_recommendation.pilot_now === false, 'Pilot must remain off for now');
  assert(boundaries.pilot_position_recommendation.build_now === false, 'Build must remain off for now');
  assert(boundaries.pilot_position_recommendation.operator_now === false, 'Operator must remain off for now');
  assert(Array.isArray(boundaries.realistic_output_types), 'Adoption boundaries must declare realistic_output_types');
  assert.deepStrictEqual(boundaries.realistic_output_types, REQUIRED_OUTPUT_TYPES, 'Realistic output types must match the required bounded set');
}

function verifyPackage() {
  const packageJson = readJson(path.join(ROOT_DIR, 'package.json'));
  assert(packageJson.scripts && packageJson.scripts['verify:frame-delta-smt-candidate'], 'Missing SMT candidate verifier script');
  assert(typeof packageJson.scripts['verify:studio'] === 'string' && !packageJson.scripts['verify:studio'].includes('smt-candidate'), 'verify:studio must remain unchanged by SMT candidate note');
}

function main() {
  verifyFilesExist();
  verifyNote();
  verifyPatternSummary();
  verifyAdoptionBoundaries();
  verifyPackage();
  console.log('AICOS frame delta SMT candidate note verification passed.');
}

main();
