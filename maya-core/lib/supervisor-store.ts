import { getMayaPostgresPool, ensureMayaPostgresSchema } from '@/lib/maya-db';
import { getMayaRuntimeConfig } from '@/lib/maya-env';
import {
  SupervisorWorkspace,
  AnalysisCard,
  SupervisorAction,
  DecisionEntry,
  RunRecord,
  WorkspaceMode,
  WorkspaceStatus,
  AnalysisKind,
  ActionType,
  ActionStatus,
  DecisionType,
  RunTriggerType,
  RunStatus
} from '@/lib/supervisor-types';

// Workspace Operations

export async function getWorkspace(id: string): Promise<SupervisorWorkspace | null> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();
  const result = await pool.query<{
    id: string;
    title: string;
    goal: string;
    current_focus: string | null;
    mode: string;
    constraints_json: string;
    open_questions_json: string;
    status: string;
    created_at: Date;
    updated_at: Date;
  }>('SELECT * FROM supervisor_workspace WHERE id = $1', [id]);

  if (!result.rows[0]) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    title: row.title,
    goal: row.goal,
    currentFocus: row.current_focus,
    mode: row.mode as WorkspaceMode,
    constraintsJson: row.constraints_json,
    openQuestionsJson: row.open_questions_json,
    status: row.status as WorkspaceStatus,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

export async function getActiveWorkspace(): Promise<SupervisorWorkspace | null> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();
  const result = await pool.query<{
    id: string;
    title: string;
    goal: string;
    current_focus: string | null;
    mode: string;
    constraints_json: string;
    open_questions_json: string;
    status: string;
    created_at: Date;
    updated_at: Date;
  }>("SELECT * FROM supervisor_workspace WHERE status = 'active' ORDER BY updated_at DESC LIMIT 1");

  if (!result.rows[0]) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    title: row.title,
    goal: row.goal,
    currentFocus: row.current_focus,
    mode: row.mode as WorkspaceMode,
    constraintsJson: row.constraints_json,
    openQuestionsJson: row.open_questions_json,
    status: row.status as WorkspaceStatus,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

export async function createWorkspace(
  id: string,
  title: string,
  goal: string,
  mode: WorkspaceMode = 'explore'
): Promise<SupervisorWorkspace> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();
  await pool.query(
    `INSERT INTO supervisor_workspace (id, title, goal, mode, status, constraints_json, open_questions_json)
     VALUES ($1, $2, $3, $4, 'active', '{}', '[]')`,
    [id, title, goal, mode]
  );
  return (await getWorkspace(id))!;
}

export async function updateWorkspace(
  id: string,
  updates: Partial<{
    title: string;
    goal: string;
    currentFocus: string | null;
    mode: WorkspaceMode;
    constraintsJson: string;
    openQuestionsJson: string;
    status: WorkspaceStatus;
  }>
): Promise<SupervisorWorkspace | null> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();

  const setClauses: string[] = [];
  const values: (string | null)[] = [];
  let paramIndex = 1;

  if (updates.title !== undefined) {
    setClauses.push(`title = $${paramIndex++}`);
    values.push(updates.title);
  }
  if (updates.goal !== undefined) {
    setClauses.push(`goal = $${paramIndex++}`);
    values.push(updates.goal);
  }
  if (updates.currentFocus !== undefined) {
    setClauses.push(`current_focus = $${paramIndex++}`);
    values.push(updates.currentFocus);
  }
  if (updates.mode !== undefined) {
    setClauses.push(`mode = $${paramIndex++}`);
    values.push(updates.mode);
  }
  if (updates.constraintsJson !== undefined) {
    setClauses.push(`constraints_json = $${paramIndex++}`);
    values.push(updates.constraintsJson);
  }
  if (updates.openQuestionsJson !== undefined) {
    setClauses.push(`open_questions_json = $${paramIndex++}`);
    values.push(updates.openQuestionsJson);
  }
  if (updates.status !== undefined) {
    setClauses.push(`status = $${paramIndex++}`);
    values.push(updates.status);
  }

  if (setClauses.length === 0) return getWorkspace(id);

  setClauses.push(`updated_at = NOW()`);
  values.push(id);

  await pool.query(
    `UPDATE supervisor_workspace SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
    values
  );

  return getWorkspace(id);
}

// Analysis Operations

export async function getAnalysisCards(workspaceId: string): Promise<AnalysisCard[]> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();
  const result = await pool.query<{
    id: string;
    workspace_id: string;
    kind: string;
    title: string;
    body: string;
    confidence: number;
    priority: string;
    source_scope: string;
    meta_json: string;
    created_at: Date;
  }>('SELECT * FROM supervisor_analysis WHERE workspace_id = $1 ORDER BY created_at DESC', [workspaceId]);

  return result.rows.map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    kind: row.kind as AnalysisKind,
    title: row.title,
    body: row.body,
    confidence: row.confidence,
    priority: row.priority as 'high' | 'medium' | 'low',
    sourceScope: row.source_scope,
    metaJson: row.meta_json,
    createdAt: row.created_at.toISOString()
  }));
}

export async function createAnalysisCard(
  id: string,
  workspaceId: string,
  kind: AnalysisKind,
  title: string,
  body: string,
  confidence: number = 50,
  priority: 'high' | 'medium' | 'low' = 'medium'
): Promise<AnalysisCard> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();
  await pool.query(
    `INSERT INTO supervisor_analysis (id, workspace_id, kind, title, body, confidence, priority)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, workspaceId, kind, title, body, confidence, priority]
  );

  const cards = await getAnalysisCards(workspaceId);
  return cards.find((c) => c.id === id)!;
}

// Action Operations

export async function getActions(workspaceId: string): Promise<SupervisorAction[]> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();
  const result = await pool.query<{
    id: string;
    workspace_id: string;
    action_type: string;
    title: string;
    description: string;
    payload_json: string;
    status: string;
    priority: string;
    requires_approval: boolean;
    proposed_by: string;
    approved_by: string | null;
    result_json: string;
    error_text: string | null;
    created_at: Date;
    updated_at: Date;
  }>('SELECT * FROM supervisor_action WHERE workspace_id = $1 ORDER BY created_at DESC', [workspaceId]);

  return result.rows.map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    actionType: row.action_type as ActionType,
    title: row.title,
    description: row.description,
    payloadJson: row.payload_json,
    status: row.status as ActionStatus,
    priority: row.priority as 'high' | 'medium' | 'low',
    requiresApproval: row.requires_approval,
    proposedBy: row.proposed_by,
    approvedBy: row.approved_by,
    resultJson: row.result_json,
    errorText: row.error_text,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  }));
}

export async function getAction(id: string): Promise<SupervisorAction | null> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();
  const result = await pool.query<{
    id: string;
    workspace_id: string;
    action_type: string;
    title: string;
    description: string;
    payload_json: string;
    status: string;
    priority: string;
    requires_approval: boolean;
    proposed_by: string;
    approved_by: string | null;
    result_json: string;
    error_text: string | null;
    created_at: Date;
    updated_at: Date;
  }>('SELECT * FROM supervisor_action WHERE id = $1', [id]);

  if (!result.rows[0]) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    actionType: row.action_type as ActionType,
    title: row.title,
    description: row.description,
    payloadJson: row.payload_json,
    status: row.status as ActionStatus,
    priority: row.priority as 'high' | 'medium' | 'low',
    requiresApproval: row.requires_approval,
    proposedBy: row.proposed_by,
    approvedBy: row.approved_by,
    resultJson: row.result_json,
    errorText: row.error_text,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

export async function createAction(
  id: string,
  workspaceId: string,
  actionType: ActionType,
  title: string,
  description: string,
  payloadJson: string = '{}',
  priority: 'high' | 'medium' | 'low' = 'medium',
  requiresApproval: boolean = true
): Promise<SupervisorAction> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();
  await pool.query(
    `INSERT INTO supervisor_action (id, workspace_id, action_type, title, description, payload_json, priority, requires_approval)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, workspaceId, actionType, title, description, payloadJson, priority, requiresApproval]
  );

  return (await getAction(id))!;
}

export async function updateActionStatus(
  id: string,
  status: ActionStatus,
  approvedBy?: string,
  resultJson?: string,
  errorText?: string
): Promise<SupervisorAction | null> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();

  const updates: string[] = ['status = $1', 'updated_at = NOW()'];
  const values: (string | null | undefined)[] = [status];
  let paramIndex = 2;

  if (approvedBy !== undefined) {
    updates.push(`approved_by = $${paramIndex++}`);
    values.push(approvedBy);
  }
  if (resultJson !== undefined) {
    updates.push(`result_json = $${paramIndex++}`);
    values.push(resultJson);
  }
  if (errorText !== undefined) {
    updates.push(`error_text = $${paramIndex++}`);
    values.push(errorText);
  }

  values.push(id);

  await pool.query(
    `UPDATE supervisor_action SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
    values
  );

  return getAction(id);
}

// Decision Operations

export async function getDecisions(workspaceId: string): Promise<DecisionEntry[]> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();
  const result = await pool.query<{
    id: string;
    workspace_id: string;
    action_id: string;
    decision: string;
    reason: string;
    actor: string;
    created_at: Date;
  }>('SELECT * FROM supervisor_decision WHERE workspace_id = $1 ORDER BY created_at DESC', [workspaceId]);

  return result.rows.map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    actionId: row.action_id,
    decision: row.decision as DecisionType,
    reason: row.reason,
    actor: row.actor,
    createdAt: row.created_at.toISOString()
  }));
}

export async function createDecision(
  id: string,
  workspaceId: string,
  actionId: string,
  decision: DecisionType,
  reason: string,
  actor: string
): Promise<DecisionEntry> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();
  await pool.query(
    `INSERT INTO supervisor_decision (id, workspace_id, action_id, decision, reason, actor)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, workspaceId, actionId, decision, reason, actor]
  );

  const decisions = await getDecisions(workspaceId);
  return decisions.find((d) => d.id === id)!;
}

// Run Operations

export async function getRuns(workspaceId: string): Promise<RunRecord[]> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();
  const result = await pool.query<{
    id: string;
    workspace_id: string;
    started_at: Date;
    ended_at: Date | null;
    trigger_type: string;
    objective: string;
    status: string;
    summary: string;
    metrics_json: string;
  }>('SELECT * FROM supervisor_run WHERE workspace_id = $1 ORDER BY started_at DESC', [workspaceId]);

  return result.rows.map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    startedAt: row.started_at.toISOString(),
    endedAt: row.ended_at?.toISOString() || null,
    triggerType: row.trigger_type as RunTriggerType,
    objective: row.objective,
    status: row.status as RunStatus,
    summary: row.summary,
    metricsJson: row.metrics_json
  }));
}

export async function getRun(id: string): Promise<RunRecord | null> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();
  const result = await pool.query<{
    id: string;
    workspace_id: string;
    started_at: Date;
    ended_at: Date | null;
    trigger_type: string;
    objective: string;
    status: string;
    summary: string;
    metrics_json: string;
  }>('SELECT * FROM supervisor_run WHERE id = $1', [id]);

  if (!result.rows[0]) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    startedAt: row.started_at.toISOString(),
    endedAt: row.ended_at?.toISOString() || null,
    triggerType: row.trigger_type as RunTriggerType,
    objective: row.objective,
    status: row.status as RunStatus,
    summary: row.summary,
    metricsJson: row.metrics_json
  };
}

export async function createRun(
  id: string,
  workspaceId: string,
  objective: string,
  triggerType: RunTriggerType = 'manual'
): Promise<RunRecord> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();
  await pool.query(
    `INSERT INTO supervisor_run (id, workspace_id, objective, trigger_type, status)
     VALUES ($1, $2, $3, $4, 'running')`,
    [id, workspaceId, objective, triggerType]
  );

  return (await getRun(id))!;
}

export async function completeRun(
  id: string,
  status: RunStatus,
  summary: string,
  metricsJson: string = '{}'
): Promise<RunRecord | null> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();
  await pool.query(
    `UPDATE supervisor_run SET ended_at = NOW(), status = $1, summary = $2, metrics_json = $3 WHERE id = $4`,
    [status, summary, metricsJson, id]
  );

  return getRun(id);
}
