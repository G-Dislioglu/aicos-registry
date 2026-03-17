import { NextRequest, NextResponse } from 'next/server';

import { isMayaRequestAuthorized } from '@/lib/maya-auth';
import { getPostgresCapabilityErrorResponse } from '@/lib/maya-capabilities';
import { getMemoryEntry, updateMemoryEntry, createAuditEntry } from '@/lib/maya-memory-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const capabilityError = getPostgresCapabilityErrorResponse('maya_memory_deny');
  if (capabilityError) {
    return capabilityError;
  }

  try {
    const body = await request.json();
    const memoryId = body.memoryId;
    const reason = body.reason || '';

    if (!memoryId) {
      return NextResponse.json({ error: 'memory_id_required' }, { status: 400 });
    }

    const entry = await getMemoryEntry(memoryId);
    if (!entry) {
      return NextResponse.json({ error: 'entry_not_found' }, { status: 404 });
    }

    // Deny: soft delete
    const updated = await updateMemoryEntry(memoryId, {
      isDeleted: true,
      archivedAt: new Date().toISOString()
    });

    await createAuditEntry({
      action: 'memory_deny',
      entityId: memoryId,
      entityType: 'memory',
      detailsJson: JSON.stringify({ reason, previousConfidence: entry.confidence }),
      actor: 'user'
    });

    return NextResponse.json({ entry: updated, status: 'denied' });
  } catch (error) {
    return NextResponse.json({ error: 'deny_failed' }, { status: 500 });
  }
}
