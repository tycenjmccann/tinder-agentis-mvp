import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentStatusPanel } from '../AgentStatusPanel';
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

describe('AgentStatusPanel', () => {
  const mockAgents = [
    { id: 'agent-1', name: 'Frontend Dev', role: 'Frontend Developer', status: 'active', lastActivity: '2026-05-20T06:50:00Z' },
    { id: 'agent-2', name: 'Backend Dev', role: 'Backend Developer', status: 'idle', lastActivity: '2026-05-20T06:40:00Z' },
    { id: 'agent-3', name: 'QA Agent', role: 'QA Engineer', status: 'error', lastActivity: '2026-05-20T06:30:00Z' },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ agents: mockAgents }),
    });
  });

  it('displays loading skeletons initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // never resolves

    renderWithContext(<AgentStatusPanel />);

    expect(screen.getByRole('region', { name: /agent status/i })).toBeInTheDocument();
    expect(screen.getByText('AGENTS')).toBeInTheDocument();
  });

  it('displays agent list after loading', async () => {
    vi.useRealTimers();
    renderWithContext(<AgentStatusPanel />);

    await waitFor(() => {
      expect(screen.getByText('Frontend Dev')).toBeInTheDocument();
    });

    expect(screen.getByText('Backend Dev')).toBeInTheDocument();
    expect(screen.getByText('QA Agent')).toBeInTheDocument();
  });

  it('displays status summary counts', async () => {
    vi.useRealTimers();
    renderWithContext(<AgentStatusPanel />);

    await waitFor(() => {
      expect(screen.getByText('1 Active')).toBeInTheDocument();
    });

    expect(screen.getByText('1 Idle')).toBeInTheDocument();
    expect(screen.getByText('1 Error')).toBeInTheDocument();
  });

  it('navigates when agent is clicked', async () => {
    vi.useRealTimers();
    const onAgentClick = vi.fn();
    renderWithContext(<AgentStatusPanel onAgentClick={onAgentClick} />);

    await waitFor(() => {
      expect(screen.getByText('Frontend Dev')).toBeInTheDocument();
    });

    await userEvent.click(
      screen.getByLabelText(/Frontend Dev.*status: active/i)
    );
    expect(onAgentClick).toHaveBeenCalledWith(mockAgents[0]);
  });

  it('shows dots in collapsed mode', async () => {
    vi.useRealTimers();
    renderWithContext(
      <AgentStatusPanel />,
      { ...defaultContextValue, isCollapsed: true }
    );

    await waitFor(() => {
      expect(
        screen.getByLabelText(/Frontend Dev.*status: active/i)
      ).toBeInTheDocument();
    });
  });

  it('shows empty state when no agents', async () => {
    vi.useRealTimers();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ agents: [] }),
    });

    renderWithContext(<AgentStatusPanel />);

    await waitFor(() => {
      expect(screen.getByText('No agents configured')).toBeInTheDocument();
    });
  });

  it('agent items have proper ARIA labels', async () => {
    vi.useRealTimers();
    renderWithContext(<AgentStatusPanel />);

    await waitFor(() => {
      expect(
        screen.getByLabelText('Frontend Dev, Frontend Developer, status: active')
      ).toBeInTheDocument();
    });
  });
});
