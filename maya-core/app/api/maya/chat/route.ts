// K5-CANONICAL: Diese Datei gehört zu Achse B (Execution/Zielpfad).
// Neue Logik kommt hierher, nicht in Achse A.
import { NextRequest, NextResponse } from 'next/server';

import { isMayaRequestAuthorized } from '@/lib/maya-auth';
import { getPostgresCapabilityErrorResponse } from '@/lib/maya-capabilities';
import { dispatchChat, DispatchRequest } from '@/lib/maya-provider-dispatch';
import { runDualModelExtract, saveExtractResults } from '@/lib/maya-cognitive-engine';
import { getMemoryEntries } from '@/lib/maya-memory-store';
import { StudioMode, ModelRole } from '@/lib/maya-spec-types';
import { type WorkMode } from '@/components/maya/maya-local-response';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type MayaEpistemicGuardrail = {
  mirror: string;
  overclaimWarning: string | null;
  freshnessWarning: string | null;
};

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

    const dispatchRequest: DispatchRequest = {
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content
      })),
      providerId,
      modelId,
      role,
      studioMode,
      workMode,
      maxTokens,
      temperature,
      reasoningEffort
    };

    const result = await dispatchChat(dispatchRequest);
    const latestUserMessage = dispatchRequest.messages.filter((message) => message.role === 'user').pop()?.content || '';
    const epistemicGuardrail = !result.blocked && result.message
      ? buildEpistemicGuardrail(latestUserMessage, result.message.content)
      : null;

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
      warnings: result.warnings,
      epistemicGuardrail
    });
  } catch (error) {
    return NextResponse.json({ error: 'chat_failed' }, { status: 500 });
  }
}

function buildEpistemicGuardrail(userMessage: string, assistantMessage: string): MayaEpistemicGuardrail {
  const mirror = buildMirror(userMessage);
  const overclaimWarning = detectOverclaimWarning(userMessage, assistantMessage);
  const freshnessWarning = detectFreshnessWarning(assistantMessage);

  return {
    mirror,
    overclaimWarning,
    freshnessWarning
  };
}

function buildMirror(userMessage: string): string {
  const normalized = normalizeForGuardrail(userMessage);
  if (!normalized) {
    return 'Kernanliegen erkannt: Kein belastbarer Nutzersatz für die Spiegelung vorhanden.';
  }

  const firstSegment = normalized
    .split(/(?<=[.!?])\s+|\n+/)
    .map((segment) => segment.trim())
    .find((segment) => segment.length >= 12) || normalized;

  return `Kernanliegen erkannt: ${truncateGuardrailText(firstSegment, 180)}`;
}

function detectOverclaimWarning(userMessage: string, assistantMessage: string): string | null {
  const normalizedAssistant = normalizeForGuardrail(assistantMessage).toLowerCase();
  const normalizedUser = normalizeForGuardrail(userMessage).toLowerCase();

  if (!normalizedAssistant) {
    return null;
  }

  const absoluteClaimPattern = /\b(sicher|garantiert|definitiv|eindeutig|zweifellos|immer|nie|vollständig|bewiesen|ohne zweifel)\b/i;
  const hedgePattern = /\b(vielleicht|wahrscheinlich|vermutlich|kann|könnte|scheint|nach aktuellem stand|soweit sichtbar)\b/i;
  const userAskedForCertainty = /\b(sicher|garantiert|eindeutig|definitiv|beweisen|beweis)\b/i.test(normalizedUser);

  if (absoluteClaimPattern.test(normalizedAssistant) && !hedgePattern.test(normalizedAssistant) && !userAskedForCertainty) {
    return 'Antwort klingt stellenweise zu sicher. Prüfe, ob die Behauptung wirklich durch Input, Repo-Stand oder Kontext gedeckt ist.';
  }

  return null;
}

function detectFreshnessWarning(assistantMessage: string): string | null {
  const normalizedAssistant = normalizeForGuardrail(assistantMessage);
  if (!normalizedAssistant) {
    return null;
  }

  const timeSensitivePattern = /\b(aktuell|derzeit|momentan|heute|neueste|latest|kürzlich|zurzeit|gegenwärtig)\b/i;
  const freshnessAnchorPattern = /\b(commit|hash|version|stand|timestamp|utc|20\d{2}-\d{2}-\d{2}|\d{1,2}\.\d{1,2}\.20\d{2})\b/i;

  if (timeSensitivePattern.test(normalizedAssistant) && !freshnessAnchorPattern.test(normalizedAssistant)) {
    return 'Antwort enthält zeitabhängige Aussagen ohne klaren Frischeanker. Prüfe, ob Stand, Commit oder Datum explizit benannt werden sollte.';
  }

  return null;
}

function normalizeForGuardrail(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function truncateGuardrailText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
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
