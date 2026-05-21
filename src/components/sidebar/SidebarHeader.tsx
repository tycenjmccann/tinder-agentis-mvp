import React from 'react';
import { PanelLeftClose, PanelLeftOpen, Bot } from 'lucide-react';
import { useSidebarContext } from './SidebarContext';
import './SidebarHeader.css';

/**
 * SidebarHeader - Brand mark and collapse toggle.
 *
 * Shows logo + wordmark in expanded mode.
 * Shows only logo icon in collapsed mode.
 * Toggle button with accessible aria-label that updates dynamically.
 */
export function SidebarHeader() {
  const { isCollapsed, toggle } = useSidebarContext();

  return (
    <div className="sidebar-header">
      <div className="sidebar-header__brand">
        <Bot size={24} className="sidebar-header__brand-icon" aria-hidden="true" />
        <span className="sidebar-header__brand-text sidebar__content-label">
          Agentis Hub
        </span>
      </div>
      <button
        className="collapse-toggle"
        onClick={toggle}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-controls="sidebar-navigation"
        aria-expanded={!isCollapsed}
        type="button"
      >
        {isCollapsed ? (
          <PanelLeftOpen size={16} aria-hidden="true" />
        ) : (
          <PanelLeftClose size={16} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
