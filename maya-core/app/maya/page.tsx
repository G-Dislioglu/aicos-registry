import { MayaChatScreen } from '@/components/maya-chat-screen';
import { requireMayaPageAuth } from '@/lib/maya-auth';
import { readMayaSurfaceState } from '@/lib/maya-surface-state';

function readText(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

function readStatusLabel(status: string | null | undefined) {
  switch (status) {
    case 'completed':
      return 'abgeschlossen';
    case 'paused':
      return 'geparkt';
    case 'active':
      return 'aktiv';
    case 'open':
      return 'aktiv';
    default:
      return 'in Klärung';
  }
}

function readConfidenceLabel(confidence: string | null | undefined) {
  switch (confidence) {
    case 'high':
      return 'hoch';
    case 'medium':
      return 'mittel';
    case 'low':
      return 'niedrig';
    case 'pending':
      return 'aufbauend';
    default:
      return 'offen';
  }
}

export default async function MayaPage() {
  await requireMayaPageAuth('/maya');

  // K5-BLOCK-5: Diese Call-Site liest ihren Surface-State jetzt über `/api/maya/surface-state` statt direkt über `readMayaStore()`.
  // Der Vertrags-Endpunkt bleibt vorerst ein Übergangsadapter; die eigentliche Quellenmigration von Achse A nach Achse B folgt separat.
  const { activeSession, activeWorkspace, surface } = await readMayaSurfaceState();

  const brief = readText(
    surface?.briefing?.currentState || surface?.briefing?.focus || activeWorkspace?.currentState || activeSession?.intent,
    'Maya hält den aktuellen Arbeitsfokus bereit und zieht nur den nächsten sinnvollen Schritt nach vorn.'
  );
  const nextStep = readText(
    surface?.primaryNextStep || activeWorkspace?.nextMilestone || activeSession?.intent,
    'Den nächsten sinnvollen Schritt festlegen und direkt in den Composer übernehmen.'
  );
  const focus = readText(
    surface?.primaryFocus || activeWorkspace?.focus || activeSession?.title,
    'Noch kein stabiler Fokus markiert.'
  );
  const blocker = readText(
    surface?.primaryOpenPoint || activeWorkspace?.openItems[0],
    'Kein expliziter Blocker markiert.'
  );
  const status = readStatusLabel(surface?.workrun?.status || surface?.handoff?.status || activeWorkspace?.status || null);
  const confidence = readConfidenceLabel(surface?.briefing?.confidence || activeSession?.digest?.confidence || null);

  return (
    <>
      <div className="k4-maya-page">
        <section className="k4-maya-brief">
          <div className="k4-maya-kicker">Maya Brief</div>
          <p>{brief}</p>
        </section>

        <section className="k4-maya-next-step">
          <div className="k4-maya-kicker">Next Step Hero</div>
          <h1>{nextStep}</h1>
          <a className="k4-maya-primary-action" href="#k4-maya-runtime">
            In den aktiven Maya-Fokus springen
          </a>
        </section>

        <section className="k4-maya-context-strip" aria-label="Maya Kontextleiste">
          <div className="k4-context-card">
            <span>Fokus</span>
            <strong>{focus}</strong>
          </div>
          <div className="k4-context-card">
            <span>Blocker</span>
            <strong>{blocker}</strong>
          </div>
          <div className="k4-context-card">
            <span>Status</span>
            <strong>{status}</strong>
          </div>
          <div className="k4-context-card">
            <span>Vertrauen</span>
            <strong>{confidence}</strong>
          </div>
        </section>

        <div id="k4-maya-runtime">
          <MayaChatScreen />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .k4-maya-page {
          display: grid;
          gap: 1rem;
          padding: 1rem;
          background: radial-gradient(circle at top, rgba(34, 211, 238, 0.12), transparent 42%), #020617;
        }

        .k4-maya-brief,
        .k4-maya-next-step,
        .k4-maya-context-strip {
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(15, 23, 42, 0.86);
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(2, 6, 23, 0.32);
        }

        .k4-maya-brief,
        .k4-maya-next-step {
          padding: 1rem 1.25rem;
        }

        .k4-maya-kicker {
          font-size: 0.72rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(125, 211, 252, 0.86);
        }

        .k4-maya-brief p {
          margin: 0.75rem 0 0;
          color: rgba(226, 232, 240, 0.96);
          font-size: 1rem;
          line-height: 1.7;
        }

        .k4-maya-next-step h1 {
          margin: 0.75rem 0 0;
          color: white;
          font-size: clamp(1.35rem, 2vw, 2rem);
          line-height: 1.3;
        }

        .k4-maya-primary-action {
          display: inline-flex;
          margin-top: 1rem;
          align-items: center;
          justify-content: center;
          min-height: 3rem;
          padding: 0.75rem 1.1rem;
          border-radius: 9999px;
          background: linear-gradient(135deg, rgba(34, 211, 238, 0.9), rgba(16, 185, 129, 0.9));
          color: #082f49;
          font-weight: 700;
          text-decoration: none;
        }

        .k4-maya-context-strip {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.75rem;
          padding: 0.9rem;
        }

        .k4-context-card {
          min-width: 0;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.05);
          padding: 0.9rem;
        }

        .k4-context-card span {
          display: block;
          margin-bottom: 0.45rem;
          font-size: 0.72rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(148, 163, 184, 0.9);
        }

        .k4-context-card strong {
          display: block;
          color: rgba(248, 250, 252, 0.98);
          font-size: 0.98rem;
          line-height: 1.5;
          font-weight: 600;
        }

        #k4-maya-runtime .maya-feed > section {
          display: none;
        }

        #k4-maya-runtime .maya-main {
          min-height: 0;
        }

        #k4-maya-runtime .maya-feed {
          padding-top: 0;
        }

        #k4-maya-runtime .maya-composer-wrap {
          position: sticky;
          bottom: 0;
          z-index: 30;
          padding-top: 0.75rem;
          background: linear-gradient(180deg, rgba(2, 6, 23, 0), rgba(2, 6, 23, 0.78) 30%, rgba(2, 6, 23, 0.94) 100%);
          backdrop-filter: blur(10px);
        }

        @media (max-width: 960px) {
          .k4-maya-context-strip {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .k4-maya-page {
            padding: 0.75rem;
          }

          .k4-context-card strong {
            font-size: 0.92rem;
          }
        }
      ` }} />
    </>
  );
}
