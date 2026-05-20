import React, { useState, useCallback, useMemo, useRef } from 'react';
import { FixedSizeList } from 'react-window';
import { History } from 'lucide-react';
import { useSidebarContext } from './SidebarContext';
import { useWorkflows } from './useWorkflows';
import { WorkflowSearchBar } from './WorkflowSearchBar';
import { WorkflowStatusFilter } from './WorkflowStatusFilter';
import { WorkflowHistoryItem } from './WorkflowHistoryItem';
import { WorkflowFlyout } from './WorkflowFlyout';
import { SidebarTooltip } from './SidebarTooltip';
import type { WorkflowHistoryListProps, WorkflowSummary } from './sidebar.types';
import './WorkflowHistoryList.css';

const ITEM_HEIGHT = 56;

/**
 * WorkflowHistoryList - Searchable, filterable, virtualized workflow history.
 *
 * Features:
 * - Debounced search with 300ms delay
 * - Status filter (all/running/completed/failed)
 * - Virtualized list for >50 items (react-window)
 * - Infinite scroll / load more pagination
 * - Collapsed mode: icon button opens flyout panel
 * - Empty states for no data and no results
 * - Loading skeletons
 * - Error handling with retry
 */
export function WorkflowHistoryList({
  pageSize = 20,
  searchDebounce = 300,
  onWorkflowClick,
  virtualizationThreshold = 50,
}: WorkflowHistoryListProps) {
  const { isCollapsed } = useSidebarContext();
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
  const listContainerRef = useRef<HTMLDivElement>(null);

  const {
    workflows,
    isLoading,
    isLoadingMore,
    isError,
    hasMore,
    total,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    loadMore,
    refetch,
  } = useWorkflows({ pageSize, searchDebounce });

  // Infinite scroll handler for non-virtualized list
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement;
      const nearBottom =
        target.scrollHeight - target.scrollTop - target.clientHeight < 100;
      if (nearBottom && hasMore && !isLoadingMore) {
        loadMore();
      }
    },
    [hasMore, isLoadingMore, loadMore]
  );

  // Virtualized row renderer
  const VirtualRow = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const workflow = workflows[index];
      if (!workflow) return null;
      return (
        <WorkflowHistoryItem
          workflow={workflow}
          onClick={() => onWorkflowClick?.(workflow)}
          style={style}
        />
      );
    },
    [workflows, onWorkflowClick]
  );

  // Collapsed mode: show icon button + flyout
  if (isCollapsed) {
    return (
      <>
        <div className="workflow-panel workflow-panel--collapsed">
          <SidebarTooltip content="Workflow History">
            <button
              className="workflow-panel__flyout-trigger"
              onClick={() => setIsFlyoutOpen(true)}
              aria-label="Open workflow history"
              aria-expanded={isFlyoutOpen}
              type="button"
            >
              <History size={20} aria-hidden="true" />
            </button>
          </SidebarTooltip>
        </div>
        <WorkflowFlyout
          isOpen={isFlyoutOpen}
          onClose={() => setIsFlyoutOpen(false)}
          onWorkflowClick={onWorkflowClick}
        />
      </>
    );
  }

  // Loading state
  if (isLoading && workflows.length === 0) {
    return (
      <div className="workflow-panel" role="region" aria-label="Workflow history">
        <div className="workflow-panel__header">
          <span className="workflow-panel__title sidebar__content-label">WORKFLOWS</span>
        </div>
        <div className="workflow-panel__loading">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="workflow-item-skeleton">
              <div className="skeleton skeleton--text-lg" />
              <div className="skeleton skeleton--text-sm" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Determine if virtualization is needed
  const useVirtualization = workflows.length > virtualizationThreshold;
  const listHeight = listContainerRef.current?.clientHeight || 300;

  return (
    <div className="workflow-panel" role="region" aria-label="Workflow history">
      {/* Section header */}
      <div className="workflow-panel__header">
        <span className="workflow-panel__title sidebar__content-label">WORKFLOWS</span>
        <span className="workflow-panel__count sidebar__content-label">
          {total > 0 && total}
        </span>
      </div>

      {/* Search */}
      <WorkflowSearchBar value={searchQuery} onChange={setSearchQuery} />

      {/* Filter */}
      <WorkflowStatusFilter value={statusFilter} onChange={setStatusFilter} />

      {/* Error state */}
      {isError && workflows.length === 0 ? (
        <div className="workflow-panel__error">
          <p>Failed to load workflows</p>
          <button
            onClick={refetch}
            className="workflow-panel__retry-btn"
            type="button"
            aria-label="Retry loading workflows"
          >
            Retry
          </button>
        </div>
      ) : workflows.length === 0 ? (
        /* Empty state */
        <div className="workflow-panel__empty">
          {searchQuery || statusFilter !== 'all' ? (
            <>
              <p>No matching workflows</p>
              <button
                className="workflow-panel__clear-btn"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                type="button"
              >
                Clear filters
              </button>
            </>
          ) : (
            <p>No workflows yet</p>
          )}
        </div>
      ) : (
        /* Workflow list */
        <div
          ref={listContainerRef}
          className="workflow-panel__list"
          onScroll={!useVirtualization ? handleScroll : undefined}
          role="list"
          aria-label="Workflow list"
        >
          {useVirtualization ? (
            <FixedSizeList
              height={Math.min(workflows.length * ITEM_HEIGHT, 400)}
              width="100%"
              itemSize={ITEM_HEIGHT}
              itemCount={workflows.length}
              overscanCount={5}
              onItemsRendered={({ visibleStopIndex }) => {
                if (
                  visibleStopIndex >= workflows.length - 5 &&
                  hasMore &&
                  !isLoadingMore
                ) {
                  loadMore();
                }
              }}
            >
              {VirtualRow}
            </FixedSizeList>
          ) : (
            <>
              {workflows.map((workflow) => (
                <WorkflowHistoryItem
                  key={workflow.id}
                  workflow={workflow}
                  onClick={() => onWorkflowClick?.(workflow)}
                />
              ))}
            </>
          )}

          {/* Load more indicator */}
          {isLoadingMore && !useVirtualization && (
            <div className="workflow-panel__loading-more">
              Loading more...
            </div>
          )}

          {/* Load more button fallback */}
          {hasMore && !isLoadingMore && !useVirtualization && (
            <button
              className="workflow-panel__load-more"
              onClick={loadMore}
              type="button"
              aria-label="Load more workflows"
            >
              Load more
            </button>
          )}
        </div>
      )}
    </div>
  );
}
