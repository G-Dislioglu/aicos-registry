import { buildMayaMainSurfaceDerivation, type MayaMainSurfaceDerivation } from '@/lib/maya-thread-digest';
import { readMayaStore } from '@/lib/maya-store';
import { type ChatSession, type MayaWorkspaceContext } from '@/lib/types';

export type MayaSurfaceStateResponse = {
  activeSession: ChatSession | null;
  activeWorkspace: MayaWorkspaceContext | null;
  surface: MayaMainSurfaceDerivation | null;
};

export async function readMayaSurfaceState(): Promise<MayaSurfaceStateResponse> {
  const state = await readMayaStore();
  const activeSession = state.sessions.find((session) => session.id === state.activeSessionId) || state.sessions[0] || null;
  const activeWorkspace = state.activeWorkspaceId
    ? state.workspaces.find((workspace) => workspace.id === state.activeWorkspaceId) || null
    : activeSession?.workspaceId
      ? state.workspaces.find((workspace) => workspace.id === activeSession.workspaceId) || null
      : null;
  const surface = activeSession ? buildMayaMainSurfaceDerivation(activeSession, activeWorkspace || undefined) : null;

  return {
    activeSession,
    activeWorkspace,
    surface
  };
}
