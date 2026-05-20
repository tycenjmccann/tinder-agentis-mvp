import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WorkflowHistoryList } from '../WorkflowHistoryList';
import { SidebarContext } from '../SidebarContext';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock document.hidden
Object.defineProperty(document, 'hidden', { value: false, writable: true });

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

describe('WorkflowHistoryList', () => {
  const mockWorkflows = {
    workflows: [
      { id: 'wf-1', title: 'Deploy API v2', status: 'running', createdAt: '2026-05-20T06:50:00Z', updatedAt: '2026-05-20T06:55:00Z' },
      { id: 'wf-2', title: 'Build Frontend', status: 'completed', createdAt: '2026-05-20T05:00:00Z', updatedAt: '2026-05-20T05:30:00Z' },
      { id: 'wf-3', title: 'Run Tests', status: 'failed', createdAt: '2026-05-20T04:00:00Z', updatedAt: '2026-05-20T04:15:00Z' },
    ],
    total: 3,
    page: 1,
    hasMore: false,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockWorkflows,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders loading skeletons initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    renderWithContext(<WorkflowHistoryList />);

    expect(screen.getByRole('region', { name: /workflow history/i })).toBeInTheDocument();
    expect(screen.getByText('WORKFLOWS')).toBeInTheDocument();
  });

  it('displays workflow list after loading', async () => {
    vi.useRealTimers();
    renderWithContext(<WorkflowHistoryList />);

    await waitFor(() => {
      expect(screen.getByText('Deploy API v2')).toBeInTheDocument();
    });

    expect(screen.getByText('Build Frontend')).toBeInTheDocument();
    expect(screen.getByText('Run Tests')).toBeInTheDocument();
  });

  it('displays status badges', async () => {
    vi.useRealTimers();
    renderWithContext(<WorkflowHistoryList />);

    await waitFor(() => {
      expect(screen.getByText('running')).toBeInTheDocument();
    });

    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByText('failed')).toBeInTheDocument();
  });

  it('calls onWorkflowClick when workflow is clicked', async () => {
    vi.useRealTimers();
    const onWorkflowClick = vi.fn();
    renderWithContext(<WorkflowHistoryList onWorkflowClick={onWorkflowClick} />);

    await waitFor(() => {
      expect(screen.getByText('Deploy API v2')).toBeInTheDocument();
    });

    await userEvent.click(
      screen.getByLabelText(/Deploy API v2.*status: running/i)
    );
    expect(onWorkflowClick).toHaveBeenCalledWith(mockWorkflows.workflows[0]);
  });

  it('search input updates when user types', async () => {
    vi.useRealTimers();
    renderWithContext(<WorkflowHistoryList />);

    await waitFor(() => {
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    const searchInput = screen.getByRole('searchbox');
    await userEvent.type(searchInput, 'deploy');

    expect(searchInput).toHaveValue('deploy');
  });

  it('shows empty state when no results', async () => {
    vi.useRealTimers();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ workflows: [], total: 0, page: 1, hasMore: false }),
    });

    renderWithContext(<WorkflowHistoryList />);

    await waitFor(() => {
      expect(screen.getByText('No workflows yet')).toBeInTheDocument();
    });
  });

  it('shows no matching message when search has no results', async () => {
    vi.useRealTimers();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockWorkflows,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ workflows: [], total: 0, page: 1, hasMore: false }),
      });

    renderWithContext(<WorkflowHistoryList searchDebounce={0} />);

    await waitFor(() => {
      expect(screen.getByText('Deploy API v2')).toBeInTheDocument();
    });

    const searchInput = screen.getByRole('searchbox');
    await userEvent.type(searchInput, 'nonexistent');

    await waitFor(() => {
      expect(screen.getByText('No matching workflows')).toBeInTheDocument();
    });
  });

  it('shows flyout trigger in collapsed mode', () => {
    renderWithContext(
      <WorkflowHistoryList />,
      { ...defaultContextValue, isCollapsed: true }
    );

    expect(screen.getByLabelText('Open workflow history')).toBeInTheDocument();
  });

  it('shows error state with retry button', async () => {
    vi.useRealTimers();
    mockFetch.mockRejectedValue(new Error('Network error'));

    renderWithContext(<WorkflowHistoryList />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load workflows')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Retry loading workflows')).toBeInTheDocument();
  });

  it('load more button appears when hasMore is true', async () => {
    vi.useRealTimers();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ...mockWorkflows, hasMore: true }),
    });

    renderWithContext(<WorkflowHistoryList />);

    await waitFor(() => {
      expect(screen.getByLabelText('Load more workflows')).toBeInTheDocument();
    });
  });

  it('filter chips are rendered with correct roles', async () => {
    vi.useRealTimers();
    renderWithContext(<WorkflowHistoryList />);

    await waitFor(() => {
      expect(screen.getByRole('radiogroup', { name: /filter by status/i })).toBeInTheDocument();
    });

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(4);
  });

  it('workflow items have accessible labels', async () => {
    vi.useRealTimers();
    renderWithContext(<WorkflowHistoryList />);

    await waitFor(() => {
      expect(
        screen.getByLabelText(/Deploy API v2, status: running/i)
      ).toBeInTheDocument();
    });
  });
});
