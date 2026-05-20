import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSidebarResponsive, useDebounce, usePageVisibility } from '../useSidebarResponsive';

describe('useSidebarResponsive', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset matchMedia mock to desktop
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
  });

  it('should start expanded by default', () => {
    const { result } = renderHook(() => useSidebarResponsive());
    expect(result.current.isCollapsed).toBe(false);
  });

  it('should start collapsed when defaultCollapsed is true', () => {
    const { result } = renderHook(() =>
      useSidebarResponsive({ defaultCollapsed: true })
    );
    expect(result.current.isCollapsed).toBe(true);
  });

  it('should toggle collapse state', () => {
    const { result } = renderHook(() => useSidebarResponsive());

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isCollapsed).toBe(true);

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isCollapsed).toBe(false);
  });

  it('should expand sidebar', () => {
    const { result } = renderHook(() =>
      useSidebarResponsive({ defaultCollapsed: true })
    );

    act(() => {
      result.current.expand();
    });
    expect(result.current.isCollapsed).toBe(false);
  });

  it('should collapse sidebar', () => {
    const { result } = renderHook(() => useSidebarResponsive());

    act(() => {
      result.current.collapse();
    });
    expect(result.current.isCollapsed).toBe(true);
  });

  it('should persist collapse state in localStorage', () => {
    const { result } = renderHook(() => useSidebarResponsive());

    act(() => {
      result.current.collapse();
    });

    expect(localStorage.getItem('sidebar_collapsed')).toBe('true');

    act(() => {
      result.current.expand();
    });

    expect(localStorage.getItem('sidebar_collapsed')).toBe('false');
  });

  it('should restore collapse state from localStorage', () => {
    localStorage.setItem('sidebar_collapsed', 'true');

    const { result } = renderHook(() => useSidebarResponsive());
    expect(result.current.isCollapsed).toBe(true);
  });

  it('should handle mobile open/close', () => {
    const { result } = renderHook(() => useSidebarResponsive());

    expect(result.current.isMobileOpen).toBe(false);

    act(() => {
      result.current.openMobile();
    });
    expect(result.current.isMobileOpen).toBe(true);

    act(() => {
      result.current.closeMobile();
    });
    expect(result.current.isMobileOpen).toBe(false);
  });

  it('should validate localStorage values on read', () => {
    // Tampered value - not a valid boolean
    localStorage.setItem('sidebar_collapsed', '"malicious"');

    const { result } = renderHook(() => useSidebarResponsive());
    // Should fallback to default
    expect(result.current.isCollapsed).toBe(false);
  });

  it('should handle localStorage errors gracefully', () => {
    // Simulate localStorage being unavailable
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = () => {
      throw new Error('QuotaExceededError');
    };

    const { result } = renderHook(() => useSidebarResponsive());

    // Should not throw
    act(() => {
      result.current.toggle();
    });

    localStorage.setItem = originalSetItem;
  });
});

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'hello', delay: 300 } }
    );

    rerender({ value: 'world', delay: 300 });
    expect(result.current).toBe('hello'); // Not yet updated

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('world'); // Now updated
  });

  it('should reset debounce timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 300 } }
    );

    rerender({ value: 'ab', delay: 300 });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ value: 'abc', delay: 300 });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ value: 'abcd', delay: 300 });
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe('a'); // Still original

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('abcd'); // Final value
  });
});

describe('usePageVisibility', () => {
  it('should return true when document is visible', () => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    });

    const { result } = renderHook(() => usePageVisibility());
    expect(result.current).toBe(true);
  });

  it('should update when visibility changes', () => {
    let hidden = false;
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => hidden,
    });

    const { result } = renderHook(() => usePageVisibility());
    expect(result.current).toBe(true);

    hidden = true;
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(result.current).toBe(false);
  });
});

// Import the afterEach from vitest for the useDebounce test
import { afterEach } from 'vitest';
