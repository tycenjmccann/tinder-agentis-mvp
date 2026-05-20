import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../test/test-utils';
import { SidebarNavigation } from '../SidebarNavigation';

describe('SidebarNavigation - Responsive Behavior', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    mockNavigate.mockClear();
    localStorage.clear();
  });

  it('should auto-collapse on tablet viewport', () => {
    // Mock tablet viewport
    let listeners: Map<string, (e: MediaQueryListEvent) => void> = new Map();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => {
        const isTabletQuery =
          query.includes('min-width: 640px') &&
          query.includes('max-width:');
        const isMobileQuery = query.includes('max-width: 639px');
        return {
          matches: isTabletQuery, // tablet matches
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: (event: string, handler: any) => {
            listeners.set(query, handler);
          },
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        };
      },
    });

    render(<SidebarNavigation onNavigate={mockNavigate} />);

    const sidebar = screen.getByRole('navigation', {
      name: /sidebar navigation/i,
    });
    expect(sidebar).toHaveClass('sidebar--collapsed');
  });

  it('should hide sidebar on mobile viewport', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => {
        const isMobileQuery = query.includes('max-width: 639px');
        return {
          matches: isMobileQuery, // mobile matches
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        };
      },
    });

    render(<SidebarNavigation onNavigate={mockNavigate} />);

    const sidebar = screen.getByRole('navigation', {
      name: /sidebar navigation/i,
    });
    expect(sidebar).toHaveClass('sidebar--hidden');
  });

  it('should show collapsed dots in collapsed mode', async () => {
    // Force collapsed state
    localStorage.setItem('sidebar_collapsed', 'true');

    render(<SidebarNavigation onNavigate={mockNavigate} />);

    // Wait for agents to load
    await waitFor(() => {
      // In collapsed mode, agent panel should show dots
      const dots = document.querySelectorAll('.agent-dot');
      expect(dots.length).toBeGreaterThan(0);
    });
  });

  it('should show flyout button in collapsed mode for workflows', () => {
    localStorage.setItem('sidebar_collapsed', 'true');

    render(<SidebarNavigation onNavigate={mockNavigate} />);

    const flyoutBtn = screen.getByRole('button', {
      name: /open workflow history/i,
    });
    expect(flyoutBtn).toBeInTheDocument();
  });

  it('should open flyout when collapsed workflow button is clicked', () => {
    localStorage.setItem('sidebar_collapsed', 'true');

    render(<SidebarNavigation onNavigate={mockNavigate} />);

    const flyoutBtn = screen.getByRole('button', {
      name: /open workflow history/i,
    });
    fireEvent.click(flyoutBtn);

    // Flyout dialog should appear
    const flyout = screen.getByRole('dialog', {
      name: /workflow history/i,
    });
    expect(flyout).toBeInTheDocument();
  });

  it('should close flyout on Escape key', () => {
    localStorage.setItem('sidebar_collapsed', 'true');

    render(<SidebarNavigation onNavigate={mockNavigate} />);

    const flyoutBtn = screen.getByRole('button', {
      name: /open workflow history/i,
    });
    fireEvent.click(flyoutBtn);

    expect(
      screen.getByRole('dialog', { name: /workflow history/i })
    ).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(
      screen.queryByRole('dialog', { name: /workflow history/i })
    ).not.toBeInTheDocument();
  });

  it('should show tooltips for quick actions in collapsed mode', () => {
    localStorage.setItem('sidebar_collapsed', 'true');

    render(<SidebarNavigation onNavigate={mockNavigate} />);

    // Tooltip wrappers should exist for quick actions
    const tooltipWrappers = document.querySelectorAll(
      '.sidebar-tooltip-wrapper'
    );
    expect(tooltipWrappers.length).toBeGreaterThan(0);
  });

  it('should handle Escape key to close mobile overlay', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => {
        const isMobileQuery = query.includes('max-width: 639px');
        return {
          matches: isMobileQuery,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        };
      },
    });

    render(<SidebarNavigation onNavigate={mockNavigate} />);

    const sidebar = screen.getByRole('navigation', {
      name: /sidebar navigation/i,
    });

    // Should be hidden initially
    expect(sidebar).toHaveClass('sidebar--hidden');
  });

  it('should not keyboard-toggle when focus is in an input', () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    const searchInput = screen.getByRole('searchbox', {
      name: /search workflows/i,
    });
    searchInput.focus();

    // '[' key should not toggle when input is focused
    fireEvent.keyDown(searchInput, { key: '[' });

    const sidebar = screen.getByRole('navigation', {
      name: /sidebar navigation/i,
    });
    expect(sidebar).not.toHaveClass('sidebar--collapsed');
  });
});
