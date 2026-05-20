import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkflowHistoryList } from '../WorkflowHistoryList';
import { SidebarContext } from '../SidebarContext';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

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
  const mockWorkflows = [
    { id: 'wf-1', title: 'Deploy API v2', status: 'running', createdAt: '2026-05-20T06:50:00Z', updatedAt: '2026-05-20T06:50:00Z' },
    { id: 'wf-2', title: 'Test Suite Run', status: 'completed', createdAt: '2026-05-20T06:40:00Z', updatedAt: '2026-05-20T06:45:00Z' },
    { id: 'wf-3', title: 'Data Migration', status: 'failed', createdAt: '2026-05-20T06:30:00Z', updatedAt: '2026-05-20T06:35:00Z' },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        workflows: mockWorkflows,
        total: 3,
        page: 1,
        hasMore: false,
      }),
    });
  });

  it('renders section title', async () => {
    vi.useRealTimers();
    renderWithContext(<WorkflowHistoryList />);

    // It should show WORKFLOWS title
    await screen.findByText('WORKFLOWS');
  });

  it('shows flyout trigger button in collapsed mode', () => {
    renderWithContext(
      <WorkflowHistoryList />,
      { ...defaultContextValue, isCollapsed: true }
    );

    expect(screen.getByLabelText(/open workflow history/i)).toBeInTheDocument();
  });

  it('opens flyout when trigger is clicked in collapsed mode', async () => {
    vi.useRealTimers();
    renderWithContext(
      <WorkflowHistoryList />,
      { ...defaultContextValue, isCollapsed: true }
    );

    const trigger = screen.getByLabelText(/open workflow history/i);
    await userEvent.click(trigger);

    expect(screen.getByRole('dialog', { name: /workflow history/i })).toBeInTheDocument();
  });

  it('shows search bar in expanded mode', async () => {
    vi.useRealTimers();
    renderWithContext(<WorkflowHistoryList />);

    await screen.findByRole('searchbox', { name: /search workflows/i });
  });

  it('shows status filter in expanded mode', async () => {
    vi.useRealTimers();
    renderWithContext(<WorkflowHistoryList />);

    await screen.findByRole('radiogroup', { name: /filter by status/i });
  });

  it('displays empty state when no workflows', async () => {
    vi.useRealTimers();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ workflows: [], total: 0, page: 1, hasMore: false }),
    });

    renderWithContext(<WorkflowHistoryList />);

    await screen.findByText('No workflows yet');
  });

  it('displays no results state when search has no matches', async () => {
    vi.useRealTimers();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ workflows: mockWorkflows, total: 3, page: 1, hasMore: false }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ workflows: [], total: 0, page: 1, hasMore: false }),
      });

    renderWithContext(<WorkflowHistoryList searchDebounce={0} />);

    await screen.findByText('Deploy API v2');

    const searchInput = screen.getByRole('searchbox');
    await userEvent.type(searchInput, 'nonexistent');

    await screen.findByText('No matching workflows');
  });

  it('calls onWorkflowClick when workflow item is clicked', async () => {
    vi.useRealTimers();
    const onWorkflowClick = vi.fn();
    renderWithContext(<WorkflowHistoryList onWorkflowClick={onWorkflowClick} />);

    const firstItem = await screen.findByLabelText(/Deploy API v2.*running/i);
    await userEvent.click(firstItem);

    expect(onWorkflowClick).toHaveBeenCalledWith(mockWorkflows[0]);
  });

  it('has proper region role and label', async () => {
    vi.useRealTimers();
    renderWithContext(<WorkflowHistoryList />);

    await screen.findByRole('region', { name: /workflow history/i });
  });
});
