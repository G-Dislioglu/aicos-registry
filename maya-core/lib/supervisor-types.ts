// Supervisor Workspace Types

export type WorkspaceMode = 'explore' | 'plan' | 'execute' | 'review';
export type WorkspaceStatus = 'active' | 'paused' | 'completed' | 'archived';

export type SupervisorWorkspace = {
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

// Analysis Stream

export type AnalysisKind = 'observation' | 'analysis' | 'risk' | 'option' | 'recommendation' | 'summary';

export type AnalysisCard = {
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

// Action Queue

export type ActionType =
  | 'update_workspace'
  | 'create_note'
  | 'set_focus'
  | 'resolve_question'
  | 'archive_card'
  | 'promote_option_to_plan'
  | 'create_execution_step';

export type ActionStatus = 'proposed' | 'approved' | 'rejected' | 'running' | 'done' | 'failed';

export type SupervisorAction = {
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

// Decision Ledger

export type DecisionType = 'approve' | 'reject' | 'defer' | 'comment';

export type DecisionEntry = {
  id: string;
  workspaceId: string;
  actionId: string;
  decision: DecisionType;
  reason: string;
  actor: string;
  createdAt: string;
};

// Run Ledger

export type RunTriggerType = 'manual' | 'scheduled' | 'event';
export type RunStatus = 'running' | 'completed' | 'failed' | 'cancelled';

export type RunRecord = {
  id: string;
  workspaceId: string;
  startedAt: string;
  endedAt: string | null;
  triggerType: RunTriggerType;
  objective: string;
  status: RunStatus;
  summary: string;
  metricsJson: string;
};

// API Response Types

export type WorkspaceApiResponse = {
  workspace: SupervisorWorkspace;
};

export type AnalysisListResponse = {
  cards: AnalysisCard[];
};

export type ActionListResponse = {
  actions: SupervisorAction[];
};

export type DecisionListResponse = {
  decisions: DecisionEntry[];
};

export type RunListResponse = {
  runs: RunRecord[];
};

export type ExecutionRequest = {
  actionId: string;
};

export type ExecutionResponse = {
  success: boolean;
  action: SupervisorAction;
  error?: string;
};
