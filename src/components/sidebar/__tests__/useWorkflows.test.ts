import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useWorkflows } from '../useWorkflows';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useWorkflows', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockWorkflows = [
    { id: 'wf-1', title: 'Deploy API v2', status: 'running', createdAt: '2026-05-20T06:50:00Z', updatedAt: '2026-05-20T06:50:00Z' },
    { id: 'wf-2', title: 'Test Suite Run', status: 'completed', createdAt: '2026-05-20T06:40:00Z', updatedAt: '2026-05-20T06:45:00Z' },
    { id: 'wf-3', title: 'Data Migration', status: 'failed', createdAt: '2026-05-20T06:30:00Z', updatedAt: '2026-05-20T06:35:00Z' },
  ];

  function mockSuccessResponse(data = mockWorkflows, hasMore = false) {
    return {
      ok: true,
      status: 200,
      json: async () => ({ workflows: data, total: data.length, page: 1, hasMore }),
    };
  }

  it('fetches workflows on mount', async () => {
    mockFetch.mockResolvedValueOnce(mockSuccessResponse());

    const { result } = renderHook(() => useWorkflows());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.workflows).toHaveLength(3);
    expect(result.current.workflows[0].title).toBe('Deploy API v2');
  });

  it('updates search query with debounce', async () => {
    mockFetch.mockResolvedValue(mockSuccessResponse());

    const { result } = renderHook(() => useWorkflows({ searchDebounce: 300 }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => result.current.setSearchQuery('deploy'));

    // Should not have been called again yet (debounce)
    const callCountBeforeDebounce = mockFetch.mock.calls.length;

    act(() => { vi.advanceTimersByTime(300); });

    await waitFor(() => {
      expect(mockFetch.mock.calls.length).toBeGreaterThan(callCountBeforeDebounce);
    });

    // Verify search param was included
    const lastCallUrl = mockFetch.mock.calls[mockFetch.mock.calls.length - 1][0];
    expect(lastCallUrl).toContain('search=deploy');
  });

  it('sets status filter and refetches', async () => {
    mockFetch.mockResolvedValue(mockSuccessResponse());

    const { result } = renderHook(() => useWorkflows());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => result.current.setStatusFilter('running'));

    // Debounce doesn't apply to filter changes directly,
    // but the effect depends on debouncedSearch so might need timer advance
    act(() => { vi.advanceTimersByTime(0); });

    await waitFor(() => {
      const lastCallUrl = mockFetch.mock.calls[mockFetch.mock.calls.length - 1][0];
      expect(lastCallUrl).toContain('status=running');
    });
  });

  it('supports load more pagination', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ workflows: mockWorkflows, total: 6, page: 1, hasMore: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          workflows: [
            { id: 'wf-4', title: 'Build v3', status: 'completed', createdAt: '2026-05-20T05:00:00Z', updatedAt: '2026-05-20T05:10:00Z' },
          ],
          total: 6,
          page: 2,
          hasMore: false,
        }),
      });

    const { result } = renderHook(() => useWorkflows());

    await waitFor(() => {
      expect(result.current.hasMore).toBe(true);
    });

    act(() => result.current.loadMore());

    await waitFor(() => {
      expect(result.current.workflows).toHaveLength(4);
      expect(result.current.hasMore).toBe(false);
    });
  });

  it('handles API errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useWorkflows());

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Network error');
  });

  it('handles 403 by clearing workflows', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
    });

    const { result } = renderHook(() => useWorkflows());

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.workflows).toHaveLength(0);
  });

  it('cancels in-flight requests on filter change', async () => {
    const abortSpy = vi.spyOn(AbortController.prototype, 'abort');

    mockFetch.mockResolvedValue(mockSuccessResponse());

    const { result } = renderHook(() => useWorkflows({ searchDebounce: 0 }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Change filter rapidly to trigger abort
    act(() => result.current.setStatusFilter('running'));
    act(() => { vi.advanceTimersByTime(0); });
    act(() => result.current.setStatusFilter('completed'));
    act(() => { vi.advanceTimersByTime(0); });

    expect(abortSpy).toHaveBeenCalled();
    abortSpy.mockRestore();
  });
});
