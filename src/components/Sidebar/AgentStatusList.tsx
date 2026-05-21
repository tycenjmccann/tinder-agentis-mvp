import { useAgentStatus } from '../../hooks/useAgentStatus'
import type { AgentStatus } from '../../types'

const STATUS_COLORS: Record<AgentStatus, string> = {
  active: 'var(--color-status-active)',
  idle: 'var(--color-status-idle)',
  error: 'var(--color-status-error)',
  offline: 'var(--color-status-offline)',
}

const STATUS_LABELS: Record<AgentStatus, string> = {
  active: 'Active',
  idle: 'Idle',
  error: 'Error',
  offline: 'Offline',
}

export function AgentStatusList() {
  const { data: agents, isLoading } = useAgentStatus()

  if (isLoading) {
    return <div className="agent-status-loading">Loading agents...</div>
  }

  if (!agents || agents.length === 0) {
    return <div className="agent-status-empty">No agents available</div>
  }

  return (
    <ul className="agent-status-list" data-testid="agent-status-list">
      {agents.map((agent) => (
        <li key={agent.id} className="agent-status-item">
          <span
            className="agent-status-dot"
            style={{ backgroundColor: STATUS_COLORS[agent.status] }}
            aria-label={`Status: ${STATUS_LABELS[agent.status]}`}
          />
          <span className="agent-status-name">{agent.name}</span>
          <span className="agent-status-label">{STATUS_LABELS[agent.status]}</span>
        </li>
      ))}
    </ul>
  )
}
