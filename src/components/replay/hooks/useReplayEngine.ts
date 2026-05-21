import { useState, useCallback, useRef } from 'react';
import type { ReplayState } from '../types';

/**
 * Maximum duration for catch-up replay (3 seconds).
 * All events will complete within this time budget.
 */
const MAX_REPLAY_DURATION_MS = 3000;

/**
 * Minimum interval between event batches (1 frame at 60fps).
 */
const MIN_FRAME_INTERVAL_MS = 16;

/**
 * Core replay engine hook.
 * Manages the replay state and timing logic with a 3-second duration cap.
 * 
 * Events are replayed sequentially but the total duration is capped at 3 seconds.
 * For large event counts (1000+), events are batched per frame to stay within budget.
 */
export function useReplayEngine() {
  const [replayState, setReplayState] = useState<ReplayState>({
    isReplaying: false,
    currentIndex: 0,
    totalEvents: 0,
    startTime: null,
    isComplete: false,
  });

  const animationFrameRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Calculate the interval per event tick, capped to ensure total <= 3 seconds.
   * For large counts, returns MIN_FRAME_INTERVAL_MS and uses batching.
   */
  const calculateTiming = useCallback((totalEvents: number) => {
    if (totalEvents <= 0) return { intervalMs: 0, eventsPerTick: 1 };

    const idealInterval = MAX_REPLAY_DURATION_MS / totalEvents;

    if (idealInterval >= MIN_FRAME_INTERVAL_MS) {
      // Each event gets its own tick
      return { intervalMs: idealInterval, eventsPerTick: 1 };
    }

    // Need to batch events per frame to stay within 3-second budget
    const totalFrames = Math.floor(MAX_REPLAY_DURATION_MS / MIN_FRAME_INTERVAL_MS);
    const eventsPerTick = Math.ceil(totalEvents / totalFrames);
    return { intervalMs: MIN_FRAME_INTERVAL_MS, eventsPerTick };
  }, []);

  /**
   * Start replaying a sequence of events.
   */
  const startReplay = useCallback((totalEvents: number) => {
    // Cancel any existing replay
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (totalEvents <= 0) return;

    const { intervalMs, eventsPerTick } = calculateTiming(totalEvents);

    setReplayState({
      isReplaying: true,
      currentIndex: 0,
      totalEvents,
      startTime: Date.now(),
      isComplete: false,
    });

    let currentIndex = 0;

    const tick = () => {
      currentIndex = Math.min(currentIndex + eventsPerTick, totalEvents);

      setReplayState((prev) => ({
        ...prev,
        currentIndex,
      }));

      if (currentIndex >= totalEvents) {
        // Replay complete
        setReplayState((prev) => ({
          ...prev,
          isReplaying: false,
          isComplete: true,
          currentIndex: totalEvents,
        }));
        return;
      }

      // Schedule next tick
      if (intervalMs <= MIN_FRAME_INTERVAL_MS) {
        animationFrameRef.current = requestAnimationFrame(tick);
      } else {
        timeoutRef.current = setTimeout(tick, intervalMs);
      }
    };

    // Start first tick after initial interval
    if (intervalMs <= MIN_FRAME_INTERVAL_MS) {
      animationFrameRef.current = requestAnimationFrame(tick);
    } else {
      timeoutRef.current = setTimeout(tick, intervalMs);
    }
  }, [calculateTiming]);

  /**
   * Seek to a specific position during replay.
   */
  const seekTo = useCallback((position: number) => {
    setReplayState((prev) => {
      const targetIndex = Math.round(position * prev.totalEvents);
      return {
        ...prev,
        currentIndex: Math.max(0, Math.min(targetIndex, prev.totalEvents)),
      };
    });
  }, []);

  /**
   * Stop/reset the replay.
   */
  const stopReplay = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setReplayState((prev) => ({
      ...prev,
      isReplaying: false,
    }));
  }, []);

  return {
    replayState,
    startReplay,
    seekTo,
    stopReplay,
  };
}
