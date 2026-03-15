import { NextRequest, NextResponse } from 'next/server';

import { isMayaRequestAuthorized } from '@/lib/maya-auth';
import { getMemoryEntry, updateMemoryEntry, createAuditEntry } from '@/lib/maya-memory-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const memoryId = body.memoryId;

    if (!memoryId) {
      return NextResponse.json({ error: 'memory_id_required' }, { status: 400 });
    }

    const entry = await getMemoryEntry(memoryId);
    if (!entry) {
      return NextResponse.json({ error: 'entry_not_found' }, { status: 404 });
    }

    // Confirm: increase confidence, mark as user-verified
    const updated = await updateMemoryEntry(memoryId, {
      confidence: Math.min(100, entry.confidence + 20),
      source: 'user'
    });

    await createAuditEntry({
      action: 'memory_confirm',
      entityId: memoryId,
      entityType: 'memory',
      detailsJson: JSON.stringify({ previousConfidence: entry.confidence, newConfidence: updated?.confidence }),
      actor: 'user'
    });

    return NextResponse.json({ entry: updated, status: 'confirmed' });
  } catch (error) {
    return NextResponse.json({ error: 'confirm_failed' }, { status: 500 });
  }
}
