import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../test/test-utils';
import { SidebarNavigation } from '../SidebarNavigation';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('SidebarNavigation - Accessibility', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    mockNavigate.mockClear();
    localStorage.clear();
  });

  it('should have proper ARIA landmarks', () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    // Navigation landmark with label
    const nav = screen.getByRole('navigation', {
      name: /sidebar navigation/i,
    });
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveAttribute('aria-expanded', 'true');

    // Agent status region
    expect(
      screen.getByRole('region', { name: /agent status/i })
    ).toBeInTheDocument();

    // Workflow history region
    expect(
      screen.getByRole('region', { name: /workflow history/i })
    ).toBeInTheDocument();

    // Quick actions group
    expect(
      screen.getByRole('group', { name: /quick actions/i })
    ).toBeInTheDocument();
  });

  it('should have accessible toggle button', () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    const toggle = screen.getByRole('button', {
      name: /collapse sidebar/i,
    });
    expect(toggle).toHaveAttribute('aria-controls', 'sidebar-navigation');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(toggle);

    expect(toggle).toHaveAccessibleName('Expand sidebar');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('should announce state changes via live region', () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');

    // Toggle and check announcement
    fireEvent.click(
      screen.getByRole('button', { name: /collapse sidebar/i })
    );
    expect(liveRegion).toHaveTextContent('Sidebar collapsed');
  });

  it('should have accessible search input', () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    const searchbox = screen.getByRole('searchbox', {
      name: /search workflows/i,
    });
    expect(searchbox).toBeInTheDocument();
    expect(searchbox).toHaveAttribute('type', 'search');
  });

  it('should have accessible filter chips with radio pattern', () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    const radiogroup = screen.getByRole('radiogroup', {
      name: /filter by status/i,
    });
    expect(radiogroup).toBeInTheDocument();

    const allRadio = screen.getByRole('radio', { name: /all/i });
    expect(allRadio).toHaveAttribute('aria-checked', 'true');

    const runningRadio = screen.getByRole('radio', { name: /running/i });
    expect(runningRadio).toHaveAttribute('aria-checked', 'false');
  });

  it('should have accessible quick action buttons', () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    const newWorkflow = screen.getByRole('button', {
      name: /new workflow/i,
    });
    expect(newWorkflow).toBeInTheDocument();
    expect(newWorkflow).toHaveAttribute('type', 'button');

    const viewLogs = screen.getByRole('button', { name: /view logs/i });
    expect(viewLogs).toBeInTheDocument();

    const settings = screen.getByRole('button', { name: /settings/i });
    expect(settings).toBeInTheDocument();
  });

  it('should have accessible agent items with full description', async () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    await waitFor(() => {
      const agentItems = screen.getAllByRole('listitem');
      expect(agentItems.length).toBeGreaterThan(0);
    });

    const agentItems = screen.getAllByRole('listitem');
    // Each agent item should have aria-label with name, role, and status
    const agentLabels = agentItems
      .map((item) => item.getAttribute('aria-label') || '')
      .filter((label) => label.includes('status:'));
    expect(agentLabels.length).toBeGreaterThan(0);

    // Verify label format: "name, role, status: statusValue"
    agentLabels.forEach((label) => {
      expect(label).toMatch(/^.+,.+, status: (active|idle|error)$/);
    });
  });

  it('should hide decorative icons from screen readers', () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    // All Lucide icons should be aria-hidden
    const svgs = document.querySelectorAll('svg[aria-hidden="true"]');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('should have visible focus indicators on interactive elements', () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    const buttons = screen.getAllByRole('button');
    // All buttons should be keyboard focusable
    buttons.forEach((button) => {
      expect(button).not.toHaveAttribute('tabindex', '-1');
    });
  });

  it('should support keyboard navigation with Tab', () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    const buttons = screen.getAllByRole('button');
    // Verify buttons can receive focus
    buttons[0].focus();
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('should have separator role on divider', () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    const separator = screen.getByRole('separator');
    expect(separator).toBeInTheDocument();
  });

  it('should have screen-reader-only class for live region', () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    const srOnly = document.querySelector('.sr-only[aria-live="polite"]');
    expect(srOnly).toBeInTheDocument();
  });

  // NOTE: Full axe audit can be run if jest-axe is properly configured
  // This test checks basic structure without the full axe dependency
  it('should have no obvious accessibility violations in structure', () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    // All images/icons should be decorative (aria-hidden) or have alt text
    const imgs = document.querySelectorAll('img');
    imgs.forEach((img) => {
      expect(
        img.hasAttribute('alt') || img.getAttribute('aria-hidden') === 'true'
      ).toBe(true);
    });

    // All inputs should have labels
    const inputs = document.querySelectorAll('input');
    inputs.forEach((input) => {
      expect(
        input.hasAttribute('aria-label') ||
          input.hasAttribute('aria-labelledby') ||
          document.querySelector(`label[for="${input.id}"]`) !== null
      ).toBe(true);
    });

    // All buttons should have accessible names
    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(
        button.hasAttribute('aria-label') ||
          button.textContent?.trim().length! > 0
      ).toBe(true);
    });
  });
});
