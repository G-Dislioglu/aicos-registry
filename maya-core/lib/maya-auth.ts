import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

import { assertMayaAuthConfigured, isMayaAuthConfigured } from '@/lib/maya-env';
import { MAYA_AUTH_COOKIE, MayaSessionPayload, signMayaAuthPayload, verifyMayaEdgeTokenPayload } from '@/lib/maya-auth-edge';
import { readMayaStore, writeMayaStore } from '@/lib/maya-store';

export { MAYA_AUTH_COOKIE } from '@/lib/maya-auth-edge';

function toBase64Url(value: string) {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function stableHash(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest));
}

function buildSessionPayload(passphrase: string, authVersion: number): MayaSessionPayload {
  return { scope: 'maya-single-user', passphrase, authVersion };
}

async function getCurrentAuthVersion() {
  const store = await readMayaStore();
  return store.authVersion;
}

export async function createMayaSessionToken() {
  const config = assertMayaAuthConfigured();
  const payload = buildSessionPayload(config.passphrase, await getCurrentAuthVersion());
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = await signMayaAuthPayload(encodedPayload, config.authSecret);
  return `${encodedPayload}.${signature}`;
}

async function verifyToken(token: string) {
  const payload = await verifyMayaEdgeTokenPayload(token);

  if (!payload) {
    return false;
  }

  const currentAuthVersion = await getCurrentAuthVersion();

  return payload.authVersion === currentAuthVersion;
}

export async function isMayaPassphraseValid(input: string) {
  const config = assertMayaAuthConfigured();
  const candidate = input.trim();

  if (!candidate) {
    return false;
  }

  const [candidateHash, expectedHash] = await Promise.all([stableHash(candidate), stableHash(config.passphrase)]);

  if (candidateHash.length !== expectedHash.length) {
    return false;
  }

  return candidateHash.every((value, index) => value === expectedHash[index]);
}

export function hasMayaSessionCookie(request: NextRequest) {
  return Boolean(request.cookies.get(MAYA_AUTH_COOKIE)?.value);
}

export async function isMayaRequestAuthorized(request: NextRequest) {
  const token = request.cookies.get(MAYA_AUTH_COOKIE)?.value;

  if (!token) {
    return false;
  }

  return verifyToken(token);
}

export async function isMayaSessionAuthorized() {
  const token = cookies().get(MAYA_AUTH_COOKIE)?.value;

  if (!token) {
    return false;
  }

  return verifyToken(token);
}

export function getMayaLoginHref(nextPath = '/') {
  return `/login?next=${encodeURIComponent(nextPath)}`;
}

export async function requireMayaPageAuth(nextPath = '/') {
  if (!isMayaAuthConfigured()) {
    redirect('/login?mode=misconfigured');
  }

  if (!(await isMayaSessionAuthorized())) {
    redirect(getMayaLoginHref(nextPath));
  }
}

export async function getMayaAuthStatus() {
  if (!isMayaAuthConfigured()) {
    return {
      authorized: false,
      configured: false
    };
  }

  return {
    authorized: await isMayaSessionAuthorized(),
    configured: true
  };
}

export async function revokeMayaSessions() {
  const store = await readMayaStore();
  await writeMayaStore({
    ...store,
    authVersion: store.authVersion + 1
  });
}
