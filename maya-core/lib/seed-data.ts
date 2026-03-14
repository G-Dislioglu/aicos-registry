import { AppLanguage, ChatSession, FocusCard, MayaState, MemoryItem, Profile, Project } from '@/lib/types';

type SeedLanguageContent = {
  profile: Profile;
  projects: Project[];
  memory: MemoryItem[];
  focusCards: FocusCard[];
  session: ChatSession;
};

const seedContent: Record<AppLanguage, SeedLanguageContent> = {
  de: {
    profile: {
      id: 'profile-owner',
      displayName: 'Du',
      role: 'Gründer / Builder',
      timezone: 'UTC+03:00',
      location: 'Persönliche Ebene',
      mission: 'Nutze Maya als ruhige persönliche Assistenz für Prioritäten, Synthese und klare nächste Schritte.',
      assistantContract: 'Maya ist textbasiert, nur für dich gedacht und hält den relevanten Kontext sichtbar.',
      communicationStyle: ['klar', 'direkt', 'produktorientiert', 'ohne Hype'],
      currentFocus: ['Arbeitsgedächtnis schützen', 'Projektkontext warm halten', 'Druck in nächste Schritte übersetzen']
    },
    projects: [
      {
        id: 'maya-core',
        title: 'Maya',
        stage: 'active',
        priority: 'high',
        summary: 'Die erste persönliche PWA ausliefern, die sich wie eine echte Assistenzfläche anfühlt und nicht wie ein generischer Chat.',
        desiredOutcome: 'Eine mobile-first Alltagsoberfläche mit sichtbarem Kontext, schnellem Chat und kuratierter Kontinuität.',
        nextMove: 'Die lokale Assistenzschleife härten und die Deploy-Bereitschaft auf Render sauber prüfen.',
        risk: 'Die App könnte hübsch wirken, aber noch nicht genug persönliche Kontextdichte haben.',
        projectQuestion: 'Was ist der kleinste Loop, der sich schon täglich wirklich nützlich anfühlt?',
        tags: ['Produkt', 'PWA', 'persönliche-ebene']
      },
      {
        id: 'aicos-registry',
        title: 'AICOS Registry',
        stage: 'active',
        priority: 'medium',
        summary: 'AICOS als Referenz- und Governance-Anker stabil halten, während nutzernahe Produkte außerhalb der Registry reifen.',
        desiredOutcome: 'Eine verlässliche Referenzbasis, ohne das Produkt wieder in theorielastige Arbeit zurückzuziehen.',
        nextMove: 'Die Grenze zwischen Registry-Semantik und externer Produktoberfläche klar halten.',
        risk: 'Innere Tiefe könnte weiter schneller wachsen als sichtbare Produktnutzung.',
        projectQuestion: 'Wie wird innere Stärke in saubere äußere Benutzbarkeit übersetzt?',
        tags: ['Registry', 'Referenz', 'Anker']
      },
      {
        id: 'personal-rhythm',
        title: 'Persönlicher Arbeitsrhythmus',
        stage: 'watch',
        priority: 'medium',
        summary: 'Ein Ort für Zusagen, Spannungen und kurze Erinnerungsanker über laufende Arbeit hinweg.',
        desiredOutcome: 'Weniger Kontextverlust zwischen Denk-Sessions und weniger falsche Neustarts.',
        nextMove: 'Ein kleines kuratiertes Memory behalten statt einen lauten Totaldump aufzubauen.',
        risk: 'Zu viel Kontext kann eher Hintergrundrauschen als Hilfe werden.',
        projectQuestion: 'Was soll warm sichtbar bleiben und was darf archiviert werden?',
        tags: ['Workflow', 'Kontinuität', 'Aufmerksamkeit']
      }
    ],
    memory: [
      {
        id: 'memory-product-over-theory',
        title: 'Sichtbarer Produktfortschritt ist wichtiger als mehr Theorie',
        kind: 'constraint',
        summary: 'Für Maya soll sichtbarer Produktwert Vorrang vor weiterer AICOS-Theorie oder Policy-Ausweitung haben.',
        whyItMatters: 'So bleibt die persönliche Ebene auf tägliche Nutzbarkeit ausgerichtet.',
        projectIds: ['maya-core', 'aicos-registry'],
        tags: ['Produkt', 'Scope', 'Priorität']
      },
      {
        id: 'memory-mobile-first',
        title: 'Mobile-first ist Pflicht',
        kind: 'preference',
        summary: 'Die App muss auf dem Telefon sauber funktionieren und auf Desktop stabil bleiben.',
        whyItMatters: 'Eine persönliche Assistenz muss schnell erreichbar und auf kleinen Screens angenehm nutzbar sein.',
        projectIds: ['maya-core'],
        tags: ['UX', 'mobil', 'PWA']
      },
      {
        id: 'memory-context-visible',
        title: 'Kontext muss sichtbar bleiben',
        kind: 'insight',
        summary: 'Maya soll wie eine kontextuelle Denkfläche wirken, mit Profil, Projekten und Memory in Sichtweite.',
        whyItMatters: 'Sichtbarer Kontext unterscheidet das Produkt von einer leeren Chatbox.',
        projectIds: ['maya-core'],
        tags: ['Kontext', 'Identität', 'UX']
      },
      {
        id: 'memory-small-curated-memory',
        title: 'Memory klein und kuratiert halten',
        kind: 'constraint',
        summary: 'Phase 1 soll ein kompaktes, handkuratiertes Memory zeigen, statt Vollwissen zu behaupten.',
        whyItMatters: 'Vertrauen wächst, wenn die Memory-Ebene lesbar bleibt und später gezielt erweitert werden kann.',
        projectIds: ['maya-core', 'personal-rhythm'],
        tags: ['Memory', 'Vertrauen', 'Phase1']
      },
      {
        id: 'memory-no-tool-magic',
        title: 'Keine versteckte Tool-Magie',
        kind: 'constraint',
        summary: 'Phase 1 soll keine Gerätesteuerung, Automatisierung oder stillen Integrationen versprechen.',
        whyItMatters: 'Das Produkt bleibt ehrlich darüber, was es heute wirklich kann.',
        projectIds: ['maya-core'],
        tags: ['Scope', 'Ehrlichkeit', 'MVP']
      }
    ],
    focusCards: [
      {
        id: 'focus-chat',
        eyebrow: 'Denkloop',
        title: 'Nutze den Chat für klare nächste Schritte',
        body: 'Maya soll dir helfen, diffusen Druck in eine saubere, kontextbewusste Antwortspur zu verwandeln.',
        actionLabel: 'Chat öffnen',
        href: '/chat'
      },
      {
        id: 'focus-context',
        eyebrow: 'Kontinuität',
        title: 'Halte Profil, Projekte und Memory warm',
        body: 'Der nützliche Teil ist nicht nur die Antwort, sondern dass der richtige Kontext beim Antworten sichtbar bleibt.',
        actionLabel: 'Kontext ansehen',
        href: '/context'
      },
      {
        id: 'focus-home',
        eyebrow: 'Haltung',
        title: 'Bleib ruhig und produktnah',
        body: 'Halte die Oberfläche auf sichtbare Assistenz, kompaktes Memory und tägliche Benutzbarkeit fokussiert.',
        actionLabel: 'Zur Startseite',
        href: '/'
      }
    ],
    session: {
      id: 'session-main',
      title: 'Deine tägliche Assistenz',
      intent: 'Klären, verdichten und aktive Kontexte lesbar halten.',
      messages: [
        {
          id: 'message-welcome',
          role: 'assistant',
          content: 'Ich bin Maya. Ich helfe dir dabei, laufende Arbeit klarer zu sehen, relevanten Kontext nach vorne zu holen und offenen Druck in einen nächsten Schritt zu verwandeln.',
          timestamp: 'Heute · Seed',
          relatedProjectIds: ['maya-core', 'aicos-registry'],
          relatedMemoryIds: ['memory-context-visible', 'memory-product-over-theory']
        }
      ]
    }
  },
  en: {
    profile: {
      id: 'profile-owner',
      displayName: 'You',
      role: 'Founder / builder',
      timezone: 'UTC+03:00',
      location: 'Personal layer',
      mission: 'Use Maya as a calm personal assistant for priorities, synthesis, and clear next moves.',
      assistantContract: 'Maya is text-based, single-user, and keeps the relevant context visible.',
      communicationStyle: ['clear', 'direct', 'product-first', 'no hype'],
      currentFocus: ['protect working memory', 'keep project context warm', 'turn pressure into next moves']
    },
    projects: [
      {
        id: 'maya-core',
        title: 'Maya',
        stage: 'active',
        priority: 'high',
        summary: 'Ship the first personal PWA that feels like a real assistant surface rather than a generic chat.',
        desiredOutcome: 'A mobile-first daily surface with visible context, fast chat, and curated continuity.',
        nextMove: 'Harden the local assistant loop and verify deploy readiness on Render.',
        risk: 'The app could look polished while still lacking enough personal context density.',
        projectQuestion: 'What is the smallest loop that already feels truly useful every day?',
        tags: ['product', 'pwa', 'personal-layer']
      },
      {
        id: 'aicos-registry',
        title: 'AICOS Registry',
        stage: 'active',
        priority: 'medium',
        summary: 'Keep AICOS stable as the reference and governance anchor while user-facing products mature outside the registry.',
        desiredOutcome: 'A reliable reference base without dragging the product shell back into theory-heavy work.',
        nextMove: 'Keep the boundary between registry semantics and the external product surface clear.',
        risk: 'Internal depth may continue to outpace visible product usability.',
        projectQuestion: 'How do we translate internal strength into clean outward usability?',
        tags: ['registry', 'reference', 'anchor']
      },
      {
        id: 'personal-rhythm',
        title: 'Personal working rhythm',
        stage: 'watch',
        priority: 'medium',
        summary: 'One place to hold commitments, tensions, and short memory anchors across active work.',
        desiredOutcome: 'Less context loss between thinking sessions and fewer false restarts.',
        nextMove: 'Keep a small curated memory instead of building a noisy total dump.',
        risk: 'Too much context can become background clutter rather than help.',
        projectQuestion: 'What should stay warm in view and what can remain archived?',
        tags: ['workflow', 'continuity', 'attention']
      }
    ],
    memory: [
      {
        id: 'memory-product-over-theory',
        title: 'Visible product progress matters more than more theory',
        kind: 'constraint',
        summary: 'For Maya, visible product value should outrank more AICOS theory or policy expansion.',
        whyItMatters: 'This keeps the personal layer grounded in daily usefulness.',
        projectIds: ['maya-core', 'aicos-registry'],
        tags: ['product', 'scope', 'priority']
      },
      {
        id: 'memory-mobile-first',
        title: 'Mobile-first is mandatory',
        kind: 'preference',
        summary: 'The app needs to work cleanly on phone first and remain solid on desktop.',
        whyItMatters: 'A personal assistant should be quickly reachable and comfortable on small screens.',
        projectIds: ['maya-core'],
        tags: ['ux', 'mobile', 'pwa']
      },
      {
        id: 'memory-context-visible',
        title: 'Context must stay visible',
        kind: 'insight',
        summary: 'Maya should feel like a contextual thinking surface with profile, projects, and memory nearby.',
        whyItMatters: 'Visible context is what separates the product from an empty chat box.',
        projectIds: ['maya-core'],
        tags: ['context', 'identity', 'ux']
      },
      {
        id: 'memory-small-curated-memory',
        title: 'Keep memory small and curated',
        kind: 'constraint',
        summary: 'Phase 1 should show a compact, hand-curated memory layer instead of pretending to know everything.',
        whyItMatters: 'Trust grows when the memory layer stays readable and can be expanded deliberately later.',
        projectIds: ['maya-core', 'personal-rhythm'],
        tags: ['memory', 'trust', 'phase1']
      },
      {
        id: 'memory-no-tool-magic',
        title: 'No hidden tool magic',
        kind: 'constraint',
        summary: 'Phase 1 should not promise device control, automation, or silent integrations.',
        whyItMatters: 'The product stays honest about what it can actually do today.',
        projectIds: ['maya-core'],
        tags: ['scope', 'honesty', 'mvp']
      }
    ],
    focusCards: [
      {
        id: 'focus-chat',
        eyebrow: 'Thinking loop',
        title: 'Use chat for clearer next moves',
        body: 'Maya should help you turn diffuse pressure into a cleaner, context-aware response path.',
        actionLabel: 'Open chat',
        href: '/chat'
      },
      {
        id: 'focus-context',
        eyebrow: 'Continuity',
        title: 'Keep profile, projects, and memory warm',
        body: 'The useful part is not only the answer but the right context staying visible while you answer.',
        actionLabel: 'See context',
        href: '/context'
      },
      {
        id: 'focus-home',
        eyebrow: 'Posture',
        title: 'Stay calm and product-focused',
        body: 'Keep the shell focused on visible assistance, compact memory, and daily usability.',
        actionLabel: 'Back to home',
        href: '/'
      }
    ],
    session: {
      id: 'session-main',
      title: 'Your daily assistant',
      intent: 'Clarify, compress, and keep active context readable.',
      messages: [
        {
          id: 'message-welcome',
          role: 'assistant',
          content: 'I am Maya. I help you see current work more clearly, surface the most relevant context, and turn open pressure into a next move.',
          timestamp: 'Today · seed',
          relatedProjectIds: ['maya-core', 'aicos-registry'],
          relatedMemoryIds: ['memory-context-visible', 'memory-product-over-theory']
        }
      ]
    }
  }
};

export function getMayaState(language: AppLanguage = 'de'): MayaState {
  return seedContent[language] || seedContent.de;
}

export function getProjectMap(language: AppLanguage = 'de') {
  return new Map(getMayaState(language).projects.map((project) => [project.id, project]));
}

export function getMemoryMap(language: AppLanguage = 'de') {
  return new Map(getMayaState(language).memory.map((item) => [item.id, item]));
}
