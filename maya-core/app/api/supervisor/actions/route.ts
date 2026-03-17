import { NextResponse } from 'next/server';

import { isMayaRequestAuthorized } from '@/lib/maya-auth';
import { getPostgresCapabilityErrorResponse } from '@/lib/maya-capabilities';
import { getActions, createAction, updateActionStatus } from '@/lib/supervisor-store';
import { createDecision } from '@/lib/supervisor-store';
import { ActionType, DecisionType } from '@/lib/supervisor-types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const capabilityError = getPostgresCapabilityErrorResponse('supervisor_actions');
  if (capabilityError) {
    return capabilityError;
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId');

  if (!workspaceId) {
    return NextResponse.json({ error: 'missing_workspace_id' }, { status: 400 });
  }

  const actions = await getActions(workspaceId);
  return NextResponse.json({ actions });
}

export async function POST(request: Request) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const capabilityError = getPostgresCapabilityErrorResponse('supervisor_actions');
  if (capabilityError) {
    return capabilityError;
  }

  try {
    const body = await request.json();
    const id = body.id || crypto.randomUUID();
    const workspaceId = body.workspaceId;
    const actionType: ActionType = body.actionType || 'create_note';
    const title = body.title || 'Untitled Action';
    const description = body.description || '';
    const payloadJson = body.payloadJson || '{}';
    const priority = body.priority || 'medium';
    const requiresApproval = body.requiresApproval !== false;

    if (!workspaceId) {
      return NextResponse.json({ error: 'missing_workspace_id' }, { status: 400 });
    }

    const action = await createAction(id, workspaceId, actionType, title, description, payloadJson, priority, requiresApproval);
    return NextResponse.json({ action });
  } catch (error) {
    return NextResponse.json({ error: 'create_failed' }, { status: 500 });
  }
}
