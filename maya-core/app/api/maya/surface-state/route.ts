import { NextRequest, NextResponse } from 'next/server';

import { isMayaRequestAuthorized } from '@/lib/maya-auth';
import { readMayaStore } from '@/lib/maya-store';
import { buildMayaMainSurfaceDerivation } from '@/lib/maya-thread-digest';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const state = await readMayaStore();
    const activeSession = state.sessions.find((session) => session.id === state.activeSessionId) || state.sessions[0] || null;
    const activeWorkspace = state.activeWorkspaceId
      ? state.workspaces.find((workspace) => workspace.id === state.activeWorkspaceId) || null
      : activeSession?.workspaceId
        ? state.workspaces.find((workspace) => workspace.id === activeSession.workspaceId) || null
        : null;
    const surface = activeSession ? buildMayaMainSurfaceDerivation(activeSession, activeWorkspace || undefined) : null;

    return NextResponse.json({
      activeSession,
      activeWorkspace,
      surface
    });
  } catch {
    return NextResponse.json({ error: 'surface_state_failed' }, { status: 500 });
  }
}
