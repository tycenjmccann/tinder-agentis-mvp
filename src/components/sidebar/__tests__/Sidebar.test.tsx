import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Sidebar } from '../Sidebar';

const renderSidebar = (props = {}) => {
  const defaultProps = {
    onNavigate: vi.fn(),
  };
  return render(
    <BrowserRouter>
      <Sidebar {...defaultProps} {...props} />
    </BrowserRouter>
  );
};

describe('Sidebar', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('sidebar-is-collapsed');
  });

  describe('AC-1 & AC-2: Toggle collapses/expands sidebar', () => {
    it('starts in expanded state by default', () => {
      renderSidebar();
      const sidebar = screen.getByTestId('sidebar');
      expect(sidebar).toHaveClass('sidebar--expanded');
      expect(sidebar).not.toHaveClass('sidebar--collapsed');
    });

    it('collapses sidebar when toggle is clicked', async () => {
      renderSidebar();
      const toggle = screen.getByTestId('sidebar-toggle');

      await userEvent.click(toggle);

      const sidebar = screen.getByTestId('sidebar');
      expect(sidebar).toHaveClass('sidebar--collapsed');
      expect(sidebar).not.toHaveClass('sidebar--expanded');
    });

    it('expands sidebar when toggle is clicked again', async () => {
      renderSidebar();
      const toggle = screen.getByTestId('sidebar-toggle');

      await userEvent.click(toggle); // collapse
      await userEvent.click(toggle); // expand

      const sidebar = screen.getByTestId('sidebar');
      expect(sidebar).toHaveClass('sidebar--expanded');
    });
  });

  describe('AC-3: Smooth 300ms transition', () => {
    it('sidebar has transition CSS class applied', () => {
      renderSidebar();
      const sidebar = screen.getByTestId('sidebar');
      // The sidebar element has .sidebar class which has transition in CSS
      expect(sidebar).toHaveClass('sidebar');
    });
  });

  describe('AC-4 & AC-5: Icons only when collapsed, icons+labels when expanded', () => {
    it('shows labels when expanded', () => {
      renderSidebar();
      const label = screen.getByText('Dashboard');
      expect(label).toBeInTheDocument();
    });

    it('hides labels visually when collapsed (via CSS class)', async () => {
      renderSidebar();
      const toggle = screen.getByTestId('sidebar-toggle');
      await userEvent.click(toggle);

      // Labels are still in DOM (for accessibility) but sidebar has collapsed class
      const sidebar = screen.getByTestId('sidebar');
      expect(sidebar).toHaveClass('sidebar--collapsed');
      // Labels exist in DOM but are hidden via CSS
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('AC-6: State persists in localStorage', () => {
    it('saves collapsed state to localStorage', async () => {
      renderSidebar();
      const toggle = screen.getByTestId('sidebar-toggle');

      await userEvent.click(toggle);

      expect(localStorage.getItem('sidebar-collapsed')).toBe('true');
    });

    it('saves expanded state to localStorage', async () => {
      localStorage.setItem('sidebar-collapsed', 'true');
      renderSidebar();
      const toggle = screen.getByTestId('sidebar-toggle');

      await userEvent.click(toggle);

      expect(localStorage.getItem('sidebar-collapsed')).toBe('false');
    });

    it('reads initial state from localStorage', () => {
      localStorage.setItem('sidebar-collapsed', 'true');
      renderSidebar();

      const sidebar = screen.getByTestId('sidebar');
      expect(sidebar).toHaveClass('sidebar--collapsed');
    });

    it('defaults to expanded when localStorage is empty', () => {
      renderSidebar();

      const sidebar = screen.getByTestId('sidebar');
      expect(sidebar).toHaveClass('sidebar--expanded');
    });
  });

  describe('AC-7: No layout flash on page load', () => {
    it('adds sidebar-is-collapsed class to html element when collapsed', async () => {
      renderSidebar();
      const toggle = screen.getByTestId('sidebar-toggle');
      await userEvent.click(toggle);

      expect(document.documentElement.classList.contains('sidebar-is-collapsed')).toBe(true);
    });

    it('removes sidebar-is-collapsed class from html element when expanded', async () => {
      localStorage.setItem('sidebar-collapsed', 'true');
      renderSidebar();

      const toggle = screen.getByTestId('sidebar-toggle');
      await userEvent.click(toggle);

      expect(document.documentElement.classList.contains('sidebar-is-collapsed')).toBe(false);
    });

    it('applies collapsed class on initial render from localStorage', () => {
      localStorage.setItem('sidebar-collapsed', 'true');
      renderSidebar();

      expect(document.documentElement.classList.contains('sidebar-is-collapsed')).toBe(true);
    });
  });

  describe('AC-8 & AC-9: CSS tooltip on hover in collapsed mode', () => {
    it('nav items have data-tooltip attribute for CSS tooltips', () => {
      renderSidebar();
      const navLinks = screen.getAllByRole('button', { name: /Dashboard|Agents|Workflows|Logs|Settings/ });
      // Filter to only nav links (not the toggle button)
      const dashboardLink = screen.getByText('Dashboard').closest('button');
      expect(dashboardLink).toHaveAttribute('data-tooltip', 'Dashboard');
    });

    it('sidebar has correct class for CSS tooltip visibility control', async () => {
      renderSidebar();
      const toggle = screen.getByTestId('sidebar-toggle');

      // In expanded mode - sidebar has expanded class (CSS hides tooltip via display:none)
      const sidebar = screen.getByTestId('sidebar');
      expect(sidebar).toHaveClass('sidebar--expanded');

      // In collapsed mode - sidebar has collapsed class (CSS shows tooltip on hover)
      await userEvent.click(toggle);
      expect(sidebar).toHaveClass('sidebar--collapsed');
    });
  });

  describe('AC-10: aria-label on toggle button', () => {
    it('toggle has "Collapse sidebar" label when expanded', () => {
      renderSidebar();
      const toggle = screen.getByTestId('sidebar-toggle');
      expect(toggle).toHaveAttribute('aria-label', 'Collapse sidebar');
    });

    it('toggle has "Expand sidebar" label when collapsed', async () => {
      renderSidebar();
      const toggle = screen.getByTestId('sidebar-toggle');

      await userEvent.click(toggle);

      expect(toggle).toHaveAttribute('aria-label', 'Expand sidebar');
    });
  });

  describe('AC-11: aria-expanded on sidebar container', () => {
    it('sidebar has aria-expanded=true when expanded', () => {
      renderSidebar();
      const sidebar = screen.getByTestId('sidebar');
      expect(sidebar).toHaveAttribute('aria-expanded', 'true');
    });

    it('sidebar has aria-expanded=false when collapsed', async () => {
      renderSidebar();
      const toggle = screen.getByTestId('sidebar-toggle');

      await userEvent.click(toggle);

      const sidebar = screen.getByTestId('sidebar');
      expect(sidebar).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Navigation', () => {
    it('calls onNavigate with correct route when nav item is clicked', async () => {
      const onNavigate = vi.fn();
      renderSidebar({ onNavigate });

      const dashboardBtn = screen.getByText('Dashboard').closest('button')!;
      await userEvent.click(dashboardBtn);

      expect(onNavigate).toHaveBeenCalledWith('/');
    });

    it('renders all navigation items', () => {
      renderSidebar();

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Agents')).toBeInTheDocument();
      expect(screen.getByText('Workflows')).toBeInTheDocument();
      expect(screen.getByText('Logs')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  describe('Keyboard accessibility', () => {
    it('toggle button is focusable', () => {
      renderSidebar();
      const toggle = screen.getByTestId('sidebar-toggle');
      toggle.focus();
      expect(document.activeElement).toBe(toggle);
    });

    it('nav items are focusable', () => {
      renderSidebar();
      const dashboardBtn = screen.getByText('Dashboard').closest('button')!;
      dashboardBtn.focus();
      expect(document.activeElement).toBe(dashboardBtn);
    });
  });
});
