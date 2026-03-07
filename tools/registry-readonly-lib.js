#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const INDEX_FILE = path.join(ROOT_DIR, 'index', 'INDEX.json');
const ALIASES_FILE = path.join(ROOT_DIR, 'index', 'ALIASES.json');
const TYPE_TO_FOLDER = {
  error_pattern: 'errors',
  solution_proof: 'solutions',
  meta_principle: 'meta'
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function loadIndex() {
  return readJson(INDEX_FILE);
}

function loadAliases() {
  const payload = readJson(ALIASES_FILE);
  return payload.aliases || {};
}

function normalizeValue(value) {
  return String(value || '').trim().toLowerCase();
}

function matchesExactArrayField(values, expected) {
  if (!expected) {
    return true;
  }
  return Array.isArray(values) && values.some(value => normalizeValue(value) === normalizeValue(expected));
}

function matchesExactField(value, expected) {
  if (!expected) {
    return true;
  }
  return normalizeValue(value) === normalizeValue(expected);
}

function matchesQuery(card, query) {
  if (!query) {
    return true;
  }
  const haystack = [card.id, card.token, card.title].map(normalizeValue).join(' ');
  return haystack.includes(normalizeValue(query));
}

function listCards(filters = {}) {
  const index = loadIndex();
  const limit = Number.isInteger(filters.limit) ? filters.limit : Number.parseInt(filters.limit || '0', 10);
  const results = index.filter(card => {
    return matchesExactField(card.type, filters.type)
      && matchesExactArrayField(card.domain, filters.domain)
      && matchesExactArrayField(card.tags, filters.tag)
      && matchesExactField(card.status, filters.status)
      && matchesQuery(card, filters.q);
  });

  if (Number.isFinite(limit) && limit > 0) {
    return results.slice(0, limit);
  }

  return results;
}

function resolveId(requestedId) {
  const aliases = loadAliases();
  const index = loadIndex();
  const resolvedId = aliases[requestedId] || requestedId;
  const cardSummary = index.find(card => card.id === resolvedId) || null;

  return {
    requestedId,
    resolvedId,
    resolvedViaAlias: resolvedId !== requestedId,
    existsInIndex: Boolean(cardSummary),
    type: cardSummary ? cardSummary.type : null,
    summary: cardSummary
  };
}

function getCardFilePath(resolved) {
  if (!resolved || !resolved.summary || !resolved.type) {
    return null;
  }
  const folder = TYPE_TO_FOLDER[resolved.type];
  if (!folder) {
    return null;
  }
  return path.join(ROOT_DIR, 'cards', folder, `${resolved.resolvedId}.json`);
}

function getCardById(requestedId) {
  const resolved = resolveId(requestedId);
  if (!resolved.existsInIndex) {
    return {
      ...resolved,
      card: null,
      filePath: null
    };
  }

  const filePath = getCardFilePath(resolved);
  if (!filePath || !fs.existsSync(filePath)) {
    return {
      ...resolved,
      card: null,
      filePath
    };
  }

  return {
    ...resolved,
    filePath,
    card: readJson(filePath)
  };
}

function getStats() {
  const index = loadIndex();
  const aliases = loadAliases();
  const byType = index.reduce((acc, card) => {
    acc[card.type] = (acc[card.type] || 0) + 1;
    return acc;
  }, {});

  return {
    totalCards: index.length,
    aliasCount: Object.keys(aliases).length,
    byType
  };
}

module.exports = {
  getCardById,
  getStats,
  listCards,
  loadAliases,
  loadIndex,
  resolveId
};
