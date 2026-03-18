'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import { MayaRail }        from '@/components/maya/maya-rail';
import { MayaTopbar }      from '@/components/maya/maya-topbar';
import { MayaEmptyState, type ContextAnchorEntry } from '@/components/maya/maya-empty-state';
import { MayaComposer }    from '@/components/maya/maya-composer';
import { MayaReviewSheet } from '@/components/maya/maya-review-sheet';
import { FALLBACK_PROVIDERS } from '@/components/maya/fallback-providers';

type MayaPresenceState = 'idle' | 'thinking' | 'retrieving' | 'streaming';

type StudioMode = 'personal';
type ModelRole = 'scout' | 'worker' | 'reasoner' | 'vision_ocr' | 'tts';

type Provider = {
  id: string;
  name: string;
  configured: boolean;
  available: boolean;
  status: 'ready' | 'not_configured' | 'error';
  defaultModel: string;
  models: Array<{
    id: string;
    name: string;
    roles: string[];
    stability: 'stable' | 'preview' | 'alias';
    isDefault: boolean;
    costClass: 'cheap' | 'medium' | 'expensive';
  }>;
};

type RoleDefaults = {
  scout: { providerId: string; modelId: string; label: string } | null;
  worker: { providerId: string; modelId: string; label: string } | null;
  reasoner: { providerId: string; modelId: string; label: string } | null;
  vision: { providerId: string; modelId: string; label: string } | null;
  tts: { providerId: string; modelId: string; label: string } | null;
};

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  provider?: string;
  model?: string;
  tokenInput?: number;
  tokenOutput?: number;
  costCents?: number;
  contextUsed?: boolean;
  createdAt: string;
};

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
  extractStats?: {
    lastRun: string | null;
    eventsExtracted: number;
    conflictsDetected: number;
  };
};

type HealthStatus = {
  status: 'ok' | 'degraded' | 'blocked';
  costToday: number;
  costWeek: number;
  tokensToday: number;
  storeCounts: {
    core: number;
    working: number;
    ephemeral: number;
    event: number;
    signal: number;
    proposed: number;
    conflict: number;
    total: number;
  };
  providerStatus: Record<string, boolean>;
  chatProvider: {
    ready: boolean;
    primaryProvider: string;
    primaryModel: string;
    keyConfigured: boolean;
    isMockMode: boolean;
  };
  roleDefaults?: RoleDefaults;
  extractStatus?: {
    enabled: boolean;
    lastRun: string | null;
    lastLifecycleRun: string | null;
    extractCostToday: number;
  };
  calibrationStatus?: {
    pendingReviews: number;
    reviewCoverageRate: number;
    falsePositiveTrend: 'improving' | 'stable' | 'worsening';
  };
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

type CalibrationMetrics = {
  eventCount: number;
  conflictCount: number;
  proposedCount: number;
  signalCount: number;
  eventUsefulRate: number;
  conflictFalsePositiveRate: number;
  proposedOverreachRate: number;
  reviewCoverageRate: number;
  extractRunsTotal: number;
  extractCostToday: number;
};

type DailySummary = {
  date: string;
  newEventsLearned: number;
  conflictsReal: number;
  conflictsFalsePositive: number;
  proposedUseful: number;
  proposedOverreach: number;
  systemTendency: 'aggressive' | 'balanced' | 'passive';
  reviewCount: number;
};

const MODE_LABELS: Record<StudioMode, string> = {
  personal: 'Personal'
};

const MODE_ICONS: Record<StudioMode, string> = {
  personal: '👤'
};

const MAYA_SETTINGS_KEY = 'maya-settings';

const TIER_LABELS: Record<string, string> = {
  event: 'Event',
  signal: 'Signal',
  proposed: 'Vorgeschlagen',
  conflict: 'Konflikt'
};

const FALSE_POSITIVE_TREND_LABELS: Record<'improving' | 'stable' | 'worsening', string> = {
  improving: 'verbessert',
  stable: 'stabil',
  worsening: 'kritisch'
};

const SYSTEM_TENDENCY_LABELS: Record<'aggressive' | 'balanced' | 'passive', string> = {
  aggressive: 'aggressiv',
  balanced: 'balanciert',
  passive: 'passiv'
};

type MayaSettings = {
  mode: StudioMode;
  role: ModelRole;
  provider: string;
  model: string;
};

function loadSettings(): MayaSettings | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(MAYA_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSettings(settings: MayaSettings) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MAYA_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function MayaChatScreen() {
  const [savedSettings] = useState(() => loadSettings());
  const [mode, setMode] = useState<StudioMode>(() => savedSettings?.mode || 'personal');
  const [role, setRole] = useState<ModelRole>(() => savedSettings?.role || 'worker');
  const [provider, setProvider] = useState<string>(() => savedSettings?.provider || 'mock');
  const [model, setModel] = useState<string>(() => savedSettings?.model || 'mock');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [roleDefaults, setRoleDefaults] = useState<RoleDefaults | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [showReviewSheet, setShowReviewSheet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capabilityNotice, setCapabilityNotice] = useState<string | null>(null);
  // Phase 1C: Calibration state
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([]);
  const [calibration, setCalibration] = useState<CalibrationMetrics | null>(null);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [briefingTab, setBriefingTab] = useState<'review' | 'metrics' | 'activity'>('review');

  // Phase B: Presence state + streaming simulation
  const [mayaState, setMayaState] = useState<MayaPresenceState>('idle');
  const [streamingText, setStreamingText] = useState('');
  const [topbarMetaOpen, setTopbarMetaOpen] = useState(false);
  const [contextAnchors, setContextAnchors] = useState<ContextAnchorEntry[]>([]);
  const feedRef = useRef<HTMLDivElement>(null);

  // Persist settings on change
  useEffect(() => {
    saveSettings({ mode, role, provider, model });
  }, [mode, role, provider, model]);

  // Load providers — with explicit response.ok guard + empty-payload fallback
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/maya/providers');
        if (!res.ok) {
          setProviders(FALLBACK_PROVIDERS as Provider[]);
          return;
        }
        const data = await res.json().catch(() => null);
        if (!data || !Array.isArray(data.providers) || data.providers.length === 0) {
          setProviders(FALLBACK_PROVIDERS as Provider[]);
          return;
        }
        setProviders(data.providers);
        setRoleDefaults(data.roleDefaults || null);
        if (!savedSettings?.provider && data.roleDefaults?.worker) {
          setProvider(data.roleDefaults.worker.providerId);
          setModel(data.roleDefaults.worker.modelId);
        } else if (!savedSettings?.provider) {
          setProvider(data.providers[0].id);
          setModel(data.providers[0].defaultModel);
        }
      } catch {
        setProviders(FALLBACK_PROVIDERS as Provider[]);
      }
    })();
  }, []);

  // Load briefing and health
  const loadBriefingAndHealth = useCallback(async () => {
    try {
      const [briefingRes, healthRes, queueRes, calRes, summaryRes] = await Promise.all([
        fetch(`/api/maya/briefing?mode=${mode}`),
        fetch('/api/maya/health'),
        fetch('/api/maya/review?action=queue&unresolved=true&limit=10'),
        fetch('/api/maya/calibration'),
        fetch('/api/maya/summary/daily')
      ]);

      const [briefingData, healthData, queueData, calData, summaryData] = await Promise.all([
        briefingRes.json().catch(() => null),
        healthRes.json().catch(() => null),
        queueRes.json().catch(() => null),
        calRes.json().catch(() => null),
        summaryRes.json().catch(() => null)
      ]);

      const responses = [briefingRes, healthRes, queueRes, calRes, summaryRes];
      const payloads = [briefingData, healthData, queueData, calData, summaryData];
      const capabilityBlocked = responses.some((response, index) => response.status === 503 && payloads[index]?.code === 'not_available_in_file_mode');

      if (capabilityBlocked) {
        setCapabilityNotice('Lokaler Dateimodus · Briefing und Review nicht verfügbar');
        setBriefing(null);
        setReviewQueue([]);
        setCalibration(null);
        setDailySummary(null);
        // Still set health if available — needed for isMockMode flag in Topbar/Composer
        if (healthRes.ok && healthData) setHealth(healthData);
        return;
      }

      setCapabilityNotice(null);

      if (briefingRes.ok && briefingData) {
        setBriefing(briefingData.briefing);
        // Extract context anchors for Empty State (only real data, never mock)
        if (briefingData.context?.anchors && Array.isArray(briefingData.context.anchors)) {
          const anchors: ContextAnchorEntry[] = briefingData.context.anchors
            .slice(0, 3)
            .map((a: { tier?: string; topic?: string; content?: string }) => ({
              tier: (a.tier === 'anchor' ? 'anchor' : 'active') as 'anchor' | 'active',
              label: a.topic || a.content?.slice(0, 60) || ''
            }))
            .filter((a: ContextAnchorEntry) => a.label);
          setContextAnchors(anchors);
        }
      }

      if (healthRes.ok && healthData) {
        setHealth(healthData);
      }

      if (queueRes.ok && queueData) {
        setReviewQueue(queueData.queue || []);
      }

      if (calRes.ok && calData) {
        setCalibration(calData.metrics);
      }

      if (summaryRes.ok && summaryData) {
        setDailySummary(summaryData.summary);
      }
    } catch {
      // Silent fail for background data
    }
  }, [mode]);

  useEffect(() => {
    loadBriefingAndHealth();
  }, [loadBriefingAndHealth]);

  // Get current provider's models filtered by role
  const currentProvider = providers.find(p => p.id === provider);
  const availableModels = (currentProvider?.models || []).filter(m => 
    m.roles.includes(role) || m.roles.length === 0
  );

  // Streaming simulation — variable chunks (2-4 words), variable timing (35-80ms)
  // Per Handoff v4.3 §5 (Fallback). Variable rhythm prevents theatrical feel.
  const simulateStream = useCallback(async (
    text: string,
    onChunk: (partial: string) => void
  ): Promise<void> => {
    const words = text.split(' ');
    const chunks: string[] = [];
    let i = 0;
    while (i < words.length) {
      const size = 2 + Math.floor(Math.random() * 3); // 2, 3 or 4 words
      chunks.push(words.slice(i, i + size).join(' '));
      i += size;
    }
    let displayed = '';
    for (let c = 0; c < chunks.length; c++) {
      // Slightly longer pauses at sentence boundaries
      const isSentenceEnd = /[.!?]$/.test(chunks[c]);
      const delay = isSentenceEnd
        ? 100 + Math.random() * 60
        : 35 + Math.random() * 45;
      await new Promise<void>(resolve => setTimeout(resolve, delay));
      displayed += (c > 0 ? ' ' : '') + chunks[c];
      onChunk(displayed);
      if (feedRef.current) {
        feedRef.current.scrollTop = feedRef.current.scrollHeight;
      }
    }
  }, []);

  // Send message with Presence-State machine + streaming simulation
  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = overrideText ?? input;
    if (!text.trim() || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);
    setMayaState('thinking');

    try {
      const res = await fetch('/api/maya/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          provider,
          model,
          role,
          studioMode: mode
        })
      });

      const data = await res.json();

      if (res.status === 503 && data?.code === 'not_available_in_file_mode') {
        // Local stub — neutral, no file-mode repetition (topbar + notice already show it)
        const stubText = 'Ich bin noch ohne Anbieter. Sobald du einen API-Key konfigurierst, kann ich wirklich antworten.';
        setMayaState('streaming');
        await simulateStream(stubText, (partial) => setStreamingText(partial));
        setStreamingText('');
        setMessages(prev => [...prev, {
          id: `stub-${Date.now()}`,
          role: 'assistant' as const,
          content: stubText,
          createdAt: new Date().toISOString()
        }]);
        return;
      }

      if (data.blocked) {
        setError(data.message?.content || 'Anfrage wurde blockiert');
      } else if (data.message) {
        // Streaming simulation — thinking → streaming → idle
        setMayaState('streaming');
        await simulateStream(data.message.content, (partial) => {
          setStreamingText(partial);
        });
        setStreamingText('');

        setMessages(prev => [...prev, {
          id: data.message.id,
          role: data.message.role,
          content: data.message.content,
          provider: data.message.provider,
          model: data.message.model,
          tokenInput: data.message.tokenInput,
          tokenOutput: data.message.tokenOutput,
          costCents: data.message.costCents,
          contextUsed: data.contextUsed,
          createdAt: data.message.createdAt
        }]);
      }

      loadBriefingAndHealth();
    } catch {
      setError('Nachricht konnte nicht gesendet werden');
    } finally {
      setLoading(false);
      setMayaState('idle');
    }
  }, [input, loading, messages, provider, model, role, mode, simulateStream, loadBriefingAndHealth]);

  // Confirm proposed memory
  const confirmProposed = async (entityId: string) => {
    try {
      await fetch('/api/maya/memory/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryId: entityId })
      });
      loadBriefingAndHealth();
    } catch {
      setError('Memory konnte nicht bestätigt werden');
    }
  };

  // Deny proposed memory
  const denyProposed = async (entityId: string) => {
    try {
      await fetch('/api/maya/memory/deny', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryId: entityId })
      });
      loadBriefingAndHealth();
    } catch {
      setError('Memory konnte nicht abgelehnt werden');
    }
  };

  // Phase 1C: Submit review
  const submitReview = async (memoryEntryId: string, tier: string, label: string) => {
    try {
      const reviewType = tier === 'conflict' ? 'conflict' : tier === 'proposed' ? 'proposed' : tier === 'signal' ? 'signal' : 'event';
      await fetch('/api/maya/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memoryEntryId,
          entryTier: tier,
          reviewType,
          reviewLabel: label
        })
      });
      loadBriefingAndHealth();
    } catch {
      setError('Review konnte nicht übermittelt werden');
    }
  };

  // Derived state
  const reviewCount =
    (reviewQueue?.length ?? 0) +
    (briefing?.openProposed?.length ?? 0) +
    (briefing?.conflicts?.length ?? 0);
  const isFileMode = !!capabilityNotice;

  const handleProviderChange = (newProviderId: string) => {
    setProvider(newProviderId);
    const prov = providers.find(p => p.id === newProviderId);
    if (prov) setModel(prov.defaultModel);
  };

  // Scroll feed to bottom when messages change
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="maya-shell">

      <MayaRail onOpenReview={() => setShowReviewSheet(true)} />

      <div className="maya-main">
        <MayaTopbar
          mayaState={mayaState}
          provider={provider}
          model={model}
          providers={providers}
          health={health}
          reviewCount={reviewCount}
          topbarMetaOpen={topbarMetaOpen}
          isFileMode={isFileMode}
          onToggleMeta={() => setTopbarMetaOpen(v => !v)}
          onProviderChange={handleProviderChange}
          onModelChange={setModel}
          onOpenReview={() => setShowReviewSheet(true)}
        />

        <div className="maya-feed" ref={feedRef}>
          {messages.length === 0 && !loading ? (
            <MayaEmptyState
              onSendStarter={(text) => sendMessage(text)}
              anchors={contextAnchors}
              isFileMode={isFileMode}
            />
          ) : (
            <>
              {messages.map(msg => (
                <div key={msg.id} className={`maya-message ${msg.role}`}>
                  <div className="msg-bubble">
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                    {msg.role === 'assistant' && (msg.provider || msg.model) && (
                      <div className="msg-meta">
                        {msg.contextUsed && <span className="msg-chip">🧠 Kontext</span>}
                        {msg.provider && <span className="msg-chip">{msg.provider}</span>}
                        {msg.model && <span className="msg-chip">{msg.model}</span>}
                        {msg.costCents !== undefined && msg.costCents > 0 && (
                          <span>{msg.costCents}¢</span>
                        )}
                        {msg.tokenInput !== undefined && msg.tokenOutput !== undefined && (
                          <span>{msg.tokenInput + msg.tokenOutput} tok</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {mayaState === 'streaming' && streamingText && (
                <div className="maya-message assistant">
                  <div className="msg-bubble">
                    <span style={{ whiteSpace: 'pre-wrap' }}>{streamingText}</span>
                    <span className="stream-cursor" />
                  </div>
                </div>
              )}

              {mayaState === 'thinking' && !streamingText && (
                <div className="thinking-indicator">
                  <div className="think-dot" />
                  <div className="think-dot" />
                  <div className="think-dot" />
                </div>
              )}
            </>
          )}
        </div>

        <MayaComposer
          value={input}
          onChange={setInput}
          onSend={() => sendMessage()}
          disabled={loading}
          capabilityNotice={
            messages.length === 0
              ? (capabilityNotice ||
                 (health?.chatProvider?.isMockMode ? 'Lokaler Dateimodus · Antworten sind simuliert' : null))
              : null
          }
          error={error}
        />
      </div>

      {showReviewSheet && (
        <MayaReviewSheet
          briefing={briefing}
          reviewQueue={reviewQueue}
          health={health}
          onClose={() => setShowReviewSheet(false)}
          onConfirmProposed={confirmProposed}
          onDenyProposed={denyProposed}
          onSubmitReview={submitReview}
        />
      )}
    </div>
  );
}