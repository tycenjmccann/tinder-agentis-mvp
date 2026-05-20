import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { QuickActions } from '../QuickActions';
import { SidebarContext } from '../SidebarContext';
import { Plus, ScrollText, Settings } from 'lucide-react';

const defaultContext = {
  isCollapsed: false,
  isHidden: false,
  isMobileOpen: false,
  toggle: vi.fn(),
  expand: vi.fn(),
  collapse: vi.fn(),
  openMobile: vi.fn(),
  closeMobile: vi.fn(),
};

const mockActions = [
  { id: 'new-workflow', icon: Plus, label: 'New Workflow', onClick: vi.fn(), variant: 'primary' as const },
  { id: 'view-logs', icon: ScrollText, label: 'View Logs', onClick: vi.fn() },
  { id: 'settings', icon: Settings, label: 'Settings', onClick: vi.fn() },
];

function renderWithContext(
  ui: React.ReactElement,
  contextValue = defaultContext
) {
  return render(
    <SidebarContext.Provider value={contextValue}>{ui}</SidebarContext.Provider>
  );
}

describe('QuickActions', () => {
  it('renders all action buttons', () => {
    renderWithContext(<QuickActions actions={mockActions} />);
    expect(screen.getByLabelText('New Workflow')).toBeInTheDocument();
    expect(screen.getByLabelText('View Logs')).toBeInTheDocument();
    expect(screen.getByLabelText('Settings')).toBeInTheDocument();
  });

  it('calls onClick handler when button is clicked', async () => {
    const user = userEvent.setup();
    renderWithContext(<QuickActions actions={mockActions} />);

    await user.click(screen.getByLabelText('New Workflow'));
    expect(mockActions[0].onClick).toHaveBeenCalled();

    await user.click(screen.getByLabelText('View Logs'));
    expect(mockActions[1].onClick).toHaveBeenCalled();

    await user.click(screen.getByLabelText('Settings'));
    expect(mockActions[2].onClick).toHaveBeenCalled();
  });

  it('shows labels in expanded mode', () => {
    renderWithContext(<QuickActions actions={mockActions} />);
    expect(screen.getByText('New Workflow')).toBeInTheDocument();
    expect(screen.getByText('View Logs')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('has group role with label', () => {
    renderWithContext(<QuickActions actions={mockActions} />);
    expect(screen.getByRole('group', { name: /quick actions/i })).toBeInTheDocument();
  });

  it('applies primary variant class', () => {
    renderWithContext(<QuickActions actions={mockActions} />);
    const primaryBtn = screen.getByLabelText('New Workflow');
    expect(primaryBtn).toHaveClass('quick-action-btn--primary');
  });

  it('renders disabled button correctly', () => {
    const actions = [
      { id: 'test', icon: Plus, label: 'Disabled', onClick: vi.fn(), disabled: true },
    ];
    renderWithContext(<QuickActions actions={actions} />);
    expect(screen.getByLabelText('Disabled')).toBeDisabled();
  });
});
