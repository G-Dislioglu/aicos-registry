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
    'detail-decision',
    'detail-contradiction',
    'detail-challenge',
    'challenge-message',
    'detail-refutation',
    'detail-challenge-dossier',
    'detail-challenge-dossier-delta',
    'detail-challenge-dossier-digest',
    'detail-review-gate-signals',
    'detail-trace',
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

  function buildHarnessContradictionContext(reviewSummary, unresolvedRuntimeReferences, evidenceContext, reviewHistoryContext, focusContext, compareContext, deltaContext) {
    const reviewable = Boolean(reviewSummary && reviewSummary.reviewable);
    const terminal = Boolean(reviewSummary && reviewSummary.terminal);
    const unresolvedCount = unresolvedRuntimeReferences.length;
    const totalReferenceCount = Number(evidenceContext && evidenceContext.total_reference_count || 0);
    const totalReviewCount = Number(reviewHistoryContext && reviewHistoryContext.total_review_count || 0);
    const compareReady = Boolean(compareContext && compareContext.compare_ready);
    const contradictionSignals = [];
    if (reviewable && unresolvedCount > 0) {
      contradictionSignals.push('Review remains open while unresolved runtime references are still visible.');
    }
    if (reviewable && evidenceContext && evidenceContext.integrity_state === 'degraded') {
      contradictionSignals.push('The workspace stays reviewable even though evidence integrity is currently degraded.');
    }
    if (terminal && deltaContext && deltaContext.changed_since_anchor) {
      contradictionSignals.push('The raw candidate artifact changed after a terminal review anchor.');
    }
    if (compareReady && unresolvedCount > 0) {
      contradictionSignals.push('Comparable neighboring context is visible, but reference gaps still weaken the current read.');
    }
    if (totalReviewCount > 0 && totalReferenceCount < 1) {
      contradictionSignals.push('Review history is present, but only minimal current linkage evidence is visible.');
    }
    if (deltaContext && deltaContext.review_attention_now && deltaContext.changed_since_anchor === false && unresolvedCount > 0) {
      contradictionSignals.push('No newer post-anchor artifact change is visible, yet unresolved runtime references still keep the item attention-bearing.');
    }
    if (focusContext && focusContext.focus_bucket === 'recent_terminal_decision' && reviewable) {
      contradictionSignals.push('Terminal-looking decision history is visible while the current control readiness still reads as reviewable.');
    }
    return {
      contradiction_present: contradictionSignals.length > 0,
      contradiction_signals: contradictionSignals,
      contradiction_summary: contradictionSignals.length > 0
        ? `The current workspace view contains ${contradictionSignals.length} visible contradiction signal(s) that should be read before deciding.`
        : 'No stronger contradiction signal is currently visible in the canonical workspace view.'
    };
  }

  function buildHarnessDecisionPacketContext(rawCandidate, reviewSummary, latestReview, unresolvedRuntimeReferences, evidenceContext, reviewHistoryContext, relatedCandidates, stateExplanation, focusContext, compareContext, deltaContext, contradictionContext) {
    const supportSignals = [];
    const frictionSignals = [];
    const missingSignals = [];
    const unresolvedCount = unresolvedRuntimeReferences.length;
    const totalReferenceCount = Number(evidenceContext && evidenceContext.total_reference_count || 0);
    const totalReviewCount = Number(reviewHistoryContext && reviewHistoryContext.total_review_count || 0);
    const compareReady = Boolean(compareContext && compareContext.compare_ready);
    const contradictionCount = Number(contradictionContext && Array.isArray(contradictionContext.contradiction_signals) ? contradictionContext.contradiction_signals.length : 0);
    const integrityState = evidenceContext && evidenceContext.integrity_state ? evidenceContext.integrity_state : 'minimal';
    const terminal = Boolean(reviewSummary && reviewSummary.terminal);

    if (integrityState === 'intact') {
      supportSignals.push('Visible linkage and evidence currently resolve without runtime gaps.');
    }
    if (totalReviewCount > 0 && latestReview) {
      supportSignals.push(`A visible review anchor already exists through ${totalReviewCount} raw review record(s).`);
    }
    if (compareReady) {
      supportSignals.push('Comparable neighboring workspace context is available for cross-reading.');
    }
    if (deltaContext && deltaContext.stable_since_anchor) {
      supportSignals.push('The visible workspace view appears stable since the latest decision anchor.');
    }
    if (evidenceContext && evidenceContext.pair_integrity === 'resolved') {
      supportSignals.push('The linked pair counterpart is visibly resolved in the current workspace.');
    }

    if (unresolvedCount > 0) {
      frictionSignals.push(`${unresolvedCount} unresolved runtime reference(s) still press against a clean decision read.`);
    }
    if (integrityState === 'degraded') {
      frictionSignals.push('Evidence integrity is degraded in the current workspace view.');
    }
    if (deltaContext && deltaContext.review_attention_now) {
      frictionSignals.push('Visible change signals indicate that the current read still needs renewed attention now.');
    }
    if (contradictionCount > 0) {
      frictionSignals.push(`${contradictionCount} contradiction signal(s) remain visible in the current workspace view.`);
    }
    if (terminal) {
      frictionSignals.push(`The current derived review state is already terminal at ${reviewSummary && reviewSummary.current_state ? reviewSummary.current_state : 'proposal_only'}.`);
    }

    if (totalReferenceCount < 1) {
      missingSignals.push('Only minimal visible linkage evidence is available right now.');
    }
    if (totalReviewCount < 1) {
      missingSignals.push('No visible review history anchor exists yet.');
    }
    if (stateExplanation && Array.isArray(stateExplanation.missing_visible_prerequisites)) {
      for (const prerequisite of stateExplanation.missing_visible_prerequisites) {
        missingSignals.push(`Missing visible prerequisite: ${prerequisite}`);
      }
    }
    if (!compareReady && Array.isArray(relatedCandidates) && relatedCandidates.length < 1) {
      missingSignals.push('No stronger compare or related-candidate context is currently visible.');
    }

    let decisionReadiness = 'decision_underconstrained';
    if (terminal) {
      decisionReadiness = 'decision_closed';
    } else if (unresolvedCount > 0 || contradictionCount > 0) {
      decisionReadiness = 'decision_fragile';
    } else if (totalReferenceCount > 0 && totalReviewCount > 0) {
      decisionReadiness = 'decision_ready';
    }

    const decisionSummary = decisionReadiness === 'decision_ready'
      ? 'The current workspace view looks decision-ready because visible evidence, history and linkage are present without stronger contradiction pressure.'
      : decisionReadiness === 'decision_fragile'
        ? 'The current workspace view is decision-fragile because visible friction or contradiction signals still qualify the read.'
        : decisionReadiness === 'decision_closed'
          ? 'The current workspace view is decision-closed because a terminal review state is already visible.'
          : 'The current workspace view is still underconstrained because visible decision support remains too thin.';

    return {
      decision_readiness: decisionReadiness,
      support_signals: supportSignals,
      friction_signals: frictionSignals,
      missing_signals: missingSignals,
      contradiction_count: contradictionCount,
      decision_summary: decisionSummary,
      stabilization_readable: supportSignals.length > 0,
      rejection_pressure_visible: frictionSignals.length > 0,
      open_gap_count: missingSignals.length
    };
  }

  function buildHarnessReviewTraceContext(rawCandidate, latestReview, decisionPacketContext, contradictionContext, deltaContext) {
    const rationaleSnapshot = latestReview && latestReview.rationale_snapshot && typeof latestReview.rationale_snapshot === 'object'
      ? latestReview.rationale_snapshot
      : null;
    if (!latestReview) {
      return {
        trace_present: false,
        trace_summary: 'No review action has been written yet, so no action rationale trace is available.',
        latest_action_outcome: null,
        latest_action_at: null,
        decision_readiness_at_write: null,
        support_at_write: [],
        friction_at_write: [],
        missing_at_write: [],
        contradiction_at_write: [],
        why_now_at_write: null,
        why_not_now_at_write: null,
        delta_movement_bucket_at_write: null
      };
    }
    return {
      trace_present: true,
      trace_summary: `Latest review write recorded ${latestReview.review_outcome || 'unknown'} from a ${(rationaleSnapshot && rationaleSnapshot.decision_readiness) || (decisionPacketContext && decisionPacketContext.decision_readiness) || 'trace-unspecified'} desk read.`,
      latest_action_outcome: latestReview.review_outcome || null,
      latest_action_at: latestReview.reviewed_at || null,
      decision_readiness_at_write: (rationaleSnapshot && rationaleSnapshot.decision_readiness) || (decisionPacketContext && decisionPacketContext.decision_readiness) || null,
      support_at_write: rationaleSnapshot && Array.isArray(rationaleSnapshot.support_signals)
        ? rationaleSnapshot.support_signals
        : (decisionPacketContext && Array.isArray(decisionPacketContext.support_signals) ? decisionPacketContext.support_signals.slice(0, 4) : []),
      friction_at_write: rationaleSnapshot && Array.isArray(rationaleSnapshot.friction_signals)
        ? rationaleSnapshot.friction_signals
        : (decisionPacketContext && Array.isArray(decisionPacketContext.friction_signals) ? decisionPacketContext.friction_signals.slice(0, 4) : []),
      missing_at_write: rationaleSnapshot && Array.isArray(rationaleSnapshot.missing_signals)
        ? rationaleSnapshot.missing_signals
        : (decisionPacketContext && Array.isArray(decisionPacketContext.missing_signals) ? decisionPacketContext.missing_signals.slice(0, 4) : []),
      contradiction_at_write: rationaleSnapshot && Array.isArray(rationaleSnapshot.contradiction_signals)
        ? rationaleSnapshot.contradiction_signals
        : (contradictionContext && Array.isArray(contradictionContext.contradiction_signals) ? contradictionContext.contradiction_signals.slice(0, 4) : []),
      why_now_at_write: rationaleSnapshot ? rationaleSnapshot.why_now || null : (deltaContext ? deltaContext.why_now || null : null),
      why_not_now_at_write: rationaleSnapshot ? rationaleSnapshot.why_not_now || null : (deltaContext ? deltaContext.why_not_now || null : null),
      delta_movement_bucket_at_write: rationaleSnapshot ? rationaleSnapshot.delta_movement_bucket || null : (deltaContext ? deltaContext.movement_bucket || null : null)
    };
  }

  function buildHarnessChallengeContext(rawCandidate, latestReview, evidenceContext, reviewHistoryContext, relatedCandidates, deltaContext, contradictionContext, decisionPacketContext, reviewTraceContext) {
    const existingCounterexamples = candidateList
      .filter(item => item.id !== rawCandidate.id)
      .filter(item => item.candidate_type === 'counterexample_candidate' && item.refutes_candidate_id === rawCandidate.id)
      .map(item => ({
        candidate_id: item.id,
        title: item.principle || item.case_description || item.id,
        status: item.status || 'proposal_only',
        created_at: item.created_at || null,
        updated_at: item.updated_at || null
      }));
    const contradictionSignals = Array.isArray(contradictionContext && contradictionContext.contradiction_signals)
      ? contradictionContext.contradiction_signals
      : [];
    const challengeable = rawCandidate.candidate_type === 'invariant_candidate';
    const challengeSignals = [];
    const stabilizingSignals = [];
    const challengeFlags = [];
    if (contradictionSignals.length > 0) {
      challengeSignals.push('Visible contradiction signals already press against a clean current read.');
      challengeFlags.push('contradiction_visible_now');
    }
    if (evidenceContext && evidenceContext.integrity_state === 'degraded') {
      challengeSignals.push('Current evidence integrity is degraded, so challenge pressure remains readable.');
      challengeFlags.push('reference_gap_visible');
    }
    if (existingCounterexamples.length > 0) {
      challengeSignals.push(`${existingCounterexamples.length} existing counterexample candidate(s) already refute this primary candidate.`);
      challengeFlags.push('counterexample_history_present');
    }
    if (deltaContext && deltaContext.review_attention_now) {
      challengeSignals.push('Current delta context still marks the item as attention-bearing now.');
      challengeFlags.push('delta_attention_visible');
    }
    if (decisionPacketContext && Array.isArray(decisionPacketContext.missing_signals) && decisionPacketContext.missing_signals.length > 0) {
      challengeSignals.push('Decision packet still exposes missing or open gaps around this candidate.');
      challengeFlags.push('decision_gaps_visible');
    }
    if (reviewTraceContext && reviewTraceContext.trace_present && reviewTraceContext.decision_readiness_at_write === 'decision_fragile') {
      challengeSignals.push('The latest visible review write was recorded from a decision-fragile read.');
      challengeFlags.push('fragile_write_anchor');
    }
    if (evidenceContext && evidenceContext.pair_integrity === 'resolved') {
      stabilizingSignals.push('A paired boundary candidate is visibly resolved in the current workspace.');
    }
    if (evidenceContext && evidenceContext.integrity_state === 'intact') {
      stabilizingSignals.push('Current visible linkage and evidence integrity read as intact.');
    }
    if (existingCounterexamples.length < 1) {
      stabilizingSignals.push('No stored counterexample currently refutes this primary candidate.');
    }
    if (latestReview && latestReview.review_outcome === 'stabilize' && contradictionSignals.length < 1 && !(deltaContext && deltaContext.review_attention_now)) {
      stabilizingSignals.push('The latest visible review stabilized the candidate and no stronger current contradiction signal is visible now.');
    }
    const contradictionPressureBucket = !challengeable
      ? 'not_applicable'
      : challengeSignals.length >= 4
        ? 'high_visible_pressure'
        : challengeSignals.length >= 2
          ? 'moderate_visible_pressure'
          : 'low_visible_pressure';
    const blockers = challengeable ? [] : [`Phase 4A manual challenge is locked to visible invariant candidates only, not ${rawCandidate.candidate_type || 'unknown'} objects.`];
    return {
      challenge_present: challengeable,
      challenge_summary: !challengeable
        ? 'This workspace item is outside the locked Phase 4A single-candidate manual challenge slice.'
        : contradictionPressureBucket === 'high_visible_pressure'
          ? 'Current workspace signals show high visible contradiction pressure, so an explicit manual counterexample proposal is readable now.'
          : contradictionPressureBucket === 'moderate_visible_pressure'
            ? 'Current workspace signals show moderate visible contradiction pressure, so a manual counterexample proposal is plausible without becoming automatic.'
            : 'Current workspace signals show only low visible contradiction pressure, so challenge remains available but lightly grounded.',
      contradiction_pressure_bucket: contradictionPressureBucket,
      challenge_signals: challengeSignals,
      stabilizing_signals: stabilizingSignals,
      challenge_flags: challengeFlags,
      existing_counterexample_count: existingCounterexamples.length,
      existing_counterexamples: existingCounterexamples,
      boundary_candidate_id: evidenceContext && evidenceContext.pair_counterpart_id ? evidenceContext.pair_counterpart_id : null,
      boundary_integrity: evidenceContext && evidenceContext.pair_integrity ? evidenceContext.pair_integrity : 'not_applicable',
      latest_review_outcome: latestReview ? latestReview.review_outcome || null : null,
      latest_review_trace_present: Boolean(reviewTraceContext && reviewTraceContext.trace_present),
      review_history_count: Number(reviewHistoryContext && reviewHistoryContext.total_review_count || 0),
      manual_counterexample_allowed: blockers.length < 1,
      manual_counterexample_blockers: blockers,
      selected_primary_candidate_id: rawCandidate.id,
      selected_primary_candidate_type: rawCandidate.candidate_type || null,
      challenge_surface_version: 'phase4a-mec-challenge-context/v1'
    };
  }

  function buildHarnessRefutationContext(rawCandidate, reviewSummary, latestReview, unresolvedRuntimeReferences, decisionPacketContext, challengeContext, reviewTraceContext) {
    const candidateId = rawCandidate && rawCandidate.id ? rawCandidate.id : null;
    const candidateType = rawCandidate && rawCandidate.candidate_type ? rawCandidate.candidate_type : null;
    const refutesCandidateId = rawCandidate && rawCandidate.refutes_candidate_id ? rawCandidate.refutes_candidate_id : null;
    const visibleCounterexamples = candidateList
      .filter(item => item.candidate_type === 'counterexample_candidate')
      .filter(item => {
        const targetId = item.refutes_candidate_id || null;
        return targetId === candidateId || targetId === refutesCandidateId;
      })
      .map(item => ({
        candidate_id: item.id,
        title: item.principle || item.case_description || item.id,
        status: item.status || 'proposal_only',
        current_review_state: item.current_review_state || 'proposal_only',
        reviewable: Boolean(item.review_summary ? item.review_summary.reviewable : true),
        terminal: Boolean(item.review_summary ? item.review_summary.terminal : false),
        contradiction_pressure_bucket: item.challenge_basis && item.challenge_basis.contradiction_pressure_bucket
          ? item.challenge_basis.contradiction_pressure_bucket
          : null,
        challenge_summary: item.challenge_basis && item.challenge_basis.challenge_summary
          ? item.challenge_basis.challenge_summary
          : null,
        created_at: item.created_at || null,
        updated_at: item.updated_at || null
      }));
    const primaryCandidate = candidateType === 'counterexample_candidate'
      ? (candidateList.find(item => item.id === refutesCandidateId) || null)
      : rawCandidate;
    const primaryReviewSummary = primaryCandidate && primaryCandidate.id === candidateId
      ? reviewSummary
      : (primaryCandidate && primaryCandidate.review_summary ? primaryCandidate.review_summary : null);
    const challengeBasis = rawCandidate && rawCandidate.challenge_basis && typeof rawCandidate.challenge_basis === 'object'
      ? rawCandidate.challenge_basis
      : null;
    const siblingCounterexamples = candidateType === 'counterexample_candidate'
      ? visibleCounterexamples.filter(item => item.candidate_id !== candidateId)
      : visibleCounterexamples;
    const supportSignals = [];
    const qualifyingSignals = [];
    const openQualifiers = [];
    if (candidateType === 'counterexample_candidate' && refutesCandidateId) {
      supportSignals.push(`This proposal-only counterexample explicitly refutes visible primary candidate ${refutesCandidateId}.`);
    }
    if (candidateType === 'counterexample_candidate' && challengeBasis && challengeBasis.challenge_summary) {
      supportSignals.push(challengeBasis.challenge_summary);
    }
    if (candidateType !== 'counterexample_candidate' && visibleCounterexamples.length > 0) {
      supportSignals.push(`${visibleCounterexamples.length} proposal-only counterexample candidate(s) already refute this primary candidate in the visible workspace.`);
    }
    if (primaryReviewSummary && primaryReviewSummary.current_state) {
      qualifyingSignals.push(`Primary candidate currently reads as ${primaryReviewSummary.current_state} in the canonical workspace.`);
    }
    if (challengeBasis && Array.isArray(challengeBasis.stabilizing_signals)) {
      qualifyingSignals.push(...challengeBasis.stabilizing_signals.slice(0, 3));
    }
    if (challengeContext && Array.isArray(challengeContext.stabilizing_signals)) {
      qualifyingSignals.push(...challengeContext.stabilizing_signals.slice(0, 3));
    }
    if (Array.isArray(unresolvedRuntimeReferences) && unresolvedRuntimeReferences.length > 0) {
      openQualifiers.push(...unresolvedRuntimeReferences.map(item => item.label).slice(0, 4));
    }
    if (candidateType === 'counterexample_candidate' && !primaryCandidate) {
      openQualifiers.push('The refuted primary candidate is not visible in the current runtime candidate set.');
    }
    if (decisionPacketContext && Array.isArray(decisionPacketContext.missing_signals)) {
      openQualifiers.push(...decisionPacketContext.missing_signals.slice(0, 2));
    }
    if (reviewTraceContext && reviewTraceContext.trace_present && candidateType === 'counterexample_candidate') {
      qualifyingSignals.push('A review trace is already visible in the canonical workspace for this counterexample or its current desk read.');
    }
    if (candidateType === 'counterexample_candidate') {
      return {
        refutation_present: true,
        refutation_role: 'counterexample_candidate',
        refutation_summary: primaryCandidate
          ? 'This proposal-only counterexample is canonically readable as a visible refutation object against the currently visible primary candidate.'
          : 'This proposal-only counterexample remains readable as a refutation object, but its refuted primary candidate is not currently visible in runtime.',
        relation_summary: primaryCandidate
          ? `Refutes primary candidate ${refutesCandidateId} while keeping the refutation read separate from any review write.`
          : `Refutes primary candidate ${refutesCandidateId || 'unknown'}, but the primary candidate is not currently visible in runtime.`,
        primary_candidate_id: refutesCandidateId,
        primary_candidate_title: primaryCandidate ? (primaryCandidate.principle || primaryCandidate.case_description || primaryCandidate.open_question || primaryCandidate.id) : null,
        primary_candidate_current_review_state: primaryReviewSummary ? primaryReviewSummary.current_state : null,
        primary_candidate_reviewable: primaryReviewSummary ? Boolean(primaryReviewSummary.reviewable) : false,
        primary_candidate_terminal: primaryReviewSummary ? Boolean(primaryReviewSummary.terminal) : false,
        latest_primary_review_outcome: primaryReviewSummary ? primaryReviewSummary.current_state || null : null,
        visible_sibling_counterexample_count: siblingCounterexamples.length,
        visible_sibling_counterexamples: siblingCounterexamples.slice(0, 4),
        challenge_basis_summary: challengeBasis && challengeBasis.challenge_summary ? challengeBasis.challenge_summary : (rawCandidate && rawCandidate.mechanism ? rawCandidate.mechanism : null),
        challenge_basis_bucket: challengeBasis && challengeBasis.contradiction_pressure_bucket ? challengeBasis.contradiction_pressure_bucket : null,
        challenge_basis_flags: Array.isArray(challengeBasis && challengeBasis.challenge_flags) ? challengeBasis.challenge_flags.slice(0, 6) : [],
        support_signals: Array.from(new Set(supportSignals)).slice(0, 5),
        qualifying_signals: Array.from(new Set(qualifyingSignals)).slice(0, 5),
        open_qualifiers: Array.from(new Set(openQualifiers)).slice(0, 5),
        refutation_surface_version: 'phase4b-mec-refutation-context/v1'
      };
    }
    if (visibleCounterexamples.length > 0) {
      return {
        refutation_present: true,
        refutation_role: 'refuted_primary_candidate',
        refutation_summary: `${visibleCounterexamples.length} visible proposal-only counterexample candidate(s) currently refute this primary candidate in the canonical workspace.`,
        relation_summary: 'The canonical workspace now keeps the visible refutation posture readable without introducing a new write path or recommendation layer.',
        primary_candidate_id: candidateId,
        primary_candidate_title: rawCandidate.principle || rawCandidate.open_question || rawCandidate.case_description || rawCandidate.id,
        primary_candidate_current_review_state: reviewSummary ? reviewSummary.current_state : null,
        primary_candidate_reviewable: reviewSummary ? Boolean(reviewSummary.reviewable) : false,
        primary_candidate_terminal: reviewSummary ? Boolean(reviewSummary.terminal) : false,
        latest_primary_review_outcome: latestReview ? latestReview.review_outcome || null : null,
        visible_counterexample_count: visibleCounterexamples.length,
        visible_counterexamples: visibleCounterexamples.slice(0, 4),
        challenge_basis_summary: challengeContext && challengeContext.challenge_summary ? challengeContext.challenge_summary : null,
        challenge_basis_bucket: challengeContext && challengeContext.contradiction_pressure_bucket ? challengeContext.contradiction_pressure_bucket : null,
        challenge_basis_flags: Array.isArray(challengeContext && challengeContext.challenge_flags) ? challengeContext.challenge_flags.slice(0, 6) : [],
        support_signals: Array.from(new Set(supportSignals)).slice(0, 5),
        qualifying_signals: Array.from(new Set(qualifyingSignals)).slice(0, 5),
        open_qualifiers: Array.from(new Set(openQualifiers)).slice(0, 5),
        refutation_surface_version: 'phase4b-mec-refutation-context/v1'
      };
    }
    return {
      refutation_present: false,
      refutation_role: 'not_applicable',
      refutation_summary: 'No explicit refutation relation is currently visible for this workspace item.',
      relation_summary: 'No proposal-only counterexample relation is currently visible in the canonical workspace for this item.',
      primary_candidate_id: primaryCandidate ? primaryCandidate.id || null : null,
      primary_candidate_title: primaryCandidate ? (primaryCandidate.principle || primaryCandidate.case_description || primaryCandidate.open_question || primaryCandidate.id) : null,
      primary_candidate_current_review_state: primaryReviewSummary ? primaryReviewSummary.current_state : null,
      primary_candidate_reviewable: primaryReviewSummary ? Boolean(primaryReviewSummary.reviewable) : false,
      primary_candidate_terminal: primaryReviewSummary ? Boolean(primaryReviewSummary.terminal) : false,
      latest_primary_review_outcome: latestReview ? latestReview.review_outcome || null : null,
      visible_counterexample_count: 0,
      visible_counterexamples: [],
      challenge_basis_summary: null,
      challenge_basis_bucket: null,
      challenge_basis_flags: [],
      support_signals: [],
      qualifying_signals: [],
      open_qualifiers: Array.from(new Set(openQualifiers)).slice(0, 5),
      refutation_surface_version: 'phase4b-mec-refutation-context/v1'
    };
  }

  function buildHarnessChallengeDossierLineSignature(rawCandidate) {
    const challengeBasis = rawCandidate && rawCandidate.challenge_basis && typeof rawCandidate.challenge_basis === 'object'
      ? rawCandidate.challenge_basis
      : null;
    const bucket = challengeBasis && challengeBasis.contradiction_pressure_bucket
      ? challengeBasis.contradiction_pressure_bucket
      : 'not_visible';
    const flags = Array.isArray(challengeBasis && challengeBasis.challenge_flags)
      ? Array.from(new Set(challengeBasis.challenge_flags.map(item => String(item || '').trim()).filter(Boolean))).sort().join('|')
      : '';
    const summarySeed = String((challengeBasis && challengeBasis.challenge_summary) || rawCandidate.mechanism || rawCandidate.case_description || 'no_summary')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 8)
      .join('_') || 'no_summary';
    return `${bucket}::${flags || `summary:${summarySeed}`}`;
  }

  function buildHarnessChallengeDossierLineLabel(rawCandidate) {
    return rawCandidate && rawCandidate.challenge_basis && rawCandidate.challenge_basis.challenge_summary
      ? rawCandidate.challenge_basis.challenge_summary
      : (rawCandidate.case_description || rawCandidate.principle || rawCandidate.id || 'Visible challenge line');
  }

  function deriveHarnessChallengeDossierBucket(counterexampleCount, distinctLineCount, reinforcingLineCount, qualifiedLineCount, coverageGapCount, challengePresent) {
    if (counterexampleCount < 1) {
      return challengePresent ? 'pressure_without_counterexample_coverage' : 'no_visible_challenge_dossier';
    }
    if (distinctLineCount >= 2 && reinforcingLineCount >= 1) {
      return coverageGapCount > 0 || qualifiedLineCount > 0
        ? 'multi_line_reinforced_with_open_gaps'
        : 'multi_line_reinforced_coverage';
    }
    if (distinctLineCount >= 2) {
      return coverageGapCount > 0 || qualifiedLineCount > 0
        ? 'multi_line_mixed_with_open_gaps'
        : 'multi_line_mixed_coverage';
    }
    if (reinforcingLineCount >= 1) {
      return coverageGapCount > 0 || qualifiedLineCount > 0
        ? 'single_line_reinforced_with_open_gaps'
        : 'single_line_reinforced_coverage';
    }
    return coverageGapCount > 0 || qualifiedLineCount > 0
      ? 'single_line_qualified_coverage'
      : 'single_line_visible_coverage';
  }

  function buildHarnessChallengeDossierDeltaContext(rawCandidate, reviewSummary, latestReview, challengeDossierContext) {
    const latestReviewedAtRaw = latestReview && latestReview.reviewed_at ? latestReview.reviewed_at : null;
    const candidateCreatedAtRaw = rawCandidate && rawCandidate.created_at ? rawCandidate.created_at : null;
    const anchorKind = latestReviewedAtRaw ? 'last_review' : (candidateCreatedAtRaw ? 'candidate_created' : 'no_anchor');
    const dossierPresent = challengeDossierContext && challengeDossierContext.dossier_present;
    const currentPostureBucket = challengeDossierContext && challengeDossierContext.challenge_posture_bucket
      ? challengeDossierContext.challenge_posture_bucket
      : 'no_visible_challenge_dossier';
    if (!dossierPresent && currentPostureBucket !== 'pressure_without_counterexample_coverage') {
      return {
        delta_present: false,
        delta_role: 'not_applicable',
        delta_summary: 'No visible challenge dossier is currently present, so no delta or evolution is derivable for this workspace item.',
        anchor_kind: anchorKind,
        anchor_at: latestReviewedAtRaw || candidateCreatedAtRaw || null,
        movement_bucket: 'not_derivable',
        new_line_count: 0,
        stable_line_count: 0,
        updated_line_count: 0,
        qualified_open_line_count: 0,
        new_lines: [],
        stable_lines: [],
        updated_lines: [],
        qualified_open_lines: [],
        posture_changed: false,
        previous_posture_bucket: null,
        current_posture_bucket: currentPostureBucket,
        evolution_signals: [],
        challenge_dossier_delta_surface_version: 'phase4d-mec-challenge-dossier-delta-context/v1'
      };
    }
    const challengeLines = Array.isArray(challengeDossierContext && challengeDossierContext.challenge_lines)
      ? challengeDossierContext.challenge_lines
      : [];
    const stableLines = challengeLines.map(line => ({
      line_signature: line.line_signature,
      line_label: line.line_label,
      contribution_count: Number(line.contribution_count || 1),
      contribution_posture: line.contribution_posture || 'distinct_visible_line',
      open_qualifier_count: Number(line.open_qualifier_count || 0)
    }));
    const qualifiedOpenLines = stableLines.filter(line => line.open_qualifier_count > 0);
    const evolutionSignals = [];
    if (anchorKind === 'candidate_created') {
      evolutionSignals.push('No review anchor exists yet. Evolution signals are relative to candidate creation, not a review action.');
    }
    if (stableLines.length > 0) {
      evolutionSignals.push(`${stableLines.length} visible challenge line(s) have been stable since before the last visible anchor.`);
    }
    if (qualifiedOpenLines.length > 0) {
      evolutionSignals.push(`${qualifiedOpenLines.length} visible challenge line(s) remain qualified by open gaps regardless of timing.`);
    }
    const movementBucket = currentPostureBucket === 'pressure_without_counterexample_coverage'
      ? 'pressure_without_coverage'
      : stableLines.length > 0
        ? 'stabilizing'
        : 'unchanged';
    const deltaSummary = movementBucket === 'stabilizing'
      ? `The visible challenge dossier appears stable. All ${stableLines.length} visible challenge line(s) were already present before the last visible anchor.`
      : movementBucket === 'pressure_without_coverage'
        ? 'Challenge pressure is visible but no counterexample coverage is currently present in the canonical dossier.'
        : 'No visible change is currently detectable in the challenge dossier relative to the last anchor.';
    const candidateType = rawCandidate && rawCandidate.candidate_type ? rawCandidate.candidate_type : null;
    return {
      delta_present: stableLines.length > 0,
      delta_role: candidateType === 'counterexample_candidate' ? 'counterexample_contribution_delta' : 'primary_candidate_dossier_delta',
      delta_summary: deltaSummary,
      anchor_kind: anchorKind,
      anchor_at: latestReviewedAtRaw || candidateCreatedAtRaw || null,
      movement_bucket: movementBucket,
      new_line_count: 0,
      stable_line_count: stableLines.length,
      updated_line_count: 0,
      qualified_open_line_count: qualifiedOpenLines.length,
      new_lines: [],
      stable_lines: stableLines.slice(0, 4),
      updated_lines: [],
      qualified_open_lines: qualifiedOpenLines.slice(0, 4),
      posture_changed: false,
      previous_posture_bucket: currentPostureBucket,
      current_posture_bucket: currentPostureBucket,
      evolution_signals: evolutionSignals.slice(0, 6),
      challenge_dossier_delta_surface_version: 'phase4d-mec-challenge-dossier-delta-context/v1'
    };
  }

  function deriveHarnessChallengeDossierReviewDigestBucket(challengeDossierContext = null, challengeDossierDeltaContext = null, refutationContext = null, watchpointCount = 0) {
    const dossierPresent = Boolean(challengeDossierContext && challengeDossierContext.dossier_present);
    const dossierRole = challengeDossierContext && challengeDossierContext.dossier_role
      ? challengeDossierContext.dossier_role
      : 'not_applicable';
    const movementBucket = challengeDossierDeltaContext && challengeDossierDeltaContext.movement_bucket
      ? challengeDossierDeltaContext.movement_bucket
      : 'not_derivable';
    const refutationPresent = Boolean(refutationContext && refutationContext.refutation_present);
    if (!dossierPresent && !refutationPresent && watchpointCount < 1) {
      return 'not_applicable';
    }
    if (dossierRole === 'counterexample_contribution') {
      return watchpointCount > 0 ? 'counterexample_contribution_with_watchpoints' : 'counterexample_contribution_visible';
    }
    if (movementBucket === 'pressure_without_coverage') {
      return 'pressure_without_counterexample_coverage';
    }
    if (movementBucket === 'expanding') {
      return watchpointCount > 0 ? 'expanding_with_watchpoints' : 'expanding_visible_digest';
    }
    if (movementBucket === 'updated' || movementBucket === 'posture_shifted') {
      return watchpointCount > 0 ? 'changed_with_watchpoints' : 'changed_visible_digest';
    }
    if (watchpointCount > 0) {
      return dossierPresent ? 'coverage_with_watchpoints' : 'watchpoints_without_dossier';
    }
    if (movementBucket === 'stabilizing' || movementBucket === 'unchanged') {
      return 'stable_visible_digest';
    }
    return dossierPresent || refutationPresent ? 'visible_digest' : 'not_applicable';
  }

  function buildHarnessChallengeDossierReviewDigest(rawCandidate, reviewSummary, latestReview, unresolvedRuntimeReferences, contradictionContext, decisionPacketContext, challengeContext, refutationContext, challengeDossierContext, challengeDossierDeltaContext, reviewTraceContext) {
    const candidateType = rawCandidate && rawCandidate.candidate_type ? rawCandidate.candidate_type : null;
    const primaryCandidateId = candidateType === 'counterexample_candidate'
      ? ((refutationContext && refutationContext.primary_candidate_id) || (challengeDossierContext && challengeDossierContext.primary_candidate_id) || rawCandidate.refutes_candidate_id || null)
      : rawCandidate.id;
    const primaryCandidate = candidateList.find(item => item.id === primaryCandidateId) || null;
    const coverageGaps = Array.isArray(challengeDossierContext && challengeDossierContext.coverage_gaps)
      ? challengeDossierContext.coverage_gaps
      : [];
    const contradictionSignals = Array.isArray(contradictionContext && contradictionContext.contradiction_signals)
      ? contradictionContext.contradiction_signals
      : [];
    const decisionMissingSignals = Array.isArray(decisionPacketContext && decisionPacketContext.missing_signals)
      ? decisionPacketContext.missing_signals
      : [];
    const refutationOpenQualifiers = Array.isArray(refutationContext && refutationContext.open_qualifiers)
      ? refutationContext.open_qualifiers
      : [];
    const unresolvedLabels = Array.isArray(unresolvedRuntimeReferences)
      ? unresolvedRuntimeReferences.map(item => item.label).filter(Boolean)
      : [];
    const watchpoints = Array.from(new Set([
      ...coverageGaps,
      ...contradictionSignals,
      ...decisionMissingSignals,
      ...refutationOpenQualifiers,
      ...unresolvedLabels
    ])).slice(0, 6);
    const chronology = [];
    if (latestReview && latestReview.reviewed_at) {
      chronology.push({
        kind: 'review_anchor',
        label: `Latest review anchor ${latestReview.review_outcome || 'written'}`,
        detail: `Latest review source ${latestReview.review_source || 'not_visible'}`
      });
    }
    const newLines = Array.isArray(challengeDossierDeltaContext && challengeDossierDeltaContext.new_lines) ? challengeDossierDeltaContext.new_lines : [];
    const updatedLines = Array.isArray(challengeDossierDeltaContext && challengeDossierDeltaContext.updated_lines) ? challengeDossierDeltaContext.updated_lines : [];
    const stableLines = Array.isArray(challengeDossierDeltaContext && challengeDossierDeltaContext.stable_lines) ? challengeDossierDeltaContext.stable_lines : [];
    newLines.slice(0, 2).forEach(line => chronology.push({
      kind: 'new_challenge_line',
      label: line.line_label || line.line_signature || 'visible challenge line',
      detail: `New visible line since anchor | ${line.contribution_posture || 'visible_line'}`
    }));
    updatedLines.slice(0, 2).forEach(line => chronology.push({
      kind: 'updated_challenge_line',
      label: line.line_label || line.line_signature || 'visible challenge line',
      detail: `Updated across anchor | ${line.contribution_posture || 'visible_line'}`
    }));
    stableLines.slice(0, chronology.length < 2 ? 2 : 1).forEach(line => chronology.push({
      kind: 'stable_challenge_line',
      label: line.line_label || line.line_signature || 'visible challenge line',
      detail: `Stable before anchor | ${line.contribution_posture || 'visible_line'}`
    }));
    const visibleCounterexamples = candidateList
      .filter(item => item.candidate_type === 'counterexample_candidate' && item.refutes_candidate_id === primaryCandidateId)
      .slice(0, 3)
      .map(item => ({
        kind: 'counterexample_visible',
        label: item.principle || item.case_description || item.id,
        detail: `basis ${(item.challenge_basis && item.challenge_basis.contradiction_pressure_bucket) || 'not_visible'} | stored ${item.status || 'proposal_only'}`,
        candidate_id: item.id
      }));
    chronology.push(...visibleCounterexamples);
    const digestFlags = [];
    if (challengeDossierContext && challengeDossierContext.dossier_role === 'counterexample_contribution') digestFlags.push('counterexample_contribution_visible');
    if (newLines.length > 0) digestFlags.push('new_dossier_lines_visible');
    if (updatedLines.length > 0) digestFlags.push('updated_dossier_lines_visible');
    if (stableLines.length > 0) digestFlags.push('stable_dossier_lines_visible');
    if (watchpoints.length > 0) digestFlags.push('watchpoints_visible');
    if (refutationContext && refutationContext.refutation_present) digestFlags.push('refutation_visible');
    if (reviewTraceContext && reviewTraceContext.trace_present) digestFlags.push('review_trace_visible');
    const digestBucket = deriveHarnessChallengeDossierReviewDigestBucket(challengeDossierContext, challengeDossierDeltaContext, refutationContext, watchpoints.length);
    const visibleCounterexampleCount = Number((challengeDossierContext && challengeDossierContext.visible_counterexample_count)
      || (refutationContext && (refutationContext.visible_counterexample_count || refutationContext.visible_sibling_counterexample_count))
      || 0);
    const distinctChallengeLineCount = Number(challengeDossierContext && challengeDossierContext.distinct_challenge_line_count || 0);
    return {
      digest_present: Boolean((challengeDossierContext && challengeDossierContext.dossier_present) || (refutationContext && refutationContext.refutation_present) || watchpoints.length > 0),
      digest_role: candidateType === 'counterexample_candidate' ? 'counterexample_contribution_review_digest' : (challengeDossierContext && challengeDossierContext.dossier_present ? 'primary_candidate_review_digest' : 'not_applicable'),
      digest_summary: candidateType === 'counterexample_candidate' && primaryCandidateId
        ? `This proposal-only counterexample contributes into the consolidated review digest for ${primaryCandidateId}. Coverage reads as ${(challengeDossierContext && challengeDossierContext.challenge_posture_bucket) || 'not_visible'}, evolution reads as ${(challengeDossierDeltaContext && challengeDossierDeltaContext.movement_bucket) || 'not_derivable'}, and ${watchpoints.length} watchpoint(s) remain visible.`
        : `This primary-candidate review digest currently spans ${visibleCounterexampleCount} visible counterexample(s) across ${distinctChallengeLineCount} visible challenge line(s). Coverage reads as ${(challengeDossierContext && challengeDossierContext.challenge_posture_bucket) || 'not_visible'}, evolution reads as ${(challengeDossierDeltaContext && challengeDossierDeltaContext.movement_bucket) || 'not_derivable'}, and ${watchpoints.length > 0 ? `${watchpoints.length} watchpoint(s) remain visible.` : 'no stronger watchpoint remains visible.'}`,
      primary_candidate_id: primaryCandidateId,
      primary_candidate_title: primaryCandidate ? (primaryCandidate.principle || primaryCandidate.case_description || primaryCandidate.open_question || primaryCandidate.id) : null,
      primary_candidate_current_review_state: primaryCandidate && primaryCandidate.review_summary ? primaryCandidate.review_summary.current_state : (reviewSummary ? reviewSummary.current_state : null),
      digest_bucket: digestBucket,
      coverage_read: challengeDossierContext && challengeDossierContext.dossier_present
        ? `Coverage currently reads as ${challengeDossierContext.challenge_posture_bucket || 'not_visible'} with ${visibleCounterexampleCount} visible counterexample(s) across ${distinctChallengeLineCount} visible line(s).`
        : 'No stronger consolidated challenge dossier coverage is currently visible in the canonical workspace.',
      delta_read: challengeDossierDeltaContext && challengeDossierDeltaContext.delta_summary
        ? challengeDossierDeltaContext.delta_summary
        : 'No stronger challenge dossier evolution read is currently visible.',
      refutation_read: refutationContext && refutationContext.refutation_present
        ? `Refutation currently reads as ${refutationContext.refutation_role || 'not_applicable'} with visible pressure bucket ${(refutationContext.challenge_basis_bucket || (challengeContext && challengeContext.contradiction_pressure_bucket) || 'not_visible')}.`
        : 'No explicit refutation relation is currently visible inside this consolidated digest.',
      visible_counterexample_count: visibleCounterexampleCount,
      distinct_challenge_line_count: distinctChallengeLineCount,
      watchpoint_count: watchpoints.length,
      chronology: chronology.slice(0, 8),
      watchpoints,
      digest_flags: Array.from(new Set(digestFlags)).slice(0, 8),
      challenge_dossier_review_digest_surface_version: 'phase4e-mec-challenge-dossier-review-digest/v1'
    };
  }

  function buildHarnessReviewGateSignalSurface(rawCandidate, reviewSummary, contradictionContext, decisionPacketContext, challengeContext, refutationContext, challengeDossierContext, challengeDossierDeltaContext, challengeDossierReviewDigest) {
    const digestPresent = Boolean(challengeDossierReviewDigest && challengeDossierReviewDigest.digest_present);
    const watchpointCount = Number(challengeDossierReviewDigest && challengeDossierReviewDigest.watchpoint_count || 0);
    const contradictionCount = Array.isArray(contradictionContext && contradictionContext.contradiction_signals)
      ? contradictionContext.contradiction_signals.length
      : 0;
    const coverageGapCount = Number(challengeDossierContext && (challengeDossierContext.coverage_gap_count || challengeDossierContext.open_coverage_gap_count) || 0);
    const movementBucket = challengeDossierDeltaContext && challengeDossierDeltaContext.movement_bucket
      ? challengeDossierDeltaContext.movement_bucket
      : 'not_derivable';
    const challengePostureBucket = challengeDossierContext && challengeDossierContext.challenge_posture_bucket
      ? challengeDossierContext.challenge_posture_bucket
      : 'no_visible_challenge_dossier';
    const challengePressureBucket = (challengeContext && challengeContext.contradiction_pressure_bucket)
      || (refutationContext && refutationContext.challenge_basis_bucket)
      || 'not_visible';
    let coverageSignal = 'no_visible_dossier';
    if (challengeDossierContext && challengeDossierContext.dossier_role === 'counterexample_contribution') {
      coverageSignal = coverageGapCount > 0 ? 'contribution_with_open_gaps' : 'counterexample_contribution_visible';
    } else if (challengePostureBucket === 'pressure_without_counterexample_coverage') {
      coverageSignal = 'pressure_without_counterexample_coverage';
    } else if (coverageGapCount > 0) {
      coverageSignal = 'coverage_gaps_visible';
    } else if (Number(challengeDossierContext && challengeDossierContext.reinforcing_line_count || 0) > 0) {
      coverageSignal = 'reinforced_coverage_visible';
    } else if (Number(challengeDossierContext && challengeDossierContext.distinct_challenge_line_count || 0) >= 2) {
      coverageSignal = 'multi_line_coverage_visible';
    } else if (digestPresent) {
      coverageSignal = 'single_line_coverage_visible';
    }
    let stabilitySignal = 'anchor_not_derivable';
    if (movementBucket === 'expanding') {
      stabilitySignal = 'expanding_since_anchor';
    } else if (movementBucket === 'updated' || movementBucket === 'posture_shifted') {
      stabilitySignal = 'changed_since_anchor';
    } else if (movementBucket === 'stabilizing' || movementBucket === 'unchanged') {
      stabilitySignal = 'stable_since_anchor';
    } else if (movementBucket === 'pressure_without_coverage') {
      stabilitySignal = 'pressure_without_coverage';
    }
    let contradictionPressureSignal = 'not_visible';
    if (challengePressureBucket === 'high_visible_pressure' || contradictionCount >= 3) {
      contradictionPressureSignal = 'high_pressure_visible';
    } else if (challengePressureBucket === 'moderate_visible_pressure' || contradictionCount >= 1 || Boolean(refutationContext && refutationContext.refutation_present)) {
      contradictionPressureSignal = 'moderate_pressure_visible';
    } else if (digestPresent || challengePressureBucket === 'low_visible_pressure') {
      contradictionPressureSignal = 'low_pressure_visible';
    }
    let unresolvedWatchpointSignal = 'not_visible';
    if (watchpointCount >= 4) {
      unresolvedWatchpointSignal = 'watchpoints_elevated';
    } else if (watchpointCount >= 1) {
      unresolvedWatchpointSignal = 'watchpoints_present';
    } else if (digestPresent) {
      unresolvedWatchpointSignal = 'watchpoints_clear';
    }
    const decisionReadiness = decisionPacketContext && decisionPacketContext.decision_readiness
      ? decisionPacketContext.decision_readiness
      : 'decision_underconstrained';
    let reviewReadinessBucket = 'gate_not_ready';
    if (reviewSummary && reviewSummary.terminal) {
      reviewReadinessBucket = 'gate_closed';
    } else if (coverageSignal === 'pressure_without_counterexample_coverage' || contradictionPressureSignal === 'high_pressure_visible' || unresolvedWatchpointSignal === 'watchpoints_elevated') {
      reviewReadinessBucket = 'gate_restricted';
    } else if (decisionReadiness === 'decision_ready' && stabilitySignal === 'stable_since_anchor' && unresolvedWatchpointSignal === 'watchpoints_clear') {
      reviewReadinessBucket = 'gate_clear_read';
    } else if (digestPresent) {
      reviewReadinessBucket = 'gate_qualified_read';
    }
    const gateFlags = [];
    if (coverageSignal === 'pressure_without_counterexample_coverage') gateFlags.push('counterexample_coverage_missing');
    if (coverageSignal === 'coverage_gaps_visible' || coverageSignal === 'contribution_with_open_gaps') gateFlags.push('coverage_gaps_visible');
    if (stabilitySignal === 'expanding_since_anchor') gateFlags.push('expanding_since_anchor');
    if (stabilitySignal === 'changed_since_anchor') gateFlags.push('changed_since_anchor');
    if (contradictionPressureSignal === 'high_pressure_visible') gateFlags.push('high_contradiction_pressure');
    if (contradictionPressureSignal === 'moderate_pressure_visible') gateFlags.push('contradiction_pressure_visible');
    if (unresolvedWatchpointSignal === 'watchpoints_elevated') gateFlags.push('watchpoints_elevated');
    if (unresolvedWatchpointSignal === 'watchpoints_present') gateFlags.push('watchpoints_present');
    if (decisionReadiness === 'decision_fragile') gateFlags.push('decision_fragile');
    if (decisionReadiness === 'decision_underconstrained') gateFlags.push('decision_underconstrained');
    if (reviewSummary && reviewSummary.terminal) gateFlags.push('review_terminal');
    let reviewReadinessSummary = 'No stronger review gate signal surface is currently derivable.';
    if (reviewReadinessBucket === 'gate_closed') {
      reviewReadinessSummary = `Review gate stays closed because the current review state is already terminal at ${reviewSummary.current_state || 'proposal_only'}.`;
    } else if (reviewReadinessBucket === 'gate_restricted') {
      reviewReadinessSummary = `Gate signals remain restricted: coverage reads as ${coverageSignal}, stability reads as ${stabilitySignal}, contradiction pressure reads as ${contradictionPressureSignal}, and watchpoints read as ${unresolvedWatchpointSignal}.`;
    } else if (reviewReadinessBucket === 'gate_clear_read') {
      reviewReadinessSummary = `Gate signals currently read clear: coverage is ${coverageSignal}, stability is ${stabilitySignal}, contradiction pressure is ${contradictionPressureSignal}, and no unresolved watchpoint remains visible.`;
    } else if (reviewReadinessBucket === 'gate_qualified_read') {
      reviewReadinessSummary = `Gate signals are readable but qualified: coverage is ${coverageSignal}, stability is ${stabilitySignal}, contradiction pressure is ${contradictionPressureSignal}, and watchpoints are ${unresolvedWatchpointSignal}.`;
    }
    return {
      gate_surface_present: digestPresent || contradictionCount > 0 || watchpointCount > 0,
      review_readiness_bucket: reviewReadinessBucket,
      coverage_signal: coverageSignal,
      stability_signal: stabilitySignal,
      contradiction_pressure_signal: contradictionPressureSignal,
      unresolved_watchpoint_signal: unresolvedWatchpointSignal,
      review_readiness_summary: reviewReadinessSummary,
      decision_readiness_carry_through: decisionReadiness,
      gate_flags: Array.from(new Set(gateFlags)).slice(0, 8),
      review_gate_signal_surface_version: 'phase4f-mec-review-gate-signal-surface/v1'
    };
  }

  function buildHarnessChallengeDossierContext(rawCandidate, reviewSummary, latestReview, unresolvedRuntimeReferences, decisionPacketContext, challengeContext, refutationContext) {
    const candidateId = rawCandidate && rawCandidate.id ? rawCandidate.id : null;
    const candidateType = rawCandidate && rawCandidate.candidate_type ? rawCandidate.candidate_type : null;
    const refutesCandidateId = rawCandidate && rawCandidate.refutes_candidate_id ? rawCandidate.refutes_candidate_id : null;
    const visibleCounterexamples = candidateList
      .filter(item => item.candidate_type === 'counterexample_candidate')
      .filter(item => {
        const targetId = item.refutes_candidate_id || null;
        return targetId === candidateId || targetId === refutesCandidateId;
      })
      .map(item => ({
        candidate_id: item.id,
        title: item.principle || item.case_description || item.id,
        status: item.status || 'proposal_only',
        current_review_state: item.current_review_state || 'proposal_only',
        challenge_basis_bucket: item.challenge_basis && item.challenge_basis.contradiction_pressure_bucket
          ? item.challenge_basis.contradiction_pressure_bucket
          : 'not_visible',
        challenge_basis_flags: Array.isArray(item.challenge_basis && item.challenge_basis.challenge_flags) ? item.challenge_basis.challenge_flags.slice(0, 6) : [],
        line_signature: buildHarnessChallengeDossierLineSignature(item),
        line_label: buildHarnessChallengeDossierLineLabel(item),
        open_qualifier_count: Array.isArray(item.refutation_context && item.refutation_context.open_qualifiers) ? item.refutation_context.open_qualifiers.length : 0
      }));
    const lineMap = new Map();
    for (const counterexample of visibleCounterexamples) {
      if (!lineMap.has(counterexample.line_signature)) {
        lineMap.set(counterexample.line_signature, {
          line_signature: counterexample.line_signature,
          line_label: counterexample.line_label,
          challenge_basis_bucket: counterexample.challenge_basis_bucket,
          challenge_basis_flags: Array.from(new Set(counterexample.challenge_basis_flags || [])),
          counterexample_ids: [],
          contribution_count: 0,
          open_qualifier_count: 0
        });
      }
      const line = lineMap.get(counterexample.line_signature);
      line.counterexample_ids.push(counterexample.candidate_id);
      line.contribution_count += 1;
      line.open_qualifier_count += Number(counterexample.open_qualifier_count || 0);
    }
    const challengeLines = Array.from(lineMap.values()).map(line => ({
      ...line,
      contribution_posture: line.contribution_count >= 2
        ? (line.open_qualifier_count > 0 ? 'reinforced_but_qualified_line' : 'reinforced_visible_line')
        : line.open_qualifier_count > 0
          ? 'qualified_visible_line'
          : 'distinct_visible_line'
    }));
    const reinforcingLineCount = challengeLines.filter(line => line.contribution_count >= 2).length;
    const qualifiedLineCount = challengeLines.filter(line => line.open_qualifier_count > 0).length;
    const coverageGaps = [];
    if (challengeContext && challengeContext.challenge_present && visibleCounterexamples.length < 1 && Array.isArray(challengeContext.challenge_signals) && challengeContext.challenge_signals.length > 0) {
      coverageGaps.push('Visible challenge pressure is present, but no stored proposal-only counterexample currently contributes to dossier coverage.');
    }
    if (Array.isArray(unresolvedRuntimeReferences) && unresolvedRuntimeReferences.length > 0) {
      coverageGaps.push(...unresolvedRuntimeReferences.map(item => item.label).slice(0, 4));
    }
    if (decisionPacketContext && Array.isArray(decisionPacketContext.missing_signals)) {
      coverageGaps.push(...decisionPacketContext.missing_signals.slice(0, 3));
    }
    if (qualifiedLineCount > 0) {
      coverageGaps.push('Some visible challenge lines remain qualified by open visible gaps or unresolved references.');
    }
    const dedupedCoverageGaps = Array.from(new Set(coverageGaps)).slice(0, 6);
    const postureFlags = [];
    if (reinforcingLineCount > 0) {
      postureFlags.push('repeated_visible_basis');
    }
    if (challengeLines.length >= 2) {
      postureFlags.push('distinct_visible_lines');
    }
    if (dedupedCoverageGaps.length > 0) {
      postureFlags.push('open_visible_gaps');
    }
    if (visibleCounterexamples.length > 0) {
      postureFlags.push('counterexample_coverage_visible');
    }
    const challengePostureBucket = deriveHarnessChallengeDossierBucket(visibleCounterexamples.length, challengeLines.length, reinforcingLineCount, qualifiedLineCount, dedupedCoverageGaps.length, Boolean(challengeContext && challengeContext.challenge_present));
    if (candidateType === 'counterexample_candidate') {
      const contributionLineSignature = buildHarnessChallengeDossierLineSignature(rawCandidate);
      const contributionLine = challengeLines.find(line => Array.isArray(line.counterexample_ids) && line.counterexample_ids.includes(candidateId))
        || challengeLines.find(line => line.line_signature === contributionLineSignature)
        || null;
      return {
        dossier_present: Boolean(refutesCandidateId),
        dossier_role: 'counterexample_contribution',
        dossier_summary: refutesCandidateId
          ? `This proposal-only counterexample contributes one visible challenge line into the current primary-candidate dossier for ${refutesCandidateId}.`
          : 'This proposal-only counterexample does not currently have a visible primary-candidate dossier anchor in runtime.',
        primary_candidate_id: refutesCandidateId,
        primary_candidate_title: candidateList.find(item => item.id === refutesCandidateId)?.principle || refutesCandidateId || null,
        primary_candidate_current_review_state: refutationContext ? refutationContext.primary_candidate_current_review_state || null : null,
        challenge_posture_bucket: challengePostureBucket,
        dossier_posture_flags: postureFlags,
        visible_counterexample_count: visibleCounterexamples.length,
        distinct_challenge_line_count: challengeLines.length,
        reinforcing_line_count: reinforcingLineCount,
        open_coverage_gap_count: dedupedCoverageGaps.length,
        contribution_line_signature: contributionLineSignature,
        contribution_line_label: buildHarnessChallengeDossierLineLabel(rawCandidate),
        contribution_posture: contributionLine ? contributionLine.contribution_posture : 'distinct_visible_line',
        contribution_summary: contributionLine && contributionLine.contribution_posture === 'reinforced_visible_line'
          ? 'This counterexample reinforces a visible challenge line already present in the current primary-candidate dossier.'
          : 'This counterexample adds a distinct visible challenge line into the current primary-candidate dossier.',
        coverage_gaps: dedupedCoverageGaps,
        challenge_lines: challengeLines.slice(0, 4),
        challenge_dossier_surface_version: 'phase4c-mec-challenge-dossier-context/v1'
      };
    }
    if (visibleCounterexamples.length > 0 || (challengeContext && challengeContext.challenge_present)) {
      return {
        dossier_present: true,
        dossier_role: 'primary_candidate_challenge_dossier',
        dossier_summary: visibleCounterexamples.length > 1
          ? 'This primary candidate currently carries multiple visible challenge lines inside the canonical dossier.'
          : visibleCounterexamples.length === 1
            ? 'This primary candidate currently carries one visible challenge line inside the canonical dossier.'
            : 'Visible challenge pressure exists for this primary candidate, but stored counterexample coverage is not yet present in the canonical dossier.',
        primary_candidate_id: candidateId,
        primary_candidate_title: rawCandidate.principle || rawCandidate.open_question || rawCandidate.case_description || rawCandidate.id,
        primary_candidate_current_review_state: reviewSummary ? reviewSummary.current_state : null,
        primary_candidate_reviewable: reviewSummary ? Boolean(reviewSummary.reviewable) : false,
        primary_candidate_terminal: reviewSummary ? Boolean(reviewSummary.terminal) : false,
        latest_primary_review_outcome: latestReview ? latestReview.review_outcome || null : null,
        challenge_posture_bucket: challengePostureBucket,
        dossier_posture_flags: postureFlags,
        visible_counterexample_count: visibleCounterexamples.length,
        distinct_challenge_line_count: challengeLines.length,
        reinforcing_line_count: reinforcingLineCount,
        qualified_line_count: qualifiedLineCount,
        repeated_basis_count: reinforcingLineCount,
        challenge_lines: challengeLines.slice(0, 6),
        coverage_gaps: dedupedCoverageGaps,
        coverage_gap_count: dedupedCoverageGaps.length,
        challenge_dossier_surface_version: 'phase4c-mec-challenge-dossier-context/v1'
      };
    }
    return {
      dossier_present: false,
      dossier_role: 'not_applicable',
      dossier_summary: 'No compact primary-candidate challenge dossier is currently visible for this workspace item.',
      primary_candidate_id: refutesCandidateId || candidateId,
      primary_candidate_title: rawCandidate.principle || rawCandidate.open_question || rawCandidate.case_description || rawCandidate.id,
      primary_candidate_current_review_state: reviewSummary ? reviewSummary.current_state : null,
      primary_candidate_reviewable: reviewSummary ? Boolean(reviewSummary.reviewable) : false,
      primary_candidate_terminal: reviewSummary ? Boolean(reviewSummary.terminal) : false,
      latest_primary_review_outcome: latestReview ? latestReview.review_outcome || null : null,
      challenge_posture_bucket: deriveHarnessChallengeDossierBucket(0, 0, 0, 0, 0, Boolean(challengeContext && challengeContext.challenge_present)),
      dossier_posture_flags: [],
      visible_counterexample_count: 0,
      distinct_challenge_line_count: 0,
      reinforcing_line_count: 0,
      qualified_line_count: 0,
      repeated_basis_count: 0,
      challenge_lines: [],
      coverage_gaps: [],
      coverage_gap_count: 0,
      challenge_dossier_surface_version: 'phase4c-mec-challenge-dossier-context/v1'
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
    const contradictionContext = rawCandidate && rawCandidate.contradiction_context
      ? rawCandidate.contradiction_context
      : buildHarnessContradictionContext(reviewSummary, unresolvedRuntimeReferences, evidenceContext, reviewHistoryContext, focusContext, compareContext, deltaContext);
    const decisionPacketContext = rawCandidate && rawCandidate.decision_packet_context
      ? rawCandidate.decision_packet_context
      : buildHarnessDecisionPacketContext(rawCandidate, reviewSummary, latestReview, unresolvedRuntimeReferences, evidenceContext, reviewHistoryContext, relatedCandidates, stateExplanation, focusContext, compareContext, deltaContext, contradictionContext);
    const reviewTraceContext = rawCandidate && rawCandidate.review_trace_context
      ? rawCandidate.review_trace_context
      : buildHarnessReviewTraceContext(rawCandidate, latestReview, decisionPacketContext, contradictionContext, deltaContext);
    const challengeContext = rawCandidate && rawCandidate.challenge_context
      ? rawCandidate.challenge_context
      : buildHarnessChallengeContext(rawCandidate, latestReview, evidenceContext, reviewHistoryContext, relatedCandidates, deltaContext, contradictionContext, decisionPacketContext, reviewTraceContext);
    const refutationContext = rawCandidate && rawCandidate.refutation_context
      ? rawCandidate.refutation_context
      : buildHarnessRefutationContext(rawCandidate, reviewSummary, latestReview, unresolvedRuntimeReferences, decisionPacketContext, challengeContext, reviewTraceContext);
    const challengeDossierContext = rawCandidate && rawCandidate.challenge_dossier_context
      ? rawCandidate.challenge_dossier_context
      : buildHarnessChallengeDossierContext(rawCandidate, reviewSummary, latestReview, unresolvedRuntimeReferences, decisionPacketContext, challengeContext, refutationContext);
    const challengeDossierDeltaContext = rawCandidate && rawCandidate.challenge_dossier_delta_context
      ? rawCandidate.challenge_dossier_delta_context
      : buildHarnessChallengeDossierDeltaContext(rawCandidate, reviewSummary, latestReview, challengeDossierContext);
    const challengeDossierReviewDigest = rawCandidate && rawCandidate.challenge_dossier_review_digest
      ? rawCandidate.challenge_dossier_review_digest
      : buildHarnessChallengeDossierReviewDigest(rawCandidate, reviewSummary, latestReview, unresolvedRuntimeReferences, contradictionContext, decisionPacketContext, challengeContext, refutationContext, challengeDossierContext, challengeDossierDeltaContext, reviewTraceContext);
    const reviewGateSignalSurface = rawCandidate && rawCandidate.review_gate_signal_surface
      ? rawCandidate.review_gate_signal_surface
      : buildHarnessReviewGateSignalSurface(rawCandidate, reviewSummary, contradictionContext, decisionPacketContext, challengeContext, refutationContext, challengeDossierContext, challengeDossierDeltaContext, challengeDossierReviewDigest);
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
      contradiction_context: contradictionContext,
      decision_packet_context: decisionPacketContext,
      challenge_context: challengeContext,
      refutation_context: refutationContext,
      challenge_dossier_context: challengeDossierContext,
      challenge_dossier_delta_context: challengeDossierDeltaContext,
      challenge_dossier_review_digest: challengeDossierReviewDigest,
      review_gate_signal_surface: reviewGateSignalSurface,
      review_trace_context: reviewTraceContext,
      state_explanation: stateExplanation,
      workspace_summary: {
        review_count: reviewSummary.review_count,
        latest_review_outcome: reviewSummary.review_count > 0 ? reviewSummary.current_state : null,
        unresolved_runtime_reference_count: unresolvedRuntimeReferences.length,
        attention_required: unresolvedRuntimeReferences.length > 0,
        delta_attention: Boolean(deltaContext && deltaContext.review_attention_now),
        decision_readiness: decisionPacketContext.decision_readiness,
        contradiction_present: contradictionContext.contradiction_present,
        challenge_pressure_bucket: challengeContext.contradiction_pressure_bucket,
        refutation_present: refutationContext.refutation_present,
        refutation_role: refutationContext.refutation_role,
        challenge_dossier_present: challengeDossierContext.dossier_present,
        challenge_dossier_role: challengeDossierContext.dossier_role,
        challenge_posture_bucket: challengeDossierContext.challenge_posture_bucket,
        challenge_line_count: challengeDossierContext.distinct_challenge_line_count,
        challenge_dossier_delta_movement: challengeDossierDeltaContext.movement_bucket,
        challenge_dossier_new_lines: challengeDossierDeltaContext.new_line_count,
        challenge_dossier_review_digest_present: challengeDossierReviewDigest.digest_present,
        challenge_dossier_review_digest_bucket: challengeDossierReviewDigest.digest_bucket,
        challenge_dossier_review_watchpoints: challengeDossierReviewDigest.watchpoint_count,
        review_gate_readiness_bucket: reviewGateSignalSurface.review_readiness_bucket,
        review_gate_coverage_signal: reviewGateSignalSurface.coverage_signal,
        review_gate_watchpoint_signal: reviewGateSignalSurface.unresolved_watchpoint_signal,
        trace_present: reviewTraceContext.trace_present,
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

  function rebuildHarnessWorkspaceState() {
    for (let index = 0; index < candidateList.length; index += 1) {
      const current = candidateList[index];
      candidateList[index] = toWorkspaceItem({
        ...(current.raw_candidate_artifact || current),
        current_review_state: current.current_review_state,
        review_summary: current.review_summary,
        raw_review_records: current.raw_review_records
      });
    }
    Object.keys(candidateDetails).forEach(candidateId => {
      const current = candidateDetails[candidateId];
      candidateDetails[candidateId] = toWorkspaceItem({
        ...(current.raw_candidate_artifact || current),
        current_review_state: current.current_review_state,
        review_summary: current.review_summary,
        raw_review_records: current.raw_review_records
      });
    });
  }

  rebuildHarnessWorkspaceState();

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
    if (target.pathname === '/arena/health' && method === 'GET') {
      return createFetchResponse(200, { status: 'ok', write_auth_required: false });
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
        review_rationale: payload.review_rationale || '',
        rationale_snapshot: payload.rationale_snapshot || {
          decision_readiness: 'decision_ready',
          support_signals: ['Harness-visible support signal at write.'],
          friction_signals: [],
          missing_signals: [],
          contradiction_signals: [],
          why_now: 'Harness why-now signal at review write.',
          why_not_now: null,
          delta_movement_bucket: 'first_read_baseline'
        }
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
      rebuildHarnessWorkspaceState();
      return createFetchResponse(201, {
        reviewRecord,
        candidate: candidateDetails[candidateId]
      });
    }
    if (target.pathname.startsWith('/arena/mec-candidates/') && target.pathname.endsWith('/challenge-counterexamples') && method === 'POST') {
      const segments = target.pathname.split('/');
      const candidateId = decodeURIComponent(segments[segments.length - 2]);
      const payload = options.body ? JSON.parse(options.body) : {};
      const targetCandidate = candidateDetails[candidateId];
      if (!targetCandidate) {
        return createFetchResponse(404, {
          error: 'mec_candidate_not_found',
          candidate_id: candidateId
        });
      }
      if (targetCandidate.candidate_type !== 'invariant_candidate') {
        return createFetchResponse(409, {
          error: 'mec_candidate_not_challengeable',
          candidate_id: candidateId,
          blockers: [`Phase 4A manual challenge is locked to visible invariant candidates only, not ${targetCandidate.candidate_type || 'unknown'} objects.`]
        });
      }
      if (!payload.case_description) {
        return createFetchResponse(400, {
          error: 'missing_manual_challenge_case_description',
          candidate_id: candidateId
        });
      }
      const createdAt = '2026-03-09T10:30:00.000Z';
      const counterexampleId = `candidate-manual-counterexample-${candidateList.filter(item => item.candidate_type === 'counterexample_candidate').length + 1}`;
      const rawCounterexample = {
        id: counterexampleId,
        candidate_type: 'counterexample_candidate',
        principle: payload.principle || `Counterexample against ${targetCandidate.title || candidateId}`,
        mechanism: payload.mechanism || 'Manual challenge proposal from the MEC review desk harness.',
        refutes_candidate_id: candidateId,
        case_description: payload.case_description,
        resolution: payload.resolution || '',
        impact_on_candidate: payload.impact_on_candidate || 'challenge_bucket:moderate_visible_pressure',
        source_event_ids: Array.isArray(targetCandidate.raw_candidate_artifact && targetCandidate.raw_candidate_artifact.source_event_ids)
          ? targetCandidate.raw_candidate_artifact.source_event_ids.slice(0, 4)
          : [],
        source_card_ids: Array.isArray(targetCandidate.raw_candidate_artifact && targetCandidate.raw_candidate_artifact.source_card_ids)
          ? targetCandidate.raw_candidate_artifact.source_card_ids.slice(0, 4)
          : [],
        status: 'proposal_only',
        created_at: createdAt,
        updated_at: createdAt,
        distillation_mode: 'manual',
        challenge_origin: {
          source_surface: payload.challenge_source || 'mec_operator_ui_phase4a',
          manual_challenge: true,
          selected_primary_candidate_id: candidateId,
          selected_primary_candidate_type: targetCandidate.candidate_type,
          selected_workspace_kind: 'mec_review_workspace'
        },
        challenge_basis: {
          contradiction_pressure_bucket: targetCandidate.challenge_context ? targetCandidate.challenge_context.contradiction_pressure_bucket : 'low_visible_pressure',
          challenge_flags: targetCandidate.challenge_context ? targetCandidate.challenge_context.challenge_flags || [] : [],
          challenge_summary: targetCandidate.challenge_context ? targetCandidate.challenge_context.challenge_summary || null : null,
          challenge_signals: targetCandidate.challenge_context ? targetCandidate.challenge_context.challenge_signals || [] : [],
          stabilizing_signals: targetCandidate.challenge_context ? targetCandidate.challenge_context.stabilizing_signals || [] : [],
          existing_counterexample_ids: targetCandidate.challenge_context && Array.isArray(targetCandidate.challenge_context.existing_counterexamples)
            ? targetCandidate.challenge_context.existing_counterexamples.map(item => item.candidate_id)
            : [],
          boundary_candidate_id: targetCandidate.challenge_context ? targetCandidate.challenge_context.boundary_candidate_id || null : null,
          boundary_integrity: targetCandidate.challenge_context ? targetCandidate.challenge_context.boundary_integrity || null : null,
          latest_review_outcome: targetCandidate.challenge_context ? targetCandidate.challenge_context.latest_review_outcome || null : null,
          latest_review_trace_present: Boolean(targetCandidate.challenge_context && targetCandidate.challenge_context.latest_review_trace_present),
          why_now: targetCandidate.delta_context ? targetCandidate.delta_context.why_now || null : null,
          why_not_now: targetCandidate.delta_context ? targetCandidate.delta_context.why_not_now || null : null
        },
        candidate_boundary: {
          runtime_only: true,
          proposal_only: true,
          registry_mutation: false,
          canon_exported: false,
          review_integrated: false
        }
      };
      candidateList.push(toWorkspaceItem(rawCounterexample));
      candidateDetails[counterexampleId] = toWorkspaceItem(rawCounterexample);
      rebuildHarnessWorkspaceState();
      return createFetchResponse(201, {
        candidate: candidateDetails[counterexampleId],
        primary_candidate_id: candidateId,
        challenge_context: candidateDetails[candidateId].challenge_context
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
  const detailDecisionEl = elements.get('detail-decision');
  const detailContradictionEl = elements.get('detail-contradiction');
  const detailChallengeEl = elements.get('detail-challenge');
  const detailRefutationEl = elements.get('detail-refutation');
  const detailChallengeDossierEl = elements.get('detail-challenge-dossier');
  const detailChallengeDossierDigestEl = elements.get('detail-challenge-dossier-digest');
  const detailReviewGateSignalsEl = elements.get('detail-review-gate-signals');
  const detailTraceEl = elements.get('detail-trace');
  const challengeMessageEl = elements.get('challenge-message');
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
  assert(candidateListEl.innerHTML.includes('Linked target candidate-invariant') || candidateListEl.innerHTML.includes('A first review is still pending and unresolved runtime references remain visible.') || candidateListEl.innerHTML.includes('A first review is still pending and comparable neighboring workspace objects are already visible.'), 'Expected boundary candidate list row to expose linked-target or delta-aware context');
  assert(candidateListEl.innerHTML.includes('Refutes candidate-invariant | Counterexample detail') || candidateListEl.innerHTML.includes('A first review is still pending and comparable neighboring workspace objects are already visible.'), 'Expected counterexample candidate list row to expose refuted-target or delta-aware context');
  assert(candidateListEl.innerHTML.includes('Domain mec_ui_harness | blind spot 0.5') || candidateListEl.innerHTML.includes('A first review is still pending, so the next read establishes the initial decision anchor.') || candidateListEl.innerHTML.includes('A first review is still pending and comparable neighboring workspace objects are already visible.'), 'Expected curiosity candidate list row to expose domain/blind-spot or delta-aware context');

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
  assert(detailDecisionEl.innerHTML.includes('Decision readiness'), 'Expected desk detail to render decision readiness');
  assert(detailDecisionEl.innerHTML.includes('Support signals'), 'Expected desk detail to render support signals');
  assert(detailDecisionEl.innerHTML.includes('Friction signals'), 'Expected desk detail to render friction signals');
  assert(detailContradictionEl.innerHTML.includes('Contradiction summary'), 'Expected desk detail to render contradiction summary');
  assert(detailContradictionEl.innerHTML.includes('Contradiction signals'), 'Expected desk detail to render contradiction signals');
  assert(detailChallengeEl.innerHTML.includes('Challenge summary'), 'Expected desk detail to render challenge summary');
  assert(detailChallengeEl.innerHTML.includes('Manual counterexample proposal'), 'Expected desk detail to render the manual counterexample proposal path');
  assert(detailRefutationEl.innerHTML.includes('Refutation summary'), 'Expected desk detail to render the new refutation summary surface');
  assert(detailRefutationEl.innerHTML.includes('Visible counterexample posture'), 'Expected desk detail to render visible counterexample posture from the canonical workspace');
  assert(detailChallengeDossierEl.innerHTML.includes('Challenge dossier summary'), 'Expected desk detail to render the new challenge dossier summary surface');
  assert(detailChallengeDossierEl.innerHTML.includes('Challenge lines'), 'Expected desk detail to render compact challenge lines from the canonical dossier surface');
  assert(detailChallengeDossierDigestEl.innerHTML.includes('Digest summary'), 'Expected desk detail to render the new challenge dossier review digest surface');
  assert(detailChallengeDossierDigestEl.innerHTML.includes('Chronology'), 'Expected desk detail to render compact challenge chronology in the digest surface');
  assert(detailReviewGateSignalsEl.innerHTML.includes('Review readiness summary'), 'Expected desk detail to render the Phase 4F review gate signal surface');
  assert(detailReviewGateSignalsEl.innerHTML.includes('coverage_signal'), 'Expected desk detail to render normalized Phase 4F gate signals');
  assert(detailTraceEl.innerHTML.includes('Review action trace'), 'Expected desk detail to render review trace surface');
  assert(detailTraceEl.innerHTML.includes('No review action has been written yet') || detailTraceEl.innerHTML.includes('no action rationale trace'), 'Expected desk detail to explain missing review trace before any write');
  assert(rawReviewRecordsEl.innerHTML.includes('No raw review records stored yet for this workspace item.'), 'Expected desk detail to render an empty raw review record state');
  assert(deskNavigationEl.innerHTML.includes('Reproducible desk state'), 'Expected desk detail to render queue navigation and reproducible state');
  assert(deskNavigationEl.innerHTML.includes('Compare state'), 'Expected desk detail to render compare navigation state');

  await context.selectCandidate('candidate-invariant');
  const challengeCaseDescriptionEl = detailChallengeEl.querySelector('.challenge-case-description');
  assert(challengeCaseDescriptionEl, 'Expected challenge surface to render a manual case description field for an invariant candidate');
  challengeCaseDescriptionEl.value = 'Manual harness challenge contradicts the invariant under a still-visible runtime edge case.';
  detailChallengeEl.querySelector('.challenge-impact').value = 'narrows_scope';
  detailChallengeEl.querySelector('.challenge-create').click();
  await harness.flush();
  assert(challengeMessageEl.textContent.includes('Proposal-only counterexample created:'), 'Expected manual challenge create path to surface a success message');
  const createdHarnessCounterexample = context.getCandidateById('candidate-manual-counterexample-2');
  assert(createdHarnessCounterexample && createdHarnessCounterexample.refutes_candidate_id === 'candidate-invariant', 'Expected manual challenge path to create a counterexample tied to the selected primary candidate');
  assert(createdHarnessCounterexample && createdHarnessCounterexample.raw_candidate_artifact && createdHarnessCounterexample.raw_candidate_artifact.challenge_origin && createdHarnessCounterexample.raw_candidate_artifact.challenge_origin.manual_challenge === true, 'Expected manual challenge path to preserve explicit proposal-only challenge origin metadata');
  assert(context.getCandidateById('candidate-invariant').challenge_context && context.getCandidateById('candidate-invariant').challenge_context.existing_counterexample_count >= 2, 'Expected selected primary candidate challenge context to refresh after manual counterexample creation');
  assert(context.getCandidateById('candidate-invariant').refutation_context && context.getCandidateById('candidate-invariant').refutation_context.visible_counterexample_count >= 2, 'Expected selected primary candidate refutation context to refresh after manual counterexample creation');
  assert(context.getCandidateById('candidate-invariant').challenge_dossier_context && context.getCandidateById('candidate-invariant').challenge_dossier_context.visible_counterexample_count >= 2, 'Expected selected primary candidate challenge dossier context to refresh after manual counterexample creation');

  await context.selectCandidate('candidate-counterexample');
  assert(detailRefutationEl.innerHTML.includes('Open primary candidate'), 'Expected counterexample detail to expose a direct open-primary action in refutation context');
  assert(detailRefutationEl.innerHTML.includes('Challenge basis carry-through'), 'Expected counterexample detail to expose challenge-basis carry-through in refutation context');
  assert(detailChallengeDossierEl.innerHTML.includes('counterexample_contribution') || detailChallengeDossierEl.innerHTML.includes('contributes one visible challenge line'), 'Expected counterexample detail to expose contribution readability in challenge dossier context');
  assert(detailChallengeDossierDigestEl.innerHTML.includes('counterexample_contribution_review_digest') || detailChallengeDossierDigestEl.innerHTML.includes('contributes into the consolidated review digest'), 'Expected counterexample detail to expose contribution readability in the consolidated review digest');
  assert(detailReviewGateSignalsEl.innerHTML.includes('Gate flags'), 'Expected counterexample detail to expose Phase 4F gate flags');

  await context.selectCandidate('candidate-curiosity');

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
  assert(context.getCandidateById('candidate-curiosity').raw_review_records[0].rationale_snapshot && context.getCandidateById('candidate-curiosity').raw_review_records[0].rationale_snapshot.decision_readiness, 'Expected review write to preserve a rationale snapshot in the embedded harness');
  assert(elements.get('raw-review-records').innerHTML.includes('write snapshot | readiness'), 'Expected raw review record rendering to expose write snapshot readability');
  assert(elements.get('detail-trace').innerHTML.includes('Review action trace'), 'Expected desk detail to render the written review trace after a runtime review write');
  assert(elements.get('detail-trace').innerHTML.includes('Signals at write'), 'Expected desk detail to render write-time signals after a runtime review write');
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
    assert(page.text.includes('Decision packet'), 'Expected decision packet section');
    assert(page.text.includes('Contradiction context'), 'Expected contradiction context section');
    assert(page.text.includes('Challenge context'), 'Expected challenge context section');
    assert(page.text.includes('Refutation context'), 'Expected refutation context section');
    assert(page.text.includes('Challenge dossier context'), 'Expected challenge dossier context section');
    assert(page.text.includes('Single-candidate challenge reading from the canonical workspace only'), 'Expected Phase 4A challenge framing in UI');
    assert(page.text.includes('Read-first counterexample and refuted-primary readability from the canonical workspace only'), 'Expected Phase 4B refutation framing in UI');
    assert(page.text.includes('Primary-candidate-centered challenge posture over already visible counterexample relations from the canonical workspace only'), 'Expected Phase 4C challenge dossier framing in UI');
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
    assert(page.text.includes('Signal-based decision condensation showing what supports, weakens or still underconstrains the current read without recommending an outcome'), 'Expected decision-packet framing in UI');
    assert(page.text.includes('Visible signal contradictions that should be held together before a stabilize/reject decision is written'), 'Expected contradiction framing in UI');
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
    assert(detailResponse.json && detailResponse.json.challenge_context && detailResponse.json.challenge_context.manual_counterexample_allowed === true, 'Expected invariant workspace detail to expose the locked manual Phase 4A challenge path');
    assert(detailResponse.json && detailResponse.json.refutation_context && detailResponse.json.refutation_context.refutation_role === 'refuted_primary_candidate', 'Expected invariant workspace detail to expose additive Phase 4B refutation context');
    assert(detailResponse.json && detailResponse.json.challenge_dossier_context && detailResponse.json.challenge_dossier_context.dossier_role === 'primary_candidate_challenge_dossier', 'Expected invariant workspace detail to expose additive Phase 4C challenge dossier context');

    const manualChallengeResponse = await request('POST', `http://127.0.0.1:${port}/arena/mec-candidates/${candidateResponse.json.candidate.id}/challenge-counterexamples`, {
      case_description: 'Manual HTTP challenge shows a contradicting runtime case against the selected invariant.',
      resolution: 'Keep proposal-only and attach a counterexample candidate.',
      impact_on_candidate: 'narrows_scope',
      challenge_source: 'mec_ui_http_phase4a'
    });
    assert(manualChallengeResponse.statusCode === 201, 'Expected manual challenge counterexample creation to return 201');
    assert(manualChallengeResponse.json && manualChallengeResponse.json.candidate && manualChallengeResponse.json.candidate.refutes_candidate_id === candidateResponse.json.candidate.id, 'Expected manual challenge create response to preserve the selected primary candidate linkage');
    assert(manualChallengeResponse.json && manualChallengeResponse.json.candidate && manualChallengeResponse.json.candidate.status === 'proposal_only', 'Expected manual challenge create response to stay proposal-only');
    assert(manualChallengeResponse.json && manualChallengeResponse.json.candidate && manualChallengeResponse.json.candidate.challenge_origin && manualChallengeResponse.json.candidate.challenge_origin.manual_challenge === true, 'Expected manual challenge create response to preserve explicit challenge origin metadata');

    const reviewCreateResponse = await request('POST', `http://127.0.0.1:${port}/arena/mec-candidates/${candidateResponse.json.candidate.id}/reviews`, {
      review_outcome: 'stabilize',
      review_rationale: 'UI smoke read-first runtime stabilization.',
      review_source: 'mec_ui_smoke',
      reviewer_mode: 'human',
      rationale_snapshot: {
        decision_readiness: 'decision_ready',
        support_signals: ['HTTP smoke support at write.'],
        friction_signals: ['HTTP smoke friction at write.'],
        missing_signals: [],
        contradiction_signals: ['HTTP smoke contradiction at write.'],
        why_now: 'HTTP smoke why-now at write.',
        why_not_now: null,
        delta_movement_bucket: 'first_read_attention'
      }
    });
    assert(reviewCreateResponse.statusCode === 201, 'Expected MEC review creation to return 201');
    assert(reviewCreateResponse.json && reviewCreateResponse.json.reviewRecord && reviewCreateResponse.json.reviewRecord.review_outcome === 'stabilize', 'Expected created MEC review outcome to be stabilize');
    assert(reviewCreateResponse.json && reviewCreateResponse.json.reviewRecord && reviewCreateResponse.json.reviewRecord.rationale_snapshot && reviewCreateResponse.json.reviewRecord.rationale_snapshot.decision_readiness === 'decision_ready', 'Expected HTTP review creation to preserve the rationale snapshot at write time');

    const reviewedListResponse = await request('GET', `http://127.0.0.1:${port}/arena/mec-review-workspace`);
    assert(reviewedListResponse.statusCode === 200, 'Expected reviewed workspace list to return 200');
    assert(reviewedListResponse.json.items.some(item => item.id === candidateResponse.json.candidate.id && item.current_review_state === 'stabilize'), 'Expected candidate list to expose derived stabilize review state');

    const reviewedDetailResponse = await request('GET', `http://127.0.0.1:${port}/arena/mec-review-workspace/${candidateResponse.json.candidate.id}`);
    assert(reviewedDetailResponse.statusCode === 200, 'Expected reviewed workspace detail to return 200');
    assert(reviewedDetailResponse.json && reviewedDetailResponse.json.status === 'proposal_only', 'Expected raw candidate status to remain proposal_only after review');
    assert(reviewedDetailResponse.json && reviewedDetailResponse.json.current_review_state === 'stabilize', 'Expected candidate detail to expose derived stabilize review state');
    assert(reviewedDetailResponse.json && reviewedDetailResponse.json.review_summary && reviewedDetailResponse.json.review_summary.review_count === 1, 'Expected candidate detail to expose review record count');
    assert(reviewedDetailResponse.json && reviewedDetailResponse.json.raw_candidate_artifact && reviewedDetailResponse.json.raw_candidate_artifact.status === 'proposal_only', 'Expected reviewed workspace detail to keep raw candidate artifact proposal-origin');
    assert(reviewedDetailResponse.json && reviewedDetailResponse.json.challenge_context && reviewedDetailResponse.json.challenge_context.existing_counterexample_count >= 2, 'Expected reviewed workspace detail to reflect stored counterexample posture after manual challenge creation');
    assert(reviewedDetailResponse.json && reviewedDetailResponse.json.refutation_context && reviewedDetailResponse.json.refutation_context.visible_counterexample_count >= 2, 'Expected reviewed workspace detail to expose visible counterexample posture through Phase 4B refutation context');
    assert(reviewedDetailResponse.json && reviewedDetailResponse.json.challenge_dossier_context && reviewedDetailResponse.json.challenge_dossier_context.visible_counterexample_count >= 2, 'Expected reviewed workspace detail to expose visible counterexample coverage through Phase 4C challenge dossier context');
    assert(reviewedDetailResponse.json && reviewedDetailResponse.json.review_trace_context && reviewedDetailResponse.json.review_trace_context.trace_present === true, 'Expected reviewed workspace detail to expose post-decision review trace context');
    assert(reviewedDetailResponse.json && Array.isArray(reviewedDetailResponse.json.review_trace_context.support_at_write), 'Expected reviewed workspace detail to expose write-time support signals');
    assert(reviewedDetailResponse.json && Array.isArray(reviewedDetailResponse.json.raw_review_records) && reviewedDetailResponse.json.raw_review_records[0] && reviewedDetailResponse.json.raw_review_records[0].rationale_snapshot, 'Expected reviewed workspace detail to keep the raw rationale snapshot on the review record');

    const boundaryDetailResponse = await request('GET', `http://127.0.0.1:${port}/arena/mec-review-workspace/${boundaryResponse.json.candidate.id}`);
    assert(boundaryDetailResponse.statusCode === 200, 'Expected boundary workspace detail to return 200');
    assert(boundaryDetailResponse.json && boundaryDetailResponse.json.linked_candidate_id === candidateResponse.json.candidate.id, 'Expected boundary detail to preserve linked_candidate_id');
    assert(boundaryDetailResponse.json && Array.isArray(boundaryDetailResponse.json.fails_when) && boundaryDetailResponse.json.fails_when.length === 1, 'Expected boundary detail to preserve fails_when');

    const counterexampleDetailResponse = await request('GET', `http://127.0.0.1:${port}/arena/mec-review-workspace/${counterexampleResponse.json.candidate.id}`);
    assert(counterexampleDetailResponse.statusCode === 200, 'Expected counterexample workspace detail to return 200');
    assert(counterexampleDetailResponse.json && counterexampleDetailResponse.json.refutes_candidate_id === candidateResponse.json.candidate.id, 'Expected counterexample detail to preserve refutes_candidate_id');
    assert(counterexampleDetailResponse.json && counterexampleDetailResponse.json.case_description === 'Clean reproduction still fails after the supposed fix path.', 'Expected counterexample detail to preserve case_description');
    assert(counterexampleDetailResponse.json && counterexampleDetailResponse.json.refutation_context && counterexampleDetailResponse.json.refutation_context.refutation_role === 'counterexample_candidate', 'Expected counterexample detail to expose additive Phase 4B refutation role');
    assert(counterexampleDetailResponse.json && counterexampleDetailResponse.json.refutation_context && counterexampleDetailResponse.json.refutation_context.primary_candidate_id === candidateResponse.json.candidate.id, 'Expected counterexample detail to expose the refuted primary candidate inside refutation context');
    assert(counterexampleDetailResponse.json && counterexampleDetailResponse.json.challenge_dossier_context && counterexampleDetailResponse.json.challenge_dossier_context.dossier_role === 'counterexample_contribution', 'Expected counterexample detail to expose additive Phase 4C contribution role inside challenge dossier context');

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
