'use client';

import Link from 'next/link';

import { useState, useEffect, useCallback } from 'react';

type WorkspaceMode = 'explore' | 'plan' | 'execute' | 'review';
type WorkspaceStatus = 'active' | 'paused' | 'completed' | 'archived';
type AnalysisKind = 'observation' | 'analysis' | 'risk' | 'option' | 'recommendation' | 'summary';
type ActionType = 'update_workspace' | 'create_note' | 'set_focus' | 'resolve_question' | 'archive_card' | 'promote_option_to_plan' | 'create_execution_step';
type ActionStatus = 'proposed' | 'approved' | 'rejected' | 'running' | 'done' | 'failed';

type Workspace = {
  id: string;
  title: string;
  goal: string;
  currentFocus: string | null;
  mode: WorkspaceMode;
  constraintsJson: string;
  openQuestionsJson: string;
  status: WorkspaceStatus;
  createdAt: string;
  updatedAt: string;
};

type AnalysisCard = {
  id: string;
  workspaceId: string;
  kind: AnalysisKind;
  title: string;
  body: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  sourceScope: string;
  metaJson: string;
  createdAt: string;
};

type Action = {
  id: string;
  workspaceId: string;
  actionType: ActionType;
  title: string;
  description: string;
  payloadJson: string;
  status: ActionStatus;
  priority: 'high' | 'medium' | 'low';
  requiresApproval: boolean;
  proposedBy: string;
  approvedBy: string | null;
  resultJson: string;
  errorText: string | null;
  createdAt: string;
  updatedAt: string;
};

type Decision = {
  id: string;
  workspaceId: string;
  actionId: string;
  decision: 'approve' | 'reject' | 'defer' | 'comment';
  reason: string;
  actor: string;
  createdAt: string;
};

type Run = {
  id: string;
  workspaceId: string;
  startedAt: string;
  endedAt: string | null;
  triggerType: 'manual' | 'scheduled' | 'event';
  objective: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  summary: string;
  metricsJson: string;
};

const KIND_COLORS: Record<AnalysisKind, string> = {
  observation: 'bg-blue-100 text-blue-800',
  analysis: 'bg-purple-100 text-purple-800',
  risk: 'bg-red-100 text-red-800',
  option: 'bg-yellow-100 text-yellow-800',
  recommendation: 'bg-green-100 text-green-800',
  summary: 'bg-gray-100 text-gray-800'
};

const STATUS_COLORS: Record<ActionStatus, string> = {
  proposed: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  running: 'bg-blue-100 text-blue-800',
  done: 'bg-gray-100 text-gray-800',
  failed: 'bg-red-200 text-red-900'
};

const WORKSPACE_STATUS_LABELS: Record<WorkspaceStatus, string> = {
  active: 'aktiv',
  paused: 'pausiert',
  completed: 'abgeschlossen',
  archived: 'archiviert'
};

const WORKSPACE_MODE_LABELS: Record<WorkspaceMode, string> = {
  explore: 'erkunden',
  plan: 'planen',
  execute: 'ausführen',
  review: 'review'
};

const ANALYSIS_KIND_LABELS: Record<AnalysisKind, string> = {
  observation: 'Beobachtung',
  analysis: 'Analyse',
  risk: 'Risiko',
  option: 'Option',
  recommendation: 'Empfehlung',
  summary: 'Zusammenfassung'
};

const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  proposed: 'vorgeschlagen',
  approved: 'freigegeben',
  rejected: 'abgelehnt',
  running: 'läuft',
  done: 'erledigt',
  failed: 'fehlgeschlagen'
};

const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  update_workspace: 'Workspace aktualisieren',
  create_note: 'Notiz anlegen',
  set_focus: 'Fokus setzen',
  resolve_question: 'Frage klären',
  archive_card: 'Karte archivieren',
  promote_option_to_plan: 'Option in Plan überführen',
  create_execution_step: 'Ausführungsschritt anlegen'
};

const RUN_STATUS_LABELS: Record<Run['status'], string> = {
  running: 'läuft',
  completed: 'abgeschlossen',
  failed: 'fehlgeschlagen',
  cancelled: 'abgebrochen'
};

const DECISION_LABELS: Record<Decision['decision'], string> = {
  approve: 'freigeben',
  reject: 'ablehnen',
  defer: 'zurückstellen',
  comment: 'kommentieren'
};

const PRIORITY_LABELS: Record<'high' | 'medium' | 'low', string> = {
  high: 'hoch',
  medium: 'mittel',
  low: 'niedrig'
};

export function SupervisorScreen() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [cards, setCards] = useState<AnalysisCard[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [capabilityUnavailable, setCapabilityUnavailable] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [wsRes, cardsRes, actionsRes, decisionsRes, runsRes] = await Promise.all([
        fetch('/api/supervisor/workspace'),
        fetch(workspace ? `/api/supervisor/analysis?workspaceId=${workspace.id}` : '/api/supervisor/analysis?workspaceId=none'),
        fetch(workspace ? `/api/supervisor/actions?workspaceId=${workspace.id}` : '/api/supervisor/actions?workspaceId=none'),
        fetch(workspace ? `/api/supervisor/decisions?workspaceId=${workspace.id}` : '/api/supervisor/decisions?workspaceId=none'),
        fetch(workspace ? `/api/supervisor/runs?workspaceId=${workspace.id}` : '/api/supervisor/runs?workspaceId=none')
      ]);

      const wsData = await wsRes.json().catch(() => null);

      if (wsRes.status === 503 && wsData?.code === 'not_available_in_file_mode') {
        setCapabilityUnavailable(true);
        setWorkspace(null);
        setCards([]);
        setActions([]);
        setDecisions([]);
        setRuns([]);
        setError('Supervisor ist im lokalen file-Modus nicht verfügbar.');
        return;
      }

      if (wsRes.status === 404) {
        setCapabilityUnavailable(false);
        setWorkspace(null);
        setCards([]);
        setActions([]);
        setDecisions([]);
        setRuns([]);
        setError(null);
        return;
      }

      if (!wsRes.ok || !wsData?.workspace) {
        throw new Error('workspace_load_failed');
      }

      const [c, a, d, r] = await Promise.all([
        cardsRes.json().catch(() => null),
        actionsRes.json().catch(() => null),
        decisionsRes.json().catch(() => null),
        runsRes.json().catch(() => null)
      ]);

      const relatedResponses = [cardsRes, actionsRes, decisionsRes, runsRes];
      const relatedPayloads = [c, a, d, r];
      const capabilityBlocked = relatedResponses.some((response, index) => response.status === 503 && relatedPayloads[index]?.code === 'not_available_in_file_mode');

      if (capabilityBlocked) {
        setCapabilityUnavailable(true);
        setWorkspace(null);
        setCards([]);
        setActions([]);
        setDecisions([]);
        setRuns([]);
        setError('Supervisor ist im lokalen file-Modus nicht verfügbar.');
        return;
      }

      if (relatedResponses.some((response) => !response.ok)) {
        throw new Error('workspace_detail_load_failed');
      }

      setCapabilityUnavailable(false);
      setWorkspace(wsData.workspace);
      setCards(c?.cards || []);
      setActions(a?.actions || []);
      setDecisions(d?.decisions || []);
      setRuns(r?.runs || []);
      setError(null);
    } catch (e) {
      setCapabilityUnavailable(false);
      setError('Workspace konnte nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }, [workspace?.id]);

  useEffect(() => {
    fetchData();
  }, []);

  const createWorkspace = async () => {
    try {
      const res = await fetch('/api/supervisor/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          title: 'Neuer Workspace',
          goal: 'Ziel noch festlegen',
          mode: 'explore'
        })
      });

      const data = await res.json().catch(() => null);
      if (res.status === 503 && data?.code === 'not_available_in_file_mode') {
        setCapabilityUnavailable(true);
        setError('Supervisor ist im lokalen file-Modus nicht verfügbar.');
        return;
      }

      if (!res.ok || !data?.workspace) {
        throw new Error('workspace_create_failed');
      }

      setCapabilityUnavailable(false);
      setWorkspace(data.workspace);
      fetchData();
    } catch (e) {
      setError('Workspace konnte nicht angelegt werden');
    }
  };

  const handleDecision = async (actionId: string, decision: 'approve' | 'reject' | 'defer', reason: string = '') => {
    try {
      const res = await fetch(`/api/supervisor/actions/${actionId}/${decision}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      const data = await res.json().catch(() => null);
      if (res.status === 503 && data?.code === 'not_available_in_file_mode') {
        setCapabilityUnavailable(true);
        setError('Supervisor ist im lokalen file-Modus nicht verfügbar.');
        return;
      }

      if (!res.ok) {
        throw new Error('decision_failed');
      }

      fetchData();
    } catch (e) {
      setError('Entscheidung konnte nicht gespeichert werden');
    }
  };

  const handleRun = async (actionId: string) => {
    try {
      const res = await fetch(`/api/supervisor/actions/${actionId}/run`, {
        method: 'POST'
      });

      const data = await res.json().catch(() => null);
      if (res.status === 503 && data?.code === 'not_available_in_file_mode') {
        setCapabilityUnavailable(true);
        setError('Supervisor ist im lokalen file-Modus nicht verfügbar.');
        return;
      }

      if (!res.ok) {
        throw new Error('run_failed');
      }

      fetchData();
    } catch (e) {
      setError('Aktion konnte nicht ausgeführt werden');
    }
  };

  const topRisks = cards.filter((c) => c.kind === 'risk').slice(0, 3);
  const topRecommendation = cards.find((c) => c.kind === 'recommendation');
  const openQuestions = workspace ? JSON.parse(workspace.openQuestionsJson || '[]') : [];
  const proposedActions = actions.filter((a) => a.status === 'proposed');
  const recentRuns = runs.slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-4 rounded-lg border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
            Interner Supervisor-Raum. Diese Fläche ist nicht der empfohlene Maya-Arbeitsbereich.
          </div>
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded-lg" />
            <div className="h-64 bg-gray-200 rounded-lg" />
            <div className="h-48 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (capabilityUnavailable) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-xs uppercase tracking-[0.22em] text-violet-600">Interner Supervisor-Raum</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Supervisor lokal nicht verfügbar</h1>
            <p className="text-gray-600 mb-4">Diese Fläche benötigt derzeit eine Postgres-gestützte Maya-Umgebung und ist im lokalen file-Modus nicht aktiv.</p>
            <p className="text-gray-600 mb-6">Nutze lokal den Maya-Arbeitsbereich weiter oder aktiviere später bewusst die passende Storage-Umgebung.</p>
            <Link href="/maya" className="inline-flex rounded-full border border-violet-300/40 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-700 hover:border-violet-400 hover:bg-violet-500/15">
              Zurück zum Maya-Arbeitsbereich
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-xs uppercase tracking-[0.22em] text-violet-600">Interner Supervisor-Raum</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Kein aktiver Workspace</h1>
            <p className="text-gray-600 mb-4">Diese Fläche ist intern gerahmt und nicht als primärer Maya-Arbeitsbereich gedacht.</p>
            <p className="text-gray-600 mb-6">Lege einen Workspace an, wenn du den Supervisor-Raum bewusst verwenden willst.</p>
            <div className="mb-6">
              <Link href="/maya" className="inline-flex rounded-full border border-violet-300/40 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-700 hover:border-violet-400 hover:bg-violet-500/15">
                Zurück zum Maya-Arbeitsbereich
              </Link>
            </div>
            <button
              onClick={createWorkspace}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              Workspace anlegen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-violet-600">Interner Supervisor-Raum</div>
              <p className="mt-2 text-sm text-violet-900">Diese Fläche dient interner Aufsicht und ist nicht der empfohlene Hauptpfad für die normale Maya-Arbeit.</p>
            </div>
            <Link href="/maya" className="inline-flex rounded-full border border-violet-300/40 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-700 hover:border-violet-400 hover:bg-violet-500/15">
              Zum Maya-Arbeitsbereich
            </Link>
          </div>
        </div>

        {/* Workspace Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{workspace.title}</h1>
              <p className="text-gray-600 mt-1">{workspace.goal}</p>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                workspace.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {WORKSPACE_STATUS_LABELS[workspace.status]}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {WORKSPACE_MODE_LABELS[workspace.mode]}
              </span>
            </div>
          </div>
          {workspace.currentFocus && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <span className="text-sm font-medium text-yellow-800">Aktueller Fokus:</span>
              <span className="ml-2 text-yellow-900">{workspace.currentFocus}</span>
            </div>
          )}
          <div className="mt-4 text-xs text-gray-500">
            Letzte Aktualisierung: {new Date(workspace.updatedAt).toLocaleString()}
          </div>
        </div>

        {/* Current Situation */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Aktuelle Lage</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Höchste Risiken</h3>
              {topRisks.length > 0 ? (
                <ul className="space-y-2">
                  {topRisks.map((risk) => (
                    <li key={risk.id} className="p-2 bg-red-50 rounded border border-red-200">
                      <span className="font-medium text-red-900">{risk.title}</span>
                      <span className="block text-sm text-red-700 mt-1">{risk.body.slice(0, 100)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">Keine Risiken markiert</p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Hauptempfehlung</h3>
              {topRecommendation ? (
                <div className="p-3 bg-green-50 rounded border border-green-200">
                  <span className="font-medium text-green-900">{topRecommendation.title}</span>
                  <span className="block text-sm text-green-700 mt-1">{topRecommendation.body.slice(0, 150)}</span>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Noch keine Empfehlung</p>
              )}
              <h3 className="text-sm font-medium text-gray-700 mt-4 mb-2">Offene Fragen</h3>
              {openQuestions.length > 0 ? (
                <ul className="space-y-1">
                  {openQuestions.slice(0, 3).map((q: { id: string; question: string }, i: number) => (
                    <li key={q.id || i} className="text-sm text-gray-600">• {q.question}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">Keine offenen Fragen</p>
              )}
            </div>
          </div>
        </div>

        {/* Analysis Stream */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Analyse-Stream</h2>
          {cards.length > 0 ? (
            <div className="space-y-3">
              {cards.map((card) => (
                <div key={card.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${KIND_COLORS[card.kind]}`}>
                        {ANALYSIS_KIND_LABELS[card.kind]}
                      </span>
                      <h3 className="font-medium text-gray-900 mt-2">{card.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{card.body}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Konfidenz: {card.confidence}%</div>
                      <div className={`text-xs font-medium ${
                        card.priority === 'high' ? 'text-red-600' : card.priority === 'low' ? 'text-gray-500' : 'text-yellow-600'
                      }`}>
                        {PRIORITY_LABELS[card.priority]}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Noch keine Analysekarten</p>
          )}
        </div>

        {/* Action Queue */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Aktionswarteschlange</h2>
          {proposedActions.length > 0 ? (
            <div className="space-y-3">
              {proposedActions.map((action) => (
                <div key={action.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[action.status]}`}>
                        {ACTION_STATUS_LABELS[action.status]}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">{ACTION_TYPE_LABELS[action.actionType]}</span>
                      <h3 className="font-medium text-gray-900 mt-2">{action.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDecision(action.id, 'approve')}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Freigeben
                      </button>
                      <button
                        onClick={() => handleDecision(action.id, 'reject')}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Ablehnen
                      </button>
                      <button
                        onClick={() => handleDecision(action.id, 'defer')}
                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                      >
                        Zurückstellen
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Keine vorgeschlagenen Aktionen</p>
          )}

          {/* Approved actions ready to run */}
          {actions.filter((a) => a.status === 'approved').length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Bereit zur Ausführung</h3>
              <div className="space-y-2">
                {actions.filter((a) => a.status === 'approved').map((action) => (
                  <div key={action.id} className="p-3 bg-green-50 border border-green-200 rounded flex items-center justify-between">
                    <div>
                      <span className="font-medium text-green-900">{action.title}</span>
                      <span className="block text-sm text-green-700">{action.description}</span>
                    </div>
                    <button
                      onClick={() => handleRun(action.id)}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      Ausführen
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Run Timeline */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Laufverlauf</h2>
          {recentRuns.length > 0 ? (
            <div className="space-y-2">
              {recentRuns.map((run) => (
                <div key={run.id} className="p-3 border rounded flex items-center justify-between">
                  <div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      run.status === 'running' ? 'bg-blue-100 text-blue-800' :
                      run.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {RUN_STATUS_LABELS[run.status]}
                    </span>
                    <span className="ml-2 font-medium text-gray-900">{run.objective}</span>
                    {run.summary && <span className="block text-sm text-gray-600 mt-1">{run.summary}</span>}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(run.startedAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Keine Läufe erfasst</p>
          )}
        </div>

        {/* Decision Log */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Entscheidungsprotokoll</h2>
          {decisions.length > 0 ? (
            <div className="space-y-2">
              {decisions.slice(0, 10).map((decision) => (
                <div key={decision.id} className="p-3 border rounded flex items-center justify-between">
                  <div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      decision.decision === 'approve' ? 'bg-green-100 text-green-800' :
                      decision.decision === 'reject' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {DECISION_LABELS[decision.decision]}
                    </span>
                    <span className="ml-2 text-gray-700">{decision.reason || 'Keine Begründung hinterlegt'}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {decision.actor} • {new Date(decision.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Keine Entscheidungen protokolliert</p>
          )}
        </div>

        {error && (
          <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow">
            {error}
            <button onClick={() => setError(null)} className="ml-2 font-bold">×</button>
          </div>
        )}
      </div>
    </div>
  );
}
