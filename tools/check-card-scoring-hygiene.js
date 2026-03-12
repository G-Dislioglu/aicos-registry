#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { normalizeImpact } = require('./score-lib');

const ROOT_DIR = path.join(__dirname, '..');
const CARDS_DIR = path.join(ROOT_DIR, 'cards');
const CARD_CATEGORIES = ['errors', 'solutions', 'meta'];
const KNOWN_FLAGS = {
  all_three_90_plus: 'value, risk, and confidence are all 90+; this should stay exceptional',
  value_95_plus: 'value is 95+; reserve this for unusually central cards',
  confidence_95_plus: 'confidence is 95+; reserve this for unusually well-supported cards',
  proposed_high_confidence: 'proposed card has confidence 90+; proposals should stay restrained unless unusually well evidenced',
  meta_extreme_confidence: 'meta/principle card has confidence 95+; principle cards should stay restrained unless tightly grounded',
  critical_risk_low_confidence_review: 'risk is 90+ while confidence is below 70; review whether severity is well bounded as written'
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function listCardFiles() {
  const files = [];
  for (const category of CARD_CATEGORIES) {
    const categoryPath = path.join(CARDS_DIR, category);
    if (!fs.existsSync(categoryPath)) {
      continue;
    }
    for (const fileName of fs.readdirSync(categoryPath).filter(name => name.endsWith('.json')).sort()) {
      files.push(path.join(categoryPath, fileName));
    }
  }
  return files;
}

function resolveInputFiles(values) {
  if (values.length === 0) {
    return listCardFiles();
  }
  return values.map(value => path.isAbsolute(value) ? value : path.join(ROOT_DIR, value));
}

function rawImpactIssues(rawImpact) {
  if (!rawImpact || typeof rawImpact !== 'object') {
    return ['missing_impact'];
  }
  const issues = [];
  for (const field of ['value', 'risk', 'confidence']) {
    if (!(field in rawImpact)) {
      issues.push(`missing_${field}`);
      continue;
    }
    const numeric = Number(rawImpact[field]);
    if (!Number.isFinite(numeric)) {
      issues.push(`non_numeric_${field}`);
      continue;
    }
    if (numeric < 0 || numeric > 100) {
      issues.push(`out_of_range_${field}`);
    }
  }
  return issues;
}

function buildSoftFlags(card, impact) {
  const flags = [];
  if (impact.value >= 90 && impact.risk >= 90 && impact.confidence >= 90) {
    flags.push('all_three_90_plus');
  }
  if (impact.value >= 95) {
    flags.push('value_95_plus');
  }
  if (impact.confidence >= 95) {
    flags.push('confidence_95_plus');
  }
  if (card.status === 'proposed' && impact.confidence >= 90) {
    flags.push('proposed_high_confidence');
  }
  if (card.type === 'meta_principle' && impact.confidence >= 95) {
    flags.push('meta_extreme_confidence');
  }
  if (impact.risk >= 90 && impact.confidence < 70) {
    flags.push('critical_risk_low_confidence_review');
  }
  return flags;
}

function inspectCard(filePath) {
  const card = readJson(filePath);
  const hardIssues = rawImpactIssues(card.impact);
  const normalizedImpact = normalizeImpact(card.impact);
  const result = {
    id: card.id || path.basename(filePath, '.json'),
    type: card.type || 'unknown',
    status: card.status || 'unknown',
    file_path: path.relative(ROOT_DIR, filePath),
    impact: normalizedImpact,
    hard_issues: hardIssues,
    soft_flags: []
  };
  if (hardIssues.length === 0 && normalizedImpact) {
    result.soft_flags = buildSoftFlags(card, normalizedImpact);
  }
  return result;
}

function buildReport(filePaths) {
  const cardReports = filePaths.map(inspectCard);
  const hardFailures = cardReports.filter(card => card.hard_issues.length > 0);
  const softFlagged = cardReports.filter(card => card.soft_flags.length > 0);
  const softFlagCounts = {};
  for (const card of softFlagged) {
    for (const flag of card.soft_flags) {
      softFlagCounts[flag] = (softFlagCounts[flag] || 0) + 1;
    }
  }
  return {
    schema_version: 'aicos-card-scoring-hygiene/v1',
    checked_at: new Date().toISOString(),
    checked_cards: cardReports.length,
    hard_failure_count: hardFailures.length,
    soft_flag_count: softFlagged.length,
    soft_flag_counts: Object.fromEntries(Object.entries(softFlagCounts).sort(([left], [right]) => left.localeCompare(right))),
    hard_failures: hardFailures,
    soft_flagged_cards: softFlagged.slice(0, 25),
    flag_definitions: KNOWN_FLAGS
  };
}

function printHuman(report) {
  console.log('AICOS Card Scoring Hygiene Check');
  console.log('');
  console.log(`- checked cards: ${report.checked_cards}`);
  console.log(`- hard failures: ${report.hard_failure_count}`);
  console.log(`- soft-flagged cards: ${report.soft_flag_count}`);
  if (Object.keys(report.soft_flag_counts).length > 0) {
    console.log('');
    console.log('Flag counts');
    for (const [flag, count] of Object.entries(report.soft_flag_counts)) {
      console.log(`- ${flag}: ${count}`);
    }
  }
  if (report.hard_failures.length > 0) {
    console.log('');
    console.log('Hard failures');
    for (const item of report.hard_failures) {
      console.log(`- ${item.id} (${item.type}): ${item.hard_issues.join(', ')}`);
    }
  }
  if (report.soft_flagged_cards.length > 0) {
    console.log('');
    console.log('Soft-flagged cards');
    for (const item of report.soft_flagged_cards) {
      console.log(`- ${item.id} (${item.type}): ${item.soft_flags.join(', ')}`);
    }
  }
}

function parseArgs(argv) {
  const args = { asJson: false, strict: false, files: [] };
  for (const value of argv) {
    if (value === '--json') {
      args.asJson = true;
      continue;
    }
    if (value === '--strict') {
      args.strict = true;
      continue;
    }
    args.files.push(value);
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const filePaths = resolveInputFiles(args.files);
  const report = buildReport(filePaths);
  if (args.asJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printHuman(report);
  }
  if (report.hard_failure_count > 0) {
    process.exit(1);
  }
  if (args.strict && report.soft_flag_count > 0) {
    process.exit(1);
  }
}

main();
