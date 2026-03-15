'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

import { useLanguage } from '@/components/language-provider';
import { ChatApiResponse, ChatSession, MayaStore, MemoryItem, Profile, Project } from '@/lib/types';

type SessionInput = {
  title?: string;
  intent?: string;
};

type MayaStateContextValue = {
  state: MayaStore | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  activeSession: ChatSession | null;
  activeProject: Project | null;
  refresh: () => Promise<void>;
  updateProfile: (profile: Partial<Profile>) => Promise<void>;
  upsertProject: (project: Partial<Project> & { id?: string }) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  upsertMemoryItem: (item: Partial<MemoryItem> & { id?: string }) => Promise<void>;
  deleteMemoryItem: (itemId: string) => Promise<void>;
  setMemoryPinned: (itemId: string, pinned: boolean) => Promise<void>;
  setActiveProjectId: (projectId: string | null) => Promise<void>;
  createSession: (input?: SessionInput) => Promise<string | undefined>;
  selectSession: (sessionId: string) => Promise<void>;
  sendMessage: (message: string) => Promise<ChatApiResponse>;
};

const MayaStateContext = createContext<MayaStateContextValue | null>(null);

function getDefaultSessionTitle(language: 'de' | 'en') {
  return language === 'de' ? 'Neue Session' : 'New session';
}

function getDefaultSessionIntent(language: 'de' | 'en') {
  return language === 'de' ? 'Offene Arbeit klären und den nächsten Schritt festhalten.' : 'Clarify open work and hold the next move in view.';
}

export function MayaStateProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const pathname = usePathname();
  const [state, setState] = useState<MayaStore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stateRef = useRef<MayaStore | null>(null);

  const redirectToLogin = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const target = pathname && pathname !== '/login' ? pathname : '/';
    window.location.href = `/login?next=${encodeURIComponent(target)}`;
  }, [pathname]);

  const replaceState = useCallback((nextState: MayaStore) => {
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  const refresh = useCallback(async () => {
    if (pathname === '/login') {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/state', { cache: 'no-store' });

      if (response.status === 401) {
        redirectToLogin();
        return;
      }

      if (response.status === 503) {
        throw new Error('state_unavailable');
      }

      if (!response.ok) {
        throw new Error('state_load_failed');
      }

      const payload = (await response.json()) as { state: MayaStore };
      replaceState(payload.state);
    } catch {
      setError('state_load_failed');
    } finally {
      setIsLoading(false);
    }
  }, [pathname, redirectToLogin, replaceState]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const persistState = useCallback(async (nextState: MayaStore) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/state', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ state: nextState })
      });

      if (response.status === 401) {
        redirectToLogin();
        throw new Error('unauthorized');
      }

      if (!response.ok) {
        throw new Error('state_save_failed');
      }

      const payload = (await response.json()) as { state: MayaStore };
      replaceState(payload.state);
      return payload.state;
    } catch {
      setError('state_save_failed');
      throw new Error('state_save_failed');
    } finally {
      setIsSaving(false);
    }
  }, [redirectToLogin, replaceState]);

  const mutateState = useCallback(async (updater: (current: MayaStore) => MayaStore) => {
    const current = stateRef.current;

    if (!current) {
      throw new Error('state_not_ready');
    }

    return persistState(updater(current));
  }, [persistState]);

  useEffect(() => {
    if (!stateRef.current || stateRef.current.language === language) {
      return;
    }

    mutateState((current) => ({
      ...current,
      language
    })).catch(() => undefined);
  }, [language, mutateState, state]);

  const updateProfile = useCallback(async (profile: Partial<Profile>) => {
    await mutateState((current) => ({
      ...current,
      profile: {
        ...current.profile,
        ...profile
      }
    }));
  }, [mutateState]);

  const upsertProject = useCallback(async (project: Partial<Project> & { id?: string }) => {
    await mutateState((current) => {
      const existing = project.id ? current.projects.find((item) => item.id === project.id) : undefined;
      const nextProject: Project = {
        id: project.id || crypto.randomUUID(),
        title: project.title?.trim() || existing?.title || '',
        stage: project.stage || existing?.stage || 'active',
        priority: project.priority || existing?.priority || 'medium',
        summary: project.summary?.trim() || existing?.summary || '',
        desiredOutcome: project.desiredOutcome?.trim() || existing?.desiredOutcome || '',
        nextMove: project.nextMove?.trim() || existing?.nextMove || '',
        risk: project.risk?.trim() || existing?.risk || '',
        projectQuestion: project.projectQuestion?.trim() || existing?.projectQuestion || '',
        tags: Array.isArray(project.tags) ? project.tags : existing?.tags || [],
        constraints: Array.isArray(project.constraints) ? project.constraints : existing?.constraints || []
      };
      const projects = existing
        ? current.projects.map((item) => (item.id === nextProject.id ? nextProject : item))
        : [nextProject, ...current.projects];

      return {
        ...current,
        projects,
        activeProjectId: current.activeProjectId || nextProject.id
      };
    });
  }, [mutateState]);

  const deleteProject = useCallback(async (projectId: string) => {
    await mutateState((current) => {
      const projects = current.projects.filter((project) => project.id !== projectId);
      const nextActiveProjectId = current.activeProjectId === projectId ? projects[0]?.id || null : current.activeProjectId;

      return {
        ...current,
        projects,
        activeProjectId: nextActiveProjectId,
        memoryItems: current.memoryItems.map((item) => ({
          ...item,
          projectIds: item.projectIds.filter((id) => id !== projectId)
        }))
      };
    });
  }, [mutateState]);

  const upsertMemoryItem = useCallback(async (item: Partial<MemoryItem> & { id?: string }) => {
    await mutateState((current) => {
      const existing = item.id ? current.memoryItems.find((entry) => entry.id === item.id) : undefined;
      const nextItem: MemoryItem = {
        id: item.id || crypto.randomUUID(),
        title: item.title?.trim() || existing?.title || '',
        kind: item.kind || existing?.kind || 'insight',
        summary: item.summary?.trim() || existing?.summary || '',
        whyItMatters: item.whyItMatters?.trim() || existing?.whyItMatters || '',
        projectIds: Array.isArray(item.projectIds) ? item.projectIds : existing?.projectIds || [],
        tags: Array.isArray(item.tags) ? item.tags : existing?.tags || [],
        pinned: typeof item.pinned === 'boolean' ? item.pinned : Boolean(existing?.pinned)
      };
      const memoryItems = existing
        ? current.memoryItems.map((entry) => (entry.id === nextItem.id ? nextItem : entry))
        : [nextItem, ...current.memoryItems];

      return {
        ...current,
        memoryItems
      };
    });
  }, [mutateState]);

  const deleteMemoryItem = useCallback(async (itemId: string) => {
    await mutateState((current) => ({
      ...current,
      memoryItems: current.memoryItems.filter((item) => item.id !== itemId)
    }));
  }, [mutateState]);

  const setMemoryPinned = useCallback(async (itemId: string, pinned: boolean) => {
    await mutateState((current) => ({
      ...current,
      memoryItems: current.memoryItems.map((item) => (item.id === itemId ? { ...item, pinned } : item))
    }));
  }, [mutateState]);

  const setActiveProjectId = useCallback(async (projectId: string | null) => {
    await mutateState((current) => ({
      ...current,
      activeProjectId: projectId
    }));
  }, [mutateState]);

  const createSession = useCallback(async (input?: SessionInput) => {
    let createdSessionId: string | undefined;

    await mutateState((current) => {
      const timestamp = new Date().toISOString();
      const session: ChatSession = {
        id: crypto.randomUUID(),
        title: input?.title?.trim() || getDefaultSessionTitle(language),
        intent: input?.intent?.trim() || getDefaultSessionIntent(language),
        messages: [],
        createdAt: timestamp,
        updatedAt: timestamp
      };

      createdSessionId = session.id;

      return {
        ...current,
        sessions: [session, ...current.sessions],
        activeSessionId: session.id
      };
    });

    return createdSessionId;
  }, [language, mutateState]);

  const selectSession = useCallback(async (sessionId: string) => {
    await mutateState((current) => ({
      ...current,
      activeSessionId: sessionId
    }));
  }, [mutateState]);

  const sendMessage = useCallback(async (message: string) => {
    const current = stateRef.current;

    if (!current) {
      throw new Error('state_not_ready');
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          sessionId: current.activeSessionId,
          language,
          activeProjectId: current.activeProjectId
        })
      });

      if (response.status === 401) {
        redirectToLogin();
        throw new Error('unauthorized');
      }

      if (!response.ok) {
        throw new Error('chat_failed');
      }

      const payload = (await response.json()) as ChatApiResponse;
      replaceState(payload.state);
      return payload;
    } catch {
      setError('chat_failed');
      throw new Error('chat_failed');
    } finally {
      setIsSaving(false);
    }
  }, [language, redirectToLogin, replaceState]);

  const activeSession = useMemo(() => {
    if (!state) {
      return null;
    }

    return state.sessions.find((session) => session.id === state.activeSessionId) || state.sessions[0] || null;
  }, [state]);

  const activeProject = useMemo(() => {
    if (!state) {
      return null;
    }

    return state.projects.find((project) => project.id === state.activeProjectId) || null;
  }, [state]);

  const value = useMemo<MayaStateContextValue>(() => ({
    state,
    isLoading,
    isSaving,
    error,
    activeSession,
    activeProject,
    refresh,
    updateProfile,
    upsertProject,
    deleteProject,
    upsertMemoryItem,
    deleteMemoryItem,
    setMemoryPinned,
    setActiveProjectId,
    createSession,
    selectSession,
    sendMessage
  }), [activeProject, activeSession, createSession, deleteMemoryItem, error, isLoading, isSaving, refresh, selectSession, sendMessage, setActiveProjectId, setMemoryPinned, state, updateProfile, upsertMemoryItem, upsertProject, deleteProject]);

  return <MayaStateContext.Provider value={value}>{children}</MayaStateContext.Provider>;
}

export function useMayaState() {
  const context = useContext(MayaStateContext);

  if (!context) {
    throw new Error('useMayaState must be used inside MayaStateProvider');
  }

  return context;
}
