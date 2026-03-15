import { NextRequest, NextResponse } from 'next/server';

import { isMayaRequestAuthorized } from '@/lib/maya-auth';
import { getCostGuardState, getMemoryStoreCounts } from '@/lib/maya-memory-store';
import { getProviders } from '@/lib/maya-provider';
import { MayaHealthResponse } from '@/lib/maya-spec-types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const costGuard = await getCostGuardState();
    const storeCounts = await getMemoryStoreCounts();
    const providers = getProviders();

    const providerStatus: Record<string, boolean> = {};
    for (const provider of providers) {
      providerStatus[provider.type] = provider.available;
    }

    const response: MayaHealthResponse = {
      status: costGuard.status === 'blocked' ? 'blocked' : costGuard.status === 'warning' ? 'degraded' : 'ok',
      costToday: costGuard.spentTodayCents,
      costWeek: costGuard.spentWeekCents,
      tokensToday: costGuard.tokensToday,
      storeCounts,
      providerStatus
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: 'health_check_failed' }, { status: 500 });
  }
}
