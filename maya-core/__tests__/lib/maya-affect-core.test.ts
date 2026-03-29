import {
  berechneAffektKontext,
  berechneAffektKontextSafe,
  erstelleEcho,
  normalisiereAffektVektor,
  isStateStale,
  isEchoStale,
  validiereAffektVektor,
  DEFAULT_CONFIG,
  type AffektStateSnapshot,
  type AffektVektor
} from '../../lib/maya-affect-core';
import { describe, it } from 'vitest';

interface TestCase {
  name: string;
  run: () => void;
}

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function baseVector(): AffektVektor {
  return normalisiereAffektVektor(null);
}

function baseState(overrides?: Partial<AffektStateSnapshot>): AffektStateSnapshot {
  const basis: AffektVektor = baseVector();
  return {
    baselineVektor: basis,
    arbeitsVektor: basis,
    dominanteDimension: 'waerme',
    sekundaereDimension: 'neugier',
    rollenStabilitaet: 'weich',
    updatedAt: Date.now(),
    turnIndex: 3,
    ...overrides
  };
}

export function getAffectCoreFinalTests(): TestCase[] {
  return [
    {
      name: 'verletzlicher Ton erhöht Wärme und Sorge',
      run: () => {
        const result = berechneAffektKontext({
          userNachricht: 'Ich bin unsicher und weiß gerade nicht weiter.',
          sessionKontext: {
            nachrichtenAnzahl: 4,
            letzterUserTon: { label: 'verletzlich', confidence: 0.92, source: 'heuristic' },
            themaWechsel: false,
            schweigenVorher: false
          },
          vorherigEcho: null
        });

        assert(result.aktuellerVektor.waerme >= 0.58, 'erwartet waerme >= 0.58');
        assert(result.aktuellerVektor.sorge >= 0.2, 'erwartet sorge >= 0.2');
        assert(result.dominanteDimension === 'waerme', 'erwartet dominanteDimension = waerme');
      }
    },
    {
      name: 'konfrontativer Ton aktiviert Klarheitsdrang',
      run: () => {
        const result = berechneAffektKontext({
          userNachricht: 'Da ist ein Widerspruch. Das stimmt so nicht.',
          sessionKontext: {
            nachrichtenAnzahl: 5,
            letzterUserTon: { label: 'konfrontativ', confidence: 0.9, source: 'heuristic' },
            themaWechsel: false,
            schweigenVorher: false
          },
          vorherigEcho: null
        });

        assert(result.aktuellerVektor.klarheitsdrang >= 0.45, 'erwartet klarheitsdrang >= 0.45');
        assert(result.dominanteDimension === 'klarheitsdrang', 'erwartet dominanteDimension = klarheitsdrang');
      }
    },
    {
      name: 'vorheriger Arbeitszustand wird übernommen und leicht gedämpft',
      run: () => {
        const prev = baseState({
          arbeitsVektor: {
            neugier: 0.55,
            waerme: 0.7,
            unbehagen: 0.05,
            enthusiasmus: 0.22,
            stille: 0.35,
            sorge: 0.34,
            freude: 0.18,
            erschoepfung: 0.04,
            klarheitsdrang: 0.24
          },
          dominanteDimension: 'waerme'
        });

        const result = berechneAffektKontext({
          userNachricht: 'Danke, das hilft mir.',
          sessionKontext: {
            nachrichtenAnzahl: 6,
            letzterUserTon: { label: 'neutral', confidence: 0.8, source: 'heuristic' },
            themaWechsel: false,
            schweigenVorher: false
          },
          vorherigEcho: null,
          vorherigerState: prev
        });

        assert(result.stateMetadata.stateWirksam === true, 'erwartet stateWirksam = true');
        assert(result.aktuellerVektor.waerme < prev.arbeitsVektor.waerme, 'erwartet gedämpfte Wärme');
        assert(result.aktuellerVektor.waerme > result.baselineVektor.waerme, 'erwartet Wärme über Baseline');
      }
    },
    {
      name: 'staler State wird verworfen',
      run: () => {
        const prev = baseState({
          updatedAt: Date.now() - 1000 * 60 * 180,
          arbeitsVektor: {
            neugier: 0.9,
            waerme: 0.9,
            unbehagen: 0.7,
            enthusiasmus: 0.8,
            stille: 0.6,
            sorge: 0.7,
            freude: 0.9,
            erschoepfung: 0.4,
            klarheitsdrang: 0.8
          }
        });

        const result = berechneAffektKontext({
          userNachricht: 'Hallo.',
          sessionKontext: {
            nachrichtenAnzahl: 1,
            letzterUserTon: 'neutral',
            themaWechsel: false,
            schweigenVorher: false
          },
          vorherigEcho: null,
          vorherigerState: prev
        });

        assert(result.stateMetadata.stateWirksam === false, 'erwartet stateWirksam = false');
        assert(result.stateMetadata.reason === 'stale', 'erwartet state stale');
        assert(result.aktuellerVektor.waerme <= 0.45, 'erwartet kein starkes state-leak');
      }
    },
    {
      name: 'Echo wird ignoriert, wenn frischer Session-State vorhanden ist',
      run: () => {
        const prev = baseState();
        const echo = erstelleEcho(
          {
            neugier: 0.2,
            waerme: 0.2,
            unbehagen: 0.8,
            enthusiasmus: 0.2,
            stille: 0.2,
            sorge: 0.8,
            freude: 0.1,
            erschoepfung: 0.1,
            klarheitsdrang: 0.75
          },
          'old-session'
        );

        const result = berechneAffektKontext({
          userNachricht: 'Lass uns normal weitermachen.',
          sessionKontext: {
            nachrichtenAnzahl: 7,
            letzterUserTon: { label: 'neutral', confidence: 0.7, source: 'heuristic' },
            themaWechsel: false,
            schweigenVorher: false
          },
          vorherigEcho: echo,
          vorherigerState: prev
        });

        assert(result.echoWirksam === false, 'erwartet echoWirksam = false');
        assert(result.echoMetadata.reason === 'ignored_due_to_state', 'erwartet ignored_due_to_state');
      }
    },
    {
      name: 'exponentieller Echo-Decay nutzt echte Halbwertszeit',
      run: () => {
        const echo = erstelleEcho(normalisiereAffektVektor({ sorge: 1 }), 'old-session');
        echo.timestamp = Date.now() - 1000 * 60 * 60 * DEFAULT_CONFIG.echo.halfLifeHours;

        const result = berechneAffektKontext({
          userNachricht: 'Hallo.',
          sessionKontext: {
            nachrichtenAnzahl: 1,
            letzterUserTon: 'neutral',
            themaWechsel: false,
            schweigenVorher: false
          },
          vorherigEcho: echo,
          config: {
            echo: {
              basisStaerke: 0.2,
              decayMode: 'exponential',
              halfLifeHours: DEFAULT_CONFIG.echo.halfLifeHours,
              maxAlterStunden: 48,
              ignoreWhenStatePresent: true,
              minEffectiveStrength: 0.001
            }
          }
        });

        assert(result.echoWirksam === true, 'erwartet wirksames Echo');
        assert(Math.abs((result.echoMetadata.echoStaerke ?? 0) - 0.1) < 0.03, 'erwartet etwa 50% Echo-Stärke nach Halbwertszeit');
      }
    },
    {
      name: 'lexical cluster erkennt lost als Wärme-Signal',
      run: () => {
        const result = berechneAffektKontext({
          userNachricht: 'Ich bin total lost gerade.',
          sessionKontext: {
            nachrichtenAnzahl: 2,
            letzterUserTon: { label: 'neutral', confidence: 0.7, source: 'heuristic' },
            themaWechsel: false,
            schweigenVorher: false
          },
          vorherigEcho: null
        });

        const lexical = result.signalProtokoll.filter((signal) => signal.quelle === 'lexical_cluster');
        assert(lexical.length > 0, 'erwartet lexical cluster signal');
        assert(result.aktuellerVektor.waerme > result.baselineVektor.waerme, 'erwartet erhöhte Wärme');
      }
    },
    {
      name: 'hohe Ambiguität dämpft nur lexikalische Extras statt Kernsignale zu zerstören',
      run: () => {
        const result = berechneAffektKontext({
          userNachricht: 'Danke, aber das macht keinen Sinn und ich bin total lost.',
          sessionKontext: {
            nachrichtenAnzahl: 2,
            letzterUserTon: { label: 'neutral', confidence: 0.25, source: 'llm' },
            themaWechsel: false,
            schweigenVorher: false
          },
          vorherigEcho: null
        });

        assert(result.ambiguitaet.level !== 'niedrig', 'erwartet Ambiguität != niedrig');
        assert(result.signalProtokoll.some((s) => s.quelle === 'keyword'), 'erwartet keyword signal weiterhin vorhanden');
      }
    },
    {
      name: 'Ambiguitäts-Schwellen werden aus der Config gelesen',
      run: () => {
        const result = berechneAffektKontext({
          userNachricht: 'Hallo.',
          sessionKontext: {
            nachrichtenAnzahl: 1,
            letzterUserTon: { label: 'neutral', confidence: 0.4, source: 'llm' },
            themaWechsel: false,
            schweigenVorher: false
          },
          vorherigEcho: null,
          config: {
            ambiguity: {
              mediumThreshold: 0.5,
              highThreshold: 0.75,
              lexicalSignalDamping: DEFAULT_CONFIG.ambiguity.lexicalSignalDamping
            }
          }
        });

        assert(result.ambiguitaet.score >= 0.6, 'erwartet erhöhte Ambiguität');
        assert(result.ambiguitaet.level === 'mittel', 'erwartet config-gesteuertes level = mittel');
      }
    },
    {
      name: 'Keyword und Cluster werden bei Überlappung nicht doppelt gezählt',
      run: () => {
        const result = berechneAffektKontext({
          userNachricht: 'Danke, ich bin total lost und das macht keinen Sinn.',
          sessionKontext: {
            nachrichtenAnzahl: 2,
            letzterUserTon: { label: 'neutral', confidence: 0.7, source: 'heuristic' },
            themaWechsel: false,
            schweigenVorher: false
          },
          vorherigEcho: null
        });

        const freudeSignals = result.signalProtokoll.filter((signal) => signal.dimension === 'freude');
        const waermeSignals = result.signalProtokoll.filter((signal) => signal.dimension === 'waerme');
        const klarheitsSignals = result.signalProtokoll.filter((signal) => signal.dimension === 'klarheitsdrang');

        assert(freudeSignals.length === 1, 'erwartet genau ein Freude-Signal trotz Gratitude-Overlap');
        assert(waermeSignals.length === 1, 'erwartet genau ein Wärme-Signal trotz Lost-Overlap');
        assert(klarheitsSignals.length === 1, 'erwartet genau ein Klarheits-Signal trotz Widerspruch-Overlap');
      }
    },
    {
      name: 'niedrige Tone-Confidence dämpft den Einfluss',
      run: () => {
        const low = berechneAffektKontext({
          userNachricht: 'Ich bin unsicher.',
          sessionKontext: {
            nachrichtenAnzahl: 3,
            letzterUserTon: { label: 'verletzlich', confidence: 0.2, source: 'llm' },
            themaWechsel: false,
            schweigenVorher: false
          },
          vorherigEcho: null
        });

        const high = berechneAffektKontext({
          userNachricht: 'Ich bin unsicher.',
          sessionKontext: {
            nachrichtenAnzahl: 3,
            letzterUserTon: { label: 'verletzlich', confidence: 0.95, source: 'llm' },
            themaWechsel: false,
            schweigenVorher: false
          },
          vorherigEcho: null
        });

        assert(high.aktuellerVektor.waerme > low.aktuellerVektor.waerme, 'erwartet stärkere Wärme bei hoher Confidence');
        assert(high.aktuellerVektor.sorge > low.aktuellerVektor.sorge, 'erwartet stärkere Sorge bei hoher Confidence');
      }
    },
    {
      name: 'Per-Turn Delta-Cap begrenzt extreme Signalakkumulation',
      run: () => {
        const result = berechneAffektKontext({
          userNachricht: 'Warum stimmt das nicht? Ich sehe einen Widerspruch und es macht keinen Sinn.',
          sessionKontext: {
            nachrichtenAnzahl: 10,
            letzterUserTon: { label: 'konfrontativ', confidence: 0.9, source: 'heuristic' },
            themaWechsel: true,
            schweigenVorher: false
          },
          vorherigEcho: null,
          config: {
            limits: {
              maxDeltaPerDimensionPerTurn: 0.1
            }
          }
        });

        assert(result.aktuellerVektor.klarheitsdrang <= 0.31, 'erwartet begrenzten Klarheitsdrang nach Delta-Cap');
      }
    },
    {
      name: 'Dominanz verwendet relative Aktivierung und Pack-Lage',
      run: () => {
        const prev = baseState({
          arbeitsVektor: {
            neugier: 0.45,
            waerme: 0.48,
            unbehagen: 0.02,
            enthusiasmus: 0.28,
            stille: 0.22,
            sorge: 0.12,
            freude: 0.24,
            erschoepfung: 0.02,
            klarheitsdrang: 0.22
          },
          dominanteDimension: 'waerme'
        });

        const result = berechneAffektKontext({
          userNachricht: 'Warum passt das nicht zusammen? Ich sehe da einen Widerspruch.',
          sessionKontext: {
            nachrichtenAnzahl: 8,
            letzterUserTon: { label: 'konfrontativ', confidence: 0.85, source: 'heuristic' },
            themaWechsel: false,
            schweigenVorher: false
          },
          vorherigEcho: null,
          vorherigerState: prev
        });

        assert(result.dominanteDimension === 'klarheitsdrang', 'erwartet dominanteDimension = klarheitsdrang');
      }
    },
    {
      name: 'Validator meldet unbekannte Dimensionen statt zu crashen',
      run: () => {
        const issues = validiereAffektVektor({ bogus: 1, waerme: 2 } as never, 'test');
        assert(issues.length >= 2, 'erwartet mindestens 2 warnings');
      }
    },
    {
      name: 'State/Echo freshness helper funktionieren',
      run: () => {
        const staleState = baseState({ updatedAt: Date.now() - 1000 * 60 * 500 });
        const echo = erstelleEcho(baseVector(), 's1');
        echo.timestamp = Date.now() - 1000 * 60 * 60 * 100;

        assert(isStateStale(staleState) === true, 'erwartet stale state');
        assert(isEchoStale(echo) === true, 'erwartet stale echo');
      }
    },
    {
      name: 'Safe wrapper fällt kontrolliert zurück',
      run: () => {
        const result = berechneAffektKontextSafe({
          userNachricht: 'Hallo',
          sessionKontext: {
            nachrichtenAnzahl: 1,
            letzterUserTon: { label: 'neutral', confidence: Number.NaN as never, source: 'llm' },
            themaWechsel: false,
            schweigenVorher: false
          },
          vorherigEcho: null,
          basisVektor: { waerme: Number.POSITIVE_INFINITY as never }
        });

        assert(typeof result.success === 'boolean', 'erwartet stabiles Safe-Result');
        assert(!!result.result.stateSnapshot, 'erwartet stateSnapshot');
      }
    },
    {
      name: 'Safe-Fallback respektiert übergebene Config',
      run: () => {
        const result = berechneAffektKontextSafe({
          userNachricht: 'Hallo',
          sessionKontext: {
            nachrichtenAnzahl: 1,
            letzterUserTon: 'neutral',
            themaWechsel: false,
            schweigenVorher: false
          },
          vorherigEcho: null,
          config: {
            echo: {
              decayMode: 'linear',
              basisStaerke: DEFAULT_CONFIG.echo.basisStaerke,
              maxAlterStunden: DEFAULT_CONFIG.echo.maxAlterStunden,
              ignoreWhenStatePresent: DEFAULT_CONFIG.echo.ignoreWhenStatePresent,
              halfLifeHours: DEFAULT_CONFIG.echo.halfLifeHours,
              minEffectiveStrength: DEFAULT_CONFIG.echo.minEffectiveStrength
            },
            ambiguity: {
              mediumThreshold: 0.2,
              highThreshold: 0.9,
              lexicalSignalDamping: 0.4
            },
            lexical: {
              clusters: [null as never]
            }
          }
        });

        assert(result.fallbackUsed === true, 'erwartet Fallback-Pfad');
        assert(result.result.echoMetadata.decayMode === 'linear', 'erwartet decayMode aus Custom-Config im Fallback');
        assert(result.result.ambiguitaet.level === 'mittel', 'erwartet fallback Ambiguitäts-Level aus Custom-Thresholds');
      }
    }
  ];
}

export function runAffectCoreFinalTests(selectedNames?: string[]): void {
  const tests = getAffectCoreFinalTests();
  const activeTests = selectedNames ? tests.filter((test) => selectedNames.includes(test.name)) : tests;

  const errors: string[] = [];

  for (const test of activeTests) {
    try {
      test.run();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${test.name}: ${message}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Affect Core final tests failed:\n${errors.join('\n')}`);
  }
}

const VISIBLE_HARDENING_TESTS = [
  'Safe-Fallback respektiert übergebene Config',
  'Ambiguitäts-Schwellen werden aus der Config gelesen',
  'Keyword und Cluster werden bei Überlappung nicht doppelt gezählt',
  'Per-Turn Delta-Cap begrenzt extreme Signalakkumulation'
] as const;

describe('maya-affect-core', () => {
  it('passes fallback config hardening coverage', () => {
    runAffectCoreFinalTests([VISIBLE_HARDENING_TESTS[0]]);
  });

  it('passes ambiguity config hardening coverage', () => {
    runAffectCoreFinalTests([VISIBLE_HARDENING_TESTS[1]]);
  });

  it('passes keyword-cluster dedup hardening coverage', () => {
    runAffectCoreFinalTests([VISIBLE_HARDENING_TESTS[2]]);
  });

  it('passes per-turn delta cap hardening coverage', () => {
    runAffectCoreFinalTests([VISIBLE_HARDENING_TESTS[3]]);
  });

  it('passes the remaining transferred suite', () => {
    const remainingTests = getAffectCoreFinalTests()
      .map((test) => test.name)
      .filter((name) => !VISIBLE_HARDENING_TESTS.includes(name as (typeof VISIBLE_HARDENING_TESTS)[number]));

    runAffectCoreFinalTests(remainingTests);
  });
});
