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

export type ChatSession = {
  id: string;
  title: string;
  intent: string;
  messages: ChatMessage[];
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
  sessions: ChatSession[];
  activeSessionId: string;
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
