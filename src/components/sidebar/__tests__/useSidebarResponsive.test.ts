import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

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
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock matchMedia
const createMatchMedia = (matches: boolean) => (query: string) => ({
  matches,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

describe('useSidebarResponsive', () => {
  beforeEach(() => {
    localStorageMock.clear();
    window.matchMedia = createMatchMedia(false) as any;
  });

  it('starts expanded by default', async () => {
    const { useSidebarResponsive } = await import('../useSidebarResponsive');
    const { result } = renderHook(() => useSidebarResponsive());
    expect(result.current.isCollapsed).toBe(false);
  });

  it('starts collapsed when defaultCollapsed is true', async () => {
    const { useSidebarResponsive } = await import('../useSidebarResponsive');
    const { result } = renderHook(() =>
      useSidebarResponsive({ defaultCollapsed: true })
    );
    expect(result.current.isCollapsed).toBe(true);
  });

  it('toggles collapse state', async () => {
    const { useSidebarResponsive } = await import('../useSidebarResponsive');
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

  it('persists collapse state to localStorage', async () => {
    const { useSidebarResponsive } = await import('../useSidebarResponsive');
    const { result } = renderHook(() => useSidebarResponsive());

    act(() => {
      result.current.collapse();
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'sidebar_collapsed',
      'true'
    );
  });

  it('expand() sets collapsed to false', async () => {
    const { useSidebarResponsive } = await import('../useSidebarResponsive');
    const { result } = renderHook(() =>
      useSidebarResponsive({ defaultCollapsed: true })
    );

    act(() => {
      result.current.expand();
    });
    expect(result.current.isCollapsed).toBe(false);
  });

  it('collapse() sets collapsed to true', async () => {
    const { useSidebarResponsive } = await import('../useSidebarResponsive');
    const { result } = renderHook(() => useSidebarResponsive());

    act(() => {
      result.current.collapse();
    });
    expect(result.current.isCollapsed).toBe(true);
  });
});

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('debounces value changes', async () => {
    const { useDebounce } = await import('../useSidebarResponsive');
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated', delay: 300 });
    expect(result.current).toBe('initial'); // not yet updated

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('updated'); // now updated
  });

  it('cancels previous timeout on rapid changes', async () => {
    const { useDebounce } = await import('../useSidebarResponsive');
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 300 } }
    );

    rerender({ value: 'b', delay: 300 });
    act(() => { vi.advanceTimersByTime(100); });

    rerender({ value: 'c', delay: 300 });
    act(() => { vi.advanceTimersByTime(300); });

    expect(result.current).toBe('c');
  });
});
