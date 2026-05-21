import { useState, useEffect } from 'react';
import type { WorkflowSummary, WorkflowStatusFilter } from './sidebar.types';

// Mock data for development
const MOCK_WORKFLOWS: WorkflowSummary[] = [
  { id: '1', title: 'Deploy v2.1.0', status: 'running', createdAt: '2024-03-15T10:00:00Z', updatedAt: '2024-03-15T10:30:00Z' },
  { id: '2', title: 'Feature: Auth Flow', status: 'completed', createdAt: '2024-03-14T08:00:00Z', updatedAt: '2024-03-14T16:00:00Z' },
  { id: '3', title: 'Bug Fix: Layout', status: 'failed', createdAt: '2024-03-13T12:00:00Z', updatedAt: '2024-03-13T12:45:00Z' },
  { id: '4', title: 'Refactor: Sidebar', status: 'completed', createdAt: '2024-03-12T09:00:00Z', updatedAt: '2024-03-12T17:00:00Z' },
  { id: '5', title: 'Test: E2E Suite', status: 'running', createdAt: '2024-03-15T11:00:00Z', updatedAt: '2024-03-15T11:15:00Z' },
];

interface UseWorkflowsOptions {
  pageSize?: number;
  searchQuery?: string;
  statusFilter?: WorkflowStatusFilter;
}

interface UseWorkflowsReturn {
  workflows: WorkflowSummary[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
}

/**
 * Hook for fetching and filtering workflow data.
 */
export function useWorkflows(options: UseWorkflowsOptions = {}): UseWorkflowsReturn {
  const { searchQuery = '', statusFilter = 'all' } = options;
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>(MOCK_WORKFLOWS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let filtered = MOCK_WORKFLOWS;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((w) => w.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((w) =>
        w.title.toLowerCase().includes(query)
      );
    }

    setWorkflows(filtered);
  }, [searchQuery, statusFilter]);

  const loadMore = () => {
    // Pagination would be implemented here
  };

  return { workflows, isLoading, error, hasMore: false, loadMore };
}
