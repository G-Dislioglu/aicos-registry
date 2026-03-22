import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const isMayaAuthConfiguredMock = vi.fn();
const isMayaRequestEdgeAuthorizedMock = vi.fn();

vi.mock('@/lib/maya-env', () => ({
  isMayaAuthConfigured: isMayaAuthConfiguredMock
}));

vi.mock('@/lib/maya-auth-edge', () => ({
  isMayaRequestEdgeAuthorized: isMayaRequestEdgeAuthorizedMock
}));

describe('middleware auth guardrails', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    isMayaAuthConfiguredMock.mockReturnValue(true);
    isMayaRequestEdgeAuthorizedMock.mockResolvedValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('redirects page requests with an invalid maya session cookie to login', async () => {
    const { middleware } = await import('../middleware');
    const request = new NextRequest('http://localhost:3000/', {
      headers: {
        cookie: 'maya_session=stale-token'
      }
    });

    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/login?next=%2F');
    expect(isMayaRequestEdgeAuthorizedMock).toHaveBeenCalledTimes(1);
  });

  it('returns 401 for api requests with an invalid maya session cookie', async () => {
    const { middleware } = await import('../middleware');
    const request = new NextRequest('http://localhost:3000/api/state', {
      headers: {
        cookie: 'maya_session=stale-token'
      }
    });

    const response = await middleware(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'unauthorized' });
    expect(isMayaRequestEdgeAuthorizedMock).toHaveBeenCalledTimes(1);
  });

  it('allows protected requests to continue when the maya session cookie is valid', async () => {
    isMayaRequestEdgeAuthorizedMock.mockResolvedValue(true);
    const { middleware } = await import('../middleware');
    const request = new NextRequest('http://localhost:3000/', {
      headers: {
        cookie: 'maya_session=valid-token'
      }
    });

    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
    expect(isMayaRequestEdgeAuthorizedMock).toHaveBeenCalledTimes(1);
  });

  it('redirects protected page requests to misconfigured login when auth is not configured', async () => {
    isMayaAuthConfiguredMock.mockReturnValue(false);
    const { middleware } = await import('../middleware');
    const request = new NextRequest('http://localhost:3000/');

    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/login?mode=misconfigured');
    expect(isMayaRequestEdgeAuthorizedMock).not.toHaveBeenCalled();
  });
});
