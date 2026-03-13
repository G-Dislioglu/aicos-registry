#!/usr/bin/env node
const path = require('path');
const {
  buildScaffoldArtifact,
  getArtifactKinds,
  resolveArtifactKind,
  writeJson
} = require('./studio-schema-lib');

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
  console.log('  node tools/studio-scaffold.js <artifact-kind> [--output PATH]');
  console.log('');
  console.log('Artifact kinds:');
  for (const kind of getArtifactKinds()) {
    console.log(`  - ${kind}`);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const requestedKind = args._[0];
  const kind = resolveArtifactKind(requestedKind);

  if (!kind) {
    printUsage();
    process.exit(1);
  }

  const artifact = buildScaffoldArtifact(kind);

  if (args.output) {
    const outputPath = path.resolve(process.cwd(), args.output);
    writeJson(outputPath, artifact);
    console.log(`Scaffolded ${kind} to ${outputPath}`);
    return;
  }

  console.log(JSON.stringify(artifact, null, 2));
}

main();
