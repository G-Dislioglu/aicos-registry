import { NextRequest, NextResponse } from 'next/server';

import { isMayaRequestAuthorized } from '@/lib/maya-auth';
import { getCostGuardState, getMemoryStoreCounts } from '@/lib/maya-memory-store';
import { getProviders, detectDefaultProvider, getProvider } from '@/lib/maya-provider';
import { getExtractStatus } from '@/lib/maya-cognitive-engine';
import { getCalibrationMetrics } from '@/lib/maya-calibration-store';
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
    const calibrationMetrics = await getCalibrationMetrics();

    const defaultProviderType = detectDefaultProvider();
    const defaultProvider = getProvider(defaultProviderType);
    const isMockMode = defaultProviderType === 'mock';
    const hasRealProvider = providers.some(p => p.available && p.type !== 'mock');

    const providerStatus: Record<string, boolean> = {};
    for (const provider of providers) {
      providerStatus[provider.type] = provider.available;
    }

    // Determine FP trend (simplified - would need historical data for real trend)
    let fpTrend: 'improving' | 'stable' | 'worsening' = 'stable';
    if (calibrationMetrics.conflictFalsePositiveRate > 0.3) {
      fpTrend = 'worsening';
    } else if (calibrationMetrics.conflictFalsePositiveRate < 0.1) {
      fpTrend = 'improving';
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
      chatProvider: {
        ready: hasRealProvider,
        primaryProvider: defaultProviderType,
        primaryModel: defaultProvider?.defaultModel || 'mock',
        keyConfigured: hasRealProvider,
        isMockMode
      },
      extractStatus: {
        enabled: extractStatus.enabled,
        lastRun: extractStatus.lastRun,
        lastLifecycleRun: extractStatus.lastLifecycleRun,
        extractCostToday: extractStatus.extractCostToday
      },
      calibrationStatus: {
        pendingReviews: Math.round((1 - calibrationMetrics.reviewCoverageRate) * 
          (calibrationMetrics.eventCount + calibrationMetrics.conflictCount + 
           calibrationMetrics.proposedCount + calibrationMetrics.signalCount)),
        reviewCoverageRate: calibrationMetrics.reviewCoverageRate,
        falsePositiveTrend: fpTrend
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: 'health_check_failed' }, { status: 500 });
  }
}
