// Test setup file
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Suppress console errors in tests (for expected error scenarios)
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // Suppress React act() warnings in tests
    if (
      typeof args[0] === 'string' &&
      args[0].includes('act()')
    ) {
      return;
    }
    originalConsoleError(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});
