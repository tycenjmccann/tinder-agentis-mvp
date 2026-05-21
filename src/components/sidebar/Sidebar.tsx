import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Users,
  GitBranch,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bot,
} from 'lucide-react';
import './Sidebar.css';

const STORAGE_KEY = 'sidebar-collapsed';

interface NavItem {
  id: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  route: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', route: '/' },
  { id: 'agents', icon: Users, label: 'Agents', route: '/agents' },
  { id: 'workflows', icon: GitBranch, label: 'Workflows', route: '/workflows' },
  { id: 'logs', icon: ScrollText, label: 'Logs', route: '/logs' },
  { id: 'settings', icon: Settings, label: 'Settings', route: '/settings' },
];

interface SidebarProps {
  onNavigate: (route: string) => void;
}

/**
 * Sidebar - Collapsible sidebar navigation component.
 *
 * Features:
 * - Toggle between w-16 collapsed (icons only) and w-64 expanded (full labels)
 * - 300ms CSS transition on width
 * - localStorage persistence with key 'sidebar-collapsed'
 * - CSS-only tooltips on hover in collapsed mode
 * - No layout flash on page load (inline script sets class on <html>)
 * - Accessible with aria-label on toggle, aria-expanded on container
 */
export function Sidebar({ onNavigate }: SidebarProps) {
  // Initialize from localStorage synchronously to avoid flash
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Sync the <html> class for flash prevention CSS
  useEffect(() => {
    if (isCollapsed) {
      document.documentElement.classList.add('sidebar-is-collapsed');
    } else {
      document.documentElement.classList.remove('sidebar-is-collapsed');
    }
  }, [isCollapsed]);

  const toggle = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // localStorage unavailable — graceful degradation
      }
      return next;
    });
  }, []);

  const sidebarClasses = [
    'sidebar',
    isCollapsed ? 'sidebar--collapsed' : 'sidebar--expanded',
  ].join(' ');

  return (
    <aside
      className={sidebarClasses}
      aria-expanded={!isCollapsed}
      aria-label="Sidebar navigation"
      data-testid="sidebar"
    >
      {/* Header with brand and toggle */}
      <div className="sidebar__header">
        <div className="sidebar__brand">
          <Bot size={24} className="sidebar__brand-icon" aria-hidden="true" />
          <span className="sidebar__brand-text">
            Agentis Hub
          </span>
        </div>
        <button
          className="sidebar__toggle"
          onClick={toggle}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          type="button"
          data-testid="sidebar-toggle"
        >
          {isCollapsed ? (
            <ChevronRight size={16} aria-hidden="true" />
          ) : (
            <ChevronLeft size={16} aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Navigation items */}
      <nav className="sidebar__nav" aria-label="Main navigation">
        <ul className="sidebar__nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id} className="sidebar__nav-item">
                <button
                  className="sidebar__nav-link"
                  onClick={() => onNavigate(item.route)}
                  type="button"
                  data-tooltip={item.label}
                  aria-label={isCollapsed ? item.label : undefined}
                >
                  <Icon size={20} className="sidebar__nav-icon" aria-hidden="true" />
                  <span className="sidebar__nav-label">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
