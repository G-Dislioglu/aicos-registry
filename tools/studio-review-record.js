#!/usr/bin/env node
const path = require('path');
const { buildScaffoldArtifact, writeJson } = require('./studio-schema-lib');

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      i += 1;
    }
  }
  return parsed;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const artifact = buildScaffoldArtifact('review-record');

  if (args.output) {
    const outputPath = path.resolve(process.cwd(), args.output);
    writeJson(outputPath, artifact);
    console.log(`Scaffolded review-record to ${outputPath}`);
    return;
  }

  console.log(JSON.stringify(artifact, null, 2));
}

main();
