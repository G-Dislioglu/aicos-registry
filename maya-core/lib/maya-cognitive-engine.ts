import { ensureMayaPostgresSchema, getMayaPostgresPool } from '@/lib/maya-db';
import { 
  MemoryEntry, 
  MemoryTier, 
  MemoryCategory, 
  MemorySource,
  ReviewStatus 
} from '@/lib/maya-spec-types';
import { 
  createMemoryEntry, 
  getMemoryEntries, 
  getMemoryEntry, 
  updateMemoryEntry, 
  createAuditEntry,
  createMessage,
  recordCost 
} from '@/lib/maya-memory-store';
import { getProvider, getModel, detectDefaultProvider } from '@/lib/maya-provider';
import { ProviderType, ProviderModel } from '@/lib/maya-spec-types';

// Extract Configuration
type ExtractConfig = {
  providerA: ProviderType;
  modelA: string;
  providerB: ProviderType;
  modelB: string;
};

export function getExtractConfig(): ExtractConfig {
  const defaultProvider = detectDefaultProvider();
  
  return {
    providerA: (process.env.MAYA_EXTRACT_PROVIDER_A as ProviderType) || defaultProvider,
    modelA: process.env.MAYA_EXTRACT_MODEL_A || 'gpt-4o-mini',
    providerB: (process.env.MAYA_EXTRACT_PROVIDER_B as ProviderType) || (defaultProvider === 'openai' ? 'anthropic' : defaultProvider),
    modelB: process.env.MAYA_EXTRACT_MODEL_B || 'claude-3-5-haiku-20241022'
  };
}

// Extract Result Types
type ExtractedFact = {
  category: MemoryCategory;
  topic: string;
  content: string;
  confidence: number;
  assumption: boolean;
  domain: string;
};

type ConflictDetected = {
  existingId: string;
  existingTopic: string;
  newTopic: string;
  conflictReason: string;
  severity: number;
};

type ModelExtractResult = {
  facts: ExtractedFact[];
  conflicts: ConflictDetected[];
  tokenInput: number;
  tokenOutput: number;
  costCents: number;
  error?: string;
};

type DualModelResult = {
  agreedFacts: ExtractedFact[];
  conflicts: ConflictDetected[];
  modelA: ModelExtractResult;
  modelB: ModelExtractResult;
  totalCostCents: number;
};

// Extract Prompt
function buildExtractPrompt(
  userMessage: string, 
  assistantMessage: string, 
  knownEntries: MemoryEntry[]
): string {
  const knownContext = knownEntries
    .slice(0, 5)
    .map(e => `[${e.tier}] ${e.topic}: ${e.content.slice(0, 100)}`)
    .join('\n');

  return `You are a memory extraction assistant. Analyze the conversation and extract 0-2 memory-worthy facts.

CONVERSATION:
User: ${userMessage.slice(0, 500)}
Assistant: ${assistantMessage.slice(0, 500)}

KNOWN MEMORY (for conflict detection):
${knownContext || 'No existing memory entries.'}

RULES:
1. Extract ONLY facts that are:
   - Operationally useful outside this chat
   - Not already in KNOWN MEMORY
   - Specific enough to be actionable
2. Mark assumptions explicitly
3. Confidence: 0-100 (be conservative)
4. Check for conflicts with KNOWN MEMORY
5. If a fact contradicts existing memory, report as conflict

OUTPUT FORMAT (JSON only, no markdown):
{
  "facts": [
    {
      "category": "preference|constraint|insight|fact|goal|relationship|routine",
      "topic": "short topic name",
      "content": "full fact content",
      "confidence": 50,
      "assumption": false,
      "domain": "personal"
    }
  ],
  "conflicts": [
    {
      "existingId": "id from KNOWN if contradicts",
      "existingTopic": "topic of contradicted entry",
      "newTopic": "topic of new fact",
      "conflictReason": "why they conflict",
      "severity": 3
    }
  ]
}

Respond with ONLY the JSON object, no other text.`;
}

// Single Model Extract
async function runModelExtract(
  provider: ProviderType,
  modelId: string,
  prompt: string
): Promise<ModelExtractResult> {
  const providerConfig = getProvider(provider);
  const modelConfig = getModel(provider, modelId);

  if (!providerConfig?.available || !modelConfig) {
    return {
      facts: [],
      conflicts: [],
      tokenInput: 0,
      tokenOutput: 0,
      costCents: 0,
      error: `Provider ${provider} or model ${modelId} not available`
    };
  }

  try {
    let response: string;
    let tokenInput = 0;
    let tokenOutput = 0;

    if (provider === 'mock') {
      response = '{"facts":[],"conflicts":[]}';
      tokenInput = Math.ceil(prompt.length / 4);
      tokenOutput = 50;
    } else if (provider === 'openai') {
      const result = await callOpenAI(modelId, prompt);
      response = result.content;
      tokenInput = result.tokenInput;
      tokenOutput = result.tokenOutput;
    } else if (provider === 'anthropic') {
      const result = await callAnthropic(modelId, prompt);
      response = result.content;
      tokenInput = result.tokenInput;
      tokenOutput = result.tokenOutput;
    } else {
      return {
        facts: [],
        conflicts: [],
        tokenInput: 0,
        tokenOutput: 0,
        costCents: 0,
        error: `Provider ${provider} not implemented for extract`
      };
    }

    // Parse JSON response
    const parsed = parseExtractResponse(response);

    // Calculate cost
    const costCents = Math.ceil(
      tokenInput * modelConfig.costPerTokenInputCents +
      tokenOutput * modelConfig.costPerTokenOutputCents
    );

    return {
      facts: parsed.facts,
      conflicts: parsed.conflicts,
      tokenInput,
      tokenOutput,
      costCents
    };
  } catch (error) {
    return {
      facts: [],
      conflicts: [],
      tokenInput: 0,
      tokenOutput: 0,
      costCents: 0,
      error: String(error)
    };
  }
}

// Parse extract response
function parseExtractResponse(response: string): { facts: ExtractedFact[]; conflicts: ConflictDetected[] } {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { facts: [], conflicts: [] };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      facts: (parsed.facts || []).map((f: any) => ({
        category: f.category || 'insight',
        topic: String(f.topic || '').slice(0, 100),
        content: String(f.content || '').slice(0, 500),
        confidence: Math.min(100, Math.max(0, Number(f.confidence) || 50)),
        assumption: Boolean(f.assumption),
        domain: f.domain || 'personal'
      })),
      conflicts: (parsed.conflicts || []).map((c: any) => ({
        existingId: c.existingId || '',
        existingTopic: c.existingTopic || '',
        newTopic: c.newTopic || '',
        conflictReason: c.conflictReason || '',
        severity: Math.min(5, Math.max(1, Number(c.severity) || 3))
      }))
    };
  } catch {
    return { facts: [], conflicts: [] };
  }
}

// OpenAI call for extract
async function callOpenAI(modelId: string, prompt: string): Promise<{ content: string; tokenInput: number; tokenOutput: number }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { content: '{"facts":[],"conflicts":[]}', tokenInput: 0, tokenOutput: 0 };
  }

  const isGPT5 = modelId === 'gpt-5';
  const body: Record<string, unknown> = {
    model: modelId,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  };

  if (isGPT5) {
    body.max_completion_tokens = 1000;
  } else {
    body.max_tokens = 1000;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    return { content: '{"facts":[],"conflicts":[]}', tokenInput: 0, tokenOutput: 0 };
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
    usage?: { prompt_tokens: number; completion_tokens: number };
  };

  return {
    content: data.choices[0]?.message?.content || '{"facts":[],"conflicts":[]}',
    tokenInput: data.usage?.prompt_tokens || 0,
    tokenOutput: data.usage?.completion_tokens || 0
  };
}

// Anthropic call for extract
async function callAnthropic(modelId: string, prompt: string): Promise<{ content: string; tokenInput: number; tokenOutput: number }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { content: '{"facts":[],"conflicts":[]}', tokenInput: 0, tokenOutput: 0 };
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    return { content: '{"facts":[],"conflicts":[]}', tokenInput: 0, tokenOutput: 0 };
  }

  const data = await response.json() as {
    content: Array<{ type: string; text: string }>;
    usage?: { input_tokens: number; output_tokens: number };
  };

  const content = data.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('\n');

  return {
    content: content || '{"facts":[],"conflicts":[]}',
    tokenInput: data.usage?.input_tokens || 0,
    tokenOutput: data.usage?.output_tokens || 0
  };
}

// Dual Model Extract
export async function runDualModelExtract(
  userMessage: string,
  assistantMessage: string,
  knownEntries: MemoryEntry[]
): Promise<DualModelResult> {
  const config = getExtractConfig();
  const prompt = buildExtractPrompt(userMessage, assistantMessage, knownEntries);

  // Run both models in parallel
  const [resultA, resultB] = await Promise.all([
    runModelExtract(config.providerA, config.modelA, prompt),
    runModelExtract(config.providerB, config.modelB, prompt)
  ]);

  // Find agreed facts (both models agree on category + topic overlap)
  const agreedFacts: ExtractedFact[] = [];
  
  for (const factA of resultA.facts) {
    const matchingFact = resultB.facts.find(factB => 
      factB.category === factA.category &&
      topicsOverlap(factA.topic, factB.topic)
    );

    if (matchingFact) {
      // Merge: take higher confidence, combined content
      agreedFacts.push({
        category: factA.category,
        topic: factA.topic,
        content: factA.content.length > matchingFact.content.length ? factA.content : matchingFact.content,
        confidence: Math.max(factA.confidence, matchingFact.confidence),
        assumption: factA.assumption || matchingFact.assumption,
        domain: factA.domain
      });
    }
  }

  // Merge conflicts (conservative: any model reports conflict)
  const conflicts = [...resultA.conflicts];
  for (const conflictB of resultB.conflicts) {
    if (!conflicts.some(c => c.existingId === conflictB.existingId)) {
      conflicts.push(conflictB);
    }
  }

  return {
    agreedFacts,
    conflicts,
    modelA: resultA,
    modelB: resultB,
    totalCostCents: resultA.costCents + resultB.costCents
  };
}

// Topic overlap check (simple similarity)
function topicsOverlap(topicA: string, topicB: string): boolean {
  const normalize = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, '');
  const a = normalize(topicA);
  const b = normalize(topicB);
  return a === b || a.includes(b) || b.includes(a);
}

// Save Extract Results
export async function saveExtractResults(
  extractResult: DualModelResult,
  studioMode: string
): Promise<{ events: MemoryEntry[]; conflicts: MemoryEntry[] }> {
  const events: MemoryEntry[] = [];
  const conflicts: MemoryEntry[] = [];

  // Save agreed facts as EVENTS
  for (const fact of extractResult.agreedFacts) {
    // Check for similar existing event
    const existing = await findSimilarEntry(fact.topic, 'event');
    
    if (existing) {
      // Promote to EVENT if was SIGNAL, or update existing
      if (existing.tier === 'signal') {
        await updateMemoryEntry(existing.id, { tier: 'event' });
        await createAuditEntry({
          action: 'signal_promoted',
          entityId: existing.id,
          entityType: 'memory',
          detailsJson: JSON.stringify({ topic: fact.topic }),
          actor: 'cognitive_engine'
        });
      }
    } else {
      // Create new EVENT
      const entry = await createMemoryEntry({
        tier: 'event',
        category: fact.category,
        topic: fact.topic,
        content: fact.content,
        confidence: fact.confidence,
        domain: fact.domain,
        source: 'cognitive_engine',
        ttlDays: 30, // Events have 30-day TTL
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        assumption: fact.assumption,
        contradictsId: null,
        severity: 1,
        reviewStatus: 'pending',
        metaJson: '{}'
      });
      events.push(entry);

      await createAuditEntry({
        action: 'extract_event_saved',
        entityId: entry.id,
        entityType: 'memory',
        detailsJson: JSON.stringify({ topic: fact.topic, confidence: fact.confidence }),
        actor: 'cognitive_engine'
      });
    }
  }

  // Save conflicts
  for (const conflict of extractResult.conflicts) {
    if (!conflict.existingId) continue;

    const entry = await createMemoryEntry({
      tier: 'conflict',
      category: 'insight',
      topic: `Conflict: ${conflict.newTopic}`,
      content: conflict.conflictReason,
      confidence: 70,
      domain: 'personal',
      source: 'cognitive_engine',
      ttlDays: 14, // Conflicts have 14-day TTL
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      assumption: false,
      contradictsId: conflict.existingId,
      severity: conflict.severity,
      reviewStatus: 'pending',
      metaJson: '{}'
    });
    conflicts.push(entry);

    await createAuditEntry({
      action: 'extract_conflict_detected',
      entityId: entry.id,
      entityType: 'memory',
      detailsJson: JSON.stringify({ 
        existingId: conflict.existingId, 
        newTopic: conflict.newTopic,
        severity: conflict.severity 
      }),
      actor: 'cognitive_engine'
    });
  }

  // Record extract costs
  if (extractResult.totalCostCents > 0) {
    await recordCost(extractResult.totalCostCents, 
      extractResult.modelA.tokenInput + extractResult.modelA.tokenOutput +
      extractResult.modelB.tokenInput + extractResult.modelB.tokenOutput
    );

    // Create message records for extract calls
    await createMessage({
      role: 'system',
      content: `Extract A: ${extractResult.modelA.facts.length} facts, ${extractResult.modelA.conflicts.length} conflicts`,
      studioMode: studioMode as any,
      provider: getExtractConfig().providerA,
      model: getExtractConfig().modelA,
      contextUsed: [],
      contextReferenced: [],
      tokenInput: extractResult.modelA.tokenInput,
      tokenOutput: extractResult.modelA.tokenOutput,
      costCents: extractResult.modelA.costCents
    });

    await createMessage({
      role: 'system',
      content: `Extract B: ${extractResult.modelB.facts.length} facts, ${extractResult.modelB.conflicts.length} conflicts`,
      studioMode: studioMode as any,
      provider: getExtractConfig().providerB,
      model: getExtractConfig().modelB,
      contextUsed: [],
      contextReferenced: [],
      tokenInput: extractResult.modelB.tokenInput,
      tokenOutput: extractResult.modelB.tokenOutput,
      costCents: extractResult.modelB.costCents
    });
  }

  // Update extract status
  await updateExtractStatus(events.length, conflicts.length, extractResult.totalCostCents);

  return { events, conflicts };
}

// Find similar entry by topic
async function findSimilarEntry(topic: string, tier?: MemoryTier): Promise<MemoryEntry | null> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();

  const conditions = ['is_deleted = false'];
  const values: string[] = [];
  
  if (tier) {
    conditions.push('tier = $1');
    values.push(tier);
  }

  values.push(`%${topic.toLowerCase()}%`);

  const result = await pool.query(
    `SELECT * FROM maya_memory WHERE ${conditions.join(' AND ')} AND LOWER(topic) LIKE $${values.length} LIMIT 1`,
    values
  );

  return result.rows[0] ? mapRowToEntry(result.rows[0]) : null;
}

// Map DB row to MemoryEntry
function mapRowToEntry(row: any): MemoryEntry {
  return {
    id: row.id,
    tier: row.tier as MemoryTier,
    category: row.category as MemoryCategory,
    topic: row.topic,
    content: row.content,
    confidence: row.confidence,
    domain: row.domain,
    source: row.source as MemorySource,
    ttlDays: row.ttl_days,
    expiresAt: row.expires_at?.toISOString() || null,
    isDeleted: row.is_deleted,
    archivedAt: row.archived_at?.toISOString() || null,
    usageScore: row.usage_score,
    contradictsId: row.contradicts_id,
    assumption: row.assumption,
    severity: row.severity || 1,
    reviewStatus: (row.review_status || 'pending') as ReviewStatus,
    metaJson: row.meta_json || '{}',
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

// Update extract status
async function updateExtractStatus(eventsCount: number, conflictsCount: number, costCents: number): Promise<void> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();

  await pool.query(`
    UPDATE maya_extract_status 
    SET last_run = NOW(),
        events_extracted_today = events_extracted_today + $1,
        conflicts_detected_today = conflicts_detected_today + $2,
        extract_cost_today = extract_cost_today + $3,
        updated_at = NOW()
    WHERE id = 'primary'
  `, [eventsCount, conflictsCount, costCents]);
}

// Get extract status
export async function getExtractStatus(): Promise<{
  enabled: boolean;
  lastRun: string | null;
  lastLifecycleRun: string | null;
  extractCostToday: number;
  eventsExtractedToday: number;
  conflictsDetectedToday: number;
}> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();

  const result = await pool.query<{
    last_run: Date | null;
    last_lifecycle_run: Date | null;
    extract_cost_today: number;
    events_extracted_today: number;
    conflicts_detected_today: number;
  }>('SELECT * FROM maya_extract_status WHERE id = $1', ['primary']);

  const row = result.rows[0];
  return {
    enabled: true,
    lastRun: row?.last_run?.toISOString() || null,
    lastLifecycleRun: row?.last_lifecycle_run?.toISOString() || null,
    extractCostToday: row?.extract_cost_today || 0,
    eventsExtractedToday: row?.events_extracted_today || 0,
    conflictsDetectedToday: row?.conflicts_detected_today || 0
  };
}

// PROPOSED Generation
export async function generateProposed(): Promise<MemoryEntry[]> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();

  // Get events from last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const result = await pool.query<{ topic: string; count: string }>(
    `SELECT topic, COUNT(*) as count 
     FROM maya_memory 
     WHERE tier = 'event' AND is_deleted = false AND created_at >= $1 
     GROUP BY topic 
     HAVING COUNT(*) >= 2`,
    [sevenDaysAgo]
  );

  const proposed: MemoryEntry[] = [];

  for (const row of result.rows) {
    // Check if already proposed
    const existing = await findSimilarEntry(row.topic, 'proposed');
    if (existing) continue;

    // Create PROPOSED
    const entry = await createMemoryEntry({
      tier: 'proposed',
      category: 'insight',
      topic: `Recurring: ${row.topic}`,
      content: `This topic appeared ${row.count} times in the last 7 days. Consider promoting to working memory.`,
      confidence: 60,
      domain: 'personal',
      source: 'cognitive_engine',
      ttlDays: 7,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      assumption: false,
      contradictsId: null,
      severity: 1,
      reviewStatus: 'pending',
      metaJson: '{}'
    });

    proposed.push(entry);

    await createAuditEntry({
      action: 'proposed_generated',
      entityId: entry.id,
      entityType: 'memory',
      detailsJson: JSON.stringify({ topic: row.topic, occurrences: row.count }),
      actor: 'cognitive_engine'
    });
  }

  return proposed;
}

// Lifecycle Automation
export async function runLifecycleCleanup(): Promise<{ expired: number; stale: number; signals: number }> {
  await ensureMayaPostgresSchema();
  const pool = getMayaPostgresPool();
  const now = new Date().toISOString();
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  // Delete expired entries
  const expiredResult = await pool.query(
    `UPDATE maya_memory SET is_deleted = true, archived_at = NOW() 
     WHERE is_deleted = false AND expires_at IS NOT NULL AND expires_at < NOW() 
     RETURNING id`
  );

  // Archive stale signals (older than 14 days)
  const signalsResult = await pool.query(
    `UPDATE maya_memory SET is_deleted = true, archived_at = NOW() 
     WHERE tier = 'signal' AND is_deleted = false AND created_at < $1 
     RETURNING id`,
    [fourteenDaysAgo]
  );

  // Update lifecycle run timestamp
  await pool.query(
    `UPDATE maya_extract_status SET last_lifecycle_run = NOW(), updated_at = NOW() WHERE id = 'primary'`
  );

  const counts = {
    expired: expiredResult.rowCount || 0,
    stale: 0,
    signals: signalsResult.rowCount || 0
  };

  if (counts.expired > 0 || counts.signals > 0) {
    await createAuditEntry({
      action: 'lifecycle_cleanup',
      entityId: 'batch',
      entityType: 'memory',
      detailsJson: JSON.stringify(counts),
      actor: 'cognitive_engine'
    });
  }

  return counts;
}
