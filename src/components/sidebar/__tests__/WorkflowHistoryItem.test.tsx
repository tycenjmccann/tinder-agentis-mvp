import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { WorkflowHistoryItem } from '../WorkflowHistoryItem';

describe('WorkflowHistoryItem', () => {
  const mockWorkflow = {
    id: 'wf-1',
    title: 'Deploy API v2',
    status: 'running' as const,
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
    updatedAt: new Date().toISOString(),
  };

  it('renders workflow title', () => {
    render(<WorkflowHistoryItem workflow={mockWorkflow} onClick={vi.fn()} />);
    expect(screen.getByText('Deploy API v2')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    render(<WorkflowHistoryItem workflow={mockWorkflow} onClick={vi.fn()} />);
    expect(screen.getByText('running')).toBeInTheDocument();
  });

  it('renders relative timestamp', () => {
    render(<WorkflowHistoryItem workflow={mockWorkflow} onClick={vi.fn()} />);
    expect(screen.getByText('2m ago')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<WorkflowHistoryItem workflow={mockWorkflow} onClick={onClick} />);

    await userEvent.click(screen.getByRole('listitem'));
    expect(onClick).toHaveBeenCalled();
  });

  it('has accessible label with title and status', () => {
    render(<WorkflowHistoryItem workflow={mockWorkflow} onClick={vi.fn()} />);

    expect(
      screen.getByLabelText(/Deploy API v2.*running.*2m ago/i)
    ).toBeInTheDocument();
  });

  it('escapes HTML in title (XSS-safe)', () => {
    const xssWorkflow = {
      ...mockWorkflow,
      title: '<img src=x onerror="alert(1)">',
    };

    render(<WorkflowHistoryItem workflow={xssWorkflow} onClick={vi.fn()} />);

    // Should render as text, not as HTML
    expect(screen.getByText('<img src=x onerror="alert(1)">')).toBeInTheDocument();
    expect(document.querySelector('img')).not.toBeInTheDocument();
  });

  it('applies correct badge class based on status', () => {
    const { container } = render(
      <WorkflowHistoryItem workflow={mockWorkflow} onClick={vi.fn()} />
    );

    const badge = container.querySelector('.workflow-item__badge');
    expect(badge).toHaveClass('workflow-item__badge--running');
  });

  it('renders completed status correctly', () => {
    const completedWorkflow = { ...mockWorkflow, status: 'completed' as const };
    const { container } = render(
      <WorkflowHistoryItem workflow={completedWorkflow} onClick={vi.fn()} />
    );

    const badge = container.querySelector('.workflow-item__badge');
    expect(badge).toHaveClass('workflow-item__badge--completed');
  });

  it('renders failed status correctly', () => {
    const failedWorkflow = { ...mockWorkflow, status: 'failed' as const };
    const { container } = render(
      <WorkflowHistoryItem workflow={failedWorkflow} onClick={vi.fn()} />
    );

    const badge = container.querySelector('.workflow-item__badge');
    expect(badge).toHaveClass('workflow-item__badge--failed');
  });

  it('handles invalid date gracefully', () => {
    const invalidDateWorkflow = { ...mockWorkflow, createdAt: 'not-a-date' };
    render(<WorkflowHistoryItem workflow={invalidDateWorkflow} onClick={vi.fn()} />);

    // Should not crash, shows 'Unknown' or similar
    expect(screen.getByRole('listitem')).toBeInTheDocument();
  });
});
