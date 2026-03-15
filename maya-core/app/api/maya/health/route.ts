import { NextRequest, NextResponse } from 'next/server';

import { isMayaRequestAuthorized } from '@/lib/maya-auth';
import { getCostGuardState, getMemoryStoreCounts } from '@/lib/maya-memory-store';
import { getExtractStatus } from '@/lib/maya-cognitive-engine';
import { getCalibrationMetrics } from '@/lib/maya-calibration-store';
import { MayaHealthResponse } from '@/lib/maya-spec-types';
import {
  PROVIDER_REGISTRY,
  getRoleDefaults,
  isProviderKeyConfigured
} from '@/lib/maya-provider-registry';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const costGuard = await getCostGuardState();
    const storeCounts = await getMemoryStoreCounts();
    const extractStatus = await getExtractStatus();
    const calibrationMetrics = await getCalibrationMetrics();
    const roleDefaults = getRoleDefaults();

    // Build provider status from registry
    const providerStatus: Record<string, boolean> = {};
    for (const provider of PROVIDER_REGISTRY) {
      providerStatus[provider.id] = isProviderKeyConfigured(provider.id);
    }

    // Determine primary provider and model
    const workerDefault = roleDefaults.worker_default;
    const hasRealProvider = PROVIDER_REGISTRY.some(p => p.id !== 'mock' && isProviderKeyConfigured(p.id));
    const isMockMode = !hasRealProvider;

    // Determine FP trend
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
        primaryProvider: workerDefault?.providerId || 'mock',
        primaryModel: workerDefault?.modelId || 'mock',
        keyConfigured: hasRealProvider,
        isMockMode
      },
      roleDefaults: {
        scout: roleDefaults.scout_default ? { providerId: roleDefaults.scout_default.providerId, modelId: roleDefaults.scout_default.modelId } : null,
        worker: roleDefaults.worker_default ? { providerId: roleDefaults.worker_default.providerId, modelId: roleDefaults.worker_default.modelId } : null,
        reasoner: roleDefaults.reasoner_default ? { providerId: roleDefaults.reasoner_default.providerId, modelId: roleDefaults.reasoner_default.modelId } : null,
        vision: roleDefaults.vision_default ? { providerId: roleDefaults.vision_default.providerId, modelId: roleDefaults.vision_default.modelId } : null,
        tts: roleDefaults.tts_default ? { providerId: roleDefaults.tts_default.providerId, modelId: roleDefaults.tts_default.modelId } : null
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
