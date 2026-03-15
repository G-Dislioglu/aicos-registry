import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

import { assertMayaAuthConfigured, isMayaAuthConfigured } from '@/lib/maya-env';

export const MAYA_AUTH_COOKIE = 'maya_session';

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

function buildExpectedPayload(passphrase: string) {
  return JSON.stringify({ scope: 'maya-single-user', passphrase });
}

export async function createMayaSessionToken() {
  const config = assertMayaAuthConfigured();
  const payload = buildExpectedPayload(config.passphrase);
  const encodedPayload = toBase64Url(payload);
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

  return encodedPayload === toBase64Url(buildExpectedPayload(config.passphrase));
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
