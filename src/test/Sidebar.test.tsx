import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SidebarProvider } from '../context/SidebarContext'
import { Header } from '../components/Header/Header'
import { Sidebar } from '../components/Sidebar/Sidebar'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <SidebarProvider>{children}</SidebarProvider>
      </QueryClientProvider>
    )
  }
}

function renderWithProviders() {
  return render(
    <>
      <Header />
      <Sidebar />
    </>,
    { wrapper: createWrapper() }
  )
}

describe('Sidebar', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('renders sidebar closed by default', () => {
    renderWithProviders()
    const sidebar = screen.getByTestId('sidebar')
    expect(sidebar).not.toHaveClass('sidebar--open')
  })

  it('toggles sidebar open when hamburger button is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    const toggleButton = screen.getByTestId('sidebar-toggle')
    await user.click(toggleButton)

    const sidebar = screen.getByTestId('sidebar')
    expect(sidebar).toHaveClass('sidebar--open')
  })

  it('toggles sidebar closed when button is clicked again', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    const toggleButton = screen.getByTestId('sidebar-toggle')
    await user.click(toggleButton)
    await user.click(toggleButton)

    const sidebar = screen.getByTestId('sidebar')
    expect(sidebar).not.toHaveClass('sidebar--open')
  })

  it('has correct ARIA attributes on toggle button', () => {
    renderWithProviders()
    const toggleButton = screen.getByTestId('sidebar-toggle')

    expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
    expect(toggleButton).toHaveAttribute('aria-controls', 'sidebar')
  })

  it('updates aria-expanded when sidebar opens', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    const toggleButton = screen.getByTestId('sidebar-toggle')
    await user.click(toggleButton)

    expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
  })

  it('has correct ARIA attributes on sidebar', () => {
    renderWithProviders()
    const sidebar = screen.getByTestId('sidebar')

    expect(sidebar).toHaveAttribute('role', 'navigation')
    expect(sidebar).toHaveAttribute('aria-label', 'Sidebar navigation')
    expect(sidebar).toHaveAttribute('id', 'sidebar')
  })

  it('closes sidebar when Escape key is pressed', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    // Open sidebar first
    const toggleButton = screen.getByTestId('sidebar-toggle')
    await user.click(toggleButton)

    const sidebar = screen.getByTestId('sidebar')
    expect(sidebar).toHaveClass('sidebar--open')

    // Press Escape
    fireEvent.keyDown(sidebar, { key: 'Escape' })

    expect(sidebar).not.toHaveClass('sidebar--open')
  })

  it('persists open state to localStorage', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    const toggleButton = screen.getByTestId('sidebar-toggle')
    await user.click(toggleButton)

    const stored = localStorage.getItem('agentis_sidebar_state')
    expect(stored).toBe('true')
  })

  it('persists closed state to localStorage', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    const toggleButton = screen.getByTestId('sidebar-toggle')
    await user.click(toggleButton) // open
    await user.click(toggleButton) // close

    const stored = localStorage.getItem('agentis_sidebar_state')
    expect(stored).toBe('false')
  })

  it('restores state from localStorage on mount', () => {
    localStorage.setItem('agentis_sidebar_state', 'true')
    renderWithProviders()

    // Wait for useEffect to run
    return waitFor(() => {
      const sidebar = screen.getByTestId('sidebar')
      expect(sidebar).toHaveClass('sidebar--open')
    })
  })

  it('renders agent status section', async () => {
    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByText('Agent Status')).toBeInTheDocument()
    })
  })

  it('renders workflow progress section', async () => {
    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByText('Workflow Progress')).toBeInTheDocument()
    })
  })

  it('renders tickets section', async () => {
    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByText('Tickets')).toBeInTheDocument()
    })
  })

  it('shows agent status data when loaded', async () => {
    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByTestId('agent-status-list')).toBeInTheDocument()
    })
  })

  it('shows workflow progress data when loaded', async () => {
    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByTestId('workflow-progress-list')).toBeInTheDocument()
    })
  })

  it('shows ticket links when loaded', async () => {
    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByTestId('ticket-links-list')).toBeInTheDocument()
    })
  })

  it('shows backdrop when sidebar is open on mobile', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    const toggleButton = screen.getByTestId('sidebar-toggle')
    await user.click(toggleButton)

    const backdrop = screen.getByTestId('sidebar-backdrop')
    expect(backdrop).toHaveClass('sidebar-backdrop--visible')
  })

  it('closes sidebar when backdrop is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    const toggleButton = screen.getByTestId('sidebar-toggle')
    await user.click(toggleButton)

    const backdrop = screen.getByTestId('sidebar-backdrop')
    await user.click(backdrop)

    const sidebar = screen.getByTestId('sidebar')
    expect(sidebar).not.toHaveClass('sidebar--open')
  })
})
