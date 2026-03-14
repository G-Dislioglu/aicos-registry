#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const CHARTER_PATH = path.join(ROOT_DIR, 'docs', 'frame-delta-decision-charter-v1.md');
const MATRIX_PATH = path.join(ROOT_DIR, 'examples', 'studio', 'frame-delta', 'decision-charter', 'decision-matrix.json');
const EVIDENCE_MAP_PATH = path.join(ROOT_DIR, 'examples', 'studio', 'frame-delta', 'decision-charter', 'evidence-map.json');
const PUBLIC_COMMITS = ['59391de', 'fd9cecf', '0c50c84'];
const REQUIRED_ZONES = ['invoke_likely', 'invoke_unlikely', 'invoke_ambiguous'];
const REQUIRED_NEGATIVE_CLAIMS = [
  'Integrationsreife',
  'Default-Layer',
  'automatische Trigger',
  'Ersatz der Baseline',
  'Runtime-, Registry- oder Studio-Mutation'
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function verifyFilesExist() {
  assert(fs.existsSync(CHARTER_PATH), 'Missing decision charter markdown');
  assert(fs.existsSync(MATRIX_PATH), 'Missing decision matrix JSON');
  assert(fs.existsSync(EVIDENCE_MAP_PATH), 'Missing evidence map JSON');
}

function verifyCharter() {
  const content = fs.readFileSync(CHARTER_PATH, 'utf-8');
  for (const expected of [
    '## Zweck des Delta-Tracks',
    '## Was Delta leisten soll',
    '## Was Delta ausdrücklich nicht leisten soll',
    '### `invoke_likely`',
    '### `invoke_unlikely`',
    '### `invoke_ambiguous`',
    '## Harte Anti-Drift-Regeln',
    '## Negative Claims / Non-Proofs'
  ]) {
    assert(content.includes(expected), `Expected charter section missing: ${expected}`);
  }
  for (const commit of PUBLIC_COMMITS) {
    assert(content.includes(`\`${commit}\``), `Missing public commit reference in charter: ${commit}`);
  }
  for (const negativeClaim of REQUIRED_NEGATIVE_CLAIMS) {
    assert(content.includes(negativeClaim), `Missing negative claim in charter: ${negativeClaim}`);
  }
  assert(!content.toLowerCase().includes('default policy'), 'Charter must not claim a default policy');
  assert(!content.toLowerCase().includes('auto-escalation'), 'Charter must not claim auto-escalation');
}

function verifyMatrix() {
  const matrix = readJson(MATRIX_PATH);
  assert(matrix.charter_version === 'v1', 'Decision matrix must declare charter_version v1');
  assert(matrix.status === 'proposal_only', 'Decision matrix must remain proposal_only');
  assert(Array.isArray(matrix.entries) && matrix.entries.length >= 6, 'Decision matrix must contain a small explicit entry set');
  const zones = new Set();
  for (const entry of matrix.entries) {
    for (const field of ['id', 'signal_family', 'typical_surface_pattern', 'delta_value_hypothesis', 'misfire_risk', 'recommended_zone', 'notes']) {
      assert(typeof entry[field] === 'string' && entry[field].length > 0, `Decision matrix entry missing field ${field}`);
    }
    zones.add(entry.recommended_zone);
    assert(REQUIRED_ZONES.includes(entry.recommended_zone), `Unexpected matrix zone: ${entry.recommended_zone}`);
  }
  for (const zone of REQUIRED_ZONES) {
    assert(zones.has(zone), `Decision matrix must cover zone ${zone}`);
  }
}

function verifyEvidenceMap() {
  const evidenceMap = readJson(EVIDENCE_MAP_PATH);
  assert(evidenceMap.charter_version === 'v1', 'Evidence map must declare charter_version v1');
  assert(Array.isArray(evidenceMap.public_reference_points) && evidenceMap.public_reference_points.length === 3, 'Evidence map must list the 3 public reference points');
  assert(evidenceMap.zone_support && typeof evidenceMap.zone_support === 'object', 'Evidence map must define zone_support');
  for (const zone of REQUIRED_ZONES) {
    assert(Array.isArray(evidenceMap.zone_support[zone]) && evidenceMap.zone_support[zone].length > 0, `Evidence map must support zone ${zone}`);
    for (const claimEntry of evidenceMap.zone_support[zone]) {
      assert(typeof claimEntry.claim === 'string' && claimEntry.claim.length > 0, `Evidence claim missing text in zone ${zone}`);
      assert(Array.isArray(claimEntry.supported_by) && claimEntry.supported_by.length > 0, `Evidence claim missing supported_by in zone ${zone}`);
      assert(typeof claimEntry.strength === 'string' && claimEntry.strength.length > 0, `Evidence claim missing strength in zone ${zone}`);
      assert(typeof claimEntry.open_edges === 'string' && claimEntry.open_edges.length > 0, `Evidence claim missing open_edges in zone ${zone}`);
    }
  }
  assert(Array.isArray(evidenceMap.negative_claims) && evidenceMap.negative_claims.length >= 5, 'Evidence map must include explicit negative claims');
}

function verifyPackage() {
  const packageJson = readJson(path.join(ROOT_DIR, 'package.json'));
  assert(packageJson.scripts && packageJson.scripts['verify:frame-delta-charter'], 'Missing decision charter verifier script');
  assert(typeof packageJson.scripts['verify:studio'] === 'string' && !packageJson.scripts['verify:studio'].includes('charter'), 'verify:studio must remain unchanged by decision charter');
}

function main() {
  verifyFilesExist();
  verifyCharter();
  verifyMatrix();
  verifyEvidenceMap();
  verifyPackage();
  console.log('AICOS frame delta decision charter v1 verification passed.');
}

main();
