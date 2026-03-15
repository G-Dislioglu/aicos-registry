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
        )
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
