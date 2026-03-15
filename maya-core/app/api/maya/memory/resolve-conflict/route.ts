import { NextRequest, NextResponse } from 'next/server';

import { isMayaRequestAuthorized } from '@/lib/maya-auth';
import { getMemoryEntry, updateMemoryEntry, createMemoryEntry, createAuditEntry } from '@/lib/maya-memory-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const memoryId = body.memoryId;
    const action = body.action; // 'keep_both' | 'prefer_new' | 'prefer_old' | 'merge'
    const mergedContent = body.mergedContent;

    if (!memoryId || !action) {
      return NextResponse.json({ error: 'memory_id_and_action_required' }, { status: 400 });
    }

    const entry = await getMemoryEntry(memoryId);
    if (!entry) {
      return NextResponse.json({ error: 'entry_not_found' }, { status: 404 });
    }

    if (!entry.contradictsId) {
      return NextResponse.json({ error: 'entry_has_no_conflict' }, { status: 400 });
    }

    const oldEntry = await getMemoryEntry(entry.contradictsId);

    let result;

    switch (action) {
      case 'keep_both':
        // Just clear the conflict marker
        result = await updateMemoryEntry(memoryId, { contradictsId: null });
        break;

      case 'prefer_new':
        // Archive old entry
        if (oldEntry) {
          await updateMemoryEntry(oldEntry.id, {
            isDeleted: true,
            archivedAt: new Date().toISOString()
          });
        }
        result = await updateMemoryEntry(memoryId, { contradictsId: null });
        break;

      case 'prefer_old':
        // Archive new entry
        result = await updateMemoryEntry(memoryId, {
          isDeleted: true,
          archivedAt: new Date().toISOString()
        });
        break;

      case 'merge':
        if (!mergedContent) {
          return NextResponse.json({ error: 'merged_content_required' }, { status: 400 });
        }
        // Create new merged entry
        const merged = await createMemoryEntry({
          tier: entry.tier,
          category: entry.category,
          topic: entry.topic,
          content: mergedContent,
          confidence: Math.max(entry.confidence, oldEntry?.confidence || 50),
          domain: entry.domain,
          source: 'user',
          ttlDays: null,
          expiresAt: null,
          assumption: false,
          contradictsId: null
        });
        // Archive both originals
        await updateMemoryEntry(memoryId, { isDeleted: true, archivedAt: new Date().toISOString() });
        if (oldEntry) {
          await updateMemoryEntry(oldEntry.id, { isDeleted: true, archivedAt: new Date().toISOString() });
        }
        result = merged;
        break;

      default:
        return NextResponse.json({ error: 'invalid_action' }, { status: 400 });
    }

    await createAuditEntry({
      action: 'memory_resolve_conflict',
      entityId: memoryId,
      entityType: 'memory',
      detailsJson: JSON.stringify({ action, contradictsId: entry.contradictsId }),
      actor: 'user'
    });

    return NextResponse.json({ entry: result, status: 'resolved', action });
  } catch (error) {
    return NextResponse.json({ error: 'resolve_failed' }, { status: 500 });
  }
}
