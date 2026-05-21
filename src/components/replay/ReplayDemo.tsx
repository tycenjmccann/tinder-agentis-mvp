import React, { useState } from 'react';
import { FloatingScrubber } from './FloatingScrubber';
import { ReplayIndicator } from './ReplayIndicator';
import { useReplayEngine, useReplayProgress, useReplayVisibility } from './hooks';

/**
 * ReplayDemo is a demonstration/integration component that wires together
 * the replay engine, floating scrubber, and replay indicator.
 * 
 * In a production app, this integration would live in the page-level component
 * (e.g., WorkflowDetail page) where the replay engine and intake cards exist.
 */
export const ReplayDemo: React.FC = () => {
  const { replayState, startReplay, seekTo, stopReplay } = useReplayEngine();
  const progress = useReplayProgress(replayState);
  const isVisible = useReplayVisibility(replayState);
  const [eventCount, setEventCount] = useState(50);

  return (
    <div className="space-y-6">
      {/* Controls for demo */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-[#1a1a25] border border-[#2a2a3a] rounded-lg">
        <label className="flex items-center gap-2 text-sm text-gray-300">
          Events:
          <input
            type="number"
            min={1}
            max={5000}
            value={eventCount}
            onChange={(e) => setEventCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 px-2 py-1 bg-[#222230] border border-[#2a2a3a] rounded text-white text-sm"
          />
        </label>
        <button
          onClick={() => startReplay(eventCount)}
          disabled={replayState.isReplaying}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800 disabled:text-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Start Replay
        </button>
        <button
          onClick={stopReplay}
          disabled={!replayState.isReplaying}
          className="px-4 py-2 bg-red-600/80 hover:bg-red-500 disabled:bg-red-900/40 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Stop
        </button>
        <span className="text-xs text-gray-500">
          {replayState.isReplaying
            ? `Playing: ${replayState.currentIndex}/${replayState.totalEvents}`
            : replayState.isComplete
            ? 'Complete'
            : 'Ready'}
        </span>
      </div>

      {/* Replay Indicator - positioned above intake cards */}
      <div className="mb-4">
        <ReplayIndicator
          progress={progress}
          isVisible={isVisible}
        />
      </div>

      {/* Simulated intake cards (placeholder content) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="p-4 bg-[#1a1a25] border border-[#2a2a3a] rounded-lg"
          >
            <h3 className="text-sm font-medium text-white mb-2">Intake Card {i + 1}</h3>
            <p className="text-xs text-gray-400">Sample workflow event content</p>
          </div>
        ))}
      </div>

      {/* Extra content to demonstrate scrolling behind scrubber */}
      <div className="space-y-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="p-4 bg-[#1a1a25]/50 border border-[#2a2a3a]/50 rounded-lg"
          >
            <p className="text-xs text-gray-500">Additional content block {i + 1} — scrolls behind the floating scrubber</p>
          </div>
        ))}
      </div>

      {/* Floating Scrubber - fixed position at bottom */}
      <FloatingScrubber
        progress={progress}
        isVisible={isVisible}
        onSeek={seekTo}
        totalEvents={replayState.totalEvents}
        currentIndex={replayState.currentIndex}
      />
    </div>
  );
};
