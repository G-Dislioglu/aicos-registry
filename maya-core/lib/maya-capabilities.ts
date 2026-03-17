import { NextResponse } from 'next/server';

import { getMayaRuntimeConfig } from '@/lib/maya-env';

export function getPostgresCapabilityErrorResponse(capability: string) {
  const runtime = getMayaRuntimeConfig();

  if (runtime.storageDriver === 'postgres') {
    return null;
  }

  return NextResponse.json(
    {
      error: 'not_available_in_file_mode',
      code: 'not_available_in_file_mode',
      capability,
      storageDriver: runtime.storageDriver,
      message: 'This capability requires postgres storage.'
    },
    { status: 503 }
  );
}

export function isFileModeCapabilityError(value: unknown): value is { code: string } {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'code' in value &&
      (value as { code?: string }).code === 'not_available_in_file_mode'
  );
}
