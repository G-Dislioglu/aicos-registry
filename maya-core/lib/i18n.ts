import { AppLanguage, MemoryItem, Project } from '@/lib/types';

const ui = {
  de: {
    appName: 'Maya',
    metadataDescription: 'Persönliche Assistenz für textbasiertes Denken mit sichtbarem Kontext.',
    manifestDescription: 'Eine persönliche PWA für textbasiertes Denken mit sichtbarem Kontext.',
    brandTitle: 'Persönliche Assistenz',
    brandBody: 'Textbasiert, persönlich und mit sichtbarem Kontext.',
    profileLabel: 'Profil',
    languageLabel: 'Sprache',
    nav: {
      home: 'Start',
      homeHint: 'Fokus',
      chat: 'Chat',
      chatHint: 'Denken',
      context: 'Kontext',
      contextHint: 'Memory'
    },
    home: {
      eyebrow: 'Start',
      title: 'Eine persönliche Assistenz statt eines generischen Chatbots',
      subtitle: 'Maya hält deine Haltung, aktive Projekte und kuratiertes Memory sichtbar, damit du schneller in klares Denken zurückkommst.',
      posture: 'Assistenzhaltung',
      memoryAnchors: 'Memory-Anker',
      activeProjects: 'Aktive Projekte',
      activeProjectsTitle: 'Was Maya warm halten soll',
      openContext: 'Vollen Kontext öffnen',
      nextMove: 'Nächster Schritt',
      risk: 'Risiko',
      session: 'Session',
      sessionTitle: 'Starte aus deiner aktuellen Gesprächslage',
      continueChat: 'Im Chat weitermachen'
    },
    chat: {
      eyebrow: 'Chat',
      title: 'Mit Maya im sichtbaren Kontext denken',
      subtitle: 'Maya antwortet aus einer kleinen persönlichen Ebene: Profil, aktive Projekte und kuratiertes Memory bleiben beim Denken sichtbar.',
      session: 'Session',
      projectContext: 'Aktiver Projektkontext',
      memoryContext: 'Aktives Memory',
      composer: 'Eingabe',
      placeholder: 'Bitte um eine Synthese, einen nächsten Schritt oder eine klarere Einordnung dessen, was jetzt wichtig ist.',
      helper: 'Keine versteckten Tools. Keine Gerätesteuerung. Nur ein sichtbarer persönlicher Denkraum.',
      send: 'An Maya senden',
      thinking: 'Maya denkt…',
      error: 'Die lokale Maya-Antwort ist fehlgeschlagen. Versuche es gleich noch einmal.',
      defaultDraft: 'Hilf mir, aus dem aktuellen Druck einen klaren nächsten Schritt für Maya zu machen.',
      userLabel: 'Du'
    },
    context: {
      eyebrow: 'Kontext',
      title: 'Mach die persönliche Ebene explizit',
      subtitle: 'Profil, aktive Projekte und kuratiertes Memory bleiben einsehbar, damit Maya in deinem echten Arbeitskontext verankert bleibt.',
      profile: 'Profil',
      timezone: 'Zeitzone',
      location: 'Ort',
      currentFocus: 'Aktueller Fokus',
      projects: 'Projekte',
      desiredOutcome: 'Gewünschtes Ergebnis',
      nextMove: 'Nächster Schritt',
      projectQuestion: 'Leitfrage',
      curatedMemory: 'Kuratiertes Memory'
    }
  },
  en: {
    appName: 'Maya',
    metadataDescription: 'Personal assistant for text-based thinking with visible context.',
    manifestDescription: 'A personal PWA for text-based thinking with visible context.',
    brandTitle: 'Personal assistant',
    brandBody: 'Text-based, personal, and grounded in visible context.',
    profileLabel: 'Profile',
    languageLabel: 'Language',
    nav: {
      home: 'Home',
      homeHint: 'Focus',
      chat: 'Chat',
      chatHint: 'Think',
      context: 'Context',
      contextHint: 'Memory'
    },
    home: {
      eyebrow: 'Home',
      title: 'A personal assistant instead of a generic chatbot',
      subtitle: 'Maya keeps your posture, active projects, and curated memory visible so you can get back to clear thinking faster.',
      posture: 'Assistant posture',
      memoryAnchors: 'Memory anchors',
      activeProjects: 'Active projects',
      activeProjectsTitle: 'What Maya should keep warm',
      openContext: 'Open full context',
      nextMove: 'Next move',
      risk: 'Risk',
      session: 'Session',
      sessionTitle: 'Start from your current conversation posture',
      continueChat: 'Continue in chat',
    },
    chat: {
      eyebrow: 'Chat',
      title: 'Think with Maya in visible context',
      subtitle: 'Maya responds from a small personal layer: profile, active projects, and curated memory stay visible while the conversation moves forward.',
      session: 'Session',
      projectContext: 'Active project context',
      memoryContext: 'Active memory',
      composer: 'Composer',
      placeholder: 'Ask for a synthesis, a next move, or a clearer read of what matters now.',
      helper: 'No hidden tools. No device control. Just a visible personal thinking space.',
      send: 'Send to Maya',
      thinking: 'Maya is thinking…',
      error: 'The local Maya reply loop failed. Please try again in a moment.',
      defaultDraft: 'Help me turn the current pressure into a clear next move for Maya.',
      userLabel: 'You'
    },
    context: {
      eyebrow: 'Context',
      title: 'Make the personal layer explicit',
      subtitle: 'Profile, active projects, and curated memory stay inspectable so Maya remains grounded in your real working context.',
      profile: 'Profile',
      timezone: 'Timezone',
      location: 'Location',
      currentFocus: 'Current focus',
      projects: 'Projects',
      desiredOutcome: 'Desired outcome',
      nextMove: 'Next move',
      projectQuestion: 'Project question',
      curatedMemory: 'Curated memory'
    }
  }
} as const;

const stageLabels: Record<AppLanguage, Record<Project['stage'], string>> = {
  de: {
    active: 'aktiv',
    watch: 'beobachten',
    incubating: 'im Aufbau'
  },
  en: {
    active: 'active',
    watch: 'watch',
    incubating: 'incubating'
  }
};

const priorityLabels: Record<AppLanguage, Record<Project['priority'], string>> = {
  de: {
    high: 'hoch',
    medium: 'mittel',
    low: 'niedrig'
  },
  en: {
    high: 'high',
    medium: 'medium',
    low: 'low'
  }
};

const memoryKindLabels: Record<AppLanguage, Record<MemoryItem['kind'], string>> = {
  de: {
    preference: 'Präferenz',
    project: 'Projekt',
    constraint: 'Rahmen',
    insight: 'Einsicht'
  },
  en: {
    preference: 'preference',
    project: 'project',
    constraint: 'constraint',
    insight: 'insight'
  }
};

export function isLanguage(value: string): value is AppLanguage {
  return value === 'de' || value === 'en';
}

export function getUiText(language: AppLanguage) {
  return ui[language] || ui.de;
}

export function getLocale(language: AppLanguage) {
  return language === 'de' ? 'de-DE' : 'en-US';
}

export function getStageLabel(stage: Project['stage'], language: AppLanguage) {
  return stageLabels[language][stage];
}

export function getPriorityLabel(priority: Project['priority'], language: AppLanguage) {
  return priorityLabels[language][priority];
}

export function getMemoryKindLabel(kind: MemoryItem['kind'], language: AppLanguage) {
  return memoryKindLabels[language][kind];
}
