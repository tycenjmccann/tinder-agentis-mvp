import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { WorkflowSearchBar } from './WorkflowSearchBar';
import { WorkflowStatusFilter } from './WorkflowStatusFilter';
import { WorkflowHistoryItem } from './WorkflowHistoryItem';
import type { WorkflowSummary, WorkflowStatusFilter as FilterType } from './sidebar.types';
import './WorkflowFlyout.css';

interface WorkflowFlyoutProps {
  workflows: WorkflowSummary[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: FilterType;
  onStatusFilterChange: (filter: FilterType) => void;
  onWorkflowClick?: (workflow: WorkflowSummary) => void;
  onLoadMore: () => void;
  onClose: () => void;
}

/**
 * WorkflowFlyout - Panel displayed when sidebar is collapsed.
 *
 * Opens as a fixed panel to the right of the collapsed sidebar.
 * Focus management: focus moves to close button on open,
 * returns to trigger on close.
 */
export function WorkflowFlyout({
  workflows,
  isLoading,
  isLoadingMore,
  hasMore,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onWorkflowClick,
  onLoadMore,
  onClose,
}: WorkflowFlyoutProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus close button on mount
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay adding listener to prevent immediate close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="workflow-flyout workflow-flyout--open"
      role="dialog"
      aria-label="Workflow history"
      aria-modal="false"
    >
      {/* Header */}
      <div className="workflow-flyout__header">
        <h2 className="workflow-flyout__title">Workflow History</h2>
        <button
          ref={closeRef}
          className="workflow-flyout__close"
          onClick={onClose}
          aria-label="Close workflow history panel"
          type="button"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      {/* Search */}
      <WorkflowSearchBar value={searchQuery} onChange={onSearchChange} />

      {/* Filter */}
      <WorkflowStatusFilter value={statusFilter} onChange={onStatusFilterChange} />

      {/* List */}
      <div className="workflow-flyout__list">
        {isLoading && workflows.length === 0 && (
          <div className="workflow-flyout__loading">Loading...</div>
        )}

        {!isLoading && workflows.length === 0 && (
          <div className="workflow-flyout__empty">
            {searchQuery ? 'No matching workflows' : 'No workflows yet'}
          </div>
        )}

        {workflows.map((workflow) => (
          <WorkflowHistoryItem
            key={workflow.id}
            workflow={workflow}
            onClick={() => {
              onWorkflowClick?.(workflow);
              onClose();
            }}
          />
        ))}

        {hasMore && (
          <button
            className="workflow-flyout__load-more"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            type="button"
          >
            {isLoadingMore ? 'Loading...' : 'Load more'}
          </button>
        )}
      </div>
    </div>
  );
}
