import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SidebarNavigation } from '../SidebarNavigation';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Helper to render with router
function renderSidebar(props = {}) {
  const defaultProps = {
    onNavigate: vi.fn(),
  };
  return render(
    <BrowserRouter>
      <SidebarNavigation {...defaultProps} {...props} />
    </BrowserRouter>
  );
}

describe('SidebarNavigation', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('sidebar-initially-collapsed');
  });

  describe('AC-1 & AC-2: Toggle collapse/expand', () => {
    it('should collapse sidebar when toggle is clicked', () => {
      renderSidebar();

      const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
      expect(sidebar).not.toHaveClass('sidebar--collapsed');

      const toggleBtn = screen.getByRole('button', { name: /collapse sidebar/i });
      fireEvent.click(toggleBtn);

      expect(sidebar).toHaveClass('sidebar--collapsed');
    });

    it('should expand sidebar when toggle is clicked again', () => {
      renderSidebar({ defaultCollapsed: true });

      const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
      expect(sidebar).toHaveClass('sidebar--collapsed');

      const toggleBtn = screen.getByRole('button', { name: /expand sidebar/i });
      fireEvent.click(toggleBtn);

      expect(sidebar).not.toHaveClass('sidebar--collapsed');
    });
  });

  describe('AC-6: localStorage persistence', () => {
    it('should persist collapsed state to localStorage', () => {
      renderSidebar();

      const toggleBtn = screen.getByRole('button', { name: /collapse sidebar/i });
      fireEvent.click(toggleBtn);

      expect(localStorage.getItem('sidebar-collapsed')).toBe('true');
    });

    it('should persist expanded state to localStorage', () => {
      localStorage.setItem('sidebar-collapsed', 'true');
      renderSidebar();

      const toggleBtn = screen.getByRole('button', { name: /expand sidebar/i });
      fireEvent.click(toggleBtn);

      expect(localStorage.getItem('sidebar-collapsed')).toBe('false');
    });

    it('should read initial state from localStorage', () => {
      localStorage.setItem('sidebar-collapsed', 'true');
      renderSidebar();

      const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
      expect(sidebar).toHaveClass('sidebar--collapsed');
    });

    it('should default to expanded when no localStorage entry', () => {
      renderSidebar();

      const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
      expect(sidebar).not.toHaveClass('sidebar--collapsed');
    });
  });

  describe('AC-10: aria-label on toggle button', () => {
    it('should have aria-label "Collapse sidebar" when expanded', () => {
      renderSidebar();

      const toggleBtn = screen.getByRole('button', { name: /collapse sidebar/i });
      expect(toggleBtn).toBeInTheDocument();
      expect(toggleBtn).toHaveAttribute('aria-label', 'Collapse sidebar');
    });

    it('should have aria-label "Expand sidebar" when collapsed', () => {
      renderSidebar({ defaultCollapsed: true });

      const toggleBtn = screen.getByRole('button', { name: /expand sidebar/i });
      expect(toggleBtn).toBeInTheDocument();
      expect(toggleBtn).toHaveAttribute('aria-label', 'Expand sidebar');
    });
  });

  describe('AC-11: aria-expanded on sidebar container', () => {
    it('should have aria-expanded="true" when expanded', () => {
      renderSidebar();

      const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
      expect(sidebar).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have aria-expanded="false" when collapsed', () => {
      renderSidebar({ defaultCollapsed: true });

      const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
      expect(sidebar).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('AC-4 & AC-5: Visibility of labels', () => {
    it('should show labels when expanded', () => {
      renderSidebar();

      const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
      expect(sidebar).not.toHaveClass('sidebar--collapsed');
      // Labels are visible (not hidden by CSS class)
      const brandText = screen.getByText('Agentis Hub');
      expect(brandText).toBeInTheDocument();
    });

    it('should have collapsed class when collapsed (labels hidden via CSS)', () => {
      renderSidebar({ defaultCollapsed: true });

      const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
      expect(sidebar).toHaveClass('sidebar--collapsed');
      // sidebar__content-label elements exist but are hidden via CSS opacity: 0
    });
  });

  describe('Keyboard shortcuts', () => {
    it('should toggle sidebar with [ key', () => {
      renderSidebar();

      const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
      expect(sidebar).not.toHaveClass('sidebar--collapsed');

      fireEvent.keyDown(document, { key: '[' });
      expect(sidebar).toHaveClass('sidebar--collapsed');

      fireEvent.keyDown(document, { key: ']' });
      expect(sidebar).not.toHaveClass('sidebar--collapsed');
    });
  });
});
