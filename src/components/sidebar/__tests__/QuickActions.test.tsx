import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { QuickActions } from '../QuickActions';
import { SidebarContext } from '../SidebarContext';
import type { QuickAction } from '../sidebar.types';
import { Plus, ScrollText, Settings } from 'lucide-react';

const defaultContextValue = {
  isCollapsed: false,
  isHidden: false,
  isMobileOpen: false,
  toggle: vi.fn(),
  expand: vi.fn(),
  collapse: vi.fn(),
  openMobile: vi.fn(),
  closeMobile: vi.fn(),
};

function renderWithContext(
  ui: React.ReactElement,
  contextValue = defaultContextValue
) {
  return render(
    <SidebarContext.Provider value={contextValue}>
      {ui}
    </SidebarContext.Provider>
  );
}

describe('QuickActions', () => {
  const mockActions: QuickAction[] = [
    { id: 'new-workflow', icon: Plus, label: 'New Workflow', onClick: vi.fn(), variant: 'primary' },
    { id: 'view-logs', icon: ScrollText, label: 'View Logs', onClick: vi.fn() },
    { id: 'settings', icon: Settings, label: 'Settings', onClick: vi.fn() },
  ];

  it('renders all action buttons', () => {
    renderWithContext(<QuickActions actions={mockActions} />);

    expect(screen.getByLabelText('New Workflow')).toBeInTheDocument();
    expect(screen.getByLabelText('View Logs')).toBeInTheDocument();
    expect(screen.getByLabelText('Settings')).toBeInTheDocument();
  });

  it('renders labels in expanded mode', () => {
    renderWithContext(<QuickActions actions={mockActions} />);

    expect(screen.getByText('New Workflow')).toBeInTheDocument();
    expect(screen.getByText('View Logs')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('calls onClick when button is clicked', async () => {
    renderWithContext(<QuickActions actions={mockActions} />);

    await userEvent.click(screen.getByLabelText('New Workflow'));
    expect(mockActions[0].onClick).toHaveBeenCalled();

    await userEvent.click(screen.getByLabelText('View Logs'));
    expect(mockActions[1].onClick).toHaveBeenCalled();
  });

  it('applies primary variant class', () => {
    renderWithContext(<QuickActions actions={mockActions} />);

    const primaryBtn = screen.getByLabelText('New Workflow');
    expect(primaryBtn).toHaveClass('quick-action-btn--primary');
  });

  it('disables button when disabled prop is set', () => {
    const disabledActions = [
      { ...mockActions[0], disabled: true },
      ...mockActions.slice(1),
    ];
    renderWithContext(<QuickActions actions={disabledActions} />);

    expect(screen.getByLabelText('New Workflow')).toBeDisabled();
  });

  it('has correct group role and label', () => {
    renderWithContext(<QuickActions actions={mockActions} />);

    expect(screen.getByRole('group', { name: /quick actions/i })).toBeInTheDocument();
  });

  it('renders tooltips in collapsed mode', () => {
    renderWithContext(
      <QuickActions actions={mockActions} />,
      { ...defaultContextValue, isCollapsed: true }
    );

    // Buttons should still be present with labels
    expect(screen.getByLabelText('New Workflow')).toBeInTheDocument();
    expect(screen.getByLabelText('View Logs')).toBeInTheDocument();
  });
});
