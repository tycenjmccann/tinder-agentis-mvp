import React from 'react';
import type { WorkflowSummary } from './sidebar.types';
import './WorkflowHistoryItem.css';

interface WorkflowHistoryItemProps {
  workflow: WorkflowSummary;
  onClick?: () => void;
}

/**
 * WorkflowHistoryItem - Single workflow row.
 */
export function WorkflowHistoryItem({ workflow, onClick }: WorkflowHistoryItemProps) {
  const statusLabel = workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1);

  return (
    <button
      className="workflow-history-item"
      onClick={onClick}
      type="button"
      aria-label={`${workflow.title} - ${statusLabel}`}
    >
      <span
        className={`workflow-history-item__status workflow-history-item__status--${workflow.status}`}
        aria-hidden="true"
      />
      <div className="workflow-history-item__info">
        <span className="workflow-history-item__title">{workflow.title}</span>
        <span className="workflow-history-item__time">
          {new Date(workflow.updatedAt).toLocaleDateString()}
        </span>
      </div>
    </button>
  );
}
