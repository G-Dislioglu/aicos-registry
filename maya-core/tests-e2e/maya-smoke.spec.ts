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
  await page.goto('/maya');

  await expect(page).toHaveURL(/\/login\?next=%2Fmaya/);
  await expect(page.getByRole('heading', { name: 'Single-user access' })).toBeVisible();

  await page.getByLabel('Passphrase').fill('geselle');
  await page.getByRole('button', { name: 'Open Maya' }).click();
  await page.waitForURL(/\/maya$/);
}

async function expectMayaSurfaceHealthy(page: Page) {
  await expect(page.locator('body')).not.toContainText('Invalid Date');
  await expect(page.locator('body')).not.toContainText('Hydration failed');
  await expect(page.locator('body')).not.toContainText('Unhandled Runtime Error');
  await expect(page.getByRole('textbox')).toBeVisible();
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

test('maya login flow opens the main workspace without obvious surface breakage', async ({ page }) => {
  await loginToMaya(page);
  await expectMayaSurfaceHealthy(page);

  const bodyText = await page.locator('body').innerText();
  expect(bodyText).toContain('Maya');

  await page.reload();
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

  await page.reload();
  await page.waitForURL(/\/maya$/);
  await expectMayaSurfaceHealthy(page);
  await expect(page.getByText('Abschluss und Übergabe')).toHaveCount(0);
  await expect(page.getByText('Kontinuitäts-Briefing')).toHaveCount(0);
  await expect(page.getByText('Fadenkompass')).toHaveCount(0);
});

test('maya phase-2 acceptance keeps handoff visible when the thread is genuinely paused', async ({ page }) => {
  await loginToMaya(page);
  await expectMayaSurfaceHealthy(page);

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

  await page.reload();
  await page.waitForURL(/\/maya$/);
  await expectMayaSurfaceHealthy(page);
  await expect(page.getByText('Abschluss und Übergabe', { exact: true })).toBeVisible();
  await expect(page.getByText('Status: geparkt', { exact: true }).first()).toBeVisible();
});
