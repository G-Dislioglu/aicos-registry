import { NextRequest, NextResponse } from 'next/server';

import { isMayaRequestAuthorized } from '@/lib/maya-auth';
import { getPostgresCapabilityErrorResponse } from '@/lib/maya-capabilities';
import { createReview, getReviews, getReviewQueue } from '@/lib/maya-calibration-store';
import { MemoryTier, ReviewLabel, ReviewType } from '@/lib/maya-spec-types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const capabilityError = getPostgresCapabilityErrorResponse('maya_review');
  if (capabilityError) {
    return capabilityError;
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';

    if (action === 'queue') {
      // Get review queue
      const queue = await getReviewQueue({
        tier: searchParams.get('tier') as MemoryTier | undefined,
        unresolvedOnly: searchParams.get('unresolved') === 'true',
        lastHours: searchParams.get('hours') ? parseInt(searchParams.get('hours')!, 10) : 168,
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20
      });

      return NextResponse.json({ queue, count: queue.length });
    }

    // Get reviews list
    const reviews = await getReviews({
      memoryEntryId: searchParams.get('memoryId') || undefined,
      reviewType: searchParams.get('type') as ReviewType | undefined,
      reviewLabel: searchParams.get('label') as ReviewLabel | undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50
    });

    return NextResponse.json({ reviews, count: reviews.length });
  } catch (error) {
    return NextResponse.json({ error: 'review_fetch_failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const capabilityError = getPostgresCapabilityErrorResponse('maya_review');
  if (capabilityError) {
    return capabilityError;
  }

  try {
    const body = await request.json();

    if (!body.memoryEntryId || !body.reviewType || !body.reviewLabel) {
      return NextResponse.json({ error: 'missing_required_fields' }, { status: 400 });
    }

    // Validate review label matches type
    const validLabels: Record<ReviewType, ReviewLabel[]> = {
      event: ['useful', 'trivial', 'wrong'],
      conflict: ['real_conflict', 'false_positive', 'unclear'],
      proposed: ['useful', 'overreach', 'redundant'],
      signal: ['promising', 'noise']
    };

    const allowedLabels = validLabels[body.reviewType as ReviewType];
    if (!allowedLabels || !allowedLabels.includes(body.reviewLabel)) {
      return NextResponse.json({ 
        error: 'invalid_review_label',
        allowedLabels 
      }, { status: 400 });
    }

    const review = await createReview({
      memoryEntryId: body.memoryEntryId,
      entryTier: body.entryTier as MemoryTier,
      reviewType: body.reviewType as ReviewType,
      reviewLabel: body.reviewLabel as ReviewLabel,
      reviewNote: body.reviewNote,
      actor: 'user',
      sessionId: body.sessionId,
      mode: body.mode
    });

    return NextResponse.json({ review, success: true });
  } catch (error) {
    return NextResponse.json({ error: 'review_create_failed' }, { status: 500 });
  }
}
