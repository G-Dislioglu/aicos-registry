#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const DEFAULT_EVENTS_DIR = path.join(ROOT_DIR, 'runtime', 'events');
const EVENT_STATUSES = ['active', 'consolidated', 'expired', 'pruned'];
const CONFIDENCE_LEVELS = ['low', 'medium', 'high'];
const PRIVACY_CLASSES = ['internal', 'restricted', 'sensitive'];
const DEFAULT_TTL_DAYS = 14;
const DEFAULT_PRIORITY_SCORE = 0.5;
const MIN_PRIORITY_SCORE = 0;
const MAX_PRIORITY_SCORE = 1;
const PRIORITY_SCORE_THRESHOLD = 0.2;

function toArray(value) {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value.filter(Boolean).map(item => String(item).trim()).filter(Boolean) : [String(value).trim()].filter(Boolean);
}

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function createEventId() {
  return `mevent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeNumber(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeEventInput(input = {}) {
  const createdAt = input.created_at || input.createdAt || new Date().toISOString();
  const ttlDays = Math.max(1, Math.round(normalizeNumber(input.ttl_days || input.ttlDays, DEFAULT_TTL_DAYS)));
  const priorityScore = clamp(normalizeNumber(input.priority_score || input.priorityScore, DEFAULT_PRIORITY_SCORE), MIN_PRIORITY_SCORE, MAX_PRIORITY_SCORE);
  const salienceSignals = toArray(input.salience_signals || input.salienceSignals);
  const confidence = String(input.confidence || 'medium').trim() || 'medium';
  const privacyClass = String(input.privacy_class || input.privacyClass || 'internal').trim() || 'internal';
  const status = String(input.status || 'active').trim() || 'active';
  const eventType = String(input.event_type || input.eventType || '').trim();
  const domain = String(input.domain || '').trim();
  const summary = String(input.summary || '').trim();
  const sourceRef = String(input.source_ref || input.sourceRef || '').trim();
  const traceRef = String(input.trace_ref || input.traceRef || '').trim();
  const expiresAt = new Date(new Date(createdAt).getTime() + (ttlDays * 24 * 60 * 60 * 1000)).toISOString();

  return {
    id: String(input.id || '').trim(),
    event_type: eventType,
    domain,
    summary,
    source_ref: sourceRef,
    trace_ref: traceRef,
    confidence,
    privacy_class: privacyClass,
    ttl_days: ttlDays,
    priority_score: priorityScore,
    salience_signals: salienceSignals,
    status,
    created_at: createdAt,
    expires_at: expiresAt
  };
}

function validateEventInput(input) {
  if (!input.event_type) {
    const error = new Error('Event type is required.');
    error.code = 'missing_event_type';
    throw error;
  }
  if (!input.domain) {
    const error = new Error('Domain is required.');
    error.code = 'missing_domain';
    throw error;
  }
  if (!input.summary) {
    const error = new Error('Summary is required.');
    error.code = 'missing_summary';
    throw error;
  }
  if (!input.source_ref) {
    const error = new Error('Source ref is required.');
    error.code = 'missing_source_ref';
    throw error;
  }
  if (!input.trace_ref) {
    const error = new Error('Trace ref is required.');
    error.code = 'missing_trace_ref';
    throw error;
  }
  if (!CONFIDENCE_LEVELS.includes(input.confidence)) {
    const error = new Error(`Invalid confidence: ${input.confidence}`);
    error.code = 'invalid_confidence';
    throw error;
  }
  if (!PRIVACY_CLASSES.includes(input.privacy_class)) {
    const error = new Error(`Invalid privacy class: ${input.privacy_class}`);
    error.code = 'invalid_privacy_class';
    throw error;
  }
  if (!EVENT_STATUSES.includes(input.status)) {
    const error = new Error(`Invalid event status: ${input.status}`);
    error.code = 'invalid_event_status';
    throw error;
  }
  if (!Array.isArray(input.salience_signals)) {
    const error = new Error('Salience signals must be an array.');
    error.code = 'invalid_salience_signals';
    throw error;
  }
}

function createEventRecord(rawInput = {}) {
  const normalized = normalizeEventInput(rawInput);
  validateEventInput(normalized);
  return {
    schema_version: 'mec-event/v1',
    id: normalized.id || createEventId(),
    event_type: normalized.event_type,
    domain: normalized.domain,
    summary: normalized.summary,
    source_ref: normalized.source_ref,
    trace_ref: normalized.trace_ref,
    confidence: normalized.confidence,
    privacy_class: normalized.privacy_class,
    ttl_days: normalized.ttl_days,
    priority_score: normalized.priority_score,
    salience_signals: normalized.salience_signals,
    status: normalized.status,
    created_at: normalized.created_at,
    expires_at: normalized.expires_at,
    event_boundary: {
      runtime_only: true,
      registry_mutation: false,
      candidate_created: false,
      canon_exported: false,
      priority_threshold: PRIORITY_SCORE_THRESHOLD
    }
  };
}

function createEvent(rawInput = {}, options = {}) {
  const eventOutputDir = options.eventOutputDir || process.env.MEC_EVENT_DIR || DEFAULT_EVENTS_DIR;
  const eventRecord = createEventRecord(rawInput);
  ensureDirectory(eventOutputDir);
  const eventFilePath = path.join(eventOutputDir, `${eventRecord.id}.json`);
  fs.writeFileSync(eventFilePath, JSON.stringify(eventRecord, null, 2));
  return {
    eventFilePath,
    event: eventRecord
  };
}

function listEvents(options = {}) {
  const eventOutputDir = options.eventOutputDir || process.env.MEC_EVENT_DIR || DEFAULT_EVENTS_DIR;
  if (!fs.existsSync(eventOutputDir)) {
    return [];
  }
  return fs.readdirSync(eventOutputDir)
    .filter(file => file.endsWith('.json'))
    .sort()
    .map(file => {
      const filePath = path.join(eventOutputDir, file);
      const payload = readJsonFile(filePath);
      return {
        id: payload.id,
        event_type: payload.event_type,
        domain: payload.domain,
        confidence: payload.confidence,
        privacy_class: payload.privacy_class,
        ttl_days: payload.ttl_days,
        priority_score: payload.priority_score,
        status: payload.status,
        created_at: payload.created_at,
        expires_at: payload.expires_at,
        salience_signals: payload.salience_signals,
        file_path: filePath
      };
    });
}

function getEvent(eventId, options = {}) {
  const eventOutputDir = options.eventOutputDir || process.env.MEC_EVENT_DIR || DEFAULT_EVENTS_DIR;
  const filePath = path.join(eventOutputDir, `${eventId}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return readJsonFile(filePath);
}

module.exports = {
  CONFIDENCE_LEVELS,
  DEFAULT_EVENTS_DIR,
  DEFAULT_PRIORITY_SCORE,
  DEFAULT_TTL_DAYS,
  EVENT_STATUSES,
  PRIORITY_SCORE_THRESHOLD,
  PRIVACY_CLASSES,
  createEvent,
  createEventRecord,
  getEvent,
  listEvents,
  normalizeEventInput
};
