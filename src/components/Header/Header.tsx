import { useRef } from 'react'
import { Menu, X } from 'lucide-react'
import { useSidebarContext } from '../../context/SidebarContext'
import './Header.css'

export function Header() {
  const { isOpen, toggle } = useSidebarContext()
  const buttonRef = useRef<HTMLButtonElement>(null)

  return (
    <header className="header">
      <button
        ref={buttonRef}
        className="header__toggle"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls="sidebar"
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
        data-testid="sidebar-toggle"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      <h1 className="header__title">Agentis Hub</h1>
    </header>
  )
}
