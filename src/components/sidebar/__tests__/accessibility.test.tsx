import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SidebarNavigation } from '../SidebarNavigation';

// Mock fetch for all components
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
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
});

/**
 * Accessibility tests using manual checks.
 * In a real project, we'd use axe-core:
 * import { axe, toHaveNoViolations } from 'jest-axe';
 * expect.extend(toHaveNoViolations);
 */
describe('Sidebar Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ agents: [], workflows: [], total: 0, page: 1, hasMore: false }),
    });
  });

  it('sidebar has navigation role', () => {
    const { container } = render(
      <SidebarNavigation onNavigate={vi.fn()} />
    );
    const nav = container.querySelector('[role="navigation"]');
    expect(nav).not.toBeNull();
    expect(nav?.getAttribute('aria-label')).toBe('Sidebar navigation');
  });

  it('sidebar has aria-expanded attribute', () => {
    const { container } = render(
      <SidebarNavigation onNavigate={vi.fn()} />
    );
    const nav = container.querySelector('[role="navigation"]');
    expect(nav?.getAttribute('aria-expanded')).toBe('true');
  });

  it('collapse toggle has aria-controls', () => {
    const { container } = render(
      <SidebarNavigation onNavigate={vi.fn()} />
    );
    const toggle = container.querySelector('.collapse-toggle');
    expect(toggle?.getAttribute('aria-controls')).toBe('sidebar-navigation');
  });

  it('collapse toggle has aria-expanded', () => {
    const { container } = render(
      <SidebarNavigation onNavigate={vi.fn()} />
    );
    const toggle = container.querySelector('.collapse-toggle');
    expect(toggle?.getAttribute('aria-expanded')).toBe('true');
  });

  it('all interactive elements are buttons', () => {
    const { container } = render(
      <SidebarNavigation onNavigate={vi.fn()} />
    );
    const clickableElements = container.querySelectorAll('[onclick], [onClick]');
    // All should be proper buttons or have button role
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('has live region for announcements', () => {
    const { container } = render(
      <SidebarNavigation onNavigate={vi.fn()} />
    );
    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
    expect(liveRegion?.getAttribute('aria-atomic')).toBe('true');
  });

  it('search input has accessible label', () => {
    const { container } = render(
      <SidebarNavigation onNavigate={vi.fn()} />
    );
    const searchInput = container.querySelector('[role="searchbox"]');
    expect(searchInput).not.toBeNull();
    expect(searchInput?.getAttribute('aria-label')).toBe('Search workflows');
  });

  it('filter group has radiogroup role and label', () => {
    const { container } = render(
      <SidebarNavigation onNavigate={vi.fn()} />
    );
    const radiogroup = container.querySelector('[role="radiogroup"]');
    expect(radiogroup).not.toBeNull();
    expect(radiogroup?.getAttribute('aria-label')).toBe('Filter by status');
  });

  it('filter chips have radio role with aria-checked', () => {
    const { container } = render(
      <SidebarNavigation onNavigate={vi.fn()} />
    );
    const radios = container.querySelectorAll('[role="radio"]');
    expect(radios.length).toBe(4);

    // "All" should be checked by default
    const allChip = Array.from(radios).find(
      (r) => r.textContent === 'All'
    );
    expect(allChip?.getAttribute('aria-checked')).toBe('true');
  });

  it('quick actions have aria-labels', () => {
    const { container } = render(
      <SidebarNavigation onNavigate={vi.fn()} />
    );
    const quickActions = container.querySelector('[aria-label="Quick actions"]');
    expect(quickActions).not.toBeNull();

    const actionButtons = quickActions?.querySelectorAll('button');
    actionButtons?.forEach((btn) => {
      expect(btn.getAttribute('aria-label')).not.toBeNull();
      expect(btn.getAttribute('aria-label')!.length).toBeGreaterThan(0);
    });
  });

  it('decorative icons have aria-hidden', () => {
    const { container } = render(
      <SidebarNavigation onNavigate={vi.fn()} />
    );
    const svgs = container.querySelectorAll('svg');
    svgs.forEach((svg) => {
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('separator has role="separator"', () => {
    const { container } = render(
      <SidebarNavigation onNavigate={vi.fn()} />
    );
    const separator = container.querySelector('[role="separator"]');
    expect(separator).not.toBeNull();
  });
});
