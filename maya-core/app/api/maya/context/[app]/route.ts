import { NextRequest, NextResponse } from 'next/server';

import { isMayaRequestAuthorized } from '@/lib/maya-auth';
import { getPostgresCapabilityErrorResponse } from '@/lib/maya-capabilities';
import { getAppContext, updateAppContext } from '@/lib/maya-memory-store';
import { AppContextType } from '@/lib/maya-spec-types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ app: string }> }
) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const capabilityError = getPostgresCapabilityErrorResponse('maya_app_context');
  if (capabilityError) {
    return capabilityError;
  }

  try {
    const { app } = await params;
    const appType = app as AppContextType;

    if (!['personal', 'soulmatch_studio', 'aicos_studio'].includes(appType)) {
      return NextResponse.json({ error: 'invalid_app_type' }, { status: 400 });
    }

    const context = await getAppContext(appType);

    return NextResponse.json({ context });
  } catch (error) {
    return NextResponse.json({ error: 'context_read_failed' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ app: string }> }
) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const capabilityError = getPostgresCapabilityErrorResponse('maya_app_context');
  if (capabilityError) {
    return capabilityError;
  }

  try {
    const { app } = await params;
    const appType = app as AppContextType;

    if (!['personal', 'soulmatch_studio', 'aicos_studio'].includes(appType)) {
      return NextResponse.json({ error: 'invalid_app_type' }, { status: 400 });
    }

    const body = await request.json();
    const mockDataJson = typeof body.mockDataJson === 'string'
      ? body.mockDataJson
      : JSON.stringify(body.mockData || {});

    const context = await updateAppContext(appType, mockDataJson);

    return NextResponse.json({ context, status: 'updated' });
  } catch (error) {
    return NextResponse.json({ error: 'context_update_failed' }, { status: 500 });
  }
}
