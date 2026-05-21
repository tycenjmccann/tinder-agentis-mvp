import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/**
 * Custom render function that wraps components with necessary providers.
 */
function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { route?: string }
) {
  const { route = '/', ...renderOptions } = options || {};

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
