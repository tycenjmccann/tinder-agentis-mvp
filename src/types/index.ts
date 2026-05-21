export type AgentStatus = 'active' | 'idle' | 'error' | 'offline'

export interface Agent {
  id: string
  name: string
  status: AgentStatus
  lastUpdated: string
}

export interface Workflow {
  id: string
  name: string
  progress: number
  status: 'running' | 'completed' | 'failed' | 'queued'
}

export interface Ticket {
  id: string
  title: string
  status: 'open' | 'in_progress' | 'done' | 'blocked'
  url: string
  assignee: string
}
