import { NextRequest, NextResponse } from 'next/server';

import { isMayaRequestAuthorized } from '@/lib/maya-auth';
import { getCostGuardState, getMemoryStoreCounts } from '@/lib/maya-memory-store';
import { getProviders } from '@/lib/maya-provider';
import { getExtractStatus } from '@/lib/maya-cognitive-engine';
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
    const extractStatus = await getExtractStatus();

    const providerStatus: Record<string, boolean> = {};
    for (const provider of providers) {
      providerStatus[provider.type] = provider.available;
    }

    const response: MayaHealthResponse = {
      status: costGuard.status === 'blocked' ? 'blocked' : costGuard.status === 'warning' ? 'degraded' : 'ok',
      costToday: costGuard.spentTodayCents,
      costWeek: costGuard.spentWeekCents,
      tokensToday: costGuard.tokensToday,
      storeCounts: {
        core: storeCounts.core || 0,
        working: storeCounts.working || 0,
        ephemeral: storeCounts.ephemeral || 0,
        event: storeCounts.event || 0,
        signal: storeCounts.signal || 0,
        proposed: storeCounts.proposed || 0,
        conflict: storeCounts.conflict || 0,
        total: storeCounts.total || 0
      },
      providerStatus,
      extractStatus: {
        enabled: extractStatus.enabled,
        lastRun: extractStatus.lastRun,
        lastLifecycleRun: extractStatus.lastLifecycleRun,
        extractCostToday: extractStatus.extractCostToday
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: 'health_check_failed' }, { status: 500 });
  }
}
