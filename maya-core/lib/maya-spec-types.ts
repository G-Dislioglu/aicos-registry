// Maya Spec Phase 1A/1B-A/1C Types

// Memory Store Entry
// Phase 1B-A: Extended tiers for Cognitive Engine
export type MemoryTier = 'core' | 'working' | 'ephemeral' | 'event' | 'signal' | 'proposed' | 'conflict';
export type MemoryCategory = 'preference' | 'constraint' | 'insight' | 'fact' | 'goal' | 'relationship' | 'routine';
export type MemorySource = 'user' | 'inferred' | 'external' | 'cognitive_engine';
export type ReviewStatus = 'pending' | 'confirmed' | 'denied' | 'resolved';

// Phase 1C: Review Labels per Tier
export type EventReviewLabel = 'useful' | 'trivial' | 'wrong';
export type ConflictReviewLabel = 'real_conflict' | 'false_positive' | 'unclear';
export type ProposedReviewLabel = 'useful' | 'overreach' | 'redundant';
export type SignalReviewLabel = 'promising' | 'noise';
export type ReviewLabel = EventReviewLabel | ConflictReviewLabel | ProposedReviewLabel | SignalReviewLabel;
export type ReviewType = 'event' | 'conflict' | 'proposed' | 'signal';

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
// Phase 1C: Extended for calibration and review
export type AuditAction = 
  | 'memory_create' | 'memory_update' | 'memory_delete' 
  | 'memory_confirm' | 'memory_deny' | 'memory_resolve_conflict' 
  | 'chat' | 'context_build'
  | 'extract_run' | 'extract_event_saved' | 'extract_conflict_detected'
  | 'signal_promoted' | 'proposed_generated' | 'lifecycle_cleanup'
  | 'review_set' | 'tuning_changed' | 'daily_summary' | 'weekly_report';

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

// Phase 1C: Review Entry for Calibration
export type ReviewEntry = {
  id: string;
  memoryEntryId: string;
  entryTier: MemoryTier;
  reviewType: ReviewType;
  reviewLabel: ReviewLabel;
  reviewNote: string | null;
  actor: 'user' | 'maya';
  sessionId: string | null;
  mode: StudioMode | null;
  createdAt: string;
};

// Phase 1C: Calibration Settings
export type CalibrationSettings = {
  extractEnabled: boolean;
  extractDegradedMode: boolean;
  overlapThreshold: 'strict' | 'normal' | 'loose';
  signalToEventThreshold: number; // 0-100 confidence
  proposedGenerationThreshold: number; // occurrences in 7 days
  conflictSensitivity: 'low' | 'normal' | 'high';
  lifecycleAggressiveness: 'conservative' | 'normal' | 'aggressive';
};

// Phase 1C: Calibration Metrics
export type CalibrationMetrics = {
  extractRunsTotal: number;
  extractSuccessRate: number;
  extractDegradedRate: number;
  eventCount: number;
  signalCount: number;
  proposedCount: number;
  conflictCount: number;
  eventUsefulRate: number;
  conflictFalsePositiveRate: number;
  proposedOverreachRate: number;
  reviewCoverageRate: number;
  avgConfidenceByTier: Record<MemoryTier, number>;
  avgConfidenceApproved: number;
  avgConfidenceDenied: number;
  extractCostToday: number;
  extractCostWeek: number;
  extractLatencyMs: number | null;
  extractsSkippedBudget: number;
  extractsSkippedError: number;
};

// Phase 1C: Daily Summary
export type DailySummary = {
  date: string;
  newEventsLearned: number;
  conflictsReal: number;
  conflictsFalsePositive: number;
  proposedUseful: number;
  proposedOverreach: number;
  topRecurringTopics: Array<{ topic: string; count: number }>;
  systemTendency: 'aggressive' | 'balanced' | 'passive';
  costBenefitRatio: number;
  extractCost: number;
  reviewCount: number;
};

// Phase 1C: Weekly Calibration Report
export type WeeklyCalibrationReport = {
  weekStart: string;
  weekEnd: string;
  topErrorPatterns: string[];
  topUsefulEvents: Array<{ topic: string; confidence: number }>;
  topFalsePositives: Array<{ topic: string; reason: string }>;
  confidenceDistribution: Record<MemoryTier, { min: number; max: number; avg: number }>;
  recommendedTunings: string[];
  phase2Candidates: string[];
  totalExtracts: number;
  totalReviews: number;
  overallFalsePositiveRate: number;
};

// Phase 1C: Review Queue Item
export type ReviewQueueItem = {
  id: string;
  memoryEntry: MemoryEntry;
  priority: number;
  tier: MemoryTier;
  createdAt: string;
};

// Health Response
// Phase 1B-A: Extended with extract status and tier counts
// Phase 1C: Extended with calibration status
// Phase 1C Ops: Extended with chatProvider readiness
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
  chatProvider: {
    ready: boolean;
    primaryProvider: string;
    primaryModel: string;
    keyConfigured: boolean;
    isMockMode: boolean;
  };
  extractStatus: {
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
