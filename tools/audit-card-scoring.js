#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { deriveScoreSummary, normalizeImpact } = require('./score-lib');

const ROOT_DIR = path.join(__dirname, '..');
const CARDS_DIR = path.join(ROOT_DIR, 'cards');
const INDEX_FILE = path.join(ROOT_DIR, 'index', 'INDEX.json');
const CARD_CATEGORIES = ['errors', 'solutions', 'meta'];

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

function getTypeBucket(card) {
  return card && card.type ? card.type : 'unknown';
}

function readIndexEntries() {
  if (!fs.existsSync(INDEX_FILE)) {
    return [];
  }
  return readJson(INDEX_FILE);
}

function buildAudit() {
  const cards = listCardFiles().map(filePath => {
    const card = readJson(filePath);
    const impact = normalizeImpact(card.impact);
    const scoreSummary = deriveScoreSummary(card);
    return {
      file_path: path.relative(ROOT_DIR, filePath),
      id: card.id,
      type: card.type,
      title: card.title,
      status: card.status,
      impact,
      score_summary: scoreSummary
    };
  });

  const indexEntries = readIndexEntries();
  const indexById = new Map(indexEntries.map(entry => [entry.id, entry]));
  const byType = {};
  const totals = {
    cards: cards.length,
    with_impact: 0,
    without_impact: 0,
    with_complete_impact: 0,
    with_partial_impact: 0,
    with_score_summary: 0,
    index_entries_with_impact: 0,
    index_entries_with_score_summary: 0,
    index_projection_gaps: 0
  };
  const missingImpact = [];
  const partialImpact = [];
  const projectionGaps = [];

  for (const card of cards) {
    const typeBucket = getTypeBucket(card);
    if (!byType[typeBucket]) {
      byType[typeBucket] = {
        total: 0,
        with_impact: 0,
        without_impact: 0,
        with_complete_impact: 0,
        with_partial_impact: 0,
        with_score_summary: 0
      };
    }
    byType[typeBucket].total += 1;

    if (!card.impact) {
      totals.without_impact += 1;
      byType[typeBucket].without_impact += 1;
      missingImpact.push({ id: card.id, type: card.type, file_path: card.file_path });
    } else {
      totals.with_impact += 1;
      byType[typeBucket].with_impact += 1;
      if (card.impact.value === null || card.impact.risk === null || card.impact.confidence === null) {
        totals.with_partial_impact += 1;
        byType[typeBucket].with_partial_impact += 1;
        partialImpact.push({ id: card.id, type: card.type, file_path: card.file_path, impact: card.impact });
      } else {
        totals.with_complete_impact += 1;
        byType[typeBucket].with_complete_impact += 1;
      }
    }

    if (card.score_summary) {
      totals.with_score_summary += 1;
      byType[typeBucket].with_score_summary += 1;
    }

    const indexEntry = indexById.get(card.id);
    if (indexEntry && indexEntry.impact) {
      totals.index_entries_with_impact += 1;
    }
    if (indexEntry && indexEntry.score_summary) {
      totals.index_entries_with_score_summary += 1;
    }
    if (card.impact && (!indexEntry || !indexEntry.impact)) {
      totals.index_projection_gaps += 1;
      projectionGaps.push({ id: card.id, type: card.type, file_path: card.file_path });
    }
  }

  const derivedCards = cards.filter(card => card.score_summary);
  const topScan = [...derivedCards]
    .sort((left, right) => right.score_summary.scan_score - left.score_summary.scan_score || left.id.localeCompare(right.id))
    .slice(0, 5)
    .map(card => ({ id: card.id, type: card.type, scan_score: card.score_summary.scan_score }));
  const highestRisk = cards
    .filter(card => card.impact && card.impact.risk !== null)
    .sort((left, right) => right.impact.risk - left.impact.risk || left.id.localeCompare(right.id))
    .slice(0, 5)
    .map(card => ({ id: card.id, type: card.type, risk: card.impact.risk }));
  const lowestConfidence = cards
    .filter(card => card.impact && card.impact.confidence !== null)
    .sort((left, right) => left.impact.confidence - right.impact.confidence || left.id.localeCompare(right.id))
    .slice(0, 5)
    .map(card => ({ id: card.id, type: card.type, confidence: card.impact.confidence }));

  return {
    schema_version: 'aicos-card-scoring-audit/v1',
    generated_at: new Date().toISOString(),
    totals,
    by_type: byType,
    top_scan_scores: topScan,
    highest_risk_cards: highestRisk,
    lowest_confidence_cards: lowestConfidence,
    missing_impact_cards: missingImpact.slice(0, 20),
    partial_impact_cards: partialImpact.slice(0, 20),
    index_projection_gaps: projectionGaps.slice(0, 20)
  };
}

function printHuman(audit) {
  console.log('AICOS Card Scoring Audit');
  console.log('');
  console.log('Totals');
  console.log(`- cards: ${audit.totals.cards}`);
  console.log(`- with impact: ${audit.totals.with_impact}`);
  console.log(`- without impact: ${audit.totals.without_impact}`);
  console.log(`- with complete impact: ${audit.totals.with_complete_impact}`);
  console.log(`- with partial impact: ${audit.totals.with_partial_impact}`);
  console.log(`- with score summary: ${audit.totals.with_score_summary}`);
  console.log(`- index entries with impact: ${audit.totals.index_entries_with_impact}`);
  console.log(`- index entries with score summary: ${audit.totals.index_entries_with_score_summary}`);
  console.log(`- index projection gaps: ${audit.totals.index_projection_gaps}`);
  console.log('');
  console.log('By type');
  for (const [type, stats] of Object.entries(audit.by_type).sort(([left], [right]) => left.localeCompare(right))) {
    console.log(`- ${type}: total=${stats.total}, with_impact=${stats.with_impact}, without_impact=${stats.without_impact}, summaries=${stats.with_score_summary}`);
  }
  console.log('');
  console.log('Top scan scores');
  for (const item of audit.top_scan_scores) {
    console.log(`- ${item.id} (${item.type}): ${item.scan_score}`);
  }
  console.log('');
  console.log('Highest risk cards');
  for (const item of audit.highest_risk_cards) {
    console.log(`- ${item.id} (${item.type}): ${item.risk}`);
  }
  console.log('');
  console.log('Lowest confidence cards');
  for (const item of audit.lowest_confidence_cards) {
    console.log(`- ${item.id} (${item.type}): ${item.confidence}`);
  }
  if (audit.index_projection_gaps.length > 0) {
    console.log('');
    console.log('Index projection gaps');
    for (const item of audit.index_projection_gaps) {
      console.log(`- ${item.id} (${item.type})`);
    }
  }
}

function main() {
  const asJson = process.argv.includes('--json');
  const audit = buildAudit();
  if (asJson) {
    console.log(JSON.stringify(audit, null, 2));
    return;
  }
  printHuman(audit);
}

main();
