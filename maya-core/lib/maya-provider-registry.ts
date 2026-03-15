// Maya Provider Registry - Phase 1C Ops
// Central registry for multi-provider, multi-role model management

// === Core Types ===

export type ModelRole = 'scout' | 'worker' | 'reasoner' | 'vision_ocr' | 'tts';
export type ModelLane = 'chat' | 'reasoning' | 'vision' | 'audio';
export type ModelCapability = 'chat' | 'reasoning' | 'vision' | 'ocr' | 'tts' | 'json' | 'tool_calling';
export type ModelStability = 'stable' | 'preview' | 'alias';
export type CostClass = 'cheap' | 'medium' | 'expensive';

export type ProviderRegistryEntry = {
  providerId: string;
  modelId: string;
  label: string;
  roles: ModelRole[];
  lanes: ModelLane[];
  capabilities: ModelCapability[];
  stability: ModelStability;
  isDefault: boolean;
  isEnabled: boolean;
  envKeyName: string;
  costClass: CostClass;
  reasoningModeSupported: boolean;
  supportsVision: boolean;
  supportsTts: boolean;
  supportsJson: boolean;
  supportsTools: boolean;
  maxTokens: number;
  costPerTokenInputCents: number;
  costPerTokenOutputCents: number;
  notes?: string;
  deprecated?: boolean;
};

export type ProviderConfig = {
  id: string;
  name: string;
  envKeyName: string;
  baseUrl?: string;
  models: ProviderRegistryEntry[];
};

export type EscalationRule = {
  fromRole: ModelRole;
  toRole: ModelRole;
  trigger: string;
  description: string;
};

export type RoleDefaults = {
  scout_default: ProviderRegistryEntry | null;
  worker_default: ProviderRegistryEntry | null;
  reasoner_default: ProviderRegistryEntry | null;
  vision_default: ProviderRegistryEntry | null;
  tts_default: ProviderRegistryEntry | null;
};

// === Provider Registry Data ===

export const PROVIDER_REGISTRY: ProviderConfig[] = [
  // === OPENAI ===
  {
    id: 'openai',
    name: 'OpenAI',
    envKeyName: 'OPENAI_API_KEY',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      {
        providerId: 'openai',
        modelId: 'gpt-4.1-nano',
        label: 'GPT-4.1 Nano',
        roles: ['scout'],
        lanes: ['chat'],
        capabilities: ['chat', 'json', 'tool_calling'],
        stability: 'stable',
        isDefault: false,
        isEnabled: true,
        envKeyName: 'OPENAI_API_KEY',
        costClass: 'cheap',
        reasoningModeSupported: false,
        supportsVision: false,
        supportsTts: false,
        supportsJson: true,
        supportsTools: true,
        maxTokens: 16384,
        costPerTokenInputCents: 0.0001,
        costPerTokenOutputCents: 0.0004,
        notes: 'Cheapest, fastest OpenAI model for scout tasks'
      },
      {
        providerId: 'openai',
        modelId: 'gpt-4.1-mini',
        label: 'GPT-4.1 Mini',
        roles: ['scout', 'worker'],
        lanes: ['chat'],
        capabilities: ['chat', 'json', 'tool_calling'],
        stability: 'stable',
        isDefault: true,
        isEnabled: true,
        envKeyName: 'OPENAI_API_KEY',
        costClass: 'cheap',
        reasoningModeSupported: false,
        supportsVision: false,
        supportsTts: false,
        supportsJson: true,
        supportsTools: true,
        maxTokens: 16384,
        costPerTokenInputCents: 0.0004,
        costPerTokenOutputCents: 0.0016,
        notes: 'Default worker model, good balance of speed and quality'
      },
      {
        providerId: 'openai',
        modelId: 'gpt-4.1',
        label: 'GPT-4.1',
        roles: ['worker', 'reasoner'],
        lanes: ['chat'],
        capabilities: ['chat', 'json', 'tool_calling'],
        stability: 'stable',
        isDefault: false,
        isEnabled: true,
        envKeyName: 'OPENAI_API_KEY',
        costClass: 'medium',
        reasoningModeSupported: false,
        supportsVision: false,
        supportsTts: false,
        supportsJson: true,
        supportsTools: true,
        maxTokens: 16384,
        costPerTokenInputCents: 0.002,
        costPerTokenOutputCents: 0.008,
        notes: 'Higher quality for complex tasks'
      },
      {
        providerId: 'openai',
        modelId: 'gpt-5-fast',
        label: 'GPT-5 Fast',
        roles: ['worker'],
        lanes: ['chat'],
        capabilities: ['chat', 'json', 'tool_calling'],
        stability: 'stable',
        isDefault: false,
        isEnabled: true,
        envKeyName: 'OPENAI_API_KEY',
        costClass: 'medium',
        reasoningModeSupported: false,
        supportsVision: false,
        supportsTts: false,
        supportsJson: true,
        supportsTools: true,
        maxTokens: 32768,
        costPerTokenInputCents: 0.002,
        costPerTokenOutputCents: 0.008,
        notes: 'GPT-5 non-reasoning mode, fast responses'
      },
      {
        providerId: 'openai',
        modelId: 'gpt-5-thinking',
        label: 'GPT-5 Thinking',
        roles: ['reasoner'],
        lanes: ['reasoning'],
        capabilities: ['chat', 'reasoning', 'json', 'tool_calling'],
        stability: 'stable',
        isDefault: false,
        isEnabled: true,
        envKeyName: 'OPENAI_API_KEY',
        costClass: 'expensive',
        reasoningModeSupported: true,
        supportsVision: false,
        supportsTts: false,
        supportsJson: true,
        supportsTools: true,
        maxTokens: 32768,
        costPerTokenInputCents: 0.005,
        costPerTokenOutputCents: 0.015,
        notes: 'GPT-5 with reasoning.effort, for complex synthesis'
      },
      {
        providerId: 'openai',
        modelId: 'gpt-4.1-vision',
        label: 'GPT-4.1 Vision',
        roles: ['vision_ocr'],
        lanes: ['vision'],
        capabilities: ['chat', 'vision', 'ocr', 'json'],
        stability: 'stable',
        isDefault: false,
        isEnabled: true,
        envKeyName: 'OPENAI_API_KEY',
        costClass: 'medium',
        reasoningModeSupported: false,
        supportsVision: true,
        supportsTts: false,
        supportsJson: true,
        supportsTools: false,
        maxTokens: 16384,
        costPerTokenInputCents: 0.002,
        costPerTokenOutputCents: 0.008,
        notes: 'Vision-capable for screenshot/document analysis'
      }
    ]
  },

  // === XAI ===
  {
    id: 'xai',
    name: 'xAI',
    envKeyName: 'XAI_API_KEY',
    baseUrl: 'https://api.x.ai/v1',
    models: [
      {
        providerId: 'xai',
        modelId: 'grok-4-1-fast-non-reasoning',
        label: 'Grok 4.1 Fast',
        roles: ['scout', 'worker'],
        lanes: ['chat'],
        capabilities: ['chat', 'json', 'tool_calling'],
        stability: 'stable',
        isDefault: false,
        isEnabled: true,
        envKeyName: 'XAI_API_KEY',
        costClass: 'cheap',
        reasoningModeSupported: false,
        supportsVision: false,
        supportsTts: false,
        supportsJson: true,
        supportsTools: true,
        maxTokens: 16384,
        costPerTokenInputCents: 0.0002,
        costPerTokenOutputCents: 0.0008,
        notes: 'Fast Grok for scout/worker tasks'
      },
      {
        providerId: 'xai',
        modelId: 'grok-4-1-fast-reasoning',
        label: 'Grok 4.1 Reasoning',
        roles: ['reasoner'],
        lanes: ['reasoning'],
        capabilities: ['chat', 'reasoning', 'json', 'tool_calling'],
        stability: 'stable',
        isDefault: false,
        isEnabled: true,
        envKeyName: 'XAI_API_KEY',
        costClass: 'medium',
        reasoningModeSupported: true,
        supportsVision: false,
        supportsTts: false,
        supportsJson: true,
        supportsTools: true,
        maxTokens: 16384,
        costPerTokenInputCents: 0.001,
        costPerTokenOutputCents: 0.004,
        notes: 'Grok with reasoning for complex tasks'
      }
    ]
  },

  // === GEMINI ===
  {
    id: 'gemini',
    name: 'Google Gemini',
    envKeyName: 'GOOGLE_AI_KEY',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: [
      {
        providerId: 'gemini',
        modelId: 'gemini-2.5-flash-lite',
        label: 'Gemini 2.5 Flash Lite',
        roles: ['scout', 'worker'],
        lanes: ['chat'],
        capabilities: ['chat', 'json', 'tool_calling'],
        stability: 'stable',
        isDefault: false,
        isEnabled: true,
        envKeyName: 'GOOGLE_AI_KEY',
        costClass: 'cheap',
        reasoningModeSupported: false,
        supportsVision: false,
        supportsTts: false,
        supportsJson: true,
        supportsTools: true,
        maxTokens: 8192,
        costPerTokenInputCents: 0.00001875,
        costPerTokenOutputCents: 0.000075,
        notes: 'Cheapest Gemini, stable scout default'
      },
      {
        providerId: 'gemini',
        modelId: 'gemini-2.5-flash',
        label: 'Gemini 2.5 Flash',
        roles: ['worker', 'vision_ocr'],
        lanes: ['chat', 'vision'],
        capabilities: ['chat', 'vision', 'ocr', 'json', 'tool_calling'],
        stability: 'stable',
        isDefault: false,
        isEnabled: true,
        envKeyName: 'GOOGLE_AI_KEY',
        costClass: 'cheap',
        reasoningModeSupported: false,
        supportsVision: true,
        supportsTts: false,
        supportsJson: true,
        supportsTools: true,
        maxTokens: 8192,
        costPerTokenInputCents: 0.000075,
        costPerTokenOutputCents: 0.0003,
        notes: 'Flash with vision for worker and screenshot analysis'
      },
      {
        providerId: 'gemini',
        modelId: 'gemini-2.5-pro',
        label: 'Gemini 2.5 Pro',
        roles: ['reasoner'],
        lanes: ['reasoning'],
        capabilities: ['chat', 'reasoning', 'vision', 'json', 'tool_calling'],
        stability: 'stable',
        isDefault: false,
        isEnabled: true,
        envKeyName: 'GOOGLE_AI_KEY',
        costClass: 'medium',
        reasoningModeSupported: true,
        supportsVision: true,
        supportsTts: false,
        supportsJson: true,
        supportsTools: true,
        maxTokens: 8192,
        costPerTokenInputCents: 0.00125,
        costPerTokenOutputCents: 0.005,
        notes: 'Pro for reasoning and synthesis'
      },
      {
        providerId: 'gemini',
        modelId: 'gemini-3.1-flash-lite-preview',
        label: 'Gemini 3.1 Flash Lite (Preview)',
        roles: ['scout'],
        lanes: ['chat'],
        capabilities: ['chat', 'json', 'tool_calling'],
        stability: 'preview',
        isDefault: false,
        isEnabled: true,
        envKeyName: 'GOOGLE_AI_KEY',
        costClass: 'cheap',
        reasoningModeSupported: false,
        supportsVision: false,
        supportsTts: false,
        supportsJson: true,
        supportsTools: true,
        maxTokens: 8192,
        costPerTokenInputCents: 0.00001875,
        costPerTokenOutputCents: 0.000075,
        notes: 'Preview model, not for production'
      },
      {
        providerId: 'gemini',
        modelId: 'gemini-flash-lite-latest',
        label: 'Gemini Flash Lite (Alias)',
        roles: ['scout'],
        lanes: ['chat'],
        capabilities: ['chat', 'json', 'tool_calling'],
        stability: 'alias',
        isDefault: false,
        isEnabled: true,
        envKeyName: 'GOOGLE_AI_KEY',
        costClass: 'cheap',
        reasoningModeSupported: false,
        supportsVision: false,
        supportsTts: false,
        supportsJson: true,
        supportsTools: true,
        maxTokens: 8192,
        costPerTokenInputCents: 0.00001875,
        costPerTokenOutputCents: 0.000075,
        notes: 'Alias pointing to latest flash-lite, NOT authoritative'
      },
      {
        providerId: 'gemini',
        modelId: 'gemini-tts',
        label: 'Gemini TTS',
        roles: ['tts'],
        lanes: ['audio'],
        capabilities: ['tts'],
        stability: 'stable',
        isDefault: false,
        isEnabled: true,
        envKeyName: 'GOOGLE_AI_KEY',
        costClass: 'cheap',
        reasoningModeSupported: false,
        supportsVision: false,
        supportsTts: true,
        supportsJson: false,
        supportsTools: false,
        maxTokens: 4096,
        costPerTokenInputCents: 0.00001,
        costPerTokenOutputCents: 0.00001,
        notes: 'Text-to-speech lane'
      }
    ]
  },

  // === DEEPSEEK ===
  {
    id: 'deepseek',
    name: 'DeepSeek',
    envKeyName: 'DEEPSEEK_API_KEY',
    baseUrl: 'https://api.deepseek.com/v1',
    models: [
      {
        providerId: 'deepseek',
        modelId: 'deepseek-chat',
        label: 'DeepSeek Chat',
        roles: ['scout', 'worker'],
        lanes: ['chat'],
        capabilities: ['chat', 'json'],
        stability: 'stable',
        isDefault: false,
        isEnabled: true,
        envKeyName: 'DEEPSEEK_API_KEY',
        costClass: 'cheap',
        reasoningModeSupported: false,
        supportsVision: false,
        supportsTts: false,
        supportsJson: true,
        supportsTools: false,
        maxTokens: 8192,
        costPerTokenInputCents: 0.000014,
        costPerTokenOutputCents: 0.000028,
        notes: 'Very cheap scout/worker option'
      },
      {
        providerId: 'deepseek',
        modelId: 'deepseek-reasoner',
        label: 'DeepSeek Reasoner',
        roles: ['reasoner'],
        lanes: ['reasoning'],
        capabilities: ['chat', 'reasoning', 'json'],
        stability: 'stable',
        isDefault: false,
        isEnabled: true,
        envKeyName: 'DEEPSEEK_API_KEY',
        costClass: 'cheap',
        reasoningModeSupported: true,
        supportsVision: false,
        supportsTts: false,
        supportsJson: true,
        supportsTools: false,
        maxTokens: 8192,
        costPerTokenInputCents: 0.000055,
        costPerTokenOutputCents: 0.000219,
        notes: 'Cheap reasoning alternative'
      }
    ]
  },

  // === ANTHROPIC ===
  {
    id: 'anthropic',
    name: 'Anthropic',
    envKeyName: 'ANTHROPIC_API_KEY',
    baseUrl: 'https://api.anthropic.com/v1',
    models: [
      {
        providerId: 'anthropic',
        modelId: 'claude-sonnet-4',
        label: 'Claude Sonnet 4',
        roles: ['reasoner'],
        lanes: ['reasoning'],
        capabilities: ['chat', 'reasoning', 'vision', 'json', 'tool_calling'],
        stability: 'stable',
        isDefault: false,
        isEnabled: true,
        envKeyName: 'ANTHROPIC_API_KEY',
        costClass: 'medium',
        reasoningModeSupported: true,
        supportsVision: true,
        supportsTts: false,
        supportsJson: true,
        supportsTools: true,
        maxTokens: 16384,
        costPerTokenInputCents: 0.003,
        costPerTokenOutputCents: 0.015,
        notes: 'High-quality reasoner and verifier'
      },
      {
        providerId: 'anthropic',
        modelId: 'claude-haiku-4',
        label: 'Claude Haiku 4',
        roles: ['worker'],
        lanes: ['chat'],
        capabilities: ['chat', 'json', 'tool_calling'],
        stability: 'stable',
        isDefault: false,
        isEnabled: true,
        envKeyName: 'ANTHROPIC_API_KEY',
        costClass: 'cheap',
        reasoningModeSupported: false,
        supportsVision: false,
        supportsTts: false,
        supportsJson: true,
        supportsTools: true,
        maxTokens: 8192,
        costPerTokenInputCents: 0.0008,
        costPerTokenOutputCents: 0.004,
        notes: 'Fast worker option'
      }
    ]
  },

  // === MOCK ===
  {
    id: 'mock',
    name: 'Mock (Development)',
    envKeyName: 'MOCK',
    models: [
      {
        providerId: 'mock',
        modelId: 'mock',
        label: 'Mock Model',
        roles: ['scout', 'worker', 'reasoner', 'vision_ocr', 'tts'],
        lanes: ['chat', 'reasoning', 'vision', 'audio'],
        capabilities: ['chat', 'reasoning', 'vision', 'ocr', 'tts', 'json', 'tool_calling'],
        stability: 'stable',
        isDefault: true,
        isEnabled: true,
        envKeyName: 'MOCK',
        costClass: 'cheap',
        reasoningModeSupported: true,
        supportsVision: true,
        supportsTts: true,
        supportsJson: true,
        supportsTools: true,
        maxTokens: 4096,
        costPerTokenInputCents: 0,
        costPerTokenOutputCents: 0,
        notes: 'Fallback when no API keys configured'
      }
    ]
  }
];

// === Escalation Rules ===

export const ESCALATION_RULES: EscalationRule[] = [
  {
    fromRole: 'scout',
    toRole: 'worker',
    trigger: 'task_too_complex',
    description: 'Escalate when scout detects task needs more depth'
  },
  {
    fromRole: 'worker',
    toRole: 'reasoner',
    trigger: 'synthesis_needed',
    description: 'Escalate for complex synthesis, review, or conflict resolution'
  },
  {
    fromRole: 'worker',
    toRole: 'vision_ocr',
    trigger: 'image_input_detected',
    description: 'Route to vision when image/screenshot detected'
  },
  {
    fromRole: 'reasoner',
    toRole: 'worker',
    trigger: 'task_simplified',
    description: 'Downgrade when reasoning not needed'
  }
];

// === Helper Functions ===

export function getProviderConfig(providerId: string): ProviderConfig | undefined {
  return PROVIDER_REGISTRY.find(p => p.id === providerId);
}

export function getModelEntry(providerId: string, modelId: string): ProviderRegistryEntry | undefined {
  const provider = getProviderConfig(providerId);
  return provider?.models.find(m => m.modelId === modelId);
}

export function getModelsByRole(role: ModelRole): ProviderRegistryEntry[] {
  return PROVIDER_REGISTRY.flatMap(p => p.models.filter(m => m.roles.includes(role) && m.isEnabled));
}

export function getModelsByLane(lane: ModelLane): ProviderRegistryEntry[] {
  return PROVIDER_REGISTRY.flatMap(p => p.models.filter(m => m.lanes.includes(lane) && m.isEnabled));
}

export function getModelsByProvider(providerId: string): ProviderRegistryEntry[] {
  const provider = getProviderConfig(providerId);
  return provider?.models.filter(m => m.isEnabled) || [];
}

export function isProviderKeyConfigured(providerId: string): boolean {
  if (providerId === 'mock') return true;
  const provider = getProviderConfig(providerId);
  if (!provider) return false;
  return Boolean(process.env[provider.envKeyName]);
}

export function getAvailableProviders(): ProviderConfig[] {
  return PROVIDER_REGISTRY.filter(p => 
    p.id === 'mock' || isProviderKeyConfigured(p.id)
  );
}

export function getDefaultForRole(role: ModelRole): ProviderRegistryEntry | null {
  // Priority: OpenAI > Gemini > xAI > DeepSeek > Anthropic > Mock
  const priority = ['openai', 'gemini', 'xai', 'deepseek', 'anthropic', 'mock'];
  
  for (const providerId of priority) {
    const provider = getProviderConfig(providerId);
    if (!provider) continue;
    
    const model = provider.models.find(m => 
      m.roles.includes(role) && 
      m.isDefault && 
      m.isEnabled && 
      isProviderKeyConfigured(providerId)
    );
    
    if (model) return model;
  }
  
  // Fallback to first available model for role
  const available = getModelsByRole(role).filter(m => isProviderKeyConfigured(m.providerId));
  return available[0] || null;
}

export function getRoleDefaults(): RoleDefaults {
  return {
    scout_default: getDefaultForRole('scout'),
    worker_default: getDefaultForRole('worker'),
    reasoner_default: getDefaultForRole('reasoner'),
    vision_default: getDefaultForRole('vision_ocr'),
    tts_default: getDefaultForRole('tts')
  };
}

export function validateModelForRole(model: ProviderRegistryEntry, role: ModelRole): boolean {
  return model.roles.includes(role) && model.isEnabled;
}

export function validateModelForLane(model: ProviderRegistryEntry, lane: ModelLane): boolean {
  return model.lanes.includes(lane) && model.isEnabled;
}

export function getStabilityWarning(model: ProviderRegistryEntry): string | null {
  if (model.stability === 'preview') {
    return 'Preview model - not recommended for production use';
  }
  if (model.stability === 'alias') {
    return 'Alias model - may point to different underlying model over time';
  }
  return null;
}

export function getCostWarning(model: ProviderRegistryEntry): string | null {
  if (model.costClass === 'expensive') {
    return 'Expensive model - use for complex tasks only';
  }
  return null;
}
