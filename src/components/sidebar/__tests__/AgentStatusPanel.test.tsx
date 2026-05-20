import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentStatusPanel } from '../AgentStatusPanel';
import { SidebarContext } from '../SidebarContext';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockAgents = {
  agents: [
    { id: 'agent-1', name: 'Frontend Dev', role: 'frontend', status: 'active', lastActivity: '2026-01-01T00:00:00Z' },
    { id: 'agent-2', name: 'Backend Dev', role: 'backend', status: 'idle', lastActivity: '2026-01-01T00:00:00Z' },
    { id: 'agent-3', name: 'QA Agent', role: 'qa', status: 'error', lastActivity: '2026-01-01T00:00:00Z' },
  ],
};

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

function renderWithContext(
  ui: React.ReactElement,
  contextValue = defaultContext
) {
  return render(
    <SidebarContext.Provider value={contextValue}>{ui}</SidebarContext.Provider>
  );
}

describe('AgentStatusPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockAgents),
    });
  });

  it('renders agent status region', async () => {
    renderWithContext(<AgentStatusPanel />);
    expect(screen.getByRole('region', { name: /agent status/i })).toBeInTheDocument();
  });

  it('shows loading skeletons initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // never resolves
    renderWithContext(<AgentStatusPanel />);
    expect(screen.getByText('AGENTS')).toBeInTheDocument();
  });

  it('displays agents after fetch', async () => {
    renderWithContext(<AgentStatusPanel />);

    await waitFor(() => {
      expect(screen.getByText('Frontend Dev')).toBeInTheDocument();
    });

    expect(screen.getByText('Backend Dev')).toBeInTheDocument();
    expect(screen.getByText('QA Agent')).toBeInTheDocument();
  });

  it('shows status summary counts', async () => {
    renderWithContext(<AgentStatusPanel />);

    await waitFor(() => {
      expect(screen.getByText('1 Active')).toBeInTheDocument();
    });
    expect(screen.getByText('1 Idle')).toBeInTheDocument();
    expect(screen.getByText('1 Error')).toBeInTheDocument();
  });

  it('calls onAgentClick when agent is clicked', async () => {
    const user = userEvent.setup();
    const onAgentClick = vi.fn();
    renderWithContext(<AgentStatusPanel onAgentClick={onAgentClick} />);

    await waitFor(() => {
      expect(screen.getByText('Frontend Dev')).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole('listitem', { name: /Frontend Dev/ })
    );
    expect(onAgentClick).toHaveBeenCalledWith(mockAgents.agents[0]);
  });

  it('renders dots in collapsed mode', async () => {
    renderWithContext(
      <AgentStatusPanel />,
      { ...defaultContext, isCollapsed: true }
    );

    await waitFor(() => {
      const dots = screen.getAllByRole('button');
      expect(dots.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('shows stale indicator on error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    renderWithContext(<AgentStatusPanel />);

    await waitFor(() => {
      expect(screen.getByText('Status unavailable')).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/retry/i)).toBeInTheDocument();
  });

  it('agents have proper aria-labels', async () => {
    renderWithContext(<AgentStatusPanel />);

    await waitFor(() => {
      const agentBtn = screen.getByRole('listitem', {
        name: /Frontend Dev, frontend, status: active/i,
      });
      expect(agentBtn).toBeInTheDocument();
    });
  });
});
