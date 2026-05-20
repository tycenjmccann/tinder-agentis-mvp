import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { WorkflowSearchBar } from '../WorkflowSearchBar';

describe('WorkflowSearchBar', () => {
  it('renders search input with label', () => {
    render(<WorkflowSearchBar value="" onChange={vi.fn()} />);
    expect(screen.getByRole('searchbox', { name: /search workflows/i })).toBeInTheDocument();
  });

  it('displays current value', () => {
    render(<WorkflowSearchBar value="deploy" onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('deploy')).toBeInTheDocument();
  });

  it('calls onChange on input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<WorkflowSearchBar value="" onChange={onChange} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'test');
    expect(onChange).toHaveBeenCalled();
  });

  it('shows clear button when value is present', () => {
    render(<WorkflowSearchBar value="query" onChange={vi.fn()} />);
    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });

  it('hides clear button when value is empty', () => {
    render(<WorkflowSearchBar value="" onChange={vi.fn()} />);
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
  });

  it('clears search when clear button is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<WorkflowSearchBar value="query" onChange={onChange} />);

    await user.click(screen.getByLabelText('Clear search'));
    expect(onChange).toHaveBeenCalledWith('');
  });
});
