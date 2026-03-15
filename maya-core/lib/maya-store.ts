import { promises as fs } from 'fs';
import path from 'path';

import { ensureMayaPostgresSchema, getMayaPostgresPool } from '@/lib/maya-db';
import { getMayaRuntimeConfig } from '@/lib/maya-env';
import { isLanguage } from '@/lib/i18n';
import { getMayaState } from '@/lib/seed-data';
import { AppLanguage, ChatMessage, ChatSession, MayaStore, MemoryItem, Profile, Project } from '@/lib/types';

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

  return value.map((item) => String(item).trim()).filter(Boolean);
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
    sessions: [session],
    authVersion: 1,
    activeSessionId: session.id,
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
  const sessions = Array.isArray(store?.sessions) && store.sessions.length > 0
    ? store.sessions.map((session, index) => normalizeSession(session, base.sessions[index]))
    : base.sessions;
  const sessionIds = new Set(sessions.map((session) => session.id));
  const authVersion = Number.isInteger(store?.authVersion) && Number(store?.authVersion) > 0 ? Number(store?.authVersion) : base.authVersion;
  const activeSessionId = sessionIds.has(String(store?.activeSessionId || '')) ? String(store?.activeSessionId) : sessions[0].id;
  const activeProjectId = projectIds.has(String(store?.activeProjectId || '')) ? String(store?.activeProjectId) : projects[0]?.id || null;

  return {
    profile: normalizeProfile(store?.profile, base.profile),
    projects,
    memoryItems,
    sessions,
    authVersion,
    activeSessionId,
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
