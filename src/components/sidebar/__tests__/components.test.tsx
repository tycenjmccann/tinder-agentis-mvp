import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../test/test-utils';
import { AgentStatusItem } from '../AgentStatusItem';
import { WorkflowHistoryItem } from '../WorkflowHistoryItem';
import { WorkflowSearchBar } from '../WorkflowSearchBar';
import { WorkflowStatusFilter } from '../WorkflowStatusFilter';
import { QuickActions } from '../QuickActions';
import { SidebarTooltip } from '../SidebarTooltip';
import { SidebarContext } from '../SidebarContext';
import { Plus, ScrollText, Settings } from 'lucide-react';
import type { Agent, WorkflowSummary, QuickAction } from '../sidebar.types';

const mockSidebarContext = {
  isCollapsed: false,
  isHidden: false,
  isMobileOpen: false,
  toggle: vi.fn(),
  expand: vi.fn(),
  collapse: vi.fn(),
  openMobile: vi.fn(),
  closeMobile: vi.fn(),
};

function renderWithContext(ui: React.ReactElement, collapsed = false) {
  return render(
    <SidebarContext.Provider
      value={{ ...mockSidebarContext, isCollapsed: collapsed }}
    >
      {ui}
    </SidebarContext.Provider>
  );
}

describe('AgentStatusItem', () => {
  const mockAgent: Agent = {
    id: 'agent-1',
    name: 'Frontend Developer',
    role: 'Frontend',
    status: 'active',
    lastActivity: new Date().toISOString(),
  };
  const mockOnClick = vi.fn();

  it('should render agent name and role', () => {
    renderWithContext(
      <AgentStatusItem agent={mockAgent} onClick={mockOnClick} />
    );

    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    expect(screen.getByText('Frontend')).toBeInTheDocument();
  });

  it('should display status text', () => {
    renderWithContext(
      <AgentStatusItem agent={mockAgent} onClick={mockOnClick} />
    );

    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('should have proper aria-label with full info', () => {
    renderWithContext(
      <AgentStatusItem agent={mockAgent} onClick={mockOnClick} />
    );

    const button = screen.getByRole('listitem');
    expect(button).toHaveAttribute(
      'aria-label',
      'Frontend Developer, Frontend, status: active'
    );
  });

  it('should call onClick when clicked', () => {
    renderWithContext(
      <AgentStatusItem agent={mockAgent} onClick={mockOnClick} />
    );

    fireEvent.click(screen.getByRole('listitem'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should render status dot with correct class', () => {
    renderWithContext(
      <AgentStatusItem agent={mockAgent} onClick={mockOnClick} />
    );

    const dot = document.querySelector('.agent-item__dot--active');
    expect(dot).toBeInTheDocument();
  });

  it('should render error status correctly', () => {
    const errorAgent = { ...mockAgent, status: 'error' as const };
    renderWithContext(
      <AgentStatusItem agent={errorAgent} onClick={mockOnClick} />
    );

    const dot = document.querySelector('.agent-item__dot--error');
    expect(dot).toBeInTheDocument();
  });
});

describe('WorkflowHistoryItem', () => {
  const mockWorkflow: WorkflowSummary = {
    id: 'wf-001',
    title: 'Deploy API v2.1',
    status: 'running',
    createdAt: new Date(Date.now() - 120000).toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const mockOnClick = vi.fn();

  it('should render workflow title', () => {
    renderWithContext(
      <WorkflowHistoryItem workflow={mockWorkflow} onClick={mockOnClick} />
    );

    expect(screen.getByText('Deploy API v2.1')).toBeInTheDocument();
  });

  it('should render status badge', () => {
    renderWithContext(
      <WorkflowHistoryItem workflow={mockWorkflow} onClick={mockOnClick} />
    );

    expect(screen.getByText('running')).toBeInTheDocument();
    const badge = document.querySelector('.workflow-item__badge--running');
    expect(badge).toBeInTheDocument();
  });

  it('should render relative timestamp', () => {
    renderWithContext(
      <WorkflowHistoryItem workflow={mockWorkflow} onClick={mockOnClick} />
    );

    expect(screen.getByText('2m ago')).toBeInTheDocument();
  });

  it('should have proper aria-label', () => {
    renderWithContext(
      <WorkflowHistoryItem workflow={mockWorkflow} onClick={mockOnClick} />
    );

    const item = screen.getByRole('listitem');
    expect(item.getAttribute('aria-label')).toContain('Deploy API v2.1');
    expect(item.getAttribute('aria-label')).toContain('status: running');
  });

  it('should call onClick when clicked', () => {
    renderWithContext(
      <WorkflowHistoryItem workflow={mockWorkflow} onClick={mockOnClick} />
    );

    fireEvent.click(screen.getByRole('listitem'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should handle failed status', () => {
    const failedWorkflow = { ...mockWorkflow, status: 'failed' as const };
    renderWithContext(
      <WorkflowHistoryItem workflow={failedWorkflow} onClick={mockOnClick} />
    );

    const badge = document.querySelector('.workflow-item__badge--failed');
    expect(badge).toBeInTheDocument();
  });

  it('should safely render special characters in title', () => {
    const xssWorkflow = {
      ...mockWorkflow,
      title: '<script>alert("xss")</script>',
    };
    renderWithContext(
      <WorkflowHistoryItem workflow={xssWorkflow} onClick={mockOnClick} />
    );

    // Should be rendered as text, not executed
    expect(
      screen.getByText('<script>alert("xss")</script>')
    ).toBeInTheDocument();
  });
});

describe('WorkflowSearchBar', () => {
  const mockOnChange = vi.fn();

  it('should render search input', () => {
    renderWithContext(
      <WorkflowSearchBar value="" onChange={mockOnChange} />
    );

    const input = screen.getByRole('searchbox', {
      name: /search workflows/i,
    });
    expect(input).toBeInTheDocument();
  });

  it('should show clear button when value exists', () => {
    renderWithContext(
      <WorkflowSearchBar value="test" onChange={mockOnChange} />
    );

    expect(
      screen.getByRole('button', { name: /clear search/i })
    ).toBeInTheDocument();
  });

  it('should not show clear button when empty', () => {
    renderWithContext(
      <WorkflowSearchBar value="" onChange={mockOnChange} />
    );

    expect(
      screen.queryByRole('button', { name: /clear search/i })
    ).not.toBeInTheDocument();
  });

  it('should call onChange on input', () => {
    renderWithContext(
      <WorkflowSearchBar value="" onChange={mockOnChange} />
    );

    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'deploy' } });
    expect(mockOnChange).toHaveBeenCalledWith('deploy');
  });

  it('should call onChange with empty string on clear', () => {
    renderWithContext(
      <WorkflowSearchBar value="test" onChange={mockOnChange} />
    );

    fireEvent.click(screen.getByRole('button', { name: /clear search/i }));
    expect(mockOnChange).toHaveBeenCalledWith('');
  });
});

describe('WorkflowStatusFilter', () => {
  const mockOnChange = vi.fn();

  it('should render all filter chips', () => {
    renderWithContext(
      <WorkflowStatusFilter value="all" onChange={mockOnChange} />
    );

    expect(screen.getByRole('radio', { name: /all/i })).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: /running/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /done/i })).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: /failed/i })
    ).toBeInTheDocument();
  });

  it('should mark active filter as checked', () => {
    renderWithContext(
      <WorkflowStatusFilter value="running" onChange={mockOnChange} />
    );

    expect(screen.getByRole('radio', { name: /running/i })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(screen.getByRole('radio', { name: /all/i })).toHaveAttribute(
      'aria-checked',
      'false'
    );
  });

  it('should call onChange when filter chip is clicked', () => {
    renderWithContext(
      <WorkflowStatusFilter value="all" onChange={mockOnChange} />
    );

    fireEvent.click(screen.getByRole('radio', { name: /failed/i }));
    expect(mockOnChange).toHaveBeenCalledWith('failed');
  });

  it('should have radiogroup role with label', () => {
    renderWithContext(
      <WorkflowStatusFilter value="all" onChange={mockOnChange} />
    );

    expect(
      screen.getByRole('radiogroup', { name: /filter by status/i })
    ).toBeInTheDocument();
  });
});

describe('QuickActions', () => {
  const mockActions: QuickAction[] = [
    {
      id: 'new-workflow',
      icon: Plus,
      label: 'New Workflow',
      onClick: vi.fn(),
      variant: 'primary',
    },
    {
      id: 'view-logs',
      icon: ScrollText,
      label: 'View Logs',
      onClick: vi.fn(),
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Settings',
      onClick: vi.fn(),
    },
  ];

  it('should render all action buttons', () => {
    renderWithContext(<QuickActions actions={mockActions} />);

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

  it('should call onClick for each action', () => {
    renderWithContext(<QuickActions actions={mockActions} />);

    fireEvent.click(screen.getByRole('button', { name: /new workflow/i }));
    expect(mockActions[0].onClick).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /view logs/i }));
    expect(mockActions[1].onClick).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /settings/i }));
    expect(mockActions[2].onClick).toHaveBeenCalled();
  });

  it('should apply primary variant class', () => {
    renderWithContext(<QuickActions actions={mockActions} />);

    const primaryBtn = screen.getByRole('button', { name: /new workflow/i });
    expect(primaryBtn).toHaveClass('quick-action-btn--primary');
  });

  it('should show tooltips in collapsed mode', () => {
    renderWithContext(<QuickActions actions={mockActions} />, true);

    // Tooltip wrappers should be present
    const tooltipWrappers = document.querySelectorAll(
      '.sidebar-tooltip-wrapper'
    );
    expect(tooltipWrappers.length).toBe(3);
  });

  it('should handle disabled state', () => {
    const disabledActions = [
      { ...mockActions[0], disabled: true },
      ...mockActions.slice(1),
    ];
    renderWithContext(<QuickActions actions={disabledActions} />);

    const btn = screen.getByRole('button', { name: /new workflow/i });
    expect(btn).toBeDisabled();
  });

  it('should have group role with label', () => {
    renderWithContext(<QuickActions actions={mockActions} />);

    expect(
      screen.getByRole('group', { name: /quick actions/i })
    ).toBeInTheDocument();
  });
});

describe('SidebarTooltip', () => {
  it('should render children', () => {
    render(
      <SidebarTooltip content="Test tooltip">
        <button>Hover me</button>
      </SidebarTooltip>
    );

    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('should show tooltip on mouse enter', async () => {
    vi.useFakeTimers();
    render(
      <SidebarTooltip content="Test tooltip">
        <button>Hover me</button>
      </SidebarTooltip>
    );

    const wrapper = document.querySelector('.sidebar-tooltip-wrapper')!;
    fireEvent.mouseEnter(wrapper);

    // Tooltip has 200ms delay
    vi.advanceTimersByTime(200);

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveClass('sidebar-tooltip--visible');
    expect(tooltip).toHaveTextContent('Test tooltip');

    vi.useRealTimers();
  });

  it('should hide tooltip on mouse leave', async () => {
    vi.useFakeTimers();
    render(
      <SidebarTooltip content="Test tooltip">
        <button>Hover me</button>
      </SidebarTooltip>
    );

    const wrapper = document.querySelector('.sidebar-tooltip-wrapper')!;
    fireEvent.mouseEnter(wrapper);
    vi.advanceTimersByTime(200);

    fireEvent.mouseLeave(wrapper);

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).not.toHaveClass('sidebar-tooltip--visible');

    vi.useRealTimers();
  });

  it('should have role tooltip with proper aria attributes', () => {
    render(
      <SidebarTooltip content="Tip text">
        <button>Action</button>
      </SidebarTooltip>
    );

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveAttribute('aria-hidden', 'true');
  });

  it('should render content as text only (XSS safe)', () => {
    render(
      <SidebarTooltip content='<img src=x onerror="alert(1)">'>
        <button>Action</button>
      </SidebarTooltip>
    );

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.innerHTML).not.toContain('<img');
    expect(tooltip.textContent).toContain('<img src=x onerror="alert(1)">');
  });
});
