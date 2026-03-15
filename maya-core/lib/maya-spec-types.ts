// Maya Spec Phase 1A Types

// Memory Store Entry
export type MemoryTier = 'core' | 'working' | 'ephemeral';
export type MemoryCategory = 'preference' | 'constraint' | 'insight' | 'fact' | 'goal' | 'relationship' | 'routine';

export type MemoryEntry = {
  id: string;
  tier: MemoryTier;
  category: MemoryCategory;
  topic: string;
  content: string;
  confidence: number; // 0-100
  domain: string;
  source: 'user' | 'inferred' | 'external';
  ttlDays: number | null;
  expiresAt: string | null;
  isDeleted: boolean;
  archivedAt: string | null;
  usageScore: number;
  contradictsId: string | null;
  assumption: boolean;
  createdAt: string;
  updatedAt: string;
};

// Messages
export type StudioMode = 'personal' | 'soulmatch_studio' | 'aicos_studio';

export type MayaMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  studioMode: StudioMode;
  provider: string;
  model: string;
  contextUsed: string[];
  contextReferenced: string[];
  tokenInput: number;
  tokenOutput: number;
  costCents: number;
  createdAt: string;
};

// Audit Log
export type AuditAction = 'memory_create' | 'memory_update' | 'memory_delete' | 'memory_confirm' | 'memory_deny' | 'memory_resolve_conflict' | 'chat' | 'context_build';

export type AuditEntry = {
  id: string;
  action: AuditAction;
  entityId: string;
  entityType: 'memory' | 'message' | 'context';
  detailsJson: string;
  actor: 'user' | 'maya';
  createdAt: string;
};

// App Context (Mock for Phase 1)
export type AppContextType = 'personal' | 'soulmatch_studio' | 'aicos_studio';

export type AppContext = {
  id: string;
  appType: AppContextType;
  mockDataJson: string;
  updatedAt: string;
};

// Provider Types
export type ProviderType = 'openai' | 'anthropic' | 'google' | 'mock';

export type ProviderModel = {
  id: string;
  name: string;
  maxTokens: number;
  supportsTemperature: boolean;
  supportsSystemPrompt: boolean;
  costPerTokenInputCents: number;
  costPerTokenOutputCents: number;
};

export type Provider = {
  type: ProviderType;
  name: string;
  models: ProviderModel[];
  defaultModel: string;
  available: boolean;
};

// Cost Guard
export type CostStatus = 'ok' | 'warning' | 'blocked';

export type CostGuardState = {
  dailyBudgetCents: number;
  spentTodayCents: number;
  spentWeekCents: number;
  tokensToday: number;
  status: CostStatus;
};

// Briefing
export type BriefingSlot = {
  id: string;
  type: 'proposed' | 'conflict' | 'reminder';
  title: string;
  summary: string;
  entityId: string | null;
  createdAt: string;
};

export type Briefing = {
  contextSummary: string;
  openProposed: BriefingSlot[];
  conflictSlot: BriefingSlot | null;
  costToday: number;
  tokensToday: number;
  generatedAt: string;
};

// Context Builder
export type ContextBuildMode = 'personal' | 'soulmatch_studio' | 'aicos_studio';

export type ContextBuildResult = {
  systemPrompt: string;
  contextEntries: MemoryEntry[];
  tokenCount: number;
  anchors: string[];
};

// Memory Operations
export type MemoryConfirmRequest = {
  memoryId: string;
};

export type MemoryDenyRequest = {
  memoryId: string;
  reason?: string;
};

export type MemoryConflictResolution = {
  memoryId: string;
  action: 'keep_both' | 'prefer_new' | 'prefer_old' | 'merge';
  mergedContent?: string;
};

// Health Response
export type MayaHealthResponse = {
  status: 'ok' | 'degraded' | 'blocked';
  costToday: number;
  costWeek: number;
  tokensToday: number;
  storeCounts: {
    core: number;
    working: number;
    ephemeral: number;
    total: number;
  };
  providerStatus: Record<string, boolean>;
};
