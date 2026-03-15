import { NextRequest, NextResponse } from 'next/server';

import { isMayaRequestAuthorized } from '@/lib/maya-auth';
import { getProviders, detectDefaultProvider, getProvider } from '@/lib/maya-provider';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type ProviderStatus = {
  type: string;
  name: string;
  configured: boolean;
  available: boolean;
  status: 'ready' | 'not_configured' | 'error';
  defaultModel: string;
  models: Array<{ id: string; name: string }>;
};

export async function GET(request: NextRequest) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const providers = getProviders();
    const defaultProviderType = detectDefaultProvider();
    const defaultProvider = getProvider(defaultProviderType);

    // Build detailed provider status
    const providerStatuses: ProviderStatus[] = providers.map(p => ({
      type: p.type,
      name: p.name,
      configured: p.available,
      available: p.available,
      status: p.available ? 'ready' as const : 'not_configured' as const,
      defaultModel: p.defaultModel,
      models: p.models.map(m => ({ id: m.id, name: m.name }))
    }));

    // Determine overall status
    const hasRealProvider = providers.some(p => p.available && p.type !== 'mock');
    const isMockMode = defaultProviderType === 'mock';

    return NextResponse.json({
      providers: providerStatuses,
      defaultProvider: defaultProviderType,
      defaultModel: defaultProvider?.defaultModel || 'mock',
      hasRealProvider,
      isMockMode,
      status: isMockMode ? 'mock_mode' : 'live',
      message: isMockMode 
        ? 'No API key configured. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_AI_KEY for live responses.'
        : 'Real provider configured and ready.'
    });
  } catch (error) {
    return NextResponse.json({ error: 'providers_read_failed' }, { status: 500 });
  }
}
