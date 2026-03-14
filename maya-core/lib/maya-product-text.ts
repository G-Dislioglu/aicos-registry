import { AppLanguage, MemoryItem, Project } from '@/lib/types';

const productText = {
  de: {
    common: {
      loading: 'Maya lädt…',
      retry: 'Erneut laden',
      save: 'Speichern',
      cancel: 'Abbrechen',
      edit: 'Bearbeiten',
      delete: 'Löschen',
      create: 'Anlegen',
      active: 'Aktiv',
      none: 'Noch nichts vorhanden',
      focus: 'Fokus',
      add: 'Hinzufügen'
    },
    shell: {
      activeProject: 'Aktives Projekt',
      noActiveProject: 'Noch kein Projekt aktiv fokussiert.',
      loadingProfile: 'Persönlicher Layer wird geladen.'
    },
    home: {
      activeFocusTitle: 'Aktiver Arbeitsfokus',
      activeFocusBody: 'Ein fokussiertes Projekt bleibt im Chat und in der Kontextebene vorne sichtbar.',
      setFocus: 'Als Fokus setzen',
      clearFocus: 'Fokus lösen',
      recentSessions: 'Letzte Sessions',
      continueSession: 'Session fortsetzen',
      emptySessions: 'Noch keine weiteren Sessions gespeichert.',
      latestMessage: 'Letzter Stand'
    },
    chat: {
      sessionHistory: 'Session-Verlauf',
      createSession: 'Neue Session',
      newSessionTitle: 'Neuer Session-Titel',
      newSessionIntent: 'Intention',
      currentSession: 'Aktuelle Session',
      selectSession: 'Öffnen',
      emptySession: 'Diese Session ist noch leer. Starte mit einem ersten Gedanken.',
      activeProject: 'Aktives Fokusprojekt',
      noActiveProject: 'Kein Fokusprojekt gesetzt',
      pinProject: 'Als Fokus setzen',
      clearFocus: 'Fokus lösen'
    },
    context: {
      manageProfile: 'Profil bearbeiten',
      displayName: 'Name',
      addressing: 'Anrede',
      role: 'Rolle / Kurzbeschreibung',
      mission: 'Arbeitsbeschreibung',
      assistantContract: 'Grundhaltung / Präferenzen',
      communicationStyle: 'Arbeitsstil',
      currentFocus: 'Aktueller Fokus',
      timezone: 'Zeitzone',
      location: 'Ort',
      manageProjects: 'Projekte pflegen',
      createProject: 'Projekt anlegen',
      editProject: 'Projekt bearbeiten',
      projectTitle: 'Titel',
      projectSummary: 'Kurzstatus',
      desiredOutcome: 'Gewünschtes Ergebnis',
      nextMove: 'Nächster Schritt',
      risk: 'Risiko',
      projectQuestion: 'Leitfrage',
      tags: 'Tags',
      constraints: 'Constraints',
      setFocus: 'Als Fokus setzen',
      activeFocus: 'Aktiver Fokus',
      noProjects: 'Noch keine Projekte angelegt.',
      manageMemory: 'Kuratiertes Memory pflegen',
      createMemory: 'Memory-Eintrag anlegen',
      editMemory: 'Memory-Eintrag bearbeiten',
      memoryTitle: 'Titel',
      memoryKind: 'Kategorie',
      memorySummary: 'Kurzfassung',
      whyItMatters: 'Warum wichtig',
      linkedProjects: 'Verknüpfte Projekte',
      pin: 'Pinnen',
      unpin: 'Pin lösen',
      noMemory: 'Noch kein kuratiertes Memory vorhanden.'
    }
  },
  en: {
    common: {
      loading: 'Maya is loading…',
      retry: 'Retry',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      create: 'Create',
      active: 'Active',
      none: 'Nothing here yet',
      focus: 'Focus',
      add: 'Add'
    },
    shell: {
      activeProject: 'Active project',
      noActiveProject: 'No project is currently focused.',
      loadingProfile: 'Personal layer is loading.'
    },
    home: {
      activeFocusTitle: 'Current work focus',
      activeFocusBody: 'A focused project stays visible in chat and context so Maya can bias toward it.',
      setFocus: 'Set focus',
      clearFocus: 'Clear focus',
      recentSessions: 'Recent sessions',
      continueSession: 'Continue session',
      emptySessions: 'No additional sessions saved yet.',
      latestMessage: 'Latest note'
    },
    chat: {
      sessionHistory: 'Session history',
      createSession: 'New session',
      newSessionTitle: 'New session title',
      newSessionIntent: 'Intent',
      currentSession: 'Current session',
      selectSession: 'Open',
      emptySession: 'This session is still empty. Start with a first thought.',
      activeProject: 'Focused project',
      noActiveProject: 'No focused project set',
      pinProject: 'Set focus',
      clearFocus: 'Clear focus'
    },
    context: {
      manageProfile: 'Edit profile',
      displayName: 'Name',
      addressing: 'Addressing',
      role: 'Role / short description',
      mission: 'Work description',
      assistantContract: 'Grounding / preferences',
      communicationStyle: 'Working style',
      currentFocus: 'Current focus',
      timezone: 'Timezone',
      location: 'Location',
      manageProjects: 'Manage projects',
      createProject: 'Create project',
      editProject: 'Edit project',
      projectTitle: 'Title',
      projectSummary: 'Short status',
      desiredOutcome: 'Desired outcome',
      nextMove: 'Next move',
      risk: 'Risk',
      projectQuestion: 'Project question',
      tags: 'Tags',
      constraints: 'Constraints',
      setFocus: 'Set focus',
      activeFocus: 'Active focus',
      noProjects: 'No projects created yet.',
      manageMemory: 'Manage curated memory',
      createMemory: 'Create memory item',
      editMemory: 'Edit memory item',
      memoryTitle: 'Title',
      memoryKind: 'Category',
      memorySummary: 'Summary',
      whyItMatters: 'Why it matters',
      linkedProjects: 'Linked projects',
      pin: 'Pin',
      unpin: 'Unpin',
      noMemory: 'No curated memory items yet.'
    }
  }
} as const;

export function getMayaProductText(language: AppLanguage) {
  return productText[language] || productText.de;
}

export const projectStages: Project['stage'][] = ['active', 'watch', 'incubating'];
export const projectPriorities: Project['priority'][] = ['high', 'medium', 'low'];
export const memoryKinds: MemoryItem['kind'][] = ['preference', 'project', 'constraint', 'insight'];
