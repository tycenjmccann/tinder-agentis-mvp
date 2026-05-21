import { useQuery } from '@tanstack/react-query'
import type { Ticket } from '../types'

const mockTickets: Ticket[] = [
  { id: 'TEAM-130', title: 'Implement Collapsible Sidebar', status: 'in_progress', url: '/tickets/TEAM-130', assignee: 'frontend-dev' },
  { id: 'TEAM-129', title: 'Sidebar Component Architecture', status: 'done', url: '/tickets/TEAM-129', assignee: 'frontend-designer' },
  { id: 'TEAM-132', title: 'QA: Verify Sidebar Navigation', status: 'open', url: '/tickets/TEAM-132', assignee: 'qa-verifier' },
  { id: 'TEAM-133', title: 'CI: Validate Build', status: 'blocked', url: '/tickets/TEAM-133', assignee: 'ci-agent' },
]

async function fetchTickets(): Promise<Ticket[]> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 100))
  return mockTickets
}

export function useTicketLinks() {
  return useQuery({
    queryKey: ['ticket-links'],
    queryFn: fetchTickets,
    refetchInterval: 10000,
  })
}
