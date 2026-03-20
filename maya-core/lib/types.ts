export type Profile = {
  id: string;
  displayName: string;
  addressing?: string;
  role: string;
  timezone: string;
  location: string;
  mission: string;
  assistantContract: string;
  communicationStyle: string[];
  currentFocus: string[];
};

export type AppLanguage = 'de' | 'en';

export type Project = {
  id: string;
  title: string;
  stage: 'active' | 'watch' | 'incubating';
  priority: 'high' | 'medium' | 'low';
  summary: string;
  desiredOutcome: string;
  nextMove: string;
  risk: string;
  projectQuestion: string;
  tags: string[];
  constraints?: string[];
};

export type MemoryItem = {
  id: string;
  title: string;
  kind: 'preference' | 'project' | 'constraint' | 'insight';
  summary: string;
  whyItMatters: string;
  projectIds: string[];
  tags: string[];
  pinned?: boolean;
};

export type FocusCard = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  actionLabel: string;
  href: '/' | '/chat' | '/context';
};

export type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
  relatedProjectIds?: string[];
  relatedMemoryIds?: string[];
};

export type ThreadDigestConfidence = 'high' | 'medium' | 'low';

export type ThreadDigest = {
  threadId: string;
  title: string;
  summary: string;
  currentState: string;
  openLoops: string[];
  nextEntry: string;
  confidence: ThreadDigestConfidence;
  updatedAt: string;
  sourceMessageCount: number;
  needsRefresh: boolean;
};

export type MayaWorkrunStatus = 'open' | 'completed';

export type MayaWorkrun = {
  focus: string;
  status: MayaWorkrunStatus;
  lastOutput: string | null;
  lastStep: string | null;
  nextStep: string;
  updatedAt: string;
  source: 'derived' | 'manual';
};

export type MayaCheckpointStatus = 'open' | 'completed';

export type MayaCheckpoint = {
  id: string;
  label: string;
  detail: string | null;
  status: MayaCheckpointStatus;
  source: 'derived' | 'manual';
  updatedAt: string;
};

export type MayaCheckpointBoard = {
  title: string;
  focus: string;
  checkpoints: MayaCheckpoint[];
  updatedAt: string;
  source: 'derived' | 'manual';
};

export type MayaThreadHandoffStatus = 'active' | 'paused' | 'completed';

export type MayaThreadHandoff = {
  status: MayaThreadHandoffStatus;
  achieved: string;
  openItems: string[];
  nextEntry: string;
  updatedAt: string;
  source: 'derived' | 'manual';
};

export type MayaWorkspaceStatus = 'active' | 'paused' | 'completed';

export type MayaWorkspaceContext = {
  id: string;
  title: string;
  focus: string;
  goal: string;
  currentState: string;
  openItems: string[];
  nextMilestone: string;
  threadIds: string[];
  updatedAt: string;
  source: 'derived' | 'manual';
  status: MayaWorkspaceStatus;
};

export type ChatSession = {
  id: string;
  title: string;
  intent: string;
  messages: ChatMessage[];
  workspaceId?: string | null;
  digest?: ThreadDigest;
  workrun?: MayaWorkrun;
  checkpointBoard?: MayaCheckpointBoard;
  handoff?: MayaThreadHandoff;
  createdAt?: string;
  updatedAt?: string;
};

export type MayaState = {
  profile: Profile;
  focusCards: FocusCard[];
  projects: Project[];
  memory: MemoryItem[];
  session: ChatSession;
};

export type MayaStore = {
  profile: Profile;
  projects: Project[];
  memoryItems: MemoryItem[];
  workspaces: MayaWorkspaceContext[];
  sessions: ChatSession[];
  authVersion: number;
  activeSessionId: string;
  activeWorkspaceId: string | null;
  activeProjectId: string | null;
  language: AppLanguage;
};

export type ChatApiResponse = {
  state: MayaStore;
  session: ChatSession;
  message: ChatMessage;
  sessionId: string;
  relevantProjectIds: string[];
  relevantMemoryIds: string[];
  activeProjectId: string | null;
};
