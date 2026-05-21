import React, { useState, useMemo } from 'react';
import { Clock } from 'lucide-react';
import { useSidebarContext } from './SidebarContext';
import { WorkflowHistoryItem } from './WorkflowHistoryItem';
import { WorkflowSearchBar } from './WorkflowSearchBar';
import { WorkflowStatusFilter as StatusFilter } from './WorkflowStatusFilter';
import { useWorkflows } from './useWorkflows';
import type { WorkflowHistoryListProps, WorkflowStatusFilter } from './sidebar.types';
import './WorkflowHistoryList.css';

/**
 * WorkflowHistoryList - Displays workflow history with search and filter.
 *
 * Features:
 * - Search bar with debounce
 * - Status filter tabs
 * - Virtualized list for performance
 * - CSS tooltips in collapsed mode
 */
export function WorkflowHistoryList({
  pageSize = 20,
  searchDebounce = 300,
  onWorkflowClick,
}: WorkflowHistoryListProps) {
  const { isCollapsed } = useSidebarContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkflowStatusFilter>('all');

  const { workflows, isLoading, error } = useWorkflows({
    pageSize,
    searchQuery,
    statusFilter,
  });

  if (error) {
    return (
      <div className="workflow-history workflow-history--error">
        <p className="workflow-history__error">Failed to load workflows</p>
      </div>
    );
  }

  return (
    <div className="workflow-history">
      <div
        className="sidebar-nav-item workflow-history__header"
        data-tooltip="Workflows"
      >
        <Clock size={16} aria-hidden="true" className="workflow-history__icon" />
        <span className="workflow-history__title sidebar__content-label">
          Workflows
        </span>
      </div>

      {!isCollapsed && (
        <>
          <WorkflowSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            debounceMs={searchDebounce}
          />
          <StatusFilter
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <div className="workflow-history__list">
            {isLoading ? (
              <div className="workflow-history__loading">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="workflow-history__skeleton" />
                ))}
              </div>
            ) : workflows.length === 0 ? (
              <p className="workflow-history__empty">No workflows found</p>
            ) : (
              workflows.map((workflow) => (
                <WorkflowHistoryItem
                  key={workflow.id}
                  workflow={workflow}
                  onClick={() => onWorkflowClick?.(workflow)}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
