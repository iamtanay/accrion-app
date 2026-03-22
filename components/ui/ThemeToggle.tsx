'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '@/lib/theme-provider'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="p-2 w-9 h-9" />
  }

  // Show the icon of the mode you will SWITCH TO:
  // In dark mode  → show Sun  (click to go light)
  // In light mode → show Moon (click to go dark)
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded hover:bg-bg-tertiary transition-all duration-200"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative w-5 h-5">
        <Sun
          className={`absolute inset-0 w-5 h-5 text-fg-secondary transition-all duration-200 ${
            isDark ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0'
          }`}
        />
        <Moon
          className={`absolute inset-0 w-5 h-5 text-fg-secondary transition-all duration-200 ${
            isDark ? '-rotate-90 opacity-0' : 'rotate-0 opacity-100'
          }`}
        />
      </div>
    </button>
  )
}
