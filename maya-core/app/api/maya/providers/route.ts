import { NextRequest, NextResponse } from 'next/server';

import { isMayaRequestAuthorized } from '@/lib/maya-auth';
import {
  PROVIDER_REGISTRY,
  getRoleDefaults,
  getModelsByRole,
  isProviderKeyConfigured,
  ModelRole
} from '@/lib/maya-provider-registry';
import { getProviderStatuses } from '@/lib/maya-provider-dispatch';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type ProviderStatusResponse = {
  id: string;
  name: string;
  configured: boolean;
  available: boolean;
  status: 'ready' | 'not_configured' | 'error';
  defaultModel: string;
  models: Array<{
    id: string;
    name: string;
    roles: string[];
    stability: 'stable' | 'preview' | 'alias';
    isDefault: boolean;
    costClass: 'cheap' | 'medium' | 'expensive';
  }>;
};

export async function GET(request: NextRequest) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const providerStatuses = getProviderStatuses();
    const roleDefaults = getRoleDefaults();

    // Build detailed provider response
    const providers: ProviderStatusResponse[] = PROVIDER_REGISTRY.map(provider => {
      const configured = isProviderKeyConfigured(provider.id);

      return {
        id: provider.id,
        name: provider.name,
        configured,
        available: configured,
        status: configured ? 'ready' : 'not_configured',
        defaultModel: provider.models.find(m => m.isDefault)?.modelId || provider.models[0]?.modelId || '',
        models: provider.models
          .filter(m => m.isEnabled)
          .map(m => ({
            id: m.modelId,
            name: m.label,
            roles: m.roles,
            stability: m.stability,
            isDefault: m.isDefault,
            costClass: m.costClass
          }))
      };
    });

    // Build role-based model lists
    const modelsByRole: Record<ModelRole, Array<{ providerId: string; modelId: string; label: string; stability: string }>> = {
      scout: getModelsByRole('scout')
        .filter(m => isProviderKeyConfigured(m.providerId))
        .map(m => ({ providerId: m.providerId, modelId: m.modelId, label: m.label, stability: m.stability })),
      worker: getModelsByRole('worker')
        .filter(m => isProviderKeyConfigured(m.providerId))
        .map(m => ({ providerId: m.providerId, modelId: m.modelId, label: m.label, stability: m.stability })),
      reasoner: getModelsByRole('reasoner')
        .filter(m => isProviderKeyConfigured(m.providerId))
        .map(m => ({ providerId: m.providerId, modelId: m.modelId, label: m.label, stability: m.stability })),
      vision_ocr: getModelsByRole('vision_ocr')
        .filter(m => isProviderKeyConfigured(m.providerId))
        .map(m => ({ providerId: m.providerId, modelId: m.modelId, label: m.label, stability: m.stability })),
      tts: getModelsByRole('tts')
        .filter(m => isProviderKeyConfigured(m.providerId))
        .map(m => ({ providerId: m.providerId, modelId: m.modelId, label: m.label, stability: m.stability }))
    };

    // Determine overall status
    const hasRealProvider = providers.some(p => p.configured && p.id !== 'mock');
    const isMockMode = !hasRealProvider;

    return NextResponse.json({
      providers,
      roleDefaults: {
        scout: roleDefaults.scout_default ? { providerId: roleDefaults.scout_default.providerId, modelId: roleDefaults.scout_default.modelId, label: roleDefaults.scout_default.label } : null,
        worker: roleDefaults.worker_default ? { providerId: roleDefaults.worker_default.providerId, modelId: roleDefaults.worker_default.modelId, label: roleDefaults.worker_default.label } : null,
        reasoner: roleDefaults.reasoner_default ? { providerId: roleDefaults.reasoner_default.providerId, modelId: roleDefaults.reasoner_default.modelId, label: roleDefaults.reasoner_default.label } : null,
        vision: roleDefaults.vision_default ? { providerId: roleDefaults.vision_default.providerId, modelId: roleDefaults.vision_default.modelId, label: roleDefaults.vision_default.label } : null,
        tts: roleDefaults.tts_default ? { providerId: roleDefaults.tts_default.providerId, modelId: roleDefaults.tts_default.modelId, label: roleDefaults.tts_default.label } : null
      },
      modelsByRole,
      hasRealProvider,
      isMockMode,
      status: isMockMode ? 'mock_mode' : 'live',
      message: isMockMode
        ? 'No API key configured. Set OPENAI_API_KEY, XAI_API_KEY, GOOGLE_AI_KEY, DEEPSEEK_API_KEY, or ANTHROPIC_API_KEY for live responses.'
        : 'Real provider configured and ready.'
    });
  } catch (error) {
    return NextResponse.json({ error: 'providers_read_failed' }, { status: 500 });
  }
}
