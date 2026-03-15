import { NextResponse } from 'next/server';

import { isMayaRequestAuthorized } from '@/lib/maya-auth';
import { getActiveWorkspace, getWorkspace, createWorkspace, updateWorkspace } from '@/lib/supervisor-store';
import { WorkspaceMode, WorkspaceStatus } from '@/lib/supervisor-types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const workspace = id ? await getWorkspace(id) : await getActiveWorkspace();

  if (!workspace) {
    return NextResponse.json({ error: 'workspace_not_found' }, { status: 404 });
  }

  return NextResponse.json({ workspace });
}

export async function POST(request: Request) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = body.id || crypto.randomUUID();
    const title = body.title || 'New Workspace';
    const goal = body.goal || '';
    const mode: WorkspaceMode = body.mode || 'explore';

    const workspace = await createWorkspace(id, title, goal, mode);
    return NextResponse.json({ workspace });
  } catch (error) {
    return NextResponse.json({ error: 'create_failed' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'missing_id' }, { status: 400 });
    }

    const workspace = await updateWorkspace(id, {
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.goal !== undefined && { goal: updates.goal }),
      ...(updates.currentFocus !== undefined && { currentFocus: updates.currentFocus }),
      ...(updates.mode !== undefined && { mode: updates.mode as WorkspaceMode }),
      ...(updates.status !== undefined && { status: updates.status as WorkspaceStatus }),
      ...(updates.constraintsJson !== undefined && { constraintsJson: updates.constraintsJson }),
      ...(updates.openQuestionsJson !== undefined && { openQuestionsJson: updates.openQuestionsJson })
    });

    if (!workspace) {
      return NextResponse.json({ error: 'workspace_not_found' }, { status: 404 });
    }

    return NextResponse.json({ workspace });
  } catch (error) {
    return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  }
}
