import { useQuery } from '@tanstack/react-query'
import type { Agent } from '../types'

const mockAgents: Agent[] = [
  { id: '1', name: 'Requirements Analyst', status: 'active', lastUpdated: new Date().toISOString() },
  { id: '2', name: 'Frontend Designer', status: 'idle', lastUpdated: new Date().toISOString() },
  { id: '3', name: 'Frontend Dev', status: 'active', lastUpdated: new Date().toISOString() },
  { id: '4', name: 'Backend Dev', status: 'offline', lastUpdated: new Date().toISOString() },
  { id: '5', name: 'QA Verifier', status: 'error', lastUpdated: new Date().toISOString() },
]

async function fetchAgentStatus(): Promise<Agent[]> {
  // Simulate API call / WebSocket data
  await new Promise((resolve) => setTimeout(resolve, 100))
  return mockAgents.map((agent) => ({
    ...agent,
    lastUpdated: new Date().toISOString(),
  }))
}

export function useAgentStatus() {
  return useQuery({
    queryKey: ['agent-status'],
    queryFn: fetchAgentStatus,
    refetchInterval: 5000,
  })
}
