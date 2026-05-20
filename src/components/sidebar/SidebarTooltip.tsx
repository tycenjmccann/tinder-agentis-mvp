import React, { useState, useRef, useCallback, useId } from 'react';
import { useSidebarContext } from './SidebarContext';
import './SidebarTooltip.css';

interface SidebarTooltipProps {
  content: string;
  children: React.ReactElement;
  /** Force show tooltip regardless of sidebar state */
  forceShow?: boolean;
}

/**
 * SidebarTooltip - Shows tooltip on hover in collapsed sidebar mode.
 *
 * Only appears when sidebar is collapsed (unless forceShow).
 * Uses text content only (no innerHTML) for XSS safety.
 * Connected via aria-describedby for screen readers.
 */
export function SidebarTooltip({
  content,
  children,
  forceShow = false,
}: SidebarTooltipProps) {
  const { isCollapsed } = useSidebarContext();
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = useId();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = useCallback(() => {
    if (!isCollapsed && !forceShow) return;
    timeoutRef.current = setTimeout(() => setIsVisible(true), 100);
  }, [isCollapsed, forceShow]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  }, []);

  const shouldRender = (isCollapsed || forceShow) && isVisible;

  return (
    <div
      className="sidebar-tooltip-wrapper"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {React.cloneElement(children, {
        'aria-describedby': isCollapsed || forceShow ? tooltipId : undefined,
      })}
      {shouldRender && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`sidebar-tooltip ${shouldRender ? 'sidebar-tooltip--visible' : ''}`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
