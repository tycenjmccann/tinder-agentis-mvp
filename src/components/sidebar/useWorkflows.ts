import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from './useSidebarResponsive';
import type {
  WorkflowSummary,
  WorkflowListResponse,
  WorkflowStatusFilter,
} from './sidebar.types';

interface UseWorkflowsOptions {
  pageSize?: number;
  searchDebounce?: number;
}

interface UseWorkflowsReturn {
  workflows: WorkflowSummary[];
  isLoading: boolean;
  isLoadingMore: boolean;
  isError: boolean;
  error: Error | null;
  hasMore: boolean;
  total: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: WorkflowStatusFilter;
  setStatusFilter: (filter: WorkflowStatusFilter) => void;
  loadMore: () => void;
  refetch: () => void;
}

/**
 * Custom hook for fetching workflow history with:
 * - Debounced search
 * - Status filter
 * - Infinite scroll pagination
 * - Error handling with graceful degradation
 */
export function useWorkflows(
  options: UseWorkflowsOptions = {}
): UseWorkflowsReturn {
  const { pageSize = 20, searchDebounce = 300 } = options;

  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkflowStatusFilter>('all');

  const debouncedSearch = useDebounce(searchQuery, searchDebounce);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchWorkflows = useCallback(
    async (pageNum: number, append: boolean = false) => {
      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      try {
        const params = new URLSearchParams({
          page: String(pageNum),
          limit: String(pageSize),
        });

        if (debouncedSearch) {
          params.set('search', debouncedSearch);
        }
        if (statusFilter !== 'all') {
          params.set('status', statusFilter);
        }

        const response = await fetch(`/api/workflows?${params.toString()}`, {
          signal: controller.signal,
        });

        if (response.status === 401) {
          throw new Error('Authentication expired');
        }

        if (response.status === 429) {
          throw new Error('Rate limited. Please try again later.');
        }

        if (response.status === 403) {
          // CACHE-4: Invalidate on 403
          setWorkflows([]);
          throw new Error('Access denied');
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch workflows: ${response.status}`);
        }

        const data: WorkflowListResponse = await response.json();

        if (append) {
          setWorkflows((prev) => [...prev, ...data.workflows]);
        } else {
          setWorkflows(data.workflows);
        }

        setHasMore(data.hasMore);
        setTotal(data.total);
        setIsError(false);
        setError(null);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return; // Request was cancelled, ignore
        }
        setIsError(true);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [debouncedSearch, statusFilter, pageSize]
  );

  // Reset and refetch when search/filter changes
  useEffect(() => {
    setPage(1);
    fetchWorkflows(1, false);
  }, [debouncedSearch, statusFilter, fetchWorkflows]);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchWorkflows(nextPage, true);
  }, [hasMore, isLoadingMore, page, fetchWorkflows]);

  const refetch = useCallback(() => {
    setPage(1);
    fetchWorkflows(1, false);
  }, [fetchWorkflows]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    workflows,
    isLoading,
    isLoadingMore,
    isError,
    error,
    hasMore,
    total,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    loadMore,
    refetch,
  };
}
