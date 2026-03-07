#!/usr/bin/env node
const {
  DEFAULT_AUDIT_DIR,
  DEFAULT_EVENTS_DIR,
  DEFAULT_MEMORY_CANDIDATES_DIR,
  DEFAULT_MEMORY_REVIEWS_DIR,
  DEFAULT_RUNS_DIR,
  createMecEvent,
  executeArenaRun,
  listArenaRuns,
  listMecEvents,
  listMemoryCandidates,
  listMemoryReviews,
  listReviewableCandidates,
  readMecEvent,
  readArenaRun,
  readAuditRecord,
  readMemoryCandidate,
  readMemoryReview,
  reviewMemoryCandidate
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
  console.log('  node tools/arena.js run --question TEXT [--target-id ID] [--type TYPE] [--domain DOMAIN] [--tag TAG] [--status STATUS] [--q QUERY] [--profile PROFILE] [--memory-proposals] [--memory-candidate-type TYPE] [--memory-tag TAG] [--memory-note NOTE] [--evidence-topic TOPIC] [--requested-source SOURCE] [--output-dir DIR] [--audit-dir DIR] [--memory-dir DIR] [--memory-review-dir DIR] [--json]');
  console.log('  node tools/arena.js create-event --event-type TYPE --domain DOMAIN --summary TEXT --source-ref REF --trace-ref REF [--confidence LEVEL] [--privacy-class CLASS] [--ttl-days DAYS] [--priority-score VALUE] [--salience SIGNAL] [--event-status STATUS] [--event-dir DIR] [--json]');
  console.log('  node tools/arena.js list-events [--event-dir DIR] [--json]');
  console.log('  node tools/arena.js get-event <event_id> [--event-dir DIR] [--json]');
  console.log('  node tools/arena.js list-runs [--output-dir DIR] [--json]');
  console.log('  node tools/arena.js get-run <run_id> [--output-dir DIR] [--json]');
  console.log('  node tools/arena.js get-audit <run_id> [--audit-dir DIR] [--json]');
  console.log('  node tools/arena.js list-memory-candidates [--memory-dir DIR] [--memory-review-dir DIR] [--json]');
  console.log('  node tools/arena.js list-reviewable-candidates [--memory-dir DIR] [--memory-review-dir DIR] [--json]');
  console.log('  node tools/arena.js get-memory-candidate <candidate_id> [--memory-dir DIR] [--memory-review-dir DIR] [--json]');
  console.log('  node tools/arena.js review-memory-candidate <candidate_id> --review-status STATUS --review-rationale TEXT [--review-source SOURCE] [--reviewer-mode MODE] [--confidence LEVEL] [--review-note NOTE] [--memory-dir DIR] [--memory-review-dir DIR] [--json]');
  console.log('  node tools/arena.js list-memory-reviews [--memory-review-dir DIR] [--json]');
  console.log('  node tools/arena.js get-memory-review <review_id> [--memory-review-dir DIR] [--json]');
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
    memory_proposals: args['memory-proposals'],
    memory_candidate_type: args['memory-candidate-type'],
    memory_tags: args['memory-tag'],
    memory_notes: args['memory-note'],
    evidence_topic: args['evidence-topic'],
    requested_sources: args['requested-source']
  };
}

function buildEventInput(args) {
  return {
    event_type: args['event-type'],
    domain: args.domain,
    summary: args.summary,
    source_ref: args['source-ref'],
    trace_ref: args['trace-ref'],
    confidence: args.confidence,
    privacy_class: args['privacy-class'],
    ttl_days: args['ttl-days'],
    priority_score: args['priority-score'],
    salience_signals: args.salience,
    status: args['event-status']
  };
}

function formatRun(result) {
  return [
    `run_id: ${result.packet.run_id}`,
    `mode: ${result.packet.mode}`,
    `profile: ${result.packet.model_control.selected_profile}`,
    `memory_candidates: ${result.packet.memory_candidates.count}`,
    `decision: ${result.packet.observer_decision.decision}`,
    `file_path: ${result.filePath || '-'}`,
    `audit_file_path: ${result.auditFilePath || '-'}`,
    `memory_candidate_files: ${result.memoryCandidateFilePaths && result.memoryCandidateFilePaths.length ? result.memoryCandidateFilePaths.join(', ') : '-'}`
  ].join('\n');
}

function formatRunList(items) {
  if (items.length === 0) {
    return 'No arena runs found.';
  }
  return items.map(item => `${item.run_id} | ${item.created_at} | ${item.profile || '-'} | mem:${item.memory_candidate_count || 0} | ${item.decision}`).join('\n');
}

function formatProfiles(items) {
  if (items.length === 0) {
    return 'No profiles found.';
  }
  return items.map(item => `${item.id} | ${item.budget_posture} | ${item.selection_strategy}`).join('\n');
}

function formatEvents(items) {
  if (items.length === 0) {
    return 'No MEC events found.';
  }
  return items.map(item => `${item.id} | ${item.event_type} | ${item.domain} | priority:${item.priority_score} | ttl:${item.ttl_days} | ${item.status}`).join('\n');
}

function formatMemoryCandidates(items) {
  if (items.length === 0) {
    return 'No memory candidates found.';
  }
  return items.map(item => `${item.candidate_id} | ${item.source_run_id} | ${item.candidate_type} | stored:${item.status} | current:${item.current_status} | reviews:${item.review_count || 0} | promoted:${item.promoted}`).join('\n');
}

function formatMemoryReviews(items) {
  if (items.length === 0) {
    return 'No memory reviews found.';
  }
  return items.map(item => `${item.review_id} | ${item.candidate_id} | ${item.review_status} | ${item.review_source} | ${item.reviewed_at}`).join('\n');
}

function buildReviewInput(args) {
  return {
    review_status: args['review-status'],
    review_rationale: args['review-rationale'],
    review_source: args['review-source'],
    reviewer_mode: args['reviewer-mode'],
    confidence: args.confidence,
    review_notes: args['review-note']
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];
  const outputDir = args['output-dir'] || DEFAULT_RUNS_DIR;
  const auditDir = args['audit-dir'] || DEFAULT_AUDIT_DIR;
  const eventDir = args['event-dir'] || DEFAULT_EVENTS_DIR;
  const memoryDir = args['memory-dir'] || DEFAULT_MEMORY_CANDIDATES_DIR;
  const memoryReviewDir = args['memory-review-dir'] || DEFAULT_MEMORY_REVIEWS_DIR;

  if (!command) {
    printUsage();
    process.exit(1);
  }

  if (command === 'create-event') {
    try {
      const result = createMecEvent(buildEventInput(args), { eventOutputDir: eventDir });
      output(args.json ? result : JSON.stringify(result, null, 2), args.json);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
    return;
  }

  if (command === 'list-events') {
    const items = listMecEvents({ eventOutputDir: eventDir });
    output(args.json ? items : formatEvents(items), args.json);
    return;
  }

  if (command === 'get-event') {
    const eventId = args._[1];
    if (!eventId) {
      printUsage();
      process.exit(1);
    }
    const payload = readMecEvent(eventId, { eventOutputDir: eventDir });
    if (!payload) {
      console.error(`MEC event not found: ${eventId}`);
      process.exit(1);
    }
    output(payload, true);
    return;
  }

  if (command === 'run') {
    const result = executeArenaRun(buildRunInput(args), { outputDir, auditOutputDir: auditDir, memoryOutputDir: memoryDir, memoryReviewOutputDir: memoryReviewDir });
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

  if (command === 'list-memory-candidates') {
    const items = listMemoryCandidates({ memoryOutputDir: memoryDir, memoryReviewOutputDir: memoryReviewDir });
    output(args.json ? items : formatMemoryCandidates(items), args.json);
    return;
  }

  if (command === 'list-reviewable-candidates') {
    const items = listReviewableCandidates({ memoryOutputDir: memoryDir, memoryReviewOutputDir: memoryReviewDir });
    output(args.json ? items : formatMemoryCandidates(items), args.json);
    return;
  }

  if (command === 'get-memory-candidate') {
    const candidateId = args._[1];
    if (!candidateId) {
      printUsage();
      process.exit(1);
    }
    const payload = readMemoryCandidate(candidateId, { memoryOutputDir: memoryDir, memoryReviewOutputDir: memoryReviewDir });
    if (!payload) {
      console.error(`Memory candidate not found: ${candidateId}`);
      process.exit(1);
    }
    output(payload, true);
    return;
  }

  if (command === 'review-memory-candidate') {
    const candidateId = args._[1];
    if (!candidateId) {
      printUsage();
      process.exit(1);
    }
    try {
      const result = reviewMemoryCandidate(candidateId, buildReviewInput(args), { memoryOutputDir: memoryDir, memoryReviewOutputDir: memoryReviewDir });
      output(args.json ? result : JSON.stringify(result, null, 2), args.json);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
    return;
  }

  if (command === 'list-memory-reviews') {
    const items = listMemoryReviews({ memoryReviewOutputDir: memoryReviewDir });
    output(args.json ? items : formatMemoryReviews(items), args.json);
    return;
  }

  if (command === 'get-memory-review') {
    const reviewId = args._[1];
    if (!reviewId) {
      printUsage();
      process.exit(1);
    }
    const payload = readMemoryReview(reviewId, { memoryReviewOutputDir: memoryReviewDir });
    if (!payload) {
      console.error(`Memory review not found: ${reviewId}`);
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
