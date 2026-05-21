import React, { useState } from 'react';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';
import { useSidebarContext } from './SidebarContext';
import { AgentStatusItem } from './AgentStatusItem';
import { useAgentStatus } from './useAgentStatus';
import type { AgentStatusPanelProps, Agent } from './sidebar.types';
import './AgentStatusPanel.css';

/**
 * AgentStatusPanel - Displays real-time agent status list.
 *
 * Features:
 * - Live status indicators (active/idle/error)
 * - Expandable/collapsible section
 * - Respects sidebar collapse state
 * - CSS tooltips in collapsed mode
 */
export function AgentStatusPanel({
  pollingInterval = 10000,
  maxVisible = 8,
  onAgentClick,
}: AgentStatusPanelProps) {
  const { isCollapsed } = useSidebarContext();
  const { agents, isLoading, error } = useAgentStatus(pollingInterval);
  const [isExpanded, setIsExpanded] = useState(true);

  const visibleAgents = isExpanded ? agents : agents.slice(0, maxVisible);
  const hasMore = agents.length > maxVisible;

  if (error) {
    return (
      <div className="agent-status-panel agent-status-panel--error">
        <p className="agent-status-panel__error">Failed to load agents</p>
      </div>
    );
  }

  return (
    <div className="agent-status-panel">
      <div
        className="sidebar-nav-item agent-status-panel__header"
        data-tooltip="Agents"
      >
        <Users size={16} aria-hidden="true" className="agent-status-panel__icon" />
        <span className="agent-status-panel__title sidebar__content-label">
          Agents ({agents.length})
        </span>
        {!isCollapsed && hasMore && (
          <button
            className="agent-status-panel__toggle"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Show fewer agents' : 'Show all agents'}
            type="button"
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {!isCollapsed && (
        <div className="agent-status-panel__list">
          {isLoading ? (
            <div className="agent-status-panel__loading">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="agent-status-panel__skeleton" />
              ))}
            </div>
          ) : (
            visibleAgents.map((agent) => (
              <AgentStatusItem
                key={agent.id}
                agent={agent}
                onClick={() => onAgentClick?.(agent)}
              />
            ))
          )}
        </div>
      )}

      {isCollapsed && (
        <div className="agent-status-panel__collapsed-list">
          {agents.slice(0, 5).map((agent) => (
            <div
              key={agent.id}
              className="sidebar-nav-item agent-status-panel__collapsed-item"
              data-tooltip={`${agent.name} (${agent.status})`}
              onClick={() => onAgentClick?.(agent)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onAgentClick?.(agent);
                }
              }}
            >
              <span
                className={`agent-status-dot agent-status-dot--${agent.status}`}
                aria-label={`${agent.name}: ${agent.status}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
