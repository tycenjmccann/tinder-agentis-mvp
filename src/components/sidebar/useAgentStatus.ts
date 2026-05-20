import { useState, useEffect, useRef, useCallback } from 'react';
import { usePageVisibility } from './useSidebarResponsive';
import type { Agent, AgentStatusResponse } from './sidebar.types';

interface UseAgentStatusOptions {
  pollingInterval?: number;
  enabled?: boolean;
}

interface UseAgentStatusReturn {
  agents: Agent[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isStale: boolean;
  refetch: () => void;
}

/**
 * Custom hook for fetching agent status with polling.
 * Implements security requirements:
 * - Stops polling when tab is hidden (POLL-1)
 * - Exponential backoff on errors (POLL-2)
 * - Handles 429 rate limiting (POLL-3)
 * - Adds jitter to polling interval (POLL-4)
 * - Only one in-flight request at a time (POLL-5)
 * - Stops after 2 consecutive 401s (POLL-6)
 */
export function useAgentStatus(
  options: UseAgentStatusOptions = {}
): UseAgentStatusReturn {
  const { pollingInterval = 10000, enabled = true } = options;

  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);

  const isVisible = usePageVisibility();
  const consecutiveErrorsRef = useRef(0);
  const consecutive401sRef = useRef(0);
  const inFlightRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryAfterRef = useRef<number | null>(null);

  const fetchAgents = useCallback(async () => {
    // POLL-5: Only one in-flight request at a time
    if (inFlightRef.current) return;

    // POLL-6: Stop after 2 consecutive 401s
    if (consecutive401sRef.current >= 2) return;

    inFlightRef.current = true;

    try {
      const response = await fetch('/api/agents/status');

      if (response.status === 401) {
        consecutive401sRef.current++;
        if (consecutive401sRef.current >= 2) {
          setIsError(true);
          setError(new Error('Authentication expired'));
          return;
        }
      }

      // POLL-3: Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        retryAfterRef.current = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : 60000;
        setIsStale(true);
        return;
      }

      if (!response.ok) {
        throw new Error(`Agent status fetch failed: ${response.status}`);
      }

      const data: AgentStatusResponse = await response.json();
      setAgents(data.agents);
      setIsError(false);
      setError(null);
      setIsStale(false);
      consecutiveErrorsRef.current = 0;
      consecutive401sRef.current = 0;
      retryAfterRef.current = null;
    } catch (err) {
      consecutiveErrorsRef.current++;
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setIsStale(true);
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
    }
  }, []);

  const refetch = useCallback(() => {
    consecutiveErrorsRef.current = 0;
    consecutive401sRef.current = 0;
    retryAfterRef.current = null;
    setIsLoading(true);
    fetchAgents();
  }, [fetchAgents]);

  // Polling logic
  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchAgents();

    const scheduleNextPoll = () => {
      // POLL-1: Don't poll when tab is hidden
      if (!isVisible) return;

      // POLL-3: Respect Retry-After
      if (retryAfterRef.current) {
        timerRef.current = setTimeout(() => {
          retryAfterRef.current = null;
          fetchAgents();
          scheduleNextPoll();
        }, retryAfterRef.current);
        return;
      }

      // POLL-2: Exponential backoff on errors
      const backoff = Math.min(
        pollingInterval * Math.pow(2, consecutiveErrorsRef.current),
        120000 // Max 2 minutes
      );

      // POLL-4: Add jitter ±2s
      const jitter = Math.random() * 4000 - 2000;
      const interval = backoff + jitter;

      timerRef.current = setTimeout(() => {
        fetchAgents();
        scheduleNextPoll();
      }, Math.max(interval, 1000));
    };

    scheduleNextPoll();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [enabled, isVisible, pollingInterval, fetchAgents]);

  return { agents, isLoading, isError, error, isStale, refetch };
}
