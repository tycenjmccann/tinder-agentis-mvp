import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SidebarNavigation } from '../SidebarNavigation';

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock matchMedia
window.matchMedia = vi.fn((query: string) => ({
  matches: false,
  media: query,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
})) as any;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('SidebarNavigation', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ agents: [], workflows: [], total: 0, page: 1, hasMore: false }),
    });
  });

  it('renders with correct ARIA attributes', () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    const sidebar = screen.getByRole('navigation', { name: /sidebar navigation/i });
    expect(sidebar).toBeInTheDocument();
    expect(sidebar).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders brand text in expanded mode', () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);
    expect(screen.getByText('Agentis Hub')).toBeInTheDocument();
  });

  it('collapses when toggle button is clicked', async () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    const toggleButton = screen.getByLabelText(/collapse sidebar/i);
    await userEvent.click(toggleButton);

    const sidebar = screen.getByRole('navigation', { name: /sidebar navigation/i });
    expect(sidebar).toHaveAttribute('aria-expanded', 'false');
    expect(sidebar).toHaveClass('sidebar--collapsed');
  });

  it('expands when toggle button is clicked in collapsed state', async () => {
    render(<SidebarNavigation onNavigate={mockNavigate} defaultCollapsed />);

    const toggleButton = screen.getByLabelText(/expand sidebar/i);
    await userEvent.click(toggleButton);

    const sidebar = screen.getByRole('navigation', { name: /sidebar navigation/i });
    expect(sidebar).toHaveAttribute('aria-expanded', 'true');
  });

  it('announces collapse/expand state to screen readers', async () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();

    const toggleButton = screen.getByLabelText(/collapse sidebar/i);
    await userEvent.click(toggleButton);

    expect(liveRegion).toHaveTextContent('Sidebar collapsed');
  });

  it('renders Quick Actions buttons', () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    expect(screen.getByLabelText('New Workflow')).toBeInTheDocument();
    expect(screen.getByLabelText('View Logs')).toBeInTheDocument();
    expect(screen.getByLabelText('Settings')).toBeInTheDocument();
  });

  it('navigates when Quick Action buttons are clicked', async () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    await userEvent.click(screen.getByLabelText('New Workflow'));
    expect(mockNavigate).toHaveBeenCalledWith('/workflows/new');

    await userEvent.click(screen.getByLabelText('View Logs'));
    expect(mockNavigate).toHaveBeenCalledWith('/logs');

    await userEvent.click(screen.getByLabelText('Settings'));
    expect(mockNavigate).toHaveBeenCalledWith('/settings');
  });

  it('persists collapse state to localStorage', async () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    const toggleButton = screen.getByLabelText(/collapse sidebar/i);
    await userEvent.click(toggleButton);

    expect(localStorageMock.getItem('sidebar_collapsed')).toBe('true');
  });

  it('responds to keyboard shortcut [ ] for toggle', () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    fireEvent.keyDown(document, { key: '[' });

    const sidebar = screen.getByRole('navigation', { name: /sidebar navigation/i });
    expect(sidebar).toHaveClass('sidebar--collapsed');
  });

  it('does not toggle on keyboard shortcut when input is focused', () => {
    render(
      <div>
        <SidebarNavigation onNavigate={mockNavigate} />
        <input data-testid="test-input" />
      </div>
    );

    const input = screen.getByTestId('test-input');
    input.focus();
    fireEvent.keyDown(input, { key: '[' });

    const sidebar = screen.getByRole('navigation', { name: /sidebar navigation/i });
    expect(sidebar).not.toHaveClass('sidebar--collapsed');
  });

  it('renders agent status region', () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);
    expect(screen.getByRole('region', { name: /agent status/i })).toBeInTheDocument();
  });

  it('renders workflow history region', () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);
    expect(screen.getByRole('region', { name: /workflow history/i })).toBeInTheDocument();
  });
});
