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
