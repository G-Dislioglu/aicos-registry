import { expect, Page, test } from '@playwright/test';

async function loginToMayaViaApi(page: Page) {
  const response = await page.request.post('/api/auth/login', {
    data: { passphrase: 'geselle' }
  });

  expect(response.status()).toBe(200);

  const setCookieHeader = response.headers()['set-cookie'];
  const sessionCookieMatch = setCookieHeader?.match(/maya_session=([^;]+)/);

  expect(sessionCookieMatch?.[1]).toBeTruthy();

  await page.context().addCookies([
    {
      name: 'maya_session',
      value: sessionCookieMatch![1],
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax'
    }
  ]);
}

async function loginToMaya(page: Page) {
  await page.goto('/maya', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveURL(/\/login\?next=%2Fmaya/);
  await expect(page.getByRole('heading', { name: 'Single-user access' })).toBeVisible();

  await page.getByLabel('Passphrase').fill('geselle');
  await page.getByRole('button', { name: 'Open Maya' }).click();
  await expect(page).toHaveURL(/\/maya$/);
}

async function expectMayaSurfaceHealthy(page: Page) {
  await expect(page.locator('body')).not.toContainText('Invalid Date');
  await expect(page.locator('body')).not.toContainText('Hydration failed');
  await expect(page.locator('body')).not.toContainText('Unhandled Runtime Error');
  await expect(page.getByRole('textbox', { name: 'Nachricht an Maya' })).toBeVisible({ timeout: 15000 });
}

async function closeReviewSheetIfVisible(page: Page) {
  const closeButton = page.getByRole('button', { name: 'Schließen' });
  const reviewDialog = page.getByRole('dialog', { name: 'Review' });

  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click();
    await expect(reviewDialog).toHaveCount(0);
  }
}

async function writeMayaState(page: Page, state: Record<string, unknown>) {
  const response = await page.request.put('/api/state', {
    data: { state }
  });

  expect(response.status()).toBe(200);
}

async function readMayaState(page: Page) {
  const response = await page.request.get('/api/state');

  expect(response.status()).toBe(200);

  return response.json() as Promise<{ state: Record<string, unknown> }>;
}

function createParkableState() {
  return {
    language: 'de',
    activeProjectId: 'maya-core',
    activeSessionId: 'session-parked-handoff',
    activeWorkspaceId: 'workspace-parked-handoff',
    authVersion: 1,
    sessions: [
      {
        id: 'session-parked-handoff',
        title: 'Geparkter Review-Faden',
        intent: 'Den Faden sauber parken und stabil wieder anzeigen.',
        workspaceId: 'workspace-parked-handoff',
        createdAt: '2026-03-20T20:00:00.000Z',
        updatedAt: '2026-03-20T20:05:00.000Z',
        messages: [
          {
            id: 'assistant-park-1',
            role: 'assistant',
            content: 'Wir halten den aktuellen Review-Faden offen und markieren nur den nächsten sauberen Wiedereinstieg.',
            timestamp: '2026-03-20T20:04:00.000Z'
          },
          {
            id: 'user-park-1',
            role: 'user',
            content: 'Bitte den aktuellen Stand parkbar machen, ohne dass der Wiedereinstieg verloren geht.',
            timestamp: '2026-03-20T20:05:00.000Z'
          }
        ],
        workrun: {
          focus: 'Review-Faden parkbar halten',
          status: 'open',
          lastOutput: 'Der Review-Faden ist stabil lesbar und kann jetzt geparkt werden.',
          lastStep: 'Den aktiven Stand kompakt halten',
          nextStep: 'Mit dem geparkten Review-Faden wieder einsteigen',
          updatedAt: '2026-03-20T20:05:00.000Z',
          source: 'manual'
        },
        handoff: {
          status: 'active',
          achieved: 'Der Review-Faden ist stabil lesbar und kann jetzt geparkt werden.',
          openItems: ['Offene Review-Entscheidung beim Wiedereinstieg prüfen'],
          nextEntry: 'Mit dem geparkten Review-Faden wieder einsteigen',
          updatedAt: '2026-03-20T20:05:00.000Z',
          source: 'manual'
        },
        checkpointBoard: {
          title: 'Arbeitsboard',
          focus: 'Review-Faden parkbar halten',
          updatedAt: '2026-03-20T20:05:00.000Z',
          source: 'manual',
          checkpoints: [
            {
              id: 'checkpoint-park-1',
              label: 'Offene Review-Entscheidung beim Wiedereinstieg prüfen',
              detail: 'Der Wiedereinstieg soll nach Reload sichtbar bleiben',
              status: 'open',
              source: 'manual',
              updatedAt: '2026-03-20T20:05:00.000Z'
            }
          ]
        },
        digest: {
          threadId: 'session-parked-handoff',
          title: 'Geparkter Review-Faden',
          summary: 'Der Review-Faden ist stabil lesbar und kann jetzt geparkt werden.',
          currentState: 'Der Wiedereinstieg ist vorbereitet und muss nach Reload sichtbar bleiben.',
          openLoops: ['Offene Review-Entscheidung beim Wiedereinstieg prüfen'],
          nextEntry: 'Mit dem geparkten Review-Faden wieder einsteigen',
          confidence: 'high',
          updatedAt: '2026-03-20T20:05:00.000Z',
          sourceMessageCount: 2,
          needsRefresh: false
        }
      }
    ],
    workspaces: [
      {
        id: 'workspace-parked-handoff',
        title: 'Review-Parken',
        focus: 'Geparkte Review-Fäden stabil halten',
        goal: 'Ein geparkter Faden muss nach Reload sichtbar wieder aufgenommen werden können',
        currentState: 'Der Wiedereinstieg ist vorbereitet und muss nach Reload sichtbar bleiben.',
        openItems: ['Offene Review-Entscheidung beim Wiedereinstieg prüfen'],
        nextMilestone: 'Mit dem geparkten Review-Faden wieder einsteigen',
        threadIds: ['session-parked-handoff'],
        updatedAt: '2026-03-20T20:05:00.000Z',
        source: 'manual',
        status: 'active'
      }
    ]
  };
}

test('maya login flow opens the main workspace without obvious surface breakage', async ({ page }) => {
  await loginToMaya(page);
  await expectMayaSurfaceHealthy(page);

  const bodyText = await page.locator('body').innerText();
  expect(bodyText).toContain('Maya');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/maya$/);
  await expectMayaSurfaceHealthy(page);
});

test('maya phase-2 acceptance keeps secondary layers hidden when they only mirror the primary reading', async ({ page }) => {
  await loginToMayaViaApi(page);

  const seededState = {
    language: 'de',
    activeProjectId: 'maya-core',
    activeSessionId: 'session-gating',
    activeWorkspaceId: 'workspace-gating',
    authVersion: 1,
    sessions: [
      {
        id: 'session-gating',
        title: 'Sekundärschichten prüfen',
        intent: 'Führende Lesart vor Sekundärschichten halten.',
        workspaceId: 'workspace-gating',
        createdAt: '2026-03-20T19:00:00.000Z',
        updatedAt: '2026-03-20T19:05:00.000Z',
        messages: [
          {
            id: 'assistant-1',
            role: 'assistant',
            content: 'Wir halten den Fokus auf dem klaren nächsten Schritt und vermeiden doppelte Sekundärsignale.',
            timestamp: '2026-03-20T19:04:00.000Z'
          },
          {
            id: 'user-1',
            role: 'user',
            content: 'Bitte die Sekundärschichten eng an der Hauptlesart halten.',
            timestamp: '2026-03-20T19:05:00.000Z'
          }
        ],
        workrun: {
          focus: 'Den nächsten Review-Schritt festziehen',
          status: 'open',
          lastOutput: 'Den nächsten Review-Schritt festziehen',
          lastStep: 'Sekundärschichten auf Wiederholungen prüfen',
          nextStep: 'Den nächsten Review-Schritt festziehen',
          updatedAt: '2026-03-20T19:05:00.000Z',
          source: 'manual'
        },
        handoff: {
          status: 'active',
          achieved: 'Den nächsten Review-Schritt festziehen',
          openItems: ['Offene Risiken bündeln'],
          nextEntry: 'Den nächsten Review-Schritt festziehen',
          updatedAt: '2026-03-20T19:05:00.000Z',
          source: 'manual'
        },
        checkpointBoard: {
          title: 'Arbeitsboard',
          focus: 'Den nächsten Review-Schritt festziehen',
          updatedAt: '2026-03-20T19:05:00.000Z',
          source: 'manual',
          checkpoints: [
            {
              id: 'checkpoint-1',
              label: 'Offene Risiken bündeln',
              detail: 'Nur noch echte Zusatzsignale sichtbar lassen',
              status: 'open',
              source: 'manual',
              updatedAt: '2026-03-20T19:05:00.000Z'
            }
          ]
        },
        digest: {
          threadId: 'session-gating',
          title: 'Sekundärschichten prüfen',
          summary: 'Den nächsten Review-Schritt festziehen',
          currentState: 'Den nächsten Review-Schritt festziehen',
          openLoops: ['Offene Risiken bündeln'],
          nextEntry: 'Den nächsten Review-Schritt festziehen',
          confidence: 'high',
          updatedAt: '2026-03-20T19:05:00.000Z',
          sourceMessageCount: 2,
          needsRefresh: false
        }
      }
    ],
    workspaces: [
      {
        id: 'workspace-gating',
        title: 'Maya Klarheit',
        focus: 'Sekundärschichten nur bei Zusatzsignal zeigen',
        goal: 'Eine klare Hauptschicht mit wenigen nützlichen Sekundärschichten halten',
        currentState: 'Den nächsten Review-Schritt festziehen',
        openItems: ['Offene Risiken bündeln'],
        nextMilestone: 'Den nächsten Review-Schritt festziehen',
        threadIds: ['session-gating'],
        updatedAt: '2026-03-20T19:05:00.000Z',
        source: 'manual',
        status: 'active'
      }
    ]
  };

  await writeMayaState(page, seededState);

  const persisted = await readMayaState(page);
  expect(persisted.state.activeSessionId).toBe('session-gating');
  expect(Array.isArray(persisted.state.sessions)).toBe(true);
  expect((persisted.state.sessions as Array<{ id: string }>)[0]?.id).toBe('session-gating');

  await page.goto('/maya');
  await page.waitForURL(/\/maya$/);
  await expectMayaSurfaceHealthy(page);

  await expect(page.getByText('Arbeitsraum-Kontext', { exact: true })).toBeVisible();
  await expect(page.getByText('Aktiver Arbeitslauf', { exact: true })).toBeVisible();
  await expect(page.getByText('Aktueller Fokus', { exact: true })).toBeVisible();
  await expect(page.getByText('Nächster sinnvoller Schritt', { exact: true })).toBeVisible();
  await expect(page.getByText('Wichtigster offener Kernpunkt', { exact: true })).toBeVisible();

  await expect(page.getByText('Abschluss und Übergabe', { exact: true })).not.toBeVisible();
  await expect(page.getByText('Kontinuitäts-Briefing', { exact: true })).not.toBeVisible();
  await expect(page.getByText('Resume-Actions', { exact: true })).not.toBeVisible();
  await expect(page.getByText('Fadenkompass', { exact: true })).not.toBeVisible();

  await expect(page.getByText('Arbeitsraum-Stand', { exact: true })).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'In Composer übernehmen' }).first()).toBeVisible();

  const bodyText = await page.locator('body').innerText();
  expect(bodyText).toContain('Maya');
  expect(bodyText).not.toContain('Invalid Date');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/maya$/);
  await expectMayaSurfaceHealthy(page);
  await expect(page.getByText('Abschluss und Übergabe')).toHaveCount(0);
  await expect(page.getByText('Kontinuitäts-Briefing')).toHaveCount(0);
  await expect(page.getByText('Fadenkompass')).toHaveCount(0);
});

test('maya phase-2 acceptance keeps handoff visible when the thread is genuinely paused', async ({ page }) => {
  await loginToMayaViaApi(page);
  await writeMayaState(page, createParkableState());
  await page.goto('/maya', { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/maya$/);
  await expectMayaSurfaceHealthy(page);
  await closeReviewSheetIfVisible(page);

  await page.getByRole('button', { name: 'Thread parken' }).click();

  await expect.poll(async () => {
    const persisted = await page.evaluate(async () => {
      const response = await fetch('/api/state', { cache: 'no-store' });
      if (!response.ok) {
        return null;
      }

      return response.json().catch(() => null);
    });

    const state = persisted?.state as { sessions?: Array<{ handoff?: { status?: string } }> } | undefined;
    return state?.sessions?.[0]?.handoff?.status || null;
  }).toBe('paused');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/maya$/);
  await expectMayaSurfaceHealthy(page);
  await expect(page.getByText('Abschluss und Übergabe', { exact: true })).toBeVisible();
  await expect(page.getByText('Status: geparkt', { exact: true }).first()).toBeVisible();
});
