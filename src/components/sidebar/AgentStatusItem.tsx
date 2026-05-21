import React from 'react';
import type { Agent } from './sidebar.types';
import './AgentStatusItem.css';

interface AgentStatusItemProps {
  agent: Agent;
  onClick?: () => void;
}

/**
 * AgentStatusItem - Single agent row in the status panel.
 */
export function AgentStatusItem({ agent, onClick }: AgentStatusItemProps) {
  return (
    <button
      className="agent-status-item"
      onClick={onClick}
      type="button"
      aria-label={`${agent.name} - ${agent.status}`}
    >
      <span
        className={`agent-status-item__dot agent-status-item__dot--${agent.status}`}
        aria-hidden="true"
      />
      <span className="agent-status-item__name">{agent.name}</span>
      <span className="agent-status-item__role">{agent.role}</span>
    </button>
  );
}
