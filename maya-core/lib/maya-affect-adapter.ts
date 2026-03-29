import {
  berechneAffektKontextSafe,
  type SessionKontext,
  type ToneSignal,
  type UserTon
} from '@/lib/maya-affect-core';

export type AffectAdapterMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type MayaTurnLocalAffectPosture = {
  promptSection: string | null;
  fallbackUsed: boolean;
};

type ToneRule = {
  label: UserTon;
  confidence: number;
  terms: string[];
};

const TONE_RULES: ToneRule[] = [
  {
    label: 'konfrontativ',
    confidence: 0.82,
    terms: ['widerspruch', 'stimmt nicht', 'passt nicht', 'macht keinen sinn', 'falsch', 'unklar']
  },
  {
    label: 'verletzlich',
    confidence: 0.78,
    terms: ['ich weiß nicht', 'ich weiss nicht', 'unsicher', 'lost', 'überfordert', 'ueberfordert', 'ratlos']
  },
  {
    label: 'erschoepft',
    confidence: 0.76,
    terms: ['erschöpft', 'erschoepft', 'müde', 'muede', 'fertig', 'ausgelaugt']
  },
  {
    label: 'aufgeregt',
    confidence: 0.74,
    terms: ['mega', 'super', 'genial', 'wow', 'freue mich', 'geschafft']
  }
];

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function findLatestUserMessage(messages: AffectAdapterMessage[]): AffectAdapterMessage | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role === 'user' && message.content.trim().length > 0) {
      return message;
    }
  }

  return null;
}

function inferToneSignal(text: string): ToneSignal {
  const normalizedText = normalizeText(text);

  for (const rule of TONE_RULES) {
    const evidence = rule.terms.filter((term) => normalizedText.includes(term));
    if (evidence.length > 0) {
      return {
        label: rule.label,
        confidence: Math.min(0.9, rule.confidence + (evidence.length - 1) * 0.04),
        source: 'heuristic',
        evidence: evidence.slice(0, 3)
      };
    }
  }

  return {
    label: 'neutral',
    confidence: 0.62,
    source: 'heuristic',
    evidence: []
  };
}

function deriveSessionKontext(messages: AffectAdapterMessage[], latestUserMessage: AffectAdapterMessage): SessionKontext {
  const conversationalMessages = messages.filter(
    (message) => message.role !== 'system' && message.content.trim().length > 0
  );

  return {
    nachrichtenAnzahl: Math.max(1, conversationalMessages.length),
    letzterUserTon: inferToneSignal(latestUserMessage.content),
    themaWechsel: false,
    schweigenVorher: false
  };
}

export function buildTurnLocalAffectPosture(messages: AffectAdapterMessage[]): MayaTurnLocalAffectPosture {
  const latestUserMessage = findLatestUserMessage(messages);
  if (!latestUserMessage) {
    return {
      promptSection: null,
      fallbackUsed: false
    };
  }

  const sessionKontext = deriveSessionKontext(messages, latestUserMessage);
  const result = berechneAffektKontextSafe({
    userNachricht: latestUserMessage.content,
    sessionKontext,
    vorherigEcho: null
  });

  return {
    promptSection: ['## Interne Response-Posture', result.result.systemHinweis].join('\n'),
    fallbackUsed: result.fallbackUsed
  };
}
