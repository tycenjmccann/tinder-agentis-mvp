import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAgentStatus } from '../useAgentStatus';
import { server } from '../../../test/mocks/server';
import { http, HttpResponse } from 'msw';
import { mockAgents } from '../../../test/mocks/handlers';

describe('useAgentStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Document visible by default
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should fetch agents on mount', async () => {
    vi.useRealTimers();
    const { result } = renderHook(() => useAgentStatus());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.agents).toHaveLength(mockAgents.length);
    expect(result.current.isError).toBe(false);
  });

  it('should set error state on fetch failure', async () => {
    vi.useRealTimers();
    server.use(
      http.get('/api/agents/status', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const { result } = renderHook(() => useAgentStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeTruthy();
    expect(result.current.isStale).toBe(true);
  });

  it('should handle 401 and stop after 2 consecutive failures', async () => {
    vi.useRealTimers();
    let callCount = 0;
    server.use(
      http.get('/api/agents/status', () => {
        callCount++;
        return new HttpResponse(null, { status: 401 });
      })
    );

    const { result } = renderHook(() =>
      useAgentStatus({ pollingInterval: 100 })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // After 2 consecutive 401s, should set error
    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error?.message).toBe('Authentication expired');
      },
      { timeout: 3000 }
    );
  });

  it('should handle 429 rate limiting', async () => {
    vi.useRealTimers();
    server.use(
      http.get('/api/agents/status', () => {
        return new HttpResponse(null, {
          status: 429,
          headers: { 'Retry-After': '60' },
        });
      })
    );

    const { result } = renderHook(() => useAgentStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isStale).toBe(true);
  });

  it('should not poll when disabled', async () => {
    vi.useRealTimers();
    let callCount = 0;
    server.use(
      http.get('/api/agents/status', () => {
        callCount++;
        return HttpResponse.json({ agents: mockAgents });
      })
    );

    renderHook(() => useAgentStatus({ enabled: false }));

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(callCount).toBe(0);
  });

  it('should allow manual refetch', async () => {
    vi.useRealTimers();
    const { result } = renderHook(() => useAgentStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.refetch();
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.agents).toHaveLength(mockAgents.length);
  });
});
