import { NextRequest, NextResponse } from 'next/server';

import { isMayaRequestAuthorized } from '@/lib/maya-auth';
import { getPostgresCapabilityErrorResponse } from '@/lib/maya-capabilities';
import {
  getMemoryEntries,
  getMemoryEntry,
  createMemoryEntry,
  updateMemoryEntry,
  createAuditEntry
} from '@/lib/maya-memory-store';
import { MemoryTier, MemoryCategory } from '@/lib/maya-spec-types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const capabilityError = getPostgresCapabilityErrorResponse('maya_memory');
  if (capabilityError) {
    return capabilityError;
  }

  try {
    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier') as MemoryTier | null;
    const category = searchParams.get('category') as MemoryCategory | null;
    const id = searchParams.get('id');

    if (id) {
      const entry = await getMemoryEntry(id);
      if (!entry) {
        return NextResponse.json({ error: 'entry_not_found' }, { status: 404 });
      }
      return NextResponse.json({ entry });
    }

    const entries = await getMemoryEntries({
      tier: tier || undefined,
      category: category || undefined,
      includeDeleted: false,
      limit: 100
    });

    return NextResponse.json({ entries, count: entries.length });
  } catch (error) {
    return NextResponse.json({ error: 'memory_read_failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const capabilityError = getPostgresCapabilityErrorResponse('maya_memory');
  if (capabilityError) {
    return capabilityError;
  }

  try {
    const body = await request.json();
    const entry = await createMemoryEntry({
      tier: body.tier || 'working',
      category: body.category || 'insight',
      topic: body.topic || '',
      content: body.content || '',
      confidence: body.confidence || 50,
      domain: body.domain || 'personal',
      source: body.source || 'user',
      ttlDays: body.ttlDays || null,
      expiresAt: body.expiresAt || null,
      assumption: body.assumption || false,
      contradictsId: body.contradictsId || null,
      severity: body.severity || 1,
      reviewStatus: body.reviewStatus || 'pending',
      metaJson: body.metaJson || '{}'
    });

    await createAuditEntry({
      action: 'memory_create',
      entityId: entry.id,
      entityType: 'memory',
      detailsJson: JSON.stringify({ tier: entry.tier, topic: entry.topic }),
      actor: 'user'
    });

    return NextResponse.json({ entry, status: 'proposed' });
  } catch (error) {
    return NextResponse.json({ error: 'memory_create_failed' }, { status: 500 });
  }
}
