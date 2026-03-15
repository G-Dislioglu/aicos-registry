// Maya Spec Phase 1A/1B-A Types

// Memory Store Entry
// Phase 1B-A: Extended tiers for Cognitive Engine
export type MemoryTier = 'core' | 'working' | 'ephemeral' | 'event' | 'signal' | 'proposed' | 'conflict';
export type MemoryCategory = 'preference' | 'constraint' | 'insight' | 'fact' | 'goal' | 'relationship' | 'routine';
export type MemorySource = 'user' | 'inferred' | 'external' | 'cognitive_engine';
export type ReviewStatus = 'pending' | 'confirmed' | 'denied' | 'resolved';

export type MemoryEntry = {
  id: string;
  tier: MemoryTier;
  category: MemoryCategory;
  topic: string;
  content: string;
  confidence: number; // 0-100
  domain: string;
  source: MemorySource;
  ttlDays: number | null;
  expiresAt: string | null;
  isDeleted: boolean;
  archivedAt: string | null;
  usageScore: number;
  contradictsId: string | null;
  assumption: boolean;
  // Phase 1B-A additions
  severity: number; // 1-5, for conflicts
  reviewStatus: ReviewStatus;
  metaJson: string; // JSON for additional metadata
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
// Phase 1B-A: Extended audit actions for Cognitive Engine
export type AuditAction = 
  | 'memory_create' | 'memory_update' | 'memory_delete' 
  | 'memory_confirm' | 'memory_deny' | 'memory_resolve_conflict' 
  | 'chat' | 'context_build'
  | 'extract_run' | 'extract_event_saved' | 'extract_conflict_detected'
  | 'signal_promoted' | 'proposed_generated' | 'lifecycle_cleanup';

export type AuditEntry = {
  id: string;
  action: AuditAction;
  entityId: string;
  entityType: 'memory' | 'message' | 'context' | 'extract';
  detailsJson: string;
  actor: 'user' | 'maya' | 'cognitive_engine';
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
// Phase 1B-A: Extended briefing with multiple conflicts/proposed/signals
export type BriefingSlot = {
  id: string;
  type: 'proposed' | 'conflict' | 'signal' | 'reminder';
  title: string;
  summary: string;
  entityId: string | null;
  severity?: number;
  confidence?: number;
  createdAt: string;
};

export type Briefing = {
  contextSummary: string;
  openProposed: BriefingSlot[];
  conflicts: BriefingSlot[]; // Changed from single conflictSlot to array
  signals: BriefingSlot[]; // New: signals awaiting review
  costToday: number;
  tokensToday: number;
  extractStats?: {
    lastRun: string | null;
    eventsExtracted: number;
    conflictsDetected: number;
  };
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
// Phase 1B-A: Extended with extract status and tier counts
export type MayaHealthResponse = {
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
  extractStatus: {
    enabled: boolean;
    lastRun: string | null;
    lastLifecycleRun: string | null;
    extractCostToday: number;
  };
};
