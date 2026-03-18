'use client';

export type ContextAnchorEntry = {
  tier: 'anchor' | 'active';
  label: string;
};

type MayaEmptyStateProps = {
  onSendStarter: (text: string) => void;
  anchors: ContextAnchorEntry[];
};

// Phase B: Context Anchor is shown only when real data is present.
// Mockdata is never deployed — per Handoff v4.3 §7 + Phase B constraints.
function shouldShowContextAnchor(anchors: ContextAnchorEntry[]): boolean {
  return anchors.length > 0;
}

const STARTERS = [
  { text: 'Nächsten Schritt klären', primary: true,  icon: '↓' },
  { text: 'Was nicht ignorieren?',   primary: false, icon: '○' },
  { text: 'Annahmen prüfen',         primary: false, icon: '□' }
] as const;

export function MayaEmptyState({ onSendStarter, anchors }: MayaEmptyStateProps) {
  const showAnchor = shouldShowContextAnchor(anchors);

  return (
    <div className="maya-empty">
      <div>
        <div className="empty-heading">Dein aktueller Stand ist bereit.</div>
        <div className="empty-sub">Womit beginnen wir heute?</div>
      </div>

      <div className="starters">
        {STARTERS.map(s => (
          <button
            key={s.text}
            className={`starter ${s.primary ? 'primary' : 'secondary'}`}
            onClick={() => onSendStarter(s.text)}
          >
            <span className="s-icon">{s.icon}</span>
            <span className="s-txt">{s.text}</span>
          </button>
        ))}
      </div>

      {showAnchor && (
        <div className="context-anchor">
          <div className="ca-label">Aktiver Kontext</div>
          {anchors.map((entry, i) => (
            <div key={i} className="ca-row">
              <span className={`ca-tier ${entry.tier}`}>
                {entry.tier === 'anchor' ? 'Anchor' : 'Aktiv'}
              </span>
              <span className="ca-text">{entry.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
