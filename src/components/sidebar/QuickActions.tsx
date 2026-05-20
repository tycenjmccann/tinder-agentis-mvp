import React from 'react';
import { useSidebarContext } from './SidebarContext';
import { SidebarTooltip } from './SidebarTooltip';
import type { QuickActionsProps } from './sidebar.types';
import './QuickActions.css';

/**
 * QuickActions - Bottom-pinned action buttons.
 *
 * Expanded: icon + label buttons.
 * Collapsed: icon-only with tooltip.
 * Keyboard accessible with proper ARIA labels.
 */
export function QuickActions({ actions }: QuickActionsProps) {
  const { isCollapsed } = useSidebarContext();

  return (
    <div className="quick-actions" role="group" aria-label="Quick actions">
      {actions.map((action) => {
        const Icon = action.icon;
        const button = (
          <button
            key={action.id}
            className={`quick-action-btn ${
              action.variant === 'primary' ? 'quick-action-btn--primary' : ''
            }`}
            onClick={action.onClick}
            disabled={action.disabled}
            aria-label={action.label}
            type="button"
          >
            <Icon size={20} aria-hidden="true" className="quick-action-btn__icon" />
            <span className="quick-action-btn__label sidebar__content-label">
              {action.label}
            </span>
          </button>
        );

        if (isCollapsed) {
          return (
            <SidebarTooltip key={action.id} content={action.label}>
              {button}
            </SidebarTooltip>
          );
        }

        return <React.Fragment key={action.id}>{button}</React.Fragment>;
      })}
    </div>
  );
}
