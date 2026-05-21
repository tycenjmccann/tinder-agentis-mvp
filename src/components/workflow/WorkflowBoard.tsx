import React, { useState, useCallback, useRef, useEffect } from 'react';

// =============================================================================
// TYPES
// =============================================================================

interface ReplayEvent {
  id: string;
  type: string;
  timestamp: number;
  payload?: Record<string, unknown>;
}

interface WorkflowBoardProps {
  workflowId: string;
  events?: ReplayEvent[];
  onLiveConnect?: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Maximum duration for catch-up replay (3 seconds) */
const CATCHUP_MAX_DURATION_MS = 3000;

/** Minimum interval between event frames (60fps) */
const MIN_FRAME_INTERVAL_MS = 16;

/** Event types that represent meaningful state changes (animated during catch-up) */
const KEY_EVENT_TYPES = [
  'phase_transition',
  'agent_start',
  'agent_complete',
  'workflow_start',
  'workflow_complete',
  'error',
];

/** Available playback speed options for manual replay */
const SPEED_OPTIONS = [
  { label: '0.5x', value: 0.5 },
  { label: '1x', value: 1 },
  { label: '2x', value: 2 },
  { label: '4x', value: 4 },
  { label: '8x', value: 8 },
];

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * WorkflowBoard is the primary workflow visualization component.
 * It includes an inline replay system with:
 * - A narrowed, centered, sticky scrubber bar (max 800px)
 * - Hybrid catch-up replay capped at ≤3 seconds
 * - A top-left loading indicator during catch-up mode
 *
 * All replay state is managed inline — no external state machines or hook files.
 */
export const WorkflowBoard: React.FC<WorkflowBoardProps> = ({
  workflowId,
  events = [],
  onLiveConnect,
}) => {
  // ---------------------------------------------------------------------------
  // REPLAY STATE
  // ---------------------------------------------------------------------------
  const [replayMode, setReplayMode] = useState(false);
  const [replayEvents, setReplayEvents] = useState<ReplayEvent[]>([]);
  const [replayIndex, setReplayIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isCatchingUp, setIsCatchingUp] = useState(false);

  const animationFrameRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const catchUpAbortRef = useRef(false);

  // ---------------------------------------------------------------------------
  // REDUCED MOTION DETECTION
  // ---------------------------------------------------------------------------
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // ---------------------------------------------------------------------------
  // PLAYBACK ENGINE — HYBRID CATCH-UP (≤3 SECOND CAP)
  // ---------------------------------------------------------------------------

  /**
   * Determines timing for catch-up replay.
   * For <=500 events: replay all at even intervals within 3s.
   * For >500 events: only animate key events, batch-apply the rest.
   */
  const calculateCatchUpTiming = useCallback((eventList: ReplayEvent[]) => {
    const totalEvents = eventList.length;
    if (totalEvents <= 0) return { intervalMs: 0, eventsPerTick: 1, useHybrid: false };

    if (totalEvents <= 500) {
      // Small set: replay all events evenly within 3s
      const idealInterval = CATCHUP_MAX_DURATION_MS / totalEvents;
      if (idealInterval >= MIN_FRAME_INTERVAL_MS) {
        return { intervalMs: idealInterval, eventsPerTick: 1, useHybrid: false };
      }
      // Batch if needed
      const totalFrames = Math.floor(CATCHUP_MAX_DURATION_MS / MIN_FRAME_INTERVAL_MS);
      const eventsPerTick = Math.ceil(totalEvents / totalFrames);
      return { intervalMs: MIN_FRAME_INTERVAL_MS, eventsPerTick, useHybrid: false };
    }

    // Large set (>500): use hybrid sampling
    return { intervalMs: 0, eventsPerTick: 1, useHybrid: true };
  }, []);

  /**
   * Starts catch-up replay. Ensures total time ≤3s.
   * Uses hybrid approach for large event sets:
   * - Key events are animated with visual delay
   * - Non-key events are batch-applied instantly
   */
  const startCatchUpReplay = useCallback((eventList: ReplayEvent[]) => {
    if (eventList.length === 0) {
      // No events, go straight to live
      setReplayMode(false);
      setIsCatchingUp(false);
      onLiveConnect?.();
      return;
    }

    // Set up state
    setReplayEvents(eventList);
    setReplayMode(true);
    setIsCatchingUp(true);
    setIsPlaying(true);
    setReplayIndex(0);
    catchUpAbortRef.current = false;

    const { intervalMs, eventsPerTick, useHybrid } = calculateCatchUpTiming(eventList);

    if (useHybrid) {
      // Hybrid mode: animate key events, batch non-key events
      const keyEventIndices: number[] = [];
      eventList.forEach((event, idx) => {
        if (KEY_EVENT_TYPES.includes(event.type)) {
          keyEventIndices.push(idx);
        }
      });

      // If no key events found, fall back to batched approach
      if (keyEventIndices.length === 0) {
        const totalFrames = Math.floor(CATCHUP_MAX_DURATION_MS / MIN_FRAME_INTERVAL_MS);
        const batchSize = Math.ceil(eventList.length / totalFrames);
        let idx = 0;

        const batchTick = () => {
          if (catchUpAbortRef.current) return;
          idx = Math.min(idx + batchSize, eventList.length);
          setReplayIndex(idx);

          if (idx >= eventList.length) {
            completeCatchUp(eventList.length);
            return;
          }
          animationFrameRef.current = requestAnimationFrame(batchTick);
        };
        animationFrameRef.current = requestAnimationFrame(batchTick);
        return;
      }

      // Calculate interval between key events
      const visualInterval = Math.max(
        CATCHUP_MAX_DURATION_MS / keyEventIndices.length,
        MIN_FRAME_INTERVAL_MS
      );

      let keyIdx = 0;

      const hybridTick = () => {
        if (catchUpAbortRef.current) return;

        if (keyIdx >= keyEventIndices.length) {
          // All key events processed, set final state
          setReplayIndex(eventList.length);
          completeCatchUp(eventList.length);
          return;
        }

        // Jump to next key event (applying all events up to and including it)
        const targetIndex = keyEventIndices[keyIdx] + 1;
        setReplayIndex(targetIndex);
        keyIdx++;

        // Schedule next key event
        timeoutRef.current = setTimeout(hybridTick, visualInterval);
      };

      // Start with first tick
      timeoutRef.current = setTimeout(hybridTick, visualInterval);
    } else {
      // Non-hybrid: replay all events with even timing
      let currentIdx = 0;

      const tick = () => {
        if (catchUpAbortRef.current) return;
        currentIdx = Math.min(currentIdx + eventsPerTick, eventList.length);
        setReplayIndex(currentIdx);

        if (currentIdx >= eventList.length) {
          completeCatchUp(eventList.length);
          return;
        }

        if (intervalMs <= MIN_FRAME_INTERVAL_MS) {
          animationFrameRef.current = requestAnimationFrame(tick);
        } else {
          timeoutRef.current = setTimeout(tick, intervalMs);
        }
      };

      if (intervalMs <= MIN_FRAME_INTERVAL_MS) {
        animationFrameRef.current = requestAnimationFrame(tick);
      } else {
        timeoutRef.current = setTimeout(tick, intervalMs);
      }
    }
  }, [calculateCatchUpTiming, onLiveConnect]);

  /**
   * Called when catch-up replay finishes.
   * Transitions to live SSE mode.
   */
  const completeCatchUp = useCallback((finalIndex: number) => {
    setReplayIndex(finalIndex);
    setIsCatchingUp(false);
    setIsPlaying(false);
    setReplayMode(false);
    onLiveConnect?.();
  }, [onLiveConnect]);

  // ---------------------------------------------------------------------------
  // MANUAL REPLAY ENGINE (user-initiated play/pause with speed control)
  // ---------------------------------------------------------------------------

  /**
   * Starts manual replay from current index.
   * Respects playbackSpeed setting.
   */
  const startManualReplay = useCallback(() => {
    if (replayEvents.length === 0) return;

    // If catch-up is running, abort it first
    if (isCatchingUp) {
      catchUpAbortRef.current = true;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsCatchingUp(false);
    }

    setReplayMode(true);
    setIsPlaying(true);

    const baseInterval = 100; // 100ms base interval at 1x speed
    let currentIdx = replayIndex;

    const tick = () => {
      currentIdx = Math.min(currentIdx + 1, replayEvents.length);
      setReplayIndex(currentIdx);

      if (currentIdx >= replayEvents.length) {
        setIsPlaying(false);
        return;
      }

      timeoutRef.current = setTimeout(tick, baseInterval / playbackSpeed);
    };

    timeoutRef.current = setTimeout(tick, baseInterval / playbackSpeed);
  }, [replayEvents, replayIndex, playbackSpeed, isCatchingUp]);

  /**
   * Pauses replay.
   */
  const pauseReplay = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPlaying(false);

    // If catch-up was running, cancel it
    if (isCatchingUp) {
      catchUpAbortRef.current = true;
      setIsCatchingUp(false);
    }
  }, [isCatchingUp]);

  /**
   * Toggles play/pause.
   */
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pauseReplay();
    } else {
      startManualReplay();
    }
  }, [isPlaying, pauseReplay, startManualReplay]);

  /**
   * Handles scrubber seek (manual interaction).
   */
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);

    // If catch-up is running, abort it
    if (isCatchingUp) {
      catchUpAbortRef.current = true;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsCatchingUp(false);
      setIsPlaying(false);
    }

    setReplayIndex(value);
  }, [isCatchingUp]);

  /**
   * Handles speed change.
   */
  const handleSpeedChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setPlaybackSpeed(parseFloat(e.target.value));
  }, []);

  // ---------------------------------------------------------------------------
  // AUTO-START CATCH-UP when events are provided
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (events.length > 0 && !replayMode && !isCatchingUp) {
      startCatchUpReplay(events);
    }
  }, [events]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // CLEANUP on unmount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // DERIVED VALUES
  // ---------------------------------------------------------------------------
  const totalEvents = replayEvents.length || 1;
  const progressPercent = Math.round((replayIndex / totalEvents) * 100);

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Keyframe animation for catch-up spinner */}
      <style>{`
        @keyframes catchup-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
      `}</style>

      {/* ===================================================================
          REPLAY SCRUBBER BAR — Narrowed (800px), centered, sticky
          =================================================================== */}
      {replayMode && (
        <div
          className="replay-bar"
          role="toolbar"
          aria-label="Replay controls"
          style={{
            // Layout — narrowed and centered
            maxWidth: '800px',
            width: '100%',
            margin: '0 auto',

            // Sticky positioning
            position: 'sticky',
            top: '0',
            zIndex: 40,

            // Visual treatment
            background: '#1a1a25',
            border: '1px solid #2a2a3a',
            borderRadius: '12px',
            padding: '12px 20px',

            // Flex layout for controls
            display: 'flex',
            alignItems: 'center',
            gap: '12px',

            // Backdrop effect when sticky
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(26, 26, 37, 0.95)',
          }}
        >
          {/* Play/Pause Button */}
          <button
            onClick={togglePlayPause}
            aria-label={isPlaying ? 'Pause replay' : 'Resume replay'}
            style={{
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#222230',
              border: '1px solid #2a2a3a',
              borderRadius: '8px',
              color: '#f8f9fa',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'background-color 0.15s ease, border-color 0.15s ease',
            }}
          >
            {isPlaying ? (
              // Pause icon
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              // Play icon
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>

          {/* Range Slider */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
            <input
              type="range"
              min={0}
              max={replayEvents.length}
              value={replayIndex}
              onChange={handleSeek}
              aria-label="Replay position"
              aria-valuemin={0}
              aria-valuemax={replayEvents.length}
              aria-valuenow={replayIndex}
              style={{
                width: '100%',
                height: '4px',
                cursor: 'pointer',
                accentColor: '#0ea5e9',
              }}
            />
          </div>

          {/* Event Counter */}
          <span
            aria-label={`Event ${replayIndex} of ${replayEvents.length}`}
            style={{
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              fontSize: '12px',
              color: '#9ca3af',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              minWidth: '60px',
              textAlign: 'right',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {replayIndex}/{replayEvents.length}
          </span>

          {/* Speed Dropdown */}
          <select
            value={playbackSpeed}
            onChange={handleSpeedChange}
            aria-label="Playback speed"
            style={{
              padding: '4px 8px',
              background: '#222230',
              border: '1px solid #2a2a3a',
              borderRadius: '6px',
              color: '#d1d5db',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              flexShrink: 0,
              outline: 'none',
              transition: 'border-color 0.15s ease',
            }}
          >
            {SPEED_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ===================================================================
          CATCH-UP LOADING INDICATOR — Top-left, above pipeline grid
          =================================================================== */}
      {isCatchingUp && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: '#1a1a25',
            border: '1px solid #2a2a3a',
            borderRadius: '8px',
            marginBottom: '12px',
            marginTop: '12px',
            transition: prefersReducedMotion ? 'none' : 'opacity 0.2s ease, transform 0.2s ease',
          }}
          role="status"
          aria-live="polite"
          aria-label={`Replaying history: ${progressPercent}% complete`}
        >
          {/* Replay icon — inline SVG with rotation */}
          <svg
            style={{
              width: '16px',
              height: '16px',
              color: '#0ea5e9',
              animation: prefersReducedMotion ? 'none' : 'catchup-spin 2s linear infinite',
              flexShrink: 0,
            }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M1 4v6h6" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>

          {/* Label */}
          <span
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: '#d1d5db',
              whiteSpace: 'nowrap',
            }}
          >
            Replaying history...
          </span>

          {/* Progress bar */}
          <div
            style={{
              width: '80px',
              height: '4px',
              borderRadius: '2px',
              background: '#222230',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: '2px',
                background: '#0ea5e9',
                transition: 'width 75ms linear',
                width: `${progressPercent}%`,
              }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          {/* Percentage */}
          <span
            style={{
              fontSize: '12px',
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              fontVariantNumeric: 'tabular-nums',
              color: '#9ca3af',
              minWidth: '32px',
              textAlign: 'right' as const,
            }}
          >
            {progressPercent}%
          </span>
        </div>
      )}

      {/* ===================================================================
          PIPELINE GRID — Workflow visualization area
          =================================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
          padding: '16px 0',
        }}
      >
        {/* Pipeline cards render here based on replay state */}
        {replayIndex > 0 && (
          <div
            style={{
              padding: '16px',
              background: '#1a1a25',
              border: '1px solid #2a2a3a',
              borderRadius: '8px',
            }}
          >
            <p style={{ fontSize: '12px', color: '#9ca3af' }}>
              Workflow: {workflowId}
            </p>
            <p style={{ fontSize: '14px', color: '#d1d5db', marginTop: '8px' }}>
              Events processed: {replayIndex} / {replayEvents.length}
            </p>
            {replayEvents[replayIndex - 1] && (
              <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                Last event: {replayEvents[replayIndex - 1].type}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowBoard;
