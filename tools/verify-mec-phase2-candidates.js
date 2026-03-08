#!/usr/bin/env node
const { spawn, spawnSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  createEvent
} = require('./mec-event-lib');
const {
  createMecCandidate,
  getCandidate,
  listCandidates
} = require('./mec-candidate-lib');
const {
  listCards
} = require('./registry-readonly-lib');

const ROOT_DIR = path.join(__dirname, '..');
const REQUIRED_FILES = [
  path.join(ROOT_DIR, 'MEC_ARCHITECTURE_LOCKED.md'),
  path.join(ROOT_DIR, 'MEC_MVP_PHASE_PLAN.md'),
  path.join(ROOT_DIR, 'MEC_PHASE1_EVENT_FOUNDATION.md'),
  path.join(ROOT_DIR, 'MEC_PHASE2_IMPLEMENTATION_PLAN.md'),
  path.join(ROOT_DIR, 'MEC_PHASE2_CANDIDATE_DISTILLATION.md'),
  path.join(ROOT_DIR, 'tools', 'mec-event-lib.js'),
  path.join(ROOT_DIR, 'tools', 'mec-candidate-lib.js'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-phase1-events.js'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-phase2-candidates.js'),
  path.join(ROOT_DIR, 'tools', 'arena-lib.js'),
  path.join(ROOT_DIR, 'tools', 'arena.js'),
  path.join(ROOT_DIR, 'tools', 'arena-server.js')
];
const REGISTRY_DIRS = [
  path.join(ROOT_DIR, 'cards'),
  path.join(ROOT_DIR, 'index'),
  path.join(ROOT_DIR, 'human'),
  path.join(ROOT_DIR, 'taxonomies')
];
const PHASE2_JS_FILES = [
  path.join(ROOT_DIR, 'tools', 'mec-candidate-lib.js'),
  path.join(ROOT_DIR, 'tools', 'arena-lib.js'),
  path.join(ROOT_DIR, 'tools', 'arena.js'),
  path.join(ROOT_DIR, 'tools', 'arena-server.js')
];
const DISALLOWED_PATTERNS = [
  ['judgment', 'candidate'].join('_'),
  ['tradeoff', 'candidate'].join('_'),
  ['policy', 'candidate'].join('_'),
  ['canon', 'exported:true'].join('-')
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function hashFile(filePath) {
  const digest = crypto.createHash('sha256');
  digest.update(fs.readFileSync(filePath));
  return digest.digest('hex');
}

function snapshotDirectory(dirPath) {
  const snapshot = {};
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      Object.assign(snapshot, snapshotDirectory(fullPath));
    } else {
      snapshot[path.relative(ROOT_DIR, fullPath)] = hashFile(fullPath);
    }
  }
  return snapshot;
}

function snapshotRegistry() {
  return REGISTRY_DIRS.reduce((acc, dirPath) => {
    Object.assign(acc, snapshotDirectory(dirPath));
    return acc;
  }, {});
}

function verifyFilesExist() {
  for (const filePath of REQUIRED_FILES) {
    assert(fs.existsSync(filePath), `Missing required MEC Phase 2 file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyNoScopeDrift() {
  for (const filePath of PHASE2_JS_FILES) {
    const content = fs.readFileSync(filePath, 'utf-8');
    for (const pattern of DISALLOWED_PATTERNS) {
      assert(!content.includes(pattern), `Disallowed Phase 2 pattern ${pattern} found in ${path.relative(ROOT_DIR, filePath)}`);
    }
  }
}

function runVerifier(relativePath) {
  const result = spawnSync(process.execPath, [relativePath], {
    cwd: ROOT_DIR,
    encoding: 'utf-8'
  });
  assert(result.status === 0, `${relativePath} failed: ${(result.stderr || result.stdout || '').trim()}`);
}

function verifyExistingPhases() {
  runVerifier(path.join('tools', 'verify-mec-phase1-events.js'));
  runVerifier(path.join('tools', 'verify-phase4a-memory-proposals.js'));
  runVerifier(path.join('tools', 'verify-phase4b-memory-reviews.js'));
  runVerifier(path.join('tools', 'verify-phase4c-runtime-review-consolidation.js'));
  runVerifier(path.join('tools', 'verify-phase4d-export-readiness.js'));
}

function createProbeEvent(summary, eventDir, suffix) {
  return createEvent({
    event_type: 'distill_probe',
    domain: 'mec_phase2',
    summary,
    source_ref: `verifier://phase2/${suffix}`,
    trace_ref: `trace://phase2/${suffix}`,
    confidence: 'medium',
    privacy_class: 'internal',
    ttl_days: 7,
    priority_score: 0.6,
    salience_signals: ['phase2', suffix]
  }, { eventOutputDir: eventDir }).event;
}

async function verifyCandidateRuntime() {
  const registryBefore = snapshotRegistry();
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-mec-phase2-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-mec-phase2-candidates-'));
  const firstCard = listCards({ limit: 1 })[0];
  assert(firstCard && firstCard.id, 'Expected at least one registry card to exist for optional source_card_ids linking');

  const eventA = createProbeEvent('Repeated lifecycle handling failure pattern.', tempEventDir, 'a');
  const eventB = createProbeEvent('Repeated stale state refresh mismatch.', tempEventDir, 'b');
  const eventC = createProbeEvent('Repeated review versus canon discipline confusion.', tempEventDir, 'c');

  const invariantOne = createMecCandidate({
    candidate_type: 'invariant_candidate',
    principle: 'Lifecycle cleanup must be explicit before reuse.',
    mechanism: 'Unreleased runtime resources accumulate hidden state and distort later observations.',
    source_event_ids: [eventA.id],
    source_card_ids: [firstCard.id],
    applies_when: ['resource reuse', 'iterative debug loop'],
    fails_when: ['resource handles remain open', 'stale state survives reset'],
    edge_cases: ['single-use throwaway runtime'],
    severity: 'high',
    proof_ref: ['verifier://phase2/invariant-1'],
    distillation_mode: 'semi_manual'
  }, { candidateOutputDir: tempCandidateDir, eventOutputDir: tempEventDir });

  const invariantTwo = createMecCandidate({
    candidate_type: 'invariant_candidate',
    principle: 'State refresh claims require a fresh runtime observation boundary.',
    mechanism: 'Cached or stale state can mimic successful fixes while preserving the underlying defect.',
    source_event_ids: [eventB.id],
    applies_when: ['reload required', 'bundle mismatch suspected'],
    fails_when: ['cached artifacts remain active', 'environment state is reused without verification'],
    edge_cases: ['stateless local probe'],
    severity: 'medium',
    distillation_mode: 'manual'
  }, { candidateOutputDir: tempCandidateDir, eventOutputDir: tempEventDir });

  const invariantThree = createMecCandidate({
    candidate_type: 'invariant_candidate',
    principle: 'Runtime acceptance is distinct from canon acceptance.',
    mechanism: 'A runtime read-model can consolidate evidence without mutating the registry source of truth.',
    source_event_ids: [eventC.id],
    applies_when: ['review consolidation', 'export readiness discussion'],
    fails_when: ['review state is treated as canon', 'runtime status triggers registry mutation'],
    edge_cases: ['purely local runtime probes'],
    severity: 'high',
    distillation_mode: 'semi_manual'
  }, { candidateOutputDir: tempCandidateDir, eventOutputDir: tempEventDir });

  const counterexample = createMecCandidate({
    candidate_type: 'counterexample_candidate',
    principle: 'Not every refresh issue comes from stale client state.',
    mechanism: 'Some failures originate in server-side invariants rather than cached runtime state.',
    refutes_candidate_id: invariantTwo.candidate.id,
    case_description: 'A clean reload still reproduces the issue because the bug lives in deterministic server logic.',
    resolution: 'Keep the stale-state candidate local and attach the counterexample.',
    impact_on_candidate: 'narrows_scope',
    source_event_ids: [eventB.id],
    distillation_mode: 'manual'
  }, { candidateOutputDir: tempCandidateDir, eventOutputDir: tempEventDir });

  const curiosity = createMecCandidate({
    candidate_type: 'curiosity_candidate',
    principle: 'Open question about transfer limits for runtime-only review knowledge.',
    mechanism: 'Unknown transfer boundary across domains still needs direct evidence.',
    open_question: 'When does review versus canon discipline stop transferring cleanly across unrelated domains?',
    domain: 'mec_phase2',
    blind_spot_score: 0.7,
    source_event_ids: [eventC.id],
    distillation_mode: 'manual'
  }, { candidateOutputDir: tempCandidateDir, eventOutputDir: tempEventDir });

  assert(invariantOne.linked_boundary_candidate, 'Expected invariant candidate creation to return linked boundary candidate');
  assert(invariantOne.candidate.linked_boundary_candidate_id === invariantOne.linked_boundary_candidate.id, 'Expected invariant candidate to link to boundary candidate');
  assert(invariantOne.candidate.status === 'proposal_only', 'Expected invariant candidates to remain proposal_only');
  assert(invariantOne.linked_boundary_candidate.status === 'proposal_only', 'Expected boundary candidate to remain proposal_only');
  assert(counterexample.candidate.status === 'proposal_only', 'Expected counterexample candidate to remain proposal_only');
  assert(curiosity.candidate.candidate_boundary.auto_resolve === false, 'Expected curiosity candidate to avoid auto-resolve');

  const listed = listCandidates({ candidateOutputDir: tempCandidateDir });
  assert(listed.length === 8, 'Expected 3 invariants + 3 linked boundaries + 1 counterexample + 1 curiosity');
  assert(listed.filter(item => item.candidate_type === 'invariant_candidate').length === 3, 'Expected three invariant candidates in listing');
  assert(listed.filter(item => item.candidate_type === 'boundary_candidate').length === 3, 'Expected three boundary candidates in listing');

  const loadedInvariant = getCandidate(invariantThree.candidate.id, { candidateOutputDir: tempCandidateDir });
  assert(loadedInvariant.linked_boundary_candidate_id, 'Expected getCandidate to preserve linked boundary id');
  assert(Array.isArray(loadedInvariant.source_event_ids) && loadedInvariant.source_event_ids.length === 1, 'Expected getCandidate to preserve source_event_ids');
  assert(loadedInvariant.candidate_boundary.registry_mutation === false, 'Expected runtime-only candidate boundary');

  const registryAfter = snapshotRegistry();
  assert(JSON.stringify(registryBefore) === JSON.stringify(registryAfter), 'Registry files changed during MEC Phase 2 verification');
}

function runNode(args, env = {}) {
  const result = spawnSync(process.execPath, args, {
    cwd: ROOT_DIR,
    encoding: 'utf-8',
    env: {
      ...process.env,
      ...env
    }
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `Command failed: ${args.join(' ')}`);
  }
  return result.stdout;
}

async function verifyCliSurface() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-mec-phase2-cli-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-mec-phase2-cli-candidates-'));
  const event = createProbeEvent('CLI candidate distillation probe.', tempEventDir, 'cli');

  const createdPayload = JSON.parse(runNode([
    'tools/arena.js',
    'create-mec-candidate',
    '--candidate-type', 'invariant_candidate',
    '--principle', 'CLI invariant probe',
    '--mechanism', 'CLI creates a manual runtime-only candidate',
    '--source-event-id', event.id,
    '--applies-when', 'cli-run',
    '--boundary-fails-when', 'event linkage missing',
    '--boundary-fails-when', 'boundary not explicit',
    '--boundary-edge-case', 'single-event weak signal',
    '--severity', 'medium',
    '--candidate-dir', tempCandidateDir,
    '--event-dir', tempEventDir,
    '--json'
  ]));
  assert(createdPayload.candidate.id, 'Expected CLI create-mec-candidate to return a candidate id');
  assert(createdPayload.linked_boundary_candidate.id, 'Expected CLI create-mec-candidate to create a linked boundary candidate');

  const listPayload = JSON.parse(runNode([
    'tools/arena.js',
    'list-mec-candidates',
    '--candidate-dir', tempCandidateDir,
    '--json'
  ]));
  assert(Array.isArray(listPayload) && listPayload.length === 2, 'Expected CLI list-mec-candidates to return invariant and boundary candidate');

  const getPayload = JSON.parse(runNode([
    'tools/arena.js',
    'get-mec-candidate', createdPayload.candidate.id,
    '--candidate-dir', tempCandidateDir,
    '--json'
  ]));
  assert(getPayload.linked_boundary_candidate_id === createdPayload.linked_boundary_candidate.id, 'Expected CLI get-mec-candidate to preserve linked boundary candidate');
}

async function verifyHttpSurface() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-mec-phase2-http-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-mec-phase2-http-candidates-'));
  const event = createProbeEvent('HTTP candidate distillation probe.', tempEventDir, 'http');
  const port = 3245;
  const serverProcess = spawn(process.execPath, ['tools/arena-server.js'], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      PORT: String(port),
      MEC_EVENT_DIR: tempEventDir,
      MEC_CANDIDATE_DIR: tempCandidateDir
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timed out waiting for arena-server to start'));
    }, 5000);

    serverProcess.stdout.on('data', data => {
      const text = String(data);
      if (text.includes('arena-server listening')) {
        clearTimeout(timeout);
        resolve();
      }
    });

    serverProcess.stderr.on('data', data => {
      clearTimeout(timeout);
      reject(new Error(String(data)));
    });

    serverProcess.on('exit', code => {
      clearTimeout(timeout);
      reject(new Error(`arena-server exited early with code ${code}`));
    });
  });

  try {
    const createResponse = await fetch(`http://127.0.0.1:${port}/arena/mec-candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidate_type: 'invariant_candidate',
        principle: 'HTTP invariant probe',
        mechanism: 'HTTP creates a runtime-only MEC candidate pair',
        source_event_ids: [event.id],
        applies_when: ['http-run'],
        fails_when: ['source linkage missing', 'boundary absent'],
        edge_cases: ['single observation'],
        severity: 'medium'
      })
    });
    assert(createResponse.status === 201, 'Expected POST /arena/mec-candidates to return 201');
    const createdPayload = await createResponse.json();
    assert(createdPayload.candidate.id, 'Expected HTTP candidate creation to return candidate id');
    assert(createdPayload.linked_boundary_candidate.id, 'Expected HTTP candidate creation to return linked boundary candidate');

    const listResponse = await fetch(`http://127.0.0.1:${port}/arena/mec-candidates`);
    assert(listResponse.ok, 'Expected GET /arena/mec-candidates to return 200');
    const listPayload = await listResponse.json();
    assert(Array.isArray(listPayload.items) && listPayload.items.length === 2, 'Expected HTTP list to return invariant and boundary candidate');

    const getResponse = await fetch(`http://127.0.0.1:${port}/arena/mec-candidates/${createdPayload.candidate.id}`);
    assert(getResponse.ok, 'Expected GET /arena/mec-candidates/:id to return 200');
    const getPayload = await getResponse.json();
    assert(getPayload.linked_boundary_candidate_id === createdPayload.linked_boundary_candidate.id, 'Expected HTTP get to preserve linked boundary candidate id');
    assert(getPayload.candidate_boundary.registry_mutation === false, 'Expected HTTP get to preserve runtime-only boundary');
  } finally {
    serverProcess.kill();
  }
}

async function main() {
  verifyFilesExist();
  verifyNoScopeDrift();
  verifyExistingPhases();
  await verifyCandidateRuntime();
  await verifyCliSurface();
  await verifyHttpSurface();
  console.log('MEC Phase 2 candidate verification passed.');
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
