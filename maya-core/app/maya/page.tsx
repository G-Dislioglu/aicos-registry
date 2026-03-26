import { MayaChatScreen } from '@/components/maya-chat-screen';
import { requireMayaPageAuth } from '@/lib/maya-auth';
import { readMayaSurfaceState } from '@/lib/maya-surface-state';

function readText(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

export default async function MayaPage() {
  await requireMayaPageAuth('/maya');

  // K5-BLOCK-5: Diese Call-Site liest ihren Surface-State jetzt über `/api/maya/surface-state` statt direkt über `readMayaStore()`.
  // Der Vertrags-Endpunkt bleibt vorerst ein Übergangsadapter; die eigentliche Quellenmigration von Achse A nach Achse B folgt separat.
  const { activeSession, activeWorkspace, surface } = await readMayaSurfaceState();

  const activeWorkspaceTitle = activeWorkspace?.title?.trim() || '';
  const activeThreadTitle = activeSession?.title?.trim() || '';
  const frameLead = readText(
    surface?.briefing?.title || activeWorkspaceTitle || activeThreadTitle,
    'Aktiver Maya-Arbeitsraum'
  );

  return (
    <>
      <div className="k4-maya-page">
        <section className="k4-maya-frame">
          <div>
            <div className="k4-maya-kicker">Maya Workspace</div>
            <h1>{frameLead}</h1>
            <p>
              Der aktive Arbeitslauf bleibt die Hauptfläche. Diese Rahmung hält nur den Einstieg knapp, damit Fokus,
              nächster Schritt und offener Punkt direkt im Runtime-Bereich geführt werden.
            </p>
          </div>
          <a className="k4-maya-primary-action" href="#k4-maya-runtime">
            In den aktiven Maya-Fokus springen
          </a>
        </section>

        {(activeWorkspaceTitle || activeThreadTitle) ? (
          <section className="k4-maya-entry-strip" aria-label="Maya Einstiegskontext">
            {activeWorkspaceTitle ? (
              <div className="k4-entry-chip">
                <span>Arbeitsraum</span>
                <strong>{activeWorkspaceTitle}</strong>
              </div>
            ) : null}
            {activeThreadTitle ? (
              <div className="k4-entry-chip">
                <span>Thread</span>
                <strong>{activeThreadTitle}</strong>
              </div>
            ) : null}
          </section>
        ) : null}

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

        .k4-maya-frame,
        .k4-maya-entry-strip {
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(15, 23, 42, 0.86);
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(2, 6, 23, 0.32);
        }

        .k4-maya-frame {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem 1.25rem;
        }

        .k4-maya-kicker {
          font-size: 0.72rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(125, 211, 252, 0.86);
        }

        .k4-maya-frame h1 {
          margin: 0.7rem 0 0;
          color: white;
          font-size: clamp(1.05rem, 1.4vw, 1.35rem);
          line-height: 1.35;
        }

        .k4-maya-frame p {
          margin: 0.75rem 0 0;
          color: rgba(226, 232, 240, 0.96);
          font-size: 0.98rem;
          line-height: 1.65;
        }

        .k4-maya-primary-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          align-self: flex-start;
          min-height: 2.6rem;
          padding: 0.65rem 1rem;
          border-radius: 9999px;
          background: linear-gradient(135deg, rgba(34, 211, 238, 0.9), rgba(16, 185, 129, 0.9));
          color: #082f49;
          font-weight: 700;
          text-decoration: none;
        }

        .k4-maya-entry-strip {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          padding: 0.9rem;
        }

        .k4-entry-chip {
          min-width: 0;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.05);
          padding: 0.9rem;
        }

        .k4-entry-chip span {
          display: block;
          margin-bottom: 0.45rem;
          font-size: 0.72rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(148, 163, 184, 0.9);
        }

        .k4-entry-chip strong {
          display: block;
          color: rgba(248, 250, 252, 0.98);
          font-size: 0.94rem;
          line-height: 1.5;
          font-weight: 600;
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

        @media (min-width: 960px) {
          .k4-maya-frame {
            align-items: flex-start;
            flex-direction: row;
            justify-content: space-between;
          }
        }

        @media (max-width: 640px) {
          .k4-maya-page {
            padding: 0.75rem;
          }

          .k4-entry-chip strong {
            font-size: 0.92rem;
          }
        }
      ` }} />
    </>
  );
}
