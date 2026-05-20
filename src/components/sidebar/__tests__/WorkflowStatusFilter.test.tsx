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
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<WorkflowStatusFilter value="all" onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: /failed/i }));
    expect(onChange).toHaveBeenCalledWith('failed');
  });

  it('has radiogroup role with label', () => {
    render(<WorkflowStatusFilter value="all" onChange={vi.fn()} />);
    expect(screen.getByRole('radiogroup', { name: /filter by status/i })).toBeInTheDocument();
  });
});
