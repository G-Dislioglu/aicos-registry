'use client';

import { useEffect } from 'react';

type BriefingSlot = {
  id: string;
  type: string;
  title: string;
  summary: string;
  entityId: string | null;
  severity?: number;
  confidence?: number;
};

type Briefing = {
  contextSummary: string;
  openProposed: BriefingSlot[];
  conflicts: BriefingSlot[];
  signals: BriefingSlot[];
  costToday: number;
  tokensToday: number;
};

type ReviewQueueItem = {
  id: string;
  memoryEntry: {
    id: string;
    tier: string;
    topic: string;
    content: string;
    confidence: number;
    reviewStatus: string;
  };
  priority: number;
  tier: string;
  createdAt: string;
};

type HealthStatus = {
  storeCounts?: {
    core: number;
    working: number;
    ephemeral: number;
    event: number;
    signal: number;
    proposed: number;
    conflict: number;
    total: number;
  };
};

type MayaReviewSheetProps = {
  briefing: Briefing | null;
  reviewQueue: ReviewQueueItem[];
  health: HealthStatus | null;
  onClose: () => void;
  onConfirmProposed: (entityId: string) => void;
  onDenyProposed: (entityId: string) => void;
  onSubmitReview: (memoryEntryId: string, tier: string, label: string) => void;
};

const REVIEW_ACTIONS: Record<string, Array<{ label: string; value: string; cls: string }>> = {
  conflict: [
    { label: 'Echt',     value: 'real_conflict',  cls: '' },
    { label: 'Fehlalarm',value: 'false_positive', cls: 'deny' },
    { label: 'Unklar',   value: 'unclear',        cls: '' }
  ],
  proposed: [
    { label: 'Nützlich', value: 'useful',    cls: 'confirm' },
    { label: 'Übergriff',value: 'overreach', cls: 'deny' },
    { label: 'Doppelt',  value: 'redundant', cls: '' }
  ],
  signal: [
    { label: 'Vielversprechend', value: 'promising', cls: 'confirm' },
    { label: 'Rauschen',         value: 'noise',     cls: 'deny' }
  ],
  event: [
    { label: 'Nützlich', value: 'useful', cls: 'confirm' },
    { label: 'Trivial',  value: 'trivial', cls: '' },
    { label: 'Falsch',   value: 'wrong',  cls: 'deny' }
  ]
};

export function MayaReviewSheet({
  briefing,
  reviewQueue,
  health,
  onClose,
  onConfirmProposed,
  onDenyProposed,
  onSubmitReview
}: MayaReviewSheetProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const proposedItems  = briefing?.openProposed ?? [];
  const conflictItems  = briefing?.conflicts ?? [];
  const queueItems     = reviewQueue ?? [];
  const storeCounts    = health?.storeCounts;

  const hasAnything = proposedItems.length > 0 || conflictItems.length > 0 || queueItems.length > 0;

  return (
    <div className="overlay-bg" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="overlay-sheet" role="dialog" aria-modal="true" aria-label="Review">
        <div className="sheet-header">
          <span className="sheet-title">Review</span>
          <button className="sheet-close" onClick={onClose} aria-label="Schließen">×</button>
        </div>

        <div className="sheet-body">
          {!hasAnything && (
            <div className="sheet-empty">Keine offenen Einträge.</div>
          )}

          {/* Proposed — Confirm / Deny */}
          {proposedItems.length > 0 && (
            <div className="sheet-section">
              <div className="sheet-section-label">
                Vorgeschlagen ({proposedItems.length})
              </div>
              {proposedItems.map(item => (
                <div key={item.id} className="review-item">
                  <span className="tier-badge proposed">Vorgeschlagen</span>
                  <div className="review-item-topic">{item.title}</div>
                  <div className="review-item-content">{item.summary}</div>
                  {item.entityId && (
                    <div className="review-item-actions">
                      <button
                        className="review-action confirm"
                        onClick={() => onConfirmProposed(item.entityId!)}
                      >
                        Bestätigen
                      </button>
                      <button
                        className="review-action deny"
                        onClick={() => onDenyProposed(item.entityId!)}
                      >
                        Ablehnen
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Conflicts — read-only display */}
          {conflictItems.length > 0 && (
            <div className="sheet-section">
              <div className="sheet-section-label">
                Konflikte ({conflictItems.length})
              </div>
              {conflictItems.map(item => (
                <div key={item.id} className="review-item">
                  <span className="tier-badge conflict">Konflikt</span>
                  {item.severity !== undefined && (
                    <span style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--txt3)', marginLeft: 6 }}>
                      Schwere {item.severity}
                    </span>
                  )}
                  <div className="review-item-topic">{item.title}</div>
                  <div className="review-item-content">{item.summary}</div>
                </div>
              ))}
            </div>
          )}

          {/* Review Queue */}
          {queueItems.length > 0 && (
            <div className="sheet-section">
              <div className="sheet-section-label">
                Queue ({queueItems.length})
              </div>
              {queueItems.slice(0, 8).map(item => {
                const actions = REVIEW_ACTIONS[item.tier] ?? REVIEW_ACTIONS['event'];
                return (
                  <div key={item.id} className="review-item">
                    <span className={`tier-badge ${item.tier}`}>
                      {item.tier}
                    </span>
                    <div className="review-item-topic">{item.memoryEntry.topic}</div>
                    <div className="review-item-content">{item.memoryEntry.content}</div>
                    <div className="review-item-actions">
                      {actions.map(action => (
                        <button
                          key={action.value}
                          className={`review-action ${action.cls}`}
                          onClick={() => onSubmitReview(item.memoryEntry.id, item.tier, action.value)}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Store Counts Summary */}
          {storeCounts && (
            <div className="sheet-section">
              <div className="sheet-section-label">Memory Store</div>
              <div className="store-grid">
                {[
                  { key: 'core',     label: 'Kern',     val: storeCounts.core },
                  { key: 'working',  label: 'Arbeit',   val: storeCounts.working },
                  { key: 'event',    label: 'Event',    val: storeCounts.event },
                  { key: 'proposed', label: 'Vorgesch.',val: storeCounts.proposed },
                  { key: 'conflict', label: 'Konflikt', val: storeCounts.conflict },
                  { key: 'signal',   label: 'Signal',   val: storeCounts.signal },
                  { key: 'ephemeral',label: 'Flüchtig', val: storeCounts.ephemeral },
                  { key: 'total',    label: 'Gesamt',   val: storeCounts.total }
                ].map(({ key, label, val }) => (
                  <div key={key} className="store-cell">
                    <div className="store-num">{val}</div>
                    <div className="store-label">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cost from Briefing */}
          {briefing && (
            <div className="sheet-section">
              <div className="sheet-section-label">Kosten heute</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--txt1)' }}>
                {briefing.costToday}¢
                <span style={{ fontSize: 10, color: 'var(--txt3)', marginLeft: 8 }}>
                  {briefing.tokensToday} Tokens
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
