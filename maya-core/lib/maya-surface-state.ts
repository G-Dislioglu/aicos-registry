import { buildMayaMainSurfaceDerivation, type MayaMainSurfaceDerivation } from '@/lib/maya-thread-digest';
import { readMayaStore } from '@/lib/maya-store';

export type MayaSurfaceStateAnchor = {
  id: string;
  title: string | null;
};

export type MayaSurfaceStateResponse = {
  activeSession: MayaSurfaceStateAnchor | null;
  activeWorkspace: MayaSurfaceStateAnchor | null;
  surface: MayaMainSurfaceDerivation | null;
};

export async function readMayaSurfaceState(): Promise<MayaSurfaceStateResponse> {
  const state = await readMayaStore();
  const activeSessionRecord = state.sessions.find((session) => session.id === state.activeSessionId) || state.sessions[0] || null;
  const activeWorkspaceRecord = state.activeWorkspaceId
    ? state.workspaces.find((workspace) => workspace.id === state.activeWorkspaceId) || null
    : activeSessionRecord?.workspaceId
      ? state.workspaces.find((workspace) => workspace.id === activeSessionRecord.workspaceId) || null
      : null;
  const surface = activeSessionRecord ? buildMayaMainSurfaceDerivation(activeSessionRecord, activeWorkspaceRecord || undefined) : null;

  return {
    activeSession: activeSessionRecord
      ? {
          id: activeSessionRecord.id,
          title: activeSessionRecord.title || null
        }
      : null,
    activeWorkspace: activeWorkspaceRecord
      ? {
          id: activeWorkspaceRecord.id,
          title: activeWorkspaceRecord.title || null
        }
      : null,
    surface
  };
}
