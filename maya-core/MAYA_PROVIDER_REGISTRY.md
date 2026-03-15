# Maya Provider Registry

## Overview

Maya supports multiple LLM providers with role-based model selection. The registry defines which models are available for each role (Scout, Worker, Reasoner, Vision/OCR, TTS) and handles provider-specific execution logic.

## Roles

| Role | Purpose | Cost | Speed | Use Case |
|------|---------|------|-------|----------|
| **Scout** | First-pass, overview, preview | Cheap | Fast | High-frequency, simple queries |
| **Worker** | Daily standard chat | Medium | Balanced | Default production path |
| **Reasoner** | Deep thinking, synthesis | Expensive | Slow | Complex tasks, review, conflicts |
| **Vision/OCR** | Screenshot/image analysis | Medium | Varies | UI/document reading |
| **TTS** | Text-to-speech | Cheap | Fast | Audio output |

## Supported Providers

### OpenAI
- **ENV**: `OPENAI_API_KEY`
- **Models**:
  - `gpt-4.1-nano` → Scout
  - `gpt-4.1-mini` → Scout, Worker (default)
  - `gpt-4.1` → Worker, Reasoner
  - `gpt-5-fast` → Worker
  - `gpt-5-thinking` → Reasoner (reasoning mode)
  - `gpt-4.1-vision` → Vision/OCR

### xAI
- **ENV**: `XAI_API_KEY`
- **Models**:
  - `grok-4-1-fast-non-reasoning` → Scout, Worker
  - `grok-4-1-fast-reasoning` → Reasoner

### Google Gemini
- **ENV**: `GOOGLE_AI_KEY`
- **Models**:
  - `gemini-2.5-flash-lite` → Scout, Worker (stable)
  - `gemini-2.5-flash` → Worker, Vision/OCR
  - `gemini-2.5-pro` → Reasoner
  - `gemini-3.1-flash-lite-preview` → Scout (preview)
  - `gemini-flash-lite-latest` → Scout (alias, not authoritative)
  - `gemini-tts` → TTS

### DeepSeek
- **ENV**: `DEEPSEEK_API_KEY`
- **Models**:
  - `deepseek-chat` → Scout, Worker
  - `deepseek-reasoner` → Reasoner

### Anthropic
- **ENV**: `ANTHROPIC_API_KEY`
- **Models**:
  - `claude-sonnet-4` → Reasoner
  - `claude-haiku-4` → Worker

## Model Stability

| Stability | Description | Recommendation |
|-----------|-------------|---------------|
| `stable` | Pinned model ID | Production use |
| `preview` | Experimental model | Testing only |
| `alias` | Points to latest | Not authoritative |

## Cost Classes

| Class | Use Case |
|-------|----------|
| `cheap` | Scout, high-frequency tasks |
| `medium` | Worker, standard tasks |
| `expensive` | Reasoner, complex synthesis |

## Escalation Rules

1. **Scout → Worker**: Task too complex for scout
2. **Worker → Reasoner**: Synthesis, review, conflict resolution needed
3. **Worker → Vision/OCR**: Image/screenshot detected
4. **Reasoner → Worker**: Task simplified

## Defaults Priority

When multiple providers have keys configured:
1. OpenAI (highest priority)
2. Gemini
3. xAI
4. DeepSeek
5. Anthropic
6. Mock (fallback)

## API Endpoints

### GET /api/maya/providers
Returns provider status, role defaults, and models by role.

```json
{
  "providers": [...],
  "roleDefaults": {
    "scout": { "providerId": "openai", "modelId": "gpt-4.1-nano", "label": "GPT-4.1 Nano" },
    "worker": { "providerId": "openai", "modelId": "gpt-4.1-mini", "label": "GPT-4.1 Mini" },
    ...
  },
  "modelsByRole": {
    "scout": [...],
    "worker": [...],
    ...
  },
  "hasRealProvider": true,
  "isMockMode": false
}
```

### GET /api/maya/health
Returns health including role defaults.

```json
{
  "chatProvider": {
    "ready": true,
    "primaryProvider": "openai",
    "primaryModel": "gpt-4.1-mini",
    "isMockMode": false
  },
  "roleDefaults": { ... },
  ...
}
```

### POST /api/maya/chat
Accepts `role` parameter for role-aware dispatch.

```json
{
  "messages": [...],
  "role": "worker",
  "provider": "openai",
  "model": "gpt-4.1-mini",
  "reasoningEffort": "medium"
}
```

## UI Selection

The `/maya` UI provides:
- **Role Selector**: Scout/Worker/Reasoner/Vision/TTS
- **Provider Dropdown**: Filtered by availability
- **Model Dropdown**: Filtered by role, shows stability and cost
- **Status Indicator**: Mock/Live mode with provider info

## Implementation Files

| File | Purpose |
|------|---------|
| `lib/maya-provider-registry.ts` | Registry data, types, helper functions |
| `lib/maya-provider-dispatch.ts` | Multi-provider execution layer |
| `app/api/maya/providers/route.ts` | Providers API |
| `app/api/maya/health/route.ts` | Health API |
| `app/api/maya/chat/route.ts` | Chat dispatch |
| `components/maya-chat-screen.tsx` | UI with role selection |

## Adding New Providers

1. Add provider config to `PROVIDER_REGISTRY` in `maya-provider-registry.ts`
2. Add execution function in `maya-provider-dispatch.ts`
3. Add ENV key to `isProviderKeyConfigured` check
4. Update `MAYA_PROVIDER_SETUP.md` with new ENV variable

## Model Entry Schema

```typescript
type ProviderRegistryEntry = {
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
```
