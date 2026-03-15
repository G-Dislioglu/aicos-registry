'use client';

import { useState, useEffect, useCallback } from 'react';

type StudioMode = 'personal' | 'soulmatch_studio' | 'aicos_studio';
type Provider = {
  type: string;
  name: string;
  available: boolean;
  models: Array<{
    id: string;
    name: string;
  }>;
  defaultModel: string;
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
  extractStatus?: {
    enabled: boolean;
    lastRun: string | null;
    lastLifecycleRun: string | null;
    extractCostToday: number;
  };
};

const MODE_LABELS: Record<StudioMode, string> = {
  personal: 'Personal',
  soulmatch_studio: 'Soulmatch Studio',
  aicos_studio: 'AICOS Studio'
};

const MODE_ICONS: Record<StudioMode, string> = {
  personal: '👤',
  soulmatch_studio: '💕',
  aicos_studio: '📋'
};

export function MayaChatScreen() {
  const [mode, setMode] = useState<StudioMode>('personal');
  const [provider, setProvider] = useState<string>('mock');
  const [model, setModel] = useState<string>('mock');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [showBriefing, setShowBriefing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load providers
  useEffect(() => {
    fetch('/api/maya/providers')
      .then(res => res.json())
      .then(data => {
        setProviders(data.providers || []);
        if (data.defaultProvider) {
          setProvider(data.defaultProvider);
          const defaultProv = data.providers?.find((p: Provider) => p.type === data.defaultProvider);
          if (defaultProv) {
            setModel(defaultProv.defaultModel);
          }
        }
      })
      .catch(() => setError('Failed to load providers'));
  }, []);

  // Load briefing and health
  const loadBriefingAndHealth = useCallback(async () => {
    try {
      const [briefingRes, healthRes] = await Promise.all([
        fetch(`/api/maya/briefing?mode=${mode}`),
        fetch('/api/maya/health')
      ]);

      if (briefingRes.ok) {
        const data = await briefingRes.json();
        setBriefing(data.briefing);
      }

      if (healthRes.ok) {
        const data = await healthRes.json();
        setHealth(data);
      }
    } catch {
      // Silent fail for background data
    }
  }, [mode]);

  useEffect(() => {
    loadBriefingAndHealth();
  }, [loadBriefingAndHealth]);

  // Get current provider's models
  const currentProvider = providers.find(p => p.type === provider);
  const availableModels = currentProvider?.models || [];

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

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
          studioMode: mode
        })
      });

      const data = await res.json();

      if (data.blocked) {
        setError(data.message?.content || 'Request blocked');
      } else if (data.message) {
        setMessages(prev => [...prev, {
          id: data.message.id,
          role: data.message.role,
          content: data.message.content,
          provider: data.message.provider,
          model: data.message.model,
          tokenInput: data.message.tokenInput,
          tokenOutput: data.message.tokenOutput,
          costCents: data.message.costCents,
          createdAt: data.message.createdAt
        }]);
      }

      // Refresh briefing/health after chat
      loadBriefingAndHealth();
    } catch {
      setError('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

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
      setError('Failed to confirm memory');
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
      setError('Failed to deny memory');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">Maya</h1>

          {/* Mode Switch */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(Object.keys(MODE_LABELS) as StudioMode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  mode === m
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="mr-1">{MODE_ICONS[m]}</span>
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Provider Dropdown */}
          <select
            value={provider}
            onChange={e => {
              setProvider(e.target.value);
              const prov = providers.find(p => p.type === e.target.value);
              if (prov) setModel(prov.defaultModel);
            }}
            className="px-3 py-1.5 border rounded-lg text-sm bg-white"
          >
            {providers.filter(p => p.available).map(p => (
              <option key={p.type} value={p.type}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Model Dropdown */}
          <select
            value={model}
            onChange={e => setModel(e.target.value)}
            className="px-3 py-1.5 border rounded-lg text-sm bg-white"
          >
            {availableModels.map(m => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Health Status */}
          {health && (
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              health.status === 'ok' ? 'bg-green-100 text-green-800' :
              health.status === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {health.costToday}¢ / {health.tokensToday} tok
            </div>
          )}

          {/* Briefing Toggle */}
          <button
            onClick={() => setShowBriefing(!showBriefing)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              showBriefing ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Briefing
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-20">
                <p className="text-lg">Start a conversation with Maya</p>
                <p className="text-sm mt-2">Mode: {MODE_LABELS[mode]} • Provider: {currentProvider?.name || provider}</p>
              </div>
            )}

            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border shadow-sm'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Message Badge */}
                  {msg.role === 'assistant' && (msg.provider || msg.model) && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                      {msg.provider && (
                        <span className="px-2 py-0.5 bg-gray-100 rounded">
                          {msg.provider}
                        </span>
                      )}
                      {msg.model && (
                        <span className="px-2 py-0.5 bg-gray-100 rounded">
                          {msg.model}
                        </span>
                      )}
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

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border rounded-lg px-4 py-3 shadow-sm">
                  <div className="animate-pulse flex gap-2">
                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t bg-white p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>

            {error && (
              <div className="mt-2 text-red-600 text-sm">{error}</div>
            )}
          </div>
        </div>

        {/* Briefing Panel */}
        {showBriefing && briefing && (
          <div className="w-80 border-l bg-white overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Briefing</h2>

              {/* Context Summary */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Context</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {briefing.contextSummary || 'No active context'}
                </p>
              </div>

              {/* Open Proposed */}
              {briefing.openProposed.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Proposed ({briefing.openProposed.length})
                  </h3>
                  <div className="space-y-2">
                    {briefing.openProposed.map(proposed => (
                      <div key={proposed.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="font-medium text-yellow-900 text-sm">{proposed.title}</div>
                        <div className="text-xs text-yellow-700 mt-1">{proposed.summary}</div>
                        {proposed.entityId && (
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => confirmProposed(proposed.entityId!)}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => denyProposed(proposed.entityId!)}
                              className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                            >
                              Deny
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conflicts */}
              {briefing.conflicts.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Conflicts ({briefing.conflicts.length})
                  </h3>
                  <div className="space-y-2">
                    {briefing.conflicts.map(conflict => (
                      <div key={conflict.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-red-900 text-sm">{conflict.title}</div>
                          {conflict.severity && (
                            <span className="px-1.5 py-0.5 bg-red-200 text-red-800 text-xs rounded">
                              Sev {conflict.severity}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-red-700 mt-1">{conflict.summary}</div>
                        {conflict.entityId && (
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => {/* Open conflict resolution */}}
                              className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                            >
                              Resolve
                            </button>
                            <button
                              onClick={() => conflict.entityId && denyProposed(conflict.entityId)}
                              className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                            >
                              Dismiss
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Signals */}
              {briefing.signals.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Signals ({briefing.signals.length})
                  </h3>
                  <div className="space-y-2">
                    {briefing.signals.map(signal => (
                      <div key={signal.id} className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="font-medium text-purple-900 text-sm">{signal.title}</div>
                        <div className="text-xs text-purple-700 mt-1">{signal.summary}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extract Stats */}
              {briefing.extractStats && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Learning Activity</h3>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Events extracted: {briefing.extractStats.eventsExtracted}</div>
                    <div>Conflicts detected: {briefing.extractStats.conflictsDetected}</div>
                    {briefing.extractStats.lastRun && (
                      <div>Last run: {new Date(briefing.extractStats.lastRun).toLocaleTimeString()}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Cost Today */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Cost Today</h3>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">{briefing.costToday}¢</span>
                  <span className="text-sm text-gray-500">{briefing.tokensToday} tokens</span>
                </div>
              </div>

              {/* Store Counts */}
              {health && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Memory Store</h3>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 bg-blue-50 rounded">
                      <div className="text-lg font-bold text-blue-700">{health.storeCounts.core}</div>
                      <div className="text-blue-600">Core</div>
                    </div>
                    <div className="p-2 bg-green-50 rounded">
                      <div className="text-lg font-bold text-green-700">{health.storeCounts.working}</div>
                      <div className="text-green-600">Working</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="text-lg font-bold text-gray-700">{health.storeCounts.ephemeral}</div>
                      <div className="text-gray-600">Ephemeral</div>
                    </div>
                    <div className="p-2 bg-indigo-50 rounded">
                      <div className="text-lg font-bold text-indigo-700">{health.storeCounts.event}</div>
                      <div className="text-indigo-600">Event</div>
                    </div>
                    <div className="p-2 bg-purple-50 rounded">
                      <div className="text-lg font-bold text-purple-700">{health.storeCounts.signal}</div>
                      <div className="text-purple-600">Signal</div>
                    </div>
                    <div className="p-2 bg-yellow-50 rounded">
                      <div className="text-lg font-bold text-yellow-700">{health.storeCounts.proposed}</div>
                      <div className="text-yellow-600">Proposed</div>
                    </div>
                    <div className="p-2 bg-red-50 rounded">
                      <div className="text-lg font-bold text-red-700">{health.storeCounts.conflict}</div>
                      <div className="text-red-600">Conflict</div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded">
                      <div className="text-lg font-bold text-slate-700">{health.storeCounts.total}</div>
                      <div className="text-slate-600">Total</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
