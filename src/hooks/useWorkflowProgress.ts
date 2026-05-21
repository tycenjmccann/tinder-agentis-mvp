import { useQuery } from '@tanstack/react-query'
import type { Workflow } from '../types'

const mockWorkflows: Workflow[] = [
  { id: 'wf-1', name: 'Sidebar Navigation', progress: 65, status: 'running' },
  { id: 'wf-2', name: 'Auth Flow', progress: 100, status: 'completed' },
  { id: 'wf-3', name: 'Dashboard Charts', progress: 30, status: 'running' },
  { id: 'wf-4', name: 'API Integration', progress: 0, status: 'queued' },
]

async function fetchWorkflowProgress(): Promise<Workflow[]> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 100))
  return mockWorkflows
}

export function useWorkflowProgress() {
  return useQuery({
    queryKey: ['workflow-progress'],
    queryFn: fetchWorkflowProgress,
    refetchInterval: 5000,
  })
}
