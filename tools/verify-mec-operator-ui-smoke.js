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
      const selectors = String(selector || '').split(',').map(item => item.trim()).filter(Boolean);
      return element.children.filter(child => selectors.some(part => matchesSelector(child, part)));
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
    if (/\sdisabled(?:\s|>|$)/i.test(rawAttributes)) {
      child.disabled = true;
      child.attributes.disabled = 'disabled';
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
    'desk-navigation',
    'detail-overview',
    'detail-summary',
    'detail-explanation',
    'detail-evidence',
    'detail-history',
    'detail-related',
    'detail-focus',
    'detail-compare',
    'detail-delta',
    'review-actions',
    'review-message',
    'review-rationale',
    'detail-pair',
    'detail-linkage',
    'raw-review-records',
    'summary',
    'desk-status',
    'facet-list',
    'desk-queue',
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
    'review-state-filter',
    'candidate-sort',
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
    'candidate-search',
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
      freshness_state: 'fresh',
      current_review_state: 'proposal_only',
      review_summary: {
        review_count: 0,
        reviewable: true,
        terminal: false,
        current_state: 'proposal_only',
        latest_reviewed_at: null
      }
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
      freshness_state: 'fresh',
      current_review_state: 'proposal_only',
      review_summary: {
        review_count: 0,
        reviewable: true,
        terminal: false,
        current_state: 'proposal_only',
        latest_reviewed_at: null
      }
    },
    {
      id: 'candidate-counterexample',
      candidate_type: 'counterexample_candidate',
      principle: 'Counterexample candidate',
      case_description: 'Counterexample detail',
      mechanism: 'Counterexample mechanism',
      refutes_candidate_id: 'candidate-invariant',
      source_event_ids: ['event-beta'],
      source_card_ids: [],
      status: 'proposal_only',
      created_at: '2026-03-08T18:02:00.000Z',
      updated_at: '2026-03-08T18:02:00.000Z',
      freshness_state: 'fresh',
      current_review_state: 'proposal_only',
      review_summary: {
        review_count: 0,
        reviewable: true,
        terminal: false,
        current_state: 'proposal_only',
        latest_reviewed_at: null
      }
    },
    {
      id: 'candidate-curiosity',
      candidate_type: 'curiosity_candidate',
      principle: 'Curiosity candidate',
      open_question: 'Where does the transfer boundary stop holding?',
      mechanism: 'Curiosity mechanism',
      domain: 'mec_ui_harness',
      blind_spot_score: 0.5,
      source_event_ids: ['event-beta'],
      source_card_ids: [],
      status: 'proposal_only',
      created_at: '2026-03-08T18:03:00.000Z',
      updated_at: '2026-03-08T18:03:00.000Z',
      freshness_state: 'fresh',
      current_review_state: 'proposal_only',
      review_summary: {
        review_count: 0,
        reviewable: true,
        terminal: false,
        current_state: 'proposal_only',
        latest_reviewed_at: null
      }
    },
    {
      id: 'candidate-stale-linked',
      candidate_type: 'invariant_candidate',
      principle: 'Stale linked target',
      mechanism: 'Locally visible target that disappears before create submit',
      source_event_ids: ['event-alpha'],
      source_card_ids: [],
      status: 'proposal_only',
      created_at: '2026-03-08T18:04:00.000Z',
      updated_at: '2026-03-08T18:04:00.000Z',
      freshness_state: 'fresh',
      current_review_state: 'proposal_only',
      review_summary: {
        review_count: 0,
        reviewable: true,
        terminal: false,
        current_state: 'proposal_only',
        latest_reviewed_at: null
      }
    },
    {
      id: 'candidate-stale-refute',
      candidate_type: 'invariant_candidate',
      principle: 'Stale refuted target',
      mechanism: 'Locally visible refuted target that disappears before create submit',
      source_event_ids: ['event-beta'],
      source_card_ids: [],
      status: 'proposal_only',
      created_at: '2026-03-08T18:05:00.000Z',
      updated_at: '2026-03-08T18:05:00.000Z',
      freshness_state: 'fresh',
      current_review_state: 'proposal_only',
      review_summary: {
        review_count: 0,
        reviewable: true,
        terminal: false,
        current_state: 'proposal_only',
        latest_reviewed_at: null
      }
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
    },
    'candidate-curiosity': {
      ...candidateList[3],
      open_question: 'Where does the transfer boundary stop holding?',
      domain: 'mec_ui_harness',
      blind_spot_score: 0.5,
      distillation_mode: 'manual',
      candidate_boundary: {
        registry_mutation: false,
        auto_resolve: false
      }
    }
  };

  function buildHarnessRelatedCandidates(rawCandidate, reviewSummary) {
    const sourceEventIds = new Set(Array.isArray(rawCandidate && rawCandidate.source_event_ids) ? rawCandidate.source_event_ids : []);
    return candidateList
      .filter(item => item.id !== rawCandidate.id)
      .filter(item => {
        if (item.id === rawCandidate.linked_candidate_id || item.id === rawCandidate.linked_boundary_candidate_id || item.id === rawCandidate.refutes_candidate_id) {
          return true;
        }
        return Array.isArray(item.source_event_ids) && item.source_event_ids.some(eventId => sourceEventIds.has(eventId));
      })
      .map(item => ({
        candidate_id: item.id,
        title: item.principle || item.open_question || item.case_description || item.id,
        candidate_type: item.candidate_type,
        status: item.status,
        freshness_state: item.freshness_state,
        current_review_state: item.current_review_state || 'proposal_only',
        reviewable: Boolean(item.review_summary ? item.review_summary.reviewable : true),
        terminal: Boolean(item.review_summary ? item.review_summary.terminal : false),
        relation_signals: [
          item.id === rawCandidate.linked_candidate_id || item.id === rawCandidate.linked_boundary_candidate_id || item.id === rawCandidate.refutes_candidate_id ? 'explicit_linkage' : null,
          Array.isArray(item.source_event_ids) && item.source_event_ids.some(eventId => sourceEventIds.has(eventId)) ? `shared_source_event:${item.source_event_ids.filter(eventId => sourceEventIds.has(eventId)).join(',')}` : null
        ].filter(Boolean),
        shared_source_event_count: Array.isArray(item.source_event_ids) ? item.source_event_ids.filter(eventId => sourceEventIds.has(eventId)).length : 0,
        shared_source_card_count: 0,
        explicit_linkage: item.id === rawCandidate.linked_candidate_id || item.id === rawCandidate.linked_boundary_candidate_id || item.id === rawCandidate.refutes_candidate_id
      }))
      .slice(0, 6);
  }

  function buildHarnessFocusContext(rawCandidate, reviewSummary, unresolvedRuntimeReferences, reviewHistoryContext, evidenceContext, relatedCandidates) {
    const pairCounterpartId = evidenceContext && evidenceContext.pair_counterpart_id ? evidenceContext.pair_counterpart_id : null;
    const compareReady = Boolean(pairCounterpartId) || relatedCandidates.length > 0;
    const focusBucket = Boolean(reviewSummary.terminal)
      ? (unresolvedRuntimeReferences.length > 0 ? 'terminal_reference_gap' : 'recent_terminal_decision')
      : unresolvedRuntimeReferences.length > 0
        ? 'reviewable_reference_tension'
        : pairCounterpartId
          ? 'linked_pair_review'
          : relatedCandidates.length > 0
            ? 'comparative_review_zone'
            : reviewHistoryContext && reviewHistoryContext.total_review_count > 0
              ? 'history_carry_forward'
              : 'single_item_review';
    const focusSignals = [
      unresolvedRuntimeReferences.length > 0 ? `${unresolvedRuntimeReferences.length} unresolved runtime reference(s)` : null,
      pairCounterpartId ? `linked pair counterpart ${pairCounterpartId}` : null,
      relatedCandidates.length > 0 ? `${relatedCandidates.length} related candidate(s)` : null,
      reviewHistoryContext && reviewHistoryContext.total_review_count > 0 ? `${reviewHistoryContext.total_review_count} prior review(s)` : null,
      evidenceContext && evidenceContext.integrity_state ? `integrity ${evidenceContext.integrity_state}` : null
    ].filter(Boolean);
    const focusSummary = focusBucket === 'reviewable_reference_tension'
      ? `Focus this item because ${unresolvedRuntimeReferences.length} unresolved runtime reference(s) still shape a reviewable decision.`
      : focusBucket === 'linked_pair_review'
        ? `Focus this linked pair because the workspace exposes a directly comparable counterpart.`
        : focusBucket === 'comparative_review_zone'
          ? `Focus this item in comparison because neighboring workspace objects share visible linkage signals.`
          : focusBucket === 'recent_terminal_decision'
            ? 'Focus here only as terminal history context remains relevant to nearby workspace reads.'
            : focusBucket === 'terminal_reference_gap'
              ? 'Focus here because terminal history and unresolved visible references still coexist.'
              : focusBucket === 'history_carry_forward'
                ? 'Focus this item because existing review history still carries forward into the current read.'
                : 'Focus remains local because the workspace currently exposes no stronger comparative tension.';
    return {
      focus_bucket: focusBucket,
      compare_ready: compareReady,
      focus_summary: focusSummary,
      focus_signals: focusSignals
    };
  }

  function buildHarnessCompareContext(rawCandidate, reviewSummary, relatedCandidates, evidenceContext, reviewHistoryContext) {
    const pairCounterpartId = evidenceContext && evidenceContext.pair_counterpart_id ? evidenceContext.pair_counterpart_id : null;
    const compareCandidates = relatedCandidates.map(item => ({
      candidate_id: item.candidate_id,
      title: item.title,
      candidate_type: item.candidate_type,
      current_review_state: item.current_review_state || 'proposal_only',
      reviewable: Boolean(item.reviewable),
      terminal: Boolean(item.terminal),
      unresolved_runtime_reference_count: item.explicit_linkage ? 0 : 0,
      history_state: reviewHistoryContext && reviewHistoryContext.total_review_count > 0 ? reviewHistoryContext.history_state : 'awaiting_first_review',
      compare_signals: [
        ...(Array.isArray(item.relation_signals) ? item.relation_signals : []),
        item.candidate_id === pairCounterpartId ? 'pair_counterpart' : null,
        reviewSummary && reviewSummary.current_state ? `selected_state:${reviewSummary.current_state}` : null
      ].filter(Boolean)
    }));
    return {
      compare_ready: Boolean(pairCounterpartId) || compareCandidates.length > 0,
      pair_counterpart_id: pairCounterpartId,
      related_candidate_count: relatedCandidates.length,
      compare_summary: compareCandidates.length > 0
        ? `Compare against ${compareCandidates.length} signal-adjacent workspace item(s) without leaving the desk.`
        : 'No compare candidate is currently derivable from the visible workspace signals.',
      compare_candidates: compareCandidates
    };
  }

  function buildHarnessDeltaContext(rawCandidate, reviewSummary, latestReview, unresolvedRuntimeReferences, evidenceContext, reviewHistoryContext, focusContext, compareContext) {
    const latestReviewedAt = latestReview ? latestReview.reviewed_at : (reviewHistoryContext ? reviewHistoryContext.latest_reviewed_at : null);
    const createdAt = rawCandidate && rawCandidate.created_at ? rawCandidate.created_at : null;
    const updatedAt = rawCandidate && rawCandidate.updated_at ? rawCandidate.updated_at : createdAt;
    const anchorKind = latestReviewedAt ? 'latest_review' : (createdAt ? 'candidate_created' : 'workspace_visible_now');
    const changedSinceAnchor = Boolean(latestReviewedAt && updatedAt && Date.parse(updatedAt) > Date.parse(latestReviewedAt));
    const unresolvedCount = unresolvedRuntimeReferences.length;
    const totalReviewCount = Number(reviewHistoryContext && reviewHistoryContext.total_review_count || 0);
    const reviewable = Boolean(reviewSummary && reviewSummary.reviewable);
    const terminal = Boolean(reviewSummary && reviewSummary.terminal);
    const compareReady = Boolean(compareContext && compareContext.compare_ready);
    let movementBucket = 'no_material_delta_visible';
    if (!latestReviewedAt) {
      movementBucket = unresolvedCount > 0 || compareReady ? 'first_read_attention' : 'first_read_baseline';
    } else if (changedSinceAnchor && reviewable && unresolvedCount > 0) {
      movementBucket = 'post_review_change_attention';
    } else if (changedSinceAnchor && reviewable) {
      movementBucket = 'post_review_change_reviewable';
    } else if (changedSinceAnchor && terminal) {
      movementBucket = 'post_review_change_terminal';
    } else if (reviewable && unresolvedCount > 0) {
      movementBucket = 'anchored_attention_without_visible_change';
    } else if (terminal) {
      movementBucket = 'terminal_without_visible_change';
    }
    const whyNow = !latestReviewedAt
      ? (unresolvedCount > 0
        ? 'A first review is still pending and unresolved runtime references remain visible.'
        : compareReady
          ? 'A first review is still pending and comparable neighboring workspace objects are already visible.'
          : 'A first review is still pending, so the next read establishes the initial decision anchor.')
      : changedSinceAnchor && unresolvedCount > 0
        ? 'The raw candidate artifact changed after the latest review anchor and visible reference gaps are still present now.'
        : changedSinceAnchor && compareReady
          ? 'The raw candidate artifact changed after the latest review anchor and the current desk can contrast it against comparable neighbors.'
          : changedSinceAnchor && reviewable
            ? 'The raw candidate artifact changed after the latest review anchor while the workspace still permits a minimal review write.'
            : reviewable && unresolvedCount > 0
              ? 'Even without a newer raw candidate update, unresolved runtime references still keep the current review posture open.'
              : null;
    const whyNotNow = whyNow
      ? null
      : terminal
        ? 'No material post-anchor movement is visible, and the latest terminal decision still matches the currently visible workspace signals.'
        : latestReviewedAt
          ? 'No material post-anchor movement is visible beyond the current workspace baseline.'
          : 'No prior review anchor exists yet, but the visible workspace signals do not currently indicate stronger decision movement.';
    return {
      anchor_kind: anchorKind,
      anchor_at: latestReviewedAt || createdAt || updatedAt || null,
      current_updated_at: updatedAt,
      changed_since_anchor: changedSinceAnchor,
      movement_bucket: movementBucket,
      change_categories: {
        review_anchor: latestReviewedAt ? 'review_anchor_present' : 'no_review_anchor',
        update_timing: changedSinceAnchor ? 'updated_after_anchor' : 'no_visible_update_after_anchor',
        unresolved_gap: unresolvedCount > 0 ? (changedSinceAnchor ? 'unresolved_gap_visible_after_anchor' : 'unresolved_gap_still_visible') : 'no_unresolved_gap_visible',
        readiness: terminal ? (changedSinceAnchor ? 'terminal_after_anchor' : 'terminal_unchanged') : reviewable ? (changedSinceAnchor ? 'reviewable_after_anchor' : 'reviewable_unchanged') : 'not_reviewable',
        evidence: evidenceContext && evidenceContext.total_reference_count > 0 ? (changedSinceAnchor ? 'lineage_visible_after_anchor' : 'lineage_stable') : 'minimal_lineage',
        review_history: totalReviewCount < 1 ? 'no_review_history_yet' : (totalReviewCount === 1 ? 'single_review_anchor' : 'extended_review_history')
      },
      delta_signals: [
        `anchor:${anchorKind}`,
        changedSinceAnchor ? 'updated_after_anchor' : 'no_visible_update_after_anchor',
        unresolvedCount > 0 ? `unresolved_reference_count:${unresolvedCount}` : 'unresolved_reference_count:0',
        `integrity:${evidenceContext && evidenceContext.integrity_state ? evidenceContext.integrity_state : 'minimal'}`,
        `focus:${focusContext && focusContext.focus_bucket ? focusContext.focus_bucket : 'single_item_context'}`,
        compareReady ? 'compare_ready_now' : null,
        totalReviewCount > 0 ? `review_records:${totalReviewCount}` : 'review_records:0'
      ].filter(Boolean),
      delta_summary: movementBucket === 'first_read_attention'
        ? 'No prior review anchor exists yet, and the currently visible workspace signals already justify a first focused read.'
        : movementBucket === 'first_read_baseline'
          ? 'No prior review anchor exists yet, and the current workspace view mostly establishes the first decision baseline.'
          : movementBucket === 'post_review_change_attention'
            ? 'The candidate artifact moved after the latest review anchor while visible runtime gaps still remain.'
            : movementBucket === 'post_review_change_reviewable'
              ? 'The candidate artifact moved after the latest review anchor and remains reviewable under the current workspace signals.'
              : movementBucket === 'post_review_change_terminal'
                ? 'The candidate artifact moved after a terminal review anchor, so the current read should be checked against that prior decision.'
                : movementBucket === 'anchored_attention_without_visible_change'
                  ? 'No new post-review movement is visible, but unresolved runtime references still keep this item attention-bearing.'
                  : movementBucket === 'terminal_without_visible_change'
                    ? 'No new post-review movement is visible and the current terminal read still matches the latest visible decision anchor.'
                    : 'No material change signal is currently visible beyond the existing review anchor.',
      why_now: whyNow,
      why_not_now: whyNotNow,
      review_attention_now: Boolean(whyNow),
      stable_since_anchor: Boolean(latestReviewedAt && !changedSinceAnchor && unresolvedCount < 1),
      compare_delta_ready: Boolean(compareReady && (changedSinceAnchor || !latestReviewedAt))
    };
  }

  function toWorkspaceItem(rawCandidate) {
    const reviewSummary = rawCandidate && rawCandidate.review_summary ? rawCandidate.review_summary : {
      review_count: 0,
      reviewable: true,
      terminal: false,
      current_state: 'proposal_only',
      latest_reviewed_at: null
    };
    const rawReviewRecords = Array.isArray(rawCandidate && rawCandidate.raw_review_records) ? rawCandidate.raw_review_records.map(record => ({ ...record })) : [];
    const unresolvedRuntimeReferences = Array.isArray(rawCandidate && rawCandidate.unresolved_runtime_references) ? rawCandidate.unresolved_runtime_references.map(item => ({ ...item })) : [];
    const relatedCandidates = Array.isArray(rawCandidate && rawCandidate.related_candidate_context) ? rawCandidate.related_candidate_context.map(item => ({ ...item })) : buildHarnessRelatedCandidates(rawCandidate, reviewSummary);
    const latestReview = rawReviewRecords.length > 0 ? rawReviewRecords[rawReviewRecords.length - 1] : null;
    const evidenceContext = rawCandidate && rawCandidate.evidence_context ? rawCandidate.evidence_context : {
      integrity_state: unresolvedRuntimeReferences.length > 0 ? 'degraded' : ((rawCandidate.source_event_ids || []).length > 0 ? 'intact' : 'minimal'),
      attention_required: unresolvedRuntimeReferences.length > 0,
      total_reference_count: (rawCandidate.source_event_ids || []).length + (rawCandidate.source_card_ids || []).length + [rawCandidate.linked_candidate_id, rawCandidate.linked_boundary_candidate_id, rawCandidate.refutes_candidate_id].filter(Boolean).length,
      resolved_reference_count: ((rawCandidate.source_event_ids || []).length + (rawCandidate.source_card_ids || []).length + [rawCandidate.linked_candidate_id, rawCandidate.linked_boundary_candidate_id, rawCandidate.refutes_candidate_id].filter(Boolean).length) - unresolvedRuntimeReferences.length,
      unresolved_reference_count: unresolvedRuntimeReferences.length,
      source_event_count: (rawCandidate.source_event_ids || []).length,
      resolved_source_event_count: (rawCandidate.source_event_ids || []).length,
      unresolved_source_event_count: 0,
      source_event_context: (rawCandidate.source_event_ids || []).map(eventId => ({
        event_id: eventId,
        resolved: events.some(event => event.id === eventId),
        summary: (events.find(event => event.id === eventId) || {}).summary || null,
        event_type: (events.find(event => event.id === eventId) || {}).event_type || null,
        status: (events.find(event => event.id === eventId) || {}).status || null
      })),
      source_card_count: (rawCandidate.source_card_ids || []).length,
      related_candidate_count: [rawCandidate.linked_candidate_id, rawCandidate.linked_boundary_candidate_id, rawCandidate.refutes_candidate_id].filter(Boolean).length,
      resolved_related_candidate_count: [rawCandidate.linked_candidate_id, rawCandidate.linked_boundary_candidate_id, rawCandidate.refutes_candidate_id].filter(candidateId => candidateList.some(candidate => candidate.id === candidateId)).length,
      unresolved_related_candidate_count: [rawCandidate.linked_candidate_id, rawCandidate.linked_boundary_candidate_id, rawCandidate.refutes_candidate_id].filter(candidateId => candidateId && !candidateList.some(candidate => candidate.id === candidateId)).length,
      pair_role: rawCandidate.candidate_type === 'invariant_candidate' ? 'invariant' : (rawCandidate.candidate_type === 'boundary_candidate' ? 'boundary' : null),
      pair_counterpart_id: rawCandidate.candidate_type === 'invariant_candidate' ? (rawCandidate.linked_boundary_candidate_id || null) : (rawCandidate.candidate_type === 'boundary_candidate' ? (rawCandidate.linked_candidate_id || null) : null),
      pair_integrity: rawCandidate.candidate_type === 'invariant_candidate'
        ? (rawCandidate.linked_boundary_candidate_id ? (candidateList.some(candidate => candidate.id === rawCandidate.linked_boundary_candidate_id) ? 'resolved' : 'unresolved') : 'not_applicable')
        : rawCandidate.candidate_type === 'boundary_candidate'
          ? (rawCandidate.linked_candidate_id ? (candidateList.some(candidate => candidate.id === rawCandidate.linked_candidate_id) ? 'resolved' : 'unresolved') : 'not_applicable')
          : 'not_applicable',
      reference_signals: unresolvedRuntimeReferences.map(item => ({
        reference_kind: item.reference_kind,
        reference_id: item.reference_id,
        risk_code: item.risk_code,
        label: item.label
      })),
      evidence_summary: unresolvedRuntimeReferences.length > 0
        ? `Reference integrity is degraded by ${unresolvedRuntimeReferences.length} unresolved runtime reference(s).`
        : ((rawCandidate.source_event_ids || []).length > 0 || [rawCandidate.linked_candidate_id, rawCandidate.linked_boundary_candidate_id, rawCandidate.refutes_candidate_id].filter(Boolean).length > 0)
          ? `Reference integrity is intact across ${((rawCandidate.source_event_ids || []).length + [rawCandidate.linked_candidate_id, rawCandidate.linked_boundary_candidate_id, rawCandidate.refutes_candidate_id].filter(Boolean).length)} visible linkage signal(s).`
          : 'Only minimal lineage signals are available on this workspace item.'
    };
    const reviewHistoryContext = rawCandidate && rawCandidate.review_history_context ? rawCandidate.review_history_context : {
      total_review_count: rawReviewRecords.length,
      valid_review_count: rawReviewRecords.length,
      invalid_review_count: 0,
      latest_review_outcome: latestReview ? latestReview.review_outcome : null,
      latest_reviewed_at: latestReview ? latestReview.reviewed_at : null,
      latest_review_source: latestReview ? latestReview.review_source || null : null,
      history_state: rawReviewRecords.length < 1 ? 'awaiting_first_review' : (Boolean(reviewSummary.terminal) ? 'terminal_history' : 'active_history'),
      history_summary: rawReviewRecords.length < 1
        ? 'No raw review records exist yet.'
        : (Boolean(reviewSummary.terminal)
          ? `History is terminal at ${reviewSummary.current_state || 'proposal_only'} after ${rawReviewRecords.length} review record(s).`
          : `History remains reviewable with ${rawReviewRecords.length} review record(s).`),
      recent_reviews: rawReviewRecords.slice(-3).reverse().map(record => ({
        review_id: record.review_id,
        review_outcome: record.review_outcome,
        reviewed_at: record.reviewed_at,
        review_source: record.review_source || null,
        reviewer_mode: record.reviewer_mode || null
      }))
    };
    const stateExplanation = rawCandidate && rawCandidate.state_explanation ? rawCandidate.state_explanation : {
      current_state: reviewSummary.current_state || 'proposal_only',
      reviewable: Boolean(reviewSummary.reviewable),
      terminal: Boolean(reviewSummary.terminal),
      blocked_reason: reviewSummary.reviewable ? null : `terminal review state: ${reviewSummary.current_state || 'proposal_only'}`,
      unresolved_reference_count: unresolvedRuntimeReferences.length,
      related_candidate_count: relatedCandidates.length,
      explanation_lines: [
        Boolean(reviewSummary.reviewable)
          ? `Current derived state ${reviewSummary.current_state || 'proposal_only'} remains reviewable, so minimal outcomes stay available.`
          : `Current derived state ${reviewSummary.current_state || 'proposal_only'} is terminal, so no further review outcomes are available.`,
        unresolvedRuntimeReferences.length > 0
          ? `${unresolvedRuntimeReferences.length} unresolved runtime reference(s) are still visible in the workspace context.`
          : ((rawCandidate.source_event_ids || []).length > 0 ? 'Visible linkage and source references currently resolve without runtime gaps.' : 'Only minimal linkage evidence is available on this workspace item.'),
        rawReviewRecords.length > 0
          ? `Review history currently contains ${rawReviewRecords.length} raw review record(s).`
          : 'No raw review history exists yet, so this desk view is still anchored on the raw candidate artifact only.'
      ],
      missing_visible_prerequisites: unresolvedRuntimeReferences.map(item => item.label)
    };
    const focusContext = rawCandidate && rawCandidate.focus_context
      ? rawCandidate.focus_context
      : buildHarnessFocusContext(rawCandidate, reviewSummary, unresolvedRuntimeReferences, reviewHistoryContext, evidenceContext, relatedCandidates);
    const compareContext = rawCandidate && rawCandidate.compare_context
      ? rawCandidate.compare_context
      : buildHarnessCompareContext(rawCandidate, reviewSummary, relatedCandidates, evidenceContext, reviewHistoryContext);
    const deltaContext = rawCandidate && rawCandidate.delta_context
      ? rawCandidate.delta_context
      : buildHarnessDeltaContext(rawCandidate, reviewSummary, latestReview, unresolvedRuntimeReferences, evidenceContext, reviewHistoryContext, focusContext, compareContext);
    return {
      workspace_kind: 'mec_review_workspace',
      workspace_version: 'phase3c-mec-review-workspace/v1',
      workspace_id: rawCandidate.id,
      candidate_id: rawCandidate.id,
      title: rawCandidate.principle || rawCandidate.open_question || rawCandidate.case_description || rawCandidate.id,
      latest_review_outcome: reviewSummary.review_count > 0 ? reviewSummary.current_state : null,
      unresolved_runtime_references: unresolvedRuntimeReferences,
      unresolved_runtime_reference_count: unresolvedRuntimeReferences.length,
      reviewable: Boolean(reviewSummary.reviewable),
      terminal: Boolean(reviewSummary.terminal),
      control_readiness: {
        reviewable: Boolean(reviewSummary.reviewable),
        terminal: Boolean(reviewSummary.terminal),
        available_outcomes: reviewSummary.reviewable ? ['stabilize', 'reject'] : [],
        can_stabilize: Boolean(reviewSummary.reviewable),
        can_reject: Boolean(reviewSummary.reviewable),
        blocked_reason: reviewSummary.reviewable ? null : `terminal review state: ${reviewSummary.current_state || 'proposal_only'}`,
        attention_required: unresolvedRuntimeReferences.length > 0,
        unresolved_runtime_reference_count: unresolvedRuntimeReferences.length
      },
      evidence_context: evidenceContext,
      review_history_context: reviewHistoryContext,
      related_candidate_context: relatedCandidates,
      focus_context: focusContext,
      compare_context: compareContext,
      delta_context: deltaContext,
      state_explanation: stateExplanation,
      source_linkage: {
        source_event_ids: rawCandidate.source_event_ids || [],
        source_event_count: (rawCandidate.source_event_ids || []).length,
        source_card_ids: rawCandidate.source_card_ids || [],
        source_card_count: (rawCandidate.source_card_ids || []).length,
        linked_candidate_id: rawCandidate.linked_candidate_id || null,
        linked_boundary_candidate_id: rawCandidate.linked_boundary_candidate_id || null,
        refutes_candidate_id: rawCandidate.refutes_candidate_id || null,
        related_candidate_ids: [rawCandidate.linked_candidate_id, rawCandidate.linked_boundary_candidate_id, rawCandidate.refutes_candidate_id].filter(Boolean),
        pair_counterpart_id: rawCandidate.candidate_type === 'invariant_candidate'
          ? (rawCandidate.linked_boundary_candidate_id || null)
          : rawCandidate.candidate_type === 'boundary_candidate'
            ? (rawCandidate.linked_candidate_id || null)
            : null,
        pair_role: rawCandidate.candidate_type === 'invariant_candidate'
          ? 'invariant'
          : rawCandidate.candidate_type === 'boundary_candidate'
            ? 'boundary'
            : null
      },
      raw_review_records: rawReviewRecords,
      raw_candidate_artifact: Object.keys(rawCandidate || {}).reduce((acc, key) => {
        if (key !== 'raw_review_records') {
          acc[key] = rawCandidate[key];
        }
        return acc;
      }, {}),
      ...rawCandidate
    };
  }

  for (let index = 0; index < candidateList.length; index += 1) {
    candidateList[index] = toWorkspaceItem(candidateList[index]);
  }
  Object.keys(candidateDetails).forEach(candidateId => {
    candidateDetails[candidateId] = toWorkspaceItem(candidateDetails[candidateId]);
  });

  const document = {
    getElementById(id) {
      if (!elements.has(id)) {
        elements.set(id, createVirtualElement(id));
      }
      return elements.get(id);
    }
  };

  async function fetch(url, options = {}) {
    const target = new URL(url, 'http://127.0.0.1:1');
    const method = String(options.method || 'GET').toUpperCase();
    if (target.pathname === '/arena/mec-review-workspace' && method === 'GET') {
      return createFetchResponse(200, { items: candidateList });
    }
    if (target.pathname === '/arena/mec-candidates' && method === 'GET') {
      return createFetchResponse(200, { items: candidateList });
    }
    if (target.pathname === '/arena/mec-candidates' && method === 'POST') {
      const payload = options.body ? JSON.parse(options.body) : {};
      if (payload.candidate_type === 'boundary_candidate' && payload.linked_candidate_id === 'candidate-stale-linked') {
        const staleIndex = candidateList.findIndex(item => item.id === 'candidate-stale-linked');
        if (staleIndex >= 0) {
          candidateList.splice(staleIndex, 1);
        }
        delete candidateDetails['candidate-stale-linked'];
        return createFetchResponse(404, {
          error: 'mec_linked_candidate_not_found',
          candidate_id: 'candidate-stale-linked'
        });
      }
      if (payload.candidate_type === 'counterexample_candidate' && payload.refutes_candidate_id === 'candidate-stale-refute') {
        const staleIndex = candidateList.findIndex(item => item.id === 'candidate-stale-refute');
        if (staleIndex >= 0) {
          candidateList.splice(staleIndex, 1);
        }
        delete candidateDetails['candidate-stale-refute'];
        return createFetchResponse(404, {
          error: 'mec_refuted_candidate_not_found',
          candidate_id: 'candidate-stale-refute'
        });
      }
      return createFetchResponse(201, {
        candidate: {
          id: 'candidate-created',
          candidate_type: payload.candidate_type || 'invariant_candidate'
        }
      });
    }
    if (target.pathname === '/arena/events') {
      return createFetchResponse(200, { items: events });
    }
    if (target.pathname.startsWith('/arena/mec-review-workspace/')) {
      const candidateId = decodeURIComponent(target.pathname.split('/').pop());
      if (!candidateDetails[candidateId]) {
        return createFetchResponse(404, {
          error: 'mec_review_workspace_not_found',
          candidate_id: candidateId
        });
      }
      return createFetchResponse(200, candidateDetails[candidateId]);
    }
    if (target.pathname.startsWith('/arena/mec-candidates/') && target.pathname.endsWith('/reviews') && method === 'POST') {
      const segments = target.pathname.split('/');
      const candidateId = decodeURIComponent(segments[segments.length - 2]);
      const payload = options.body ? JSON.parse(options.body) : {};
      const targetCandidateIndex = candidateList.findIndex(item => item.id === candidateId);
      const targetCandidate = targetCandidateIndex >= 0 ? candidateList[targetCandidateIndex] : null;
      const targetDetail = candidateDetails[candidateId];
      if (!targetCandidate || !targetDetail) {
        return createFetchResponse(404, {
          error: 'mec_candidate_not_found',
          candidate_id: candidateId
        });
      }
      const reviewedAt = '2026-03-09T09:00:00.000Z';
      const reviewSummary = {
        review_count: 1,
        reviewable: false,
        terminal: true,
        current_state: payload.review_outcome,
        latest_reviewed_at: reviewedAt
      };
      const reviewRecord = {
        review_id: `mecreview-ui-${payload.review_outcome}`,
        candidate_id: candidateId,
        review_outcome: payload.review_outcome,
        review_source: payload.review_source || 'mec_ui_harness',
        reviewer_mode: payload.reviewer_mode || 'human',
        reviewed_at: reviewedAt,
        review_rationale: payload.review_rationale || ''
      };
      const nextCandidate = toWorkspaceItem({
        ...targetCandidate.raw_candidate_artifact,
        current_review_state: payload.review_outcome,
        review_summary: { ...reviewSummary },
        raw_review_records: [reviewRecord]
      });
      const nextDetail = toWorkspaceItem({
        ...targetDetail.raw_candidate_artifact,
        current_review_state: payload.review_outcome,
        review_summary: { ...reviewSummary },
        raw_review_records: [reviewRecord]
      });
      candidateList[targetCandidateIndex] = nextCandidate;
      candidateDetails[candidateId] = nextDetail;
      return createFetchResponse(201, {
        reviewRecord,
        candidate: nextDetail
      });
    }
    if (target.pathname.startsWith('/arena/mec-candidates/')) {
      const candidateId = decodeURIComponent(target.pathname.split('/').pop());
      if (!candidateDetails[candidateId]) {
        return createFetchResponse(404, {
          error: 'mec_candidate_not_found',
          candidate_id: candidateId
        });
      }
      return createFetchResponse(200, candidateDetails[candidateId]);
    }
    if (target.pathname.startsWith('/arena/events/')) {
      const eventId = decodeURIComponent(target.pathname.split('/').pop());
      return createFetchResponse(200, events.find(item => item.id === eventId) || null);
    }
    return createFetchResponse(404, { error: 'not_found' });
  }

  const location = {
    pathname: '/',
    search: ''
  };
  const history = {
    replaceState(_state, _title, url) {
      const resolved = new URL(url, 'http://127.0.0.1:1');
      location.pathname = resolved.pathname;
      location.search = resolved.search;
    }
  };
  const context = {
    document,
    window: null,
    fetch,
    console,
    setTimeout,
    clearTimeout,
    URL,
    URLSearchParams,
    location,
    history
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
      await new Promise(resolve => setImmediate(resolve));
      await new Promise(resolve => setImmediate(resolve));
    }
  };
}

async function verifyEmbeddedUiWriteSemantics() {
  const harness = buildUiScriptHarness();
  await harness.flush();

  const { context, elements } = harness;
  const candidateListEl = elements.get('candidate-list');
  const searchEl = elements.get('candidate-search');
  const sourceEventIdsEl = elements.get('source-event-ids');
  const linkedCandidateIdEl = elements.get('linked-candidate-id');
  const refutesCandidateIdEl = elements.get('refutes-candidate-id');
  const deskNavigationEl = elements.get('desk-navigation');
  const detailOverviewEl = elements.get('detail-overview');
  const detailSummaryEl = elements.get('detail-summary');
  const detailExplanationEl = elements.get('detail-explanation');
  const detailEvidenceEl = elements.get('detail-evidence');
  const detailHistoryEl = elements.get('detail-history');
  const detailRelatedEl = elements.get('detail-related');
  const detailMetaEl = elements.get('detail-meta');
  const detailLinkageEl = elements.get('detail-linkage');
  const detailFocusEl = elements.get('detail-focus');
  const detailCompareEl = elements.get('detail-compare');
  const detailDeltaEl = elements.get('detail-delta');
  const rawReviewRecordsEl = elements.get('raw-review-records');
  const deskStatusEl = elements.get('desk-status');
  const facetListEl = elements.get('facet-list');
  const deskQueueEl = elements.get('desk-queue');
  const formResultActionsEl = elements.get('form-result-actions');
  const formMessageEl = elements.get('form-message');
  const formEl = elements.get('create-form');
  const createSubmitButton = elements.get('create-form').children[0];
  const applySearch = value => {
    searchEl.value = value;
    vm.runInContext(`state.query = ${JSON.stringify(value)};`, context);
    context.renderCandidateList();
    context.renderPairView();
  };

  context.renderCandidateList();
  assert(deskStatusEl.innerHTML.includes('Desk facet'), 'Expected desk status strip to render current workspace scope');
  assert(facetListEl.innerHTML.includes('Reviewable now'), 'Expected desk facet entrypoints to render');
  assert(deskQueueEl.innerHTML.includes('Active desk queue'), 'Expected desk queue summary to render');
  assert(candidateListEl.innerHTML.includes('Change: review movement now') || candidateListEl.innerHTML.includes('Change: stable since anchor') || candidateListEl.innerHTML.includes('Focus: compare now') || candidateListEl.innerHTML.includes('Ready for first review'), 'Expected candidate list to render grouped desk sections');
  assert(candidateListEl.innerHTML.includes('Linked target candidate-invariant') || candidateListEl.innerHTML.includes('A first review is still pending and unresolved runtime references remain visible.') || candidateListEl.innerHTML.includes('A first review is still pending and comparable neighboring workspace objects are already visible.'), 'Expected boundary candidate list row to expose linked-target or delta-aware context');
  assert(candidateListEl.innerHTML.includes('Refutes candidate-invariant | Counterexample detail') || candidateListEl.innerHTML.includes('A first review is still pending and comparable neighboring workspace objects are already visible.'), 'Expected counterexample candidate list row to expose refuted-target or delta-aware context');
  assert(candidateListEl.innerHTML.includes('Domain mec_ui_harness | blind spot 0.5') || candidateListEl.innerHTML.includes('A first review is still pending, so the next read establishes the initial decision anchor.') || candidateListEl.innerHTML.includes('A first review is still pending and comparable neighboring workspace objects are already visible.'), 'Expected curiosity candidate list row to expose domain/blind-spot or delta-aware context');
  assert(candidateListEl.innerHTML.includes('review proposal_only'), 'Expected candidate list rows to expose derived review state badge');
  assert(candidateListEl.innerHTML.includes('records 0'), 'Expected candidate list rows to expose raw review record count badge');

  vm.runInContext(`state.reviewFilter = 'reviewable_only';`, context);
  context.renderCandidateList();
  assert(candidateListEl.innerHTML.includes('candidate-invariant'), 'Expected reviewable_only filter to keep reviewable candidates visible');

  vm.runInContext(`state.reviewFilter = ''; state.sortMode = 'review_count';`, context);
  context.renderCandidateList();
  assert(candidateListEl.innerHTML.includes('candidate-invariant'), 'Expected review_count sort mode to render candidate list');

  applySearch('Counterexample detail');
  assert(candidateListEl.innerHTML.includes('candidate-counterexample'), 'Expected search to find counterexample candidates by case_description');
  assert(!candidateListEl.innerHTML.includes('candidate-curiosity'), 'Expected counterexample search to exclude unrelated curiosity candidates');

  applySearch('');

  vm.runInContext(`state.deskFacet = 'attention';`, context);
  context.renderCandidateList();
  assert(candidateListEl.innerHTML.includes('No workspace objects found for the current review-desk scope.'), 'Expected attention facet to hide rows when no workspace item needs attention in the harness');
  vm.runInContext(`state.deskFacet = '';`, context);
  context.renderCandidateList();

  elements.get('candidate-type').value = 'boundary_candidate';
  linkedCandidateIdEl.value = 'missing-linked-target';
  context.updateTypeSections();
  assert(createSubmitButton.disabled === true, 'Expected submit to stay disabled when a required linked target id is unresolved');
  linkedCandidateIdEl.value = 'candidate-invariant';
  context.updateCreateTargetSafety();
  assert(createSubmitButton.disabled === false, 'Expected submit to re-enable when the required linked target resolves in the current runtime list');

  elements.get('candidate-type').value = 'counterexample_candidate';
  refutesCandidateIdEl.value = 'missing-refuted-target';
  context.updateTypeSections();
  assert(createSubmitButton.disabled === true, 'Expected submit to stay disabled when a required refuted target id is unresolved');
  refutesCandidateIdEl.value = 'candidate-invariant';
  context.updateCreateTargetSafety();
  assert(createSubmitButton.disabled === false, 'Expected submit to re-enable when the required refuted target resolves in the current runtime list');

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
  assert(detailSummaryEl.innerHTML.includes('Linked target id'), 'Expected boundary detail to expose linked target id');
  assert(detailSummaryEl.innerHTML.includes('Fails when count'), 'Expected boundary detail to expose fails_when count');
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
  assert(detailSummaryEl.innerHTML.includes('Refuted target id'), 'Expected counterexample detail to expose refuted target id');
  assert(detailSummaryEl.innerHTML.includes('Case description'), 'Expected counterexample detail to expose case description');
  detailLinkageEl.querySelector('.detail-use-refute').click();
  assert(refutesCandidateIdEl.value === 'candidate-invariant', 'Expected detail refuted-target carryover to replace refutes_candidate_id');

  context.renderDetail({
    id: 'candidate-boundary-unresolved',
    candidate_type: 'boundary_candidate',
    principle: 'Boundary candidate unresolved reference',
    mechanism: 'Boundary mechanism unresolved reference',
    source_event_ids: ['event-alpha'],
    source_card_ids: [],
    created_at: '2026-03-08T18:06:00.000Z',
    updated_at: '2026-03-08T18:06:00.000Z',
    distillation_mode: 'manual',
    freshness_state: 'fresh',
    linked_candidate_id: 'missing-linked-target',
    candidate_boundary: {
      registry_mutation: false,
      auto_resolve: false
    }
  });
  assert(detailLinkageEl.innerHTML.includes('unresolved'), 'Expected unresolved detail linkage references to be labeled unresolved');
  assert(detailLinkageEl.innerHTML.includes('Referenced runtime candidate is not present in the current runtime candidate list.'), 'Expected unresolved detail linkage references to explain the missing runtime object');
  assert(detailLinkageEl.querySelector('.detail-open') === null, 'Expected unresolved detail linkage references to avoid open actions');
  assert(detailLinkageEl.querySelector('.detail-use-linked') === null, 'Expected unresolved detail linkage references to avoid contradictory carryover actions');

  await context.selectCandidate('missing-candidate');
  assert(detailMetaEl.innerHTML.includes('reference unavailable'), 'Expected missing candidate detail fetches to surface a reference-unavailable badge');
  assert(detailLinkageEl.innerHTML.includes('Reference unavailable'), 'Expected missing candidate detail fetches to render a reference-unavailable detail card');
  assert(elements.get('candidate-detail').textContent.includes('Referenced runtime candidate is not available: missing-candidate'), 'Expected missing candidate detail fetches to explain the unavailable runtime candidate');

  await context.selectCandidate('candidate-curiosity');
  context.renderDetail(context.getCandidateById('candidate-curiosity'));
  vm.runInContext(`state.selectedCandidateId = 'candidate-curiosity';`, context);
  context.renderDeskNavigation();
  assert(detailOverviewEl.innerHTML.includes('Desk queue facet'), 'Expected desk detail to render selected queue context');
  assert(detailSummaryEl.innerHTML.includes('Open question'), 'Expected curiosity detail to expose open question');
  assert(detailSummaryEl.innerHTML.includes('Blind spot score'), 'Expected curiosity detail to expose blind spot score');
  assert(detailSummaryEl.innerHTML.includes('Derived review state'), 'Expected detail rendering to expose derived review state cards');
  assert(detailSummaryEl.innerHTML.includes('Workspace kind'), 'Expected detail rendering to expose canonical workspace cards');
  assert(detailSummaryEl.innerHTML.includes('Last review outcome'), 'Expected detail rendering to expose last review outcome');
  assert(detailExplanationEl.innerHTML.includes('Why this state'), 'Expected desk detail to render a signal-based state explanation');
  assert(detailExplanationEl.innerHTML.includes('No raw review history exists yet'), 'Expected state explanation to describe the lack of existing review history');
  assert(detailEvidenceEl.innerHTML.includes('Evidence summary'), 'Expected desk detail to render evidence summary');
  assert(detailEvidenceEl.innerHTML.includes('Source event context'), 'Expected desk detail to render source event context');
  assert(detailHistoryEl.innerHTML.includes('History summary'), 'Expected desk detail to render compressed history summary');
  assert(detailHistoryEl.innerHTML.includes('No recent review direction is available'), 'Expected history panel to explain missing review direction when no raw review exists');
  assert(detailRelatedEl.innerHTML.includes('Open related'), 'Expected related candidate context to expose open-related actions');
  assert(detailRelatedEl.innerHTML.includes('Compare'), 'Expected related candidate context to expose compare actions');
  assert(detailFocusEl.innerHTML.includes('Focus summary'), 'Expected desk detail to render focus summary');
  assert(detailFocusEl.innerHTML.includes('Focus signals'), 'Expected desk detail to render focus signals');
  assert(detailCompareEl.innerHTML.includes('Compare summary'), 'Expected desk detail to render compare summary');
  assert(detailCompareEl.innerHTML.includes('Compare candidates'), 'Expected desk detail to render compare candidates');
  assert(detailDeltaEl.innerHTML.includes('Delta summary'), 'Expected desk detail to render delta summary');
  assert(detailDeltaEl.innerHTML.includes('Why now / why not now'), 'Expected desk detail to render why-now/why-not-now readability');
  assert(detailDeltaEl.innerHTML.includes('Change categories'), 'Expected desk detail to render change categories');
  assert(rawReviewRecordsEl.innerHTML.includes('No raw review records stored yet for this workspace item.'), 'Expected desk detail to render an empty raw review record state');
  assert(deskNavigationEl.innerHTML.includes('Reproducible desk state'), 'Expected desk detail to render queue navigation and reproducible state');
  assert(deskNavigationEl.innerHTML.includes('Compare state'), 'Expected desk detail to render compare navigation state');

  context.setCompareCandidate('candidate-counterexample');
  assert(detailCompareEl.innerHTML.includes('Active quick compare'), 'Expected compare panel to render an active quick compare block');
  assert(detailCompareEl.innerHTML.includes('candidate-counterexample'), 'Expected compare panel to render the selected compare target');
  assert(String(context.location.search).includes('compare=candidate-counterexample'), 'Expected compare target to be mirrored into desk URL state');

  context.setCompareCandidate('');
  assert(!String(context.location.search).includes('compare='), 'Expected clearing compare target to remove compare state from desk URL');

  const reviewRationaleEl = elements.get('review-rationale');
  reviewRationaleEl.value = 'Operator stabilize proof from embedded harness.';
  context.renderReviewActions({
    id: 'candidate-curiosity',
    candidate_type: 'curiosity_candidate',
    status: 'proposal_only',
    current_review_state: 'proposal_only',
    review_summary: {
      review_count: 0,
      reviewable: true,
      terminal: false,
      current_state: 'proposal_only',
      latest_reviewed_at: null
    }
  });
  const reviewActionsEl = elements.get('review-actions');
  const reviewMessageEl = elements.get('review-message');
  assert(reviewActionsEl.innerHTML.includes('Runtime review controls'), 'Expected detail review action panel to render');
  reviewActionsEl.querySelector('.review-action-stabilize').click();
  await harness.flush();
  assert(reviewMessageEl.textContent.includes('Runtime review recorded: stabilize for candidate-curiosity'), 'Expected stabilize action to surface success message');
  assert(context.getCandidateById('candidate-curiosity').status === 'proposal_only', 'Expected review action to preserve raw runtime status in the embedded harness');
  assert(context.getCandidateById('candidate-curiosity').current_review_state === 'stabilize', 'Expected review action to update derived stabilize state in the embedded harness');
  assert(elements.get('raw-review-records').innerHTML.includes('Raw review record 1'), 'Expected desk detail to expose the newly written raw review record');
  assert(elements.get('detail-history').innerHTML.includes('terminal_history') || elements.get('detail-history').innerHTML.includes('History is terminal at stabilize after 1 review record(s).'), 'Expected desk detail to compress the new review history after a runtime review write');
  assert(elements.get('detail-explanation').innerHTML.includes('Current derived state stabilize is terminal') || elements.get('detail-explanation').innerHTML.includes('Current derived state stabilize is terminal, so no further review outcomes are available.'), 'Expected desk detail explanation to update after the runtime review write');
  assert(String(context.location.search).includes('candidate=candidate-curiosity'), 'Expected selected candidate to be mirrored into desk URL state');

  context.renderReviewActions({
    id: 'candidate-curiosity',
    candidate_type: 'curiosity_candidate',
    status: 'proposal_only',
    current_review_state: 'stabilize',
    review_summary: {
      review_count: 1,
      reviewable: false,
      terminal: true,
      current_state: 'stabilize',
      latest_reviewed_at: '2026-03-09T09:00:00.000Z'
    }
  });
  assert(reviewActionsEl.innerHTML.includes('No further write allowed from this surface because the candidate is already terminal: stabilize.'), 'Expected terminal review surface to explain why writes are disabled');
  assert(reviewActionsEl.querySelector('.review-action-stabilize').disabled === true, 'Expected terminal stabilize action to be disabled');
  assert(reviewActionsEl.querySelector('.review-action-reject').disabled === true, 'Expected terminal reject action to be disabled');

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

  elements.get('candidate-type').value = 'boundary_candidate';
  linkedCandidateIdEl.value = 'candidate-stale-linked';
  sourceEventIdsEl.value = 'event-alpha';
  elements.get('boundary-fails-when').value = 'stale linked reference';
  context.updateTypeSections();
  assert(createSubmitButton.disabled === false, 'Expected stale linked target to remain submittable before the server reports the reference drift');
  await formEl.listeners.submit[0]({ preventDefault() {} });
  assert(formMessageEl.textContent.includes('Linked target is no longer present in the runtime candidate list: candidate-stale-linked'), 'Expected stale linked target submit failures to surface an operator-aligned reference message');
  assert(createSubmitButton.disabled === true, 'Expected stale linked target submit failures to refresh operator safety and disable submit');

  elements.get('candidate-type').value = 'counterexample_candidate';
  refutesCandidateIdEl.value = 'candidate-stale-refute';
  elements.get('case-description').value = 'stale refuted reference';
  context.updateTypeSections();
  assert(createSubmitButton.disabled === false, 'Expected stale refuted target to remain submittable before the server reports the reference drift');
  await formEl.listeners.submit[0]({ preventDefault() {} });
  assert(formMessageEl.textContent.includes('Refuted target is no longer present in the runtime candidate list: candidate-stale-refute'), 'Expected stale refuted target submit failures to surface an operator-aligned reference message');
  assert(createSubmitButton.disabled === true, 'Expected stale refuted target submit failures to refresh operator safety and disable submit');
}

async function main() {
  const tempEventDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-mec-ui-events-'));
  const tempCandidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-mec-ui-candidates-'));
  const tempMecReviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicos-mec-ui-reviews-'));
  const port = 3346;
  const server = startServer(port, {
    eventOutputDir: tempEventDir,
    candidateOutputDir: tempCandidateDir,
    mecReviewOutputDir: tempMecReviewDir
  });

  try {
    await new Promise(resolve => setTimeout(resolve, 300));

    const page = await request('GET', `http://127.0.0.1:${port}/`);
    assert(page.statusCode === 200, 'Expected MEC operator page to return 200');
    assert(page.text.includes('MEC Review Desk'), 'Expected UI page title');
    assert(page.text.includes('Review Desk Detail'), 'Expected review desk detail section');
    assert(page.text.includes('Desk context'), 'Expected desk context section');
    assert(page.text.includes('Derived review state'), 'Expected derived review state section');
    assert(page.text.includes('Why this state'), 'Expected why-this-state section');
    assert(page.text.includes('Evidence / lineage context'), 'Expected evidence and lineage section');
    assert(page.text.includes('Review history context'), 'Expected review history section');
    assert(page.text.includes('Related candidate context'), 'Expected related candidate context section');
    assert(page.text.includes('Focus context'), 'Expected focus context section');
    assert(page.text.includes('Compare context'), 'Expected compare context section');
    assert(page.text.includes('Delta / change context'), 'Expected delta context section');
    assert(page.text.includes('Raw review records'), 'Expected raw review record section');
    assert(page.text.includes('Raw candidate artifact'), 'Expected raw candidate artifact section');
    assert(page.text.includes('Pair relationship'), 'Expected pair relationship detail block');
    assert(page.text.includes('Paired reading, not forced merging'), 'Expected paired reading framing in detail view');
    assert(page.text.includes('One linked case, two separately stored runtime objects'), 'Expected paired runtime object framing in pair view');
    assert(page.text.includes('One working desk over the canonical MEC review workspace'), 'Expected review desk framing in list copy');
    assert(page.text.includes('visible segments and queue flow'), 'Expected desk queue framing in list copy');
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
    assert(page.text.includes('Use as linked target'), 'Expected candidate detail carryover into linked target field');
    assert(page.text.includes('Use as refuted target'), 'Expected candidate detail carryover into refuted target field');
    assert(page.text.includes('freshness'), 'Expected freshness signal visibility in UI');
    assert(page.text.includes('Review actions'), 'Expected review action section in UI');
    assert(page.text.includes('Actions stay inside the desk'), 'Expected review desk action framing in UI');
    assert(page.text.includes('signal-based explanation of why this workspace item is reviewable, terminal or blocked'), 'Expected explicit explanation-layer framing in UI');
    assert(page.text.includes('Readable condensation of existing linkage, reference availability and integrity signals'), 'Expected evidence-layer framing in UI');
    assert(page.text.includes('Compressed reading over raw review records'), 'Expected history-compression framing in UI');
    assert(page.text.includes('Neighboring candidates derived from existing linkage and shared-source signals only'), 'Expected related-candidate framing in UI');
    assert(page.text.includes('Signal-based focus framing that condenses real review tension'), 'Expected focus framing in UI');
    assert(page.text.includes('Quick-compare surface over existing linkage, source overlap, review-state and history signals'), 'Expected compare framing in UI');
    assert(page.text.includes('Signal-based change awareness over review anchors, visible runtime movement and why-now / why-not-now readability'), 'Expected delta/change-awareness framing in UI');
    assert(page.text.includes('all review states'), 'Expected review-state filter in UI');
    assert(page.text.includes('sort: review state'), 'Expected review-state sort option in UI');
    assert(page.text.includes('stabilize'), 'Expected stabilize action label in UI');
    assert(page.text.includes('reject'), 'Expected reject action label in UI');
    assert(page.text.includes('raw candidate artifact, derived workspace state, and raw runtime review records'), 'Expected explicit three-layer desk boundary in UI');

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

    const boundaryResponse = await request('POST', `http://127.0.0.1:${port}/arena/mec-candidates`, {
      candidate_type: 'boundary_candidate',
      principle: 'Stable local UI smoke boundary',
      mechanism: 'Boundary path remains readable and target-linked in the operator shell',
      linked_candidate_id: candidateResponse.json.candidate.id,
      source_event_ids: [eventResponse.json.event.id],
      fails_when: ['linked invariant no longer matches observed boundary'],
      edge_cases: ['single runtime trace'],
      severity: 'medium',
      distillation_mode: 'manual'
    });
    assert(boundaryResponse.statusCode === 201, 'Expected boundary candidate creation to return 201');
    assert(boundaryResponse.json && boundaryResponse.json.candidate && boundaryResponse.json.candidate.id, 'Expected created boundary candidate id');
    assert(boundaryResponse.json.candidate.linked_candidate_id === candidateResponse.json.candidate.id, 'Expected boundary create response to preserve linked_candidate_id');

    const counterexampleResponse = await request('POST', `http://127.0.0.1:${port}/arena/mec-candidates`, {
      candidate_type: 'counterexample_candidate',
      principle: 'Stable local UI smoke counterexample',
      mechanism: 'Counterexample path remains target-specific in the operator shell',
      refutes_candidate_id: candidateResponse.json.candidate.id,
      case_description: 'Clean reproduction still fails after the supposed fix path.',
      resolution: 'Keep the invariant local and attach the counterexample.',
      impact_on_candidate: 'narrows_scope',
      source_event_ids: [eventResponse.json.event.id],
      distillation_mode: 'manual'
    });
    assert(counterexampleResponse.statusCode === 201, 'Expected counterexample candidate creation to return 201');
    assert(counterexampleResponse.json && counterexampleResponse.json.candidate && counterexampleResponse.json.candidate.id, 'Expected created counterexample candidate id');
    assert(counterexampleResponse.json.candidate.refutes_candidate_id === candidateResponse.json.candidate.id, 'Expected counterexample create response to preserve refutes_candidate_id');

    const curiosityResponse = await request('POST', `http://127.0.0.1:${port}/arena/mec-candidates`, {
      candidate_type: 'curiosity_candidate',
      principle: 'Stable local UI smoke curiosity',
      mechanism: 'Curiosity path remains readable without new semantics in the operator shell',
      open_question: 'Where does the current phase-2 transfer boundary stop holding?',
      domain: 'mec_ui_phase2',
      blind_spot_score: 0.6,
      source_event_ids: [eventResponse.json.event.id],
      distillation_mode: 'manual'
    });
    assert(curiosityResponse.statusCode === 201, 'Expected curiosity candidate creation to return 201');
    assert(curiosityResponse.json && curiosityResponse.json.candidate && curiosityResponse.json.candidate.id, 'Expected created curiosity candidate id');
    assert(curiosityResponse.json.candidate.open_question === 'Where does the current phase-2 transfer boundary stop holding?', 'Expected curiosity create response to preserve open_question');

    const listResponse = await request('GET', `http://127.0.0.1:${port}/arena/mec-review-workspace`);
    assert(listResponse.statusCode === 200, 'Expected workspace list to return 200');
    assert(listResponse.json && Array.isArray(listResponse.json.items) && listResponse.json.items.length === 5, 'Expected invariant, linked boundary, explicit boundary, counterexample, and curiosity in list');
    assert(listResponse.json.items.every(item => item.freshness_state === 'fresh'), 'Expected candidate list freshness_state values to be fresh');
    assert(listResponse.json.items.some(item => item.id === boundaryResponse.json.candidate.id && item.linked_candidate_id === candidateResponse.json.candidate.id), 'Expected candidate list to expose explicit boundary linkage');
    assert(listResponse.json.items.some(item => item.id === counterexampleResponse.json.candidate.id && item.refutes_candidate_id === candidateResponse.json.candidate.id && item.case_description), 'Expected candidate list to expose counterexample refuted target and case description');
    assert(listResponse.json.items.some(item => item.id === curiosityResponse.json.candidate.id && item.domain === 'mec_ui_phase2' && item.open_question), 'Expected candidate list to expose curiosity domain and open question');
    assert(listResponse.json.items.every(item => item.workspace_kind === 'mec_review_workspace'), 'Expected workspace list items to declare the canonical workspace kind');

    const detailResponse = await request('GET', `http://127.0.0.1:${port}/arena/mec-review-workspace/${candidateResponse.json.candidate.id}`);
    assert(detailResponse.statusCode === 200, 'Expected workspace detail to return 200');
    assert(detailResponse.json && detailResponse.json.linked_boundary_candidate_id === candidateResponse.json.linked_boundary_candidate.id, 'Expected detail to preserve linked boundary id');
    assert(detailResponse.json && detailResponse.json.freshness_state === 'fresh', 'Expected candidate detail freshness_state to be fresh');
    assert(detailResponse.json && detailResponse.json.raw_candidate_artifact && detailResponse.json.raw_candidate_artifact.status === 'proposal_only', 'Expected workspace detail to preserve the raw proposal-origin artifact separately');

    const reviewCreateResponse = await request('POST', `http://127.0.0.1:${port}/arena/mec-candidates/${candidateResponse.json.candidate.id}/reviews`, {
      review_outcome: 'stabilize',
      review_rationale: 'UI smoke read-first runtime stabilization.',
      review_source: 'mec_ui_smoke',
      reviewer_mode: 'human'
    });
    assert(reviewCreateResponse.statusCode === 201, 'Expected MEC review creation to return 201');
    assert(reviewCreateResponse.json && reviewCreateResponse.json.reviewRecord && reviewCreateResponse.json.reviewRecord.review_outcome === 'stabilize', 'Expected created MEC review outcome to be stabilize');

    const reviewedListResponse = await request('GET', `http://127.0.0.1:${port}/arena/mec-review-workspace`);
    assert(reviewedListResponse.statusCode === 200, 'Expected reviewed workspace list to return 200');
    assert(reviewedListResponse.json.items.some(item => item.id === candidateResponse.json.candidate.id && item.current_review_state === 'stabilize'), 'Expected candidate list to expose derived stabilize review state');

    const reviewedDetailResponse = await request('GET', `http://127.0.0.1:${port}/arena/mec-review-workspace/${candidateResponse.json.candidate.id}`);
    assert(reviewedDetailResponse.statusCode === 200, 'Expected reviewed workspace detail to return 200');
    assert(reviewedDetailResponse.json && reviewedDetailResponse.json.status === 'proposal_only', 'Expected raw candidate status to remain proposal_only after review');
    assert(reviewedDetailResponse.json && reviewedDetailResponse.json.current_review_state === 'stabilize', 'Expected candidate detail to expose derived stabilize review state');
    assert(reviewedDetailResponse.json && reviewedDetailResponse.json.review_summary && reviewedDetailResponse.json.review_summary.review_count === 1, 'Expected candidate detail to expose review record count');
    assert(reviewedDetailResponse.json && reviewedDetailResponse.json.raw_candidate_artifact && reviewedDetailResponse.json.raw_candidate_artifact.status === 'proposal_only', 'Expected reviewed workspace detail to keep raw candidate artifact proposal-origin');

    const boundaryDetailResponse = await request('GET', `http://127.0.0.1:${port}/arena/mec-review-workspace/${boundaryResponse.json.candidate.id}`);
    assert(boundaryDetailResponse.statusCode === 200, 'Expected boundary workspace detail to return 200');
    assert(boundaryDetailResponse.json && boundaryDetailResponse.json.linked_candidate_id === candidateResponse.json.candidate.id, 'Expected boundary detail to preserve linked_candidate_id');
    assert(boundaryDetailResponse.json && Array.isArray(boundaryDetailResponse.json.fails_when) && boundaryDetailResponse.json.fails_when.length === 1, 'Expected boundary detail to preserve fails_when');

    const counterexampleDetailResponse = await request('GET', `http://127.0.0.1:${port}/arena/mec-review-workspace/${counterexampleResponse.json.candidate.id}`);
    assert(counterexampleDetailResponse.statusCode === 200, 'Expected counterexample workspace detail to return 200');
    assert(counterexampleDetailResponse.json && counterexampleDetailResponse.json.refutes_candidate_id === candidateResponse.json.candidate.id, 'Expected counterexample detail to preserve refutes_candidate_id');
    assert(counterexampleDetailResponse.json && counterexampleDetailResponse.json.case_description === 'Clean reproduction still fails after the supposed fix path.', 'Expected counterexample detail to preserve case_description');

    const curiosityDetailResponse = await request('GET', `http://127.0.0.1:${port}/arena/mec-review-workspace/${curiosityResponse.json.candidate.id}`);
    assert(curiosityDetailResponse.statusCode === 200, 'Expected curiosity workspace detail to return 200');
    assert(curiosityDetailResponse.json && curiosityDetailResponse.json.domain === 'mec_ui_phase2', 'Expected curiosity detail to preserve domain');
    assert(curiosityDetailResponse.json && curiosityDetailResponse.json.open_question === 'Where does the current phase-2 transfer boundary stop holding?', 'Expected curiosity detail to preserve open_question');
    assert(curiosityDetailResponse.json && curiosityDetailResponse.json.candidate_boundary.auto_resolve === false, 'Expected curiosity detail to preserve no-auto-resolve boundary');

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
