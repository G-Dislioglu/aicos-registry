import { NextRequest, NextResponse } from 'next/server';

import { isMayaRequestAuthorized } from '@/lib/maya-auth';
import { buildContext } from '@/lib/maya-context-builder';
import { getCostGuardState, getMemoryStoreCounts } from '@/lib/maya-memory-store';
import { getMemoryEntries } from '@/lib/maya-memory-store';
import { getExtractStatus } from '@/lib/maya-cognitive-engine';
import { Briefing, BriefingSlot } from '@/lib/maya-spec-types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'personal';

    // Build context
    const context = await buildContext(mode as 'personal' | 'soulmatch_studio' | 'aicos_studio');

    // Get memory entries by tier
    const [allEntries, proposedEntries, conflictEntries, signalEntries] = await Promise.all([
      getMemoryEntries({ includeDeleted: false, limit: 20 }),
      getMemoryEntries({ tier: 'proposed', includeDeleted: false, limit: 5 }),
      getMemoryEntries({ tier: 'conflict', includeDeleted: false, limit: 5 }),
      getMemoryEntries({ tier: 'signal', includeDeleted: false, limit: 5 })
    ]);

    // Get cost state
    const costGuard = await getCostGuardState();
    const storeCounts = await getMemoryStoreCounts();
    const extractStatus = await getExtractStatus();

    // Build context summary
    const contextSummary = context.contextEntries
      .slice(0, 5)
      .map(e => `[${e.tier}] ${e.topic}: ${e.content.slice(0, 100)}`)
      .join('\n');

    // Build proposed slots from proposed tier
    const openProposed: BriefingSlot[] = proposedEntries.map(e => ({
      id: `proposed-${e.id}`,
      type: 'proposed' as const,
      title: e.topic,
      summary: e.content.slice(0, 150),
      entityId: e.id,
      confidence: e.confidence,
      createdAt: e.createdAt
    }));

    // Build conflict slots from conflict tier
    const conflicts: BriefingSlot[] = conflictEntries.map(e => ({
      id: `conflict-${e.id}`,
      type: 'conflict' as const,
      title: e.topic,
      summary: e.content.slice(0, 150),
      entityId: e.id,
      severity: e.severity,
      createdAt: e.createdAt
    }));

    // Build signal slots
    const signals: BriefingSlot[] = signalEntries.map(e => ({
      id: `signal-${e.id}`,
      type: 'signal' as const,
      title: e.topic,
      summary: e.content.slice(0, 150),
      entityId: e.id,
      createdAt: e.createdAt
    }));

    const briefing: Briefing = {
      contextSummary,
      openProposed,
      conflicts,
      signals,
      costToday: costGuard.spentTodayCents,
      tokensToday: costGuard.tokensToday,
      extractStats: {
        lastRun: extractStatus.lastRun,
        eventsExtracted: extractStatus.eventsExtractedToday,
        conflictsDetected: extractStatus.conflictsDetectedToday
      },
      generatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      briefing,
      context: {
        tokenCount: context.tokenCount,
        anchors: context.anchors,
        entryCount: context.contextEntries.length
      },
      storeCounts,
      costGuard: {
        status: costGuard.status,
        spentToday: costGuard.spentTodayCents,
        budget: costGuard.dailyBudgetCents
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'briefing_failed' }, { status: 500 });
  }
}
