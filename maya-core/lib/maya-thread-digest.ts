import { ChatMessage, ChatSession, MayaCheckpoint, MayaCheckpointBoard, MayaThreadHandoff, MayaWorkspaceContext, MayaWorkrun, ThreadDigest } from '@/lib/types';

const DIGEST_STALE_MESSAGE_THRESHOLD = 8;
const MAX_SUMMARY_LENGTH = 220;
const MAX_OPEN_LOOPS = 4;

export type MayaContinuityBriefing = {
  title: string;
  focus: string;
  currentState: string;
  openLoops: string[];
  nextStep: string;
  lastUpdatedAt: string | null;
  confidence: ThreadDigest['confidence'] | 'pending';
  source: 'digest' | 'session';
};

export type MayaResumeAction = {
  id: string;
  label: string;
  prompt: string;
  source: 'next_step' | 'open_loop' | 'resume';
  emphasis: 'primary' | 'secondary';
};

export type MayaActiveWorkrun = {
  focus: string;
  status: 'open' | 'completed';
  lastOutput: string | null;
  lastStep: string | null;
  nextStep: string;
  updatedAt: string | null;
  source: 'derived' | 'manual';
};

export type MayaActiveCheckpointBoard = {
  title: string;
  focus: string;
  checkpoints: MayaCheckpoint[];
  updatedAt: string | null;
  source: 'derived' | 'manual';
  completedCount: number;
  openCount: number;
  progressPercent: number;
};

export type MayaActiveThreadHandoff = {
  status: MayaThreadHandoff['status'];
  achieved: string;
  openItems: string[];
  nextEntry: string;
  updatedAt: string | null;
  source: 'derived' | 'manual';
};

export type MayaActiveWorkspaceContext = {
  id: string;
  title: string;
  focus: string;
  goal: string;
  currentState: string;
  openItems: string[];
  nextMilestone: string;
  threadIds: string[];
  updatedAt: string | null;
  source: 'derived' | 'manual';
  status: MayaWorkspaceContext['status'];
};

const MAX_BOARD_CHECKPOINTS = 4;
const MAX_WORKSPACE_THREADS = 6;

function toSentence(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function truncate(text: string, max: number) {
  if (text.length <= max) {
    return text;
  }

  return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function getLastUserMessage(messages: ChatMessage[]) {
  return [...messages].reverse().find((message) => message.role === 'user');
}

function getLastAssistantMessage(messages: ChatMessage[]) {
  return [...messages].reverse().find((message) => message.role === 'assistant');
}

function getLastMessage(messages: ChatMessage[]) {
  return messages[messages.length - 1];
}

function splitIntoPoints(text: string) {
  return text
    .split(/\n+|[•\-]\s+|\d+\.\s+/)
    .map((part) => toSentence(part))
    .filter(Boolean);
}

function toCheckpointId(label: string, index: number) {
  const slug = toSentence(label)
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return slug ? `checkpoint-${slug}` : `checkpoint-${index + 1}`;
}

function dedupePoints(points: string[]) {
  const seen = new Set<string>();

  return points.filter((point) => {
    const normalized = toSentence(point).toLowerCase();
    if (!normalized || seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
}

function toCheckpointDetail(label: string, focus: string) {
  const normalizedLabel = toSentence(label);
  const normalizedFocus = toSentence(focus);

  if (!normalizedLabel || !normalizedFocus || normalizedLabel === normalizedFocus) {
    return null;
  }

  return truncate(normalizedFocus, 180);
}

function buildDerivedCheckpointList(
  session: ChatSession,
  briefing: MayaContinuityBriefing | undefined,
  resumeActions: MayaResumeAction[],
  workrun: MayaActiveWorkrun | undefined
) {
  const candidatePoints = dedupePoints([
    workrun?.nextStep || '',
    workrun?.lastStep || '',
    ...resumeActions.map((action) => action.label),
    ...briefing?.openLoops || [],
    briefing?.nextStep || '',
    session.intent || ''
  ]).slice(0, MAX_BOARD_CHECKPOINTS);

  return candidatePoints.map((point, index) => ({
    id: toCheckpointId(point, index),
    label: truncate(point, 120),
    detail: toCheckpointDetail(workrun?.focus || briefing?.focus || session.intent || session.title, point),
    status: 'open' as const,
    source: 'derived' as const,
    updatedAt: session.updatedAt || briefing?.lastUpdatedAt || workrun?.updatedAt || new Date().toISOString()
  }));
}

function deriveTitle(session: ChatSession, latestUserText: string) {
  const base = toSentence(session.title || latestUserText || session.intent || 'Fadenkompass');
  return truncate(base, 60);
}

function deriveSummary(session: ChatSession, latestUserText: string, latestAssistantText: string) {
  const pieces = [latestUserText, latestAssistantText, session.intent]
    .map((part) => toSentence(part))
    .filter(Boolean);

  return truncate(pieces.slice(0, 2).join(' '), MAX_SUMMARY_LENGTH);
}

function deriveCurrentState(latestAssistantText: string, latestUserText: string) {
  const assistant = toSentence(latestAssistantText);
  if (assistant) {
    return truncate(assistant, 180);
  }

  return truncate(toSentence(latestUserText), 180);
}

function deriveOpenLoops(latestUserText: string, latestAssistantText: string) {
  const userPoints = splitIntoPoints(latestUserText);
  const assistantPoints = splitIntoPoints(latestAssistantText);
  const combined = [...assistantPoints, ...userPoints]
    .map((point) => truncate(point, 110))
    .filter(Boolean);

  return combined.slice(0, MAX_OPEN_LOOPS);
}

function deriveNextEntry(latestAssistantText: string, latestUserText: string) {
  const assistantPoints = splitIntoPoints(latestAssistantText);
  if (assistantPoints.length > 0) {
    return truncate(assistantPoints[0], 140);
  }

  const user = toSentence(latestUserText);
  if (user) {
    return truncate(`Daran als Nächstes anknüpfen: ${user}`, 140);
  }

  return 'Mit dem letzten offenen Punkt wieder einsteigen.';
}

function deriveConfidence(messageCount: number, hasAssistantReply: boolean): ThreadDigest['confidence'] {
  if (messageCount >= 6 && hasAssistantReply) {
    return 'high';
  }

  if (messageCount >= 3) {
    return 'medium';
  }

  return 'low';
}

function deriveSessionFocus(session: ChatSession, latestUserText: string, latestAssistantText: string) {
  const base = toSentence(session.intent || latestUserText || latestAssistantText || session.title || 'Noch kein klarer Arbeitsfokus.');
  return truncate(base, 160);
}

function deriveSessionOpenLoops(session: ChatSession, latestUserText: string, latestAssistantText: string) {
  const fromMessages = deriveOpenLoops(latestUserText, latestAssistantText);
  if (fromMessages.length > 0) {
    return fromMessages;
  }

  const fallback = toSentence(session.intent || latestUserText || latestAssistantText);
  return fallback ? [truncate(fallback, 110)] : [];
}

function deriveWorkrunStatus(latestMessageText: string) {
  const normalized = latestMessageText.toLowerCase();
  if (
    normalized.includes('abgeschlossen') ||
    normalized.includes('erledigt') ||
    normalized.includes('fertig') ||
    normalized.includes('done')
  ) {
    return 'completed' as const;
  }

  return 'open' as const;
}

function deriveHandoffStatus(session: ChatSession, workrun: MayaActiveWorkrun | undefined) {
  if (session.handoff?.status) {
    return session.handoff.status;
  }

  if (workrun?.status === 'completed') {
    return 'completed' as const;
  }

  return 'active' as const;
}

function buildDerivedOpenItems(
  briefing: MayaContinuityBriefing | undefined,
  board: MayaActiveCheckpointBoard | undefined,
  workrun: MayaActiveWorkrun | undefined
) {
  const boardOpenItems = board?.checkpoints
    .filter((checkpoint) => checkpoint.status === 'open')
    .map((checkpoint) => checkpoint.label) || [];

  return dedupePoints([
    ...boardOpenItems,
    ...briefing?.openLoops || [],
    workrun?.status === 'completed' ? '' : workrun?.nextStep || ''
  ]).slice(0, MAX_OPEN_LOOPS);
}

function buildAchievedSummary(
  session: ChatSession,
  workrun: MayaActiveWorkrun | undefined,
  board: MayaActiveCheckpointBoard | undefined,
  briefing: MayaContinuityBriefing | undefined
) {
  const completedCheckpoints = board?.checkpoints
    .filter((checkpoint) => checkpoint.status === 'completed')
    .map((checkpoint) => checkpoint.label) || [];

  const baseSummary = session.handoff?.achieved || workrun?.lastOutput || briefing?.currentState || session.digest?.summary || '';
  if (completedCheckpoints.length === 0) {
    return truncate(toSentence(baseSummary), 220);
  }

  return truncate(toSentence(`${baseSummary} Erreicht: ${completedCheckpoints.join('; ')}`), 220);
}

function buildNextEntryPoint(
  session: ChatSession,
  workrun: MayaActiveWorkrun | undefined,
  briefing: MayaContinuityBriefing | undefined,
  openItems: string[]
) {
  return truncate(
    toSentence(
      session.handoff?.nextEntry ||
      workrun?.nextStep ||
      openItems[0] ||
      briefing?.nextStep ||
      session.intent ||
      session.title ||
      'Mit diesem Thread sinnvoll wieder einsteigen.'
    ),
    160
  );
}

function toWorkspaceId(seed: string) {
  const slug = toSentence(seed)
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return slug ? `workspace-${slug}` : `workspace-${Date.now()}`;
}

function deriveWorkspaceStatus(
  persisted: MayaWorkspaceContext | undefined,
  handoff: MayaActiveThreadHandoff | undefined,
  workrun: MayaActiveWorkrun | undefined
) {
  if (persisted?.status) {
    return persisted.status;
  }

  if (handoff?.status === 'paused') {
    return 'paused' as const;
  }

  if (handoff?.status === 'completed' || workrun?.status === 'completed') {
    return 'completed' as const;
  }

  return 'active' as const;
}

function buildWorkspaceOpenItems(
  persisted: MayaWorkspaceContext | undefined,
  handoff: MayaActiveThreadHandoff | undefined,
  board: MayaActiveCheckpointBoard | undefined,
  briefing: MayaContinuityBriefing | undefined
) {
  if (persisted?.openItems?.length) {
    return persisted.openItems.map((item) => truncate(toSentence(item), 110)).filter(Boolean).slice(0, MAX_OPEN_LOOPS);
  }

  return dedupePoints([
    ...(handoff?.openItems || []),
    ...((board?.checkpoints || []).filter((checkpoint) => checkpoint.status === 'open').map((checkpoint) => checkpoint.label)),
    ...(briefing?.openLoops || [])
  ]).slice(0, MAX_OPEN_LOOPS);
}

function buildWorkspaceTitle(
  session: ChatSession,
  persisted: MayaWorkspaceContext | undefined,
  briefing: MayaContinuityBriefing | undefined
) {
  return truncate(toSentence(persisted?.title || session.title || briefing?.title || session.intent || 'Arbeitsraum'), 80);
}

function buildWorkspaceFocus(
  session: ChatSession,
  persisted: MayaWorkspaceContext | undefined,
  briefing: MayaContinuityBriefing | undefined,
  workrun: MayaActiveWorkrun | undefined
) {
  return truncate(toSentence(persisted?.focus || workrun?.focus || briefing?.focus || session.intent || session.title || 'Aktiver Arbeitsraum'), 180);
}

function buildWorkspaceGoal(
  session: ChatSession,
  persisted: MayaWorkspaceContext | undefined,
  briefing: MayaContinuityBriefing | undefined,
  handoff: MayaActiveThreadHandoff | undefined
) {
  return truncate(
    toSentence(
      persisted?.goal ||
      briefing?.title ||
      session.intent ||
      handoff?.nextEntry ||
      session.title ||
      'Arbeitsziel klären'
    ),
    220
  );
}

function buildWorkspaceCurrentState(
  persisted: MayaWorkspaceContext | undefined,
  briefing: MayaContinuityBriefing | undefined,
  handoff: MayaActiveThreadHandoff | undefined,
  workrun: MayaActiveWorkrun | undefined
) {
  return truncate(
    toSentence(
      persisted?.currentState ||
      handoff?.achieved ||
      workrun?.lastOutput ||
      briefing?.currentState ||
      'Noch kein Gesamtstand hinterlegt.'
    ),
    220
  );
}

function buildWorkspaceNextMilestone(
  persisted: MayaWorkspaceContext | undefined,
  handoff: MayaActiveThreadHandoff | undefined,
  workrun: MayaActiveWorkrun | undefined,
  openItems: string[],
  briefing: MayaContinuityBriefing | undefined
) {
  return truncate(
    toSentence(
      persisted?.nextMilestone ||
      handoff?.nextEntry ||
      workrun?.nextStep ||
      openItems[0] ||
      briefing?.nextStep ||
      'Nächsten Arbeitsblock festlegen'
    ),
    180
  );
}

export function buildContinuityBriefing(session: ChatSession): MayaContinuityBriefing | undefined {
  if (session.messages.length === 0 && !session.digest) {
    return undefined;
  }

  if (session.digest) {
    return {
      title: session.digest.title || toSentence(session.title || 'Kontinuitäts-Briefing'),
      focus: session.digest.summary || toSentence(session.intent || session.title || 'Noch kein klarer Arbeitsfokus.'),
      currentState: session.digest.currentState,
      openLoops: session.digest.openLoops,
      nextStep: session.digest.nextEntry,
      lastUpdatedAt: session.digest.updatedAt,
      confidence: session.digest.confidence,
      source: 'digest'
    };
  }

  const latestUserMessage = getLastUserMessage(session.messages);
  const latestAssistantMessage = getLastAssistantMessage(session.messages);
  const latestUserText = latestUserMessage?.content || '';
  const latestAssistantText = latestAssistantMessage?.content || '';

  return {
    title: deriveTitle(session, latestUserText),
    focus: deriveSessionFocus(session, latestUserText, latestAssistantText),
    currentState: deriveCurrentState(latestAssistantText, latestUserText),
    openLoops: deriveSessionOpenLoops(session, latestUserText, latestAssistantText),
    nextStep: deriveNextEntry(latestAssistantText, latestUserText),
    lastUpdatedAt: session.updatedAt || latestAssistantMessage?.timestamp || latestUserMessage?.timestamp || null,
    confidence: 'pending',
    source: 'session'
  };
}

export function buildResumeActions(briefing: MayaContinuityBriefing | undefined): MayaResumeAction[] {
  if (!briefing) {
    return [];
  }

  const actions: MayaResumeAction[] = [];

  const nextStep = toSentence(briefing.nextStep);
  if (nextStep) {
    actions.push({
      id: 'resume-next-step',
      label: 'Nächsten Schritt übernehmen',
      prompt: `Lass uns direkt damit weitermachen: ${nextStep}`,
      source: 'next_step',
      emphasis: 'primary'
    });
  }

  const firstOpenLoop = briefing.openLoops.map((loop) => toSentence(loop)).find(Boolean);
  if (firstOpenLoop) {
    actions.push({
      id: 'resume-open-loop-1',
      label: 'Offenen Punkt weiterführen',
      prompt: `Lass uns diesen offenen Punkt jetzt weiterführen: ${firstOpenLoop}`,
      source: 'open_loop',
      emphasis: 'secondary'
    });
  }

  const resumeFocus = toSentence(briefing.focus || briefing.currentState);
  if (resumeFocus) {
    actions.push({
      id: 'resume-thread',
      label: 'Thread sinnvoll fortsetzen',
      prompt: `Fasse kurz zusammen, wo wir gerade stehen, und führe dann diesen Thread weiter: ${resumeFocus}`,
      source: 'resume',
      emphasis: 'secondary'
    });
  }

  return actions;
}

export function buildActiveWorkrun(
  session: ChatSession,
  briefing: MayaContinuityBriefing | undefined,
  resumeActions: MayaResumeAction[]
): MayaActiveWorkrun | undefined {
  if (session.messages.length === 0 && !briefing) {
    return undefined;
  }

  const latestUserMessage = getLastUserMessage(session.messages);
  const latestAssistantMessage = getLastAssistantMessage(session.messages);
  const latestMessage = getLastMessage(session.messages);
  const persistedWorkrun = session.workrun;
  const focus = toSentence(
    persistedWorkrun?.focus ||
      briefing?.focus ||
      latestUserMessage?.content ||
      session.intent ||
      session.title ||
      'Noch kein aktiver Arbeitsfokus.'
  );
  const nextStep = toSentence(
    persistedWorkrun?.nextStep ||
      briefing?.nextStep ||
      resumeActions[0]?.prompt ||
      latestUserMessage?.content ||
      'Mit dem aktuellen Thread weiterarbeiten.'
  );
  const lastOutput = persistedWorkrun?.lastOutput || (latestAssistantMessage?.content ? truncate(toSentence(latestAssistantMessage.content), 220) : null);
  const lastStep = persistedWorkrun?.lastStep || (latestUserMessage?.content ? truncate(toSentence(latestUserMessage.content), 180) : null);
  const statusSource = toSentence(latestMessage?.content || briefing?.currentState || persistedWorkrun?.focus || '');

  return {
    focus: truncate(focus, 180),
    status: persistedWorkrun?.status || deriveWorkrunStatus(statusSource),
    lastOutput,
    lastStep,
    nextStep: truncate(nextStep, 160),
    updatedAt: persistedWorkrun?.updatedAt || latestMessage?.timestamp || briefing?.lastUpdatedAt || session.updatedAt || null,
    source: persistedWorkrun?.source || 'derived'
  };
}

export function buildPersistedWorkrun(
  session: ChatSession,
  currentWorkrun: MayaActiveWorkrun | undefined,
  update: Partial<Pick<MayaWorkrun, 'focus' | 'status' | 'lastOutput' | 'lastStep' | 'nextStep' | 'source'>>
): MayaWorkrun | undefined {
  if (!currentWorkrun && !update.focus && !update.nextStep) {
    return undefined;
  }

  const baseFocus = toSentence(update.focus || currentWorkrun?.focus || session.intent || session.title || '');
  const baseNextStep = toSentence(update.nextStep || currentWorkrun?.nextStep || update.focus || baseFocus);

  if (!baseFocus && !baseNextStep) {
    return undefined;
  }

  return {
    focus: truncate(baseFocus || baseNextStep, 180),
    status: update.status || currentWorkrun?.status || 'open',
    lastOutput: update.lastOutput !== undefined ? update.lastOutput : currentWorkrun?.lastOutput || null,
    lastStep: update.lastStep !== undefined ? update.lastStep : currentWorkrun?.lastStep || null,
    nextStep: truncate(baseNextStep || baseFocus, 160),
    updatedAt: new Date().toISOString(),
    source: update.source || currentWorkrun?.source || 'manual'
  };
}

export function buildActiveCheckpointBoard(
  session: ChatSession,
  briefing: MayaContinuityBriefing | undefined,
  resumeActions: MayaResumeAction[],
  workrun: MayaActiveWorkrun | undefined
): MayaActiveCheckpointBoard | undefined {
  const persistedBoard = session.checkpointBoard;
  const checkpoints = persistedBoard?.checkpoints?.length
    ? persistedBoard.checkpoints.map((checkpoint) => ({ ...checkpoint }))
    : buildDerivedCheckpointList(session, briefing, resumeActions, workrun);

  if (checkpoints.length === 0 && !workrun && !briefing) {
    return undefined;
  }

  const completedCount = checkpoints.filter((checkpoint) => checkpoint.status === 'completed').length;
  const openCount = checkpoints.length - completedCount;
  const progressPercent = checkpoints.length === 0 ? 0 : Math.round((completedCount / checkpoints.length) * 100);

  return {
    title: persistedBoard?.title || 'Arbeitsboard',
    focus: persistedBoard?.focus || workrun?.focus || briefing?.focus || session.intent || session.title || 'Aktueller Thread',
    checkpoints,
    updatedAt: persistedBoard?.updatedAt || workrun?.updatedAt || briefing?.lastUpdatedAt || session.updatedAt || null,
    source: persistedBoard?.source || 'derived',
    completedCount,
    openCount,
    progressPercent
  };
}

export function buildPersistedCheckpointBoard(
  session: ChatSession,
  currentBoard: MayaActiveCheckpointBoard | undefined,
  update: Partial<Pick<MayaCheckpointBoard, 'title' | 'focus' | 'source'>> & { checkpoints?: MayaCheckpoint[] }
): MayaCheckpointBoard | undefined {
  const checkpoints: MayaCheckpoint[] = (update.checkpoints || currentBoard?.checkpoints || [])
    .map((checkpoint, index): MayaCheckpoint => ({
      id: checkpoint.id || toCheckpointId(checkpoint.label, index),
      label: truncate(toSentence(checkpoint.label || checkpoint.detail || `Checkpoint ${index + 1}`), 120),
      detail: checkpoint.detail ? truncate(toSentence(checkpoint.detail), 180) : null,
      status: checkpoint.status === 'completed' ? 'completed' : 'open',
      source: checkpoint.source === 'manual' ? 'manual' : 'derived',
      updatedAt: checkpoint.updatedAt || new Date().toISOString()
    }))
    .filter((checkpoint) => checkpoint.label);

  const focus = toSentence(update.focus || currentBoard?.focus || session.workrun?.focus || session.intent || session.title || '');
  const title = toSentence(update.title || currentBoard?.title || 'Arbeitsboard');

  if (!focus && checkpoints.length === 0) {
    return undefined;
  }

  return {
    title: title || 'Arbeitsboard',
    focus: truncate(focus || title, 180),
    checkpoints: checkpoints.slice(0, MAX_BOARD_CHECKPOINTS),
    updatedAt: new Date().toISOString(),
    source: update.source || currentBoard?.source || 'manual'
  };
}

export function buildActiveThreadHandoff(
  session: ChatSession,
  briefing: MayaContinuityBriefing | undefined,
  workrun: MayaActiveWorkrun | undefined,
  board: MayaActiveCheckpointBoard | undefined
): MayaActiveThreadHandoff | undefined {
  const persistedHandoff = session.handoff;
  const openItems = persistedHandoff?.openItems?.length
    ? persistedHandoff.openItems.map((item) => truncate(toSentence(item), 110)).filter(Boolean)
    : buildDerivedOpenItems(briefing, board, workrun);
  const achieved = truncate(toSentence(persistedHandoff?.achieved || buildAchievedSummary(session, workrun, board, briefing)), 220);
  const nextEntry = buildNextEntryPoint(session, workrun, briefing, openItems);
  const status = deriveHandoffStatus(session, workrun);

  if (!achieved && openItems.length === 0 && !nextEntry) {
    return undefined;
  }

  return {
    status,
    achieved,
    openItems,
    nextEntry,
    updatedAt: persistedHandoff?.updatedAt || workrun?.updatedAt || board?.updatedAt || briefing?.lastUpdatedAt || session.updatedAt || null,
    source: persistedHandoff?.source || 'derived'
  };
}

export function buildPersistedThreadHandoff(
  session: ChatSession,
  currentHandoff: MayaActiveThreadHandoff | undefined,
  update: Partial<Pick<MayaThreadHandoff, 'status' | 'achieved' | 'nextEntry' | 'source'>> & { openItems?: string[] }
): MayaThreadHandoff | undefined {
  const achieved = truncate(toSentence(update.achieved || currentHandoff?.achieved || ''), 220);
  const openItems = dedupePoints((update.openItems || currentHandoff?.openItems || []).map((item) => truncate(toSentence(item), 110))).slice(0, MAX_OPEN_LOOPS);
  const nextEntry = truncate(toSentence(update.nextEntry || currentHandoff?.nextEntry || session.workrun?.nextStep || session.intent || session.title || ''), 160);

  if (!achieved && openItems.length === 0 && !nextEntry) {
    return undefined;
  }

  return {
    status: update.status || currentHandoff?.status || 'active',
    achieved,
    openItems,
    nextEntry,
    updatedAt: new Date().toISOString(),
    source: update.source || currentHandoff?.source || 'manual'
  };
}

export function buildDerivedWorkspaceContext(
  session: ChatSession,
  workspace: MayaWorkspaceContext | undefined,
  briefing: MayaContinuityBriefing | undefined,
  workrun: MayaActiveWorkrun | undefined,
  board: MayaActiveCheckpointBoard | undefined,
  handoff: MayaActiveThreadHandoff | undefined
): MayaActiveWorkspaceContext | undefined {
  const title = buildWorkspaceTitle(session, workspace, briefing);
  const focus = buildWorkspaceFocus(session, workspace, briefing, workrun);
  const goal = buildWorkspaceGoal(session, workspace, briefing, handoff);
  const currentState = buildWorkspaceCurrentState(workspace, briefing, handoff, workrun);
  const openItems = buildWorkspaceOpenItems(workspace, handoff, board, briefing);
  const nextMilestone = buildWorkspaceNextMilestone(workspace, handoff, workrun, openItems, briefing);
  const threadIds = dedupePoints([...(workspace?.threadIds || []), session.id]).slice(0, MAX_WORKSPACE_THREADS);

  if (!title && !focus && !goal && !currentState && openItems.length === 0 && !nextMilestone) {
    return undefined;
  }

  return {
    id: workspace?.id || session.workspaceId || toWorkspaceId(title || focus || goal || session.id),
    title,
    focus,
    goal,
    currentState,
    openItems,
    nextMilestone,
    threadIds,
    updatedAt: workspace?.updatedAt || handoff?.updatedAt || workrun?.updatedAt || briefing?.lastUpdatedAt || session.updatedAt || null,
    source: workspace?.source || 'derived',
    status: deriveWorkspaceStatus(workspace, handoff, workrun)
  };
}

export function buildPersistedWorkspaceContext(
  session: ChatSession,
  currentWorkspace: MayaActiveWorkspaceContext | undefined,
  update: Partial<Pick<MayaWorkspaceContext, 'id' | 'title' | 'focus' | 'goal' | 'currentState' | 'nextMilestone' | 'source' | 'status'>> & { openItems?: string[]; threadIds?: string[] }
): MayaWorkspaceContext | undefined {
  const title = truncate(toSentence(update.title || currentWorkspace?.title || session.title || session.intent || ''), 80);
  const focus = truncate(toSentence(update.focus || currentWorkspace?.focus || session.intent || title || ''), 180);
  const goal = truncate(toSentence(update.goal || currentWorkspace?.goal || focus || title || ''), 220);
  const currentState = truncate(toSentence(update.currentState || currentWorkspace?.currentState || ''), 220);
  const openItems = dedupePoints((update.openItems || currentWorkspace?.openItems || []).map((item) => truncate(toSentence(item), 110))).slice(0, MAX_OPEN_LOOPS);
  const nextMilestone = truncate(toSentence(update.nextMilestone || currentWorkspace?.nextMilestone || openItems[0] || focus || title || ''), 180);
  const threadIds = dedupePoints([...(update.threadIds || currentWorkspace?.threadIds || []), session.id]).slice(0, MAX_WORKSPACE_THREADS);

  if (!title && !focus && !goal && !currentState && openItems.length === 0 && !nextMilestone) {
    return undefined;
  }

  return {
    id: update.id || currentWorkspace?.id || session.workspaceId || toWorkspaceId(title || focus || goal || session.id),
    title: title || 'Arbeitsraum',
    focus: focus || title || 'Aktiver Arbeitsraum',
    goal: goal || focus || title || 'Arbeitsziel klären',
    currentState: currentState || focus || title || 'Noch kein Gesamtstand hinterlegt.',
    openItems,
    nextMilestone: nextMilestone || openItems[0] || focus || title || 'Nächsten Arbeitsblock festlegen',
    threadIds,
    updatedAt: new Date().toISOString(),
    source: update.source || currentWorkspace?.source || 'manual',
    status: update.status || currentWorkspace?.status || 'active'
  };
}

export function shouldRefreshThreadDigest(session: ChatSession) {
  if (!session.digest) {
    return session.messages.length > 0;
  }

  return session.messages.length - session.digest.sourceMessageCount >= DIGEST_STALE_MESSAGE_THRESHOLD;
}

export function buildThreadDigest(session: ChatSession): ThreadDigest | undefined {
  if (session.messages.length === 0) {
    return undefined;
  }

  const latestUserMessage = getLastUserMessage(session.messages);
  const latestAssistantMessage = getLastAssistantMessage(session.messages);
  const latestUserText = latestUserMessage?.content || '';
  const latestAssistantText = latestAssistantMessage?.content || '';
  const messageCount = session.messages.length;

  return {
    threadId: session.id,
    title: deriveTitle(session, latestUserText),
    summary: deriveSummary(session, latestUserText, latestAssistantText),
    currentState: deriveCurrentState(latestAssistantText, latestUserText),
    openLoops: deriveOpenLoops(latestUserText, latestAssistantText),
    nextEntry: deriveNextEntry(latestAssistantText, latestUserText),
    confidence: deriveConfidence(messageCount, Boolean(latestAssistantText)),
    updatedAt: new Date().toISOString(),
    sourceMessageCount: messageCount,
    needsRefresh: false
  };
}
