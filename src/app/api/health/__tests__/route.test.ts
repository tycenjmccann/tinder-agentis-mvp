import { describe, it, expect, vi } from 'vitest';
import { GET } from '../route';

// Mock next/server
vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown) => ({
      json: async () => body,
      status: 200,
    }),
  },
}));

describe('GET /api/health', () => {
  it('returns status ok', async () => {
    const response = await GET();
    const body = await response.json();

    expect(body.status).toBe('ok');
  });

  it('returns a valid ISO timestamp', async () => {
    const before = new Date().toISOString();
    const response = await GET();
    const body = await response.json();
    const after = new Date().toISOString();

    expect(body.timestamp).toBeDefined();
    // Timestamp should be between before and after
    expect(body.timestamp >= before).toBe(true);
    expect(body.timestamp <= after).toBe(true);
  });

  it('returns the version from package.json', async () => {
    const response = await GET();
    const body = await response.json();

    expect(body.version).toBe('0.1.0');
  });

  it('returns all required fields', async () => {
    const response = await GET();
    const body = await response.json();

    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('version');
  });
});
