import { NextRequest, NextResponse } from 'next/server';

import { isMayaRequestAuthorized } from '@/lib/maya-auth';
import { buildContext } from '@/lib/maya-context-builder';
import { getCostGuardState, getMemoryStoreCounts } from '@/lib/maya-memory-store';
import { getMemoryEntries } from '@/lib/maya-memory-store';
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

    // Get memory entries with proposed status (simulated - in real impl, would have status field)
    const memoryEntries = await getMemoryEntries({ includeDeleted: false, limit: 20 });

    // Find potential conflicts (entries with contradictsId)
    const conflicts = memoryEntries.filter(e => e.contradictsId);

    // Get cost state
    const costGuard = await getCostGuardState();
    const storeCounts = await getMemoryStoreCounts();

    // Build context summary
    const contextSummary = context.contextEntries
      .slice(0, 5)
      .map(e => `[${e.tier}] ${e.topic}: ${e.content.slice(0, 100)}`)
      .join('\n');

    // Build proposed slots (entries that might need confirmation)
    const openProposed: BriefingSlot[] = memoryEntries
      .filter(e => e.source === 'inferred' && e.confidence < 80)
      .slice(0, 3)
      .map(e => ({
        id: `proposed-${e.id}`,
        type: 'proposed' as const,
        title: e.topic,
        summary: e.content.slice(0, 150),
        entityId: e.id,
        createdAt: e.createdAt
      }));

    // Build conflict slot
    const conflictSlot: BriefingSlot | null = conflicts.length > 0 ? {
      id: `conflict-${conflicts[0].id}`,
      type: 'conflict' as const,
      title: `Memory Conflict: ${conflicts[0].topic}`,
      summary: `Entry contradicts ${conflicts[0].contradictsId}`,
      entityId: conflicts[0].id,
      createdAt: conflicts[0].createdAt
    } : null;

    const briefing: Briefing = {
      contextSummary,
      openProposed,
      conflictSlot,
      costToday: costGuard.spentTodayCents,
      tokensToday: costGuard.tokensToday,
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
