import React, { memo } from 'react';
import type { WorkflowSummary } from './sidebar.types';
import './WorkflowHistoryItem.css';

interface WorkflowHistoryItemProps {
  workflow: WorkflowSummary;
  onClick: () => void;
  style?: React.CSSProperties;
}

/**
 * WorkflowHistoryItem - Individual workflow entry.
 *
 * Shows title, status badge, and relative timestamp.
 * Memoized for virtualized list performance.
 */
export const WorkflowHistoryItem = memo(function WorkflowHistoryItem({
  workflow,
  onClick,
  style,
}: WorkflowHistoryItemProps) {
  const formattedTime = formatRelativeTime(workflow.createdAt);

  return (
    <button
      className="workflow-item"
      role="listitem"
      onClick={onClick}
      aria-label={`${workflow.title}, status: ${workflow.status}, created ${formattedTime}`}
      type="button"
      style={style}
    >
      <div className="workflow-item__content">
        <span className="workflow-item__title">{workflow.title}</span>
        <span className="workflow-item__timestamp">{formattedTime}</span>
      </div>
      <span
        className={`workflow-item__badge workflow-item__badge--${workflow.status}`}
      >
        {workflow.status}
      </span>
    </button>
  );
});

/**
 * Format ISO timestamp to relative time string.
 * Uses safe text output only (no HTML injection possible).
 */
function formatRelativeTime(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  } catch {
    return 'Unknown';
  }
}
