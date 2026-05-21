import { useMemo } from 'react';
import type { ReplayState } from '../types';

/**
 * Hook that derives progress (0-1) from replay engine state.
 * Used by both FloatingScrubber and ReplayIndicator.
 */
export function useReplayProgress(replayState: ReplayState): number {
  return useMemo(() => {
    if (replayState.totalEvents <= 0) return 0;
    return Math.min(replayState.currentIndex / replayState.totalEvents, 1);
  }, [replayState.currentIndex, replayState.totalEvents]);
}
