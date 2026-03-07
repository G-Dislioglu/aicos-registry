#!/usr/bin/env node
const http = require('http');
const path = require('path');
const { URL } = require('url');
const {
  DEFAULT_AUDIT_DIR,
  DEFAULT_MEMORY_CANDIDATES_DIR,
  DEFAULT_RUNS_DIR,
  executeArenaRun,
  listArenaRuns,
  listMemoryCandidates,
  readArenaRun,
  readAuditRecord,
  readMemoryCandidate
} = require('./arena-lib');
const {
  listProfiles
} = require('./model-control-lib');

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload, null, 2));
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
  const memoryOutputDir = options.memoryOutputDir || process.env.ARENA_MEMORY_DIR || DEFAULT_MEMORY_CANDIDATES_DIR;
  const requestUrl = new URL(req.url, 'http://127.0.0.1');
  const pathname = requestUrl.pathname;

  if (pathname === '/arena/health' && req.method === 'GET') {
    sendJson(res, 200, {
      ok: true,
      surface: 'arena-server',
      output_dir: outputDir,
      audit_output_dir: auditOutputDir,
      memory_output_dir: memoryOutputDir
    });
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
      const result = executeArenaRun(payload, { outputDir, auditOutputDir, memoryOutputDir });
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
    const items = listMemoryCandidates({ memoryOutputDir });
    sendJson(res, 200, {
      total: items.length,
      items
    });
    return;
  }

  if (pathname.startsWith('/arena/memory-candidates/') && req.method === 'GET') {
    const candidateId = decodeURIComponent(pathname.slice('/arena/memory-candidates/'.length));
    const payload = readMemoryCandidate(candidateId, { memoryOutputDir });
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
    const memoryOutputDir = options.memoryOutputDir || process.env.ARENA_MEMORY_DIR || DEFAULT_MEMORY_CANDIDATES_DIR;
    console.log(`arena-server listening on http://127.0.0.1:${effectivePort} -> ${path.resolve(outputDir)} | audit: ${path.resolve(auditOutputDir)} | memory: ${path.resolve(memoryOutputDir)}`);
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
