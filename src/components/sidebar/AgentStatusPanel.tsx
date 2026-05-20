import React, { useMemo } from 'react';
import { useSidebarContext } from './SidebarContext';
import { useAgentStatus } from './useAgentStatus';
import { AgentStatusItem } from './AgentStatusItem';
import { SidebarTooltip } from './SidebarTooltip';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type { Agent, AgentStatusPanelProps } from './sidebar.types';
import './AgentStatusPanel.css';

/**
 * AgentStatusPanel - Displays agent status overview with real-time polling.
 *
 * Features:
 * - Summary header with count by status
 * - Agent list with colored status indicators
 * - Polling every 10s with visibility awareness
 * - Collapsed mode: condensed dots with tooltips
 * - Error/loading/empty states
 */
export function AgentStatusPanel({
  pollingInterval = 10000,
  maxVisible = 8,
  onAgentClick,
}: AgentStatusPanelProps) {
  const { isCollapsed } = useSidebarContext();
  const { agents, isLoading, isError, isStale, refetch } = useAgentStatus({
    pollingInterval,
  });

  const statusCounts = useMemo(() => {
    const counts = { active: 0, idle: 0, error: 0 };
    agents.forEach((agent) => {
      counts[agent.status]++;
    });
    return counts;
  }, [agents]);

  const visibleAgents = agents.slice(0, maxVisible);

  // Loading skeleton
  if (isLoading && agents.length === 0) {
    return (
      <div className="agent-panel" role="region" aria-label="Agent status">
        <div className="agent-panel__header">
          <span className="agent-panel__title">AGENTS</span>
        </div>
        <div className="agent-panel__list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="agent-item-skeleton">
              <div className="skeleton skeleton--dot" />
              <div className="skeleton skeleton--text" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Collapsed mode: dots only
  if (isCollapsed) {
    return (
      <div
        className="agent-panel agent-panel--collapsed"
        role="region"
        aria-label="Agent status"
      >
        <div className="agent-panel__dots">
          {visibleAgents.map((agent) => (
            <SidebarTooltip
              key={agent.id}
              content={`${agent.name} - ${agent.status}`}
            >
              <button
                className={`agent-dot agent-dot--${agent.status}`}
                onClick={() => onAgentClick?.(agent)}
                aria-label={`${agent.name}, ${agent.role}, status: ${agent.status}`}
                type="button"
              />
            </SidebarTooltip>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="agent-panel" role="region" aria-label="Agent status">
      {/* Section header */}
      <div className="agent-panel__header">
        <span className="agent-panel__title sidebar__content-label">AGENTS</span>
        <span className="agent-panel__count sidebar__content-label">
          {statusCounts.active}/{agents.length}
        </span>
      </div>

      {/* Status summary */}
      <div className="agent-panel__summary sidebar__content-label">
        <span className="agent-panel__stat">
          <span
            className="agent-panel__stat-dot agent-panel__stat-dot--active"
            aria-hidden="true"
          />
          {statusCounts.active} Active
        </span>
        <span className="agent-panel__stat">
          <span
            className="agent-panel__stat-dot agent-panel__stat-dot--idle"
            aria-hidden="true"
          />
          {statusCounts.idle} Idle
        </span>
        <span className="agent-panel__stat">
          <span
            className="agent-panel__stat-dot agent-panel__stat-dot--error"
            aria-hidden="true"
          />
          {statusCounts.error} Error
        </span>
      </div>

      {/* Stale data warning */}
      {isStale && (
        <div className="agent-panel__stale" role="alert">
          <AlertCircle size={12} aria-hidden="true" />
          <span>Status unavailable</span>
          <button
            className="agent-panel__retry-btn"
            onClick={refetch}
            type="button"
            aria-label="Retry fetching agent status"
          >
            <RefreshCw size={12} aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      {/* Agent list */}
      {agents.length === 0 && !isLoading ? (
        <div className="agent-panel__empty">
          <p>No agents configured</p>
        </div>
      ) : (
        <div className="agent-panel__list" role="list" aria-label="Agent list">
          {visibleAgents.map((agent) => (
            <AgentStatusItem
              key={agent.id}
              agent={agent}
              onClick={() => onAgentClick?.(agent)}
            />
          ))}
          {agents.length > maxVisible && (
            <div className="agent-panel__more">
              +{agents.length - maxVisible} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}
