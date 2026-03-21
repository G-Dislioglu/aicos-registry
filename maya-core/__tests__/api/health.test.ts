import { describe, it, expect } from 'vitest';
import { GET as healthGet } from '../../app/api/health/route';

describe('/api/health', () => {
  // PROVES: /api/health returns 200 + {status:'ok'} without auth
  it('returns 200 with status ok without auth', async () => {
    const response = await healthGet();
    
    expect(response.status).toBe(200);
    
    const body = await response.json();
    expect(body).toEqual({
      status: 'ok',
      app: 'maya-core'
    });
  });
});
