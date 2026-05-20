import React, { useState, useRef, useCallback } from 'react';
import './SidebarTooltip.css';

interface SidebarTooltipProps {
  content: string;
  children: React.ReactElement;
}

/**
 * SidebarTooltip - Tooltip displayed on hover/focus for collapsed sidebar items.
 *
 * Positioned to the right of the sidebar.
 * Uses role="tooltip" with aria-describedby for accessibility.
 * Content is always rendered as text (XSS-safe).
 */
export function SidebarTooltip({ content, children }: SidebarTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = useRef(
    `tooltip-${Math.random().toString(36).slice(2, 9)}`
  ).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = useCallback(() => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), 200);
  }, []);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  }, []);

  return (
    <div
      className="sidebar-tooltip-wrapper"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {React.cloneElement(children, {
        'aria-describedby': isVisible ? tooltipId : undefined,
      })}
      <div
        id={tooltipId}
        className={`sidebar-tooltip ${
          isVisible ? 'sidebar-tooltip--visible' : ''
        }`}
        role="tooltip"
        aria-hidden={!isVisible}
      >
        {content}
      </div>
    </div>
  );
}
