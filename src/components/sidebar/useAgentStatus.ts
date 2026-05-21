import { useState, useEffect, useRef } from 'react';
import { usePageVisibility } from './useSidebarResponsive';
import type { Agent } from './sidebar.types';

// Mock data for development
const MOCK_AGENTS: Agent[] = [
  { id: '1', name: 'Frontend Dev', role: 'developer', status: 'active', lastActivity: new Date().toISOString() },
  { id: '2', name: 'Backend Dev', role: 'developer', status: 'active', lastActivity: new Date().toISOString() },
  { id: '3', name: 'QA Agent', role: 'tester', status: 'idle', lastActivity: new Date().toISOString() },
  { id: '4', name: 'CI Agent', role: 'devops', status: 'active', lastActivity: new Date().toISOString() },
  { id: '5', name: 'Designer', role: 'design', status: 'idle', lastActivity: new Date().toISOString() },
];

interface UseAgentStatusReturn {
  agents: Agent[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for fetching agent status data with polling.
 * Pauses polling when page is hidden.
 */
export function useAgentStatus(pollingInterval = 10000): UseAgentStatusReturn {
  const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isVisible = usePageVisibility();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // In development, use mock data
    setAgents(MOCK_AGENTS);
    setIsLoading(false);

    // Real implementation would poll an API:
    // if (isVisible) {
    //   intervalRef.current = setInterval(fetchAgents, pollingInterval);
    // }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pollingInterval, isVisible]);

  return { agents, isLoading, error };
}
