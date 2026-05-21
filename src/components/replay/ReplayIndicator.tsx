import React from 'react';
import { RotateCcw } from 'lucide-react';
import type { ReplayIndicatorProps } from './types';

/**
 * ReplayIndicator shows a compact status badge during event replay.
 * 
 * Positioned above the intake cards (not fixed - scrolls with content).
 * Includes a pulsing replay icon, progress bar, and percentage text.
 * Uses role="status" with aria-live for screen reader announcements.
 */
export const ReplayIndicator: React.FC<ReplayIndicatorProps> = ({
  progress,
  isVisible,
  label = 'Replaying...',
}) => {
  const percent = Math.round(progress * 100);

  const containerClasses = [
    'inline-flex items-center gap-2 px-3 py-2',
    'bg-[#1a1a25] border border-[#2a2a3a] rounded-lg',
    'transition-all duration-200 ease-out',
    isVisible
      ? 'opacity-100 translate-y-0'
      : 'opacity-0 -translate-y-2 pointer-events-none',
  ].join(' ');

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Replay progress: ${percent}% complete`}
      className={containerClasses}
    >
      {/* Replay icon with pulse animation */}
      <RotateCcw
        className={`w-4 h-4 text-sky-500 ${isVisible ? 'animate-replay-pulse' : ''}`}
        aria-hidden="true"
      />

      {/* Label */}
      <span className="text-xs font-medium text-gray-300">
        {label}
      </span>

      {/* Progress bar */}
      <div className="relative w-20 h-1 rounded-full bg-[#222230] overflow-hidden">
        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="absolute inset-y-0 left-0 rounded-full bg-sky-500 transition-[width] duration-75 ease-linear"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Percentage text */}
      <span className="text-xs text-gray-400 font-mono tabular-nums w-8 text-right">
        {percent}%
      </span>
    </div>
  );
};
