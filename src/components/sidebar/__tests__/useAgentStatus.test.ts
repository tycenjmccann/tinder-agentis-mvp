import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useAgentStatus } from '../useAgentStatus';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock document.hidden
Object.defineProperty(document, 'hidden', {
  writable: true,
  value: false,
});

describe('useAgentStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockAgentsResponse = {
    agents: [
      { id: 'agent-1', name: 'Frontend Dev', role: 'frontend', status: 'active', lastActivity: '2026-01-01T00:00:00Z' },
      { id: 'agent-2', name: 'Backend Dev', role: 'backend', status: 'idle', lastActivity: '2026-01-01T00:00:00Z' },
      { id: 'agent-3', name: 'QA Agent', role: 'qa', status: 'error', lastActivity: '2026-01-01T00:00:00Z' },
    ],
  };

  it('fetches agents on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockAgentsResponse),
    });

    const { result } = renderHook(() => useAgentStatus({ pollingInterval: 10000 }));

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.agents).toHaveLength(3);
    expect(result.current.agents[0].name).toBe('Frontend Dev');
    expect(result.current.isError).toBe(false);
  });

  it('handles fetch errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useAgentStatus({ pollingInterval: 10000 }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error?.message).toBe('Network error');
    expect(result.current.isStale).toBe(true);
  });

  it('handles 429 rate limiting', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      headers: new Headers({ 'Retry-After': '60' }),
    });

    const { result } = renderHook(() => useAgentStatus({ pollingInterval: 10000 }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isStale).toBe(true);
  });

  it('stops after 2 consecutive 401s', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce({ ok: false, status: 401 });

    const { result } = renderHook(() => useAgentStatus({ pollingInterval: 10000 }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // After first 401, should still allow retry (polling schedules next)
    // Advance timer to trigger next poll
    act(() => { vi.advanceTimersByTime(12000); });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Authentication expired');
  });

  it('refetch resets error state', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAgentsResponse),
      });

    const { result } = renderHook(() => useAgentStatus({ pollingInterval: 10000 }));

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(false);
      expect(result.current.agents).toHaveLength(3);
    });
  });
});
