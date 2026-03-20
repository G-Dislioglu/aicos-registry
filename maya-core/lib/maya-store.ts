import { promises as fs } from 'fs';
import path from 'path';

import { ensureMayaPostgresSchema, getMayaPostgresPool } from '@/lib/maya-db';
import { getMayaRuntimeConfig } from '@/lib/maya-env';
import { isLanguage } from '@/lib/i18n';
import { getMayaState } from '@/lib/seed-data';
import { AppLanguage, ChatMessage, ChatSession, MayaCheckpoint, MayaCheckpointBoard, MayaStore, MayaThreadHandoff, MayaWorkspaceContext, MayaWorkrun, MemoryItem, Profile, Project, ThreadDigest } from '@/lib/types';

const DATA_DIRECTORY = path.join(process.cwd(), 'data');
const STORE_FILE_PATH = path.join(DATA_DIRECTORY, 'maya-store.json');
const STORE_ROW_ID = 'primary';

function nowIso() {
  return new Date().toISOString();
}

function readString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function readStage(value: unknown, fallback: Project['stage']) {
  return value === 'active' || value === 'watch' || value === 'incubating' ? value : fallback;
}

function readPriority(value: unknown, fallback: Project['priority']) {
  return value === 'high' || value === 'medium' || value === 'low' ? value : fallback;
}

function readMemoryKind(value: unknown, fallback: MemoryItem['kind']) {
  return value === 'preference' || value === 'project' || value === 'constraint' || value === 'insight' ? value : fallback;
}

function normalizeProfile(profile: Partial<Profile> | undefined, fallback: Profile): Profile {
  return {
    id: readString(profile?.id, fallback.id),
    displayName: readString(profile?.displayName, fallback.displayName),
    addressing: readString(profile?.addressing, fallback.addressing || ''),
    role: readString(profile?.role, fallback.role),
    timezone: readString(profile?.timezone, fallback.timezone),
    location: readString(profile?.location, fallback.location),
    mission: readString(profile?.mission, fallback.mission),
    assistantContract: readString(profile?.assistantContract, fallback.assistantContract),
    communicationStyle: Array.isArray(profile?.communicationStyle) ? readStringArray(profile?.communicationStyle) : fallback.communicationStyle,
    currentFocus: Array.isArray(profile?.currentFocus) ? readStringArray(profile?.currentFocus) : fallback.currentFocus
  };
}

function normalizeProject(project: Partial<Project> | undefined, fallback?: Project): Project {
  const base: Project = fallback || {
    id: '',
    title: '',
    stage: 'active',
    priority: 'medium',
    summary: '',
    desiredOutcome: '',
    nextMove: '',
    risk: '',
    projectQuestion: '',
    tags: [],
    constraints: []
  };

  return {
    id: readString(project?.id, base.id),
    title: readString(project?.title, base.title),
    stage: readStage(project?.stage, base.stage),
    priority: readPriority(project?.priority, base.priority),
    summary: readString(project?.summary, base.summary),
    desiredOutcome: readString(project?.desiredOutcome, base.desiredOutcome),
    nextMove: readString(project?.nextMove, base.nextMove),
    risk: readString(project?.risk, base.risk),
    projectQuestion: readString(project?.projectQuestion, base.projectQuestion),
    tags: readStringArray(project?.tags),
    constraints: readStringArray(project?.constraints ?? base.constraints)
  };
}

function normalizeMemoryItem(item: Partial<MemoryItem> | undefined, fallback?: MemoryItem): MemoryItem {
  const base: MemoryItem = fallback || {
    id: '',
    title: '',
    kind: 'insight',
    summary: '',
    whyItMatters: '',
    projectIds: [],
    tags: [],
    pinned: false
  };

  return {
    id: readString(item?.id, base.id),
    title: readString(item?.title, base.title),
    kind: readMemoryKind(item?.kind, base.kind),
    summary: readString(item?.summary, base.summary),
    whyItMatters: readString(item?.whyItMatters, base.whyItMatters),
    projectIds: readStringArray(item?.projectIds),
    tags: readStringArray(item?.tags),
    pinned: typeof item?.pinned === 'boolean' ? item.pinned : Boolean(base.pinned)
  };
}

function normalizeMessage(message: Partial<ChatMessage> | undefined): ChatMessage {
  return {
    id: readString(message?.id, crypto.randomUUID()),
    role: message?.role === 'user' ? 'user' : 'assistant',
    content: readString(message?.content),
    timestamp: readString(message?.timestamp),
    relatedProjectIds: readStringArray(message?.relatedProjectIds),
    relatedMemoryIds: readStringArray(message?.relatedMemoryIds)
  };
}

function readDigestConfidence(value: unknown, fallback: ThreadDigest['confidence']): ThreadDigest['confidence'] {
  return value === 'high' || value === 'medium' || value === 'low' ? value : fallback;
}

function normalizeThreadDigest(digest: Partial<ThreadDigest> | undefined, sessionId: string, messageCount: number): ThreadDigest | undefined {
  if (!digest || typeof digest !== 'object') {
    return undefined;
  }

  return {
    threadId: readString(digest.threadId, sessionId),
    title: readString(digest.title),
    summary: readString(digest.summary),
    currentState: readString(digest.currentState),
    openLoops: readStringArray(digest.openLoops),
    nextEntry: readString(digest.nextEntry),
    confidence: readDigestConfidence(digest.confidence, 'low'),
    updatedAt: readString(digest.updatedAt, nowIso()),
    sourceMessageCount: Number.isInteger(digest.sourceMessageCount) && Number(digest.sourceMessageCount) >= 0
      ? Number(digest.sourceMessageCount)
      : messageCount,
    needsRefresh: typeof digest.needsRefresh === 'boolean' ? digest.needsRefresh : messageCount > 0
  };
}

function readWorkrunStatus(value: unknown, fallback: MayaWorkrun['status']): MayaWorkrun['status'] {
  return value === 'completed' || value === 'open' ? value : fallback;
}

function readWorkrunSource(value: unknown, fallback: MayaWorkrun['source']): MayaWorkrun['source'] {
  return value === 'manual' || value === 'derived' ? value : fallback;
}

function readCheckpointStatus(value: unknown, fallback: MayaCheckpoint['status']): MayaCheckpoint['status'] {
  return value === 'completed' || value === 'open' ? value : fallback;
}

function readCheckpointSource(value: unknown, fallback: MayaCheckpoint['source']): MayaCheckpoint['source'] {
  return value === 'manual' || value === 'derived' ? value : fallback;
}

function readThreadHandoffStatus(value: unknown, fallback: MayaThreadHandoff['status']): MayaThreadHandoff['status'] {
  return value === 'active' || value === 'paused' || value === 'completed' ? value : fallback;
}

function readThreadHandoffSource(value: unknown, fallback: MayaThreadHandoff['source']): MayaThreadHandoff['source'] {
  return value === 'manual' || value === 'derived' ? value : fallback;
}

function readWorkspaceStatus(value: unknown, fallback: MayaWorkspaceContext['status']): MayaWorkspaceContext['status'] {
  return value === 'active' || value === 'paused' || value === 'completed' ? value : fallback;
}

function readWorkspaceSource(value: unknown, fallback: MayaWorkspaceContext['source']): MayaWorkspaceContext['source'] {
  return value === 'manual' || value === 'derived' ? value : fallback;
}

function normalizeCheckpoint(checkpoint: Partial<MayaCheckpoint> | undefined, index: number): MayaCheckpoint | undefined {
  if (!checkpoint || typeof checkpoint !== 'object') {
    return undefined;
  }

  const label = readString(checkpoint.label);
  const detail = readString(checkpoint.detail, '') || null;

  if (!label && !detail) {
    return undefined;
  }

  return {
    id: readString(checkpoint.id, `checkpoint-${index + 1}`),
    label: label || detail || `Checkpoint ${index + 1}`,
    detail,
    status: readCheckpointStatus(checkpoint.status, 'open'),
    source: readCheckpointSource(checkpoint.source, 'derived'),
    updatedAt: readString(checkpoint.updatedAt, nowIso())
  };
}

function normalizeCheckpointBoard(board: Partial<MayaCheckpointBoard> | undefined): MayaCheckpointBoard | undefined {
  if (!board || typeof board !== 'object') {
    return undefined;
  }

  const checkpoints = Array.isArray(board.checkpoints)
    ? board.checkpoints
        .map((checkpoint, index) => normalizeCheckpoint(checkpoint, index))
        .filter((checkpoint): checkpoint is MayaCheckpoint => Boolean(checkpoint))
    : [];
  const focus = readString(board.focus);
  const title = readString(board.title, focus ? 'Arbeitsboard' : '');

  if (!title && !focus && checkpoints.length === 0) {
    return undefined;
  }

  return {
    title: title || 'Arbeitsboard',
    focus: focus || title || 'Aktueller Thread',
    checkpoints,
    updatedAt: readString(board.updatedAt, nowIso()),
    source: readCheckpointSource(board.source, 'derived')
  };
}

function normalizeThreadHandoff(handoff: Partial<MayaThreadHandoff> | undefined): MayaThreadHandoff | undefined {
  if (!handoff || typeof handoff !== 'object') {
    return undefined;
  }

  const achieved = readString(handoff.achieved);
  const openItems = readStringArray(handoff.openItems);
  const nextEntry = readString(handoff.nextEntry);

  if (!achieved && openItems.length === 0 && !nextEntry) {
    return undefined;
  }

  return {
    status: readThreadHandoffStatus(handoff.status, 'active'),
    achieved,
    openItems,
    nextEntry,
    updatedAt: readString(handoff.updatedAt, nowIso()),
    source: readThreadHandoffSource(handoff.source, 'derived')
  };
}

function normalizeWorkspaceContext(workspace: Partial<MayaWorkspaceContext> | undefined, index: number): MayaWorkspaceContext | undefined {
  if (!workspace || typeof workspace !== 'object') {
    return undefined;
  }

  const title = readString(workspace.title);
  const focus = readString(workspace.focus);
  const goal = readString(workspace.goal);
  const currentState = readString(workspace.currentState);
  const openItems = readStringArray(workspace.openItems);
  const nextMilestone = readString(workspace.nextMilestone);
  const threadIds = readStringArray(workspace.threadIds);
  const workspaceId = readString(workspace.id);

  if (!title && !focus && !goal && !currentState && openItems.length === 0 && !nextMilestone) {
    return undefined;
  }

  return {
    id: workspaceId || `workspace-${index + 1}`,
    title: title || focus || goal || `Arbeitsraum ${index + 1}`,
    focus: focus || title || goal || currentState || 'Aktiver Arbeitsraum',
    goal: goal || focus || title || 'Arbeitsziel klären',
    currentState: currentState || focus || title || 'Noch kein Gesamtstand hinterlegt.',
    openItems,
    nextMilestone: nextMilestone || openItems[0] || focus || title || 'Nächsten Arbeitsblock festlegen',
    threadIds,
    updatedAt: readString(workspace.updatedAt, nowIso()),
    source: readWorkspaceSource(workspace.source, 'derived'),
    status: readWorkspaceStatus(workspace.status, 'active')
  };
}

function normalizeWorkrun(workrun: Partial<MayaWorkrun> | undefined): MayaWorkrun | undefined {
  if (!workrun || typeof workrun !== 'object') {
    return undefined;
  }

  const nextStep = readString(workrun.nextStep);
  const focus = readString(workrun.focus, nextStep);

  if (!focus && !nextStep) {
    return undefined;
  }

  return {
    focus: focus || nextStep,
    status: readWorkrunStatus(workrun.status, 'open'),
    lastOutput: readString(workrun.lastOutput, '') || null,
    lastStep: readString(workrun.lastStep, '') || null,
    nextStep: nextStep || focus,
    updatedAt: readString(workrun.updatedAt, nowIso()),
    source: readWorkrunSource(workrun.source, 'derived')
  };
}

function normalizeSession(session: Partial<ChatSession> | undefined, fallback?: ChatSession): ChatSession {
  const timestamp = nowIso();
  const base: ChatSession = fallback || {
    id: crypto.randomUUID(),
    title: '',
    intent: '',
    messages: [],
    createdAt: timestamp,
    updatedAt: timestamp
  };

  return {
    id: readString(session?.id, base.id),
    title: readString(session?.title, base.title),
    intent: readString(session?.intent, base.intent),
    messages: Array.isArray(session?.messages) ? session.messages.map((message) => normalizeMessage(message)) : base.messages.map((message) => normalizeMessage(message)),
    workspaceId: session?.workspaceId === null ? null : readString(session?.workspaceId, base.workspaceId || '' ) || null,
    digest: normalizeThreadDigest(
      session?.digest,
      readString(session?.id, base.id),
      Array.isArray(session?.messages) ? session.messages.length : base.messages.length
    ),
    workrun: normalizeWorkrun(session?.workrun),
    checkpointBoard: normalizeCheckpointBoard(session?.checkpointBoard),
    handoff: normalizeThreadHandoff(session?.handoff),
    createdAt: readString(session?.createdAt, base.createdAt || timestamp),
    updatedAt: readString(session?.updatedAt, base.updatedAt || timestamp)
  };
}

export function createInitialMayaStore(language: AppLanguage = getMayaRuntimeConfig().seedLanguage): MayaStore {
  const seed = getMayaState(language);
  const timestamp = nowIso();
  const projects = seed.projects.map((project) => normalizeProject(project));
  const memoryItems = seed.memory.map((item, index) => normalizeMemoryItem({ ...item, pinned: item.pinned ?? index < 2 }));
  const session = normalizeSession({
    ...seed.session,
    createdAt: seed.session.createdAt || timestamp,
    updatedAt: seed.session.updatedAt || timestamp
  });

  return {
    profile: normalizeProfile(seed.profile, seed.profile),
    projects,
    memoryItems,
    workspaces: [],
    sessions: [session],
    authVersion: 1,
    activeSessionId: session.id,
    activeWorkspaceId: null,
    activeProjectId: projects[0]?.id || null,
    language
  };
}

export function normalizeMayaStore(store: Partial<MayaStore> | undefined): MayaStore {
  const language = isLanguage(String(store?.language || '')) ? (store?.language as AppLanguage) : 'de';
  const base = createInitialMayaStore(language);
  const projects = Array.isArray(store?.projects) ? store.projects.map((project) => normalizeProject(project)) : base.projects;
  const projectIds = new Set(projects.map((project) => project.id));
  const memoryItems = Array.isArray(store?.memoryItems)
    ? store.memoryItems
        .map((item, index) => normalizeMemoryItem(item, base.memoryItems[index]))
        .map((item) => ({
          ...item,
          projectIds: item.projectIds.filter((projectId) => projectIds.has(projectId))
        }))
        .sort((left, right) => Number(Boolean(right.pinned)) - Number(Boolean(left.pinned)) || left.title.localeCompare(right.title))
    : base.memoryItems;
  const workspaces = Array.isArray(store?.workspaces)
    ? store.workspaces
        .map((workspace, index) => normalizeWorkspaceContext(workspace, index))
        .filter((workspace): workspace is MayaWorkspaceContext => Boolean(workspace))
    : base.workspaces;
  const workspaceIds = new Set(workspaces.map((workspace) => workspace.id));
  const sessions = Array.isArray(store?.sessions) && store.sessions.length > 0
    ? store.sessions.map((session, index) => {
        const normalized = normalizeSession(session, base.sessions[index]);
        return {
          ...normalized,
          workspaceId: normalized.workspaceId && workspaceIds.has(normalized.workspaceId) ? normalized.workspaceId : null
        };
      })
    : base.sessions;
  const reconciledWorkspaces = workspaces.map((workspace) => ({
    ...workspace,
    threadIds: workspace.threadIds.filter((threadId) => sessions.some((session) => session.id === threadId))
  }));
  const sessionIds = new Set(sessions.map((session) => session.id));
  const reconciledWorkspaceIds = new Set(reconciledWorkspaces.map((workspace) => workspace.id));
  const authVersion = Number.isInteger(store?.authVersion) && Number(store?.authVersion) > 0 ? Number(store?.authVersion) : base.authVersion;
  const activeSessionId = sessionIds.has(String(store?.activeSessionId || '')) ? String(store?.activeSessionId) : sessions[0].id;
  const activeWorkspaceId = reconciledWorkspaceIds.has(String(store?.activeWorkspaceId || ''))
    ? String(store?.activeWorkspaceId)
    : sessions.find((session) => session.id === activeSessionId)?.workspaceId || reconciledWorkspaces[0]?.id || null;
  const activeProjectId = projectIds.has(String(store?.activeProjectId || '')) ? String(store?.activeProjectId) : projects[0]?.id || null;

  return {
    profile: normalizeProfile(store?.profile, base.profile),
    projects,
    memoryItems,
    workspaces: reconciledWorkspaces,
    sessions,
    authVersion,
    activeSessionId,
    activeWorkspaceId,
    activeProjectId,
    language
  };
}

async function ensureStoreFile() {
  await fs.mkdir(DATA_DIRECTORY, { recursive: true });

  try {
    await fs.access(STORE_FILE_PATH);
  } catch {
    const initial = createInitialMayaStore();
    await fs.writeFile(STORE_FILE_PATH, JSON.stringify(initial, null, 2), 'utf8');
  }
}

async function readFileMayaStore() {
  await ensureStoreFile();

  try {
    const raw = await fs.readFile(STORE_FILE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<MayaStore>;
    const normalized = normalizeMayaStore(parsed);
    await fs.writeFile(STORE_FILE_PATH, JSON.stringify(normalized, null, 2), 'utf8');
    return normalized;
  } catch {
    const initial = createInitialMayaStore();
    await fs.writeFile(STORE_FILE_PATH, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
}

async function writeFileMayaStore(store: Partial<MayaStore>) {
  await ensureStoreFile();
  const normalized = normalizeMayaStore(store);
  await fs.writeFile(STORE_FILE_PATH, JSON.stringify(normalized, null, 2), 'utf8');
  return normalized;
}

async function readPostgresMayaStore() {
  await ensureMayaPostgresSchema();

  const pool = getMayaPostgresPool();
  const result = await pool.query<{ payload: Partial<MayaStore> }>('SELECT payload FROM maya_state WHERE id = $1', [STORE_ROW_ID]);

  if (result.rowCount && result.rows[0]?.payload) {
    const normalized = normalizeMayaStore(result.rows[0].payload);
    await writePostgresMayaStore(normalized);
    return normalized;
  }

  const initial = createInitialMayaStore();
  await pool.query('INSERT INTO maya_state (id, payload, updated_at) VALUES ($1, $2::jsonb, NOW()) ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()', [STORE_ROW_ID, JSON.stringify(initial)]);
  return initial;
}

async function writePostgresMayaStore(store: Partial<MayaStore>) {
  await ensureMayaPostgresSchema();

  const normalized = normalizeMayaStore(store);
  await getMayaPostgresPool().query('INSERT INTO maya_state (id, payload, updated_at) VALUES ($1, $2::jsonb, NOW()) ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()', [STORE_ROW_ID, JSON.stringify(normalized)]);
  return normalized;
}

export async function readMayaStore() {
  const runtime = getMayaRuntimeConfig();

  if (runtime.storageDriver === 'postgres') {
    return readPostgresMayaStore();
  }

  return readFileMayaStore();
}

export async function writeMayaStore(store: Partial<MayaStore>) {
  const runtime = getMayaRuntimeConfig();

  if (runtime.storageDriver === 'postgres') {
    return writePostgresMayaStore(store);
  }

  return writeFileMayaStore(store);
}

export function getStoreFilePath() {
  return STORE_FILE_PATH;
}

export function getMayaStorageInfo() {
  const runtime = getMayaRuntimeConfig();

  return {
    driver: runtime.storageDriver,
    seedLanguage: runtime.seedLanguage,
    storeFilePath: runtime.storageDriver === 'file' ? STORE_FILE_PATH : null
  };
}
