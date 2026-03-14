#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');

function parseArgs(argv) {
  const parsed = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      parsed._.push(token);
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function printUsage() {
  console.log('Usage:');
  console.log('  node tools/frame-delta-eval.js examples/studio/frame-delta/scenarios/<scenario>.scenario.json');
  console.log('  node tools/frame-delta-eval.js examples/studio/frame-delta/scenarios/<scenario>.scenario.json --markdown');
  console.log('  node tools/frame-delta-eval.js examples/studio/frame-delta/scenarios/<scenario>.scenario.json --output <path>');
  console.log('');
  console.log('This command is shadow-only and comparison-only.');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function resolveRepoRef(ref) {
  return path.join(ROOT_DIR, ref);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function loadScenarioArtifacts(scenario) {
  const preflight = readJson(resolveRepoRef(scenario.preflight_ref));
  const challengeResult = readJson(resolveRepoRef(scenario.challenge_result_ref));
  const ledgerEntries = Array.isArray(scenario.ledger_refs)
    ? scenario.ledger_refs.map((ref) => readJson(resolveRepoRef(ref)))
    : [];
  const noMaterialErrorMarker = typeof scenario.no_material_error_marker_ref === 'string'
    ? readJson(resolveRepoRef(scenario.no_material_error_marker_ref))
    : null;
  const passes = scenario.pass_refs.map((ref) => readJson(resolveRepoRef(ref)));

  assert(preflight.artifact_type === 'frame_preflight', `Scenario preflight must be frame_preflight: ${scenario.scenario_id}`);
  assert(challengeResult.artifact_type === 'frame_challenge_result', `Scenario challenge result must be frame_challenge_result: ${scenario.scenario_id}`);
  assert(challengeResult.input_preflight_ref === scenario.preflight_ref, `Challenge result must reference the scenario preflight: ${scenario.scenario_id}`);
  for (const entry of ledgerEntries) {
    assert(entry.artifact_type === 'error_ledger_entry', `Scenario ledger entry must be error_ledger_entry: ${scenario.scenario_id}`);
  }
  for (const pass of passes) {
    assert(pass.artifact_type === 'perspective_pass', `Scenario pass must be perspective_pass: ${scenario.scenario_id}`);
  }
  assert(ledgerEntries.length > 0 || noMaterialErrorMarker, `Scenario must provide either ledger_refs or no_material_error_marker_ref: ${scenario.scenario_id}`);
  if (noMaterialErrorMarker) {
    assert(noMaterialErrorMarker.marker_type === 'no_material_error_ledger_entry', `Scenario marker must be no_material_error_ledger_entry: ${scenario.scenario_id}`);
  }

  return {
    preflight,
    challengeResult,
    ledgerEntries,
    noMaterialErrorMarker,
    passes
  };
}

function deriveDeltaSummary(scenario, artifacts) {
  const ledgerCount = artifacts.ledgerEntries.length;
  if (artifacts.noMaterialErrorMarker) {
    return `Delta preflight marked ${artifacts.preflight.frame_risk_band} framing risk, challenge outcome ${artifacts.challengeResult.challenge_outcome}, and no material error ledger entry was required.`;
  }
  const ledgerLabel = ledgerCount === 1 ? 'ledger entry' : 'ledger entries';
  return `Delta preflight marked ${artifacts.preflight.frame_risk_band} framing risk, challenge outcome ${artifacts.challengeResult.challenge_outcome}, and ${ledgerCount} ${ledgerLabel} ${scenario.delta_summary_tail}`;
}

function buildEvaluationFromScenario(scenarioPath) {
  const absoluteScenarioPath = path.resolve(process.cwd(), scenarioPath);
  const scenario = readJson(absoluteScenarioPath);
  for (const key of ['scenario_id', 'title', 'subject_ref', 'baseline_summary', 'preflight_ref', 'challenge_result_ref', 'pass_refs', 'comparison_axes', 'overall_result', 'integration_signal']) {
    assert(Object.prototype.hasOwnProperty.call(scenario, key), `Scenario missing required key ${key}: ${scenarioPath}`);
  }
  assert(
    (Array.isArray(scenario.ledger_refs) && scenario.ledger_refs.length > 0)
      || typeof scenario.no_material_error_marker_ref === 'string',
    `Scenario must contain ledger_refs or no_material_error_marker_ref: ${scenario.scenario_id}`
  );
  if (!scenario.no_material_error_marker_ref) {
    assert(typeof scenario.delta_summary_tail === 'string' && scenario.delta_summary_tail.length > 0, `Scenario with ledger entries must contain delta_summary_tail: ${scenario.scenario_id}`);
  }
  assert(Array.isArray(scenario.pass_refs) && scenario.pass_refs.length > 0, `Scenario must contain pass_refs: ${scenario.scenario_id}`);
  assert(Array.isArray(scenario.comparison_axes) && scenario.comparison_axes.length > 0, `Scenario must contain comparison_axes: ${scenario.scenario_id}`);

  const artifacts = loadScenarioArtifacts(scenario);

  return {
    artifact_type: 'frame_delta_evaluation',
    scenario_id: scenario.scenario_id,
    subject_ref: scenario.subject_ref,
    baseline_summary: scenario.baseline_summary,
    delta_summary: deriveDeltaSummary(scenario, artifacts),
    comparison_axes: scenario.comparison_axes,
    overall_result: scenario.overall_result,
    integration_signal: scenario.integration_signal,
    delta_refs: {
      preflight_ref: scenario.preflight_ref,
      challenge_result_ref: scenario.challenge_result_ref
    },
    shadow_only: true,
    non_authoritative: true
  };
}

function renderMarkdown(evaluation, scenarioTitle) {
  const lines = [];
  lines.push('# Frame Delta Evaluation Summary');
  lines.push('');
  lines.push(`- Scenario: ${scenarioTitle}`);
  lines.push(`- Scenario ID: \`${evaluation.scenario_id}\``);
  lines.push(`- Subject Ref: \`${evaluation.subject_ref}\``);
  lines.push(`- Overall Result: \`${evaluation.overall_result}\``);
  lines.push(`- Integration Signal: \`${evaluation.integration_signal}\``);
  lines.push('');
  lines.push('## Baseline Summary');
  lines.push('');
  lines.push(evaluation.baseline_summary);
  lines.push('');
  lines.push('## Delta Summary');
  lines.push('');
  lines.push(evaluation.delta_summary);
  lines.push('');
  lines.push('## Comparison Axes');
  lines.push('');
  for (const axis of evaluation.comparison_axes) {
    lines.push(`- \`${axis.axis}\` => \`${axis.winner}\` — ${axis.reason}`);
  }
  lines.push('');
  lines.push('## Boundary');
  lines.push('');
  lines.push('- This output is shadow-only and non-authoritative.');
  lines.push('- Does not replace the Studio baseline.');
  lines.push('- Does not authorize runtime or truth mutation.');
  lines.push('');
  return lines.join('\n');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args._.length === 0) {
    printUsage();
    return;
  }

  const scenarioPath = args._[0];
  const scenario = readJson(path.resolve(process.cwd(), scenarioPath));
  const evaluation = buildEvaluationFromScenario(scenarioPath);
  const output = args.markdown
    ? renderMarkdown(evaluation, scenario.title)
    : JSON.stringify(evaluation, null, 2);

  if (args.output) {
    fs.writeFileSync(path.resolve(process.cwd(), args.output), output);
    console.log(`Wrote frame delta output to ${path.resolve(process.cwd(), args.output)}`);
    return;
  }

  process.stdout.write(output);
}

main();
