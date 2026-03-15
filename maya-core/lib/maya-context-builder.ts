import { promises as fs } from 'fs';
import path from 'path';

import { getMemoryEntries, incrementMemoryUsage } from '@/lib/maya-memory-store';
import { ContextBuildMode, ContextBuildResult, MemoryEntry } from '@/lib/maya-spec-types';

const ANCHORS_FILE = path.join(process.cwd(), 'anchors.md');
const MAX_CONTEXT_TOKENS = 2000;
const MAX_MEMORY_ENTRIES = 15;

// Approximate token count (rough: 4 chars per token)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Load anchors.md
export async function loadAnchors(): Promise<string> {
  try {
    const content = await fs.readFile(ANCHORS_FILE, 'utf8');
    return content.trim();
  } catch {
    // Return default anchors if file doesn't exist
    return `# Anchors

## Identity
Maya is a personal assistive surface with visible context and curated memory.

## Core Principles
- Hold context visibly
- Propose, don't auto-apply
- Confirm before memory changes
- Surface conflicts early
- Track costs transparently

## Communication Style
- Concise and direct
- German by default, English on request
- No unnecessary preamble
- Fact-based progress updates`;
  }
}

// Build context for LLM call
export async function buildContext(mode: ContextBuildMode = 'personal'): Promise<ContextBuildResult> {
  const anchors = await loadAnchors();
  const anchorTokens = estimateTokens(anchors);

  // Get relevant memory entries
  const memoryEntries = await getMemoryEntries({
    includeDeleted: false,
    limit: MAX_MEMORY_ENTRIES
  });

  // Sort by usage and recency
  const sortedEntries = memoryEntries.sort((a, b) => {
    // Core tier always first
    if (a.tier === 'core' && b.tier !== 'core') return -1;
    if (b.tier === 'core' && a.tier !== 'core') return 1;
    // Then by usage score
    if (b.usageScore !== a.usageScore) return b.usageScore - a.usageScore;
    // Then by recency
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // Build memory section within token budget
  let memorySection = '';
  let usedTokens = anchorTokens;
  const contextEntries: MemoryEntry[] = [];

  for (const entry of sortedEntries) {
    const entryText = `[${entry.tier}/${entry.category}] ${entry.topic}: ${entry.content}`;
    const entryTokens = estimateTokens(entryText);

    if (usedTokens + entryTokens <= MAX_CONTEXT_TOKENS) {
      memorySection += entryText + '\n';
      usedTokens += entryTokens;
      contextEntries.push(entry);
    }
  }

  // Compose system prompt
  const systemPrompt = `${anchors}

## Active Memory Context
${memorySection || 'No active memory entries.'}

## Mode: ${mode}
${getModeInstructions(mode)}`;

  return {
    systemPrompt,
    contextEntries,
    tokenCount: estimateTokens(systemPrompt),
    anchors: anchors.split('\n').filter(line => line.startsWith('#')).map(line => line.replace(/^#+\s*/, ''))
  };
}

function getModeInstructions(mode: ContextBuildMode): string {
  switch (mode) {
    case 'personal':
      return `Operating in personal mode. Focus on the user's projects, preferences, and goals. Keep responses concise and actionable.`;

    case 'soulmatch_studio':
      return `Operating in Soulmatch Studio mode. Focus on relationship matching and compatibility analysis. Use mock context for studio scenarios.`;

    case 'aicos_studio':
      return `Operating in AICOS Studio mode. Focus on artifact review, scoring, and registry operations. Use mock context for studio scenarios.`;

    default:
      return `Operating in personal mode. Focus on the user's projects, preferences, and goals.`;
  }
}

// Increment usage for referenced entries
export async function markContextUsed(entryIds: string[]): Promise<void> {
  await Promise.all(entryIds.map(id => incrementMemoryUsage(id)));
}
