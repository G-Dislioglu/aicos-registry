import { NextResponse } from 'next/server';

import { isMayaRequestAuthorized } from '@/lib/maya-auth';
import { getPostgresCapabilityErrorResponse } from '@/lib/maya-capabilities';
import { getAction } from '@/lib/supervisor-store';
import { dispatchAction } from '@/lib/supervisor-executor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const capabilityError = getPostgresCapabilityErrorResponse('supervisor_action_run');
  if (capabilityError) {
    return capabilityError;
  }

  try {
    const url = new URL(request.url);
    const actionId = url.pathname.split('/').slice(-2)[0];

    const action = await getAction(actionId);
    if (!action) {
      return NextResponse.json({ error: 'action_not_found' }, { status: 404 });
    }

    const result = await dispatchAction(actionId);

    if (!result.success) {
      return NextResponse.json({ error: result.error, action: await getAction(actionId) }, { status: 400 });
    }

    return NextResponse.json({ success: true, action: await getAction(actionId), result: result.result });
  } catch (error) {
    return NextResponse.json({ error: 'execution_failed' }, { status: 500 });
  }
}
