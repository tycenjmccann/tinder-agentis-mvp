import React, { useCallback } from 'react';
import type { FloatingScrubberProps } from './types';
import { ScrubberTrack } from './ScrubberTrack';
import { ScrubberThumb } from './ScrubberThumb';
import { useScrubberDrag } from './hooks/useScrubberDrag';

/**
 * FloatingScrubber is the compact, fixed-position scrubber bar.
 * 
 * Features:
 * - Fixed bottom-center positioning with responsive width
 * - Backdrop blur + shadow for floating glass-panel effect
 * - Drag/click/keyboard seek interactions
 * - Accessible slider with ARIA attributes
 * - Entry/exit animations via CSS transitions
 */
export const FloatingScrubber: React.FC<FloatingScrubberProps> = ({
  progress,
  isVisible,
  onSeek,
  totalEvents,
  currentIndex,
}) => {
  const { isDragging, handlePointerDown, handleTrackClick, trackRef } = useScrubberDrag({
    onSeek,
  });

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (totalEvents <= 0) return;

      const step = 1 / totalEvents;
      let newPosition = progress;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          newPosition = Math.min(1, progress + step);
          e.preventDefault();
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
          newPosition = Math.max(0, progress - step);
          e.preventDefault();
          break;
        case 'Home':
          newPosition = 0;
          e.preventDefault();
          break;
        case 'End':
          newPosition = 1;
          e.preventDefault();
          break;
        default:
          return;
      }

      onSeek(newPosition);
    },
    [progress, totalEvents, onSeek]
  );

  const containerClasses = [
    // Positioning: fixed, bottom-center
    'fixed bottom-8 left-1/2 -translate-x-1/2 z-50',
    // Responsive sizing
    'w-[calc(100vw-32px)] sm:w-[60vw] lg:w-[50vw]',
    'max-w-[700px] min-w-[280px]',
    // Visual treatment: frosted glass panel
    'bg-[#1a1a25]/85 backdrop-blur-md',
    'border border-[#2a2a3a]',
    'rounded-2xl',
    'shadow-[0_4px_24px_rgba(0,0,0,0.4)]',
    // Padding
    'px-5 py-3',
    // Entry/exit transitions
    'transition-all duration-300 ease-out',
    isVisible
      ? 'opacity-100 translate-y-0'
      : 'opacity-0 translate-y-4 pointer-events-none',
  ].join(' ');

  return (
    <div
      className={containerClasses}
      onKeyDown={handleKeyDown}
      aria-label={`Replay scrubber: event ${currentIndex} of ${totalEvents}`}
    >
      {/* Track + Thumb container */}
      <div className="relative w-full py-2">
        <ScrubberTrack
          progress={progress}
          onTrackClick={handleTrackClick}
          onClick={handleTrackClick}
          trackRef={trackRef}
        />
        <ScrubberThumb
          progress={progress}
          isDragging={isDragging}
          onPointerDown={handlePointerDown}
        />
      </div>

      {/* Timestamp row */}
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-400 font-mono tabular-nums">
          {currentIndex} / {totalEvents}
        </span>
        <span className="text-xs text-gray-400">
          Replay
        </span>
      </div>
    </div>
  );
};
