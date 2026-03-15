import { NextRequest, NextResponse } from 'next/server';

import { isMayaRequestAuthorized } from '@/lib/maya-auth';
import { getDailySummary } from '@/lib/maya-calibration-store';
import { createAuditEntry } from '@/lib/maya-memory-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;

    const summary = await getDailySummary(date);

    // Audit log
    await createAuditEntry({
      action: 'daily_summary',
      entityId: summary.date,
      entityType: 'memory',
      detailsJson: JSON.stringify({ reviewCount: summary.reviewCount }),
      actor: 'user'
    });

    return NextResponse.json({ summary });
  } catch (error) {
    return NextResponse.json({ error: 'summary_failed' }, { status: 500 });
  }
}
