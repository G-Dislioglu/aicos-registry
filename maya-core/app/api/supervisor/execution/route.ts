import { NextResponse } from 'next/server';

import { isMayaRequestAuthorized } from '@/lib/maya-auth';
import { getPostgresCapabilityErrorResponse } from '@/lib/maya-capabilities';
import { dispatchAction } from '@/lib/supervisor-executor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const capabilityError = getPostgresCapabilityErrorResponse('supervisor_execution');
  if (capabilityError) {
    return capabilityError;
  }

  try {
    const body = await request.json();
    const actionId = body.actionId;

    if (!actionId) {
      return NextResponse.json({ error: 'missing_action_id' }, { status: 400 });
    }

    const result = await dispatchAction(actionId);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'dispatch_failed' }, { status: 500 });
  }
}
