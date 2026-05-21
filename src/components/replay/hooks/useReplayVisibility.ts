import { useState, useEffect, useRef } from 'react';
import type { ReplayState } from '../types';

/**
 * Hook that controls visibility of replay UI elements.
 * Shows during replay, holds visibility briefly after completion (500ms),
 * then hides.
 */
export function useReplayVisibility(replayState: ReplayState): boolean {
  const [isVisible, setIsVisible] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    if (replayState.isReplaying) {
      setIsVisible(true);
    } else if (replayState.isComplete) {
      // Hold visibility for 500ms after completion before hiding
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 500);
    } else if (replayState.totalEvents === 0) {
      setIsVisible(false);
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [replayState.isReplaying, replayState.isComplete, replayState.totalEvents]);

  return isVisible;
}
