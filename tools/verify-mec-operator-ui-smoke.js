#!/usr/bin/env node
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { startServer } = require('./arena-server');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function request(method, urlString, payload) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const body = payload ? JSON.stringify(payload) : null;
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: {
        'Connection': 'close',
        ...(body ? {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(body)
        } : {})
      }
    }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf-8');
        let json = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch (error) {
          json = null;
        }
        resolve({
          statusCode: res.statusCode,
          text,
          json
        });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function main() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-mec-ui-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-mec-ui-candidates-'));
  const port = 3346;
  const server = startServer(port, {
    eventOutputDir: tempEventDir,
    candidateOutputDir: tempCandidateDir
  });

  try {
    await new Promise(resolve => setTimeout(resolve, 300));

    const page = await request('GET', `http://127.0.0.1:${port}/`);
    assert(page.statusCode === 200, 'Expected MEC operator page to return 200');
    assert(page.text.includes('MEC Operator Shell'), 'Expected UI page title');
    assert(page.text.includes('Candidate Detail'), 'Expected candidate detail section');
    assert(page.text.includes('Pair relationship'), 'Expected pair relationship detail block');
    assert(page.text.includes('Paired reading, not forced merging'), 'Expected paired reading framing in detail view');
    assert(page.text.includes('One linked case, two separately stored runtime objects'), 'Expected paired runtime object framing in pair view');
    assert(page.text.includes('Use selected candidate'), 'Expected create shortcut action');
    assert(page.text.includes('Linked target'), 'Expected linked target safety framing');
    assert(page.text.includes('Refuted target'), 'Expected refuted target safety framing');
    assert(page.text.includes('No target id set yet. Select a candidate first or enter a runtime candidate id.'), 'Expected missing target guidance in create flow');
    assert(page.text.includes('Resolved source events'), 'Expected source event readback framing');
    assert(page.text.includes('Current runtime event references from the create form.'), 'Expected compact source event readback description');
    assert(page.text.includes('Runtime event id is not present in the current event list.'), 'Expected unresolved source event marker');
    assert(page.text.includes('Create result actions'), 'Expected create result action framing');
    assert(page.text.includes('Open created candidate'), 'Expected open created candidate action');
    assert(page.text.includes('Open linked boundary'), 'Expected open linked boundary action');
    assert(page.text.includes('Open linked target'), 'Expected open linked target action');
    assert(page.text.includes('Open refuted target'), 'Expected open refuted target action');
    assert(page.text.includes('Use created as linked target'), 'Expected create result carryover into linked target field');
    assert(page.text.includes('Use created as refuted target'), 'Expected create result carryover into refuted target field');
    assert(page.text.includes('linked invariant'), 'Expected role-aware linked invariant badge');
    assert(page.text.includes('linked boundary'), 'Expected role-aware linked boundary badge');
    assert(page.text.includes('standalone'), 'Expected standalone display badge');
    assert(page.text.includes('cp:'), 'Expected compact counterpart id hint marker');
    assert(page.text.includes('Add event id'), 'Expected event-to-form action');
    assert(page.text.includes('detail-event-add'), 'Expected candidate detail source-event carryover action marker');
    assert(page.text.includes('Use as linked target'), 'Expected candidate detail carryover into linked target field');
    assert(page.text.includes('Use as refuted target'), 'Expected candidate detail carryover into refuted target field');
    assert(page.text.includes('freshness'), 'Expected freshness signal visibility in UI');

    const eventResponse = await request('POST', `http://127.0.0.1:${port}/arena/events`, {
      event_type: 'ui_probe',
      domain: 'mec_ui_phase11',
      summary: 'Stable local UI smoke event',
      source_ref: 'verifier://ui/smoke',
      trace_ref: 'trace://ui/smoke',
      confidence: 'medium',
      privacy_class: 'internal',
      ttl_days: 7,
      priority_score: 0.6,
      salience_signals: ['ui', 'smoke']
    });
    assert(eventResponse.statusCode === 201, 'Expected event creation to return 201');
    assert(eventResponse.json && eventResponse.json.event && eventResponse.json.event.id, 'Expected created event id');

    const eventListResponse = await request('GET', `http://127.0.0.1:${port}/arena/events`);
    assert(eventListResponse.statusCode === 200, 'Expected event list to return 200');
    assert(eventListResponse.json && Array.isArray(eventListResponse.json.items) && eventListResponse.json.items.length === 1, 'Expected one stored event in event list');
    assert(eventListResponse.json.items[0].freshness_state === 'fresh', 'Expected event list freshness_state to be fresh');

    const eventDetailResponse = await request('GET', `http://127.0.0.1:${port}/arena/events/${eventResponse.json.event.id}`);
    assert(eventDetailResponse.statusCode === 200, 'Expected event detail to return 200');
    assert(eventDetailResponse.json && eventDetailResponse.json.freshness_state === 'fresh', 'Expected event detail freshness_state to be fresh');

    const candidateResponse = await request('POST', `http://127.0.0.1:${port}/arena/mec-candidates`, {
      candidate_type: 'invariant_candidate',
      principle: 'Stable local UI smoke invariant',
      mechanism: 'Stable local smoke test over MEC operator surfaces',
      source_event_ids: [eventResponse.json.event.id],
      fails_when: ['missing runtime evidence', 'missing explicit boundary'],
      edge_cases: ['single probe'],
      severity: 'medium',
      distillation_mode: 'manual'
    });
    assert(candidateResponse.statusCode === 201, 'Expected candidate creation to return 201');
    assert(candidateResponse.json && candidateResponse.json.candidate && candidateResponse.json.candidate.id, 'Expected created candidate id');
    assert(candidateResponse.json && candidateResponse.json.linked_boundary_candidate && candidateResponse.json.linked_boundary_candidate.id, 'Expected linked boundary candidate');

    const listResponse = await request('GET', `http://127.0.0.1:${port}/arena/mec-candidates`);
    assert(listResponse.statusCode === 200, 'Expected candidate list to return 200');
    assert(listResponse.json && Array.isArray(listResponse.json.items) && listResponse.json.items.length === 2, 'Expected invariant and linked boundary in list');
    assert(listResponse.json.items.every(item => item.freshness_state === 'fresh'), 'Expected candidate list freshness_state values to be fresh');

    const detailResponse = await request('GET', `http://127.0.0.1:${port}/arena/mec-candidates/${candidateResponse.json.candidate.id}`);
    assert(detailResponse.statusCode === 200, 'Expected candidate detail to return 200');
    assert(detailResponse.json && detailResponse.json.linked_boundary_candidate_id === candidateResponse.json.linked_boundary_candidate.id, 'Expected detail to preserve linked boundary id');
    assert(detailResponse.json && detailResponse.json.freshness_state === 'fresh', 'Expected candidate detail freshness_state to be fresh');

    console.log('MEC operator UI smoke verification passed.');
  } finally {
    await new Promise((resolve, reject) => {
      server.close(error => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
