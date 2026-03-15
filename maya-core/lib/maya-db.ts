import { Pool } from 'pg';

import { assertPostgresStorageConfigured, getMayaRuntimeConfig } from '@/lib/maya-env';

declare global {
  var __mayaPostgresPool: Pool | undefined;
  var __mayaSchemaReady: Promise<void> | undefined;
}

function createPool() {
  const config = assertPostgresStorageConfigured();

  return new Pool({
    connectionString: config.databaseUrl,
    max: 4,
    ssl: config.databaseUrl.includes('localhost') || config.databaseUrl.includes('127.0.0.1') ? false : { rejectUnauthorized: false }
  });
}

export function getMayaPostgresPool() {
  if (!globalThis.__mayaPostgresPool) {
    globalThis.__mayaPostgresPool = createPool();
  }

  return globalThis.__mayaPostgresPool;
}

export async function ensureMayaPostgresSchema() {
  const runtime = getMayaRuntimeConfig();

  if (runtime.storageDriver !== 'postgres') {
    return;
  }

  if (!globalThis.__mayaSchemaReady) {
    globalThis.__mayaSchemaReady = (async () => {
      const pool = getMayaPostgresPool();
      await pool.query(`
        CREATE TABLE IF NOT EXISTS maya_state (
          id TEXT PRIMARY KEY,
          payload JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS supervisor_workspace (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          goal TEXT NOT NULL,
          current_focus TEXT,
          mode TEXT NOT NULL DEFAULT 'explore',
          constraints_json TEXT NOT NULL DEFAULT '{}',
          open_questions_json TEXT NOT NULL DEFAULT '[]',
          status TEXT NOT NULL DEFAULT 'active',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS supervisor_analysis (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL REFERENCES supervisor_workspace(id) ON DELETE CASCADE,
          kind TEXT NOT NULL,
          title TEXT NOT NULL,
          body TEXT NOT NULL,
          confidence INTEGER NOT NULL DEFAULT 50,
          priority TEXT NOT NULL DEFAULT 'medium',
          source_scope TEXT NOT NULL DEFAULT '',
          meta_json TEXT NOT NULL DEFAULT '{}',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS supervisor_action (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL REFERENCES supervisor_workspace(id) ON DELETE CASCADE,
          action_type TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          payload_json TEXT NOT NULL DEFAULT '{}',
          status TEXT NOT NULL DEFAULT 'proposed',
          priority TEXT NOT NULL DEFAULT 'medium',
          requires_approval BOOLEAN NOT NULL DEFAULT true,
          proposed_by TEXT NOT NULL DEFAULT 'maya',
          approved_by TEXT,
          result_json TEXT NOT NULL DEFAULT '{}',
          error_text TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS supervisor_decision (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL REFERENCES supervisor_workspace(id) ON DELETE CASCADE,
          action_id TEXT NOT NULL REFERENCES supervisor_action(id) ON DELETE CASCADE,
          decision TEXT NOT NULL,
          reason TEXT NOT NULL,
          actor TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS supervisor_run (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL REFERENCES supervisor_workspace(id) ON DELETE CASCADE,
          started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          ended_at TIMESTAMPTZ,
          trigger_type TEXT NOT NULL DEFAULT 'manual',
          objective TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'running',
          summary TEXT NOT NULL DEFAULT '',
          metrics_json TEXT NOT NULL DEFAULT '{}'
        );

        CREATE INDEX IF NOT EXISTS idx_analysis_workspace ON supervisor_analysis(workspace_id);
        CREATE INDEX IF NOT EXISTS idx_action_workspace ON supervisor_action(workspace_id);
        CREATE INDEX IF NOT EXISTS idx_action_status ON supervisor_action(status);
        CREATE INDEX IF NOT EXISTS idx_decision_workspace ON supervisor_decision(workspace_id);
        CREATE INDEX IF NOT EXISTS idx_run_workspace ON supervisor_run(workspace_id);

        -- Maya Spec Phase 1A/1B-A Tables
        CREATE TABLE IF NOT EXISTS maya_memory (
          id TEXT PRIMARY KEY,
          tier TEXT NOT NULL DEFAULT 'working',
          category TEXT NOT NULL DEFAULT 'insight',
          topic TEXT NOT NULL,
          content TEXT NOT NULL,
          confidence INTEGER NOT NULL DEFAULT 50,
          domain TEXT NOT NULL DEFAULT 'personal',
          source TEXT NOT NULL DEFAULT 'user',
          ttl_days INTEGER,
          expires_at TIMESTAMPTZ,
          is_deleted BOOLEAN NOT NULL DEFAULT false,
          archived_at TIMESTAMPTZ,
          usage_score INTEGER NOT NULL DEFAULT 0,
          contradicts_id TEXT,
          assumption BOOLEAN NOT NULL DEFAULT false,
          -- Phase 1B-A additions
          severity INTEGER NOT NULL DEFAULT 1,
          review_status TEXT NOT NULL DEFAULT 'pending',
          meta_json JSONB NOT NULL DEFAULT '{}',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS maya_messages (
          id TEXT PRIMARY KEY,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          studio_mode TEXT NOT NULL DEFAULT 'personal',
          provider TEXT NOT NULL DEFAULT 'mock',
          model TEXT NOT NULL DEFAULT 'mock',
          context_used JSONB NOT NULL DEFAULT '[]',
          context_referenced JSONB NOT NULL DEFAULT '[]',
          token_input INTEGER NOT NULL DEFAULT 0,
          token_output INTEGER NOT NULL DEFAULT 0,
          cost_cents INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS maya_audit (
          id TEXT PRIMARY KEY,
          action TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          details_json JSONB NOT NULL DEFAULT '{}',
          actor TEXT NOT NULL DEFAULT 'user',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS maya_app_context (
          id TEXT PRIMARY KEY,
          app_type TEXT NOT NULL,
          mock_data_json JSONB NOT NULL DEFAULT '{}',
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS maya_cost_daily (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL UNIQUE,
          total_cents INTEGER NOT NULL DEFAULT 0,
          total_tokens INTEGER NOT NULL DEFAULT 0,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_memory_tier ON maya_memory(tier);
        CREATE INDEX IF NOT EXISTS idx_memory_category ON maya_memory(category);
        CREATE INDEX IF NOT EXISTS idx_memory_deleted ON maya_memory(is_deleted);
        CREATE INDEX IF NOT EXISTS idx_memory_review_status ON maya_memory(review_status);
        CREATE INDEX IF NOT EXISTS idx_memory_source ON maya_memory(source);
        CREATE INDEX IF NOT EXISTS idx_memory_created ON maya_memory(created_at);
        CREATE INDEX IF NOT EXISTS idx_messages_created ON maya_messages(created_at);
        CREATE INDEX IF NOT EXISTS idx_audit_entity ON maya_audit(entity_id);
        CREATE INDEX IF NOT EXISTS idx_audit_action ON maya_audit(action);
        CREATE INDEX IF NOT EXISTS idx_cost_date ON maya_cost_daily(date);

        -- Phase 1B-A: Extract status tracking
        CREATE TABLE IF NOT EXISTS maya_extract_status (
          id TEXT PRIMARY KEY,
          last_run TIMESTAMPTZ,
          last_lifecycle_run TIMESTAMPTZ,
          extract_cost_today INTEGER NOT NULL DEFAULT 0,
          events_extracted_today INTEGER NOT NULL DEFAULT 0,
          conflicts_detected_today INTEGER NOT NULL DEFAULT 0,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        INSERT INTO maya_extract_status (id) VALUES ('primary') ON CONFLICT DO NOTHING;
      `);
    })();
  }

  await globalThis.__mayaSchemaReady;
}

export async function checkMayaPostgresHealth() {
  const runtime = getMayaRuntimeConfig();

  if (runtime.storageDriver !== 'postgres') {
    return { ok: true, driver: runtime.storageDriver };
  }

  await ensureMayaPostgresSchema();
  await getMayaPostgresPool().query('SELECT 1');

  return { ok: true, driver: runtime.storageDriver };
}
