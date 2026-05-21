import React from 'react';
import type { ScrubberTrackProps } from './types';

/**
 * ScrubberTrack renders the horizontal progress track.
 * Shows the unfilled background and the filled progress portion.
 * Handles click-to-seek interactions.
 */
export const ScrubberTrack: React.FC<ScrubberTrackProps & {
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  trackRef: React.RefObject<HTMLDivElement>;
}> = ({ progress, onClick, trackRef }) => {
  return (
    <div
      ref={trackRef}
      className="relative w-full h-1.5 rounded-full bg-[#222230] cursor-pointer group hover:h-2 transition-all duration-150"
      onClick={onClick}
      role="presentation"
    >
      {/* Filled progress portion */}
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-sky-500 transition-[width] duration-75 ease-linear"
        style={{ width: `${Math.min(progress * 100, 100)}%` }}
      />
    </div>
  );
};
