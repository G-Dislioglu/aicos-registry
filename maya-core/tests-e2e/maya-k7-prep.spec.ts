import { expect, Page, test } from '@playwright/test';
 import { createHmac } from 'crypto';
 import { promises as fs } from 'fs';
 import path from 'path';

 const DATA_DIRECTORY = path.join(process.cwd(), 'data');
 const STORE_FILE_PATH = path.join(DATA_DIRECTORY, 'maya-store.json');
 const ENV_FILE_PATH = path.join(process.cwd(), '.env.local');

 async function readOptionalFile(filePath: string) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }

    throw error;
  }
 }

 async function seedMayaState(state: Record<string, unknown>) {
  await fs.mkdir(DATA_DIRECTORY, { recursive: true });
  await fs.writeFile(STORE_FILE_PATH, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
 }

 async function restoreMayaState(previousStore: string | null) {
  if (previousStore === null) {
    await fs.rm(STORE_FILE_PATH, { force: true });
    return;
  }

  await fs.mkdir(DATA_DIRECTORY, { recursive: true });
  await fs.writeFile(STORE_FILE_PATH, previousStore, 'utf8');
 }

 async function readEnvValue(name: string, fallback: string) {
  const runtimeValue = String(process.env[name] || '').trim();

  if (runtimeValue) {
    return runtimeValue;
  }

  const envFile = await readOptionalFile(ENV_FILE_PATH);

  if (!envFile) {
    return fallback;
  }

  for (const rawLine of envFile.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');

    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (key !== name) {
      continue;
    }

    return line.slice(separatorIndex + 1).trim() || fallback;
  }

  return fallback;
 }

 async function createMayaSessionToken(authVersion: number) {
  const passphrase = await readEnvValue('MAYA_PASSPHRASE', 'geselle');
  const authSecret = await readEnvValue('MAYA_AUTH_SECRET', 'maya-local-auth-secret');
  const encodedPayload = Buffer.from(JSON.stringify({
    scope: 'maya-single-user',
    passphrase,
    authVersion
  })).toString('base64url');
  const signature = createHmac('sha256', authSecret).update(encodedPayload).digest('base64url');

  return `${encodedPayload}.${signature}`;
 }

 async function authorizeMayaSession(page: Page, authVersion: number) {
  const token = await createMayaSessionToken(authVersion);

  await page.context().addCookies([
    {
      name: 'maya_session',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax'
    }
  ]);
 }

async function expectMayaSurfaceHealthy(page: Page) {
  await expect(page.locator('body')).not.toContainText('Invalid Date');
  await expect(page.locator('body')).not.toContainText('Hydration failed');
  await expect(page.locator('body')).not.toContainText('Unhandled Runtime Error');
  await expect(page.getByRole('textbox', { name: 'Nachricht an Maya' })).toBeVisible({ timeout: 15000 });
}

function createK7PrepState() {
  return {
    language: 'de',
    activeProjectId: 'maya-core',
    activeSessionId: 'session-k7-prep',
    activeWorkspaceId: 'workspace-k7-prep',
    authVersion: 1,
    sessions: [
      {
        id: 'session-k7-prep',
        title: 'K7 Guardrail Thread',
        intent: 'Die zentrale Maya-Hauptfläche vor UI-Zerlegungen stabil halten.',
        workspaceId: 'workspace-k7-prep',
        createdAt: '2026-03-20T21:00:00.000Z',
        updatedAt: '2026-03-20T21:05:00.000Z',
        messages: [
          {
            id: 'assistant-k7-1',
            role: 'assistant',
            content: 'Die Hauptfläche ist in einem stabilen Zustand und bereit für den Guardrail-Snapshot.',
            timestamp: '2026-03-20T21:04:00.000Z'
          },
          {
            id: 'user-k7-1',
            role: 'user',
            content: 'Halte Fokus, Arbeitslauf und Board sichtbar, aber vermeide unnötige dynamische Sektionen.',
            timestamp: '2026-03-20T21:05:00.000Z'
          }
        ],
        workrun: {
          focus: 'K7-Guardrail stabilisieren',
          status: 'open',
          lastOutput: 'Die visuelle Hauptzone ist für den Refactor-Vergleich eingefroren.',
          lastStep: 'Stabile Vor-K7-Ansicht festlegen',
          nextStep: 'Erste kleine Extraktion gegen Guardrail prüfen',
          updatedAt: '2026-03-20T21:05:00.000Z',
          source: 'manual'
        },
        checkpointBoard: {
          title: 'Arbeitsboard',
          focus: 'K7-Guardrail stabilisieren',
          updatedAt: '2026-03-20T21:05:00.000Z',
          source: 'manual',
          checkpoints: [
            {
              id: 'checkpoint-k7-1',
              label: 'Smoke-Test hält Hauptfläche sichtbar',
              detail: 'Composer und Kernsektionen müssen ohne Laufzeitfehler erscheinen',
              status: 'open',
              source: 'manual',
              updatedAt: '2026-03-20T21:05:00.000Z'
            }
          ]
        },
        digest: {
          threadId: 'session-k7-prep',
          title: 'K7 Guardrail Thread',
          summary: 'Die Hauptfläche ist in einem stabilen Zustand und bereit für den Guardrail-Snapshot.',
          currentState: 'Die erste Refactor-Stufe soll gegen eine feste Vorher-Ansicht geprüft werden.',
          openLoops: ['Erste kleine Extraktion gegen Guardrail prüfen'],
          nextEntry: 'Erste kleine Extraktion gegen Guardrail prüfen',
          confidence: 'high',
          updatedAt: '2026-03-20T21:05:00.000Z',
          sourceMessageCount: 2,
          needsRefresh: false
        }
      }
    ],
    workspaces: [
      {
        id: 'workspace-k7-prep',
        title: 'K7 Prep',
        focus: 'UI-Zerlegung mit minimalem visuellen Risiko ausführen',
        goal: 'Die Maya-Hauptfläche soll bei kleinen Komponenten-Extraktionen sichtbar stabil bleiben',
        currentState: 'Die Vorher-Ansicht ist eingefroren und kann mit späteren Refactor-Zuständen verglichen werden.',
        openItems: ['Erste kleine Extraktion gegen Guardrail prüfen'],
        nextMilestone: 'Erste kleine Extraktion gegen Guardrail prüfen',
        threadIds: ['session-k7-prep'],
        updatedAt: '2026-03-20T21:05:00.000Z',
        source: 'manual',
        status: 'active'
      }
    ]
  };
}

async function openK7PrepSurface(page: Page) {
  const seededState = createK7PrepState();
  const previousStore = await readOptionalFile(STORE_FILE_PATH);

  await seedMayaState(seededState);

  try {
    await authorizeMayaSession(page, Number(seededState.authVersion || 1));
    await page.setViewportSize({ width: 1440, height: 1400 });
    await page.goto('/maya', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/maya$/);
    await expectMayaSurfaceHealthy(page);
    await expect(page.locator('#k4-maya-runtime')).toBeVisible();
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation: none !important;
          transition: none !important;
          caret-color: transparent !important;
        }
      `
    });
  } catch (error) {
    await restoreMayaState(previousStore);
    throw error;
  }

  test.info().attach('k7-prep-store-seeded', {
    body: JSON.stringify(seededState, null, 2),
    contentType: 'application/json'
  });

  return async () => {
    await restoreMayaState(previousStore);
  };
}

test('k7 prep smoke keeps the core /maya surface visible and healthy', async ({ page }) => {
  const restoreState = await openK7PrepSurface(page);

  try {
    await expect(page.getByText('Maya Brief', { exact: true })).toBeVisible();
    await expect(page.getByText('Next Step Hero', { exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Nachricht an Maya' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Review öffnen/ })).toBeVisible();
  } finally {
    await restoreState();
  }
});

test('k7 prep snapshot preserves the central /maya runtime zone', async ({ page }) => {
  const restoreState = await openK7PrepSurface(page);

  try {
    const runtimeZone = page.locator('#k4-maya-runtime');
    await expect(runtimeZone).toHaveScreenshot('maya-k7-prep-runtime.png');
  } finally {
    await restoreState();
  }
});
