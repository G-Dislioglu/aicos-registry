import { NextResponse } from 'next/server';

import { isMayaRequestAuthorized } from '@/lib/maya-auth';
import { getPostgresCapabilityErrorResponse } from '@/lib/maya-capabilities';
import { getAction, updateActionStatus } from '@/lib/supervisor-store';
import { createDecision } from '@/lib/supervisor-store';
import { DecisionType } from '@/lib/supervisor-types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function handleDecision(
  request: Request,
  decision: DecisionType
): Promise<Response> {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const capabilityError = getPostgresCapabilityErrorResponse('supervisor_action_decision');
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

    const body = await request.json().catch(() => ({}));
    const reason = body.reason || '';
    const actor = 'user';

    // Create decision record
    await createDecision(crypto.randomUUID(), action.workspaceId, actionId, decision, reason, actor);

    // Update action status
    let newStatus = action.status;
    let approvedBy: string | undefined;

    if (decision === 'approve') {
      newStatus = 'approved';
      approvedBy = actor;
    } else if (decision === 'reject') {
      newStatus = 'rejected';
    } else if (decision === 'defer') {
      // Keep current status, just log the decision
    }

    const updatedAction = await updateActionStatus(actionId, newStatus, approvedBy);

    return NextResponse.json({ action: updatedAction, decision });
  } catch (error) {
    return NextResponse.json({ error: 'decision_failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return handleDecision(request, 'approve');
}
