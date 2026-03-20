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
    return (
      <div className="p-2 w-9 h-9" />
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded hover:bg-bg-tertiary transition-all duration-200 group"
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        <Sun
          className={`absolute inset-0 w-5 h-5 text-fg-secondary transition-all duration-200 ${
            theme === 'dark' ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'
          }`}
        />
        <Moon
          className={`absolute inset-0 w-5 h-5 text-fg-secondary transition-all duration-200 ${
            theme === 'dark' ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'
          }`}
        />
      </div>
    </button>
  )
}
