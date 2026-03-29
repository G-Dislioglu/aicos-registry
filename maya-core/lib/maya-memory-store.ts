// K5-CANONICAL: Diese Datei gehört zu Achse B (Execution/Zielpfad).
// Neue Logik kommt hierher, nicht in Achse A.
import { ensureMayaPostgresSchema, getMayaPostgresPool } from '@/lib/maya-db';
import { getMayaRuntimeConfig } from '@/lib/maya-env';
import {
  MemoryEntry,
  MayaMessage,
  AuditEntry,
  AppContext,
  CostGuardState,
  MemoryTier,
  MemoryCategory,
  StudioMode,
  ProviderType
} from '@/lib/maya-spec-types';

// Memory Operations

export async function getMemoryEntries(options?: {
  tier?: MemoryTier;
  category?: MemoryCategory;
  includeDeleted?: boolean;
  limit?: number;
}): Promise<MemoryEntry[]> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();

  const conditions: string[] = [];
  const values: (string | number | boolean)[] = [];
  let paramIndex = 1;

  if (!options?.includeDeleted) {
    conditions.push(`is_deleted = false`);
  }

  if (options?.tier) {
    conditions.push(`tier = $${paramIndex++}`);
    values.push(options.tier);
  }

  if (options?.category) {
    conditions.push(`category = $${paramIndex++}`);
    values.push(options.category);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limitClause = options?.limit ? `LIMIT $${paramIndex}` : '';
  if (options?.limit) values.push(options.limit);

  const result = await pool.query<{
    id: string;
    tier: string;
    category: string;
    topic: string;
    content: string;
    confidence: number;
    domain: string;
    source: string;
    ttl_days: number | null;
    expires_at: Date | null;
    is_deleted: boolean;
    archived_at: Date | null;
    usage_score: number;
    contradicts_id: string | null;
    assumption: boolean;
    severity: number;
    review_status: string;
    meta_json: string;
    created_at: Date;
    updated_at: Date;
  }>(`SELECT * FROM maya_memory ${whereClause} ORDER BY usage_score DESC, updated_at DESC ${limitClause}`, values);

  return result.rows.map((row) => ({
    id: row.id,
    tier: row.tier as MemoryTier,
    category: row.category as MemoryCategory,
    topic: row.topic,
    content: row.content,
    confidence: row.confidence,
    domain: row.domain,
    source: row.source as 'user' | 'inferred' | 'external' | 'cognitive_engine',
    ttlDays: row.ttl_days,
    expiresAt: row.expires_at?.toISOString() || null,
    isDeleted: row.is_deleted,
    archivedAt: row.archived_at?.toISOString() || null,
    usageScore: row.usage_score,
    contradictsId: row.contradicts_id,
    assumption: row.assumption,
    severity: row.severity || 1,
    reviewStatus: (row.review_status || 'pending') as 'pending' | 'confirmed' | 'denied' | 'resolved',
    metaJson: row.meta_json || '{}',
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  }));
}

export async function getMemoryEntry(id: string): Promise<MemoryEntry | null> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();

  const result = await pool.query<{
    id: string;
    tier: string;
    category: string;
    topic: string;
    content: string;
    confidence: number;
    domain: string;
    source: string;
    ttl_days: number | null;
    expires_at: Date | null;
    is_deleted: boolean;
    archived_at: Date | null;
    usage_score: number;
    contradicts_id: string | null;
    assumption: boolean;
    severity: number;
    review_status: string;
    meta_json: string;
    created_at: Date;
    updated_at: Date;
  }>('SELECT * FROM maya_memory WHERE id = $1', [id]);

  if (!result.rows[0]) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    tier: row.tier as MemoryTier,
    category: row.category as MemoryCategory,
    topic: row.topic,
    content: row.content,
    confidence: row.confidence,
    domain: row.domain,
    source: row.source as 'user' | 'inferred' | 'external' | 'cognitive_engine',
    ttlDays: row.ttl_days,
    expiresAt: row.expires_at?.toISOString() || null,
    isDeleted: row.is_deleted,
    archivedAt: row.archived_at?.toISOString() || null,
    usageScore: row.usage_score,
    contradictsId: row.contradicts_id,
    assumption: row.assumption,
    severity: row.severity || 1,
    reviewStatus: (row.review_status || 'pending') as 'pending' | 'confirmed' | 'denied' | 'resolved',
    metaJson: row.meta_json || '{}',
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

export async function createMemoryEntry(entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt' | 'usageScore' | 'isDeleted' | 'archivedAt'>): Promise<MemoryEntry> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();

  const id = crypto.randomUUID();
  const now = new Date();

  await pool.query(
    `INSERT INTO maya_memory (id, tier, category, topic, content, confidence, domain, source, ttl_days, expires_at, assumption, contradicts_id, severity, review_status, meta_json)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    [
      id,
      entry.tier,
      entry.category,
      entry.topic,
      entry.content,
      entry.confidence,
      entry.domain,
      entry.source,
      entry.ttlDays,
      entry.expiresAt,
      entry.assumption,
      entry.contradictsId,
      entry.severity || 1,
      entry.reviewStatus || 'pending',
      entry.metaJson || '{}'
    ]
  );

  return (await getMemoryEntry(id))!;
}

export async function updateMemoryEntry(id: string, updates: Partial<MemoryEntry>): Promise<MemoryEntry | null> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();

  const setClauses: string[] = ['updated_at = NOW()'];
  const values: (string | number | boolean | null)[] = [];
  let paramIndex = 1;

  if (updates.tier !== undefined) {
    setClauses.push(`tier = $${paramIndex++}`);
    values.push(updates.tier);
  }
  if (updates.category !== undefined) {
    setClauses.push(`category = $${paramIndex++}`);
    values.push(updates.category);
  }
  if (updates.topic !== undefined) {
    setClauses.push(`topic = $${paramIndex++}`);
    values.push(updates.topic);
  }
  if (updates.content !== undefined) {
    setClauses.push(`content = $${paramIndex++}`);
    values.push(updates.content);
  }
  if (updates.confidence !== undefined) {
    setClauses.push(`confidence = $${paramIndex++}`);
    values.push(updates.confidence);
  }
  if (updates.domain !== undefined) {
    setClauses.push(`domain = $${paramIndex++}`);
    values.push(updates.domain);
  }
  if (updates.usageScore !== undefined) {
    setClauses.push(`usage_score = $${paramIndex++}`);
    values.push(updates.usageScore);
  }
  if (updates.isDeleted !== undefined) {
    setClauses.push(`is_deleted = $${paramIndex++}`);
    values.push(updates.isDeleted);
  }
  if (updates.archivedAt !== undefined) {
    setClauses.push(`archived_at = $${paramIndex++}`);
    values.push(updates.archivedAt);
  }

  values.push(id);

  await pool.query(`UPDATE maya_memory SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`, values);

  return getMemoryEntry(id);
}

export async function incrementMemoryUsage(id: string): Promise<void> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();
  await pool.query('UPDATE maya_memory SET usage_score = usage_score + 1, updated_at = NOW() WHERE id = $1', [id]);
}

// Message Operations

export async function createMessage(msg: Omit<MayaMessage, 'id' | 'createdAt'>): Promise<MayaMessage> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();

  const id = crypto.randomUUID();
  const now = new Date();

  await pool.query(
    `INSERT INTO maya_messages (id, role, content, studio_mode, provider, model, context_used, context_referenced, token_input, token_output, cost_cents)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      id,
      msg.role,
      msg.content,
      msg.studioMode,
      msg.provider,
      msg.model,
      JSON.stringify(msg.contextUsed),
      JSON.stringify(msg.contextReferenced),
      msg.tokenInput,
      msg.tokenOutput,
      msg.costCents
    ]
  );

  return {
    id,
    ...msg,
    createdAt: now.toISOString()
  };
}

export async function getRecentMessages(limit: number = 20, studioMode?: StudioMode): Promise<MayaMessage[]> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();

  const whereClause = studioMode ? `WHERE studio_mode = $1` : '';
  const query = `SELECT * FROM maya_messages ${whereClause} ORDER BY created_at DESC LIMIT $${studioMode ? 2 : 1}`;
  const values = studioMode ? [studioMode, limit] : [limit];

  const result = await pool.query<{
    id: string;
    role: string;
    content: string;
    studio_mode: string;
    provider: string;
    model: string;
    context_used: unknown;
    context_referenced: unknown;
    token_input: number;
    token_output: number;
    cost_cents: number;
    created_at: Date;
  }>(query, values);

  return result.rows.map((row) => ({
    id: row.id,
    role: row.role as 'user' | 'assistant' | 'system',
    content: row.content,
    studioMode: row.studio_mode as StudioMode,
    provider: row.provider,
    model: row.model,
    contextUsed: Array.isArray(row.context_used) ? row.context_used as string[] : [],
    contextReferenced: Array.isArray(row.context_referenced) ? row.context_referenced as string[] : [],
    tokenInput: row.token_input,
    tokenOutput: row.token_output,
    costCents: row.cost_cents,
    createdAt: row.created_at.toISOString()
  }));
}

// Audit Operations

export async function createAuditEntry(entry: Omit<AuditEntry, 'id' | 'createdAt'>): Promise<AuditEntry> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();

  const id = crypto.randomUUID();
  const now = new Date();

  await pool.query(
    `INSERT INTO maya_audit (id, action, entity_id, entity_type, details_json, actor)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, entry.action, entry.entityId, entry.entityType, JSON.stringify(entry.detailsJson), entry.actor]
  );

  return {
    id,
    ...entry,
    createdAt: now.toISOString()
  };
}

export async function getAuditLog(limit: number = 50): Promise<AuditEntry[]> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();

  const result = await pool.query<{
    id: string;
    action: string;
    entity_id: string;
    entity_type: string;
    details_json: unknown;
    actor: string;
    created_at: Date;
  }>('SELECT * FROM maya_audit ORDER BY created_at DESC LIMIT $1', [limit]);

  return result.rows.map((row) => ({
    id: row.id,
    action: row.action as AuditEntry['action'],
    entityId: row.entity_id,
    entityType: row.entity_type as AuditEntry['entityType'],
    detailsJson: typeof row.details_json === 'string' ? row.details_json : JSON.stringify(row.details_json),
    actor: row.actor as AuditEntry['actor'],
    createdAt: row.created_at.toISOString()
  }));
}

// App Context Operations

export async function getAppContext(appType: AppContext['appType']): Promise<AppContext | null> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();

  const result = await pool.query<{
    id: string;
    app_type: string;
    mock_data_json: unknown;
    updated_at: Date;
  }>('SELECT * FROM maya_app_context WHERE app_type = $1', [appType]);

  if (!result.rows[0]) {
    // Create default mock context
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO maya_app_context (id, app_type, mock_data_json)
       VALUES ($1, $2, '{}')`,
      [id, appType]
    );
    return {
      id,
      appType,
      mockDataJson: '{}',
      updatedAt: new Date().toISOString()
    };
  }

  const row = result.rows[0];
  return {
    id: row.id,
    appType: row.app_type as AppContext['appType'],
    mockDataJson: typeof row.mock_data_json === 'string' ? row.mock_data_json : JSON.stringify(row.mock_data_json),
    updatedAt: row.updated_at.toISOString()
  };
}

export async function updateAppContext(appType: AppContext['appType'], mockDataJson: string): Promise<AppContext> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();

  await pool.query(
    `INSERT INTO maya_app_context (id, app_type, mock_data_json, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (app_type) DO UPDATE SET mock_data_json = EXCLUDED.mock_data_json, updated_at = NOW()`,
    [crypto.randomUUID(), appType, mockDataJson]
  );

  return (await getAppContext(appType))!;
}

// Cost Guard Operations

export async function getCostGuardState(): Promise<CostGuardState> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // Get today's cost
  const todayResult = await pool.query<{ total_cents: number; total_tokens: number }>(
    'SELECT total_cents, total_tokens FROM maya_cost_daily WHERE date = $1',
    [today]
  );

  // Get week's cost
  const weekResult = await pool.query<{ total: number }>(
    'SELECT COALESCE(SUM(total_cents), 0) as total FROM maya_cost_daily WHERE date >= $1',
    [weekAgo]
  );

  const dailyBudgetCents = parseInt(process.env.MAYA_DAILY_BUDGET_CENTS || '1000', 10);
  const spentToday = todayResult.rows[0]?.total_cents || 0;
  const spentWeek = weekResult.rows[0]?.total || 0;
  const tokensToday = todayResult.rows[0]?.total_tokens || 0;

  const ratio = spentToday / dailyBudgetCents;
  const status = ratio >= 0.95 ? 'blocked' : ratio >= 0.80 ? 'warning' : 'ok';

  return {
    dailyBudgetCents,
    spentTodayCents: spentToday,
    spentWeekCents: spentWeek,
    tokensToday,
    status
  };
}

export async function recordCost(costCents: number, tokens: number): Promise<void> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();

  const today = new Date().toISOString().slice(0, 10);
  const id = `cost-${today}`;

  await pool.query(
    `INSERT INTO maya_cost_daily (id, date, total_cents, total_tokens, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (date) DO UPDATE SET
       total_cents = maya_cost_daily.total_cents + EXCLUDED.total_cents,
       total_tokens = maya_cost_daily.total_tokens + EXCLUDED.total_tokens,
       updated_at = NOW()`,
    [id, today, costCents, tokens]
  );
}

// Memory Store Counts

export async function getMemoryStoreCounts(): Promise<{ 
  core: number; 
  working: number; 
  ephemeral: number; 
  event: number;
  signal: number;
  proposed: number;
  conflict: number;
  total: number 
}> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();

  const result = await pool.query<{ tier: string; count: string }>(
    "SELECT tier, COUNT(*) as count FROM maya_memory WHERE is_deleted = false GROUP BY tier"
  );

  const counts = { core: 0, working: 0, ephemeral: 0, event: 0, signal: 0, proposed: 0, conflict: 0, total: 0 };

  for (const row of result.rows) {
    const count = parseInt(row.count, 10);
    if (row.tier === 'core') counts.core = count;
    else if (row.tier === 'working') counts.working = count;
    else if (row.tier === 'ephemeral') counts.ephemeral = count;
    else if (row.tier === 'event') counts.event = count;
    else if (row.tier === 'signal') counts.signal = count;
    else if (row.tier === 'proposed') counts.proposed = count;
    else if (row.tier === 'conflict') counts.conflict = count;
    counts.total += count;
  }

  return counts;
}
