import { AppLanguage } from '@/lib/types';

export type MayaStorageDriver = 'file' | 'postgres';

export type MayaRuntimeConfig = {
  authSecret: string;
  databaseUrl: string;
  passphrase: string;
  seedLanguage: AppLanguage;
  storageDriver: MayaStorageDriver;
};

function readTrimmedEnv(name: string) {
  return String(process.env[name] || '').trim();
}

function isRenderRuntime() {
  return readTrimmedEnv('RENDER') === 'true';
}

function isProductionRuntime() {
  return process.env.NODE_ENV === 'production';
}

export function getMayaRuntimeConfig(): MayaRuntimeConfig {
  const driver = readTrimmedEnv('MAYA_STORAGE_DRIVER');
  const seedLanguage = readTrimmedEnv('MAYA_SEED_LANGUAGE') === 'en' ? 'en' : 'de';
  const renderRuntime = isRenderRuntime();
  const productionRuntime = isProductionRuntime();
  const fallbackAuthSecret = !renderRuntime && !productionRuntime ? 'maya-local-auth-secret' : '';
  const fallbackPassphrase = !renderRuntime && !productionRuntime ? 'geselle' : '';

  return {
    authSecret: readTrimmedEnv('MAYA_AUTH_SECRET') || fallbackAuthSecret,
    databaseUrl: readTrimmedEnv('DATABASE_URL'),
    passphrase: readTrimmedEnv('MAYA_PASSPHRASE') || fallbackPassphrase,
    seedLanguage,
    storageDriver: driver === 'postgres' ? 'postgres' : driver === 'file' ? 'file' : renderRuntime ? 'postgres' : 'file'
  };
}

export function isMayaAuthConfigured() {
  const config = getMayaRuntimeConfig();
  return Boolean(config.authSecret && config.passphrase);
}

export function assertMayaAuthConfigured() {
  const config = getMayaRuntimeConfig();

  if (!config.authSecret || !config.passphrase) {
    throw new Error('maya_auth_not_configured');
  }

  return config;
}

export function assertPostgresStorageConfigured() {
  const config = getMayaRuntimeConfig();

  if (config.storageDriver !== 'postgres') {
    throw new Error('maya_storage_driver_not_postgres');
  }

  if (!config.databaseUrl) {
    throw new Error('maya_database_url_required');
  }

  return config;
}
