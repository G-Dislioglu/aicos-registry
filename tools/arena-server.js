#!/usr/bin/env node
const fs = require('fs');
const http = require('http');
const path = require('path');
const { URL } = require('url');
const {
  DEFAULT_AUDIT_DIR,
  DEFAULT_CANDIDATES_DIR,
  DEFAULT_EVENTS_DIR,
  DEFAULT_EXPORT_REVIEWS_DIR,
  DEFAULT_MEC_REVIEWS_DIR,
  DEFAULT_MEMORY_CANDIDATES_DIR,
  DEFAULT_MEMORY_REVIEWS_DIR,
  DEFAULT_RUNS_DIR,
  createMecChallengeCounterexample,
  createExportReviewForCandidate,
  createMecCandidateRecord,
  createMecEvent,
  executeArenaRun,
  listExportReviews,
  listMecCandidates,
  listMecReviewWorkspace,
  listMecReviews,
  listArenaRuns,
  listMecEvents,
  listMemoryCandidates,
  listMemoryReviews,
  listReviewableCandidates,
  readExportReview,
  readMecCandidate,
  readMecEvent,
  readMecReviewWorkspace,
  readMecReview,
  readArenaRun,
  readAuditRecord,
  readMemoryCandidate,
  readMemoryReview,
  reviewMecCandidate,
  reviewMemoryCandidate
} = require('./arena-lib');
const {
  listProfiles
} = require('./model-control-lib');

const MEC_OPERATOR_UI_PATH = path.join(__dirname, '..', 'web', 'mec-operator.html');
const MAX_REQUEST_BODY_BYTES = 1024 * 1024;
const WRITE_AUTH_HEADER_NAME = 'x-arena-operator-token';
const WRITE_AUTH_ENV_NAME = 'ARENA_OPERATOR_TOKEN';
const PUBLIC_RESPONSE_STRIP_KEYS = new Set([
  'file_path',
  'candidateFilePaths',
  'eventFilePath'
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function shouldStripPathValue(value) {
  const normalized = String(value || '');
  return /^[A-Za-z]:[\\/]/.test(normalized)
    || normalized.startsWith('/var/')
    || normalized.startsWith('/home/')
    || normalized.startsWith('/Users/')
    || normalized.includes('cards/<type>/')
    || normalized.includes('\\cards\\')
    || normalized.includes('/cards/');
}

function sanitizePublicPayload(payload) {
  if (Array.isArray(payload)) {
    return payload.map(item => sanitizePublicPayload(item));
  }
  if (!isPlainObject(payload)) {
    return payload;
  }
  return Object.entries(payload).reduce((acc, [key, value]) => {
    if (PUBLIC_RESPONSE_STRIP_KEYS.has(key)) {
      return acc;
    }
    if (key === 'path' && typeof value === 'string' && shouldStripPathValue(value)) {
      return acc;
    }
    acc[key] = sanitizePublicPayload(value);
    return acc;
  }, {});
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(sanitizePublicPayload(payload), null, 2));
}

function sendHtml(res, statusCode, filePath) {
  res.writeHead(statusCode, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(fs.readFileSync(filePath, 'utf-8'));
}

function createHttpError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function getRequestHeader(req, name) {
  const value = req.headers[String(name || '').toLowerCase()];
  if (Array.isArray(value)) {
    return String(value[0] || '');
  }
  return String(value || '');
}

function getOperatorWriteToken() {
  return String(process.env[WRITE_AUTH_ENV_NAME] || '').trim();
}

function isWriteAuthRequired() {
  return Boolean(getOperatorWriteToken());
}

function assertJsonRequest(req) {
  const contentType = getRequestHeader(req, 'content-type').toLowerCase();
  if (!contentType.startsWith('application/json')) {
    throw createHttpError(415, 'unsupported_media_type', 'JSON request body required.');
  }
}

function assertWriteAuthorized(req) {
  const expectedToken = getOperatorWriteToken();
  if (!expectedToken) {
    return;
  }
  const operatorToken = getRequestHeader(req, WRITE_AUTH_HEADER_NAME).trim();
  const authorization = getRequestHeader(req, 'authorization').trim();
  const bearerToken = authorization.toLowerCase().startsWith('bearer ')
    ? authorization.slice(7).trim()
    : '';
  const providedToken = operatorToken || bearerToken;
  if (!providedToken) {
    throw createHttpError(403, 'write_auth_required', `Operator write token required via ${WRITE_AUTH_HEADER_NAME} header.`);
  }
  if (providedToken !== expectedToken) {
    throw createHttpError(403, 'invalid_write_token', 'Operator write token rejected.');
  }
}

function sendMethodNotAllowed(res, method) {
  sendJson(res, 405, {
    error: 'method_not_allowed',
    method,
    allowed: ['GET', 'POST']
  });
}

function sendNotFound(res, pathname) {
  sendJson(res, 404, {
    error: 'not_found',
    path: pathname
  });
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;
    let settled = false;
    req.on('data', chunk => chunks.push(chunk));
    req.on('data', chunk => {
      totalBytes += chunk.length;
      if (settled || totalBytes <= MAX_REQUEST_BODY_BYTES) {
        return;
      }
      settled = true;
      reject(createHttpError(413, 'request_entity_too_large', `Request body exceeds ${MAX_REQUEST_BODY_BYTES} bytes.`));
      req.destroy();
    });
    req.on('end', () => {
      if (settled) {
        return;
      }
      const raw = Buffer.concat(chunks).toString('utf-8').trim();
      if (!raw) {
        settled = true;
        resolve({});
        return;
      }
      try {
        settled = true;
        resolve(JSON.parse(raw));
      } catch (error) {
        settled = true;
        reject(error);
      }
    });
    req.on('error', error => {
      if (settled) {
        return;
      }
      settled = true;
      reject(error);
    });
  });
}

async function handleRequest(req, res, options = {}) {
  const outputDir = options.outputDir || process.env.ARENA_RUNS_DIR || DEFAULT_RUNS_DIR;
  const auditOutputDir = options.auditOutputDir || process.env.ARENA_AUDIT_DIR || DEFAULT_AUDIT_DIR;
  const candidateOutputDir = options.candidateOutputDir || process.env.MEC_CANDIDATE_DIR || DEFAULT_CANDIDATES_DIR;
  const eventOutputDir = options.eventOutputDir || process.env.MEC_EVENT_DIR || DEFAULT_EVENTS_DIR;
  const exportReviewOutputDir = options.exportReviewOutputDir || process.env.ARENA_EXPORT_REVIEW_DIR || DEFAULT_EXPORT_REVIEWS_DIR;
  const mecReviewOutputDir = options.mecReviewOutputDir || process.env.MEC_REVIEW_DIR || DEFAULT_MEC_REVIEWS_DIR;
  const memoryOutputDir = options.memoryOutputDir || process.env.ARENA_MEMORY_DIR || DEFAULT_MEMORY_CANDIDATES_DIR;
  const memoryReviewOutputDir = options.memoryReviewOutputDir || process.env.ARENA_MEMORY_REVIEW_DIR || DEFAULT_MEMORY_REVIEWS_DIR;
  const requestUrl = new URL(req.url, 'http://127.0.0.1');
  const pathname = requestUrl.pathname;

  if ((pathname === '/' || pathname === '/arena/mec-operator' || pathname === '/arena/mec-operator/') && req.method === 'GET') {
    sendHtml(res, 200, MEC_OPERATOR_UI_PATH);
    return;
  }

  if (pathname === '/arena/health' && req.method === 'GET') {
    sendJson(res, 200, {
      ok: true,
      surface: 'arena-server',
      write_auth_required: isWriteAuthRequired(),
      max_request_body_bytes: MAX_REQUEST_BODY_BYTES
    });
    return;
  }

  if (pathname === '/arena/mec-candidates' && req.method === 'GET') {
    const items = listMecCandidates({ candidateOutputDir, mecReviewOutputDir, eventOutputDir });
    sendJson(res, 200, {
      total: items.length,
      items
    });
    return;
  }

  if (pathname === '/arena/mec-candidates' && req.method === 'POST') {
    try {
      assertWriteAuthorized(req);
      assertJsonRequest(req);
      const payload = await readRequestBody(req);
      const result = createMecCandidateRecord(payload, { candidateOutputDir, eventOutputDir });
      sendJson(res, 201, result);
    } catch (error) {
      const statusCode = error.statusCode || ((error.code === 'mec_source_event_not_found' || error.code === 'mec_source_card_not_found')
        ? 404
        : 400);
      sendJson(res, statusCode, {
        error: error.code || 'invalid_mec_candidate_request',
        message: error.message
      });
    }
    return;
  }

  if (pathname.startsWith('/arena/mec-candidates/') && req.method === 'GET') {
    const candidateId = decodeURIComponent(pathname.slice('/arena/mec-candidates/'.length));
    const payload = readMecCandidate(candidateId, { candidateOutputDir, mecReviewOutputDir, eventOutputDir });
    if (!payload) {
      sendJson(res, 404, {
        error: 'mec_candidate_not_found',
        candidate_id: candidateId
      });
      return;
    }
    sendJson(res, 200, payload);
    return;
  }

  if (pathname.startsWith('/arena/mec-review-workspace/') && req.method === 'GET') {
    const candidateId = decodeURIComponent(pathname.slice('/arena/mec-review-workspace/'.length));
    const payload = readMecReviewWorkspace(candidateId, { candidateOutputDir, mecReviewOutputDir, eventOutputDir });
    if (!payload) {
      sendJson(res, 404, {
        error: 'mec_review_workspace_not_found',
        candidate_id: candidateId
      });
      return;
    }
    sendJson(res, 200, payload);
    return;
  }

  if (pathname.startsWith('/arena/mec-candidates/') && pathname.endsWith('/reviews') && req.method === 'POST') {
    const candidateId = decodeURIComponent(pathname.slice('/arena/mec-candidates/'.length, -'/reviews'.length));
    try {
      assertWriteAuthorized(req);
      assertJsonRequest(req);
      const payload = await readRequestBody(req);
      const result = reviewMecCandidate(candidateId, payload, { candidateOutputDir, mecReviewOutputDir });
      sendJson(res, 201, result);
    } catch (error) {
      const statusCode = error.statusCode || (error.code === 'mec_candidate_not_found'
        ? 404
        : error.code === 'mec_candidate_not_reviewable'
          ? 409
          : 400);
      sendJson(res, statusCode, {
        error: error.code || 'invalid_mec_review_request',
        message: error.message,
        candidate_id: candidateId
      });
    }
    return;
  }

  if (pathname.startsWith('/arena/mec-candidates/') && pathname.endsWith('/challenge-counterexamples') && req.method === 'POST') {
    const candidateId = decodeURIComponent(pathname.slice('/arena/mec-candidates/'.length, -'/challenge-counterexamples'.length));
    try {
      assertWriteAuthorized(req);
      assertJsonRequest(req);
      const payload = await readRequestBody(req);
      const result = createMecChallengeCounterexample(candidateId, payload, { candidateOutputDir, eventOutputDir, mecReviewOutputDir });
      sendJson(res, 201, result);
    } catch (error) {
      const statusCode = error.statusCode || (error.code === 'mec_candidate_not_found'
        ? 404
        : error.code === 'mec_candidate_not_challengeable'
          ? 409
          : 400);
      sendJson(res, statusCode, {
        error: error.code || 'invalid_mec_challenge_request',
        message: error.message,
        candidate_id: candidateId,
        blockers: error.blockers || []
      });
    }
    return;
  }

  if (pathname === '/arena/mec-reviews' && req.method === 'GET') {
    const items = listMecReviews({ candidateOutputDir, mecReviewOutputDir, eventOutputDir });
    sendJson(res, 200, {
      total: items.length,
      items
    });
    return;
  }

  if (pathname.startsWith('/arena/mec-reviews/') && req.method === 'GET') {
    const reviewId = decodeURIComponent(pathname.slice('/arena/mec-reviews/'.length));
    const payload = readMecReview(reviewId, { mecReviewOutputDir });
    if (!payload) {
      sendJson(res, 404, {
        error: 'mec_review_not_found',
        review_id: reviewId
      });
      return;
    }
    sendJson(res, 200, payload);
    return;
  }

  if (pathname === '/arena/events' && req.method === 'GET') {
    const items = listMecEvents({ eventOutputDir });
    sendJson(res, 200, {
      total: items.length,
      items
    });
    return;
  }

  if (pathname === '/arena/events' && req.method === 'POST') {
    try {
      assertWriteAuthorized(req);
      assertJsonRequest(req);
      const payload = await readRequestBody(req);
      const result = createMecEvent(payload, { eventOutputDir });
      sendJson(res, 201, result);
    } catch (error) {
      sendJson(res, error.statusCode || 400, {
        error: error.code || 'invalid_event_request',
        message: error.message
      });
    }
    return;
  }

  if (pathname.startsWith('/arena/events/') && req.method === 'GET') {
    const eventId = decodeURIComponent(pathname.slice('/arena/events/'.length));
    const payload = readMecEvent(eventId, { eventOutputDir });
    if (!payload) {
      sendJson(res, 404, {
        error: 'event_not_found',
        event_id: eventId
      });
      return;
    }
    sendJson(res, 200, payload);
    return;
  }

  if (pathname === '/arena/profiles' && req.method === 'GET') {
    const items = listProfiles();
    sendJson(res, 200, {
      total: items.length,
      items
    });
    return;
  }

  if (pathname === '/arena/runs' && req.method === 'GET') {
    const items = listArenaRuns({ outputDir });
    sendJson(res, 200, {
      total: items.length,
      items
    });
    return;
  }

  if (pathname === '/arena/runs' && req.method === 'POST') {
    try {
      assertWriteAuthorized(req);
      assertJsonRequest(req);
      const payload = await readRequestBody(req);
      const result = executeArenaRun(payload, { outputDir, auditOutputDir, memoryOutputDir, memoryReviewOutputDir });
      sendJson(res, 201, result);
    } catch (error) {
      sendJson(res, error.statusCode || 400, {
        error: error.code || 'invalid_json',
        message: error.message
      });
    }
    return;
  }

  if (pathname.startsWith('/arena/runs/') && req.method === 'GET') {
    const runId = decodeURIComponent(pathname.slice('/arena/runs/'.length));
    const payload = readArenaRun(runId, { outputDir });
    if (!payload) {
      sendJson(res, 404, {
        error: 'run_not_found',
        run_id: runId
      });
      return;
    }
    sendJson(res, 200, payload);
    return;
  }

  if (pathname.startsWith('/arena/audit/') && req.method === 'GET') {
    const runId = decodeURIComponent(pathname.slice('/arena/audit/'.length));
    const payload = readAuditRecord(runId, { auditOutputDir });
    if (!payload) {
      sendJson(res, 404, {
        error: 'audit_not_found',
        run_id: runId
      });
      return;
    }
    sendJson(res, 200, payload);
    return;
  }

  if (pathname === '/arena/memory-candidates' && req.method === 'GET') {
    const items = listMemoryCandidates({ memoryOutputDir, memoryReviewOutputDir, exportReviewOutputDir });
    sendJson(res, 200, {
      total: items.length,
      items
    });
    return;
  }

  if (pathname === '/arena/memory-candidates/reviewable' && req.method === 'GET') {
    const items = listReviewableCandidates({ memoryOutputDir, memoryReviewOutputDir, exportReviewOutputDir });
    sendJson(res, 200, {
      total: items.length,
      items
    });
    return;
  }

  if (pathname.startsWith('/arena/memory-candidates/') && req.method === 'GET') {
    const candidateId = decodeURIComponent(pathname.slice('/arena/memory-candidates/'.length));
    const payload = readMemoryCandidate(candidateId, { memoryOutputDir, memoryReviewOutputDir, exportReviewOutputDir });
    if (!payload) {
      sendJson(res, 404, {
        error: 'memory_candidate_not_found',
        candidate_id: candidateId
      });
      return;
    }
    sendJson(res, 200, payload);
    return;
  }

  if (pathname.startsWith('/arena/memory-candidates/') && pathname.endsWith('/reviews') && req.method === 'POST') {
    const candidateId = decodeURIComponent(pathname.slice('/arena/memory-candidates/'.length, -'/reviews'.length));
    try {
      assertWriteAuthorized(req);
      assertJsonRequest(req);
      const payload = await readRequestBody(req);
      const result = reviewMemoryCandidate(candidateId, payload, { memoryOutputDir, memoryReviewOutputDir, exportReviewOutputDir });
      sendJson(res, 201, result);
    } catch (error) {
      const statusCode = error.statusCode || (error.code === 'memory_candidate_not_found'
        ? 404
        : error.code === 'memory_candidate_not_reviewable'
          ? 409
          : 400);
      sendJson(res, statusCode, {
        error: error.code || 'invalid_review_request',
        message: error.message,
        candidate_id: candidateId
      });
    }
    return;
  }

  if (pathname.startsWith('/arena/memory-candidates/') && pathname.endsWith('/export-reviews') && req.method === 'POST') {
    const candidateId = decodeURIComponent(pathname.slice('/arena/memory-candidates/'.length, -'/export-reviews'.length));
    try {
      assertWriteAuthorized(req);
      assertJsonRequest(req);
      const payload = await readRequestBody(req);
      const result = createExportReviewForCandidate(candidateId, payload, { memoryOutputDir, memoryReviewOutputDir, exportReviewOutputDir });
      sendJson(res, 201, result);
    } catch (error) {
      const statusCode = error.statusCode || (error.code === 'memory_candidate_not_found'
        ? 404
        : 400);
      sendJson(res, statusCode, {
        error: error.code || 'invalid_export_review_request',
        message: error.message,
        candidate_id: candidateId
      });
    }
    return;
  }

  if (pathname === '/arena/memory-reviews' && req.method === 'GET') {
    const items = listMemoryReviews({ memoryReviewOutputDir });
    sendJson(res, 200, {
      total: items.length,
      items
    });
    return;
  }

  if (pathname.startsWith('/arena/memory-reviews/') && req.method === 'GET') {
    const reviewId = decodeURIComponent(pathname.slice('/arena/memory-reviews/'.length));
    const payload = readMemoryReview(reviewId, { memoryReviewOutputDir });
    if (!payload) {
      sendJson(res, 404, {
        error: 'memory_review_not_found',
        review_id: reviewId
      });
      return;
    }
    sendJson(res, 200, payload);
    return;
  }

  if (pathname === '/arena/export-reviews' && req.method === 'GET') {
    const items = listExportReviews({ exportReviewOutputDir });
    sendJson(res, 200, {
      total: items.length,
      items
    });
    return;
  }

  if (pathname.startsWith('/arena/export-reviews/') && req.method === 'GET') {
    const exportReviewId = decodeURIComponent(pathname.slice('/arena/export-reviews/'.length));
    const payload = readExportReview(exportReviewId, { exportReviewOutputDir });
    if (!payload) {
      sendJson(res, 404, {
        error: 'export_review_not_found',
        export_review_id: exportReviewId
      });
      return;
    }
    sendJson(res, 200, payload);
    return;
  }

  if (pathname.startsWith('/arena/')) {
    sendMethodNotAllowed(res, req.method);
    return;
  }

  sendNotFound(res, pathname);
}

function startServer(port = Number.parseInt(process.env.PORT || '3220', 10), options = {}) {
  const host = options.host || process.env.HOST || '0.0.0.0';
  const server = http.createServer((req, res) => {
    handleRequest(req, res, options).catch(error => {
      sendJson(res, 500, {
        error: 'internal_error',
        message: error.message
      });
    });
  });

  server.listen(port, host, () => {
    const address = server.address();
    const effectivePort = typeof address === 'object' && address ? address.port : port;
    const effectiveHost = typeof address === 'object' && address && address.address ? address.address : host;
    const outputDir = options.outputDir || process.env.ARENA_RUNS_DIR || DEFAULT_RUNS_DIR;
    const auditOutputDir = options.auditOutputDir || process.env.ARENA_AUDIT_DIR || DEFAULT_AUDIT_DIR;
    const candidateOutputDir = options.candidateOutputDir || process.env.MEC_CANDIDATE_DIR || DEFAULT_CANDIDATES_DIR;
    const eventOutputDir = options.eventOutputDir || process.env.MEC_EVENT_DIR || DEFAULT_EVENTS_DIR;
    const exportReviewOutputDir = options.exportReviewOutputDir || process.env.ARENA_EXPORT_REVIEW_DIR || DEFAULT_EXPORT_REVIEWS_DIR;
    const mecReviewOutputDir = options.mecReviewOutputDir || process.env.MEC_REVIEW_DIR || DEFAULT_MEC_REVIEWS_DIR;
    const memoryOutputDir = options.memoryOutputDir || process.env.ARENA_MEMORY_DIR || DEFAULT_MEMORY_CANDIDATES_DIR;
    const memoryReviewOutputDir = options.memoryReviewOutputDir || process.env.ARENA_MEMORY_REVIEW_DIR || DEFAULT_MEMORY_REVIEWS_DIR;
    console.log(`arena-server listening on http://${effectiveHost}:${effectivePort} -> ${path.resolve(outputDir)} | audit: ${path.resolve(auditOutputDir)} | mec-candidates: ${path.resolve(candidateOutputDir)} | events: ${path.resolve(eventOutputDir)} | export-reviews: ${path.resolve(exportReviewOutputDir)} | mec-reviews: ${path.resolve(mecReviewOutputDir)} | memory: ${path.resolve(memoryOutputDir)} | reviews: ${path.resolve(memoryReviewOutputDir)}`);
  });

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = {
  handleRequest,
  startServer
};
