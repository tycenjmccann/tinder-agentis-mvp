import React, { useCallback } from 'react';
import { SidebarNavigation } from './components/sidebar';
import './App.css';

/**
 * App - Root application shell.
 *
 * Integrates the SidebarNavigation with the main content area.
 * Uses flex layout for sidebar + content arrangement.
 */
export function App() {
  const handleNavigate = useCallback((route: string) => {
    // In a real app, this would use React Router's navigate()
    console.log(`Navigate to: ${route}`);
    // window.location.href = route;
  }, []);

  return (
    <div className="app-shell">
      <SidebarNavigation onNavigate={handleNavigate} />
      <main className="main-content">
        <div className="main-content__placeholder">
          <h1>Agentis Hub Dashboard</h1>
          <p>Select an item from the sidebar to get started.</p>
        </div>
      </main>
    </div>
  );
}
