import { useState, useCallback } from 'react'

const STORAGE_KEY = 'agentis_sidebar_state'

function getInitialState(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      return JSON.parse(stored)
    }
  } catch {
    // localStorage not available or parse error, use default
  }
  return false
}

export function useSidebarState(): [boolean, (value: boolean) => void] {
  const [isOpen, setIsOpenInternal] = useState<boolean>(getInitialState)

  const setIsOpen = useCallback((value: boolean) => {
    setIsOpenInternal(value)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    } catch {
      // localStorage not available, fail silently
    }
  }, [])

  return [isOpen, setIsOpen]
}
