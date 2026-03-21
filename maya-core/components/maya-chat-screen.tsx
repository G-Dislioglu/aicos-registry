'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import { MayaRail }        from '@/components/maya/maya-rail';
import { MayaTopbar }      from '@/components/maya/maya-topbar';
import { MayaEmptyState, type ContextAnchorEntry } from '@/components/maya/maya-empty-state';
import { MayaComposer }    from '@/components/maya/maya-composer';
import { MayaReviewSheet } from '@/components/maya/maya-review-sheet';
import { FALLBACK_PROVIDERS } from '@/components/maya/fallback-providers';
import { type WorkMode, detectWorkMode, generateLocalResponse } from '@/components/maya/maya-local-response';
import { formatMayaTimestamp } from '@/lib/maya-date';
import { buildActiveCheckpointBoard, buildActiveThreadHandoff, buildActiveWorkrun, buildContinuityBriefing, buildDerivedWorkspaceContext, buildPersistedCheckpointBoard, buildPersistedThreadHandoff, buildPersistedWorkrun, buildPersistedWorkspaceContext, buildResumeActions, buildThreadDigest } from '@/lib/maya-thread-digest';
import { type ChatSession, type MayaCheckpoint, type MayaCheckpointBoard, type MayaStore, type MayaThreadHandoff, type MayaWorkspaceContext, type MayaWorkrun, type ThreadDigest } from '@/lib/types';

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

const MAYA_THREAD_TITLE_LIMIT = 72;
const DIGEST_STALE_MESSAGE_THRESHOLD = 8;

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

function buildMayaThreadSession(messages: Message[]): ChatSession {
  const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user');
  const digestMessages = messages.filter(
    (message): message is Message & { role: 'user' | 'assistant' } => message.role === 'user' || message.role === 'assistant'
  );

  return {
    id: 'maya-live-thread',
    title: latestUserMessage?.content || 'Maya Fadenkompass',
    intent: latestUserMessage?.content || '',
    messages: digestMessages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: message.createdAt
    }))
  };
}

function buildThreadTitle(messages: Message[]) {
  const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user');
  const fallbackMessage = latestUserMessage || messages.find((message) => message.role === 'assistant' || message.role === 'user');
  const rawTitle = fallbackMessage?.content.trim() || 'Neuer Maya-Thread';

  return rawTitle.length > MAYA_THREAD_TITLE_LIMIT
    ? `${rawTitle.slice(0, MAYA_THREAD_TITLE_LIMIT).trimEnd()}…`
    : rawTitle;
}

function toSessionIntent(messages: Message[]) {
  const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user');
  return latestUserMessage?.content.trim() || '';
}

function toStoredMessage(message: Message): ChatSession['messages'][number] {
  return {
    id: message.id,
    role: message.role === 'user' ? 'user' : 'assistant',
    content: message.content,
    timestamp: message.createdAt
  };
}

function hydrateSessionMessages(session: ChatSession): Message[] {
  return session.messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.timestamp
  }));
}

function createEmptyMayaSession(): ChatSession {
  const timestamp = new Date().toISOString();

  return {
    id: `maya-thread-${Date.now()}`,
    title: 'Neuer Maya-Thread',
    intent: '',
    messages: [],
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function buildWorkspaceAnchorSession(
  selectedWorkspace: MayaWorkspaceContext | null,
  activeSession: ChatSession | null,
  sessions: ChatSession[]
) {
  if (!selectedWorkspace) {
    return activeSession;
  }

  if (activeSession && (activeSession.workspaceId === selectedWorkspace.id || selectedWorkspace.threadIds.includes(activeSession.id))) {
    return activeSession;
  }

  return sessions.find((session) => selectedWorkspace.threadIds.includes(session.id)) || activeSession;
}

function upsertWorkspaceContext(
  workspaces: MayaWorkspaceContext[],
  workspace: MayaWorkspaceContext
) {
  const nextWorkspace = {
    ...workspace,
    threadIds: Array.from(new Set(workspace.threadIds))
  };

  if (workspaces.some((entry) => entry.id === nextWorkspace.id)) {
    return workspaces.map((entry) => (entry.id === nextWorkspace.id ? nextWorkspace : entry));
  }

  return [nextWorkspace, ...workspaces];
}

function syncWorkspaceThreadAssignment(
  workspaces: MayaWorkspaceContext[],
  sessionId: string,
  nextWorkspace?: MayaWorkspaceContext,
  nextWorkspaceId?: string | null
) {
  const targetWorkspaceId = nextWorkspace?.id || nextWorkspaceId || null;
  const baseWorkspaces = workspaces.map((workspace) => ({
    ...workspace,
    threadIds: workspace.id === targetWorkspaceId
      ? Array.from(new Set([...workspace.threadIds, sessionId]))
      : workspace.threadIds.filter((threadId) => threadId !== sessionId)
  }));

  if (!nextWorkspace) {
    return baseWorkspaces;
  }

  return upsertWorkspaceContext(baseWorkspaces, {
    ...nextWorkspace,
    threadIds: Array.from(new Set([...(nextWorkspace.threadIds || []), sessionId]))
  });
}

function buildWorkspaceIdFromTitle(title: string) {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug ? `workspace-${slug}` : `workspace-${Date.now()}`;
}

function isBoilerplateMayaSurfaceSignal(value: string | null | undefined) {
  const normalized = normalizeMayaSurfaceSignal(value);

  if (!normalized) {
    return true;
  }

  return [
    'hier ist die kürzeste nützliche lesart',
    'ich brauche noch etwas mehr konkretion um dir wirklich gut zu helfen',
    'frag mich zum beispiel nach einem klareren nächsten schritt',
    'ich bin maya ich helfe dir dabei laufende arbeit klarer zu sehen'
  ].some((entry) => normalized.includes(entry));
}

function normalizeMayaSurfaceSignal(value: string | null | undefined) {
  return (value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/^[^a-z0-9äöüß]+|[^a-z0-9äöüß]+$/gi, '')
    .replace(/lass uns direkt damit weitermachen:\s*/i, '')
    .replace(/lass uns diesen offenen punkt jetzt weiterführen:\s*/i, '')
    .replace(/fasse kurz zusammen, wo wir gerade stehen, und führe dann diesen thread weiter:\s*/i, '')
    .replace(/daran als nächstes anknüpfen:\s*/i, '')
    .replace(/hier ist die kürzeste nützliche lesart:\s*/i, '');
}

function isDistinctMayaSurfaceSignal(candidate: string | null | undefined, references: Array<string | null | undefined>) {
  const normalizedCandidate = normalizeMayaSurfaceSignal(candidate);
  if (!normalizedCandidate) {
    return false;
  }

  return references.every((reference) => {
    const normalizedReference = normalizeMayaSurfaceSignal(reference);

    if (!normalizedReference) {
      return true;
    }

    if (normalizedReference === normalizedCandidate) {
      return false;
    }

    const hasLongOverlap = normalizedCandidate.length >= 24 && normalizedReference.length >= 24;
    if (hasLongOverlap && (normalizedCandidate.includes(normalizedReference) || normalizedReference.includes(normalizedCandidate))) {
      return false;
    }

    return true;
  });
}

function collectDistinctMayaSurfaceSignals(
  values: Array<string | null | undefined>,
  references: Array<string | null | undefined>,
  limit?: number
) {
  const distinct: string[] = [];

  for (const value of values) {
    if (isBoilerplateMayaSurfaceSignal(value)) {
      continue;
    }

    if (!isDistinctMayaSurfaceSignal(value, [...references, ...distinct])) {
      continue;
    }

    distinct.push(value!.trim());
    if (limit && distinct.length >= limit) {
      break;
    }
  }

  return distinct;
}

function buildPersistedSession(
  baseSession: ChatSession,
  messages: Message[],
  digest: ThreadDigest | null,
  workrun?: MayaWorkrun,
  checkpointBoard?: MayaCheckpointBoard,
  handoff?: MayaThreadHandoff,
  workspaceId?: string | null
): ChatSession {
  const timestamp = new Date().toISOString();

  return {
    ...baseSession,
    title: buildThreadTitle(messages),
    intent: toSessionIntent(messages),
    messages: messages
      .filter((message) => message.role === 'user' || message.role === 'assistant')
      .map((message) => toStoredMessage(message)),
    digest: digest ? { ...digest } : undefined,
    workrun: workrun ? { ...workrun } : baseSession.workrun,
    checkpointBoard: checkpointBoard ? {
      ...checkpointBoard,
      checkpoints: checkpointBoard.checkpoints.map((checkpoint) => ({ ...checkpoint }))
    } : baseSession.checkpointBoard,
    handoff: handoff ? {
      ...handoff,
      openItems: [...handoff.openItems]
    } : baseSession.handoff,
    workspaceId: workspaceId === undefined ? baseSession.workspaceId || null : workspaceId,
    createdAt: baseSession.createdAt || timestamp,
    updatedAt: timestamp
  };
}

export function MayaChatScreen() {
  const [savedSettings] = useState(() => loadSettings());
  const [mode, setMode] = useState<StudioMode>(() => savedSettings?.mode || 'personal');
  const [role, setRole] = useState<ModelRole>(() => savedSettings?.role || 'worker');
  const [provider, setProvider] = useState<string>(() => savedSettings?.provider || 'mock');
  const [model, setModel] = useState<string>(() => savedSettings?.model || 'mock');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [roleDefaults, setRoleDefaults] = useState<RoleDefaults | null>(null);
  const [sessionState, setSessionState] = useState<MayaStore | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
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
  const [threadDigest, setThreadDigest] = useState<ThreadDigest | null>(null);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const [manualWorkrunFocus, setManualWorkrunFocus] = useState<string | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);

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

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/state');
        if (!res.ok) {
          setSessionsLoaded(true);
          return;
        }

        const data = await res.json().catch(() => null);
        const state = data?.state as MayaStore | undefined;

        if (!state || !Array.isArray(state.sessions) || state.sessions.length === 0) {
          setSessionsLoaded(true);
          return;
        }

        const currentSession = state.sessions.find((session) => session.id === state.activeSessionId) || state.sessions[0];

        setSessionState(state);
        setActiveSessionId(currentSession.id);
        setActiveWorkspaceId(state.activeWorkspaceId || currentSession.workspaceId || null);
        setMessages(hydrateSessionMessages(currentSession));
        setThreadDigest(currentSession.digest || null);
        setManualWorkrunFocus(null);
      } catch {
        // Keep Maya usable even when persisted state cannot be read.
      } finally {
        setSessionsLoaded(true);
      }
    })();
  }, []);

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

  const persistSessionState = useCallback(async (nextState: MayaStore) => {
    setSessionState(nextState);

    try {
      await fetch('/api/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: nextState })
      });
    } catch {
      // Keep the Maya thread locally visible even if persistence write fails.
    }
  }, []);

  const visibleSessions = sessionState?.sessions || [];
  const visibleWorkspaces = sessionState?.workspaces || [];
  const activeSession = visibleSessions.find((session) => session.id === activeSessionId) || visibleSessions[0] || null;
  const selectedWorkspace = activeWorkspaceId
    ? visibleWorkspaces.find((workspace) => workspace.id === activeWorkspaceId) || null
    : null;
  const workspaceAnchorSession = buildWorkspaceAnchorSession(selectedWorkspace, activeSession, visibleSessions);
  const continuityBriefing = activeSession ? buildContinuityBriefing(activeSession) : null;
  const resumeActions = buildResumeActions(continuityBriefing || undefined);
  const derivedWorkrun = activeSession ? buildActiveWorkrun(activeSession, continuityBriefing || undefined, resumeActions) : null;
  const activeWorkrun = derivedWorkrun
    ? {
        ...derivedWorkrun,
        focus: manualWorkrunFocus || derivedWorkrun.focus
      }
    : null;
  const activeCheckpointBoard = activeSession ? buildActiveCheckpointBoard(activeSession, continuityBriefing || undefined, resumeActions, activeWorkrun || undefined) : null;
  const activeThreadHandoff = activeSession ? buildActiveThreadHandoff(activeSession, continuityBriefing || undefined, activeWorkrun || undefined, activeCheckpointBoard || undefined) : null;
  const assignedWorkspace = workspaceAnchorSession?.workspaceId
    ? visibleWorkspaces.find((workspace) => workspace.id === workspaceAnchorSession.workspaceId) || null
    : null;
  const activeWorkspace = workspaceAnchorSession
    ? buildDerivedWorkspaceContext(
        workspaceAnchorSession,
        selectedWorkspace || assignedWorkspace || undefined,
        workspaceAnchorSession.id === activeSession?.id ? continuityBriefing || undefined : buildContinuityBriefing(workspaceAnchorSession),
        workspaceAnchorSession.id === activeSession?.id
          ? activeWorkrun || undefined
          : buildActiveWorkrun(workspaceAnchorSession, buildContinuityBriefing(workspaceAnchorSession), buildResumeActions(buildContinuityBriefing(workspaceAnchorSession))),
        workspaceAnchorSession.id === activeSession?.id
          ? activeCheckpointBoard || undefined
          : buildActiveCheckpointBoard(
              workspaceAnchorSession,
              buildContinuityBriefing(workspaceAnchorSession),
              buildResumeActions(buildContinuityBriefing(workspaceAnchorSession)),
              buildActiveWorkrun(workspaceAnchorSession, buildContinuityBriefing(workspaceAnchorSession), buildResumeActions(buildContinuityBriefing(workspaceAnchorSession)))
            ),
        workspaceAnchorSession.id === activeSession?.id
          ? activeThreadHandoff || undefined
          : buildActiveThreadHandoff(
              workspaceAnchorSession,
              buildContinuityBriefing(workspaceAnchorSession),
              buildActiveWorkrun(workspaceAnchorSession, buildContinuityBriefing(workspaceAnchorSession), buildResumeActions(buildContinuityBriefing(workspaceAnchorSession))),
              buildActiveCheckpointBoard(
                workspaceAnchorSession,
                buildContinuityBriefing(workspaceAnchorSession),
                buildResumeActions(buildContinuityBriefing(workspaceAnchorSession)),
                buildActiveWorkrun(workspaceAnchorSession, buildContinuityBriefing(workspaceAnchorSession), buildResumeActions(buildContinuityBriefing(workspaceAnchorSession)))
              )
            )
      )
  : null;
  const relatedWorkspaceThreads = activeWorkspace
    ? visibleSessions.filter((session) => activeWorkspace.threadIds.includes(session.id))
    : [];

  const activeWorkspaceUpdatedAtLabel = formatMayaTimestamp(activeWorkspace?.updatedAt);
  const activeWorkrunUpdatedAtLabel = formatMayaTimestamp(activeWorkrun?.updatedAt);
  const activeThreadHandoffUpdatedAtLabel = formatMayaTimestamp(activeThreadHandoff?.updatedAt);
  const continuityBriefingUpdatedAtLabel = formatMayaTimestamp(continuityBriefing?.lastUpdatedAt);
  const threadDigestUpdatedAtLabel = formatMayaTimestamp(threadDigest?.updatedAt);
  const primaryFocus = activeWorkrun?.focus || continuityBriefing?.focus || activeWorkspace?.focus || activeSession?.intent || activeSession?.title || null;
  const primaryNextStep = activeWorkrun?.nextStep || activeThreadHandoff?.nextEntry || continuityBriefing?.nextStep || activeWorkspace?.nextMilestone || null;
  const primaryOpenPoint = activeThreadHandoff?.openItems[0] || activeWorkspace?.openItems[0] || continuityBriefing?.openLoops[0] || null;
  const workspaceOpenItems = collectDistinctMayaSurfaceSignals(
    activeWorkspace?.openItems || [],
    [primaryOpenPoint, activeWorkrun?.focus, activeWorkrun?.nextStep, activeThreadHandoff?.nextEntry, continuityBriefing?.nextStep],
    2
  );
  const briefingOpenLoops = collectDistinctMayaSurfaceSignals(
    continuityBriefing?.openLoops || [],
    [
      primaryOpenPoint,
      ...(activeThreadHandoff?.openItems || []),
      ...(activeWorkspace?.openItems || []),
      activeWorkrun?.focus,
      activeWorkrun?.nextStep,
      activeThreadHandoff?.nextEntry
    ],
    2
  );
  const secondaryResumeActions = resumeActions.reduce<typeof resumeActions>((actions, action) => {
    if (!isDistinctMayaSurfaceSignal(action.prompt, [primaryNextStep, primaryOpenPoint, primaryFocus, activeWorkrun?.lastOutput, ...actions.map((entry) => entry.prompt)])) {
      return actions;
    }

    if (actions.some((entry) => entry.source === action.source)) {
      return actions;
    }

    actions.push(action);
    return actions;
  }, []).slice(0, 2);
  const handoffOpenItems = collectDistinctMayaSurfaceSignals(
    activeThreadHandoff?.openItems || [],
    [primaryOpenPoint, activeWorkrun?.focus, activeWorkrun?.lastOutput, activeWorkrun?.nextStep, activeThreadHandoff?.achieved, activeWorkspace?.currentState, activeWorkspace?.nextMilestone],
    2
  );
  const showWorkspaceOpenItems = workspaceOpenItems.length > 0;
  const workspaceMilestoneAddsSignal = isDistinctMayaSurfaceSignal(activeWorkspace?.nextMilestone, [primaryNextStep, primaryFocus]);
  const workspaceStateAddsSignal = isDistinctMayaSurfaceSignal(activeWorkspace?.currentState, [activeWorkrun?.lastOutput, activeThreadHandoff?.achieved, continuityBriefing?.currentState]);
  const handoffHasDistinctAchieved = isDistinctMayaSurfaceSignal(activeThreadHandoff?.achieved, [activeWorkrun?.lastOutput, continuityBriefing?.currentState, activeWorkspace?.currentState]);
  const handoffHasDistinctNextEntry = isDistinctMayaSurfaceSignal(activeThreadHandoff?.nextEntry, [primaryNextStep, activeWorkrun?.nextStep]);
  const briefingHasDistinctFocus = isDistinctMayaSurfaceSignal(continuityBriefing?.focus, [primaryFocus, activeWorkspace?.focus]);
  const briefingHasDistinctCurrentState = isDistinctMayaSurfaceSignal(continuityBriefing?.currentState, [activeWorkrun?.lastOutput, activeThreadHandoff?.achieved, activeWorkspace?.currentState]);
  const briefingHasDistinctNextStep = isDistinctMayaSurfaceSignal(continuityBriefing?.nextStep, [primaryNextStep, activeThreadHandoff?.nextEntry]);
  const showActiveHandoffSection = Boolean(
    activeThreadHandoff && (
      handoffHasDistinctNextEntry ||
      (handoffHasDistinctAchieved && handoffOpenItems.length > 0)
    )
  );
  const showHandoffSection = Boolean(
    activeThreadHandoff && (
      activeThreadHandoff.status === 'paused' ||
      activeThreadHandoff.status === 'completed' ||
      showActiveHandoffSection
    )
  );
  const showContinuityResumeActions = Boolean(
    secondaryResumeActions.length > 0 && (
      briefingHasDistinctNextStep ||
      briefingOpenLoops.length > 0 ||
      briefingHasDistinctFocus
    )
  );
  const showContinuityBriefing = Boolean(
    continuityBriefing && (
      briefingHasDistinctNextStep ||
      (briefingHasDistinctFocus && briefingHasDistinctCurrentState) ||
      ((briefingHasDistinctFocus || briefingHasDistinctCurrentState) && briefingOpenLoops.length > 0)
    )
  );
  const digestOpenLoops = collectDistinctMayaSurfaceSignals(
    threadDigest?.openLoops || [],
    [primaryOpenPoint, ...(activeThreadHandoff?.openItems || []), ...(activeWorkspace?.openItems || []), ...(continuityBriefing?.openLoops || [])],
    2
  );
  const digestHasDistinctSummary = isDistinctMayaSurfaceSignal(threadDigest?.summary, [primaryFocus, continuityBriefing?.focus, activeWorkspace?.focus]);
  const digestHasDistinctCurrentState = isDistinctMayaSurfaceSignal(threadDigest?.currentState, [activeWorkrun?.lastOutput, continuityBriefing?.currentState, activeThreadHandoff?.achieved]);
  const digestHasDistinctNextEntry = isDistinctMayaSurfaceSignal(threadDigest?.nextEntry, [primaryNextStep, continuityBriefing?.nextStep, activeThreadHandoff?.nextEntry]);

  const persistCurrentSession = useCallback(async (
    nextMessages: Message[],
    nextDigest: ThreadDigest | null,
    nextWorkrun?: MayaWorkrun,
    nextCheckpointBoard?: MayaCheckpointBoard,
    nextHandoff?: MayaThreadHandoff,
    nextWorkspaceId?: string | null,
    nextWorkspace?: MayaWorkspaceContext
  ) => {
    if (!sessionState || !activeSessionId) {
      return;
    }

    const activeSession = sessionState.sessions.find((session) => session.id === activeSessionId);
    if (!activeSession) {
      return;
    }

    const resolvedWorkspaceId = nextWorkspace?.id || nextWorkspaceId;
    const persistedSession = buildPersistedSession(activeSession, nextMessages, nextDigest, nextWorkrun, nextCheckpointBoard, nextHandoff, resolvedWorkspaceId);
    const nextState: MayaStore = {
      ...sessionState,
      workspaces: syncWorkspaceThreadAssignment(sessionState.workspaces || [], activeSession.id, nextWorkspace, resolvedWorkspaceId),
      sessions: sessionState.sessions.map((session) => (session.id === activeSessionId ? persistedSession : session)),
      activeSessionId,
      activeWorkspaceId: resolvedWorkspaceId || sessionState.activeWorkspaceId || null
    };

    setActiveWorkspaceId(nextState.activeWorkspaceId);
    await persistSessionState(nextState);
  }, [sessionState, activeSessionId, persistSessionState]);

  const persistWorkspaceForActiveSession = useCallback(async (
    update: Partial<Pick<MayaWorkspaceContext, 'id' | 'title' | 'focus' | 'goal' | 'currentState' | 'nextMilestone' | 'source' | 'status'>> & { openItems?: string[]; threadIds?: string[] }
  ) => {
    if (!activeSession || !activeWorkspace) {
      return;
    }

    const nextWorkspace = buildPersistedWorkspaceContext(activeSession, activeWorkspace, update);
    if (!nextWorkspace) {
      return;
    }

    await persistCurrentSession(
      messages,
      threadDigest,
      activeSession.workrun,
      activeSession.checkpointBoard,
      activeSession.handoff,
      nextWorkspace.id,
      nextWorkspace
    );
  }, [activeSession, activeWorkspace, messages, persistCurrentSession, threadDigest]);

  const assignActiveThreadToWorkspace = useCallback(async (workspaceId?: string) => {
    if (!activeSession) {
      return;
    }

    const selectedWorkspace = workspaceId
      ? visibleWorkspaces.find((workspace) => workspace.id === workspaceId) || activeWorkspace || null
      : activeWorkspace || null;

    if (!selectedWorkspace) {
      return;
    }

    const nextWorkspace = buildPersistedWorkspaceContext(activeSession, selectedWorkspace, {
      id: selectedWorkspace.id,
      title: selectedWorkspace.title,
      focus: selectedWorkspace.focus,
      goal: selectedWorkspace.goal,
      currentState: selectedWorkspace.currentState,
      openItems: selectedWorkspace.openItems,
      nextMilestone: selectedWorkspace.nextMilestone,
      status: selectedWorkspace.status,
      source: 'manual',
      threadIds: [...selectedWorkspace.threadIds, activeSession.id]
    });

    if (!nextWorkspace) {
      return;
    }

    await persistCurrentSession(
      messages,
      threadDigest,
      activeSession.workrun,
      activeSession.checkpointBoard,
      activeSession.handoff,
      nextWorkspace.id,
      nextWorkspace
    );
  }, [activeSession, activeWorkspace, visibleWorkspaces, messages, threadDigest, persistCurrentSession]);

  const setActiveWorkspace = useCallback(async (workspaceId: string) => {
    if (!sessionState) {
      return;
    }

    const workspace = visibleWorkspaces.find((entry) => entry.id === workspaceId);
    if (!workspace) {
      return;
    }

    const nextSession = visibleSessions.find((session) => session.id === activeSessionId && session.workspaceId === workspaceId)
      || visibleSessions.find((session) => workspace.threadIds.includes(session.id))
      || activeSession;
    const nextState: MayaStore = {
      ...sessionState,
      activeWorkspaceId: workspaceId,
      activeSessionId: nextSession?.id || sessionState.activeSessionId
    };

    setActiveWorkspaceId(workspaceId);
    if (nextSession) {
      setActiveSessionId(nextSession.id);
      setMessages(hydrateSessionMessages(nextSession));
      setThreadDigest(nextSession.digest || null);
      setManualWorkrunFocus(null);
      setInput('');
      setError(null);
    }
    await persistSessionState(nextState);
  }, [sessionState, visibleWorkspaces, visibleSessions, activeSessionId, activeSession, persistSessionState]);

  const createWorkspace = useCallback(async (seedTitle?: string) => {
    if (!sessionState || !activeSession) {
      return;
    }

    const baseTitle = (seedTitle || input.trim() || activeWorkrun?.focus || activeSession.intent || activeSession.title || 'Neuer Arbeitsraum').trim();
    const nextWorkspace = buildPersistedWorkspaceContext(activeSession, activeWorkspace || undefined, {
      id: buildWorkspaceIdFromTitle(baseTitle),
      title: baseTitle,
      focus: activeWorkrun?.focus || baseTitle,
      goal: activeWorkspace?.goal || activeSession.intent || baseTitle,
      currentState: activeThreadHandoff?.achieved || activeWorkrun?.lastOutput || activeWorkspace?.currentState || '',
      openItems: activeThreadHandoff?.openItems || activeWorkspace?.openItems || [],
      nextMilestone: activeThreadHandoff?.nextEntry || activeWorkrun?.nextStep || activeWorkspace?.nextMilestone || baseTitle,
      status: 'active',
      source: 'manual',
      threadIds: [activeSession.id]
    });

    if (!nextWorkspace) {
      return;
    }

    setActiveWorkspaceId(nextWorkspace.id);
    await persistCurrentSession(
      messages,
      threadDigest,
      activeSession.workrun,
      activeSession.checkpointBoard,
      activeSession.handoff,
      nextWorkspace.id,
      nextWorkspace
    );
  }, [sessionState, activeSession, input, activeWorkrun, activeWorkspace, activeThreadHandoff, messages, threadDigest, persistCurrentSession]);

  const renameActiveWorkspace = useCallback(async (nextTitle?: string) => {
    if (!activeSession || !activeWorkspace) {
      return;
    }

    const title = (nextTitle || input.trim()).trim();
    if (!title) {
      return;
    }

    await persistWorkspaceForActiveSession({
      title,
      focus: activeWorkspace.focus,
      goal: activeWorkspace.goal,
      currentState: activeWorkspace.currentState,
      openItems: activeWorkspace.openItems,
      nextMilestone: activeWorkspace.nextMilestone,
      source: 'manual',
      threadIds: activeWorkspace.threadIds
    });
  }, [activeSession, activeWorkspace, input, persistWorkspaceForActiveSession]);

  const selectThread = useCallback((sessionId: string) => {
    if (!sessionState) {
      return;
    }

    const nextSession = sessionState.sessions.find((session) => session.id === sessionId);
    if (!nextSession) {
      return;
    }

    setActiveSessionId(nextSession.id);
    setActiveWorkspaceId(nextSession.workspaceId || sessionState.activeWorkspaceId || null);
    setMessages(hydrateSessionMessages(nextSession));
    setThreadDigest(nextSession.digest || null);
    setManualWorkrunFocus(null);
    setInput('');
    setError(null);

    void persistSessionState({
      ...sessionState,
      activeSessionId: nextSession.id,
      activeWorkspaceId: nextSession.workspaceId || sessionState.activeWorkspaceId || null
    });
  }, [sessionState, persistSessionState]);

  const clearMessages = useCallback(() => {
    if (!sessionState) {
      return;
    }

    const nextSession = {
      ...createEmptyMayaSession(),
      workspaceId: activeWorkspaceId || null
    };

    setActiveSessionId(nextSession.id);
    setActiveWorkspaceId(activeWorkspaceId || null);
    setMessages([]);
    setThreadDigest(null);
    setManualWorkrunFocus(null);
    setInput('');
    setError(null);

    void persistSessionState({
      ...sessionState,
      workspaces: syncWorkspaceThreadAssignment(sessionState.workspaces || [], nextSession.id, undefined, activeWorkspaceId || null),
      sessions: [nextSession, ...sessionState.sessions],
      activeSessionId: nextSession.id,
      activeWorkspaceId: activeWorkspaceId || sessionState.activeWorkspaceId || null
    });
  }, [sessionState, persistSessionState, activeWorkspaceId]);

  const refreshThreadDigest = useCallback(() => {
    const digestSource = buildMayaThreadSession(messages);
    const nextDigest = buildThreadDigest(digestSource);

    setThreadDigest(nextDigest || null);
    const nextWorkspace = activeSession && activeWorkspace
      ? buildPersistedWorkspaceContext(activeSession, activeWorkspace, {
          currentState: activeThreadHandoff?.achieved || activeWorkrun?.lastOutput || nextDigest?.currentState || activeWorkspace.currentState,
          openItems: activeThreadHandoff?.openItems || activeWorkspace.openItems,
          nextMilestone: activeThreadHandoff?.nextEntry || activeWorkrun?.nextStep || nextDigest?.nextEntry || activeWorkspace.nextMilestone,
          threadIds: activeWorkspace.threadIds,
          source: activeWorkspace.source
        })
      : undefined;
    void persistCurrentSession(messages, nextDigest || null, activeSession?.workrun, activeSession?.checkpointBoard, activeSession?.handoff, activeSession?.workspaceId, nextWorkspace);
  }, [messages, persistCurrentSession, activeSession, activeWorkspace, activeThreadHandoff, activeWorkrun]);

  const updateActiveWorkrun = useCallback(async (update: Partial<Pick<MayaWorkrun, 'focus' | 'status' | 'lastOutput' | 'lastStep' | 'nextStep' | 'source'>>) => {
    if (!activeSession) {
      return;
    }

    const currentWorkrun = buildActiveWorkrun(activeSession, buildContinuityBriefing(activeSession), buildResumeActions(buildContinuityBriefing(activeSession)));
    const nextWorkrun = buildPersistedWorkrun(activeSession, currentWorkrun, update);

    if (!nextWorkrun) {
      return;
    }

    setManualWorkrunFocus(nextWorkrun.focus);
    const nextBoard = buildPersistedCheckpointBoard(activeSession, activeCheckpointBoard || undefined, {
      focus: nextWorkrun.focus,
      source: update.source || activeCheckpointBoard?.source || 'manual'
    });
    const nextHandoff = buildPersistedThreadHandoff(activeSession, activeThreadHandoff || undefined, {
      status: update.status === 'completed' ? 'completed' : activeThreadHandoff?.status || 'active',
      achieved: update.status === 'completed'
        ? nextWorkrun.lastOutput || activeThreadHandoff?.achieved || activeSession.digest?.currentState || ''
        : activeThreadHandoff?.achieved || '',
      nextEntry: nextWorkrun.nextStep,
      openItems: nextBoard?.checkpoints.filter((checkpoint) => checkpoint.status === 'open').map((checkpoint) => checkpoint.label) || activeThreadHandoff?.openItems || [],
      source: update.source || activeThreadHandoff?.source || 'manual'
    });
    const nextWorkspace = activeWorkspace
      ? buildPersistedWorkspaceContext(activeSession, activeWorkspace, {
          focus: nextWorkrun.focus,
          currentState: nextHandoff?.achieved || nextWorkrun.lastOutput || activeWorkspace.currentState,
          openItems: nextHandoff?.openItems || activeWorkspace.openItems,
          nextMilestone: nextHandoff?.nextEntry || nextWorkrun.nextStep,
          status: nextHandoff?.status === 'paused' ? 'paused' : nextHandoff?.status === 'completed' ? 'completed' : 'active',
          threadIds: activeWorkspace.threadIds,
          source: update.source || activeWorkspace.source || 'manual'
        })
      : undefined;
    await persistCurrentSession(messages, threadDigest, nextWorkrun, nextBoard, nextHandoff, activeSession.workspaceId, nextWorkspace);
  }, [activeSession, messages, persistCurrentSession, threadDigest, activeCheckpointBoard, activeThreadHandoff, activeWorkspace]);

  const persistBoardState = useCallback(async (nextCheckpoints: MayaCheckpoint[], source: 'manual' | 'derived' = 'manual') => {
    if (!activeSession) {
      return;
    }

    const nextBoard = buildPersistedCheckpointBoard(activeSession, activeCheckpointBoard || undefined, {
      checkpoints: nextCheckpoints,
      focus: activeWorkrun?.focus || activeCheckpointBoard?.focus || activeSession.intent || activeSession.title,
      source
    });

    if (!nextBoard) {
      return;
    }

    const nextHandoff = buildPersistedThreadHandoff(activeSession, activeThreadHandoff || undefined, {
      openItems: nextBoard.checkpoints.filter((checkpoint) => checkpoint.status === 'open').map((checkpoint) => checkpoint.label),
      nextEntry: activeWorkrun?.nextStep || activeThreadHandoff?.nextEntry || activeSession.intent || activeSession.title,
      achieved: activeThreadHandoff?.achieved || activeWorkrun?.lastOutput || activeSession.digest?.currentState || '',
      status: activeThreadHandoff?.status || 'active',
      source
    });

    const nextWorkspace = activeWorkspace
      ? buildPersistedWorkspaceContext(activeSession, activeWorkspace, {
          openItems: nextHandoff?.openItems || [],
          nextMilestone: nextHandoff?.nextEntry || activeWorkspace.nextMilestone,
          currentState: nextHandoff?.achieved || activeWorkrun?.lastOutput || activeWorkspace.currentState,
          threadIds: activeWorkspace.threadIds,
          source
        })
      : undefined;

    await persistCurrentSession(messages, threadDigest, activeSession.workrun, nextBoard, nextHandoff, activeSession.workspaceId, nextWorkspace);
  }, [activeSession, activeCheckpointBoard, activeWorkrun, messages, persistCurrentSession, threadDigest, activeThreadHandoff, activeWorkspace]);

  const updateThreadHandoff = useCallback(async (update: Partial<Pick<MayaThreadHandoff, 'status' | 'achieved' | 'nextEntry' | 'source'>> & { openItems?: string[] }) => {
    if (!activeSession) {
      return;
    }

    const nextHandoff = buildPersistedThreadHandoff(activeSession, activeThreadHandoff || undefined, {
      status: update.status,
      achieved: update.achieved,
      openItems: update.openItems,
      nextEntry: update.nextEntry,
      source: update.source || 'manual'
    });

    if (!nextHandoff) {
      return;
    }

    const nextWorkrun = update.status === 'completed'
      ? buildPersistedWorkrun(activeSession, activeWorkrun || undefined, {
          status: 'completed',
          nextStep: nextHandoff.nextEntry,
          source: update.source || 'manual'
        })
      : update.status === 'active'
        ? buildPersistedWorkrun(activeSession, activeWorkrun || undefined, {
            status: 'open',
            nextStep: nextHandoff.nextEntry,
            focus: activeWorkrun?.focus || nextHandoff.nextEntry,
            source: update.source || 'manual'
          })
        : activeSession.workrun;

    const nextWorkspace = activeWorkspace
      ? buildPersistedWorkspaceContext(activeSession, activeWorkspace, {
          currentState: nextHandoff.achieved || nextWorkrun?.lastOutput || activeWorkspace.currentState,
          openItems: nextHandoff.openItems,
          nextMilestone: nextHandoff.nextEntry,
          status: update.status === 'paused' ? 'paused' : update.status === 'completed' ? 'completed' : 'active',
          threadIds: activeWorkspace.threadIds,
          source: update.source || activeWorkspace.source || 'manual'
        })
      : undefined;

    await persistCurrentSession(messages, threadDigest, nextWorkrun, activeSession.checkpointBoard, nextHandoff, activeSession.workspaceId, nextWorkspace);
  }, [activeSession, activeThreadHandoff, activeWorkrun, messages, persistCurrentSession, threadDigest, activeWorkspace]);

  const toggleCheckpointStatus = useCallback(async (checkpointId: string, status: 'open' | 'completed') => {
    if (!activeCheckpointBoard) {
      return;
    }

    const nextCheckpoints: MayaCheckpoint[] = activeCheckpointBoard.checkpoints.map((checkpoint): MayaCheckpoint => (
      checkpoint.id === checkpointId
        ? { ...checkpoint, status, source: 'manual', updatedAt: new Date().toISOString() }
        : checkpoint
    ));

    await persistBoardState(nextCheckpoints, 'manual');
  }, [activeCheckpointBoard, persistBoardState]);

  const addBoardCheckpointFromFocus = useCallback(async () => {
    if (!activeSession || !activeCheckpointBoard) {
      return;
    }

    const label = input.trim() || activeWorkrun?.nextStep || activeWorkrun?.focus;
    if (!label) {
      return;
    }

    const nextCheckpoint: MayaCheckpoint = {
      id: `checkpoint-manual-${Date.now()}`,
      label,
      detail: activeWorkrun?.focus && activeWorkrun.focus !== label ? activeWorkrun.focus : null,
      status: 'open',
      source: 'manual',
      updatedAt: new Date().toISOString()
    };

    const deduped = [...activeCheckpointBoard.checkpoints, nextCheckpoint].filter((checkpoint, index, list) => {
      const normalized = checkpoint.label.trim().toLowerCase();
      return list.findIndex((entry) => entry.label.trim().toLowerCase() === normalized) === index;
    }).slice(0, 4);

    await persistBoardState(deduped, 'manual');
  }, [activeSession, activeCheckpointBoard, activeWorkrun, input, persistBoardState]);

  // Send message with Presence-State machine + streaming simulation
  const sendMessage = useCallback(async (overrideText?: string, workMode?: WorkMode) => {
    if (sendingRef.current) return;
    sendingRef.current = true;
    const text = overrideText ?? input;
    if (!text.trim() || loading) {
      sendingRef.current = false;
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      createdAt: new Date().toISOString()
    };
    const nextUserMessages = [...messages, userMessage];

    setManualWorkrunFocus(text.trim());
    setMessages(nextUserMessages);
    setInput('');
    setLoading(true);
    setError(null);
    setMayaState('thinking');

    const nextHandoff = activeSession
      ? buildPersistedThreadHandoff(activeSession, activeThreadHandoff || undefined, {
          status: 'active',
          nextEntry: text.trim(),
          openItems: activeThreadHandoff?.openItems || activeCheckpointBoard?.checkpoints.filter((checkpoint) => checkpoint.status === 'open').map((checkpoint) => checkpoint.label) || [],
          achieved: activeThreadHandoff?.achieved || activeWorkrun?.lastOutput || activeSession.digest?.currentState || '',
          source: activeThreadHandoff?.source || 'manual'
        })
      : undefined;
    const nextWorkspace = activeSession && activeWorkspace
      ? buildPersistedWorkspaceContext(activeSession, activeWorkspace, {
          focus: activeWorkrun?.focus || activeWorkspace.focus,
          currentState: nextHandoff?.achieved || activeWorkspace.currentState,
          openItems: nextHandoff?.openItems || activeWorkspace.openItems,
          nextMilestone: text.trim(),
          threadIds: activeWorkspace.threadIds,
          source: activeWorkspace.source
        })
      : undefined;

    void persistCurrentSession(nextUserMessages, threadDigest, activeSession?.workrun, activeSession?.checkpointBoard, nextHandoff, activeSession?.workspaceId, nextWorkspace);

    try {
      const res = await fetch('/api/maya/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextUserMessages.map(m => ({
            role: m.role,
            content: m.content
          })),
          provider,
          model,
          role,
          studioMode: mode,
          workMode: workMode ?? detectWorkMode(text)
        })
      });

      const data = await res.json();

      if (res.status === 503 && data?.code === 'not_available_in_file_mode') {
        const effectiveMode = workMode ?? detectWorkMode(text);
        const stubText = generateLocalResponse(text, effectiveMode);
        setMayaState('streaming');
        await simulateStream(stubText, (partial) => setStreamingText(partial));
        setStreamingText('');
        const assistantMessage: Message = {
          id: `stub-${Date.now()}`,
          role: 'assistant' as const,
          content: stubText,
          createdAt: new Date().toISOString()
        };
        const nextMessages = [...nextUserMessages, assistantMessage];
        setMessages(nextMessages);
        const nextWorkrun = buildPersistedWorkrun(activeSession || buildMayaThreadSession(nextMessages), activeWorkrun || undefined, {
          lastOutput: stubText,
          lastStep: text.trim(),
          nextStep: activeWorkrun?.nextStep || text.trim(),
          source: activeSession?.workrun?.source || 'manual'
        });
        const nextBoard = buildPersistedCheckpointBoard(activeSession || buildMayaThreadSession(nextMessages), activeCheckpointBoard || undefined, {
          focus: nextWorkrun?.focus || activeWorkrun?.focus || text.trim(),
          source: activeSession?.checkpointBoard?.source || 'manual'
        });
        const nextHandoff = activeSession
          ? buildPersistedThreadHandoff(activeSession, activeThreadHandoff || undefined, {
              status: 'active',
              achieved: stubText,
              openItems: nextBoard?.checkpoints.filter((checkpoint) => checkpoint.status === 'open').map((checkpoint) => checkpoint.label) || [],
              nextEntry: nextWorkrun?.nextStep || text.trim(),
              source: activeSession?.handoff?.source || 'manual'
            })
          : undefined;
        const nextWorkspace = activeSession && activeWorkspace
          ? buildPersistedWorkspaceContext(activeSession, activeWorkspace, {
              currentState: nextHandoff?.achieved || activeWorkspace.currentState,
              openItems: nextHandoff?.openItems || activeWorkspace.openItems,
              nextMilestone: nextHandoff?.nextEntry || nextWorkrun?.nextStep || activeWorkspace.nextMilestone,
              threadIds: activeWorkspace.threadIds,
              source: activeWorkspace.source
            })
          : undefined;
        void persistCurrentSession(nextMessages, threadDigest, nextWorkrun, nextBoard, nextHandoff, activeSession?.workspaceId, nextWorkspace);
        return;
      }

      if (data.blocked && data.blockReason === 'provider_not_configured') {
        const effectiveMode = workMode ?? detectWorkMode(text);
        const stubText = generateLocalResponse(text, effectiveMode);
        setMayaState('streaming');
        await simulateStream(stubText, (partial) => setStreamingText(partial));
        setStreamingText('');
        const assistantMessage: Message = {
          id: `local-${Date.now()}`,
          role: 'assistant' as const,
          content: stubText,
          createdAt: new Date().toISOString()
        };
        const nextMessages = [...nextUserMessages, assistantMessage];
        setMessages(nextMessages);
        const nextWorkrun = buildPersistedWorkrun(activeSession || buildMayaThreadSession(nextMessages), activeWorkrun || undefined, {
          lastOutput: stubText,
          lastStep: text.trim(),
          nextStep: activeWorkrun?.nextStep || text.trim(),
          source: activeSession?.workrun?.source || 'manual'
        });
        const nextBoard = buildPersistedCheckpointBoard(activeSession || buildMayaThreadSession(nextMessages), activeCheckpointBoard || undefined, {
          focus: nextWorkrun?.focus || activeWorkrun?.focus || text.trim(),
          source: activeSession?.checkpointBoard?.source || 'manual'
        });
        const nextHandoff = activeSession
          ? buildPersistedThreadHandoff(activeSession, activeThreadHandoff || undefined, {
              status: 'active',
              achieved: stubText,
              openItems: nextBoard?.checkpoints.filter((checkpoint) => checkpoint.status === 'open').map((checkpoint) => checkpoint.label) || [],
              nextEntry: nextWorkrun?.nextStep || text.trim(),
              source: activeSession?.handoff?.source || 'manual'
            })
          : undefined;
        const nextWorkspace = activeSession && activeWorkspace
          ? buildPersistedWorkspaceContext(activeSession, activeWorkspace, {
              currentState: nextHandoff?.achieved || activeWorkspace.currentState,
              openItems: nextHandoff?.openItems || activeWorkspace.openItems,
              nextMilestone: nextHandoff?.nextEntry || nextWorkrun?.nextStep || activeWorkspace.nextMilestone,
              threadIds: activeWorkspace.threadIds,
              source: activeWorkspace.source
            })
          : undefined;
        void persistCurrentSession(nextMessages, threadDigest, nextWorkrun, nextBoard, nextHandoff, activeSession?.workspaceId, nextWorkspace);
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

        const assistantMessage: Message = {
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
        };
        const nextMessages = [...nextUserMessages, assistantMessage];
        setMessages(nextMessages);
        const nextWorkrun = buildPersistedWorkrun(activeSession || buildMayaThreadSession(nextMessages), activeWorkrun || undefined, {
          lastOutput: data.message.content,
          lastStep: text.trim(),
          nextStep: activeWorkrun?.nextStep || text.trim(),
          source: activeSession?.workrun?.source || 'manual'
        });
        const nextBoard = buildPersistedCheckpointBoard(activeSession || buildMayaThreadSession(nextMessages), activeCheckpointBoard || undefined, {
          focus: nextWorkrun?.focus || activeWorkrun?.focus || text.trim(),
          source: activeSession?.checkpointBoard?.source || 'manual'
        });
        const nextHandoff = activeSession
          ? buildPersistedThreadHandoff(activeSession, activeThreadHandoff || undefined, {
              status: 'active',
              achieved: data.message.content,
              openItems: nextBoard?.checkpoints.filter((checkpoint) => checkpoint.status === 'open').map((checkpoint) => checkpoint.label) || [],
              nextEntry: nextWorkrun?.nextStep || text.trim(),
              source: activeSession?.handoff?.source || 'manual'
            })
          : undefined;
        const nextWorkspace = activeSession && activeWorkspace
          ? buildPersistedWorkspaceContext(activeSession, activeWorkspace, {
              currentState: nextHandoff?.achieved || activeWorkspace.currentState,
              openItems: nextHandoff?.openItems || activeWorkspace.openItems,
              nextMilestone: nextHandoff?.nextEntry || nextWorkrun?.nextStep || activeWorkspace.nextMilestone,
              threadIds: activeWorkspace.threadIds,
              source: activeWorkspace.source
            })
          : undefined;
        void persistCurrentSession(nextMessages, threadDigest, nextWorkrun, nextBoard, nextHandoff, activeSession?.workspaceId, nextWorkspace);
      }

      loadBriefingAndHealth();
    } catch {
      setError('Nachricht konnte nicht gesendet werden');
    } finally {
      setLoading(false);
      setMayaState('idle');
      sendingRef.current = false;
    }
  }, [input, loading, messages, provider, model, role, mode, simulateStream, loadBriefingAndHealth, persistCurrentSession, threadDigest, activeSession, activeWorkrun, activeCheckpointBoard, activeThreadHandoff, activeWorkspace]);

  const applyResumeAction = useCallback((prompt: string, immediate?: boolean) => {
    setManualWorkrunFocus(prompt);
    setInput(prompt);
    setError(null);
    void persistWorkspaceForActiveSession({
      nextMilestone: prompt,
      focus: activeWorkspace?.focus || activeWorkrun?.focus || prompt,
      currentState: activeWorkspace?.currentState || activeThreadHandoff?.achieved || activeWorkrun?.lastOutput || '',
      openItems: activeWorkspace?.openItems || activeThreadHandoff?.openItems || [],
      threadIds: activeWorkspace?.threadIds || []
    });
    void updateThreadHandoff({ status: 'active', nextEntry: prompt, source: 'manual' });
    void updateActiveWorkrun({
      focus: prompt,
      nextStep: prompt,
      status: 'open',
      source: 'manual'
    });

    if (!immediate || loading) {
      return;
    }

    void sendMessage(prompt);
  }, [loading, sendMessage, updateActiveWorkrun, updateThreadHandoff, persistWorkspaceForActiveSession, activeWorkspace, activeWorkrun, activeThreadHandoff]);

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

  useEffect(() => {
    if (messages.length === 0) {
      if (threadDigest) {
        setThreadDigest(null);
      }
      return;
    }

    const assistantMessages = messages.filter((message) => message.role === 'assistant');

    if (!threadDigest && assistantMessages.length > 0) {
      const digestSource = buildMayaThreadSession(messages);
      const nextDigest = buildThreadDigest(digestSource);

      if (nextDigest) {
        setThreadDigest(nextDigest);
        const nextWorkspace = activeSession && activeWorkspace
          ? buildPersistedWorkspaceContext(activeSession, activeWorkspace, {
              currentState: activeThreadHandoff?.achieved || activeWorkrun?.lastOutput || nextDigest.currentState || activeWorkspace.currentState,
              openItems: activeThreadHandoff?.openItems || activeWorkspace.openItems,
              nextMilestone: activeThreadHandoff?.nextEntry || activeWorkrun?.nextStep || nextDigest.nextEntry || activeWorkspace.nextMilestone,
              threadIds: activeWorkspace.threadIds,
              source: activeWorkspace.source
            })
          : undefined;
        void persistCurrentSession(messages, nextDigest, activeSession?.workrun, activeSession?.checkpointBoard, activeSession?.handoff, activeSession?.workspaceId, nextWorkspace);
      }
    }
  }, [messages, threadDigest, persistCurrentSession, activeSession, activeWorkspace, activeThreadHandoff, activeWorkrun]);

  const digestNeedsRefresh = threadDigest
    ? messages.length - threadDigest.sourceMessageCount >= DIGEST_STALE_MESSAGE_THRESHOLD
    : false;
  const canBuildDigest = messages.some((message) => message.role === 'assistant' || message.role === 'user');
  const showThreadDigestSection = Boolean(
    messages.length > 0 && (
      !threadDigest ||
      digestNeedsRefresh ||
      digestHasDistinctSummary ||
      digestHasDistinctCurrentState ||
      digestOpenLoops.length > 0 ||
      digestHasDistinctNextEntry
    )
  );

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
          hasMessages={messages.length > 0}
          onToggleMeta={() => setTopbarMetaOpen(v => !v)}
          onProviderChange={handleProviderChange}
          onModelChange={setModel}
          onOpenReview={() => setShowReviewSheet(true)}
          onClearMessages={clearMessages}
        />

        <div className="maya-feed" ref={feedRef}>
          <section className="mb-4 rounded-[24px] border border-cyan-400/20 bg-cyan-500/8 p-4 text-sm text-slate-100 shadow-shell sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">Thread-Kontinuität</div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  Maya setzt den letzten aktiven Thread nach Reload oder Wiedereinstieg wieder auf derselben Hauptfläche fort.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  {sessionsLoaded ? `Threads: ${visibleSessions.length}` : 'Threads werden geladen'}
                </span>
                {activeSession ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    Aktiv: {activeSession.title}
                  </span>
                ) : null}
              </div>
            </div>

            {visibleSessions.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {visibleSessions.slice(0, 6).map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => selectThread(session.id)}
                    disabled={loading || session.id === activeSessionId}
                    className={[
                      'rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em] transition',
                      session.id === activeSessionId
                        ? 'border-cyan-300/40 bg-cyan-400/15 text-cyan-50'
                        : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10',
                      loading ? 'disabled:cursor-not-allowed disabled:opacity-50' : ''
                    ].join(' ')}
                  >
                    {session.title}
                  </button>
                ))}
              </div>
            ) : sessionsLoaded ? (
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Noch kein persistierter Thread vorhanden. Der nächste Einstieg wird hier als fortsetzbarer Maya-Thread gespeichert.
              </p>
            ) : null}
          </section>

          {activeSession ? (
            <section className="mb-4 rounded-[24px] border border-emerald-400/20 bg-emerald-500/8 p-4 text-sm text-slate-100 shadow-shell sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-emerald-300">Arbeitsraum-Kontext</div>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                    Maya zeigt über dem einzelnen Thread den kleinen stabilen Projektkontext, damit Fokus, Gesamtziel und nächster größerer Block beim Threadwechsel sichtbar bleiben.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                  {activeWorkspace ? (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                      Status: {activeWorkspace.status === 'completed' ? 'abgeschlossen' : activeWorkspace.status === 'paused' ? 'geparkt' : 'aktiv'}
                    </span>
                  ) : null}
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    Arbeitsräume: {visibleWorkspaces.length}
                  </span>
                  {activeWorkspace ? (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                      Threads: {relatedWorkspaceThreads.length}
                    </span>
                  ) : null}
                  {activeWorkspaceUpdatedAtLabel ? (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                      Stand: {activeWorkspaceUpdatedAtLabel}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 rounded-[20px] border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Raumsteuerung</div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Arbeitsräume lassen sich hier anlegen, umbenennen, aktiv setzen und direkt mit neuen Threads weiterführen.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void createWorkspace()}
                      disabled={loading}
                      className="rounded-full border border-emerald-300/40 bg-emerald-400/15 px-4 py-2 text-xs uppercase tracking-[0.18em] text-emerald-50 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Arbeitsraum anlegen
                    </button>
                    <button
                      type="button"
                      onClick={() => void renameActiveWorkspace()}
                      disabled={loading || !activeWorkspace || !input.trim()}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Aktiven Raum umbenennen
                    </button>
                    <button
                      type="button"
                      onClick={clearMessages}
                      disabled={loading || !activeWorkspaceId}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Neuer Thread im Raum
                    </button>
                  </div>
                </div>

                {visibleWorkspaces.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {visibleWorkspaces.map((workspace) => (
                      <button
                        key={workspace.id}
                        type="button"
                        onClick={() => void setActiveWorkspace(workspace.id)}
                        disabled={loading || workspace.id === activeWorkspaceId}
                        className={[
                          'rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-50',
                          workspace.id === activeWorkspaceId
                            ? 'border-emerald-300/40 bg-emerald-400/15 text-emerald-50'
                            : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                        ].join(' ')}
                      >
                        {workspace.title}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-slate-400">
                    Noch kein Arbeitsraum angelegt. Lege den ersten Raum direkt aus dem aktiven Thread an.
                  </p>
                )}
              </div>

              {activeWorkspace ? (
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Arbeitsraum</div>
                  <div className="mt-2 text-base font-medium leading-7 text-slate-100">{activeWorkspace.title}</div>
                  <p className="mt-3 text-sm leading-6 text-slate-200">{activeWorkspace.focus}</p>
                </div>

                <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Nächster größerer Block</div>
                  <p className="mt-2 text-sm leading-6 text-slate-200">{activeWorkspace.nextMilestone}</p>
                  {workspaceMilestoneAddsSignal ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => applyResumeAction(activeWorkspace.nextMilestone, false)}
                        disabled={loading}
                        className="rounded-full border border-emerald-300/40 bg-emerald-400/15 px-4 py-2 text-xs uppercase tracking-[0.18em] text-emerald-50 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        In Composer übernehmen
                      </button>
                    </div>
                  ) : null}
                </div>

                {workspaceStateAddsSignal ? (
                  <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Arbeitsraum-Stand</div>
                    <p className="mt-2 text-sm leading-6 text-slate-200">{activeWorkspace.currentState}</p>
                  </div>
                ) : null}

                <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Gesamtziel</div>
                  <p className="mt-2 text-sm leading-6 text-slate-200">{activeWorkspace.goal}</p>
                </div>

                {showWorkspaceOpenItems ? (
                  <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 lg:col-span-2">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Offene Kernpunkte</div>
                    <div className="mt-3 space-y-2">
                      {workspaceOpenItems.map((item) => (
                        <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm leading-6 text-slate-200">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Verbundene Threads</div>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        Der aktive Thread bleibt diesem Arbeitsraum zugeordnet und der Kontext bleibt beim Wechsel zwischen zusammengehörigen Threads sichtbar.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void assignActiveThreadToWorkspace(activeWorkspace.id)}
                      disabled={!activeSession || loading}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Aktiven Thread zuordnen
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {relatedWorkspaceThreads.length > 0 ? relatedWorkspaceThreads.map((session) => (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => selectThread(session.id)}
                        disabled={loading || session.id === activeSessionId}
                        className={[
                          'rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-50',
                          session.id === activeSessionId
                            ? 'border-emerald-300/40 bg-emerald-400/15 text-emerald-50'
                            : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                        ].join(' ')}
                      >
                        {session.title}
                      </button>
                    )) : (
                      <p className="text-sm leading-6 text-slate-400">Aktuell ist nur der aktive Thread diesem Arbeitsraum zugeordnet.</p>
                    )}
                  </div>
                </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {activeWorkrun ? (
            <section className="mb-4 rounded-[24px] border border-fuchsia-400/20 bg-fuchsia-500/8 p-4 text-sm text-slate-100 shadow-shell sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-fuchsia-300">Aktiver Arbeitslauf</div>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                    Maya trägt den aktuellen Arbeitsfokus dieses Threads sichtbar weiter und hält letzten Output, nächsten Schritt und Status auf derselben Hauptfläche zusammen.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    Status: {activeWorkrun.status === 'completed' ? 'abgeschlossen' : 'offen'}
                  </span>
                  {activeWorkrunUpdatedAtLabel ? (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                      Zuletzt aktiv: {activeWorkrunUpdatedAtLabel}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 lg:col-span-2">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Aktueller Fokus</div>
                  <p className="mt-2 text-base font-medium leading-7 text-slate-100">{primaryFocus || activeWorkrun.focus}</p>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Nächster sinnvoller Schritt</div>
                      <p className="mt-2 text-sm leading-6 text-slate-200">{primaryNextStep || activeWorkrun.nextStep}</p>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Wichtigster offener Kernpunkt</div>
                      <p className="mt-2 text-sm leading-6 text-slate-200">{primaryOpenPoint || 'Kein offener Kernpunkt markiert. Der Rohchat bleibt führend.'}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => applyResumeAction(primaryNextStep || activeWorkrun.nextStep, false)}
                      disabled={loading}
                      className="rounded-full border border-fuchsia-300/40 bg-fuchsia-400/15 px-4 py-2 text-xs uppercase tracking-[0.18em] text-fuchsia-50 transition hover:bg-fuchsia-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Schritt übernehmen
                    </button>
                    <button
                      type="button"
                      onClick={() => applyResumeAction(primaryNextStep || activeWorkrun.nextStep, true)}
                      disabled={loading}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Arbeitslauf fortsetzen
                    </button>
                  </div>
                </div>

                <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Letzter sinnvoller Schritt</div>
                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    {activeWorkrun.lastStep || 'Noch kein letzter Schritt für diesen Arbeitslauf festgehalten.'}
                  </p>
                </div>

                <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Manuelle Steuerung</div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const nextFocus = input.trim() || activeWorkrun.nextStep;
                        setManualWorkrunFocus(nextFocus);
                        void updateActiveWorkrun({
                          focus: nextFocus,
                          nextStep: nextFocus,
                          status: 'open',
                          lastStep: activeWorkrun.lastStep,
                          source: 'manual'
                        });
                      }}
                      disabled={loading}
                      className="rounded-full border border-fuchsia-300/40 bg-fuchsia-400/15 px-4 py-2 text-xs uppercase tracking-[0.18em] text-fuchsia-50 transition hover:bg-fuchsia-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Fokus setzen
                    </button>
                    <button
                      type="button"
                      onClick={() => void updateActiveWorkrun({ status: 'completed', source: 'manual' })}
                      disabled={loading || activeWorkrun.status === 'completed'}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Als abgeschlossen markieren
                    </button>
                    <button
                      type="button"
                      onClick={() => void updateActiveWorkrun({ status: 'open', source: 'manual' })}
                      disabled={loading || activeWorkrun.status === 'open'}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Wieder öffnen
                    </button>
                    <button
                      type="button"
                      onClick={() => void updateThreadHandoff({
                        status: 'paused',
                        achieved: activeThreadHandoff?.achieved || activeWorkrun.lastOutput || activeSession?.digest?.currentState || '',
                        openItems: activeCheckpointBoard?.checkpoints.filter((checkpoint) => checkpoint.status === 'open').map((checkpoint) => checkpoint.label) || activeThreadHandoff?.openItems || [],
                        nextEntry: activeWorkrun.nextStep,
                        source: 'manual'
                      })}
                      disabled={loading || activeThreadHandoff?.status === 'paused'}
                      className="rounded-full border border-amber-300/30 bg-amber-400/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-amber-50 transition hover:bg-amber-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Thread parken
                    </button>
                    <button
                      type="button"
                      onClick={() => void updateThreadHandoff({
                        status: 'active',
                        nextEntry: activeThreadHandoff?.nextEntry || activeWorkrun.nextStep,
                        openItems: activeThreadHandoff?.openItems || activeCheckpointBoard?.checkpoints.filter((checkpoint) => checkpoint.status === 'open').map((checkpoint) => checkpoint.label) || [],
                        achieved: activeThreadHandoff?.achieved || activeWorkrun.lastOutput || activeSession?.digest?.currentState || '',
                        source: 'manual'
                      })}
                      disabled={loading || activeThreadHandoff?.status === 'active'}
                      className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-cyan-50 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Wieder aufnehmen
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setManualWorkrunFocus(null);
                        if (activeSession) {
                          const nextWorkrun = buildPersistedWorkrun(activeSession, activeWorkrun || undefined, {
                            focus: derivedWorkrun?.focus || activeWorkrun?.focus || activeSession.intent || activeSession.title,
                            nextStep: derivedWorkrun?.nextStep || activeWorkrun?.nextStep || activeSession.intent || activeSession.title,
                            status: activeWorkrun?.status || 'open',
                            lastOutput: activeWorkrun?.lastOutput,
                            lastStep: activeWorkrun?.lastStep,
                            source: 'derived'
                          });

                          if (nextWorkrun) {
                            const nextBoard = buildPersistedCheckpointBoard(activeSession, activeCheckpointBoard || undefined, {
                              focus: nextWorkrun.focus,
                              source: 'derived'
                            });
                            const nextHandoff = buildPersistedThreadHandoff(activeSession, activeThreadHandoff || undefined, {
                              status: activeThreadHandoff?.status || 'active',
                              achieved: activeThreadHandoff?.achieved || activeWorkrun?.lastOutput || activeSession.digest?.currentState || '',
                              openItems: nextBoard?.checkpoints.filter((checkpoint) => checkpoint.status === 'open').map((checkpoint) => checkpoint.label) || [],
                              nextEntry: nextWorkrun.nextStep,
                              source: 'derived'
                            });
                            const nextWorkspace = activeWorkspace
                              ? buildPersistedWorkspaceContext(activeSession, activeWorkspace, {
                                  focus: nextWorkrun.focus,
                                  currentState: nextHandoff?.achieved || nextWorkrun.lastOutput || activeWorkspace.currentState,
                                  openItems: nextHandoff?.openItems || activeWorkspace.openItems,
                                  nextMilestone: nextHandoff?.nextEntry || nextWorkrun.nextStep,
                                  threadIds: activeWorkspace.threadIds,
                                  source: 'derived'
                                })
                              : undefined;
                            void persistCurrentSession(messages, threadDigest, nextWorkrun, nextBoard, nextHandoff, activeSession.workspaceId, nextWorkspace);
                          }
                        }
                      }}
                      disabled={!activeSession || loading}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Neu aus Thread ableiten
                    </button>
                  </div>
                </div>

                {showHandoffSection && activeThreadHandoff ? (
                  <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 lg:col-span-2">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Abschluss und Übergabe</div>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          Diese Schicht bleibt für Parken, Abschluss oder einen wirklich abweichenden Wiedereinstieg sichtbar.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                          Status: {activeThreadHandoff.status === 'completed' ? 'abgeschlossen' : activeThreadHandoff.status === 'paused' ? 'geparkt' : 'aktiv'}
                        </span>
                        {activeThreadHandoffUpdatedAtLabel ? (
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                            Übergabe: {activeThreadHandoffUpdatedAtLabel}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-3">
                      {handoffHasDistinctAchieved || activeThreadHandoff.status !== 'active' ? (
                        <div className="rounded-[18px] border border-white/10 bg-slate-950/35 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Erreicht</div>
                        <p className="mt-2 text-sm leading-6 text-slate-200">
                          {activeThreadHandoff.achieved || 'Noch kein kompakter Abschlussstand festgehalten.'}
                        </p>
                        </div>
                      ) : null}

                      {handoffOpenItems.length > 0 ? (
                        <div className="rounded-[18px] border border-white/10 bg-slate-950/35 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Bleibt offen</div>
                        <div className="mt-3 space-y-2">
                          {handoffOpenItems.map((item) => (
                            <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm leading-6 text-slate-200">
                              {item}
                            </div>
                          ))}
                        </div>
                        </div>
                      ) : null}

                      {handoffHasDistinctNextEntry || activeThreadHandoff.status !== 'active' ? (
                        <div className="rounded-[18px] border border-white/10 bg-slate-950/35 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Nächster Wiedereinstieg</div>
                        <p className="mt-2 text-sm leading-6 text-slate-200">{activeThreadHandoff.nextEntry}</p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {activeCheckpointBoard ? (
                  <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 lg:col-span-2">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Arbeitsboard</div>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          Kleine sichtbare Checkpoints halten den Arbeitslauf dieses Threads offen, erledigt und wiederaufnehmbar.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                          Fortschritt: {activeCheckpointBoard.progressPercent}%
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                          Offen: {activeCheckpointBoard.openCount}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                          Erledigt: {activeCheckpointBoard.completedCount}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-900/80">
                      <div
                        className="h-full rounded-full bg-fuchsia-400/80 transition-all"
                        style={{ width: `${activeCheckpointBoard.progressPercent}%` }}
                      />
                    </div>

                    <div className="mt-4 grid gap-3">
                      {activeCheckpointBoard.checkpoints.map((checkpoint) => (
                        <div key={checkpoint.id} className="rounded-[18px] border border-white/10 bg-slate-950/35 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="text-sm font-medium leading-6 text-slate-100">{checkpoint.label}</div>
                              {checkpoint.detail ? (
                                <p className="mt-2 text-sm leading-6 text-slate-300">{checkpoint.detail}</p>
                              ) : null}
                            </div>
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
                              {checkpoint.status === 'completed' ? 'erledigt' : 'offen'}
                            </span>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => void toggleCheckpointStatus(checkpoint.id, 'completed')}
                              disabled={loading || checkpoint.status === 'completed'}
                              className="rounded-full border border-fuchsia-300/40 bg-fuchsia-400/15 px-4 py-2 text-xs uppercase tracking-[0.18em] text-fuchsia-50 transition hover:bg-fuchsia-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Abhaken
                            </button>
                            <button
                              type="button"
                              onClick={() => void toggleCheckpointStatus(checkpoint.id, 'open')}
                              disabled={loading || checkpoint.status === 'open'}
                              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Wieder öffnen
                            </button>
                            <button
                              type="button"
                              onClick={() => applyResumeAction(checkpoint.label, false)}
                              disabled={loading}
                              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              In Composer übernehmen
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void addBoardCheckpointFromFocus()}
                        disabled={loading || activeCheckpointBoard.checkpoints.length >= 4}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Checkpoint ergänzen
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 lg:col-span-2">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Letzter relevanter Output</div>
                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    {activeWorkrun.lastOutput || 'Noch kein Assistant-Output im aktiven Arbeitslauf vorhanden.'}
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          {showContinuityBriefing && continuityBriefing ? (
            <section className="mb-4 rounded-[24px] border border-violet-400/20 bg-violet-500/8 p-4 text-sm text-slate-100 shadow-shell sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-violet-300">Kontinuitäts-Briefing</div>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                    Diese Schicht bleibt als knappe Wiedereinstiegslesart sichtbar, wenn sie gegenüber Arbeitslauf und Übergabe noch zusätzliche Orientierung liefert.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    Quelle: {continuityBriefing.source === 'digest' ? 'Fadenkompass' : 'Aktiver Thread'}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    Vertrauen: {continuityBriefing.confidence}
                  </span>
                  {continuityBriefingUpdatedAtLabel ? (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                      Stand: {continuityBriefingUpdatedAtLabel}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {briefingHasDistinctFocus ? (
                  <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Woran Maya gerade mit dir arbeitet</div>
                    <div className="mt-2 text-base font-medium leading-7 text-slate-100">{continuityBriefing.title}</div>
                    <p className="mt-3 text-sm leading-6 text-slate-200">{continuityBriefing.focus}</p>
                  </div>
                ) : null}

                {briefingHasDistinctCurrentState ? (
                  <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Knapper Stand</div>
                    <p className="mt-2 text-sm leading-6 text-slate-200">{continuityBriefing.currentState}</p>
                  </div>
                ) : null}

                {briefingHasDistinctNextStep ? (
                  <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 lg:col-span-2">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Knapper Wiedereinstieg</div>
                    <p className="mt-2 text-sm leading-6 text-slate-200">{continuityBriefing.nextStep}</p>
                  </div>
                ) : null}

                {briefingOpenLoops.length > 0 ? (
                  <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 lg:col-span-2">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Zusätzliche offene Punkte</div>
                    <div className="mt-3 space-y-2">
                      {briefingOpenLoops.map((loop) => (
                        <div key={loop} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm leading-6 text-slate-200">
                          {loop}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {showContinuityResumeActions ? (
                <div className="mt-4 rounded-[20px] border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Resume-Actions</div>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        Nur die zusätzlichen Wiedereinstiegsoptionen bleiben hier sichtbar, wenn sie vom Hauptschritt abweichen.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    {secondaryResumeActions.map((action) => (
                      <div key={action.id} className="rounded-[18px] border border-white/10 bg-slate-950/35 p-4">
                        <div className="text-sm font-medium leading-6 text-slate-100">{action.label}</div>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{action.prompt}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => applyResumeAction(action.prompt, false)}
                            disabled={loading}
                            className={[
                              'rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-50',
                              action.emphasis === 'primary'
                                ? 'border-violet-300/40 bg-violet-400/15 text-violet-50 hover:bg-violet-400/20'
                                : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                            ].join(' ')}
                          >
                            In Composer übernehmen
                          </button>
                          <button
                            type="button"
                            onClick={() => applyResumeAction(action.prompt, true)}
                            disabled={loading}
                            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Direkt fortsetzen
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {showThreadDigestSection ? (
            <section className="mb-4 rounded-[24px] border border-emerald-400/20 bg-emerald-500/8 p-4 text-sm text-slate-100 shadow-shell sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-emerald-300">Fadenkompass</div>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                    Rohchat bleibt führend. Der Fadenkompass ist nur die kompakte Orientierungsschicht für den aktuellen Maya-Thread.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={refreshThreadDigest}
                  disabled={!canBuildDigest || loading}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Faden verdichten
                </button>
              </div>

              {threadDigest ? (
                <div className="mt-4 space-y-4">
                  {digestNeedsRefresh ? (
                    <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm leading-6 text-amber-100">
                      Seit dem letzten Digest sind neue Nachrichten dazugekommen.
                    </div>
                  ) : null}

                  {digestHasDistinctSummary ? (
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Faden-Kern</div>
                      <p className="mt-2 text-sm leading-6 text-slate-200">{threadDigest.summary}</p>
                    </div>
                  ) : null}

                  {digestHasDistinctCurrentState ? (
                    <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Aktueller Stand</div>
                    <p className="mt-2 text-sm leading-6 text-slate-200">{threadDigest.currentState}</p>
                    </div>
                  ) : null}

                  {digestOpenLoops.length > 0 ? (
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Offene Punkte</div>
                      <div className="mt-2 space-y-2">
                        {digestOpenLoops.map((loop) => (
                          <div key={loop} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-200">
                            {loop}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {digestHasDistinctNextEntry ? (
                    <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Nächster Einstieg</div>
                    <p className="mt-2 text-sm leading-6 text-slate-200">{threadDigest.nextEntry}</p>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Vertrauen: {threadDigest.confidence}</span>
                    {threadDigestUpdatedAtLabel ? (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Aktualisiert: {threadDigestUpdatedAtLabel}</span>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  Noch kein Digest vorhanden. Verdichte den Faden, wenn du eine kompakte Orientierung für diesen Maya-Thread willst.
                </p>
              )}
            </section>
          ) : null}

          {messages.length === 0 && !loading ? (
            <MayaEmptyState
              onSendStarter={(text, wm) => sendMessage(text, wm)}
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