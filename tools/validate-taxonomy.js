#!/usr/bin/env node
// AICOS Registry - Taxonomy Validator
// Validates that all cards use only allowed domains and tags
// Usage: node tools/validate-taxonomy.js

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const CARDS_DIR = path.join(ROOT_DIR, 'cards');
const DOMAINS_FILE = path.join(ROOT_DIR, 'taxonomies', 'domains.json');
const TAGS_FILE = path.join(ROOT_DIR, 'taxonomies', 'tags.json');

function loadTaxonomy() {
  const domains = JSON.parse(fs.readFileSync(DOMAINS_FILE, 'utf-8'));
  const tags = JSON.parse(fs.readFileSync(TAGS_FILE, 'utf-8'));
  
  const validDomains = new Set(domains.domains.map(d => d.name));
  const validTags = new Set();
  
  // Add all tags from all categories
  for (const category of Object.keys(tags.tags)) {
    for (const tag of tags.tags[category]) {
      validTags.add(`${category}:${tag}`);
    }
  }
  
  // Also allow tags without category prefix (legacy)
  for (const category of Object.keys(tags.tags)) {
    for (const tag of tags.tags[category]) {
      validTags.add(tag);
    }
  }
  
  return { validDomains, validTags, domains, tags };
}

function scanCards() {
  const cards = [];
  const categories = ['errors', 'solutions', 'meta'];
  
  for (const category of categories) {
    const categoryPath = path.join(CARDS_DIR, category);
    if (!fs.existsSync(categoryPath)) continue;
    
    const files = fs.readdirSync(categoryPath)
      .filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      const filePath = path.join(categoryPath, file);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      cards.push({ file: `${category}/${file}`, ...content });
    }
  }
  
  return cards;
}

function validateCards(cards, validDomains, validTags) {
  const errors = [];
  const warnings = [];
  const unknownDomains = new Set();
  const unknownTags = new Set();
  
  for (const card of cards) {
    // Validate domains
    for (const domain of (card.domain || [])) {
      if (!validDomains.has(domain)) {
        errors.push(`${card.file}: Unknown domain "${domain}"`);
        unknownDomains.add(domain);
      }
    }
    
    // Validate tags
    for (const tag of (card.tags || [])) {
      if (!validTags.has(tag)) {
        warnings.push(`${card.file}: Unknown tag "${tag}"`);
        unknownTags.add(tag);
      }
    }
  }
  
  return { errors, warnings, unknownDomains, unknownTags };
}

function main() {
  console.log('Loading taxonomy...');
  const { validDomains, validTags, domains, tags } = loadTaxonomy();
  console.log(`  ${validDomains.size} valid domains`);
  console.log(`  ${validTags.size} valid tags`);
  
  console.log('\nScanning cards...');
  const cards = scanCards();
  console.log(`  ${cards.length} cards found`);
  
  console.log('\nValidating...');
  const { errors, warnings, unknownDomains, unknownTags } = validateCards(cards, validDomains, validTags);
  
  if (errors.length > 0) {
    console.log('\n❌ ERRORS (unknown domains):');
    for (const err of errors) {
      console.log(`  ${err}`);
    }
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS (unknown tags):');
    for (const warn of warnings) {
      console.log(`  ${warn}`);
    }
  }
  
  if (unknownDomains.size > 0) {
    console.log('\n📋 Suggested additions to domains.json:');
    for (const domain of unknownDomains) {
      console.log(`    { "name": "${domain}", "description": "TODO: Add description" },`);
    }
  }
  
  if (unknownTags.size > 0) {
    console.log('\n📋 Suggested additions to tags.json:');
    for (const tag of unknownTags) {
      console.log(`    "${tag}"`);
    }
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('\n✅ All cards use valid domains and tags');
    process.exit(0);
  } else if (errors.length > 0) {
    console.log(`\n❌ Validation failed: ${errors.length} errors, ${warnings.length} warnings`);
    process.exit(1);
  } else {
    console.log(`\n⚠️  Validation passed with ${warnings.length} warnings`);
    process.exit(0);
  }
}

main();
