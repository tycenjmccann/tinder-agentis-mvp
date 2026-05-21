import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../test/test-utils';
import { Sidebar } from '../Sidebar';

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

describe('Sidebar', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    document.documentElement.classList.remove('sidebar-collapsed');
  });

  describe('AC-1: Clicking toggle collapses sidebar to w-16', () => {
    it('should collapse sidebar when toggle is clicked', () => {
      render(<Sidebar onNavigate={mockNavigate} />);
      const sidebar = screen.getByTestId('sidebar');
      const toggle = screen.getByTestId('sidebar-toggle');

      // Initially expanded
      expect(sidebar).toHaveClass('sidebar--expanded');
      expect(sidebar).not.toHaveClass('sidebar--collapsed');

      // Click toggle to collapse
      fireEvent.click(toggle);

      expect(sidebar).toHaveClass('sidebar--collapsed');
      expect(sidebar).not.toHaveClass('sidebar--expanded');
    });
  });

  describe('AC-2: Clicking toggle again expands sidebar to w-64', () => {
    it('should expand sidebar when toggle is clicked while collapsed', () => {
      localStorageMock.getItem.mockReturnValue('true');
      render(<Sidebar onNavigate={mockNavigate} />);
      const sidebar = screen.getByTestId('sidebar');
      const toggle = screen.getByTestId('sidebar-toggle');

      // Initially collapsed (from localStorage)
      expect(sidebar).toHaveClass('sidebar--collapsed');

      // Click toggle to expand
      fireEvent.click(toggle);

      expect(sidebar).toHaveClass('sidebar--expanded');
    });
  });

  describe('AC-3: Smooth 300ms transition', () => {
    it('should apply transition CSS class via sidebar base class', () => {
      render(<Sidebar onNavigate={mockNavigate} />);
      const sidebar = screen.getByTestId('sidebar');

      // The sidebar always has the base 'sidebar' class which applies
      // transition: width 300ms ease via CSS variables
      expect(sidebar).toHaveClass('sidebar');
    });
  });

  describe('AC-4: Collapsed state shows icons only', () => {
    it('should hide text labels when collapsed via CSS class', () => {
      render(<Sidebar onNavigate={mockNavigate} />);
      const toggle = screen.getByTestId('sidebar-toggle');

      fireEvent.click(toggle);

      const sidebar = screen.getByTestId('sidebar');
      expect(sidebar).toHaveClass('sidebar--collapsed');
      // Labels exist in DOM but are hidden via CSS (opacity: 0, width: 0)
      const labels = sidebar.querySelectorAll('.sidebar__nav-label');
      expect(labels.length).toBeGreaterThan(0);
    });
  });

  describe('AC-5: Expanded state shows icons + labels', () => {
    it('should show text labels when expanded', () => {
      render(<Sidebar onNavigate={mockNavigate} />);
      const sidebar = screen.getByTestId('sidebar');

      expect(sidebar).toHaveClass('sidebar--expanded');
      const labels = sidebar.querySelectorAll('.sidebar__nav-label');
      expect(labels.length).toBeGreaterThan(0);
      // Verify specific labels are in the DOM
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Workflows')).toBeInTheDocument();
      expect(screen.getByText('Agents')).toBeInTheDocument();
      expect(screen.getByText('Logs')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  describe('AC-6: State persists in localStorage across reloads', () => {
    it('should save collapsed state to localStorage', () => {
      render(<Sidebar onNavigate={mockNavigate} />);
      const toggle = screen.getByTestId('sidebar-toggle');

      fireEvent.click(toggle);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'sidebar-collapsed',
        'true'
      );
    });

    it('should save expanded state to localStorage', () => {
      localStorageMock.getItem.mockReturnValue('true');
      render(<Sidebar onNavigate={mockNavigate} />);
      const toggle = screen.getByTestId('sidebar-toggle');

      fireEvent.click(toggle);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'sidebar-collapsed',
        'false'
      );
    });

    it('should read initial state from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('true');
      render(<Sidebar onNavigate={mockNavigate} />);
      const sidebar = screen.getByTestId('sidebar');

      expect(sidebar).toHaveClass('sidebar--collapsed');
    });

    it('should default to expanded when localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValue(null);
      render(<Sidebar onNavigate={mockNavigate} />);
      const sidebar = screen.getByTestId('sidebar');

      expect(sidebar).toHaveClass('sidebar--expanded');
    });
  });

  describe('AC-7: No layout flash on page load', () => {
    it('should sync html class with collapsed state for flash prevention', () => {
      localStorageMock.getItem.mockReturnValue('true');
      render(<Sidebar onNavigate={mockNavigate} />);

      // The component adds sidebar-collapsed to <html> on mount when collapsed
      expect(document.documentElement.classList.contains('sidebar-collapsed')).toBe(true);
    });

    it('should not have sidebar-collapsed class on html when expanded', () => {
      localStorageMock.getItem.mockReturnValue(null);
      render(<Sidebar onNavigate={mockNavigate} />);

      expect(document.documentElement.classList.contains('sidebar-collapsed')).toBe(false);
    });
  });

  describe('AC-8: CSS tooltip appears on hover in collapsed mode', () => {
    it('should render data-tooltip attributes on nav items for CSS tooltips', () => {
      render(<Sidebar onNavigate={mockNavigate} />);
      const toggle = screen.getByTestId('sidebar-toggle');

      fireEvent.click(toggle);

      // data-tooltip is on the <li> elements (.sidebar__nav-item)
      const navItems = screen.getByTestId('sidebar').querySelectorAll('.sidebar__nav-item');
      navItems.forEach((item) => {
        expect(item).toHaveAttribute('data-tooltip');
        expect(item.getAttribute('data-tooltip')).not.toBe('');
      });
    });

    it('should have tooltip content matching nav labels', () => {
      render(<Sidebar onNavigate={mockNavigate} />);
      const navItems = screen.getByTestId('sidebar').querySelectorAll('.sidebar__nav-item');

      const tooltipLabels = Array.from(navItems).map(
        (item) => item.getAttribute('data-tooltip')
      );
      expect(tooltipLabels).toContain('Dashboard');
      expect(tooltipLabels).toContain('Workflows');
      expect(tooltipLabels).toContain('Agents');
      expect(tooltipLabels).toContain('Logs');
      expect(tooltipLabels).toContain('Settings');
    });
  });

  describe('AC-9: Tooltip does NOT appear in expanded mode', () => {
    it('should have sidebar--expanded class which hides tooltips via CSS', () => {
      render(<Sidebar onNavigate={mockNavigate} />);
      const sidebar = screen.getByTestId('sidebar');

      // In expanded mode, CSS rule: .sidebar--expanded .sidebar__nav-item::after { content: none; }
      expect(sidebar).toHaveClass('sidebar--expanded');
      expect(sidebar).not.toHaveClass('sidebar--collapsed');
    });
  });

  describe('AC-10: Toggle button has correct aria-label', () => {
    it('should have "Collapse sidebar" label when expanded', () => {
      render(<Sidebar onNavigate={mockNavigate} />);
      const toggle = screen.getByTestId('sidebar-toggle');

      expect(toggle).toHaveAttribute('aria-label', 'Collapse sidebar');
    });

    it('should have "Expand sidebar" label when collapsed', () => {
      localStorageMock.getItem.mockReturnValue('true');
      render(<Sidebar onNavigate={mockNavigate} />);
      const toggle = screen.getByTestId('sidebar-toggle');

      expect(toggle).toHaveAttribute('aria-label', 'Expand sidebar');
    });

    it('should update aria-label after toggle', () => {
      render(<Sidebar onNavigate={mockNavigate} />);
      const toggle = screen.getByTestId('sidebar-toggle');

      expect(toggle).toHaveAttribute('aria-label', 'Collapse sidebar');

      fireEvent.click(toggle);

      expect(toggle).toHaveAttribute('aria-label', 'Expand sidebar');
    });
  });

  describe('AC-11: Sidebar has aria-expanded attribute', () => {
    it('should have aria-expanded="true" when expanded', () => {
      render(<Sidebar onNavigate={mockNavigate} />);
      const sidebar = screen.getByTestId('sidebar');

      expect(sidebar).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have aria-expanded="false" when collapsed', () => {
      localStorageMock.getItem.mockReturnValue('true');
      render(<Sidebar onNavigate={mockNavigate} />);
      const sidebar = screen.getByTestId('sidebar');

      expect(sidebar).toHaveAttribute('aria-expanded', 'false');
    });

    it('should update aria-expanded after toggle', () => {
      render(<Sidebar onNavigate={mockNavigate} />);
      const sidebar = screen.getByTestId('sidebar');

      expect(sidebar).toHaveAttribute('aria-expanded', 'true');

      fireEvent.click(screen.getByTestId('sidebar-toggle'));

      expect(sidebar).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Navigation', () => {
    it('should call onNavigate when a nav item is clicked', () => {
      render(<Sidebar onNavigate={mockNavigate} />);

      fireEvent.click(screen.getByText('Dashboard'));
      expect(mockNavigate).toHaveBeenCalledWith('/');

      fireEvent.click(screen.getByText('Workflows'));
      expect(mockNavigate).toHaveBeenCalledWith('/workflows');
    });

    it('should render all five navigation items', () => {
      render(<Sidebar onNavigate={mockNavigate} />);
      const navItems = screen.getByTestId('sidebar').querySelectorAll('.sidebar__nav-item');
      expect(navItems).toHaveLength(5);
    });
  });

  describe('Keyboard shortcuts', () => {
    it('should toggle sidebar on [ key press', () => {
      render(<Sidebar onNavigate={mockNavigate} />);
      const sidebar = screen.getByTestId('sidebar');

      expect(sidebar).toHaveClass('sidebar--expanded');

      fireEvent.keyDown(document, { key: '[' });

      expect(sidebar).toHaveClass('sidebar--collapsed');
    });

    it('should toggle sidebar on ] key press', () => {
      render(<Sidebar onNavigate={mockNavigate} />);
      const sidebar = screen.getByTestId('sidebar');

      fireEvent.keyDown(document, { key: ']' });

      expect(sidebar).toHaveClass('sidebar--collapsed');
    });

    it('should not toggle when typing in an input', () => {
      render(
        <div>
          <Sidebar onNavigate={mockNavigate} />
          <input data-testid="test-input" />
        </div>
      );
      const sidebar = screen.getByTestId('sidebar');
      const input = screen.getByTestId('test-input');

      fireEvent.keyDown(input, { key: '[', target: input });

      expect(sidebar).toHaveClass('sidebar--expanded');
    });
  });

  describe('HTML class management for flash prevention', () => {
    it('should add sidebar-collapsed class to html when collapsed', () => {
      render(<Sidebar onNavigate={mockNavigate} />);
      const toggle = screen.getByTestId('sidebar-toggle');

      fireEvent.click(toggle);

      expect(document.documentElement.classList.contains('sidebar-collapsed')).toBe(true);
    });

    it('should remove sidebar-collapsed class from html when expanded', () => {
      document.documentElement.classList.add('sidebar-collapsed');
      localStorageMock.getItem.mockReturnValue('true');
      render(<Sidebar onNavigate={mockNavigate} />);
      const toggle = screen.getByTestId('sidebar-toggle');

      fireEvent.click(toggle);

      expect(document.documentElement.classList.contains('sidebar-collapsed')).toBe(false);
    });
  });
});
