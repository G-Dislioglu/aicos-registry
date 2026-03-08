#!/usr/bin/env node
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const vm = require('vm');
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

function createVirtualElement(id = '', tagName = 'div') {
  const element = {
    id,
    tagName: String(tagName || 'div').toUpperCase(),
    value: '',
    disabled: false,
    dataset: {},
    attributes: {},
    listeners: {},
    children: [],
    style: {},
    _className: '',
    _textContent: '',
    _innerHTML: '',
    classList: {
      add: (...tokens) => {
        const classes = new Set(String(element._className || '').split(/\s+/).filter(Boolean));
        tokens.forEach(token => classes.add(token));
        element._className = Array.from(classes).join(' ');
      },
      remove: (...tokens) => {
        const classes = new Set(String(element._className || '').split(/\s+/).filter(Boolean));
        tokens.forEach(token => classes.delete(token));
        element._className = Array.from(classes).join(' ');
      },
      contains: token => String(element._className || '').split(/\s+/).filter(Boolean).includes(token)
    },
    addEventListener(type, handler) {
      if (!element.listeners[type]) {
        element.listeners[type] = [];
      }
      element.listeners[type].push(handler);
    },
    click() {
      (element.listeners.click || []).forEach(handler => handler({ preventDefault() {} }));
    },
    querySelector(selector) {
      return element.querySelectorAll(selector)[0] || null;
    },
    querySelectorAll(selector) {
      return element.children.filter(child => matchesSelector(child, selector));
    },
    reset() {
      element.value = '';
    }
  };

  Object.defineProperty(element, 'className', {
    get() {
      return element._className;
    },
    set(value) {
      element._className = String(value || '').trim();
    }
  });

  Object.defineProperty(element, 'textContent', {
    get() {
      return element._textContent;
    },
    set(value) {
      element._textContent = String(value || '');
    }
  });

  Object.defineProperty(element, 'innerHTML', {
    get() {
      return element._innerHTML;
    },
    set(value) {
      element._innerHTML = String(value || '');
      element.children = parseVirtualChildren(element._innerHTML);
    }
  });

  return element;
}

function parseVirtualChildren(html) {
  const children = [];
  const tagRegex = /<([a-z0-9-]+)([^>]*)>/gi;
  let match = tagRegex.exec(html);
  while (match) {
    const [, tagName, rawAttributes] = match;
    const child = createVirtualElement('', tagName);
    const attrRegex = /([a-zA-Z0-9:_-]+)="([^"]*)"/g;
    let attrMatch = attrRegex.exec(rawAttributes);
    while (attrMatch) {
      const [, attrName, attrValue] = attrMatch;
      child.attributes[attrName] = attrValue;
      if (attrName === 'class') {
        child.className = attrValue;
      }
      if (attrName === 'id') {
        child.id = attrValue;
      }
      if (attrName === 'type') {
        child.type = attrValue;
      }
      if (attrName.startsWith('data-')) {
        const datasetKey = attrName.slice(5).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
        child.dataset[datasetKey] = attrValue;
      }
      attrMatch = attrRegex.exec(rawAttributes);
    }
    children.push(child);
    match = tagRegex.exec(html);
  }
  return children;
}

function matchesSelector(element, selector) {
  if (!selector) {
    return false;
  }
  if (selector === '[data-candidate-id]') {
    return Object.prototype.hasOwnProperty.call(element.dataset, 'candidateId');
  }
  if (selector.startsWith('.')) {
    const className = selector.slice(1);
    return String(element.className || '').split(/\s+/).filter(Boolean).includes(className);
  }
  const buttonTypeMatch = selector.match(/^button\[type="([^"]+)"\]$/);
  if (buttonTypeMatch) {
    return element.tagName === 'BUTTON' && element.type === buttonTypeMatch[1];
  }
  return false;
}

function createFetchResponse(status, payload) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return payload;
    }
  };
}

function buildUiScriptHarness() {
  const htmlPath = path.join(__dirname, '..', 'web', 'mec-operator.html');
  const html = fs.readFileSync(htmlPath, 'utf-8');
  const scriptMatch = html.match(/<script>([\s\S]*)<\/script>/);
  assert(scriptMatch && scriptMatch[1], 'Expected embedded MEC operator script');

  const elementIds = [
    'candidate-list',
    'candidate-detail',
    'detail-meta',
    'detail-summary',
    'detail-pair',
    'detail-linkage',
    'summary',
    'pair-list',
    'event-list',
    'candidate-type',
    'create-form',
    'form-message',
    'form-result-actions',
    'candidate-search',
    'candidate-type-filter',
    'candidate-status-filter',
    'candidate-link-filter',
    'create-requirements',
    'source-event-ids',
    'source-event-readback',
    'linked-candidate-id',
    'refutes-candidate-id',
    'linked-target-state',
    'refute-target-state',
    'invariant-fields',
    'boundary-fields',
    'counterexample-fields',
    'curiosity-fields',
    'principle',
    'mechanism',
    'source-card-ids',
    'distillation-mode',
    'fails-when',
    'edge-cases',
    'severity',
    'boundary-fails-when',
    'boundary-edge-cases',
    'boundary-severity',
    'case-description',
    'resolution',
    'impact-on-candidate',
    'open-question',
    'domain',
    'blind-spot-score',
    'refresh-button',
    'clear-filters-button',
    'use-selected-linked-button',
    'use-selected-refute-button',
    'reset-button'
  ];

  const elements = new Map(elementIds.map(id => [id, createVirtualElement(id)]));
  const submitButton = createVirtualElement('', 'button');
  submitButton.type = 'submit';
  elements.get('create-form').children = [submitButton];
  elements.get('candidate-type').value = 'invariant_candidate';
  elements.get('distillation-mode').value = 'manual';
  elements.get('severity').value = 'medium';
  elements.get('boundary-severity').value = 'medium';
  elements.get('blind-spot-score').value = '0.5';

  const events = [
    {
      id: 'event-alpha',
      event_type: 'ui_probe',
      domain: 'mec_ui_harness',
      summary: 'Alpha event',
      freshness_state: 'fresh',
      priority_score: 0.6,
      status: 'open'
    },
    {
      id: 'event-beta',
      event_type: 'ui_probe',
      domain: 'mec_ui_harness',
      summary: 'Beta event',
      freshness_state: 'fresh',
      priority_score: 0.5,
      status: 'open'
    }
  ];
  const candidateList = [
    {
      id: 'candidate-invariant',
      candidate_type: 'invariant_candidate',
      principle: 'Invariant candidate',
      mechanism: 'Invariant mechanism',
      source_event_ids: ['event-alpha'],
      source_card_ids: [],
      status: 'proposal_only',
      created_at: '2026-03-08T18:00:00.000Z',
      updated_at: '2026-03-08T18:00:00.000Z',
      linked_boundary_candidate_id: 'candidate-boundary',
      freshness_state: 'fresh'
    },
    {
      id: 'candidate-boundary',
      candidate_type: 'boundary_candidate',
      principle: 'Boundary candidate',
      mechanism: 'Boundary mechanism',
      source_event_ids: ['event-alpha'],
      source_card_ids: [],
      status: 'proposal_only',
      created_at: '2026-03-08T18:01:00.000Z',
      updated_at: '2026-03-08T18:01:00.000Z',
      linked_candidate_id: 'candidate-invariant',
      freshness_state: 'fresh'
    },
    {
      id: 'candidate-counterexample',
      candidate_type: 'counterexample_candidate',
      principle: 'Counterexample candidate',
      mechanism: 'Counterexample mechanism',
      source_event_ids: ['event-beta'],
      source_card_ids: [],
      status: 'proposal_only',
      created_at: '2026-03-08T18:02:00.000Z',
      updated_at: '2026-03-08T18:02:00.000Z',
      freshness_state: 'fresh'
    }
  ];
  const candidateDetails = {
    'candidate-invariant': {
      ...candidateList[0],
      distillation_mode: 'manual',
      candidate_boundary: {
        registry_mutation: false,
        auto_resolve: false
      }
    },
    'candidate-boundary': {
      ...candidateList[1],
      fails_when: ['boundary failure'],
      edge_cases: [],
      distillation_mode: 'manual',
      candidate_boundary: {
        registry_mutation: false,
        auto_resolve: false
      }
    },
    'candidate-counterexample': {
      ...candidateList[2],
      refutes_candidate_id: 'candidate-invariant',
      case_description: 'Counterexample detail',
      resolution: 'Keep local',
      impact_on_candidate: 'narrows_scope',
      distillation_mode: 'manual',
      candidate_boundary: {
        registry_mutation: false,
        auto_resolve: false
      }
    }
  };

  const document = {
    getElementById(id) {
      if (!elements.has(id)) {
        elements.set(id, createVirtualElement(id));
      }
      return elements.get(id);
    }
  };

  async function fetch(url) {
    const target = new URL(url, 'http://127.0.0.1:1');
    if (target.pathname === '/arena/mec-candidates') {
      return createFetchResponse(200, { items: candidateList });
    }
    if (target.pathname === '/arena/events') {
      return createFetchResponse(200, { items: events });
    }
    if (target.pathname.startsWith('/arena/mec-candidates/')) {
      const candidateId = decodeURIComponent(target.pathname.split('/').pop());
      return createFetchResponse(200, candidateDetails[candidateId]);
    }
    if (target.pathname.startsWith('/arena/events/')) {
      const eventId = decodeURIComponent(target.pathname.split('/').pop());
      return createFetchResponse(200, events.find(item => item.id === eventId) || null);
    }
    return createFetchResponse(404, { error: 'not_found' });
  }

  const context = {
    document,
    window: null,
    fetch,
    console,
    setTimeout,
    clearTimeout,
    URL
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(scriptMatch[1], context);

  return {
    context,
    elements,
    flush: async () => {
      await new Promise(resolve => setImmediate(resolve));
      await new Promise(resolve => setImmediate(resolve));
    }
  };
}

async function verifyEmbeddedUiWriteSemantics() {
  const harness = buildUiScriptHarness();
  await harness.flush();

  const { context, elements } = harness;
  const sourceEventIdsEl = elements.get('source-event-ids');
  const linkedCandidateIdEl = elements.get('linked-candidate-id');
  const refutesCandidateIdEl = elements.get('refutes-candidate-id');
  const detailSummaryEl = elements.get('detail-summary');
  const detailLinkageEl = elements.get('detail-linkage');
  const formResultActionsEl = elements.get('form-result-actions');

  sourceEventIdsEl.value = 'event-alpha';
  context.appendSourceEventId('event-alpha');
  assert(sourceEventIdsEl.value === 'event-alpha', 'Expected event list append to dedupe repeated event ids');
  context.appendSourceEventId('event-beta');
  assert(sourceEventIdsEl.value === 'event-alpha\nevent-beta', 'Expected event list append to add a new event id once');

  sourceEventIdsEl.value = '';
  context.renderDetail({
    id: 'candidate-invariant',
    candidate_type: 'invariant_candidate',
    principle: 'Invariant candidate',
    mechanism: 'Invariant mechanism',
    source_event_ids: ['event-alpha'],
    source_card_ids: [],
    created_at: '2026-03-08T18:00:00.000Z',
    updated_at: '2026-03-08T18:00:00.000Z',
    distillation_mode: 'manual',
    freshness_state: 'fresh',
    linked_boundary_candidate_id: 'candidate-boundary',
    candidate_boundary: {
      registry_mutation: false,
      auto_resolve: false
    }
  });
  detailSummaryEl.querySelector('.detail-event-add').click();
  assert(sourceEventIdsEl.value === 'event-alpha', 'Expected detail event carryover to write the visible event id into source_event_ids');
  detailSummaryEl.querySelector('.detail-event-add').click();
  assert(sourceEventIdsEl.value === 'event-alpha\nevent-alpha', 'Expected detail event carryover to append without dedupe');

  linkedCandidateIdEl.value = 'stale-linked-target';
  context.renderDetail({
    id: 'candidate-boundary',
    candidate_type: 'boundary_candidate',
    principle: 'Boundary candidate',
    mechanism: 'Boundary mechanism',
    source_event_ids: ['event-alpha'],
    source_card_ids: [],
    created_at: '2026-03-08T18:01:00.000Z',
    updated_at: '2026-03-08T18:01:00.000Z',
    distillation_mode: 'manual',
    freshness_state: 'fresh',
    linked_candidate_id: 'candidate-invariant',
    candidate_boundary: {
      registry_mutation: false,
      auto_resolve: false
    }
  });
  detailLinkageEl.querySelector('.detail-use-linked').click();
  assert(linkedCandidateIdEl.value === 'candidate-invariant', 'Expected detail linked-target carryover to replace linked_candidate_id');

  refutesCandidateIdEl.value = 'stale-refuted-target';
  context.renderDetail({
    id: 'candidate-counterexample',
    candidate_type: 'counterexample_candidate',
    principle: 'Counterexample candidate',
    mechanism: 'Counterexample mechanism',
    source_event_ids: ['event-beta'],
    source_card_ids: [],
    created_at: '2026-03-08T18:02:00.000Z',
    updated_at: '2026-03-08T18:02:00.000Z',
    distillation_mode: 'manual',
    freshness_state: 'fresh',
    refutes_candidate_id: 'candidate-invariant',
    candidate_boundary: {
      registry_mutation: false,
      auto_resolve: false
    }
  });
  detailLinkageEl.querySelector('.detail-use-refute').click();
  assert(refutesCandidateIdEl.value === 'candidate-invariant', 'Expected detail refuted-target carryover to replace refutes_candidate_id');

  linkedCandidateIdEl.value = 'old-linked-result';
  refutesCandidateIdEl.value = 'old-refuted-result';
  context.renderCreateResultActions({
    candidate: {
      id: 'candidate-created',
      candidate_type: 'invariant_candidate',
      linked_candidate_id: 'unexpected-linked-target',
      refutes_candidate_id: 'unexpected-refuted-target'
    },
    linked_boundary_candidate: {
      id: 'candidate-created-boundary'
    }
  });
  formResultActionsEl.querySelector('.create-result-use-linked').click();
  assert(linkedCandidateIdEl.value === 'candidate-created', 'Expected create-result linked carryover to use result.candidate.id only');
  formResultActionsEl.querySelector('.create-result-use-refute').click();
  assert(refutesCandidateIdEl.value === 'candidate-created', 'Expected create-result refuted carryover to use result.candidate.id only');
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

    await verifyEmbeddedUiWriteSemantics();

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
