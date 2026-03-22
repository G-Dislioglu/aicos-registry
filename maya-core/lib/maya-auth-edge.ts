import { NextRequest } from 'next/server';

import { assertMayaAuthConfigured } from '@/lib/maya-env';

export const MAYA_AUTH_COOKIE = 'maya_session';

export type MayaSessionPayload = {
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

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return atob(padded);
}

export async function signMayaAuthPayload(payload: string, secret: string) {
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

export async function verifyMayaEdgeTokenPayload(token: string) {
  const config = assertMayaAuthConfigured();
  const [encodedPayload, signature] = token.split('.');

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = await signMayaAuthPayload(encodedPayload, config.authSecret);

  if (signature !== expectedSignature) {
    return null;
  }

  const payload = readPayload(encodedPayload);

  if (!payload || payload.passphrase !== config.passphrase) {
    return null;
  }

  return payload;
}

export async function isMayaRequestEdgeAuthorized(request: NextRequest) {
  const token = request.cookies.get(MAYA_AUTH_COOKIE)?.value;

  if (!token) {
    return false;
  }

  return Boolean(await verifyMayaEdgeTokenPayload(token));
}
