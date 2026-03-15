import { ensureMayaPostgresSchema, getMayaPostgresPool } from '@/lib/maya-db';
import {
  MemoryEntry,
  MemoryTier,
  ReviewLabel,
  ReviewType,
  ReviewEntry,
  CalibrationSettings,
  CalibrationMetrics,
  DailySummary,
  WeeklyCalibrationReport,
  ReviewQueueItem,
  StudioMode
} from '@/lib/maya-spec-types';
import { getMemoryEntries, createAuditEntry } from '@/lib/maya-memory-store';

// =====================================================
// REVIEW OPERATIONS
// =====================================================

export async function createReview(params: {
  memoryEntryId: string;
  entryTier: MemoryTier;
  reviewType: ReviewType;
  reviewLabel: ReviewLabel;
  reviewNote?: string;
  actor?: 'user' | 'maya';
  sessionId?: string;
  mode?: StudioMode;
}): Promise<ReviewEntry> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();

  const id = crypto.randomUUID();

  await pool.query(
    `INSERT INTO maya_review (id, memory_entry_id, entry_tier, review_type, review_label, review_note, actor, session_id, mode)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (memory_entry_id, actor) DO UPDATE SET
       review_label = EXCLUDED.review_label,
       review_note = EXCLUDED.review_note,
       created_at = NOW()`,
    [
      id,
      params.memoryEntryId,
      params.entryTier,
      params.reviewType,
      params.reviewLabel,
      params.reviewNote || null,
      params.actor || 'user',
      params.sessionId || null,
      params.mode || null
    ]
  );

  // Update memory entry review status based on label
  const newStatus = mapReviewLabelToStatus(params.reviewLabel);
  if (newStatus) {
    await pool.query(
      `UPDATE maya_memory SET review_status = $1, updated_at = NOW() WHERE id = $2`,
      [newStatus, params.memoryEntryId]
    );
  }

  // Audit log
  await createAuditEntry({
    action: 'review_set',
    entityId: params.memoryEntryId,
    entityType: 'memory',
    detailsJson: JSON.stringify({
      reviewType: params.reviewType,
      reviewLabel: params.reviewLabel,
      reviewNote: params.reviewNote
    }),
    actor: params.actor || 'user'
  });

  return {
    id,
    memoryEntryId: params.memoryEntryId,
    entryTier: params.entryTier,
    reviewType: params.reviewType,
    reviewLabel: params.reviewLabel,
    reviewNote: params.reviewNote || null,
    actor: params.actor || 'user',
    sessionId: params.sessionId || null,
    mode: params.mode || null,
    createdAt: new Date().toISOString()
  };
}

function mapReviewLabelToStatus(label: ReviewLabel): string | null {
  if (['useful', 'real_conflict', 'promising'].includes(label)) return 'confirmed';
  if (['wrong', 'false_positive', 'noise'].includes(label)) return 'denied';
  if (['trivial', 'unclear', 'overreach', 'redundant'].includes(label)) return 'denied';
  return null;
}

export async function getReviews(options?: {
  memoryEntryId?: string;
  reviewType?: ReviewType;
  reviewLabel?: ReviewLabel;
  limit?: number;
}): Promise<ReviewEntry[]> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();

  const conditions: string[] = [];
  const values: (string | number)[] = [];
  let paramIndex = 1;

  if (options?.memoryEntryId) {
    conditions.push(`memory_entry_id = $${paramIndex++}`);
    values.push(options.memoryEntryId);
  }
  if (options?.reviewType) {
    conditions.push(`review_type = $${paramIndex++}`);
    values.push(options.reviewType);
  }
  if (options?.reviewLabel) {
    conditions.push(`review_label = $${paramIndex++}`);
    values.push(options.reviewLabel);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limitClause = options?.limit ? `LIMIT $${paramIndex}` : '';
  if (options?.limit) values.push(options.limit);

  const result = await pool.query<{
    id: string;
    memory_entry_id: string;
    entry_tier: string;
    review_type: string;
    review_label: string;
    review_note: string | null;
    actor: string;
    session_id: string | null;
    mode: string | null;
    created_at: Date;
  }>(
    `SELECT * FROM maya_review ${whereClause} ORDER BY created_at DESC ${limitClause}`,
    values
  );

  return result.rows.map(row => ({
    id: row.id,
    memoryEntryId: row.memory_entry_id,
    entryTier: row.entry_tier as MemoryTier,
    reviewType: row.review_type as ReviewType,
    reviewLabel: row.review_label as ReviewLabel,
    reviewNote: row.review_note,
    actor: row.actor as 'user' | 'maya',
    sessionId: row.session_id,
    mode: row.mode as StudioMode | null,
    createdAt: row.created_at.toISOString()
  }));
}

export async function getReviewCounts(): Promise<Record<ReviewLabel, number>> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();

  const result = await pool.query<{ review_label: string; count: string }>(
    `SELECT review_label, COUNT(*) as count FROM maya_review GROUP BY review_label`
  );

  const counts: Record<string, number> = {
    useful: 0, trivial: 0, wrong: 0,
    real_conflict: 0, false_positive: 0, unclear: 0,
    promising: 0, noise: 0,
    overreach: 0, redundant: 0
  };

  for (const row of result.rows) {
    counts[row.review_label] = parseInt(row.count, 10);
  }

  return counts as Record<ReviewLabel, number>;
}

// =====================================================
// REVIEW QUEUE
// =====================================================

export async function getReviewQueue(options?: {
  tier?: MemoryTier;
  mode?: StudioMode;
  unresolvedOnly?: boolean;
  lastHours?: number;
  limit?: number;
}): Promise<ReviewQueueItem[]> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();

  const limit = options?.limit || 20;
  const lastHours = options?.lastHours || 168; // 7 days default

  // Priority: conflict > proposed > event > signal
  const priorityOrder = `
    CASE tier
      WHEN 'conflict' THEN 1
      WHEN 'proposed' THEN 2
      WHEN 'event' THEN 3
      WHEN 'signal' THEN 4
      ELSE 5
    END
  `;

  const conditions: string[] = [
    `is_deleted = false`,
    `tier IN ('conflict', 'proposed', 'event', 'signal')`,
    `created_at > NOW() - INTERVAL '${lastHours} hours'`
  ];

  if (options?.unresolvedOnly) {
    conditions.push(`review_status = 'pending'`);
    conditions.push(`NOT EXISTS (SELECT 1 FROM maya_review r WHERE r.memory_entry_id = maya_memory.id)`);
  }

  if (options?.tier) {
    conditions.push(`tier = '${options.tier}'`);
  }

  const result = await pool.query<{
    id: string;
    tier: string;
    topic: string;
    content: string;
    confidence: number;
    review_status: string;
    created_at: Date;
  }>(
    `SELECT id, tier, topic, content, confidence, review_status, created_at
     FROM maya_memory
     WHERE ${conditions.join(' AND ')}
     ORDER BY ${priorityOrder}, created_at DESC
     LIMIT $1`,
    [limit]
  );

  const reviewCounts = await pool.query<{ memory_entry_id: string; count: string }>(
    `SELECT memory_entry_id, COUNT(*) as count FROM maya_review GROUP BY memory_entry_id`
  );
  const reviewedIds = new Set(reviewCounts.rows.map(r => r.memory_entry_id));

  return result.rows.map((row, idx) => ({
    id: `queue-${row.id}`,
    memoryEntry: {
      id: row.id,
      tier: row.tier as MemoryTier,
      topic: row.topic,
      content: row.content,
      confidence: row.confidence,
      reviewStatus: row.review_status as 'pending' | 'confirmed' | 'denied' | 'resolved',
      createdAt: row.created_at.toISOString()
    } as MemoryEntry,
    priority: idx + 1,
    tier: row.tier as MemoryTier,
    createdAt: row.created_at.toISOString()
  }));
}

// =====================================================
// CALIBRATION SETTINGS
// =====================================================

export async function getCalibrationSettings(): Promise<CalibrationSettings> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();

  const result = await pool.query<{
    extract_enabled: boolean;
    extract_degraded_mode: boolean;
    overlap_threshold: string;
    signal_to_event_threshold: number;
    proposed_generation_threshold: number;
    conflict_sensitivity: string;
    lifecycle_aggressiveness: string;
  }>(`SELECT * FROM maya_calibration_settings WHERE id = 'primary'`);

  if (!result.rows[0]) {
    return getDefaultSettings();
  }

  const row = result.rows[0];
  return {
    extractEnabled: row.extract_enabled,
    extractDegradedMode: row.extract_degraded_mode,
    overlapThreshold: row.overlap_threshold as 'strict' | 'normal' | 'loose',
    signalToEventThreshold: row.signal_to_event_threshold,
    proposedGenerationThreshold: row.proposed_generation_threshold,
    conflictSensitivity: row.conflict_sensitivity as 'low' | 'normal' | 'high',
    lifecycleAggressiveness: row.lifecycle_aggressiveness as 'conservative' | 'normal' | 'aggressive'
  };
}

function getDefaultSettings(): CalibrationSettings {
  return {
    extractEnabled: true,
    extractDegradedMode: false,
    overlapThreshold: 'normal',
    signalToEventThreshold: 80,
    proposedGenerationThreshold: 3,
    conflictSensitivity: 'normal',
    lifecycleAggressiveness: 'normal'
  };
}

export async function updateCalibrationSettings(updates: Partial<CalibrationSettings>): Promise<CalibrationSettings> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();

  const setClauses: string[] = ['updated_at = NOW()'];
  const values: (string | number | boolean)[] = [];
  let paramIndex = 1;

  if (updates.extractEnabled !== undefined) {
    setClauses.push(`extract_enabled = $${paramIndex++}`);
    values.push(updates.extractEnabled);
  }
  if (updates.extractDegradedMode !== undefined) {
    setClauses.push(`extract_degraded_mode = $${paramIndex++}`);
    values.push(updates.extractDegradedMode);
  }
  if (updates.overlapThreshold !== undefined) {
    setClauses.push(`overlap_threshold = $${paramIndex++}`);
    values.push(updates.overlapThreshold);
  }
  if (updates.signalToEventThreshold !== undefined) {
    setClauses.push(`signal_to_event_threshold = $${paramIndex++}`);
    values.push(updates.signalToEventThreshold);
  }
  if (updates.proposedGenerationThreshold !== undefined) {
    setClauses.push(`proposed_generation_threshold = $${paramIndex++}`);
    values.push(updates.proposedGenerationThreshold);
  }
  if (updates.conflictSensitivity !== undefined) {
    setClauses.push(`conflict_sensitivity = $${paramIndex++}`);
    values.push(updates.conflictSensitivity);
  }
  if (updates.lifecycleAggressiveness !== undefined) {
    setClauses.push(`lifecycle_aggressiveness = $${paramIndex++}`);
    values.push(updates.lifecycleAggressiveness);
  }

  await pool.query(
    `UPDATE maya_calibration_settings SET ${setClauses.join(', ')} WHERE id = 'primary'`,
    values
  );

  // Audit log
  await createAuditEntry({
    action: 'tuning_changed',
    entityId: 'calibration_settings',
    entityType: 'memory',
    detailsJson: JSON.stringify(updates),
    actor: 'user'
  });

  return getCalibrationSettings();
}

// =====================================================
// CALIBRATION METRICS
// =====================================================

export async function getCalibrationMetrics(): Promise<CalibrationMetrics> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();

  // Get tier counts
  const tierCounts = await pool.query<{ tier: string; count: string }>(
    `SELECT tier, COUNT(*) as count FROM maya_memory WHERE is_deleted = false GROUP BY tier`
  );
  const tierMap: Record<string, number> = {};
  for (const row of tierCounts.rows) {
    tierMap[row.tier] = parseInt(row.count, 10);
  }

  // Get review counts
  const reviewCounts = await getReviewCounts();

  // Get extract stats
  const extractStats = await pool.query<{
    events_extracted_today: number;
    conflicts_detected_today: number;
    extract_cost_today: number;
  }>(`SELECT * FROM maya_extract_status WHERE id = 'primary'`);

  const extract = extractStats.rows[0] || { events_extracted_today: 0, conflicts_detected_today: 0, extract_cost_today: 0 };

  // Get audit counts for extract runs
  const auditCounts = await pool.query<{ action: string; count: string }>(
    `SELECT action, COUNT(*) as count FROM maya_audit 
     WHERE action LIKE 'extract%' AND created_at > NOW() - INTERVAL '7 days'
     GROUP BY action`
  );
  const auditMap: Record<string, number> = {};
  for (const row of auditCounts.rows) {
    auditMap[row.action] = parseInt(row.count, 10);
  }

  // Calculate rates
  const totalReviews = Object.values(reviewCounts).reduce((a, b) => a + b, 0);
  const totalEvents = tierMap['event'] || 0;
  const totalConflicts = tierMap['conflict'] || 0;
  const totalProposed = tierMap['proposed'] || 0;

  const eventUsefulRate = totalReviews > 0 ? (reviewCounts['useful'] || 0) / Math.max(totalEvents, 1) : 0;
  const conflictFPRate = totalReviews > 0 ? (reviewCounts['false_positive'] || 0) / Math.max(totalConflicts, 1) : 0;
  const proposedOverreachRate = totalReviews > 0 ? (reviewCounts['overreach'] || 0) / Math.max(totalProposed, 1) : 0;

  // Get avg confidence by tier
  const confidenceByTier = await pool.query<{ tier: string; avg: string }>(
    `SELECT tier, AVG(confidence) as avg FROM maya_memory WHERE is_deleted = false GROUP BY tier`
  );
  const avgConfidence: Record<string, number> = {};
  for (const row of confidenceByTier.rows) {
    avgConfidence[row.tier] = parseFloat(row.avg) || 0;
  }

  // Get avg confidence for approved vs denied
  const approvedConf = await pool.query<{ avg: string }>(
    `SELECT AVG(m.confidence) as avg FROM maya_memory m 
     JOIN maya_review r ON r.memory_entry_id = m.id 
     WHERE r.review_label IN ('useful', 'real_conflict', 'promising')`
  );
  const deniedConf = await pool.query<{ avg: string }>(
    `SELECT AVG(m.confidence) as avg FROM maya_memory m 
     JOIN maya_review r ON r.memory_entry_id = m.id 
     WHERE r.review_label IN ('wrong', 'false_positive', 'noise', 'overreach', 'redundant')`
  );

  // Get total entries needing review
  const needsReview = await pool.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM maya_memory 
     WHERE is_deleted = false AND tier IN ('conflict', 'proposed', 'event', 'signal') AND review_status = 'pending'`
  );

  const reviewCoverageRate = totalReviews > 0 
    ? totalReviews / (totalReviews + parseInt(needsReview.rows[0]?.count || '0', 10))
    : 0;

  return {
    extractRunsTotal: auditMap['extract_run'] || 0,
    extractSuccessRate: 1, // Simplified - would need error tracking
    extractDegradedRate: 0,
    eventCount: totalEvents,
    signalCount: tierMap['signal'] || 0,
    proposedCount: totalProposed,
    conflictCount: totalConflicts,
    eventUsefulRate: Math.round(eventUsefulRate * 100) / 100,
    conflictFalsePositiveRate: Math.round(conflictFPRate * 100) / 100,
    proposedOverreachRate: Math.round(proposedOverreachRate * 100) / 100,
    reviewCoverageRate: Math.round(reviewCoverageRate * 100) / 100,
    avgConfidenceByTier: avgConfidence as Record<MemoryTier, number>,
    avgConfidenceApproved: parseFloat(approvedConf.rows[0]?.avg) || 0,
    avgConfidenceDenied: parseFloat(deniedConf.rows[0]?.avg) || 0,
    extractCostToday: extract.extract_cost_today,
    extractCostWeek: extract.extract_cost_today * 7, // Approximation
    extractLatencyMs: null,
    extractsSkippedBudget: 0,
    extractsSkippedError: 0
  };
}

// =====================================================
// DAILY SUMMARY
// =====================================================

export async function getDailySummary(date?: string): Promise<DailySummary> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();

  const targetDate = date || new Date().toISOString().split('T')[0];
  const startOfDay = `${targetDate}T00:00:00Z`;
  const endOfDay = `${targetDate}T23:59:59Z`;

  // Get new entries by tier today
  const newEntries = await pool.query<{ tier: string; count: string }>(
    `SELECT tier, COUNT(*) as count FROM maya_memory 
     WHERE created_at >= $1 AND created_at <= $2 AND is_deleted = false
     GROUP BY tier`,
    [startOfDay, endOfDay]
  );
  const newByTier: Record<string, number> = {};
  for (const row of newEntries.rows) {
    newByTier[row.tier] = parseInt(row.count, 10);
  }

  // Get reviews today
  const reviewsToday = await pool.query<{ review_label: string; count: string }>(
    `SELECT review_label, COUNT(*) as count FROM maya_review 
     WHERE created_at >= $1 AND created_at <= $2
     GROUP BY review_label`,
    [startOfDay, endOfDay]
  );
  const reviewsByLabel: Record<string, number> = {};
  for (const row of reviewsToday.rows) {
    reviewsByLabel[row.review_label] = parseInt(row.count, 10);
  }

  // Top recurring topics (from proposed generation)
  const topTopics = await pool.query<{ topic: string; count: string }>(
    `SELECT topic, COUNT(*) as count FROM maya_memory 
     WHERE source = 'cognitive_engine' AND created_at >= NOW() - INTERVAL '7 days'
     GROUP BY topic ORDER BY count DESC LIMIT 5`
  );

  // Calculate system tendency
  const fpCount = reviewsByLabel['false_positive'] || 0;
  const overreachCount = reviewsByLabel['overreach'] || 0;
  const usefulCount = (reviewsByLabel['useful'] || 0) + (reviewsByLabel['real_conflict'] || 0);
  const totalJudged = fpCount + overreachCount + usefulCount;

  let tendency: 'aggressive' | 'balanced' | 'passive' = 'balanced';
  if (totalJudged > 0) {
    const badRate = (fpCount + overreachCount) / totalJudged;
    if (badRate > 0.4) tendency = 'aggressive';
    else if (badRate < 0.2) tendency = 'passive';
  }

  // Get extract cost
  const extractCost = await pool.query<{ total: string }>(
    `SELECT COALESCE(SUM(cost_cents), 0) as total FROM maya_messages 
     WHERE created_at >= $1 AND created_at <= $2`,
    [startOfDay, endOfDay]
  );

  return {
    date: targetDate,
    newEventsLearned: newByTier['event'] || 0,
    conflictsReal: reviewsByLabel['real_conflict'] || 0,
    conflictsFalsePositive: reviewsByLabel['false_positive'] || 0,
    proposedUseful: reviewsByLabel['useful'] || 0,
    proposedOverreach: reviewsByLabel['overreach'] || 0,
    topRecurringTopics: topTopics.rows.map(r => ({ topic: r.topic, count: parseInt(r.count, 10) })),
    systemTendency: tendency,
    costBenefitRatio: usefulCount > 0 ? Math.round((usefulCount / Math.max(totalJudged, 1)) * 100) / 100 : 0,
    extractCost: parseInt(extractCost.rows[0]?.total || '0', 10),
    reviewCount: Object.values(reviewsByLabel).reduce((a, b) => a + b, 0)
  };
}

// =====================================================
// WEEKLY CALIBRATION REPORT
// =====================================================

export async function getWeeklyCalibrationReport(weekStart?: string): Promise<WeeklyCalibrationReport> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();

  const startDate = weekStart ? new Date(weekStart) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  // Top false positives
  const topFPs = await pool.query<{ topic: string; review_note: string }>(
    `SELECT m.topic, r.review_note as reason FROM maya_review r
     JOIN maya_memory m ON m.id = r.memory_entry_id
     WHERE r.review_label = 'false_positive' 
     AND r.created_at >= $1 AND r.created_at <= $2
     LIMIT 5`,
    [startStr, endStr]
  );

  // Top useful events
  const topUseful = await pool.query<{ topic: string; confidence: number }>(
    `SELECT m.topic, m.confidence FROM maya_review r
     JOIN maya_memory m ON m.id = r.memory_entry_id
     WHERE r.review_label = 'useful'
     AND r.created_at >= $1 AND r.created_at <= $2
     ORDER BY m.confidence DESC LIMIT 5`,
    [startStr, endStr]
  );

  // Confidence distribution by tier
  const confDist = await pool.query<{ tier: string; min: string; max: string; avg: string }>(
    `SELECT tier, MIN(confidence) as min, MAX(confidence) as max, AVG(confidence) as avg 
     FROM maya_memory WHERE is_deleted = false
     GROUP BY tier`
  );
  const confByTier: Record<string, { min: number; max: number; avg: number }> = {};
  for (const row of confDist.rows) {
    confByTier[row.tier] = {
      min: parseInt(row.min, 10),
      max: parseInt(row.max, 10),
      avg: Math.round(parseFloat(row.avg) * 100) / 100
    };
  }

  // Total extracts and reviews
  const totals = await pool.query<{ extracts: string; reviews: string }>(
    `SELECT 
      (SELECT COUNT(*) FROM maya_audit WHERE action = 'extract_run' AND created_at >= $1 AND created_at <= $2) as extracts,
      (SELECT COUNT(*) FROM maya_review WHERE created_at >= $1 AND created_at <= $2) as reviews`,
    [startStr, endStr]
  );

  // Overall FP rate
  const fpRate = await pool.query<{ rate: string }>(
    `SELECT 
      COALESCE(
        (SELECT COUNT(*) FROM maya_review WHERE review_label = 'false_positive' AND created_at >= $1 AND created_at <= $2)::float /
        NULLIF((SELECT COUNT(*) FROM maya_review WHERE review_type = 'conflict' AND created_at >= $1 AND created_at <= $2), 0),
        0
      ) as rate`,
    [startStr, endStr]
  );

  // Generate recommendations based on data
  const recommendations: string[] = [];
  const overallFPRate = parseFloat(fpRate.rows[0]?.rate || '0');

  if (overallFPRate > 0.3) {
    recommendations.push('Consider increasing conflict_sensitivity to reduce false positives');
  }
  if (overallFPRate < 0.1) {
    recommendations.push('System may be too passive - consider lowering conflict_sensitivity');
  }

  // Phase 2 candidates (topics that recur frequently but not yet in core)
  const phase2Candidates = await pool.query<{ topic: string }>(
    `SELECT topic FROM maya_memory 
     WHERE tier = 'proposed' AND review_status = 'confirmed'
     GROUP BY topic HAVING COUNT(*) >= 2
     LIMIT 5`
  );

  return {
    weekStart: startStr,
    weekEnd: endStr,
    topErrorPatterns: ['Conflicts on similar topics', 'Low confidence proposals'],
    topUsefulEvents: topUseful.rows.map(r => ({ topic: r.topic, confidence: r.confidence })),
    topFalsePositives: topFPs.rows.map(r => ({ topic: r.topic, reason: r.review_note || 'No note' })),
    confidenceDistribution: confByTier as Record<MemoryTier, { min: number; max: number; avg: number }>,
    recommendedTunings: recommendations,
    phase2Candidates: phase2Candidates.rows.map(r => r.topic),
    totalExtracts: parseInt(totals.rows[0]?.extracts || '0', 10),
    totalReviews: parseInt(totals.rows[0]?.reviews || '0', 10),
    overallFalsePositiveRate: Math.round(overallFPRate * 100) / 100
  };
}
