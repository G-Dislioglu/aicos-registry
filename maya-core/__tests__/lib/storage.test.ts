import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getMayaRuntimeConfig } from '../../lib/maya-env';

describe('storageAdapter (via getMayaRuntimeConfig)', () => {
  beforeEach(() => {
    // Clear any existing env
    delete process.env.MAYA_STORAGE_DRIVER;
    delete process.env.RENDER;
  });

  afterEach(() => {
    // Cleanup
    delete process.env.MAYA_STORAGE_DRIVER;
    delete process.env.RENDER;
  });

  // PROVES: storageAdapter resolves to 'file' when MAYA_STORAGE_DRIVER=file
  it('returns file driver when MAYA_STORAGE_DRIVER=file', () => {
    // ARRANGE: Set environment variable
    process.env.MAYA_STORAGE_DRIVER = 'file';
    process.env.RENDER = '';
    
    // ACT: Call the function
    const config = getMayaRuntimeConfig();
    
    // ASSERT: storageDriver should be 'file'
    expect(config.storageDriver).toBe('file');
  });

  // Additional: verify postgres driver when set
  it('returns postgres driver when MAYA_STORAGE_DRIVER=postgres', () => {
    process.env.MAYA_STORAGE_DRIVER = 'postgres';
    process.env.RENDER = '';
    
    const config = getMayaRuntimeConfig();
    
    expect(config.storageDriver).toBe('postgres');
  });
});
