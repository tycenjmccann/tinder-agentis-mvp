import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './components/layout';
import './styles/tokens.css';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * App root component.
 * Sets up providers and routing with AppShell layout.
 */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<DashboardPlaceholder />} />
            <Route path="/agents/:id" element={<AgentDetailPlaceholder />} />
            <Route path="/workflows/new" element={<NewWorkflowPlaceholder />} />
            <Route path="/workflows/:id" element={<WorkflowDetailPlaceholder />} />
            <Route path="/logs" element={<LogsPlaceholder />} />
            <Route path="/settings" element={<SettingsPlaceholder />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// Placeholder route components
function DashboardPlaceholder() {
  return <div><h1>Dashboard</h1><p>Main content area</p></div>;
}
function AgentDetailPlaceholder() {
  return <div><h1>Agent Detail</h1></div>;
}
function NewWorkflowPlaceholder() {
  return <div><h1>New Workflow</h1></div>;
}
function WorkflowDetailPlaceholder() {
  return <div><h1>Workflow Detail</h1></div>;
}
function LogsPlaceholder() {
  return <div><h1>Logs</h1></div>;
}
function SettingsPlaceholder() {
  return <div><h1>Settings</h1></div>;
}

export default App;
