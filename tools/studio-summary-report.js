#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { readJson } = require('./studio-schema-lib');

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
  console.log('  node tools/studio-summary-report.js dossier.json [--output PATH]');
  console.log('');
  console.log('This command only renders a local Markdown summary report from a valid Studio dossier.');
}

function formatList(values, formatter = (value) => value) {
  if (!Array.isArray(values) || values.length === 0) {
    return ['- none'];
  }
  return values.map((value) => `- ${formatter(value)}`);
}

function renderSummaryReport(dossier) {
  const lines = [];
  lines.push('# Studio Dossier Summary Report');
  lines.push('');
  lines.push('## Dossier Metadata');
  lines.push('');
  lines.push(`- Dossier ID: \`${dossier.dossier_id}\``);
  lines.push(`- Title: ${dossier.title}`);
  lines.push(`- Topic: ${dossier.topic}`);
  lines.push(`- Scope: \`${dossier.dossier_scope}\``);
  lines.push('');
  lines.push('## Source Packet Summary');
  lines.push('');
  lines.push(dossier.source_packet_summary);
  lines.push('');
  lines.push('## Included Proposal Artifacts');
  lines.push('');
  lines.push(...formatList(dossier.included_artifacts.filter((entry) => (dossier.included_proposal_refs || []).includes(entry.ref)), (entry) => `\`${entry.artifact_type}\` — \`${entry.ref}\``));
  lines.push('');
  lines.push('## Included Review Records');
  lines.push('');
  lines.push(...formatList(dossier.review_refs, (value) => `\`${value}\``));
  lines.push('');
  lines.push('## Included Gate Reports');
  lines.push('');
  lines.push(...formatList(dossier.gate_report_refs, (value) => `\`${value}\``));
  lines.push('');
  lines.push('## Bundle Context');
  lines.push('');
  lines.push(`- Bundle Manifest: ${dossier.bundle_manifest_ref ? `\`${dossier.bundle_manifest_ref}\`` : 'none'}`);
  lines.push(`- Summary: ${dossier.bundle_context_summary}`);
  lines.push('');
  lines.push('## Open Conflicts');
  lines.push('');
  lines.push(...formatList(dossier.open_conflicts));
  lines.push('');
  lines.push('## Gate Outcomes');
  lines.push('');
  lines.push(...formatList(dossier.gate_outcomes, (entry) => `\`${entry.gate_report_id}\` — \`${entry.gate_name}\` => \`${entry.gate_outcome}\` on \`${entry.subject_ref}\` (\`${entry.approval_requirement}\`)`));
  lines.push('');
  lines.push('## Recommended Human Next Step');
  lines.push('');
  lines.push(`- \`${dossier.recommended_human_next_step}\``);
  lines.push('- Descriptive only; this report does not authorize forwarding or mutation.');
  lines.push('');
  lines.push('## Forbidden Automated Next Steps');
  lines.push('');
  lines.push(...formatList(dossier.forbidden_automated_next_steps, (value) => `\`${value}\``));
  lines.push('');
  lines.push('## Boundary Flags');
  lines.push('');
  lines.push(`- Proposal Only: \`${dossier.proposal_only}\``);
  lines.push(`- No Truth Mutation: \`${dossier.no_truth_mutation}\``);
  lines.push(`- No Runtime Write: \`${dossier.no_runtime_write}\``);
  if (typeof dossier.notes === 'string' && dossier.notes.length > 0) {
    lines.push('');
    lines.push('## Notes');
    lines.push('');
    lines.push(dossier.notes);
  }
  lines.push('');
  return lines.join('\n');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args._.length === 0) {
    printUsage();
    return;
  }

  const dossierPath = path.resolve(process.cwd(), args._[0]);
  const dossier = readJson(dossierPath);
  const output = renderSummaryReport(dossier);

  if (args.output) {
    const outputPath = path.resolve(process.cwd(), args.output);
    fs.writeFileSync(outputPath, output);
    console.log(`Wrote studio summary report to ${outputPath}`);
    return;
  }

  process.stdout.write(output);
}

main();
