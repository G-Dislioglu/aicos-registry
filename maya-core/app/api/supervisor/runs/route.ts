import { NextResponse } from 'next/server';

import { isMayaRequestAuthorized } from '@/lib/maya-auth';
import { getRuns, createRun, getRun, completeRun } from '@/lib/supervisor-store';
import { RunStatus, RunTriggerType } from '@/lib/supervisor-types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId');
  const id = searchParams.get('id');

  if (id) {
    const run = await getRun(id);
    if (!run) {
      return NextResponse.json({ error: 'run_not_found' }, { status: 404 });
    }
    return NextResponse.json({ run });
  }

  if (!workspaceId) {
    return NextResponse.json({ error: 'missing_workspace_id' }, { status: 400 });
  }

  const runs = await getRuns(workspaceId);
  return NextResponse.json({ runs });
}

export async function POST(request: Request) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = body.id || crypto.randomUUID();
    const workspaceId = body.workspaceId;
    const objective = body.objective || '';
    const triggerType: RunTriggerType = body.triggerType || 'manual';

    if (!workspaceId) {
      return NextResponse.json({ error: 'missing_workspace_id' }, { status: 400 });
    }

    const run = await createRun(id, workspaceId, objective, triggerType);
    return NextResponse.json({ run });
  } catch (error) {
    return NextResponse.json({ error: 'create_failed' }, { status: 500 });
  }
}
