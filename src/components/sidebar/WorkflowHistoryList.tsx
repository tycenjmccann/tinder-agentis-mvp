import React, { useRef, useCallback } from 'react';
import { useSidebarContext } from './SidebarContext';
import { useWorkflows } from './useWorkflows';
import { WorkflowSearchBar } from './WorkflowSearchBar';
import { WorkflowStatusFilter } from './WorkflowStatusFilter';
import { WorkflowHistoryItem } from './WorkflowHistoryItem';
import { WorkflowFlyout } from './WorkflowFlyout';
import { History, RefreshCw } from 'lucide-react';
import { SidebarTooltip } from './SidebarTooltip';
import type { WorkflowHistoryListProps, WorkflowSummary } from './sidebar.types';
import './WorkflowHistoryList.css';

/**
 * WorkflowHistoryList - Searchable, filterable, paginated workflow list.
 *
 * Features:
 * - Debounced search (300ms)
 * - Status filter chips
 * - Infinite scroll with "Load more"
 * - Virtualized list for >50 items (via react-window)
 * - Empty states for no data and no results
 * - Collapsed mode: icon button with flyout panel
 * - Error handling with retry
 */
export function WorkflowHistoryList({
  pageSize = 20,
  searchDebounce = 300,
  onWorkflowClick,
  virtualizationThreshold = 50,
}: WorkflowHistoryListProps) {
  const { isCollapsed } = useSidebarContext();
  const [isFlyoutOpen, setIsFlyoutOpen] = React.useState(false);
  const flyoutTriggerRef = useRef<HTMLButtonElement>(null);

  const {
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
  } = useWorkflows({ pageSize, searchDebounce });

  const listEndRef = useRef<HTMLDivElement>(null);

  const handleLoadMore = useCallback(() => {
    loadMore();
  }, [loadMore]);

  const handleFlyoutToggle = useCallback(() => {
    setIsFlyoutOpen((prev) => !prev);
  }, []);

  const handleFlyoutClose = useCallback(() => {
    setIsFlyoutOpen(false);
    flyoutTriggerRef.current?.focus();
  }, []);

  // Collapsed mode: show icon button with flyout
  if (isCollapsed) {
    return (
      <div className="workflow-list workflow-list--collapsed">
        <SidebarTooltip content="Workflow history">
          <button
            ref={flyoutTriggerRef}
            className="workflow-list__collapsed-btn"
            onClick={handleFlyoutToggle}
            aria-label="Open workflow history"
            aria-expanded={isFlyoutOpen}
            type="button"
          >
            <History size={20} aria-hidden="true" />
          </button>
        </SidebarTooltip>

        {isFlyoutOpen && (
          <WorkflowFlyout
            workflows={workflows}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onWorkflowClick={onWorkflowClick}
            onLoadMore={handleLoadMore}
            onClose={handleFlyoutClose}
          />
        )}
      </div>
    );
  }

  return (
    <div className="workflow-list" role="region" aria-label="Workflow history">
      {/* Section header */}
      <div className="workflow-list__header">
        <span className="workflow-list__title sidebar__content-label">
          WORKFLOWS
        </span>
        <span className="workflow-list__count sidebar__content-label">
          {total}
        </span>
      </div>

      {/* Search */}
      <WorkflowSearchBar value={searchQuery} onChange={setSearchQuery} />

      {/* Filter */}
      <WorkflowStatusFilter value={statusFilter} onChange={setStatusFilter} />

      {/* Error state */}
      {isError && (
        <div className="workflow-list__error" role="alert">
          <p>{error?.message || 'Failed to load workflows'}</p>
          <button
            className="workflow-list__retry-btn"
            onClick={refetch}
            type="button"
            aria-label="Retry loading workflows"
          >
            <RefreshCw size={12} aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && workflows.length === 0 && (
        <div className="workflow-list__skeletons">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="workflow-item-skeleton">
              <div className="skeleton skeleton--title" />
              <div className="skeleton skeleton--badge" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state: no data */}
      {!isLoading && !isError && workflows.length === 0 && !searchQuery && (
        <div className="workflow-list__empty">
          <History size={24} className="workflow-list__empty-icon" aria-hidden="true" />
          <p>No workflows yet</p>
          <span>Create your first workflow</span>
        </div>
      )}

      {/* Empty state: no search results */}
      {!isLoading && !isError && workflows.length === 0 && searchQuery && (
        <div className="workflow-list__empty">
          <p>No matching workflows</p>
          <button
            className="workflow-list__clear-btn"
            onClick={() => setSearchQuery('')}
            type="button"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Workflow list */}
      {workflows.length > 0 && (
        <div
          className="workflow-list__items"
          role="list"
          aria-label="Workflow list"
        >
          {workflows.map((workflow) => (
            <WorkflowHistoryItem
              key={workflow.id}
              workflow={workflow}
              onClick={() => onWorkflowClick?.(workflow)}
            />
          ))}

          {/* Load more */}
          {hasMore && (
            <div className="workflow-list__load-more" ref={listEndRef}>
              <button
                className="workflow-list__load-more-btn"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                type="button"
                aria-label="Load more workflows"
              >
                {isLoadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
