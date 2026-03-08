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
  DEFAULT_MEMORY_CANDIDATES_DIR,
  DEFAULT_MEMORY_REVIEWS_DIR,
  DEFAULT_RUNS_DIR,
  createExportReviewForCandidate,
  createMecCandidateRecord,
  createMecEvent,
  executeArenaRun,
  listExportReviews,
  listMecCandidates,
  listArenaRuns,
  listMecEvents,
  listMemoryCandidates,
  listMemoryReviews,
  listReviewableCandidates,
  readExportReview,
  readMecCandidate,
  readMecEvent,
  readArenaRun,
  readAuditRecord,
  readMemoryCandidate,
  readMemoryReview,
  reviewMemoryCandidate
} = require('./arena-lib');
const {
  listProfiles
} = require('./model-control-lib');

const MEC_OPERATOR_UI_PATH = path.join(__dirname, '..', 'web', 'mec-operator.html');

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload, null, 2));
}

function sendHtml(res, statusCode, filePath) {
  res.writeHead(statusCode, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(fs.readFileSync(filePath, 'utf-8'));
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
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf-8').trim();
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

async function handleRequest(req, res, options = {}) {
  const outputDir = options.outputDir || process.env.ARENA_RUNS_DIR || DEFAULT_RUNS_DIR;
  const auditOutputDir = options.auditOutputDir || process.env.ARENA_AUDIT_DIR || DEFAULT_AUDIT_DIR;
  const candidateOutputDir = options.candidateOutputDir || process.env.MEC_CANDIDATE_DIR || DEFAULT_CANDIDATES_DIR;
  const eventOutputDir = options.eventOutputDir || process.env.MEC_EVENT_DIR || DEFAULT_EVENTS_DIR;
  const exportReviewOutputDir = options.exportReviewOutputDir || process.env.ARENA_EXPORT_REVIEW_DIR || DEFAULT_EXPORT_REVIEWS_DIR;
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
      output_dir: outputDir,
      audit_output_dir: auditOutputDir,
      candidate_output_dir: candidateOutputDir,
      event_output_dir: eventOutputDir,
      export_review_output_dir: exportReviewOutputDir,
      memory_output_dir: memoryOutputDir,
      memory_review_output_dir: memoryReviewOutputDir
    });
    return;
  }

  if (pathname === '/arena/mec-candidates' && req.method === 'GET') {
    const items = listMecCandidates({ candidateOutputDir });
    sendJson(res, 200, {
      total: items.length,
      items
    });
    return;
  }

  if (pathname === '/arena/mec-candidates' && req.method === 'POST') {
    try {
      const payload = await readRequestBody(req);
      const result = createMecCandidateRecord(payload, { candidateOutputDir, eventOutputDir });
      sendJson(res, 201, result);
    } catch (error) {
      const statusCode = error.code === 'mec_source_event_not_found' || error.code === 'mec_source_card_not_found'
        ? 404
        : 400;
      sendJson(res, statusCode, {
        error: error.code || 'invalid_mec_candidate_request',
        message: error.message
      });
    }
    return;
  }

  if (pathname.startsWith('/arena/mec-candidates/') && req.method === 'GET') {
    const candidateId = decodeURIComponent(pathname.slice('/arena/mec-candidates/'.length));
    const payload = readMecCandidate(candidateId, { candidateOutputDir });
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
      const payload = await readRequestBody(req);
      const result = createMecEvent(payload, { eventOutputDir });
      sendJson(res, 201, result);
    } catch (error) {
      sendJson(res, 400, {
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
      const payload = await readRequestBody(req);
      const result = executeArenaRun(payload, { outputDir, auditOutputDir, memoryOutputDir, memoryReviewOutputDir });
      sendJson(res, 201, result);
    } catch (error) {
      sendJson(res, 400, {
        error: 'invalid_json',
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
      const payload = await readRequestBody(req);
      const result = reviewMemoryCandidate(candidateId, payload, { memoryOutputDir, memoryReviewOutputDir, exportReviewOutputDir });
      sendJson(res, 201, result);
    } catch (error) {
      const statusCode = error.code === 'memory_candidate_not_found'
        ? 404
        : error.code === 'memory_candidate_not_reviewable'
          ? 409
          : 400;
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
      const payload = await readRequestBody(req);
      const result = createExportReviewForCandidate(candidateId, payload, { memoryOutputDir, memoryReviewOutputDir, exportReviewOutputDir });
      sendJson(res, 201, result);
    } catch (error) {
      const statusCode = error.code === 'memory_candidate_not_found'
        ? 404
        : 400;
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
  const server = http.createServer((req, res) => {
    handleRequest(req, res, options).catch(error => {
      sendJson(res, 500, {
        error: 'internal_error',
        message: error.message
      });
    });
  });

  server.listen(port, () => {
    const address = server.address();
    const effectivePort = typeof address === 'object' && address ? address.port : port;
    const outputDir = options.outputDir || process.env.ARENA_RUNS_DIR || DEFAULT_RUNS_DIR;
    const auditOutputDir = options.auditOutputDir || process.env.ARENA_AUDIT_DIR || DEFAULT_AUDIT_DIR;
    const candidateOutputDir = options.candidateOutputDir || process.env.MEC_CANDIDATE_DIR || DEFAULT_CANDIDATES_DIR;
    const eventOutputDir = options.eventOutputDir || process.env.MEC_EVENT_DIR || DEFAULT_EVENTS_DIR;
    const exportReviewOutputDir = options.exportReviewOutputDir || process.env.ARENA_EXPORT_REVIEW_DIR || DEFAULT_EXPORT_REVIEWS_DIR;
    const memoryOutputDir = options.memoryOutputDir || process.env.ARENA_MEMORY_DIR || DEFAULT_MEMORY_CANDIDATES_DIR;
    const memoryReviewOutputDir = options.memoryReviewOutputDir || process.env.ARENA_MEMORY_REVIEW_DIR || DEFAULT_MEMORY_REVIEWS_DIR;
    console.log(`arena-server listening on http://127.0.0.1:${effectivePort} -> ${path.resolve(outputDir)} | audit: ${path.resolve(auditOutputDir)} | mec-candidates: ${path.resolve(candidateOutputDir)} | events: ${path.resolve(eventOutputDir)} | export-reviews: ${path.resolve(exportReviewOutputDir)} | memory: ${path.resolve(memoryOutputDir)} | reviews: ${path.resolve(memoryReviewOutputDir)}`);
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
