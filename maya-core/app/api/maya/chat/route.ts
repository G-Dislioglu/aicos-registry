import { NextRequest, NextResponse } from 'next/server';

import { isMayaRequestAuthorized } from '@/lib/maya-auth';
import { getPostgresCapabilityErrorResponse } from '@/lib/maya-capabilities';
import { dispatchChat, DispatchRequest } from '@/lib/maya-provider-dispatch';
import { runDualModelExtract, saveExtractResults } from '@/lib/maya-cognitive-engine';
import { getMemoryEntries } from '@/lib/maya-memory-store';
import { StudioMode, ModelRole } from '@/lib/maya-spec-types';
import { type WorkMode, getSystemInstruction } from '@/components/maya/maya-local-response';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const capabilityError = getPostgresCapabilityErrorResponse('maya_chat');
  if (capabilityError) {
    return capabilityError;
  }

  try {
    const body = await request.json();
    const messages = body.messages || [];
    const providerId = body.provider;
    const modelId = body.model;
    const role = body.role as ModelRole | undefined;
    const studioMode: StudioMode = body.studioMode || 'personal';
    const maxTokens = body.maxTokens;
    const temperature = body.temperature;
    const reasoningEffort = body.reasoningEffort;
    const workMode = body.workMode as WorkMode | undefined;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages_required' }, { status: 400 });
    }

    const parsedMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content
    }));

    const messagesWithSystem = workMode
      ? [{ role: 'system' as const, content: getSystemInstruction(workMode) }, ...parsedMessages]
      : parsedMessages;

    const dispatchRequest: DispatchRequest = {
      messages: messagesWithSystem,
      providerId,
      modelId,
      role,
      studioMode,
      maxTokens,
      temperature,
      reasoningEffort
    };

    const result = await dispatchChat(dispatchRequest);

    // Trigger async extract (does not block response)
    if (!result.blocked && result.message) {
      const lastUserMsg = messages.filter((m: { role: string }) => m.role === 'user').pop();
      if (lastUserMsg) {
        // Fire-and-forget async extract
        triggerAsyncExtract(
          lastUserMsg.content,
          result.message.content,
          studioMode
        ).catch(() => {
          // Silent fail - extract errors should not affect user experience
        });
      }
    }

    return NextResponse.json({
      message: result.message,
      blocked: result.blocked,
      blockReason: result.blockReason,
      modelUsed: {
        providerId: result.modelUsed.providerId,
        modelId: result.modelUsed.modelId,
        label: result.modelUsed.label
      },
      contextUsed: result.contextUsed || false,
      warnings: result.warnings
    });
  } catch (error) {
    return NextResponse.json({ error: 'chat_failed' }, { status: 500 });
  }
}

// Async extract - runs in background without blocking response
async function triggerAsyncExtract(
  userMessage: string,
  assistantMessage: string,
  studioMode: StudioMode
): Promise<void> {
  try {
    // Get known entries for conflict detection
    const knownEntries = await getMemoryEntries({ 
      tier: 'core', 
      includeDeleted: false, 
      limit: 10 
    });

    // Run dual-model extract
    const extractResult = await runDualModelExtract(
      userMessage,
      assistantMessage,
      knownEntries
    );

    // Save results if any
    if (extractResult.agreedFacts.length > 0 || extractResult.conflicts.length > 0) {
      await saveExtractResults(extractResult, studioMode);
    }
  } catch (error) {
    // Silent fail - log but don't throw
    console.error('Extract failed:', error);
  }
}
