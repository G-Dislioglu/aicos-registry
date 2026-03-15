import { NextRequest, NextResponse } from 'next/server';

import { createMayaSessionToken, isMayaPassphraseValid, MAYA_AUTH_COOKIE } from '@/lib/maya-auth';
import { isMayaAuthConfigured } from '@/lib/maya-env';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getCookieOptions() {
  return {
    httpOnly: true,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production' && process.env.RENDER === 'true',
    maxAge: 60 * 60 * 24 * 30
  };
}

export async function POST(request: NextRequest) {
  if (!isMayaAuthConfigured()) {
    return NextResponse.json({ error: 'maya_auth_not_configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const passphrase = String(body?.passphrase || '');

    if (!(await isMayaPassphraseValid(passphrase))) {
      return NextResponse.json({ error: 'invalid_passphrase' }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true }, { status: 200 });
    response.cookies.set(MAYA_AUTH_COOKIE, await createMayaSessionToken(), getCookieOptions());
    return response;
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
}
