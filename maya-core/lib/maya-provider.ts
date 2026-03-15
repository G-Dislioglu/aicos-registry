import {
  Provider,
  ProviderType,
  ProviderModel,
  MayaMessage,
  StudioMode
} from '@/lib/maya-spec-types';
import { buildContext, markContextUsed } from '@/lib/maya-context-builder';
import { buildFullSystemPrompt } from '@/lib/maya-prompt-contract';
import { createMessage, recordCost } from '@/lib/maya-memory-store';
import { getCostGuardState } from '@/lib/maya-memory-store';

// Provider configurations
const PROVIDER_CONFIGS: Record<ProviderType, Omit<Provider, 'available'>> = {
  openai: {
    type: 'openai',
    name: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
    models: [
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        maxTokens: 16384,
        supportsTemperature: true,
        supportsSystemPrompt: true,
        costPerTokenInputCents: 0.00015,
        costPerTokenOutputCents: 0.0006
      },
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        maxTokens: 16384,
        supportsTemperature: true,
        supportsSystemPrompt: true,
        costPerTokenInputCents: 0.0025,
        costPerTokenOutputCents: 0.01
      },
      {
        id: 'gpt-5',
        name: 'GPT-5',
        maxTokens: 32768,
        supportsTemperature: false, // GPT-5 uses max_completion_tokens, no temperature
        supportsSystemPrompt: true,
        costPerTokenInputCents: 0.005,
        costPerTokenOutputCents: 0.015
      }
    ]
  },
  anthropic: {
    type: 'anthropic',
    name: 'Anthropic',
    defaultModel: 'claude-3-5-sonnet-20241022',
    models: [
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        maxTokens: 8192,
        supportsTemperature: true,
        supportsSystemPrompt: true,
        costPerTokenInputCents: 0.003,
        costPerTokenOutputCents: 0.015
      },
      {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        maxTokens: 8192,
        supportsTemperature: true,
        supportsSystemPrompt: true,
        costPerTokenInputCents: 0.001,
        costPerTokenOutputCents: 0.005
      }
    ]
  },
  google: {
    type: 'google',
    name: 'Google AI',
    defaultModel: 'gemini-1.5-flash',
    models: [
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        maxTokens: 8192,
        supportsTemperature: true,
        supportsSystemPrompt: true,
        costPerTokenInputCents: 0.000075,
        costPerTokenOutputCents: 0.0003
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        maxTokens: 8192,
        supportsTemperature: true,
        supportsSystemPrompt: true,
        costPerTokenInputCents: 0.00125,
        costPerTokenOutputCents: 0.005
      }
    ]
  },
  mock: {
    type: 'mock',
    name: 'Mock Provider (Development)',
    defaultModel: 'mock',
    models: [
      {
        id: 'mock',
        name: 'Mock Model',
        maxTokens: 4096,
        supportsTemperature: true,
        supportsSystemPrompt: true,
        costPerTokenInputCents: 0,
        costPerTokenOutputCents: 0
      }
    ]
  }
};

// Check if provider is available (has API key)
function isProviderAvailable(type: ProviderType): boolean {
  if (type === 'mock') return true;

  const keyMap: Record<ProviderType, string | undefined> = {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    google: process.env.GOOGLE_AI_KEY,
    mock: 'mock'
  };

  return Boolean(keyMap[type]);
}

// Get all available providers
export function getProviders(): Provider[] {
  return Object.entries(PROVIDER_CONFIGS).map(([type, config]) => ({
    ...config,
    type: type as ProviderType,
    available: isProviderAvailable(type as ProviderType)
  }));
}

// Get specific provider
export function getProvider(type: ProviderType): Provider | null {
  const config = PROVIDER_CONFIGS[type];
  if (!config) return null;

  return {
    ...config,
    available: isProviderAvailable(type)
  };
}

// Get model info
export function getModel(providerType: ProviderType, modelId: string): ProviderModel | null {
  const provider = PROVIDER_CONFIGS[providerType];
  if (!provider) return null;

  return provider.models.find(m => m.id === modelId) || null;
}

// Detect provider from env
export function detectDefaultProvider(): ProviderType {
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.GOOGLE_AI_KEY) return 'google';
  return 'mock';
}

// Chat completion request
export type ChatRequest = {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  provider?: ProviderType;
  model?: string;
  studioMode?: StudioMode;
  maxTokens?: number;
  temperature?: number;
};

export type ChatResult = {
  message: MayaMessage;
  blocked: boolean;
  blockReason?: string;
};

// Execute chat completion
export async function executeChat(request: ChatRequest): Promise<ChatResult> {
  const providerType = request.provider || detectDefaultProvider();
  const provider = getProvider(providerType);

  if (!provider || !provider.available) {
    return {
      message: await createMessage({
        role: 'assistant',
        content: `Provider ${providerType} is not available. Check API key configuration.`,
        studioMode: request.studioMode || 'personal',
        provider: providerType,
        model: request.model || 'unknown',
        contextUsed: [],
        contextReferenced: [],
        tokenInput: 0,
        tokenOutput: 0,
        costCents: 0
      }),
      blocked: true,
      blockReason: 'provider_unavailable'
    };
  }

  // Check cost guard
  const costGuard = await getCostGuardState();
  if (costGuard.status === 'blocked') {
    return {
      message: await createMessage({
        role: 'assistant',
        content: `Daily budget exceeded (${costGuard.spentTodayCents}/${costGuard.dailyBudgetCents} cents). LLM calls are blocked until tomorrow. Store reads remain available.`,
        studioMode: request.studioMode || 'personal',
        provider: providerType,
        model: request.model || provider.defaultModel,
        contextUsed: [],
        contextReferenced: [],
        tokenInput: 0,
        tokenOutput: 0,
        costCents: 0
      }),
      blocked: true,
      blockReason: 'budget_exceeded'
    };
  }

  const modelId = request.model || provider.defaultModel;
  const modelInfo = getModel(providerType, modelId);

  if (!modelInfo) {
    return {
      message: await createMessage({
        role: 'assistant',
        content: `Model ${modelId} not found for provider ${providerType}.`,
        studioMode: request.studioMode || 'personal',
        provider: providerType,
        model: modelId,
        contextUsed: [],
        contextReferenced: [],
        tokenInput: 0,
        tokenOutput: 0,
        costCents: 0
      }),
      blocked: true,
      blockReason: 'model_not_found'
    };
  }

  // Build context
  const context = await buildContext(request.studioMode || 'personal');
  const systemPrompt = buildFullSystemPrompt(context.systemPrompt, request.studioMode || 'personal');

  // Prepare messages with system prompt
  const messagesWithSystem = [
    { role: 'system' as const, content: systemPrompt },
    ...request.messages
  ];

  // Execute based on provider
  let response: string;
  let tokenInput = 0;
  let tokenOutput = 0;

  if (providerType === 'mock') {
    // Mock response for development
    response = generateMockResponse(request.messages, request.studioMode || 'personal');
    tokenInput = Math.ceil(messagesWithSystem.reduce((sum, m) => sum + m.content.length, 0) / 4);
    tokenOutput = Math.ceil(response.length / 4);
  } else if (providerType === 'openai') {
    const result = await executeOpenAI(messagesWithSystem, modelId, modelInfo, request.maxTokens, request.temperature);
    response = result.content;
    tokenInput = result.tokenInput;
    tokenOutput = result.tokenOutput;
  } else if (providerType === 'anthropic') {
    const result = await executeAnthropic(messagesWithSystem, modelId, modelInfo, request.maxTokens, request.temperature);
    response = result.content;
    tokenInput = result.tokenInput;
    tokenOutput = result.tokenOutput;
  } else {
    response = `Provider ${providerType} implementation pending. Using mock response.`;
    tokenInput = 100;
    tokenOutput = 50;
  }

  // Calculate cost
  const costCents = Math.ceil(
    tokenInput * modelInfo.costPerTokenInputCents +
    tokenOutput * modelInfo.costPerTokenOutputCents
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
    provider: providerType,
    model: modelId,
    contextUsed: contextIds,
    contextReferenced: contextIds,
    tokenInput,
    tokenOutput,
    costCents
  });

  return {
    message,
    blocked: false
  };
}

// OpenAI implementation
async function executeOpenAI(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  modelId: string,
  modelInfo: ProviderModel,
  maxTokens?: number,
  temperature?: number
): Promise<{ content: string; tokenInput: number; tokenOutput: number }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { content: 'OpenAI API key not configured', tokenInput: 0, tokenOutput: 0 };
  }

  // GPT-5 uses max_completion_tokens instead of max_tokens and doesn't support temperature
  const isGPT5 = modelId === 'gpt-5';
  const body: Record<string, unknown> = {
    model: modelId,
    messages: messages.map(m => ({ role: m.role, content: m.content }))
  };

  if (isGPT5) {
    body.max_completion_tokens = maxTokens || modelInfo.maxTokens;
  } else {
    body.max_tokens = maxTokens || modelInfo.maxTokens;
    if (temperature !== undefined && modelInfo.supportsTemperature) {
      body.temperature = temperature;
    }
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      return { content: `OpenAI API error: ${response.status}`, tokenInput: 0, tokenOutput: 0 };
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
  } catch (error) {
    return { content: `OpenAI request failed: ${error}`, tokenInput: 0, tokenOutput: 0 };
  }
}

// Anthropic implementation
async function executeAnthropic(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  modelId: string,
  modelInfo: ProviderModel,
  maxTokens?: number,
  temperature?: number
): Promise<{ content: string; tokenInput: number; tokenOutput: number }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { content: 'Anthropic API key not configured', tokenInput: 0, tokenOutput: 0 };
  }

  // Extract system message
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const otherMessages = messages.filter(m => m.role !== 'system');

  const body: Record<string, unknown> = {
    model: modelId,
    max_tokens: maxTokens || modelInfo.maxTokens,
    system: systemMessage,
    messages: otherMessages.map(m => ({ role: m.role, content: m.content }))
  };

  if (temperature !== undefined && modelInfo.supportsTemperature) {
    body.temperature = temperature;
  }

  try {
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
      return { content: `Anthropic API error: ${response.status}`, tokenInput: 0, tokenOutput: 0 };
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
  } catch (error) {
    return { content: `Anthropic request failed: ${error}`, tokenInput: 0, tokenOutput: 0 };
  }
}

// Mock response generator
function generateMockResponse(messages: Array<{ role: string; content: string }>, mode: StudioMode): string {
  const lastMessage = messages[messages.length - 1];
  const userContent = lastMessage?.content || '';

  if (mode === 'personal') {
    if (userContent.length < 20) {
      return 'Ich verstehe deine Anfrage. Gib mir etwas mehr Kontext, dann kann ich konkreter antworten.';
    }
    return `Mock-Response für: "${userContent.slice(0, 50)}..."\n\nIch würde hier normalerweise mit einem LLM antworten, aber der Mock-Provider ist aktiv. Konfiguriere OPENAI_API_KEY, ANTHROPIC_API_KEY oder GOOGLE_AI_KEY für echte Antworten.`;
  }

  if (mode === 'soulmatch_studio') {
    return 'Soulmatch Studio Mock: Keine Live-Daten verfügbar. Verwende Mock-Kontext für Studio-Szenarien.';
  }

  if (mode === 'aicos_studio') {
    return 'AICOS Studio Mock: Keine Live-Daten verfügbar. Verwende Mock-Kontext für Studio-Szenarien.';
  }

  return 'Mock response - configure a real provider for actual responses.';
}
