import { NextRequest, NextResponse } from 'next/server';

import { isMayaRequestAuthorized } from '@/lib/maya-auth';
import { getPostgresCapabilityErrorResponse } from '@/lib/maya-capabilities';
import { getWeeklyCalibrationReport } from '@/lib/maya-calibration-store';
import { createAuditEntry } from '@/lib/maya-memory-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const capabilityError = getPostgresCapabilityErrorResponse('maya_summary_weekly');
  if (capabilityError) {
    return capabilityError;
  }

  try {
    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('weekStart') || undefined;

    const report = await getWeeklyCalibrationReport(weekStart);

    // Audit log
    await createAuditEntry({
      action: 'weekly_report',
      entityId: report.weekStart,
      entityType: 'memory',
      detailsJson: JSON.stringify({ 
        totalExtracts: report.totalExtracts,
        totalReviews: report.totalReviews 
      }),
      actor: 'user'
    });

    return NextResponse.json({ report });
  } catch (error) {
    return NextResponse.json({ error: 'report_failed' }, { status: 500 });
  }
}
