import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSidebarResponsive, useDebounce, usePageVisibility } from '../useSidebarResponsive';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock matchMedia
let mediaQueryListeners: Record<string, ((e: MediaQueryListEvent) => void)[]> = {};
let mediaQueryMatches: Record<string, boolean> = {};

window.matchMedia = vi.fn((query: string) => ({
  matches: mediaQueryMatches[query] ?? false,
  media: query,
  addEventListener: vi.fn((event: string, handler: any) => {
    if (!mediaQueryListeners[query]) mediaQueryListeners[query] = [];
    mediaQueryListeners[query].push(handler);
  }),
  removeEventListener: vi.fn((event: string, handler: any) => {
    if (mediaQueryListeners[query]) {
      mediaQueryListeners[query] = mediaQueryListeners[query].filter(h => h !== handler);
    }
  }),
  dispatchEvent: vi.fn(),
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
})) as any;

describe('useSidebarResponsive', () => {
  beforeEach(() => {
    localStorageMock.clear();
    mediaQueryListeners = {};
    mediaQueryMatches = {};
  });

  it('returns default collapsed state as false', () => {
    const { result } = renderHook(() => useSidebarResponsive());
    expect(result.current.isCollapsed).toBe(false);
  });

  it('respects defaultCollapsed option', () => {
    const { result } = renderHook(() =>
      useSidebarResponsive({ defaultCollapsed: true })
    );
    expect(result.current.isCollapsed).toBe(true);
  });

  it('toggles collapse state', () => {
    const { result } = renderHook(() => useSidebarResponsive());

    act(() => result.current.toggle());
    expect(result.current.isCollapsed).toBe(true);

    act(() => result.current.toggle());
    expect(result.current.isCollapsed).toBe(false);
  });

  it('expand and collapse work correctly', () => {
    const { result } = renderHook(() => useSidebarResponsive());

    act(() => result.current.collapse());
    expect(result.current.isCollapsed).toBe(true);

    act(() => result.current.expand());
    expect(result.current.isCollapsed).toBe(false);
  });

  it('persists collapse state to localStorage', () => {
    const { result } = renderHook(() => useSidebarResponsive());

    act(() => result.current.collapse());
    expect(localStorageMock.getItem('sidebar_collapsed')).toBe('true');

    act(() => result.current.expand());
    expect(localStorageMock.getItem('sidebar_collapsed')).toBe('false');
  });

  it('reads persisted state from localStorage on mount', () => {
    localStorageMock.setItem('sidebar_collapsed', 'true');

    const { result } = renderHook(() => useSidebarResponsive());
    expect(result.current.isCollapsed).toBe(true);
  });

  it('validates localStorage values (rejects invalid data)', () => {
    localStorageMock.setItem('sidebar_collapsed', '"not-a-boolean"');

    const { result } = renderHook(() => useSidebarResponsive());
    expect(result.current.isCollapsed).toBe(false); // falls back to default
  });

  it('manages mobile state correctly', () => {
    const { result } = renderHook(() => useSidebarResponsive());

    expect(result.current.isMobileOpen).toBe(false);

    act(() => result.current.openMobile());
    expect(result.current.isMobileOpen).toBe(true);

    act(() => result.current.closeMobile());
    expect(result.current.isMobileOpen).toBe(false);
  });

  it('identifies hidden state on mobile viewport', () => {
    mediaQueryMatches['(max-width: 639px)'] = true;

    const { result } = renderHook(() => useSidebarResponsive());
    expect(result.current.isHidden).toBe(true);
  });
});

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('debounces value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'hello', delay: 300 } }
    );

    rerender({ value: 'world', delay: 300 });
    expect(result.current).toBe('hello'); // not yet updated

    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe('world'); // updated after delay
  });

  it('resets timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 300 } }
    );

    rerender({ value: 'ab', delay: 300 });
    act(() => { vi.advanceTimersByTime(100); });

    rerender({ value: 'abc', delay: 300 });
    act(() => { vi.advanceTimersByTime(100); });

    rerender({ value: 'abcd', delay: 300 });
    act(() => { vi.advanceTimersByTime(300); });

    expect(result.current).toBe('abcd');
  });
});

describe('usePageVisibility', () => {
  it('returns true when document is visible', () => {
    Object.defineProperty(document, 'hidden', { value: false, writable: true });
    const { result } = renderHook(() => usePageVisibility());
    expect(result.current).toBe(true);
  });

  it('returns false when document is hidden', () => {
    Object.defineProperty(document, 'hidden', { value: true, writable: true });
    const { result } = renderHook(() => usePageVisibility());
    expect(result.current).toBe(false);
  });
});
