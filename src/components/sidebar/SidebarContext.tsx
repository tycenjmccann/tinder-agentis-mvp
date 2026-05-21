import { createContext, useContext } from 'react';

export interface SidebarContextValue {
  isCollapsed: boolean;
  isHidden: boolean;
  isMobileOpen: boolean;
  toggle: () => void;
  expand: () => void;
  collapse: () => void;
  openMobile: () => void;
  closeMobile: () => void;
}

export const SidebarContext = createContext<SidebarContextValue>({
  isCollapsed: false,
  isHidden: false,
  isMobileOpen: false,
  toggle: () => {},
  expand: () => {},
  collapse: () => {},
  openMobile: () => {},
  closeMobile: () => {},
});

export function useSidebarContext(): SidebarContextValue {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebarContext must be used within SidebarNavigation');
  }
  return context;
}
