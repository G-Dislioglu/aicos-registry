import { NextRequest, NextResponse } from 'next/server';

import { isMayaRequestAuthorized } from '@/lib/maya-auth';
import { executeChat, detectDefaultProvider } from '@/lib/maya-provider';
import { StudioMode } from '@/lib/maya-spec-types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const messages = body.messages || [];
    const provider = body.provider;
    const model = body.model;
    const studioMode: StudioMode = body.studioMode || 'personal';
    const maxTokens = body.maxTokens;
    const temperature = body.temperature;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages_required' }, { status: 400 });
    }

    const result = await executeChat({
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content
      })),
      provider,
      model,
      studioMode,
      maxTokens,
      temperature
    });

    return NextResponse.json({
      message: result.message,
      blocked: result.blocked,
      blockReason: result.blockReason
    });
  } catch (error) {
    return NextResponse.json({ error: 'chat_failed' }, { status: 500 });
  }
}
