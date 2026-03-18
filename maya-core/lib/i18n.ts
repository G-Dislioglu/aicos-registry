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
      homeHint: 'Einstieg',
      chat: 'Chat',
      chatHint: 'Älterer Pfad',
      maya: 'Maya',
      mayaHint: 'Hauptfläche',
      context: 'Kontext',
      contextHint: 'Begleitend'
    },
    home: {
      eyebrow: 'Start',
      title: 'Starte direkt in Maya',
      subtitle: 'Maya ist die persönliche Hauptfläche dieser App. Der ältere Chat-Pfad und der Kontextbereich bleiben als begleitende Flächen erreichbar.',
      posture: 'Assistenzhaltung',
      primaryWorkspace: 'Direkter Einstieg',
      primaryWorkspaceTitle: 'Öffne Maya als persönliche Hauptfläche',
      primaryWorkspaceBody: 'Nutze Maya für Rolle, Provider, Modell, Briefing und Review in einer zusammenhängenden persönlichen Oberfläche.',
      openMaya: 'Maya öffnen',
      classicChat: 'Älterer Chat-Pfad',
      classicChatBody: 'Der ältere Chat bleibt erreichbar, ist hier aber bewusst nicht der empfohlene Einstieg.',
      contextPath: 'Unterstützender Kontextbereich',
      contextPathBody: 'Öffne Kontext und Memory als unterstützende Ebene neben Maya.',
      memoryAnchors: 'Memory-Anker',
      activeProjects: 'Aktive Projekte',
      activeProjectsTitle: 'Was Maya warm halten soll',
      openContext: 'Kontext öffnen',
      nextMove: 'Nächster Schritt',
      risk: 'Risiko',
      session: 'Session',
      sessionTitle: 'Starte aus deiner aktuellen Gesprächslage',
      continueChat: 'Zum älteren Chat'
    },
    chat: {
      eyebrow: 'Älterer Chat',
      title: 'Älterer Chat-Pfad',
      subtitle: 'Dieser Chat bleibt nutzbar, ist aber nicht die primäre Maya-Fläche.',
      primaryWorkspace: 'Direkter Einstieg',
      primaryWorkspaceBody: 'Wechsle nach Maya für Rolle, Provider, Modell, Briefing und Review in einer zusammenhängenden persönlichen Oberfläche.',
      openMaya: 'Zu Maya',
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
      userLabel: 'Du',
      banner: 'Nutze Maya als direkte persönliche Fläche für Rolle, Provider, Modell, Briefing und Review in einer zusammenhängenden Oberfläche.'
    },
    context: {
      eyebrow: 'Kontext',
      title: 'Unterstützender Kontextbereich',
      subtitle: 'Profil, aktive Projekte und kuratiertes Memory bleiben hier einsehbar. Der eigentliche Maya-Fluss liegt weiter in Maya.',
      primaryWorkspace: 'Direkter Einstieg',
      primaryWorkspaceBody: 'Nutze Maya für den eigentlichen Gesprächs- und Review-Fluss. Kontext bleibt die begleitende Ebene für Profil, Projekte und Memory.',
      openMaya: 'Zu Maya',
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
      homeHint: 'Entry',
      chat: 'Chat',
      chatHint: 'Legacy',
      maya: 'Maya',
      mayaHint: 'Primary',
      context: 'Context',
      contextHint: 'Support'
    },
    home: {
      eyebrow: 'Home',
      title: 'Start directly in Maya',
      subtitle: 'Maya is the personal primary surface of this app. The older chat path and the context area remain available as supporting surfaces.',
      posture: 'Assistant posture',
      primaryWorkspace: 'Direct entry',
      primaryWorkspaceTitle: 'Open Maya as your personal primary surface',
      primaryWorkspaceBody: 'Use Maya for role, provider, model, briefing, and review in one coherent personal surface.',
      openMaya: 'Open Maya',
      classicChat: 'Older chat path',
      classicChatBody: 'The older chat remains available, but it is deliberately not framed here as the recommended entry.',
      contextPath: 'Supporting context area',
      contextPathBody: 'Open context and memory as a supporting layer alongside Maya.',
      memoryAnchors: 'Memory anchors',
      activeProjects: 'Active projects',
      activeProjectsTitle: 'What Maya should keep warm',
      openContext: 'Open context',
      nextMove: 'Next move',
      risk: 'Risk',
      session: 'Session',
      sessionTitle: 'Start from your current conversation posture',
      continueChat: 'Go to older chat',
    },
    chat: {
      eyebrow: 'Older chat',
      title: 'Older chat path',
      subtitle: 'This chat remains available, but it is not the primary Maya surface.',
      primaryWorkspace: 'Direct entry',
      primaryWorkspaceBody: 'Move into Maya for role, provider, model, briefing, and review in one coherent personal surface.',
      openMaya: 'Go to Maya',
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
      userLabel: 'You',
      banner: 'Use Maya as the direct personal surface for role, provider, model, briefing, and review in one coherent surface.'
    },
    context: {
      eyebrow: 'Context',
      title: 'Supporting context area',
      subtitle: 'Profile, active projects, and curated memory stay visible here. The main Maya flow remains in Maya.',
      primaryWorkspace: 'Direct entry',
      primaryWorkspaceBody: 'Use Maya for the main conversation and review flow. Context remains the supporting layer for profile, projects, and memory.',
      openMaya: 'Go to Maya',
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
