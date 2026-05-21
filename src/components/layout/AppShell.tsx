import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarNavigation } from '../sidebar';
import './AppShell.css';

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell - Top-level layout component wrapping sidebar + main content.
 *
 * Provides flex layout with sidebar and main content area.
 * Integrates SidebarNavigation with router navigation.
 */
export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <SidebarNavigation onNavigate={(route) => navigate(route)} />
      <main className="app-shell__main" id="main-content">
        {children}
      </main>
    </div>
  );
}
