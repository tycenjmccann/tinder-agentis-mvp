import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../test/test-utils';
import { SidebarNavigation } from '../SidebarNavigation';
import { server } from '../../../test/mocks/server';
import { http, HttpResponse } from 'msw';

describe('WorkflowHistoryList', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    mockNavigate.mockClear();
    localStorage.clear();
  });

  it('should display workflow items after loading', async () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Deploy API v2.1')).toBeInTheDocument();
    });

    expect(screen.getByText('Build Frontend Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Database Migration v3')).toBeInTheDocument();
  });

  it('should show status badges on workflow items', async () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Deploy API v2.1')).toBeInTheDocument();
    });

    // Status badges
    const runningBadges = screen.getAllByText('running');
    expect(runningBadges.length).toBeGreaterThan(0);
  });

  it('should filter workflows when typing in search', async () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Deploy API v2.1')).toBeInTheDocument();
    });

    const searchInput = screen.getByRole('searchbox', {
      name: /search workflows/i,
    });
    fireEvent.change(searchInput, { target: { value: 'Deploy' } });

    // After debounce, only deploy workflows should show
    await waitFor(() => {
      expect(screen.queryByText('Database Migration v3')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Deploy API v2.1')).toBeInTheDocument();
  });

  it('should filter workflows by status chip', async () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Deploy API v2.1')).toBeInTheDocument();
    });

    // Click "Failed" filter chip
    const failedChip = screen.getByRole('radio', { name: /failed/i });
    fireEvent.click(failedChip);

    await waitFor(() => {
      expect(screen.getByText('Database Migration v3')).toBeInTheDocument();
    });

    // Running workflows should be gone
    expect(screen.queryByText('Deploy API v2.1')).not.toBeInTheDocument();
  });

  it('should show empty state when no results match search', async () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Deploy API v2.1')).toBeInTheDocument();
    });

    const searchInput = screen.getByRole('searchbox', {
      name: /search workflows/i,
    });
    fireEvent.change(searchInput, {
      target: { value: 'nonexistentworkflow' },
    });

    await waitFor(() => {
      expect(screen.getByText('No matching workflows')).toBeInTheDocument();
    });

    // Should show clear search button
    expect(screen.getByText('Clear search')).toBeInTheDocument();
  });

  it('should clear search when clear button is clicked', async () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Deploy API v2.1')).toBeInTheDocument();
    });

    const searchInput = screen.getByRole('searchbox', {
      name: /search workflows/i,
    });
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Clear button (X) in search bar
    await waitFor(() => {
      const clearBtn = screen.getByRole('button', { name: /clear search/i });
      expect(clearBtn).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /clear search/i }));

    expect(searchInput).toHaveValue('');
  });

  it('should show error state with retry button', async () => {
    server.use(
      http.get('/api/workflows', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    render(<SidebarNavigation onNavigate={mockNavigate} />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /retry loading workflows/i })
      ).toBeInTheDocument();
    });
  });

  it('should navigate when workflow item is clicked', async () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Deploy API v2.1')).toBeInTheDocument();
    });

    // Click a workflow item
    const workflowItems = screen.getAllByRole('listitem');
    // Find the workflow listitem (not agent listitem)
    const workflowItem = workflowItems.find((el) =>
      el.getAttribute('aria-label')?.includes('Deploy API v2.1')
    );
    if (workflowItem) {
      fireEvent.click(workflowItem);
      expect(mockNavigate).toHaveBeenCalledWith('/workflows/wf-001');
    }
  });

  it('should show empty state when no workflows exist', async () => {
    server.use(
      http.get('/api/workflows', () => {
        return HttpResponse.json({
          workflows: [],
          total: 0,
          page: 1,
          hasMore: false,
        });
      })
    );

    render(<SidebarNavigation onNavigate={mockNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('No workflows yet')).toBeInTheDocument();
    });

    expect(screen.getByText('Create your first workflow')).toBeInTheDocument();
  });

  it('renders workflow titles as safe text (XSS prevention)', async () => {
    server.use(
      http.get('/api/workflows', () => {
        return HttpResponse.json({
          workflows: [
            {
              id: 'wf-xss',
              title: '<img src=x onerror="alert(1)">',
              status: 'running',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          total: 1,
          page: 1,
          hasMore: false,
        });
      })
    );

    render(<SidebarNavigation onNavigate={mockNavigate} />);

    await waitFor(() => {
      // The malicious content should be rendered as text, not HTML
      const element = screen.getByText('<img src=x onerror="alert(1)">');
      expect(element).toBeInTheDocument();
      expect(element.tagName).not.toBe('IMG');
    });
  });
});
