import { NextResponse } from 'next/server';

import { isMayaSessionAuthorized, MAYA_AUTH_COOKIE, revokeMayaSessions } from '@/lib/maya-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  if (await isMayaSessionAuthorized()) {
    await revokeMayaSessions();
  }

  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.cookies.set(MAYA_AUTH_COOKIE, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' && process.env.RENDER === 'true',
    maxAge: 0
  });
  return response;
}
