import { NextRequest, NextResponse } from 'next/server';

import { isMayaRequestAuthorized } from '@/lib/maya-auth';
import { getPostgresCapabilityErrorResponse } from '@/lib/maya-capabilities';
import { generateProposed } from '@/lib/maya-cognitive-engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const capabilityError = getPostgresCapabilityErrorResponse('maya_proposed');
  if (capabilityError) {
    return capabilityError;
  }

  try {
    const proposed = await generateProposed();

    return NextResponse.json({
      success: true,
      count: proposed.length,
      proposed: proposed.map(p => ({
        id: p.id,
        topic: p.topic,
        content: p.content,
        confidence: p.confidence
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: 'proposed_generation_failed' }, { status: 500 });
  }
}
