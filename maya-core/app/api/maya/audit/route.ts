import { NextRequest, NextResponse } from 'next/server';

import { isMayaRequestAuthorized } from '@/lib/maya-auth';
import { getAuditLog } from '@/lib/maya-memory-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const entries = await getAuditLog(limit);

    return NextResponse.json({ entries, count: entries.length });
  } catch (error) {
    return NextResponse.json({ error: 'audit_read_failed' }, { status: 500 });
  }
}
