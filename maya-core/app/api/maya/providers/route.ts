import { NextRequest, NextResponse } from 'next/server';

import { isMayaRequestAuthorized } from '@/lib/maya-auth';
import { getProviders, detectDefaultProvider } from '@/lib/maya-provider';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!(await isMayaRequestAuthorized(request as any))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const providers = getProviders();
    const defaultProvider = detectDefaultProvider();

    return NextResponse.json({
      providers,
      defaultProvider,
      available: providers.filter(p => p.available).map(p => p.type)
    });
  } catch (error) {
    return NextResponse.json({ error: 'providers_read_failed' }, { status: 500 });
  }
}
