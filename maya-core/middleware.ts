import { NextRequest, NextResponse } from 'next/server';

import { isMayaAuthConfigured } from '@/lib/maya-env';

const MAYA_AUTH_COOKIE = 'maya_session';

function isPublicPath(pathname: string) {
  return pathname === '/login'
    || pathname === '/api/health'
    || pathname.startsWith('/api/auth')
    || pathname.startsWith('/_next')
    || pathname.startsWith('/icons')
    || pathname === '/icon.svg'
    || pathname === '/manifest.webmanifest'
    || pathname === '/favicon.ico'
    || pathname === '/sw.js';
}

function isApiPath(pathname: string) {
  return pathname.startsWith('/api/');
}

function getMayaLoginHref(nextPath = '/') {
  return `/login?next=${encodeURIComponent(nextPath)}`;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!isMayaAuthConfigured()) {
    if (isApiPath(pathname)) {
      return NextResponse.json({ error: 'maya_auth_not_configured' }, { status: 503 });
    }

    return NextResponse.redirect(new URL('/login?mode=misconfigured', request.url));
  }

  if (request.cookies.get(MAYA_AUTH_COOKIE)?.value) {
    return NextResponse.next();
  }

  if (isApiPath(pathname)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  return NextResponse.redirect(new URL(getMayaLoginHref(`${pathname}${search}`), request.url));
}

export const config = {
  matcher: ['/((?!.*\\..*).*)', '/api/:path*']
};
