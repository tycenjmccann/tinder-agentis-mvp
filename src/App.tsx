import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';

/**
 * App root component.
 * Sets up routing with AppShell layout containing the collapsible sidebar.
 */
export function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<DashboardPlaceholder />} />
          <Route path="/workflows" element={<WorkflowsPlaceholder />} />
          <Route path="/agents" element={<AgentsPlaceholder />} />
          <Route path="/logs" element={<LogsPlaceholder />} />
          <Route path="/settings" element={<SettingsPlaceholder />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

// Placeholder route components
function DashboardPlaceholder() {
  return <div className="page-content"><h1>Dashboard</h1><p>Main content area</p></div>;
}
function WorkflowsPlaceholder() {
  return <div className="page-content"><h1>Workflows</h1></div>;
}
function AgentsPlaceholder() {
  return <div className="page-content"><h1>Agents</h1></div>;
}
function LogsPlaceholder() {
  return <div className="page-content"><h1>Logs</h1></div>;
}
function SettingsPlaceholder() {
  return <div className="page-content"><h1>Settings</h1></div>;
}

export default App;
