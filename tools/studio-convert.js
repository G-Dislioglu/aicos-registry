#!/usr/bin/env node
const path = require('path');
const { ROOT_DIR, convertArtifact, readJson, writeJson } = require('./studio-schema-lib');

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
    if (!next || next.startsWith('--')) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      i += 1;
    }
  }
  return parsed;
}

function printUsage() {
  console.log('Usage:');
  console.log('  node tools/studio-convert.js <source.json> --to <artifact-kind> [--output PATH]');
  console.log('');
  console.log('This command only performs bounded local Studio conversions.');
  console.log('It does not trigger forwarding, runtime work, or truth mutation.');
}

function printError(error) {
  const payload = {
    ok: false,
    error: {
      code: error.code || 'conversion_failed',
      message: String(error.message || error),
      details: error.details || null
    }
  };
  console.error(JSON.stringify(payload, null, 2));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args._.length === 0 || !args.to) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }

  const inputPath = path.resolve(process.cwd(), args._[0]);

  try {
    const artifact = readJson(inputPath);
    const converted = convertArtifact(artifact, args.to);

    if (args.output) {
      const outputPath = path.resolve(process.cwd(), args.output);
      writeJson(outputPath, converted);
      console.log(`Converted Studio artifact to ${outputPath}`);
      return;
    }

    console.log(JSON.stringify({
      ok: true,
      converted,
      target_kind: args.to,
      scope: 'local_prep_only',
      no_forwarding: true,
      no_runtime_write: true,
      no_truth_mutation: true,
      repo_root: ROOT_DIR
    }, null, 2));
  } catch (error) {
    printError(error);
    process.exit(1);
  }
}

main();
