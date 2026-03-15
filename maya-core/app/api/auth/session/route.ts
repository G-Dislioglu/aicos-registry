import { NextResponse } from 'next/server';

import { getMayaAuthStatus } from '@/lib/maya-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const status = await getMayaAuthStatus();
  return NextResponse.json(status, { status: status.configured ? 200 : 503 });
}
