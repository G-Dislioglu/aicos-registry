'use client';

type MayaPresenceState = 'idle' | 'thinking' | 'retrieving' | 'streaming';

type Provider = {
  id: string;
  name: string;
  configured: boolean;
  available: boolean;
  status: string;
  defaultModel: string;
  models: Array<{
    id: string;
    name: string;
    roles: string[];
    stability: string;
    isDefault: boolean;
    costClass: string;
  }>;
};

type HealthStatus = {
  status: 'ok' | 'degraded' | 'blocked';
  costToday: number;
  tokensToday: number;
  chatProvider?: {
    isMockMode: boolean;
    primaryProvider: string;
    primaryModel: string;
  };
};

type MayaTopbarProps = {
  mayaState: MayaPresenceState;
  provider: string;
  model: string;
  providers: Provider[];
  health: HealthStatus | null;
  reviewCount: number;
  topbarMetaOpen: boolean;
  isFileMode?: boolean;
  onToggleMeta: () => void;
  onProviderChange: (providerId: string) => void;
  onModelChange: (modelId: string) => void;
  onOpenReview: () => void;
};

const STATE_LABELS: Record<MayaPresenceState, string> = {
  idle:       'bereit',
  thinking:   'denkt nach',
  retrieving: 'lädt Kontext',
  streaming:  'antwortet'
};

function costClass(health: HealthStatus | null): 'ok' | 'warn' | 'danger' {
  if (!health) return 'ok';
  if (health.status === 'blocked')  return 'danger';
  if (health.status === 'degraded') return 'warn';
  return 'ok';
}

export function MayaTopbar({
  mayaState,
  provider,
  model,
  providers,
  health,
  reviewCount,
  topbarMetaOpen,
  isFileMode,
  onToggleMeta,
  onProviderChange,
  onModelChange,
  onOpenReview
}: MayaTopbarProps) {
  const currentProvider = providers.find(p => p.id === provider);
  const availableModels = currentProvider?.models ?? [];

  const cc = costClass(health);
  const costDisplay = health ? `${health.costToday}¢` : '—';
  const isMockMode = health?.chatProvider?.isMockMode ?? (provider === 'mock');

  return (
    <header className="maya-topbar">
      {/* Mobile-only escape — desktop rail handles navigation */}
      <a href="/" className="mobile-escape" aria-label="Zurück zur Startseite">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </a>

      <span className="tb-name" onClick={onToggleMeta} title="Ebene 2 ein-/ausblenden">
        Maya
      </span>

      <div className={`maya-state ${mayaState}`}>
        <span className={`orb ${mayaState}`} />
        <span className="state-label">{STATE_LABELS[mayaState]}</span>
      </div>

      <div className={`topbar-meta${topbarMetaOpen ? ' open' : ''}`}>
        <div className="tb-divider" />

        {isMockMode ? (
          <span className="tb-localmode">lokal</span>
        ) : (
          <>
            <select
              className="tb-sel"
              value={provider}
              onChange={e => onProviderChange(e.target.value)}
              aria-label="Provider"
            >
              {providers.length > 0
                ? providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))
                : <option value={provider}>{provider}</option>
              }
            </select>

            <span className="tb-sep">·</span>

            <select
              className="tb-sel model"
              value={model}
              onChange={e => onModelChange(e.target.value)}
              aria-label="Modell"
            >
              {availableModels.length > 0
                ? availableModels.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))
                : <option value={model}>{model}</option>
              }
            </select>
          </>
        )}

        <div className={`tb-cost ${cc}`} title={`${health?.tokensToday ?? 0} Tokens heute`}>
          <span className="cost-dot" />
          <span>{costDisplay}</span>
        </div>
      </div>

      {!isFileMode && (
        <button
          className={`review-btn ${reviewCount > 0 ? 'has-items' : 'empty'}`}
          onClick={onOpenReview}
          aria-label={`Review öffnen — ${reviewCount} offen`}
        >
          {reviewCount > 0 && (
            <span className="review-badge">{reviewCount > 99 ? '99+' : reviewCount}</span>
          )}
          <span>Review</span>
        </button>
      )}
    </header>
  );
}
