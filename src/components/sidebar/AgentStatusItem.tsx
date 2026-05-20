import React, { memo } from 'react';
import type { Agent } from './sidebar.types';
import './AgentStatusItem.css';

interface AgentStatusItemProps {
  agent: Agent;
  onClick: () => void;
}

/**
 * AgentStatusItem - Individual agent row with status indicator.
 *
 * Memoized for performance in lists.
 * Accessible with full agent info in aria-label.
 */
export const AgentStatusItem = memo(function AgentStatusItem({
  agent,
  onClick,
}: AgentStatusItemProps) {
  return (
    <button
      className="agent-item"
      role="listitem"
      onClick={onClick}
      aria-label={`${agent.name}, ${agent.role}, status: ${agent.status}`}
      type="button"
    >
      <span
        className={`agent-item__dot agent-item__dot--${agent.status}`}
        aria-hidden="true"
      />
      <div className="agent-item__info">
        <span className="agent-item__name">{agent.name}</span>
        <span className="agent-item__role">{agent.role}</span>
      </div>
      <span className="agent-item__status">{agent.status}</span>
    </button>
  );
});
