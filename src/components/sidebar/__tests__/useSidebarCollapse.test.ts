import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSidebarCollapse } from '../useSidebarCollapse';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('useSidebarCollapse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it('should default to expanded (isCollapsed = false) when no localStorage', () => {
    const { result } = renderHook(() => useSidebarCollapse());
    expect(result.current.isCollapsed).toBe(false);
  });

  it('should read initial state from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('true');
    const { result } = renderHook(() => useSidebarCollapse());
    expect(result.current.isCollapsed).toBe(true);
  });

  it('should toggle from expanded to collapsed', () => {
    const { result } = renderHook(() => useSidebarCollapse());

    act(() => {
      result.current.toggle();
    });

    expect(result.current.isCollapsed).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('sidebar-collapsed', 'true');
  });

  it('should toggle from collapsed to expanded', () => {
    localStorageMock.getItem.mockReturnValue('true');
    const { result } = renderHook(() => useSidebarCollapse());

    act(() => {
      result.current.toggle();
    });

    expect(result.current.isCollapsed).toBe(false);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('sidebar-collapsed', 'false');
  });

  it('should expand via expand()', () => {
    localStorageMock.getItem.mockReturnValue('true');
    const { result } = renderHook(() => useSidebarCollapse());

    act(() => {
      result.current.expand();
    });

    expect(result.current.isCollapsed).toBe(false);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('sidebar-collapsed', 'false');
  });

  it('should collapse via collapse()', () => {
    const { result } = renderHook(() => useSidebarCollapse());

    act(() => {
      result.current.collapse();
    });

    expect(result.current.isCollapsed).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('sidebar-collapsed', 'true');
  });

  it('should handle localStorage errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage disabled');
    });

    const { result } = renderHook(() => useSidebarCollapse());
    expect(result.current.isCollapsed).toBe(false); // Falls back to default
  });

  it('should handle localStorage setItem errors gracefully', () => {
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('localStorage full');
    });

    const { result } = renderHook(() => useSidebarCollapse());

    // Should not throw
    act(() => {
      result.current.toggle();
    });

    expect(result.current.isCollapsed).toBe(true);
  });
});
