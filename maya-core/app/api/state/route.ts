import { NextRequest, NextResponse } from 'next/server';

import { isMayaSessionAuthorized } from '@/lib/maya-auth';
import { readMayaStore, writeMayaStore } from '@/lib/maya-store';
import { MayaStore } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  if (!(await isMayaSessionAuthorized())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const state = await readMayaStore();
  return NextResponse.json({ state }, { status: 200 });
}

export async function PUT(request: NextRequest) {
  if (!(await isMayaSessionAuthorized())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as unknown;
    const nextState = body && typeof body === 'object' && 'state' in body ? (body as { state?: Partial<MayaStore> }).state : (body as Partial<MayaStore> | undefined);

    if (!nextState) {
      return NextResponse.json({ error: 'state_required' }, { status: 400 });
    }

    const state = await writeMayaStore(nextState);
    return NextResponse.json({ state }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'invalid_state' }, { status: 400 });
  }
}
