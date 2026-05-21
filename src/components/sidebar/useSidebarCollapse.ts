import { useState, useCallback } from 'react';

const STORAGE_KEY = 'sidebar-collapsed';

/**
 * Read the persisted sidebar collapse state synchronously.
 * This matches the inline script in index.html that prevents layout flash.
 */
function getInitialCollapsed(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  } catch {
    return false; // Default: expanded
  }
}

/**
 * Custom hook for sidebar collapse state management.
 *
 * - Persists state to localStorage with key 'sidebar-collapsed'
 * - Initial state read synchronously to prevent flash
 * - Returns isCollapsed boolean and toggle/expand/collapse functions
 */
export function useSidebarCollapse() {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(getInitialCollapsed);

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

  const expand = useCallback(() => {
    setIsCollapsed(false);
    try {
      localStorage.setItem(STORAGE_KEY, 'false');
    } catch {}
  }, []);

  const collapse = useCallback(() => {
    setIsCollapsed(true);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {}
  }, []);

  return { isCollapsed, toggle, expand, collapse };
}
