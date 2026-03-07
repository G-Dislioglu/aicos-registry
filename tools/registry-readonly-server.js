#!/usr/bin/env node
const http = require('http');
const { URL } = require('url');
const {
  getCardById,
  getStats,
  listCards,
  resolveId
} = require('./registry-readonly-lib');

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload, null, 2));
}

function sendNotFound(res, pathname) {
  sendJson(res, 404, {
    error: 'not_found',
    path: pathname
  });
}

function sendMethodNotAllowed(res, method) {
  sendJson(res, 405, {
    error: 'method_not_allowed',
    method,
    allowed: ['GET']
  });
}

function handleRequest(req, res) {
  if (req.method !== 'GET') {
    sendMethodNotAllowed(res, req.method);
    return;
  }

  const requestUrl = new URL(req.url, 'http://127.0.0.1');
  const pathname = requestUrl.pathname;

  if (pathname === '/health') {
    sendJson(res, 200, {
      ok: true,
      surface: 'registry-readonly-server'
    });
    return;
  }

  if (pathname === '/stats') {
    sendJson(res, 200, getStats());
    return;
  }

  if (pathname === '/cards') {
    const limit = requestUrl.searchParams.get('limit');
    const results = listCards({
      type: requestUrl.searchParams.get('type'),
      domain: requestUrl.searchParams.get('domain'),
      tag: requestUrl.searchParams.get('tag'),
      status: requestUrl.searchParams.get('status'),
      q: requestUrl.searchParams.get('q'),
      limit: limit === null ? undefined : limit
    });

    sendJson(res, 200, {
      total: results.length,
      items: results
    });
    return;
  }

  if (pathname.startsWith('/resolve/')) {
    const requestedId = decodeURIComponent(pathname.slice('/resolve/'.length));
    sendJson(res, 200, resolveId(requestedId));
    return;
  }

  if (pathname.startsWith('/cards/')) {
    const requestedId = decodeURIComponent(pathname.slice('/cards/'.length));
    const result = getCardById(requestedId);

    if (!result.existsInIndex) {
      sendJson(res, 404, {
        error: 'card_not_found',
        requestedId,
        resolvedId: result.resolvedId
      });
      return;
    }

    if (!result.card) {
      sendJson(res, 500, {
        error: 'card_file_missing',
        requestedId,
        resolvedId: result.resolvedId,
        filePath: result.filePath
      });
      return;
    }

    sendJson(res, 200, result);
    return;
  }

  sendNotFound(res, pathname);
}

function startServer(port = Number.parseInt(process.env.PORT || '3210', 10)) {
  const server = http.createServer(handleRequest);
  server.listen(port, () => {
    const address = server.address();
    const effectivePort = typeof address === 'object' && address ? address.port : port;
    console.log(`registry-readonly-server listening on http://127.0.0.1:${effectivePort}`);
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
