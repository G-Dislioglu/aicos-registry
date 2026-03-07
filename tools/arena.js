#!/usr/bin/env node
const {
  DEFAULT_AUDIT_DIR,
  DEFAULT_RUNS_DIR,
  executeArenaRun,
  listArenaRuns,
  readArenaRun,
  readAuditRecord
} = require('./arena-lib');
const {
  listProfiles
} = require('./model-control-lib');

function parseArgs(argv) {
  const parsed = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      parsed._.push(token);
      continue;
    }

    const key = token.slice(2);
    const next = argv[i + 1];
    const value = !next || next.startsWith('--') ? true : next;
    if (value !== true) {
      i += 1;
    }

    if (parsed[key] === undefined) {
      parsed[key] = value;
    } else if (Array.isArray(parsed[key])) {
      parsed[key].push(value);
    } else {
      parsed[key] = [parsed[key], value];
    }
  }
  return parsed;
}

function printUsage() {
  console.log('Usage:');
  console.log('  node tools/arena.js run --question TEXT [--target-id ID] [--type TYPE] [--domain DOMAIN] [--tag TAG] [--status STATUS] [--q QUERY] [--profile PROFILE] [--evidence-topic TOPIC] [--requested-source SOURCE] [--output-dir DIR] [--audit-dir DIR] [--json]');
  console.log('  node tools/arena.js list-runs [--output-dir DIR] [--json]');
  console.log('  node tools/arena.js get-run <run_id> [--output-dir DIR] [--json]');
  console.log('  node tools/arena.js get-audit <run_id> [--audit-dir DIR] [--json]');
  console.log('  node tools/arena.js list-profiles [--json]');
}

function output(data, asJson) {
  if (asJson) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  console.log(data);
}

function buildRunInput(args) {
  return {
    question: args.question,
    target_ids: args['target-id'],
    type: args.type,
    domain: args.domain,
    tag: args.tag,
    status: args.status,
    q: args.q,
    profile: args.profile,
    evidence_topic: args['evidence-topic'],
    requested_sources: args['requested-source']
  };
}

function formatRun(result) {
  return [
    `run_id: ${result.packet.run_id}`,
    `mode: ${result.packet.mode}`,
    `profile: ${result.packet.model_control.selected_profile}`,
    `decision: ${result.packet.observer_decision.decision}`,
    `file_path: ${result.filePath || '-'}`,
    `audit_file_path: ${result.auditFilePath || '-'}`
  ].join('\n');
}

function formatRunList(items) {
  if (items.length === 0) {
    return 'No arena runs found.';
  }
  return items.map(item => `${item.run_id} | ${item.created_at} | ${item.profile || '-'} | ${item.decision}`).join('\n');
}

function formatProfiles(items) {
  if (items.length === 0) {
    return 'No profiles found.';
  }
  return items.map(item => `${item.id} | ${item.budget_posture} | ${item.selection_strategy}`).join('\n');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];
  const outputDir = args['output-dir'] || DEFAULT_RUNS_DIR;
  const auditDir = args['audit-dir'] || DEFAULT_AUDIT_DIR;

  if (!command) {
    printUsage();
    process.exit(1);
  }

  if (command === 'run') {
    const result = executeArenaRun(buildRunInput(args), { outputDir, auditOutputDir: auditDir });
    output(args.json ? result : formatRun(result), args.json);
    return;
  }

  if (command === 'list-runs') {
    const items = listArenaRuns({ outputDir });
    output(args.json ? items : formatRunList(items), args.json);
    return;
  }

  if (command === 'get-run') {
    const runId = args._[1];
    if (!runId) {
      printUsage();
      process.exit(1);
    }
    const payload = readArenaRun(runId, { outputDir });
    if (!payload) {
      console.error(`Run not found: ${runId}`);
      process.exit(1);
    }
    output(payload, true);
    return;
  }

  if (command === 'get-audit') {
    const runId = args._[1];
    if (!runId) {
      printUsage();
      process.exit(1);
    }
    const payload = readAuditRecord(runId, { auditOutputDir: auditDir });
    if (!payload) {
      console.error(`Audit record not found: ${runId}`);
      process.exit(1);
    }
    output(payload, true);
    return;
  }

  if (command === 'list-profiles') {
    const items = listProfiles();
    output(args.json ? items : formatProfiles(items), args.json);
    return;
  }

  printUsage();
  process.exit(1);
}

main();
