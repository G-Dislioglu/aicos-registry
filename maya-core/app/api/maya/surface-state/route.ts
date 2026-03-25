import { NextRequest, NextResponse } from 'next/server';

import { isMayaRequestAuthorized } from '@/lib/maya-auth';
import { readMayaSurfaceState } from '@/lib/maya-surface-state';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    return NextResponse.json(await readMayaSurfaceState());
  } catch {
    return NextResponse.json({ error: 'surface_state_failed' }, { status: 500 });
  }
}
