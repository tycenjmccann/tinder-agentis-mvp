import { useEffect, useRef, useCallback } from 'react'
import { useSidebarContext } from '../../context/SidebarContext'
import { AgentStatusList } from './AgentStatusList'
import { WorkflowProgress } from './WorkflowProgress'
import { TicketLinks } from './TicketLinks'
import './Sidebar.css'

export function Sidebar() {
  const { isOpen, setIsOpen } = useSidebarContext()
  const sidebarRef = useRef<HTMLElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Focus management: move focus into sidebar on open
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      // Small delay to allow transition to start
      const timer = setTimeout(() => {
        sidebarRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    } else {
      // Return focus to trigger on close
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
        previousFocusRef.current = null
      }
    }
  }, [isOpen])

  // Escape key closes sidebar
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    },
    [setIsOpen]
  )

  // Backdrop click closes sidebar (mobile)
  const handleBackdropClick = useCallback(() => {
    setIsOpen(false)
  }, [setIsOpen])

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`sidebar-backdrop ${isOpen ? 'sidebar-backdrop--visible' : ''}`}
        onClick={handleBackdropClick}
        aria-hidden="true"
        data-testid="sidebar-backdrop"
      />

      {/* Sidebar navigation */}
      <nav
        ref={sidebarRef}
        id="sidebar"
        className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}
        role="navigation"
        aria-label="Sidebar navigation"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        data-testid="sidebar"
      >
        <div className="sidebar__content">
          <section className="sidebar__section">
            <h2 className="sidebar__section-title">Agent Status</h2>
            <AgentStatusList />
          </section>

          <section className="sidebar__section">
            <h2 className="sidebar__section-title">Workflow Progress</h2>
            <WorkflowProgress />
          </section>

          <section className="sidebar__section">
            <h2 className="sidebar__section-title">Tickets</h2>
            <TicketLinks />
          </section>
        </div>
      </nav>
    </>
  )
}
