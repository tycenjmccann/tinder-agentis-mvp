import React, { useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { WorkflowSearchBar } from './WorkflowSearchBar';
import { WorkflowStatusFilter } from './WorkflowStatusFilter';
import { WorkflowHistoryItem } from './WorkflowHistoryItem';
import { useWorkflows } from './useWorkflows';
import type { WorkflowSummary } from './sidebar.types';
import './WorkflowFlyout.css';

interface WorkflowFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkflowClick?: (workflow: WorkflowSummary) => void;
}

/**
 * WorkflowFlyout - Flyout panel for workflow history in collapsed mode.
 *
 * Opens from the side of the collapsed sidebar.
 * Contains full search, filter, and workflow list.
 * Focus management: focus moves to close button on open.
 */
export function WorkflowFlyout({
  isOpen,
  onClose,
  onWorkflowClick,
}: WorkflowFlyoutProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const {
    workflows,
    isLoading,
    isLoadingMore,
    isError,
    hasMore,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    loadMore,
    refetch,
  } = useWorkflows();

  // Focus management
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
      // Delay to allow transition
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    } else if (triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Infinite scroll handler
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

  return (
    <div
      className={`workflow-flyout ${isOpen ? 'workflow-flyout--open' : ''}`}
      role="dialog"
      aria-label="Workflow history"
      aria-modal="false"
      aria-hidden={!isOpen}
    >
      {/* Header */}
      <div className="workflow-flyout__header">
        <h2 className="workflow-flyout__title">Workflows</h2>
        <button
          ref={closeButtonRef}
          className="workflow-flyout__close"
          onClick={onClose}
          aria-label="Close workflow history panel"
          type="button"
          tabIndex={isOpen ? 0 : -1}
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      {/* Search & Filter */}
      <WorkflowSearchBar value={searchQuery} onChange={setSearchQuery} />
      <WorkflowStatusFilter value={statusFilter} onChange={setStatusFilter} />

      {/* Workflow List */}
      <div
        className="workflow-flyout__list"
        onScroll={handleScroll}
        role="list"
        aria-label="Workflow list"
      >
        {isLoading && workflows.length === 0 ? (
          <div className="workflow-flyout__loading">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="workflow-item-skeleton">
                <div className="skeleton skeleton--text-lg" />
                <div className="skeleton skeleton--text-sm" />
              </div>
            ))}
          </div>
        ) : isError && workflows.length === 0 ? (
          <div className="workflow-flyout__error">
            <p>Failed to load workflows</p>
            <button onClick={refetch} type="button">Retry</button>
          </div>
        ) : workflows.length === 0 ? (
          <div className="workflow-flyout__empty">
            {searchQuery || statusFilter !== 'all' ? (
              <p>No matching workflows</p>
            ) : (
              <p>No workflows yet</p>
            )}
          </div>
        ) : (
          <>
            {workflows.map((workflow) => (
              <WorkflowHistoryItem
                key={workflow.id}
                workflow={workflow}
                onClick={() => onWorkflowClick?.(workflow)}
              />
            ))}
            {isLoadingMore && (
              <div className="workflow-flyout__loading-more">
                Loading more...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
