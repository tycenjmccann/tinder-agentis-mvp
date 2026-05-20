import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useWorkflows } from '../useWorkflows';

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

  const mockWorkflowsResponse = {
    workflows: [
      { id: 'wf-1', title: 'Deploy API v2', status: 'running', createdAt: '2026-01-01T12:00:00Z', updatedAt: '2026-01-01T12:05:00Z' },
      { id: 'wf-2', title: 'Build Frontend', status: 'completed', createdAt: '2026-01-01T11:00:00Z', updatedAt: '2026-01-01T11:30:00Z' },
      { id: 'wf-3', title: 'Run Tests', status: 'failed', createdAt: '2026-01-01T10:00:00Z', updatedAt: '2026-01-01T10:15:00Z' },
    ],
    total: 3,
    page: 1,
    hasMore: false,
  };

  it('fetches workflows on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockWorkflowsResponse),
    });

    const { result } = renderHook(() => useWorkflows());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.workflows).toHaveLength(3);
    expect(result.current.total).toBe(3);
    expect(result.current.hasMore).toBe(false);
  });

  it('debounces search query', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockWorkflowsResponse),
    });

    const { result } = renderHook(() => useWorkflows({ searchDebounce: 300 }));

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Change search query
    act(() => {
      result.current.setSearchQuery('deploy');
    });

    // Should not have refetched yet
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Advance past debounce
    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    // Verify search param was included
    const lastCallUrl = mockFetch.mock.calls[1][0];
    expect(lastCallUrl).toContain('search=deploy');
  });

  it('applies status filter', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ...mockWorkflowsResponse, workflows: [mockWorkflowsResponse.workflows[0]] }),
    });

    const { result } = renderHook(() => useWorkflows());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setStatusFilter('running');
    });

    // Advance debounce timer
    act(() => {
      vi.advanceTimersByTime(300);
    });

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
        json: () => Promise.resolve({ ...mockWorkflowsResponse, hasMore: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          workflows: [{ id: 'wf-4', title: 'Extra Workflow', status: 'completed', createdAt: '2026-01-01T09:00:00Z', updatedAt: '2026-01-01T09:00:00Z' }],
          total: 4,
          page: 2,
          hasMore: false,
        }),
      });

    const { result } = renderHook(() => useWorkflows());

    await waitFor(() => {
      expect(result.current.hasMore).toBe(true);
    });

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.workflows).toHaveLength(4);
      expect(result.current.hasMore).toBe(false);
    });
  });

  it('handles errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useWorkflows());

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Network error');
  });

  it('clears data on 403', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockWorkflowsResponse),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

    const { result } = renderHook(() => useWorkflows());

    await waitFor(() => {
      expect(result.current.workflows).toHaveLength(3);
    });

    // Trigger refetch
    act(() => {
      result.current.setStatusFilter('running');
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.workflows).toHaveLength(0);
      expect(result.current.isError).toBe(true);
    });
  });
});
