import { NextResponse } from 'next/server';

import { checkMayaPostgresHealth } from '@/lib/maya-db';
import { isMayaAuthConfigured } from '@/lib/maya-env';
import { getMayaStorageInfo } from '@/lib/maya-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const storage = getMayaStorageInfo();
    const db = await checkMayaPostgresHealth();
    const authConfigured = isMayaAuthConfigured();
    const ok = db.ok && authConfigured;

    return NextResponse.json({
      status: ok ? 'ok' : 'degraded',
      app: 'maya-core',
      storage,
      authConfigured
    }, { status: ok ? 200 : 503 });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      app: 'maya-core',
      error: error instanceof Error ? error.message : 'health_check_failed'
    }, { status: 503 });
  }
}
