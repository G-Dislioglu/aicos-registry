import { NextRequest, NextResponse } from 'next/server';

import { isMayaRequestAuthorized } from '@/lib/maya-auth';
import { getPostgresCapabilityErrorResponse } from '@/lib/maya-capabilities';
import { getCalibrationSettings, updateCalibrationSettings } from '@/lib/maya-calibration-store';
import { CalibrationSettings } from '@/lib/maya-spec-types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const capabilityError = getPostgresCapabilityErrorResponse('maya_calibration_settings');
  if (capabilityError) {
    return capabilityError;
  }

  try {
    const settings = await getCalibrationSettings();

    // Validate settings fields
    const validKeys: (keyof CalibrationSettings)[] = [
      'extractEnabled',
      'extractDegradedMode',
      'overlapThreshold',
      'signalToEventThreshold',
      'proposedGenerationThreshold',
      'conflictSensitivity',
      'lifecycleAggressiveness'
    ];

    return NextResponse.json({ settings, success: true });
  } catch (error) {
    return NextResponse.json({ error: 'settings_retrieval_failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const capabilityError = getPostgresCapabilityErrorResponse('maya_calibration_settings');
  if (capabilityError) {
    return capabilityError;
  }

  try {
    const body = await request.json();

    // Validate settings fields
    const validKeys: (keyof CalibrationSettings)[] = [
      'extractEnabled',
      'extractDegradedMode',
      'overlapThreshold',
      'signalToEventThreshold',
      'proposedGenerationThreshold',
      'conflictSensitivity',
      'lifecycleAggressiveness'
    ];

    const updates: Partial<CalibrationSettings> = {};
    for (const key of validKeys) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'no_valid_settings' }, { status: 400 });
    }

    const settings = await updateCalibrationSettings(updates);

    return NextResponse.json({ settings, success: true });
  } catch (error) {
    return NextResponse.json({ error: 'settings_update_failed' }, { status: 500 });
  }
}
