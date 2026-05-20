import React, { memo } from 'react';
import type { WorkflowSummary } from './sidebar.types';
import './WorkflowHistoryItem.css';

interface WorkflowHistoryItemProps {
  workflow: WorkflowSummary;
  onClick: () => void;
  style?: React.CSSProperties;
}

/**
 * WorkflowHistoryItem - Individual workflow entry in the history list.
 *
 * Features:
 * - Title with text-overflow ellipsis
 * - Status badge with color coding
 * - Relative timestamp
 * - Memoized for virtualized list performance
 * - Accessible with aria-label (XSS-safe: text only)
 */
export const WorkflowHistoryItem = memo(function WorkflowHistoryItem({
  workflow,
  onClick,
  style,
}: WorkflowHistoryItemProps) {
  const timeAgo = getRelativeTime(workflow.createdAt);

  return (
    <button
      className="workflow-item"
      role="listitem"
      onClick={onClick}
      aria-label={`${workflow.title}, status: ${workflow.status}, ${timeAgo}`}
      type="button"
      style={style}
    >
      <div className="workflow-item__content">
        <span className="workflow-item__title">{workflow.title}</span>
        <span className="workflow-item__timestamp">{timeAgo}</span>
      </div>
      <span className={`workflow-item__badge workflow-item__badge--${workflow.status}`}>
        {workflow.status}
      </span>
    </button>
  );
});

/** Utility to calculate relative time string */
function getRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Unknown';
  }
}
