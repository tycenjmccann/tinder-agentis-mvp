import React, { useRef, useEffect, useState } from 'react';
import { SidebarContext } from './SidebarContext';
import { useSidebarResponsive } from './useSidebarResponsive';
import { SidebarHeader } from './SidebarHeader';
import { AgentStatusPanel } from './AgentStatusPanel';
import { WorkflowHistoryList } from './WorkflowHistoryList';
import { QuickActions } from './QuickActions';
import { Plus, ScrollText, Settings } from 'lucide-react';
import type { SidebarNavigationProps, QuickAction } from './sidebar.types';
import './SidebarNavigation.css';

/**
 * SidebarNavigation - Root sidebar container component
 *
 * Features:
 * - Collapsible with smooth 300ms CSS transitions
 * - Toggle between w-16 (collapsed, icons only) and w-64 (expanded, icons + labels)
 * - Responsive (auto-collapse on tablet, hidden on mobile with overlay)
 * - Persists collapse state in localStorage with key 'sidebar-collapsed'
 * - CSS-only tooltips on hover when collapsed
 * - No layout flash on page load (inline script sets initial class)
 * - Provides SidebarContext to children
 * - Accessible with ARIA attributes and keyboard navigation
 */
export function SidebarNavigation({
  defaultCollapsed = false,
  onNavigate,
  collapseBreakpoint = 768,
  className = '',
}: SidebarNavigationProps) {
  const sidebarRef = useRef<HTMLElement>(null);
  const [announcement, setAnnouncement] = useState('');

  const {
    isCollapsed,
    isHidden,
    isMobileOpen,
    toggle,
    expand,
    collapse,
    openMobile,
    closeMobile,
  } = useSidebarResponsive({ defaultCollapsed, collapseBreakpoint });

  // Announce collapse/expand state changes to screen readers
  useEffect(() => {
    setAnnouncement(isCollapsed ? 'Sidebar collapsed' : 'Sidebar expanded');
  }, [isCollapsed]);

  // Remove the flash-prevention class once React has mounted and taken over
  useEffect(() => {
    document.documentElement.classList.remove('sidebar-initially-collapsed');
  }, []);

  // Keyboard shortcut: [ or ] to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === '[' || e.key === ']') &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        toggle();
      }
      // Escape closes mobile overlay
      if (e.key === 'Escape' && isMobileOpen) {
        closeMobile();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle, isMobileOpen, closeMobile]);

  // Focus trap for mobile overlay
  useEffect(() => {
    if (!isMobileOpen || !sidebarRef.current) return;

    const sidebar = sidebarRef.current;
    const focusableElements = sidebar.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleTabTrap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    sidebar.addEventListener('keydown', handleTabTrap);
    firstFocusable?.focus();

    return () => sidebar.removeEventListener('keydown', handleTabTrap);
  }, [isMobileOpen]);

  // Quick actions configuration
  const quickActions: QuickAction[] = [
    {
      id: 'new-workflow',
      icon: Plus,
      label: 'New Workflow',
      onClick: () => onNavigate('/workflows/new'),
      variant: 'primary',
    },
    {
      id: 'view-logs',
      icon: ScrollText,
      label: 'View Logs',
      onClick: () => onNavigate('/logs'),
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Settings',
      onClick: () => onNavigate('/settings'),
    },
  ];

  const contextValue = {
    isCollapsed,
    isHidden,
    isMobileOpen,
    toggle,
    expand,
    collapse,
    openMobile,
    closeMobile,
  };

  const sidebarClasses = [
    'sidebar',
    isCollapsed && 'sidebar--collapsed',
    isHidden && 'sidebar--hidden',
    isMobileOpen && 'sidebar--mobile-open',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <SidebarContext.Provider value={contextValue}>
      {/* Mobile backdrop */}
      {isHidden && isMobileOpen && (
        <div
          className="sidebar-backdrop sidebar-backdrop--visible"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        id="sidebar-navigation"
        className={sidebarClasses}
        role="navigation"
        aria-label="Sidebar navigation"
        aria-expanded={!isCollapsed}
      >
        <SidebarHeader />

        <div className="sidebar__content">
          <AgentStatusPanel
            onAgentClick={(agent) => onNavigate(`/agents/${agent.id}`)}
          />

          <div className="sidebar__divider" role="separator" />

          <WorkflowHistoryList
            onWorkflowClick={(workflow) =>
              onNavigate(`/workflows/${workflow.id}`)
            }
          />
        </div>

        <QuickActions actions={quickActions} />
      </aside>

      {/* Screen reader live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
    </SidebarContext.Provider>
  );
}
