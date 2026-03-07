#!/usr/bin/env node
const {
  getCardById,
  getStats,
  listCards,
  resolveId
} = require('./registry-readonly-lib');

function parseArgs(argv) {
  const parsed = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        parsed[key] = true;
      } else {
        parsed[key] = next;
        i += 1;
      }
    } else {
      parsed._.push(token);
    }
  }
  return parsed;
}

function printUsage() {
  console.log('Usage:');
  console.log('  node tools/registry-readonly.js stats [--json]');
  console.log('  node tools/registry-readonly.js list [--type TYPE] [--domain DOMAIN] [--tag TAG] [--status STATUS] [--q QUERY] [--limit N] [--json]');
  console.log('  node tools/registry-readonly.js get <id> [--json]');
  console.log('  node tools/registry-readonly.js resolve <id> [--json]');
}

function output(data, asJson) {
  if (asJson) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  console.log(data);
}

function formatList(cards) {
  if (cards.length === 0) {
    return 'No cards matched.';
  }
  return cards.map(card => `${card.id} | ${card.type} | ${card.status} | ${card.title}`).join('\n');
}

function formatResolve(result) {
  return [
    `requestedId: ${result.requestedId}`,
    `resolvedId: ${result.resolvedId}`,
    `resolvedViaAlias: ${result.resolvedViaAlias}`,
    `existsInIndex: ${result.existsInIndex}`,
    `type: ${result.type || '-'}`
  ].join('\n');
}

function formatGet(result) {
  if (!result.existsInIndex) {
    return `Card not found in index: ${result.requestedId}`;
  }
  if (!result.card) {
    return `Card resolved but file missing: ${result.resolvedId}`;
  }
  return JSON.stringify(result.card, null, 2);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];

  if (!command) {
    printUsage();
    process.exit(1);
  }

  if (command === 'stats') {
    const stats = getStats();
    output(args.json ? stats : `totalCards: ${stats.totalCards}\naliasCount: ${stats.aliasCount}\nbyType: ${JSON.stringify(stats.byType)}`, args.json);
    return;
  }

  if (command === 'list') {
    const cards = listCards({
      type: args.type,
      domain: args.domain,
      tag: args.tag,
      status: args.status,
      q: args.q,
      limit: args.limit
    });
    output(args.json ? cards : formatList(cards), args.json);
    return;
  }

  if (command === 'resolve') {
    const requestedId = args._[1];
    if (!requestedId) {
      printUsage();
      process.exit(1);
    }
    const result = resolveId(requestedId);
    output(args.json ? result : formatResolve(result), args.json);
    return;
  }

  if (command === 'get') {
    const requestedId = args._[1];
    if (!requestedId) {
      printUsage();
      process.exit(1);
    }
    const result = getCardById(requestedId);
    output(args.json ? result : formatGet(result), args.json);
    return;
  }

  printUsage();
  process.exit(1);
}

main();
