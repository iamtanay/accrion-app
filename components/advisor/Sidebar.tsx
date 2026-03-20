'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Flag,
  Settings,
  LogOut
} from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const navigation = [
  { name: 'Dashboard', href: '/advisor/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/advisor/clients', icon: Users },
  { name: 'Reviews', href: '/advisor/reviews', icon: Calendar },
  { name: 'Flags', href: '/advisor/flags', icon: Flag },
  { name: 'Settings', href: '/advisor/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = () => {
    sessionStorage.removeItem('user')
    router.push('/login')
  }

  return (
    <div className="w-64 bg-bg-secondary border-r border-border h-screen flex flex-col fixed left-0 top-0">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h1 className="font-serif text-2xl text-fg-primary">Accrion.</h1>
        <p className="text-sm text-fg-muted mt-1">Advisory Platform</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded transition-all duration-120
                ${isActive
                  ? 'bg-accent text-white border-l-2 border-accent-warm'
                  : 'text-fg-secondary hover:bg-bg-tertiary hover:text-fg-primary'
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-2">
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-sm text-fg-secondary">Theme</span>
          <ThemeToggle />
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 w-full rounded transition-all duration-120
                     text-fg-secondary hover:bg-bg-tertiary hover:text-danger"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  )
}
