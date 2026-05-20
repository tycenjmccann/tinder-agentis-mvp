import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SidebarNavigation } from '../SidebarNavigation';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock matchMedia
window.matchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('SidebarNavigation', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ agents: [], workflows: [], total: 0, page: 1, hasMore: false }),
    });
  });

  it('renders sidebar with navigation role', () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);
    const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
    expect(sidebar).toBeInTheDocument();
  });

  it('renders brand text', () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);
    expect(screen.getByText('Agentis Hub')).toBeInTheDocument();
  });

  it('renders collapse toggle button', () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);
    const toggleBtn = screen.getByLabelText(/collapse sidebar/i);
    expect(toggleBtn).toBeInTheDocument();
  });

  it('toggles collapse state on button click', async () => {
    const user = userEvent.setup();
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    const toggleBtn = screen.getByLabelText(/collapse sidebar/i);
    await user.click(toggleBtn);

    // After collapse, button label changes
    expect(screen.getByLabelText(/expand sidebar/i)).toBeInTheDocument();
  });

  it('announces state change to screen readers', async () => {
    const user = userEvent.setup();
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    const toggleBtn = screen.getByLabelText(/collapse sidebar/i);
    await user.click(toggleBtn);

    const announcement = screen.getByText('Sidebar collapsed');
    expect(announcement).toBeInTheDocument();
    expect(announcement.closest('[aria-live]')).toHaveAttribute('aria-live', 'polite');
  });

  it('renders quick action buttons', () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);
    expect(screen.getByLabelText('New Workflow')).toBeInTheDocument();
    expect(screen.getByLabelText('View Logs')).toBeInTheDocument();
    expect(screen.getByLabelText('Settings')).toBeInTheDocument();
  });

  it('quick actions trigger navigation', async () => {
    const user = userEvent.setup();
    render(<SidebarNavigation onNavigate={mockNavigate} />);

    await user.click(screen.getByLabelText('New Workflow'));
    expect(mockNavigate).toHaveBeenCalledWith('/workflows/new');

    await user.click(screen.getByLabelText('View Logs'));
    expect(mockNavigate).toHaveBeenCalledWith('/logs');

    await user.click(screen.getByLabelText('Settings'));
    expect(mockNavigate).toHaveBeenCalledWith('/settings');
  });

  it('has aria-expanded attribute', () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);
    const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
    expect(sidebar).toHaveAttribute('aria-expanded', 'true');
  });

  it('starts collapsed when defaultCollapsed is true', () => {
    render(<SidebarNavigation onNavigate={mockNavigate} defaultCollapsed />);
    const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
    expect(sidebar).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders agent status region', () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);
    expect(screen.getByRole('region', { name: /agent status/i })).toBeInTheDocument();
  });

  it('renders workflow history region', () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);
    expect(screen.getByRole('region', { name: /workflow history/i })).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);
    expect(screen.getByRole('searchbox', { name: /search workflows/i })).toBeInTheDocument();
  });

  it('renders status filter', () => {
    render(<SidebarNavigation onNavigate={mockNavigate} />);
    expect(screen.getByRole('radiogroup', { name: /filter by status/i })).toBeInTheDocument();
  });
});
