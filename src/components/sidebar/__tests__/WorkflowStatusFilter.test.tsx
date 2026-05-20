import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { WorkflowStatusFilter } from '../WorkflowStatusFilter';

describe('WorkflowStatusFilter', () => {
  it('renders all filter options', () => {
    render(<WorkflowStatusFilter value="all" onChange={vi.fn()} />);

    expect(screen.getByRole('radio', { name: /all/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /running/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /done/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /failed/i })).toBeInTheDocument();
  });

  it('marks active filter as checked', () => {
    render(<WorkflowStatusFilter value="running" onChange={vi.fn()} />);

    expect(screen.getByRole('radio', { name: /running/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /all/i })).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange when filter is clicked', async () => {
    const onChange = vi.fn();
    render(<WorkflowStatusFilter value="all" onChange={onChange} />);

    await userEvent.click(screen.getByRole('radio', { name: /running/i }));
    expect(onChange).toHaveBeenCalledWith('running');
  });

  it('has correct radiogroup role and label', () => {
    render(<WorkflowStatusFilter value="all" onChange={vi.fn()} />);

    const group = screen.getByRole('radiogroup', { name: /filter by status/i });
    expect(group).toBeInTheDocument();
  });

  it('supports keyboard navigation with arrow keys', async () => {
    const onChange = vi.fn();
    render(<WorkflowStatusFilter value="all" onChange={onChange} />);

    const allChip = screen.getByRole('radio', { name: /all/i });
    allChip.focus();

    // ArrowRight should select next filter
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith('running');
  });
});
