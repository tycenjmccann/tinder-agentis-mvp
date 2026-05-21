import { useState, useCallback, useRef } from 'react';

interface UseScrubberDragOptions {
  onSeek: (position: number) => void;
}

interface UseScrubberDragReturn {
  isDragging: boolean;
  handlePointerDown: (e: React.PointerEvent) => void;
  handleTrackClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  trackRef: React.RefObject<HTMLDivElement>;
}

/**
 * Hook that manages pointer/drag events for the scrubber.
 * Uses pointer capture for smooth dragging across the track.
 * Calculates normalized position (0-1) from pointer coordinates.
 */
export function useScrubberDrag({ onSeek }: UseScrubberDragOptions): UseScrubberDragReturn {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null!);

  const getPositionFromEvent = useCallback((clientX: number): number => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const position = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(1, position));
  }, []);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const position = getPositionFromEvent(e.clientX);
      onSeek(position);
    },
    [getPositionFromEvent, onSeek]
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      setIsDragging(false);
      const position = getPositionFromEvent(e.clientX);
      onSeek(position);

      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      (e.target as HTMLElement)?.releasePointerCapture?.(e.pointerId);
    },
    [getPositionFromEvent, handlePointerMove, onSeek]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setIsDragging(true);

      const position = getPositionFromEvent(e.clientX);
      onSeek(position);

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
    },
    [getPositionFromEvent, handlePointerMove, handlePointerUp, onSeek]
  );

  const handleTrackClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only handle direct track clicks, not thumb drags
      if (isDragging) return;
      const position = getPositionFromEvent(e.clientX);
      onSeek(position);
    },
    [getPositionFromEvent, isDragging, onSeek]
  );

  return {
    isDragging,
    handlePointerDown,
    handleTrackClick,
    trackRef,
  };
}
