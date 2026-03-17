// Maya Provider Dispatch - Phase 1C Ops
// Multi-provider execution layer using the registry

import {
  ProviderRegistryEntry,
  ModelRole,
  ModelLane,
  getProviderConfig,
  getModelEntry,
  getDefaultForRole,
  isProviderKeyConfigured,
  validateModelForRole,
  validateModelForLane,
  getStabilityWarning,
  getCostWarning,
  PROVIDER_REGISTRY
} from './maya-provider-registry';
import { buildContext, markContextUsed } from '@/lib/maya-context-builder';
import { buildFullSystemPrompt } from '@/lib/maya-prompt-contract';
import { createMessage, recordCost } from '@/lib/maya-memory-store';
import { getCostGuardState } from '@/lib/maya-memory-store';
import { MayaMessage, StudioMode } from '@/lib/maya-spec-types';

// === Dispatch Types ===

export type DispatchRequest = {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  role?: ModelRole;
  lane?: ModelLane;
  providerId?: string;
  modelId?: string;
  studioMode?: StudioMode;
  maxTokens?: number;
  temperature?: number;
  reasoningEffort?: 'low' | 'medium' | 'high';
  imageBase64?: string; // For vision lane
};

export type DispatchResult = {
  message: MayaMessage;
  blocked: boolean;
  blockReason?: string;
  modelUsed: ProviderRegistryEntry;
  contextUsed?: boolean;
  warnings: string[];
};

// === Provider Status ===

export type ProviderStatus = {
  id: string;
  name: string;
  keyConfigured: boolean;
  ready: boolean;
  lastError: string | null;
  availableModels: number;
  stableModels: number;
  previewModels: number;
  aliasModels: number;
};

export function getProviderStatuses(): ProviderStatus[] {
  return PROVIDER_REGISTRY.map(provider => {
    const keyConfigured = isProviderKeyConfigured(provider.id);
    const models = provider.models.filter(m => m.isEnabled);
    
    return {
      id: provider.id,
      name: provider.name,
      keyConfigured,
      ready: keyConfigured,
      lastError: null,
      availableModels: models.length,
      stableModels: models.filter(m => m.stability === 'stable').length,
      previewModels: models.filter(m => m.stability === 'preview').length,
      aliasModels: models.filter(m => m.stability === 'alias').length
    };
  });
}

// === Main Dispatch Function ===

export async function dispatchChat(request: DispatchRequest): Promise<DispatchResult> {
  const warnings: string[] = [];
  
  // Determine model to use
  let modelEntry: ProviderRegistryEntry | null = null;
  
  if (request.providerId && request.modelId) {
    // Explicit model selection
    modelEntry = getModelEntry(request.providerId, request.modelId) || null;
    if (!modelEntry) {
      return createBlockedResult(
        `Model ${request.modelId} not found for provider ${request.providerId}`,
        'model_not_found',
        warnings
      );
    }
  } else if (request.role) {
    // Role-based selection
    modelEntry = getDefaultForRole(request.role);
    if (!modelEntry) {
      return createBlockedResult(
        `No available model for role ${request.role}`,
        'no_model_for_role',
        warnings
      );
    }
  } else {
    // Default to worker role
    modelEntry = getDefaultForRole('worker');
    if (!modelEntry) {
      modelEntry = getDefaultForRole('scout');
    }
    if (!modelEntry) {
      return createBlockedResult(
        'No available models',
        'no_models_available',
        warnings
      );
    }
  }
  
  // Validate model for role/lane if specified
  if (request.role && !validateModelForRole(modelEntry, request.role)) {
    warnings.push(`Model ${modelEntry.label} not recommended for role ${request.role}`);
  }
  if (request.lane && !validateModelForLane(modelEntry, request.lane)) {
    warnings.push(`Model ${modelEntry.label} not designed for lane ${request.lane}`);
  }
  
  // Stability/cost warnings
  const stabilityWarning = getStabilityWarning(modelEntry);
  if (stabilityWarning) warnings.push(stabilityWarning);
  const costWarning = getCostWarning(modelEntry);
  if (costWarning) warnings.push(costWarning);
  
  // Check key configured
  if (!isProviderKeyConfigured(modelEntry.providerId)) {
    return createBlockedResult(
      `Provider ${modelEntry.providerId} API key not configured`,
      'provider_not_configured',
      warnings
    );
  }
  
  // Check cost guard
  const costGuard = await getCostGuardState();
  if (costGuard.status === 'blocked') {
    return createBlockedResult(
      `Daily budget exceeded (${costGuard.spentTodayCents}/${costGuard.dailyBudgetCents} cents)`,
      'budget_exceeded',
      warnings
    );
  }
  
  // Build context
  const context = await buildContext(request.studioMode || 'personal');
  const systemPrompt = buildFullSystemPrompt(context.systemPrompt, request.studioMode || 'personal');
  
  // Prepare messages
  const messagesWithSystem = [
    { role: 'system' as const, content: systemPrompt },
    ...request.messages
  ];
  
  // Execute based on provider
  let response: string;
  let tokenInput = 0;
  let tokenOutput = 0;
  
  try {
    const result = await executeProviderCall(modelEntry, messagesWithSystem, request);
    response = result.content;
    tokenInput = result.tokenInput;
    tokenOutput = result.tokenOutput;
  } catch (error) {
    return createBlockedResult(
      `Provider call failed: ${error}`,
      'provider_error',
      warnings
    );
  }
  
  // Calculate cost
  const costCents = Math.ceil(
    tokenInput * modelEntry.costPerTokenInputCents +
    tokenOutput * modelEntry.costPerTokenOutputCents
  );
  
  // Record cost
  if (costCents > 0) {
    await recordCost(costCents, tokenInput + tokenOutput);
  }
  
  // Mark context as used
  const contextIds = context.contextEntries.map(e => e.id);
  if (contextIds.length > 0) {
    await markContextUsed(contextIds);
  }
  
  // Create message record
  const message = await createMessage({
    role: 'assistant',
    content: response,
    studioMode: request.studioMode || 'personal',
    provider: modelEntry.providerId,
    model: modelEntry.modelId,
    contextUsed: contextIds,
    contextReferenced: contextIds,
    tokenInput,
    tokenOutput,
    costCents
  });
  
  return {
    message,
    blocked: false,
    modelUsed: modelEntry,
    contextUsed: contextIds.length > 0,
    warnings
  };
}

// === Provider Execution ===

async function executeProviderCall(
  model: ProviderRegistryEntry,
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  request: DispatchRequest
): Promise<{ content: string; tokenInput: number; tokenOutput: number }> {
  
  switch (model.providerId) {
    case 'openai':
      return executeOpenAI(model, messages, request);
    case 'xai':
      return executeXAI(model, messages, request);
    case 'gemini':
      return executeGemini(model, messages, request);
    case 'deepseek':
      return executeDeepSeek(model, messages, request);
    case 'anthropic':
      return executeAnthropic(model, messages, request);
    case 'mock':
      return executeMock(messages, request.studioMode || 'personal');
    default:
      throw new Error(`Unknown provider: ${model.providerId}`);
  }
}

// === OpenAI ===

async function executeOpenAI(
  model: ProviderRegistryEntry,
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  request: DispatchRequest
): Promise<{ content: string; tokenInput: number; tokenOutput: number }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }
  
  const body: Record<string, unknown> = {
    model: model.modelId,
    messages: messages.map(m => ({ role: m.role, content: m.content }))
  };
  
  // GPT-5 uses max_completion_tokens
  const isGPT5 = model.modelId.startsWith('gpt-5');
  if (isGPT5) {
    body.max_completion_tokens = request.maxTokens || model.maxTokens;
    // Reasoning models use reasoning.effort
    if (model.reasoningModeSupported && request.reasoningEffort) {
      body.reasoning = { effort: request.reasoningEffort };
    }
  } else {
    body.max_tokens = request.maxTokens || model.maxTokens;
    if (request.temperature !== undefined && model.supportsJson) {
      body.temperature = request.temperature;
    }
  }
  
  // Vision support
  if (model.supportsVision && request.imageBase64) {
    body.messages = messages.map(m => {
      if (m.role === 'user') {
        return {
          role: m.role,
          content: [
            { type: 'text', text: m.content },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${request.imageBase64}` } }
          ]
        };
      }
      return { role: m.role, content: m.content };
    });
  }
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }
  
  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
    usage?: { prompt_tokens: number; completion_tokens: number };
  };
  
  return {
    content: data.choices[0]?.message?.content || 'No response',
    tokenInput: data.usage?.prompt_tokens || 0,
    tokenOutput: data.usage?.completion_tokens || 0
  };
}

// === xAI ===

async function executeXAI(
  model: ProviderRegistryEntry,
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  request: DispatchRequest
): Promise<{ content: string; tokenInput: number; tokenOutput: number }> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error('xAI API key not configured');
  }
  
  const body: Record<string, unknown> = {
    model: model.modelId,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    max_tokens: request.maxTokens || model.maxTokens
  };
  
  // Reasoning models
  if (model.reasoningModeSupported && request.reasoningEffort) {
    body.reasoning_effort = request.reasoningEffort;
  }
  
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    throw new Error(`xAI API error: ${response.status}`);
  }
  
  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
    usage?: { prompt_tokens: number; completion_tokens: number };
  };
  
  return {
    content: data.choices[0]?.message?.content || 'No response',
    tokenInput: data.usage?.prompt_tokens || 0,
    tokenOutput: data.usage?.completion_tokens || 0
  };
}

// === Gemini ===

async function executeGemini(
  model: ProviderRegistryEntry,
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  request: DispatchRequest
): Promise<{ content: string; tokenInput: number; tokenOutput: number }> {
  const apiKey = process.env.GOOGLE_AI_KEY;
  if (!apiKey) {
    throw new Error('Google AI key not configured');
  }
  
  // TTS lane
  if (model.supportsTts && model.roles.includes('tts')) {
    return executeGeminiTTS(model, messages, apiKey);
  }
  
  // Convert messages to Gemini format
  const systemInstruction = messages.find(m => m.role === 'system')?.content || '';
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
  
  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      maxOutputTokens: request.maxTokens || model.maxTokens,
      temperature: request.temperature ?? 0.7
    }
  };
  
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }
  
  // Vision support
  if (model.supportsVision && request.imageBase64) {
    const lastUserIdx = contents.length - 1;
    if (contents[lastUserIdx].role === 'user') {
      (contents[lastUserIdx] as { role: string; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }).parts = [
        { text: messages.filter(m => m.role === 'user').pop()?.content || '' },
        { inlineData: { mimeType: 'image/png', data: request.imageBase64 } }
      ];
    }
  }
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model.modelId}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }
  );
  
  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }
  
  const data = await response.json() as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number };
  };
  
  const content = data.candidates[0]?.content?.parts?.map(p => p.text).join('') || 'No response';
  
  return {
    content,
    tokenInput: data.usageMetadata?.promptTokenCount || 0,
    tokenOutput: data.usageMetadata?.candidatesTokenCount || 0
  };
}

async function executeGeminiTTS(
  model: ProviderRegistryEntry,
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  apiKey: string
): Promise<{ content: string; tokenInput: number; tokenOutput: number }> {
  const text = messages.filter(m => m.role === 'user').pop()?.content || '';
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model.modelId}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text }] }],
        generationConfig: { responseModalities: ['AUDIO'] }
      })
    }
  );
  
  if (!response.ok) {
    throw new Error(`Gemini TTS API error: ${response.status}`);
  }
  
  const data = await response.json() as {
    candidates: Array<{ content: { parts: Array<{ inlineData?: { data: string } }> } }>;
  };
  
  const audioBase64 = data.candidates[0]?.content?.parts[0]?.inlineData?.data || '';
  
  return {
    content: audioBase64 ? `[Audio generated: ${audioBase64.length} bytes base64]` : 'No audio generated',
    tokenInput: Math.ceil(text.length / 4),
    tokenOutput: audioBase64.length
  };
}

// === DeepSeek ===

async function executeDeepSeek(
  model: ProviderRegistryEntry,
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  request: DispatchRequest
): Promise<{ content: string; tokenInput: number; tokenOutput: number }> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DeepSeek API key not configured');
  }
  
  const body: Record<string, unknown> = {
    model: model.modelId,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    max_tokens: request.maxTokens || model.maxTokens
  };
  
  if (request.temperature !== undefined) {
    body.temperature = request.temperature;
  }
  
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }
  
  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
    usage?: { prompt_tokens: number; completion_tokens: number };
  };
  
  return {
    content: data.choices[0]?.message?.content || 'No response',
    tokenInput: data.usage?.prompt_tokens || 0,
    tokenOutput: data.usage?.completion_tokens || 0
  };
}

// === Anthropic ===

async function executeAnthropic(
  model: ProviderRegistryEntry,
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  request: DispatchRequest
): Promise<{ content: string; tokenInput: number; tokenOutput: number }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }
  
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const otherMessages = messages.filter(m => m.role !== 'system');
  
  const body: Record<string, unknown> = {
    model: model.modelId,
    max_tokens: request.maxTokens || model.maxTokens,
    system: systemMessage,
    messages: otherMessages.map(m => ({ role: m.role, content: m.content }))
  };
  
  if (request.temperature !== undefined) {
    body.temperature = request.temperature;
  }
  
  // Vision support
  if (model.supportsVision && request.imageBase64) {
    body.messages = otherMessages.map(m => {
      if (m.role === 'user') {
        return {
          role: m.role,
          content: [
            { type: 'text', text: m.content },
            { type: 'image', source: { type: 'base64', media_type: 'image/png', data: request.imageBase64 } }
          ]
        };
      }
      return { role: m.role, content: [{ type: 'text', text: m.content }] };
    });
  }
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }
  
  const data = await response.json() as {
    content: Array<{ type: string; text: string }>;
    usage?: { input_tokens: number; output_tokens: number };
  };
  
  const content = data.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('\n');
  
  return {
    content: content || 'No response',
    tokenInput: data.usage?.input_tokens || 0,
    tokenOutput: data.usage?.output_tokens || 0
  };
}

// === Mock ===

function executeMock(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  mode: StudioMode
): { content: string; tokenInput: number; tokenOutput: number } {
  const lastMessage = messages[messages.length - 1];
  const userContent = lastMessage?.content || '';
  
  let response: string;
  
  if (mode === 'personal') {
    if (userContent.length < 20) {
      response = 'Ich verstehe deine Anfrage. Gib mir etwas mehr Kontext, dann kann ich konkreter antworten.';
    } else {
      response = `Mock-Response für: "${userContent.slice(0, 50)}..."\n\nKonfiguriere API Keys für echte Antworten.`;
    }
  } else if (mode === 'soulmatch_studio') {
    response = 'Soulmatch Studio Mock: Keine Live-Daten verfügbar.';
  } else {
    response = 'AICOS Studio Mock: Keine Live-Daten verfügbar.';
  }
  
  return {
    content: response,
    tokenInput: Math.ceil(messages.reduce((sum, m) => sum + m.content.length, 0) / 4),
    tokenOutput: Math.ceil(response.length / 4)
  };
}

// === Helper ===

async function createBlockedResult(
  content: string,
  blockReason: string,
  warnings: string[]
): Promise<DispatchResult> {
  const message = await createMessage({
    role: 'assistant',
    content,
    studioMode: 'personal',
    provider: 'mock',
    model: 'blocked',
    contextUsed: [],
    contextReferenced: [],
    tokenInput: 0,
    tokenOutput: 0,
    costCents: 0
  });
  
  return {
    message,
    blocked: true,
    blockReason,
    modelUsed: {
      providerId: 'mock',
      modelId: 'blocked',
      label: 'Blocked',
      roles: [],
      lanes: [],
      capabilities: [],
      stability: 'stable',
      isDefault: false,
      isEnabled: false,
      envKeyName: '',
      costClass: 'cheap',
      reasoningModeSupported: false,
      supportsVision: false,
      supportsTts: false,
      supportsJson: false,
      supportsTools: false,
      maxTokens: 0,
      costPerTokenInputCents: 0,
      costPerTokenOutputCents: 0
    },
    warnings
  };
}
