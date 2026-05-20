import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { WorkflowSearchBar } from '../WorkflowSearchBar';

describe('WorkflowSearchBar', () => {
  it('renders with proper ARIA attributes', () => {
    render(<WorkflowSearchBar value="" onChange={vi.fn()} />);

    const input = screen.getByRole('searchbox', { name: /search workflows/i });
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('autocomplete', 'off');
  });

  it('displays current value', () => {
    render(<WorkflowSearchBar value="deploy" onChange={vi.fn()} />);

    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue('deploy');
  });

  it('calls onChange when user types', async () => {
    const onChange = vi.fn();
    render(<WorkflowSearchBar value="" onChange={onChange} />);

    const input = screen.getByRole('searchbox');
    await userEvent.type(input, 'd');

    expect(onChange).toHaveBeenCalledWith('d');
  });

  it('shows clear button when value is present', () => {
    render(<WorkflowSearchBar value="test" onChange={vi.fn()} />);

    expect(screen.getByLabelText(/clear search/i)).toBeInTheDocument();
  });

  it('does not show clear button when value is empty', () => {
    render(<WorkflowSearchBar value="" onChange={vi.fn()} />);

    expect(screen.queryByLabelText(/clear search/i)).not.toBeInTheDocument();
  });

  it('clears value when clear button is clicked', async () => {
    const onChange = vi.fn();
    render(<WorkflowSearchBar value="test" onChange={onChange} />);

    await userEvent.click(screen.getByLabelText(/clear search/i));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('uses text content for rendering (XSS-safe)', () => {
    const xssAttempt = '<script>alert("xss")</script>';
    render(<WorkflowSearchBar value={xssAttempt} onChange={vi.fn()} />);

    // Should display as text, not execute
    const input = screen.getByRole('searchbox') as HTMLInputElement;
    expect(input.value).toBe(xssAttempt);

    // No script elements should be in the DOM
    expect(document.querySelector('script')).not.toBeInTheDocument();
  });
});
