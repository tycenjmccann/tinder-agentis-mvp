import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { SidebarNavigation } from '../SidebarNavigation';

// Extend expect with axe matchers
expect.extend(toHaveNoViolations);

// Mock fetch
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

describe('Sidebar Accessibility (axe-core)', () => {
  const mockNavigate = vi.fn();

  const mockAgents = [
    { id: 'agent-1', name: 'Frontend Dev', role: 'Frontend Developer', status: 'active', lastActivity: '2026-05-20T06:50:00Z' },
    { id: 'agent-2', name: 'Backend Dev', role: 'Backend Developer', status: 'idle', lastActivity: '2026-05-20T06:40:00Z' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ agents: mockAgents, workflows: [], total: 0, page: 1, hasMore: false }),
    });
  });

  it('expanded sidebar has no accessibility violations', async () => {
    const { container } = render(
      <SidebarNavigation onNavigate={mockNavigate} />
    );

    // Wait for initial render to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('collapsed sidebar has no accessibility violations', async () => {
    const { container } = render(
      <SidebarNavigation onNavigate={mockNavigate} defaultCollapsed />
    );

    // Wait for initial render to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
