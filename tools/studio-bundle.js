#!/usr/bin/env node
const path = require('path');
const {
  ROOT_DIR,
  buildBundleManifestFromArtifacts,
  buildScaffoldArtifact,
  writeJson
} = require('./studio-schema-lib');

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
  console.log('  node tools/studio-bundle.js [artifact.json ...] [--output PATH]');
  console.log('  node tools/studio-bundle.js --scaffold [--output PATH]');
  console.log('');
  console.log('This command only scaffolds or summarizes local Studio bundle manifests.');
  console.log('It does not trigger forwarding, runtime work, or truth mutation.');
}

function resolveArtifactPaths(inputs) {
  return inputs.map((inputPath) => path.resolve(process.cwd(), inputPath));
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    return;
  }

  if (args.scaffold || args._.length === 0) {
    const artifact = buildScaffoldArtifact('studio-bundle-manifest');
    if (args.output) {
      const outputPath = path.resolve(process.cwd(), args.output);
      writeJson(outputPath, artifact);
      console.log(`Scaffolded studio-bundle-manifest to ${outputPath}`);
      return;
    }

    console.log(JSON.stringify(artifact, null, 2));
    return;
  }

  const artifactPaths = resolveArtifactPaths(args._);
  const { manifest, consistencyIssues } = buildBundleManifestFromArtifacts(artifactPaths, {
    bundleId: args['bundle-id'],
    bundleType: args['bundle-type'],
    sourcePacketRef: args['source-packet-ref'],
    intendedNextStep: args['intended-next-step'],
    topic: args.topic,
    bundleSummary: args['bundle-summary'],
    notes: args.notes
  });

  if (args.output) {
    const outputPath = path.resolve(process.cwd(), args.output);
    writeJson(outputPath, manifest);
    console.log(`Wrote studio bundle manifest to ${outputPath}`);
    if (consistencyIssues.length > 0) {
      console.log(`Consistency issues: ${consistencyIssues.length}`);
      for (const issue of consistencyIssues) {
        console.log(`- ${issue.code} at ${issue.path}: ${issue.message}`);
      }
    }
    return;
  }

  console.log(JSON.stringify({
    manifest,
    consistency_issues: consistencyIssues,
    scope: 'local_packaging_layer_only',
    no_forwarding: true,
    no_runtime_write: true,
    no_truth_mutation: true,
    repo_root: ROOT_DIR
  }, null, 2));
}

main();
