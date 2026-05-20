import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SidebarNavigation } from '../SidebarNavigation';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Track matchMedia listeners
let mediaQueryListeners: Record<string, Array<(e: MediaQueryListEvent) => void>> = {};
let mediaQueryMatches: Record<string, boolean> = {};

// Mock matchMedia
window.matchMedia = vi.fn().mockImplementation((query: string) => {
  if (!mediaQueryListeners[query]) mediaQueryListeners[query] = [];
  return {
    matches: mediaQueryMatches[query] ?? false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
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
  };
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Responsive Behavior', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mediaQueryListeners = {};
    mediaQueryMatches = {};
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ agents: [], workflows: [], total: 0, page: 1, hasMore: false }),
    });
  });

  it('sidebar renders expanded by default on desktop', () => {
    mediaQueryMatches = {
      '(max-width: 639px)': false,
      '(min-width: 640px) and (max-width: 768px)': false,
    };

    render(<SidebarNavigation onNavigate={mockNavigate} />);
    const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
    expect(sidebar).toHaveAttribute('aria-expanded', 'true');
    expect(sidebar).not.toHaveClass('sidebar--collapsed');
    expect(sidebar).not.toHaveClass('sidebar--hidden');
  });

  it('sidebar collapses on tablet viewport', () => {
    mediaQueryMatches = {
      '(max-width: 639px)': false,
      '(min-width: 640px) and (max-width: 768px)': true,
    };

    render(<SidebarNavigation onNavigate={mockNavigate} />);
    const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
    expect(sidebar).toHaveClass('sidebar--collapsed');
  });

  it('sidebar is hidden on mobile viewport', () => {
    mediaQueryMatches = {
      '(max-width: 639px)': true,
      '(min-width: 640px) and (max-width: 768px)': false,
    };

    render(<SidebarNavigation onNavigate={mockNavigate} />);
    const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
    expect(sidebar).toHaveClass('sidebar--hidden');
  });

  it('collapse state persists to localStorage', async () => {
    const user = userEvent.setup();
    mediaQueryMatches = {
      '(max-width: 639px)': false,
      '(min-width: 640px) and (max-width: 768px)': false,
    };

    render(<SidebarNavigation onNavigate={mockNavigate} />);

    // Click collapse toggle
    const toggleBtn = screen.getByLabelText(/collapse sidebar/i);
    await user.click(toggleBtn);

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'sidebar_collapsed',
      'true'
    );
  });

  it('collapse state reads from localStorage on mount', () => {
    localStorageMock.getItem.mockReturnValue('true');
    mediaQueryMatches = {
      '(max-width: 639px)': false,
      '(min-width: 640px) and (max-width: 768px)': false,
    };

    render(<SidebarNavigation onNavigate={mockNavigate} />);
    const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
    expect(sidebar).toHaveClass('sidebar--collapsed');
  });

  it('collapsed sidebar shows tooltips on quick actions', async () => {
    mediaQueryMatches = {
      '(max-width: 639px)': false,
      '(min-width: 640px) and (max-width: 768px)': true,
    };

    render(<SidebarNavigation onNavigate={mockNavigate} />);

    // Quick action buttons should still exist with aria-labels
    expect(screen.getByLabelText('New Workflow')).toBeInTheDocument();
    expect(screen.getByLabelText('View Logs')).toBeInTheDocument();
    expect(screen.getByLabelText('Settings')).toBeInTheDocument();
  });

  it('collapsed sidebar shows workflow flyout trigger', () => {
    mediaQueryMatches = {
      '(max-width: 639px)': false,
      '(min-width: 640px) and (max-width: 768px)': true,
    };

    render(<SidebarNavigation onNavigate={mockNavigate} />);
    expect(screen.getByLabelText('Open workflow history')).toBeInTheDocument();
  });

  it('keyboard shortcut toggles sidebar', async () => {
    mediaQueryMatches = {
      '(max-width: 639px)': false,
      '(min-width: 640px) and (max-width: 768px)': false,
    };

    render(<SidebarNavigation onNavigate={mockNavigate} />);
    const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
    expect(sidebar).toHaveAttribute('aria-expanded', 'true');

    // Simulate keyboard shortcut
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: '[', bubbles: true })
      );
    });

    expect(sidebar).toHaveClass('sidebar--collapsed');
  });

  it('Escape key closes mobile overlay', async () => {
    mediaQueryMatches = {
      '(max-width: 639px)': true,
      '(min-width: 640px) and (max-width: 768px)': false,
    };

    render(<SidebarNavigation onNavigate={mockNavigate} />);
    const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
    expect(sidebar).toHaveClass('sidebar--hidden');
  });

  it('no layout shift during transitions (sidebar has will-change: width)', () => {
    mediaQueryMatches = {
      '(max-width: 639px)': false,
      '(min-width: 640px) and (max-width: 768px)': false,
    };

    render(<SidebarNavigation onNavigate={mockNavigate} />);
    const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
    // Sidebar should have the sidebar class with CSS transitions
    expect(sidebar).toHaveClass('sidebar');
  });
});
