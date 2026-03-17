import { NextRequest, NextResponse } from 'next/server';

import { isMayaRequestAuthorized } from '@/lib/maya-auth';
import { getPostgresCapabilityErrorResponse } from '@/lib/maya-capabilities';
import { 
  getCalibrationSettings, 
  updateCalibrationSettings, 
  getCalibrationMetrics,
  getReviewCounts
} from '@/lib/maya-calibration-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const capabilityError = getPostgresCapabilityErrorResponse('maya_calibration');
  if (capabilityError) {
    return capabilityError;
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'metrics';

    if (action === 'settings') {
      const settings = await getCalibrationSettings();
      return NextResponse.json({ settings });
    }

    if (action === 'counts') {
      const counts = await getReviewCounts();
      return NextResponse.json({ counts });
    }

    // Default: return full calibration metrics
    const [metrics, settings] = await Promise.all([
      getCalibrationMetrics(),
      getCalibrationSettings()
    ]);

    return NextResponse.json({ 
      metrics,
      settings,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ error: 'calibration_fetch_failed' }, { status: 500 });
  }
}
