import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  LayoutDashboard,
  Workflow,
  Bot,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useSidebarCollapse } from './useSidebarCollapse';
import './Sidebar.css';

export interface NavItem {
  id: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  route: string;
}

export interface SidebarProps {
  onNavigate: (route: string) => void;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', route: '/' },
  { id: 'workflows', icon: Workflow, label: 'Workflows', route: '/workflows' },
  { id: 'agents', icon: Bot, label: 'Agents', route: '/agents' },
  { id: 'logs', icon: ScrollText, label: 'Logs', route: '/logs' },
  { id: 'settings', icon: Settings, label: 'Settings', route: '/settings' },
];

/**
 * Sidebar - Collapsible sidebar navigation component.
 *
 * Features:
 * - Toggle between w-16 collapsed (icons only) and w-64 expanded (full labels)
 * - 300ms CSS transition
 * - localStorage persistence with key 'sidebar-collapsed'
 * - CSS-only tooltips on hover in collapsed mode
 * - No layout flash on page load
 * - aria-label on toggle button
 * - aria-expanded on sidebar container
 */
export function Sidebar({ onNavigate }: SidebarProps) {
  const { isCollapsed, toggle } = useSidebarCollapse();
  const sidebarRef = useRef<HTMLElement>(null);
  const [announcement, setAnnouncement] = useState('');

  // Keep html class in sync for CSS-based layout (flash prevention fallback)
  useEffect(() => {
    if (isCollapsed) {
      document.documentElement.classList.add('sidebar-collapsed');
    } else {
      document.documentElement.classList.remove('sidebar-collapsed');
    }
  }, [isCollapsed]);

  // Announce state changes to screen readers
  useEffect(() => {
    setAnnouncement(isCollapsed ? 'Sidebar collapsed' : 'Sidebar expanded');
  }, [isCollapsed]);

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
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  const handleNavClick = useCallback(
    (route: string) => {
      onNavigate(route);
    },
    [onNavigate]
  );

  const sidebarClasses = [
    'sidebar',
    isCollapsed ? 'sidebar--collapsed' : 'sidebar--expanded',
  ].join(' ');

  return (
    <>
      <aside
        ref={sidebarRef}
        className={sidebarClasses}
        aria-expanded={!isCollapsed}
        aria-label="Sidebar navigation"
        data-testid="sidebar"
      >
        {/* Header */}
        <div className="sidebar__header">
          <div className="sidebar__brand">
            <Zap size={24} className="sidebar__brand-icon" aria-hidden="true" />
            <span className="sidebar__brand-text">
              Agentis
            </span>
          </div>
          <button
            className="sidebar__toggle"
            onClick={toggle}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            data-testid="sidebar-toggle"
            type="button"
          >
            {isCollapsed ? (
              <ChevronRight size={16} aria-hidden="true" />
            ) : (
              <ChevronLeft size={16} aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar__nav" aria-label="Main navigation">
          <ul className="sidebar__nav-list">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.id}
                  className="sidebar__nav-item"
                  data-tooltip={item.label}
                >
                  <button
                    className="sidebar__nav-link"
                    onClick={() => handleNavClick(item.route)}
                    aria-label={isCollapsed ? item.label : undefined}
                    type="button"
                  >
                    <Icon
                      size={20}
                      className="sidebar__nav-icon"
                      aria-hidden="true"
                    />
                    <span className="sidebar__nav-label">
                      {item.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Screen reader live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
    </>
  );
}
