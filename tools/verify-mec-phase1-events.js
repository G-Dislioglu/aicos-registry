#!/usr/bin/env node
const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  DEFAULT_EVENTS_DIR,
  createEvent,
  getEvent,
  listEvents
} = require('./mec-event-lib');

const ROOT_DIR = path.join(__dirname, '..');
const REQUIRED_FILES = [
  path.join(ROOT_DIR, 'MEC_ARCHITECTURE_LOCKED.md'),
  path.join(ROOT_DIR, 'MEC_MVP_PHASE_PLAN.md'),
  path.join(ROOT_DIR, 'MEC_PHASE1_EVENT_FOUNDATION.md'),
  path.join(ROOT_DIR, 'tools', 'mec-event-lib.js'),
  path.join(ROOT_DIR, 'tools', 'verify-mec-phase1-events.js'),
  path.join(ROOT_DIR, 'tools', 'arena.js'),
  path.join(ROOT_DIR, 'tools', 'arena-server.js')
];
const REGISTRY_DIRS = [
  path.join(ROOT_DIR, 'cards'),
  path.join(ROOT_DIR, 'index'),
  path.join(ROOT_DIR, 'human'),
  path.join(ROOT_DIR, 'taxonomies')
];
const PHASE1_JS_FILES = [
  path.join(ROOT_DIR, 'tools', 'mec-event-lib.js')
];
const DISALLOWED_PATTERNS = [
  ['export', 'gate'].join('_'),
  ['judgment', 'candidate'].join('_'),
  ['tradeoff', 'candidate'].join('_'),
  ['policy', 'candidate'].join('_'),
  ['variant', 'candidate'].join('_')
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
    assert(fs.existsSync(filePath), `Missing required MEC Phase 1 file: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function verifyNoScopeDrift() {
  for (const filePath of PHASE1_JS_FILES) {
    const content = fs.readFileSync(filePath, 'utf-8');
    for (const pattern of DISALLOWED_PATTERNS) {
      assert(!content.includes(pattern), `Disallowed Phase 1 pattern ${pattern} found in ${path.relative(ROOT_DIR, filePath)}`);
    }
  }
}

async function verifyEventRuntime() {
  const registryBefore = snapshotRegistry();
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-mec-phase1-events-'));

  const created = createEvent({
    event_type: 'runtime_observation',
    domain: 'mec_phase1',
    summary: 'Minimal event foundation runtime probe.',
    source_ref: 'verifier://phase1/runtime',
    trace_ref: 'trace://phase1/runtime',
    confidence: 'medium',
    privacy_class: 'internal',
    ttl_days: 7,
    priority_score: 0.6,
    salience_signals: ['phase1', 'runtime-only']
  }, { eventOutputDir: tempEventDir });

  assert(created.eventFilePath.startsWith(tempEventDir), 'Expected event file to be written under the temp event runtime directory');
  assert(created.event.event_boundary.registry_mutation === false, 'Expected event boundary to preserve registry mutation false');
  assert(created.event.event_boundary.candidate_created === false, 'Expected Phase 1 event creation to avoid candidate generation');
  assert(created.event.event_boundary.canon_exported === false, 'Expected Phase 1 event creation to avoid canon export');
  assert(created.event.ttl_days === 7, 'Expected ttl_days to be preserved');
  assert(Array.isArray(created.event.salience_signals) && created.event.salience_signals.length === 2, 'Expected salience signals to be stored');

  const listed = listEvents({ eventOutputDir: tempEventDir });
  assert(listed.length === 1, 'Expected listEvents to return the created event');
  assert(listed[0].id === created.event.id, 'Expected listEvents to preserve the event id');
  assert(listed[0].priority_score === 0.6, 'Expected listEvents to preserve priority score');

  const loaded = getEvent(created.event.id, { eventOutputDir: tempEventDir });
  assert(loaded && loaded.id === created.event.id, 'Expected getEvent to return the created event');
  assert(loaded.trace_ref === 'trace://phase1/runtime', 'Expected getEvent to preserve trace_ref');
  assert(loaded.expires_at, 'Expected event to include expires_at');

  const registryAfter = snapshotRegistry();
  assert(JSON.stringify(registryBefore) === JSON.stringify(registryAfter), 'Registry files changed during MEC Phase 1 runtime verification');
}

async function verifyCliSurface() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-mec-phase1-cli-'));

  const createdPayload = JSON.parse(runNode([
    'tools/arena.js',
    'create-event',
    '--event-type', 'cli_probe',
    '--domain', 'mec_phase1_cli',
    '--summary', 'CLI event probe',
    '--source-ref', 'verifier://phase1/cli',
    '--trace-ref', 'trace://phase1/cli',
    '--confidence', 'high',
    '--privacy-class', 'internal',
    '--ttl-days', '5',
    '--priority-score', '0.8',
    '--salience', 'cli',
    '--salience', 'phase1',
    '--event-dir', tempEventDir,
    '--json'
  ]));
  assert(createdPayload.event.id, 'Expected CLI create-event to return an event id');

  const listPayload = JSON.parse(runNode([
    'tools/arena.js',
    'list-events',
    '--event-dir', tempEventDir,
    '--json'
  ]));
  assert(Array.isArray(listPayload) && listPayload.length === 1, 'Expected CLI list-events to return one event');

  const getPayload = JSON.parse(runNode([
    'tools/arena.js',
    'get-event', createdPayload.event.id,
    '--event-dir', tempEventDir,
    '--json'
  ]));
  assert(getPayload.summary === 'CLI event probe', 'Expected CLI get-event to preserve summary');
  assert(getPayload.event_boundary.candidate_created === false, 'Expected CLI get-event to preserve no-candidate boundary');
}

async function verifyHttpSurface() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-mec-phase1-http-events-'));
  const port = 3243;
  const serverProcess = spawn(process.execPath, ['tools/arena-server.js'], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      PORT: String(port),
      MEC_EVENT_DIR: tempEventDir
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
    const createResponse = await fetch(`http://127.0.0.1:${port}/arena/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'http_probe',
        domain: 'mec_phase1_http',
        summary: 'HTTP event probe',
        source_ref: 'verifier://phase1/http',
        trace_ref: 'trace://phase1/http',
        confidence: 'medium',
        privacy_class: 'internal',
        ttl_days: 9,
        priority_score: 0.4,
        salience_signals: ['http', 'phase1']
      })
    });
    assert(createResponse.status === 201, 'Expected POST /arena/events to return 201');
    const createdPayload = await createResponse.json();
    assert(createdPayload.event.id, 'Expected HTTP create-event response to include event id');

    const listResponse = await fetch(`http://127.0.0.1:${port}/arena/events`);
    assert(listResponse.ok, 'Expected GET /arena/events to return 200');
    const listPayload = await listResponse.json();
    assert(Array.isArray(listPayload.items) && listPayload.items.length === 1, 'Expected HTTP list-events to return one stored event');

    const eventId = listPayload.items[0].id;
    const getResponse = await fetch(`http://127.0.0.1:${port}/arena/events/${eventId}`);
    assert(getResponse.ok, 'Expected GET /arena/events/:id to return 200');
    const getPayload = await getResponse.json();
    assert(getPayload.trace_ref === 'trace://phase1/http', 'Expected HTTP get-event to preserve trace_ref');
    assert(getPayload.event_boundary.canon_exported === false, 'Expected HTTP get-event to preserve no-canon boundary');
  } finally {
    serverProcess.kill();
  }
}

function runNode(args) {
  const result = spawnSyncCompat(process.execPath, args, { cwd: ROOT_DIR });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `Command failed: ${args.join(' ')}`);
  }
  return result.stdout;
}

function spawnSyncCompat(command, args, options) {
  const { spawnSync } = require('child_process');
  return spawnSync(command, args, {
    ...options,
    encoding: 'utf-8'
  });
}

async function main() {
  verifyFilesExist();
  verifyNoScopeDrift();
  await verifyEventRuntime();
  await verifyCliSurface();
  await verifyHttpSurface();
  console.log('MEC Phase 1 event verification passed.');
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
