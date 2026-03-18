// Static fallback — used when /api/maya/providers is unavailable or returns non-ok.
// Shell never blocks on endpoint failure. Per Handoff v4.3 §12.

export type FallbackModel = {
  id: string;
  name: string;
  roles: string[];
  stability: 'stable' | 'preview' | 'alias';
  isDefault: boolean;
  costClass: 'cheap' | 'medium' | 'expensive';
};

export type FallbackProvider = {
  id: string;
  name: string;
  configured: boolean;
  available: boolean;
  status: 'ready' | 'not_configured';
  defaultModel: string;
  models: FallbackModel[];
};

export const FALLBACK_PROVIDERS: FallbackProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    configured: false,
    available: false,
    status: 'not_configured',
    defaultModel: 'gpt-5-nano',
    models: [
      { id: 'gpt-5-nano',  name: 'gpt-5-nano',  roles: ['scout','worker'],            stability: 'stable',  isDefault: true,  costClass: 'cheap'  },
      { id: 'gpt-5-mini',  name: 'gpt-5-mini',  roles: ['worker','reasoner'],          stability: 'stable',  isDefault: false, costClass: 'medium' },
      { id: 'gpt-5',       name: 'gpt-5',        roles: ['worker','reasoner'],          stability: 'stable',  isDefault: false, costClass: 'expensive' }
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    configured: false,
    available: false,
    status: 'not_configured',
    defaultModel: 'claude-haiku-4-5',
    models: [
      { id: 'claude-haiku-4-5',   name: 'claude-haiku-4-5',   roles: ['scout','worker'],   stability: 'stable', isDefault: true,  costClass: 'cheap'  },
      { id: 'claude-sonnet-4-6',  name: 'claude-sonnet-4-6',  roles: ['worker','reasoner'],stability: 'stable', isDefault: false, costClass: 'medium' },
      { id: 'claude-opus-4-6',    name: 'claude-opus-4-6',    roles: ['reasoner'],         stability: 'stable', isDefault: false, costClass: 'expensive' }
    ]
  },
  {
    id: 'xai',
    name: 'xAI',
    configured: false,
    available: false,
    status: 'not_configured',
    defaultModel: 'grok-4-1-fast-non-reasoning',
    models: [
      { id: 'grok-4-1-fast-non-reasoning', name: 'grok-4-1-fast-non-reasoning', roles: ['worker'],          stability: 'stable', isDefault: true,  costClass: 'medium' },
      { id: 'grok-4-1-fast-reasoning',     name: 'grok-4-1-fast-reasoning',     roles: ['worker','reasoner'],stability: 'stable', isDefault: false, costClass: 'expensive' }
    ]
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    configured: false,
    available: false,
    status: 'not_configured',
    defaultModel: 'deepseek-chat',
    models: [
      { id: 'deepseek-chat',     name: 'deepseek-chat',     roles: ['scout','worker'],   stability: 'stable', isDefault: true,  costClass: 'cheap' },
      { id: 'deepseek-reasoner', name: 'deepseek-reasoner', roles: ['reasoner'],         stability: 'stable', isDefault: false, costClass: 'medium' }
    ]
  },
  {
    id: 'google',
    name: 'Google',
    configured: false,
    available: false,
    status: 'not_configured',
    defaultModel: 'gemini-2.5-flash',
    models: [
      { id: 'gemini-2.5-flash', name: 'gemini-2.5-flash', roles: ['scout','worker'],   stability: 'stable', isDefault: true,  costClass: 'cheap'  },
      { id: 'gemini-2.5-pro',   name: 'gemini-2.5-pro',   roles: ['worker','reasoner'],stability: 'stable', isDefault: false, costClass: 'expensive' }
    ]
  }
];
