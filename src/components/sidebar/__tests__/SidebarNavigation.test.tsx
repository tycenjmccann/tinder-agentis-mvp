import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../test/test-utils';
import { SidebarNavigation } from '../SidebarNavigation';
import { mockAgents } from '../../../test/mocks/handlers';

describe('SidebarNavigation', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    mockNavigate.mockClear();
    localStorage.clear();
  });

  it('should render the sidebar with all sections', async () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    // Sidebar landmark
    const sidebar = screen.getByRole('navigation', {
      name: /sidebar navigation/i,
    });
    expect(sidebar).toBeInTheDocument();

    // Header with brand
    expect(screen.getByText('Agentis Hub')).toBeInTheDocument();

    // Collapse toggle
    expect(
      screen.getByRole('button', { name: /collapse sidebar/i })
    ).toBeInTheDocument();

    // Quick actions
    expect(
      screen.getByRole('button', { name: /new workflow/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /view logs/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /settings/i })
    ).toBeInTheDocument();
  });

  it('should toggle collapse on button click', async () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    const sidebar = screen.getByRole('navigation', {
      name: /sidebar navigation/i,
    });
    expect(sidebar).toHaveAttribute('aria-expanded', 'true');

    const toggleBtn = screen.getByRole('button', {
      name: /collapse sidebar/i,
    });
    fireEvent.click(toggleBtn);

    expect(sidebar).toHaveAttribute('aria-expanded', 'false');
    expect(sidebar).toHaveClass('sidebar--collapsed');
  });

  it('should announce collapse/expand state to screen readers', async () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    const toggleBtn = screen.getByRole('button', {
      name: /collapse sidebar/i,
    });
    fireEvent.click(toggleBtn);

    // Live region should announce
    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toHaveTextContent('Sidebar collapsed');
  });

  it('should navigate when quick action buttons are clicked', () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    fireEvent.click(screen.getByRole('button', { name: /new workflow/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/workflows/new');

    fireEvent.click(screen.getByRole('button', { name: /view logs/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/logs');

    fireEvent.click(screen.getByRole('button', { name: /settings/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/settings');
  });

  it('should display agent status data after loading', async () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    // Wait for agents to load
    await waitFor(() => {
      expect(screen.getByText('AGENTS')).toBeInTheDocument();
    });

    // Check agent count summary
    await waitFor(() => {
      expect(screen.getByText(/Active/)).toBeInTheDocument();
    });
  });

  it('should display workflow history section', async () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    // Workflow section header
    await waitFor(() => {
      expect(screen.getByText('WORKFLOWS')).toBeInTheDocument();
    });

    // Search input
    expect(
      screen.getByRole('searchbox', { name: /search workflows/i })
    ).toBeInTheDocument();

    // Filter chips
    expect(screen.getByRole('radio', { name: /all/i })).toBeInTheDocument();
  });

  it('should handle keyboard shortcut for toggle', () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    const sidebar = screen.getByRole('navigation', {
      name: /sidebar navigation/i,
    });

    // Press '[' key to toggle
    fireEvent.keyDown(document, { key: '[' });
    expect(sidebar).toHaveClass('sidebar--collapsed');

    // Press ']' key to toggle back
    fireEvent.keyDown(document, { key: ']' });
    expect(sidebar).not.toHaveClass('sidebar--collapsed');
  });

  it('should navigate to agent detail on agent click', async () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    // Wait for agents to render
    await waitFor(() => {
      const agentButtons = screen.getAllByRole('listitem');
      expect(agentButtons.length).toBeGreaterThan(0);
    });

    const agentButtons = screen.getAllByRole('listitem');
    fireEvent.click(agentButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('/agents/')
    );
  });

  it('should persist collapse state across re-renders', () => {
    const { unmount } = render(
      <SidebarNavigation onNavigate={mockNavigate} />
    );

    // Collapse the sidebar
    fireEvent.click(
      screen.getByRole('button', { name: /collapse sidebar/i })
    );

    unmount();

    // Re-render — should still be collapsed
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    const sidebar = screen.getByRole('navigation', {
      name: /sidebar navigation/i,
    });
    expect(sidebar).toHaveClass('sidebar--collapsed');
  });

  it('should render all ARIA attributes correctly', () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    // Navigation landmark
    const nav = screen.getByRole('navigation', {
      name: /sidebar navigation/i,
    });
    expect(nav).toHaveAttribute('aria-expanded', 'true');
    expect(nav).toHaveAttribute('id', 'sidebar-navigation');

    // Toggle button
    const toggle = screen.getByRole('button', {
      name: /collapse sidebar/i,
    });
    expect(toggle).toHaveAttribute('aria-controls', 'sidebar-navigation');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    // Quick actions group
    expect(
      screen.getByRole('group', { name: /quick actions/i })
    ).toBeInTheDocument();
  });
});
