#!/usr/bin/env node
const path = require('path');
const {
  ROOT_DIR,
  buildScaffoldArtifact,
  findStudioDossierConsistencyIssues,
  readJson,
  writeJson
} = require('./studio-schema-lib');

const PROPOSAL_MEMBER_TYPES = new Set([
  'proposal_artifact',
  'handoff_artifact',
  'reference_artifact',
  'card_review_target_artifact'
]);

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
  console.log('  node tools/studio-dossier.js [artifact.json ...] [--bundle-manifest PATH] [--output PATH]');
  console.log('  node tools/studio-dossier.js --scaffold [--output PATH]');
  console.log('');
  console.log('This command only builds local human-readable Studio dossiers.');
  console.log('It does not trigger forwarding, runtime work, or truth mutation.');
}

function resolvePaths(inputs) {
  return inputs.map((inputPath) => path.resolve(process.cwd(), inputPath));
}

function normalizeRelativeRef(filePath) {
  return path.relative(ROOT_DIR, filePath).split(path.sep).join('/');
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

function buildStudioDossierFromArtifacts(filePaths, options = {}) {
  const includedArtifacts = [];
  const loadedArtifacts = [];
  const openConflicts = [];

  for (const filePath of filePaths) {
    const artifact = readJson(filePath);
    const ref = normalizeRelativeRef(filePath);
    includedArtifacts.push({
      artifact_type: artifact.artifact_type,
      ref
    });
    loadedArtifacts.push({ artifact, ref });
    if (Array.isArray(artifact.open_conflicts)) {
      openConflicts.push(...artifact.open_conflicts);
    }
  }

  includedArtifacts.sort((left, right) => left.ref.localeCompare(right.ref));
  loadedArtifacts.sort((left, right) => left.ref.localeCompare(right.ref));

  const sourcePacket = loadedArtifacts.find((entry) => entry.artifact.artifact_type === 'studio_intake_packet');
  const reviewArtifacts = loadedArtifacts.filter((entry) => entry.artifact.artifact_type === 'review_record');
  const gateArtifacts = loadedArtifacts.filter((entry) => entry.artifact.artifact_type === 'gate_report');
  const proposalArtifacts = loadedArtifacts.filter((entry) => PROPOSAL_MEMBER_TYPES.has(entry.artifact.artifact_type));

  let bundleTopic;

  const sourcePacketSummary = options['source-packet-summary']
    || (sourcePacket && sourcePacket.artifact.distilled_summary)
    || (sourcePacket && sourcePacket.artifact.summary)
    || 'TODO: source packet summary';

  const recommendedHumanNextStep = options['recommended-human-next-step']
    || (reviewArtifacts[0] && reviewArtifacts[0].artifact.resulting_next_posture)
    || 'retain_in_review_layer';

  let bundleContextSummary = options['bundle-context-summary'];
  let bundleManifestRef;
  if (options['bundle-manifest']) {
    const bundleAbsolutePath = path.resolve(process.cwd(), options['bundle-manifest']);
    const bundleArtifact = readJson(bundleAbsolutePath);
    bundleManifestRef = normalizeRelativeRef(bundleAbsolutePath);
    bundleTopic = bundleArtifact.topic;
    bundleContextSummary = bundleContextSummary
      || bundleArtifact.bundle_summary
      || 'Bundle manifest supplied as local descriptive dossier context only.';
  }

  const topic = options.topic
    || bundleTopic
    || (sourcePacket && sourcePacket.artifact.topic)
    || (proposalArtifacts[0] && proposalArtifacts[0].artifact.topic)
    || 'TODO: dossier topic';

  if (!bundleContextSummary) {
    bundleContextSummary = 'No bundle manifest supplied; dossier remains a local cross-artifact review set only.';
  }

  const dossier = {
    artifact_type: 'studio_dossier',
    dossier_id: options['dossier-id'] || 'TODO: dossier-id',
    title: options.title || topic,
    topic,
    dossier_scope: 'local_human_review_only',
    included_artifacts: includedArtifacts,
    source_packet_ref: options['source-packet-ref']
      || (sourcePacket && sourcePacket.ref)
      || 'examples/studio/scaffolded/studio-intake-packet.scaffolded.json',
    source_packet_summary: sourcePacketSummary,
    included_proposal_refs: proposalArtifacts.map((entry) => entry.ref),
    review_refs: reviewArtifacts.map((entry) => entry.ref),
    gate_report_refs: gateArtifacts.map((entry) => entry.ref),
    bundle_context_summary: bundleContextSummary,
    open_conflicts: uniqueStrings(options['open-conflicts'] ? options['open-conflicts'].split('|') : openConflicts),
    gate_outcomes: gateArtifacts.map((entry) => ({
      gate_report_id: entry.artifact.gate_report_id,
      gate_name: entry.artifact.gate_name,
      gate_outcome: entry.artifact.gate_outcome,
      subject_ref: entry.artifact.subject_ref,
      approval_requirement: entry.artifact.approval_requirement
    })),
    recommended_human_next_step: recommendedHumanNextStep,
    forbidden_automated_next_steps: [
      'runtime_review_object_creation',
      'truth_mutation',
      'card_write',
      'index_write',
      'alias_write',
      'auto_forwarding',
      'provider_execution'
    ],
    proposal_only: true,
    no_truth_mutation: true,
    no_runtime_write: true
  };

  if (bundleManifestRef) {
    dossier.bundle_manifest_ref = bundleManifestRef;
  }

  if (options.notes) {
    dossier.notes = options.notes;
  }

  const consistencyIssues = findStudioDossierConsistencyIssues(dossier);
  return {
    dossier,
    consistencyIssues
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    return;
  }

  if (args.scaffold || args._.length === 0) {
    const artifact = buildScaffoldArtifact('studio-dossier');
    if (args.output) {
      const outputPath = path.resolve(process.cwd(), args.output);
      writeJson(outputPath, artifact);
      console.log(`Scaffolded studio-dossier to ${outputPath}`);
      return;
    }

    console.log(JSON.stringify(artifact, null, 2));
    return;
  }

  const artifactPaths = resolvePaths(args._);
  const { dossier, consistencyIssues } = buildStudioDossierFromArtifacts(artifactPaths, args);

  if (args.output) {
    const outputPath = path.resolve(process.cwd(), args.output);
    writeJson(outputPath, dossier);
    console.log(`Wrote studio dossier to ${outputPath}`);
    if (consistencyIssues.length > 0) {
      console.log(`Consistency issues: ${consistencyIssues.length}`);
      for (const issue of consistencyIssues) {
        console.log(`- ${issue.code} at ${issue.path}: ${issue.message}`);
      }
    }
    return;
  }

  console.log(JSON.stringify({
    dossier,
    consistency_issues: consistencyIssues,
    scope: 'local_human_review_layer_only',
    no_forwarding: true,
    no_runtime_write: true,
    no_truth_mutation: true,
    repo_root: ROOT_DIR
  }, null, 2));
}

main();
