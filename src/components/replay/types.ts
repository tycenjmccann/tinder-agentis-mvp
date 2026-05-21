/**
 * Shared types for the replay system.
 */

/** Represents the current state of the replay engine */
export interface ReplayState {
  /** Whether the replay is currently active */
  isReplaying: boolean;
  /** Current event index being replayed (0-based) */
  currentIndex: number;
  /** Total number of events to replay */
  totalEvents: number;
  /** Timestamp when replay started (ms) */
  startTime: number | null;
  /** Whether replay has completed */
  isComplete: boolean;
}

/** Props for the FloatingScrubber component */
export interface FloatingScrubberProps {
  /** Progress from 0 to 1 */
  progress: number;
  /** Whether the scrubber should be visible */
  isVisible: boolean;
  /** Callback when user seeks to a position (0-1 normalized) */
  onSeek: (position: number) => void;
  /** Total number of events */
  totalEvents: number;
  /** Current event index */
  currentIndex: number;
}

/** Props for the ReplayIndicator component */
export interface ReplayIndicatorProps {
  /** Progress from 0 to 1 */
  progress: number;
  /** Whether the indicator should be visible */
  isVisible: boolean;
  /** Label text override */
  label?: string;
}

/** Props for the ScrubberTrack component */
export interface ScrubberTrackProps {
  /** Progress from 0 to 1 */
  progress: number;
  /** Callback when track is clicked (normalized position 0-1) */
  onTrackClick: (normalizedPosition: number) => void;
  /** Whether the track is being hovered */
  isHovered?: boolean;
}

/** Props for the ScrubberThumb component */
export interface ScrubberThumbProps {
  /** Progress from 0 to 1 */
  progress: number;
  /** Whether the thumb is being dragged */
  isDragging: boolean;
  /** Pointer event handlers from useScrubberDrag */
  onPointerDown: (e: React.PointerEvent) => void;
}
