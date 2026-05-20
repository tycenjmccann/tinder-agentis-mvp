import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useWorkflows } from '../useWorkflows';
import { server } from '../../../test/mocks/server';
import { http, HttpResponse } from 'msw';
import { mockWorkflows } from '../../../test/mocks/handlers';

describe('useWorkflows', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should fetch workflows on mount', async () => {
    vi.useRealTimers();
    const { result } = renderHook(() => useWorkflows());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.workflows).toHaveLength(mockWorkflows.length);
    expect(result.current.total).toBe(mockWorkflows.length);
    expect(result.current.isError).toBe(false);
  });

  it('should filter workflows by search query with debounce', async () => {
    vi.useRealTimers();
    const { result } = renderHook(() =>
      useWorkflows({ searchDebounce: 100 })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setSearchQuery('Deploy');
    });

    // Wait for debounce + fetch
    await waitFor(
      () => {
        expect(result.current.workflows.length).toBeLessThan(
          mockWorkflows.length
        );
      },
      { timeout: 2000 }
    );

    // All returned should contain "Deploy"
    result.current.workflows.forEach((w) => {
      expect(w.title.toLowerCase()).toContain('deploy');
    });
  });

  it('should filter workflows by status', async () => {
    vi.useRealTimers();
    const { result } = renderHook(() =>
      useWorkflows({ searchDebounce: 50 })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setStatusFilter('running');
    });

    await waitFor(() => {
      expect(
        result.current.workflows.every((w) => w.status === 'running')
      ).toBe(true);
    });
  });

  it('should handle pagination with loadMore', async () => {
    vi.useRealTimers();
    // Create many workflows for pagination
    const manyWorkflows = Array.from({ length: 25 }, (_, i) => ({
      id: `wf-${String(i).padStart(3, '0')}`,
      title: `Workflow ${i}`,
      status: 'completed' as const,
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - i * 1800000).toISOString(),
    }));

    server.use(
      http.get('/api/workflows', ({ request }) => {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const limit = parseInt(url.searchParams.get('limit') || '20', 10);
        const start = (page - 1) * limit;
        const paginatedWorkflows = manyWorkflows.slice(start, start + limit);

        return HttpResponse.json({
          workflows: paginatedWorkflows,
          total: manyWorkflows.length,
          page,
          hasMore: start + limit < manyWorkflows.length,
        });
      })
    );

    const { result } = renderHook(() => useWorkflows({ pageSize: 10 }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.workflows).toHaveLength(10);
    expect(result.current.hasMore).toBe(true);

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.workflows).toHaveLength(20);
    });
  });

  it('should handle error state', async () => {
    vi.useRealTimers();
    server.use(
      http.get('/api/workflows', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const { result } = renderHook(() => useWorkflows());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeTruthy();
  });

  it('should handle 403 by clearing workflows', async () => {
    vi.useRealTimers();
    server.use(
      http.get('/api/workflows', () => {
        return new HttpResponse(null, { status: 403 });
      })
    );

    const { result } = renderHook(() => useWorkflows());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.workflows).toHaveLength(0);
    expect(result.current.isError).toBe(true);
    expect(result.current.error?.message).toContain('Access denied');
  });

  it('should reset page when search/filter changes', async () => {
    vi.useRealTimers();
    const { result } = renderHook(() =>
      useWorkflows({ searchDebounce: 50 })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Change filter — should reset to page 1
    act(() => {
      result.current.setStatusFilter('failed');
    });

    await waitFor(() => {
      expect(
        result.current.workflows.every((w) => w.status === 'failed')
      ).toBe(true);
    });
  });

  it('should allow manual refetch', async () => {
    vi.useRealTimers();
    const { result } = renderHook(() => useWorkflows());

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
  });
});
