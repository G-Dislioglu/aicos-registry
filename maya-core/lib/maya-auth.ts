import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

import { assertMayaAuthConfigured, isMayaAuthConfigured } from '@/lib/maya-env';
import { readMayaStore, writeMayaStore } from '@/lib/maya-store';

export const MAYA_AUTH_COOKIE = 'maya_session';

type MayaSessionPayload = {
  authVersion: number;
  passphrase: string;
  scope: 'maya-single-user';
};

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function toBase64Url(value: string) {
  return bytesToBase64Url(new TextEncoder().encode(value));
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return atob(padded);
}

async function signPayload(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

async function stableHash(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest));
}

function buildSessionPayload(passphrase: string, authVersion: number): MayaSessionPayload {
  return { scope: 'maya-single-user', passphrase, authVersion };
}

function readPayload(encodedPayload: string) {
  try {
    const parsed = JSON.parse(fromBase64Url(encodedPayload)) as Partial<MayaSessionPayload>;

    if (parsed.scope !== 'maya-single-user' || typeof parsed.passphrase !== 'string') {
      return null;
    }

    return {
      scope: 'maya-single-user' as const,
      passphrase: parsed.passphrase,
      authVersion: Number.isInteger(parsed.authVersion) && Number(parsed.authVersion) > 0 ? Number(parsed.authVersion) : 0
    };
  } catch {
    return null;
  }
}

async function getCurrentAuthVersion() {
  const store = await readMayaStore();
  return store.authVersion;
}

export async function createMayaSessionToken() {
  const config = assertMayaAuthConfigured();
  const payload = buildSessionPayload(config.passphrase, await getCurrentAuthVersion());
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = await signPayload(encodedPayload, config.authSecret);
  return `${encodedPayload}.${signature}`;
}

async function verifyToken(token: string) {
  const config = assertMayaAuthConfigured();
  const [encodedPayload, signature] = token.split('.');

  if (!encodedPayload || !signature) {
    return false;
  }

  const expectedSignature = await signPayload(encodedPayload, config.authSecret);

  if (signature !== expectedSignature) {
    return false;
  }

  const payload = readPayload(encodedPayload);

  if (!payload) {
    return false;
  }

  const currentAuthVersion = await getCurrentAuthVersion();

  return payload.passphrase === config.passphrase && payload.authVersion === currentAuthVersion;
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
