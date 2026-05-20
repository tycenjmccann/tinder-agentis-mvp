import { useState, useEffect, useCallback, useRef } from 'react';
import { useMediaQuery, useLocalStorage } from '../../hooks/useMediaQuery';

const STORAGE_KEY = 'sidebar_collapsed';

interface UseSidebarResponsiveOptions {
  defaultCollapsed?: boolean;
  collapseBreakpoint?: number;
}

interface UseSidebarResponsiveReturn {
  isCollapsed: boolean;
  isHidden: boolean;
  isMobileOpen: boolean;
  toggle: () => void;
  expand: () => void;
  collapse: () => void;
  openMobile: () => void;
  closeMobile: () => void;
}

/**
 * Hook managing sidebar responsive behavior:
 * - Auto-collapse at tablet breakpoint
 * - Hidden on mobile with overlay mode
 * - Persist collapse state in localStorage
 * - Page Visibility API integration for polling control
 */
export function useSidebarResponsive(
  options: UseSidebarResponsiveOptions = {}
): UseSidebarResponsiveReturn {
  const { defaultCollapsed = false, collapseBreakpoint = 768 } = options;

  const [persistedCollapsed, setPersistedCollapsed] = useLocalStorage<boolean>(
    STORAGE_KEY,
    defaultCollapsed
  );

  const [isCollapsed, setIsCollapsed] = useState(persistedCollapsed);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isMobile = useMediaQuery(`(max-width: 639px)`);
  const isTablet = useMediaQuery(
    `(min-width: 640px) and (max-width: ${collapseBreakpoint}px)`
  );

  const isHidden = isMobile;

  // Auto-collapse on tablet
  useEffect(() => {
    if (isTablet) {
      setIsCollapsed(true);
    }
  }, [isTablet]);

  // Close mobile overlay when resizing to desktop
  useEffect(() => {
    if (!isMobile) {
      setIsMobileOpen(false);
    }
  }, [isMobile]);

  const toggle = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      setPersistedCollapsed(next);
      return next;
    });
  }, [setPersistedCollapsed]);

  const expand = useCallback(() => {
    setIsCollapsed(false);
    setPersistedCollapsed(false);
  }, [setPersistedCollapsed]);

  const collapse = useCallback(() => {
    setIsCollapsed(true);
    setPersistedCollapsed(true);
  }, [setPersistedCollapsed]);

  const openMobile = useCallback(() => {
    setIsMobileOpen(true);
  }, []);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  return {
    isCollapsed: isHidden ? false : isCollapsed,
    isHidden,
    isMobileOpen,
    toggle,
    expand,
    collapse,
    openMobile,
    closeMobile,
  };
}

/**
 * Hook for debouncing a value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook that tracks page visibility for stopping polling when hidden
 */
export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}
