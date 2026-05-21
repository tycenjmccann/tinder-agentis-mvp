import React from 'react';
import { ReplayDemo } from './components/replay/ReplayDemo';

/**
 * App root component.
 * Renders the replay demo showcasing the floating scrubber and replay indicator.
 */
export function App() {
  return (
    <div className="min-h-screen bg-[#0f0f17] text-gray-200">
      <header className="border-b border-[#2a2a3a] px-6 py-4">
        <h1 className="text-lg font-semibold text-white">Agentis Hub</h1>
      </header>
      <main className="px-6 py-6">
        <ReplayDemo />
      </main>
    </div>
  );
}

export default App;
