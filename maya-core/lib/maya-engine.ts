import { getLocale } from '@/lib/i18n';
import { AppLanguage, ChatApiResponse, ChatMessage, MemoryItem, Profile, Project } from '@/lib/types';

type BuildChatResponseInput = {
  message: string;
  sessionId: string;
  language?: AppLanguage;
  projects: Project[];
  memoryItems: MemoryItem[];
  activeProjectId?: string | null;
};

function tokenize(text: string) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function scoreProject(project: Project, tokens: string[]) {
  const haystack = [
    project.title,
    project.summary,
    project.desiredOutcome,
    project.nextMove,
    project.risk,
    project.projectQuestion,
    project.tags.join(' ')
  ].join(' ').toLowerCase();

  return tokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
}

function scoreMemory(item: MemoryItem, tokens: string[]) {
  const haystack = [item.title, item.summary, item.whyItMatters, item.tags.join(' ')].join(' ').toLowerCase();
  return tokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
}

function pickRelevantProjects(message: string, projects: Project[], activeProjectId?: string | null) {
  const tokens = tokenize(message);
  const scored = projects
    .map((project) => ({
      project,
      score: scoreProject(project, tokens) + (project.id === activeProjectId ? 3 : 0)
    }))
    .sort((a, b) => b.score - a.score || a.project.title.localeCompare(b.project.title));

  const positives = scored.filter((item) => item.score > 0).map((item) => item.project);
  return (positives.length > 0 ? positives : projects.slice(0, 2)).slice(0, 2);
}

function pickRelevantMemory(message: string, relevantProjects: Project[], memory: MemoryItem[]) {
  const tokens = tokenize(message);
  const scored = memory
    .map((item) => {
      const projectOverlap = item.projectIds.some((projectId) => relevantProjects.some((project) => project.id === projectId)) ? 1 : 0;
      return {
        item,
        score: scoreMemory(item, tokens) + projectOverlap + (item.pinned ? 1 : 0)
      };
    })
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title));

  const positives = scored.filter((item) => item.score > 0).map((item) => item.item);
  return (positives.length > 0 ? positives : memory.slice(0, 2)).slice(0, 2);
}

function buildReply(message: string, relevantProjects: Project[], relevantMemory: MemoryItem[], language: AppLanguage) {
  const leadProject = relevantProjects[0];
  const leadMemory = relevantMemory[0];
  const normalized = message.trim();

  if (!leadProject && !leadMemory) {
    if (language === 'de') {
      return normalized.length < 12
        ? 'Ich bin bereit. Gib mir etwas mehr Konkretion, dann halte ich den nächsten sinnvollen Schritt fest.'
        : 'Ich sehe noch keinen belastbaren Projekt- oder Memory-Kontext im Store. Wenn du magst, ergänze zuerst ein Projekt oder einen Memory-Anker und ich arbeite dann darauf aufbauend weiter.';
    }

    return normalized.length < 12
      ? 'I am ready. Give me a little more specificity and I will help hold the next useful move in view.'
      : 'I do not yet have enough project or memory context in the store. If you want, add a project or a memory anchor first and I will build on that.';
  }

  if (!leadProject) {
    if (language === 'de') {
      return [
        'Ich habe gerade keinen starken Projektanker, aber ich kann auf deinem kuratierten Memory aufsetzen.',
        `Kontext im Vordergrund: ${leadMemory.summary}`,
        'Wenn du magst, setze als Nächstes ein Fokusprojekt, damit ich Antworten noch klarer ausrichten kann.'
      ].join('\n\n');
    }

    return [
      'I do not have a strong project anchor right now, but I can still work from your curated memory.',
      `Context in front: ${leadMemory.summary}`,
      'If you want, set a focused project next so I can bias future replies more clearly.'
    ].join('\n\n');
  }

  if (!leadMemory) {
    if (language === 'de') {
      return normalized.length < 12
        ? `Im Moment ist ${leadProject.title} der stärkste aktive Kontext. Sag mir noch etwas klarer, worauf ich den nächsten Schritt zuspitzen soll.`
        : [
            `Meine Lesart: Deine Frage zeigt derzeit vor allem auf ${leadProject.title}. ${leadProject.summary}`,
            `Bester nächster Schritt: ${leadProject.nextMove}`,
            'Wenn du mehr Kontexttiefe willst, pflege als Nächstes ein oder zwei kuratierte Memory-Anker.'
          ].join('\n\n');
    }

    return normalized.length < 12
      ? `Right now ${leadProject.title} is the strongest active context. Give me one more detail and I will tighten the next move.`
      : [
          `My read: your question points most strongly at ${leadProject.title}. ${leadProject.summary}`,
          `Best next move: ${leadProject.nextMove}`,
          'If you want more context depth, add one or two curated memory anchors next.'
        ].join('\n\n');
  }

  if (language === 'de') {
    if (normalized.length < 12) {
      return [
        'Hier ist die kürzeste nützliche Lesart: Ich brauche noch etwas mehr Konkretion, um dir wirklich gut zu helfen.',
        `Im Moment ist ${leadProject.title} der stärkste aktive Kontext.`,
        `Der wichtigste Rahmen im Blick ist: ${leadMemory.summary}`,
        'Frag mich zum Beispiel nach einem klareren nächsten Schritt, einer engeren Einschätzung oder einer kurzen Synthese.'
      ].join('\n\n');
    }

    return [
      `Meine Lesart: Deine Frage zeigt im Moment am stärksten auf ${leadProject.title}. ${leadProject.summary}`,
      `Kontext, den wir halten sollten: ${leadMemory.summary} ${leadMemory.whyItMatters}`,
      `Bester nächster Schritt: ${leadProject.nextMove}`,
      'Rückfrage: Wenn wir nur eine Sache als Nächstes optimieren, soll ich eher auf Tempo, Klarheit oder Scope-Kontrolle gewichten?'
    ].join('\n\n');
  }

  if (normalized.length < 12) {
    return [
      'Here is the shortest useful read: I need a little more specificity to be genuinely helpful.',
      `Right now the strongest active context is ${leadProject.title}.`,
      `The key constraint still in view is: ${leadMemory.summary}`,
      `Try asking for one of these: a tighter next move, a clearer project read, or a short synthesis.`
    ].join('\n\n');
  }

  return [
    `My read: your question points most strongly at ${leadProject.title}. ${leadProject.summary}`,
    `Context to hold: ${leadMemory.summary} ${leadMemory.whyItMatters}`,
    `Best next move: ${leadProject.nextMove}`,
    `Question back: if we optimize only one thing next, should I bias for speed, clarity, or scope control?`
  ].join('\n\n');
}

export function buildMayaChatResponse({ message, sessionId, language = 'de', projects, memoryItems, activeProjectId }: BuildChatResponseInput): Omit<ChatApiResponse, 'state' | 'session'> {
  const relevantProjects = pickRelevantProjects(message, projects, activeProjectId);
  const relevantMemory = pickRelevantMemory(message, relevantProjects, memoryItems);
  const nextActiveProjectId = relevantProjects[0]?.id || activeProjectId || null;

  const responseMessage: ChatMessage = {
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    content: buildReply(message, relevantProjects, relevantMemory, language),
    timestamp: new Intl.DateTimeFormat(getLocale(language), {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date()),
    relatedProjectIds: relevantProjects.map((project) => project.id),
    relatedMemoryIds: relevantMemory.map((item) => item.id)
  };

  return {
    message: responseMessage,
    sessionId: sessionId || 'session-main',
    relevantProjectIds: responseMessage.relatedProjectIds || [],
    relevantMemoryIds: responseMessage.relatedMemoryIds || [],
    activeProjectId: nextActiveProjectId
  };
}

export function buildWelcomeLine(profile: Profile, language: AppLanguage = 'de') {
  const displayName = profile.displayName || (language === 'de' ? 'Du' : 'You');

  if (language === 'de') {
    return `${displayName} nutzt Maya als persönliche Assistenz mit sichtbarem Kontext und kleinem kuratiertem Memory.`;
  }

  return `${displayName} is using Maya as a personal assistant with visible context and a small curated memory.`;
}
