import React from 'react';
import type { ScrubberThumbProps } from './types';

/**
 * ScrubberThumb renders the draggable handle on the track.
 * Has a 44px touch target (invisible padding) for mobile accessibility.
 * Shows a glow ring when being dragged.
 */
export const ScrubberThumb: React.FC<ScrubberThumbProps> = ({
  progress,
  isDragging,
  onPointerDown,
}) => {
  const thumbClasses = [
    'absolute top-1/2 -translate-y-1/2 -translate-x-1/2',
    'w-4 h-4 rounded-full bg-sky-400 border-2 border-white',
    'transition-transform duration-150',
    'hover:scale-125',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a25]',
    isDragging ? 'scale-125 shadow-[0_0_0_4px_rgba(56,189,248,0.3)]' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={thumbClasses}
      style={{ left: `${Math.min(progress * 100, 100)}%` }}
      onPointerDown={onPointerDown}
      role="slider"
      tabIndex={0}
      aria-label="Replay progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      aria-valuetext={`${Math.round(progress * 100)}% complete`}
    >
      {/* Invisible touch target (44x44px) for mobile accessibility */}
      <span className="absolute inset-[-14px]" aria-hidden="true" />
    </div>
  );
};
