import { describe, it, expect, vi } from 'vitest';
import { cookies } from 'next/headers';

// Mock the cookies function
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(() => undefined), // No session cookie
  })),
}));

describe('/api/state', () => {
  // PROVES: /api/state without session cookie returns 401
  it('returns 401 without session cookie', async () => {
    // Import after mocking
    const { GET } = await import('../../app/api/state/route');
    
    const response = await GET();
    
    expect(response.status).toBe(401);
    
    const body = await response.json();
    expect(body).toEqual({ error: 'unauthorized' });
  });
});
