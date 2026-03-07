#!/usr/bin/env node
// AICOS Registry - Index Generator
// Scans cards directory and generates index/INDEX.json deterministically.
// Usage: node tools/generate-index.js
// Output: index/INDEX.json with minimal entries for fast scanning.
// Sort: by id (alphabetically, case-sensitive)

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const CARDS_DIR = path.join(ROOT_DIR, 'cards');
const INDEX_FILE = path.join(ROOT_DIR, 'index', 'INDEX.json');

// Required fields for a valid card
const REQUIRED_FIELDS = ['id', 'type', 'token', 'title', 'domain', 'tags', 'status'];

// Fields to include in INDEX.json (minimal for fast scanning)
const INDEX_FIELDS = ['id', 'type', 'token', 'title', 'domain', 'tags', 'status', 'copy_ready'];

function readCard(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  try {
    return JSON.parse(content);
  } catch (e) {
    console.error(`ERROR: Invalid JSON in ${filePath}`);
    throw e;
  }
}

function validateCard(card, filePath) {
  for (const field of REQUIRED_FIELDS) {
    if (!(field in card)) {
      console.error(`ERROR: Missing required field "${field}" in ${filePath}`);
      process.exit(1);
    }
  }
  
  // Validate type
  const validTypes = ['error_pattern', 'solution_proof', 'meta_principle'];
  if (!validTypes.includes(card.type)) {
    console.error(`ERROR: Invalid type "${card.type}" in ${filePath}. Must be one of: ${validTypes.join(', ')}`);
    process.exit(1);
  }
  
  // Validate domain is array
  if (!Array.isArray(card.domain)) {
    console.error(`ERROR: domain must be an array in ${filePath}`);
    process.exit(1);
  }
  
  // Validate tags is array
  if (!Array.isArray(card.tags)) {
    console.error(`ERROR: tags must be an array in ${filePath}`);
    process.exit(1);
  }
}

function scanCards() {
  const cards = [];
  const categories = ['errors', 'solutions', 'meta'];
  
  for (const category of categories) {
    const categoryPath = path.join(CARDS_DIR, category);
    if (!fs.existsSync(categoryPath)) continue;
    
    const files = fs.readdirSync(categoryPath)
      .filter(f => f.endsWith('.json'))
      .sort();
    
    for (const file of files) {
      const filePath = path.join(categoryPath, file);
      const card = readCard(filePath);
      validateCard(card, filePath);
      cards.push(card);
    }
  }
  
  return cards;
}

function buildIndexEntry(card) {
  const entry = {};
  for (const field of INDEX_FIELDS) {
    if (field in card) {
      entry[field] = card[field];
    }
  }
  if (card.links && Array.isArray(card.links.fixes) && card.links.fixes.length > 0) {
    entry.fixes = card.links.fixes;
  }
  return entry;
}

function generateIndex() {
  console.log('Scanning cards...');
  const cards = scanCards();
  console.log(`Found ${cards.length} cards`);
  
  // Sort by id
  cards.sort((a, b) => a.id.localeCompare(b.id));
  
  // Build index entries
  const index = cards.map(buildIndexEntry);
  
  // Write INDEX.json
  const output = JSON.stringify(index, null, 2);
  fs.writeFileSync(INDEX_FILE, output + '\n');
  console.log(`Generated ${INDEX_FILE}`);
  
  // Summary by type
  const byType = {};
  for (const card of cards) {
    byType[card.type] = (byType[card.type] || 0) + 1;
  }
  console.log('\nSummary by type:');
  for (const [type, count] of Object.entries(byType).sort()) {
    console.log(`  ${type}: ${count}`);
  }
}

// Run
generateIndex();
