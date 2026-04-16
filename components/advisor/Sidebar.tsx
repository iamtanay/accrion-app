'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Flag,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { createClient } from '@/lib/supabase/client'

const navigation = [
  { name: 'Dashboard', href: '/advisor/dashboard', icon: LayoutDashboard },
  { name: 'Clients',   href: '/advisor/clients',   icon: Users },
  { name: 'Reviews',   href: '/advisor/reviews',   icon: Calendar },
  { name: 'Flags',     href: '/advisor/flags',     icon: Flag },
  { name: 'Settings',  href: '/advisor/settings',  icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const NavLinks = ({ onNav }: { onNav?: () => void }) => (
    <>
      {navigation.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNav}
            className={`
              flex items-center gap-3 px-4 py-3 rounded transition-all duration-120
              ${isActive
                ? 'bg-accent text-white'
                : 'text-fg-secondary hover:bg-bg-tertiary hover:text-fg-primary'
              }
            `}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{item.name}</span>
          </Link>
        )
      })}
    </>
  )

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <div className="hidden md:flex w-64 bg-bg-secondary border-r border-border h-screen flex-col fixed left-0 top-0 z-30">
        <div className="p-6 border-b border-border">
          <h1 className="font-serif text-2xl text-fg-primary">Accrion.</h1>
          <p className="text-sm text-fg-muted mt-1">Advisory Platform</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavLinks />
        </nav>
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

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-bg-secondary border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="font-serif text-xl text-fg-primary">Accrion.</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded hover:bg-bg-tertiary transition-colors text-fg-secondary"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="relative w-72 bg-bg-secondary h-full flex flex-col shadow-2xl">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h1 className="font-serif text-xl text-fg-primary">Accrion.</h1>
                <p className="text-xs text-fg-muted mt-0.5">Advisory Platform</p>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded hover:bg-bg-tertiary transition-colors text-fg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              <NavLinks onNav={() => setMobileOpen(false)} />
            </nav>
            <div className="p-4 border-t border-border">
              <button
                onClick={() => { setMobileOpen(false); handleSignOut() }}
                className="flex items-center gap-3 px-4 py-3 w-full rounded transition-all
                           text-fg-secondary hover:bg-bg-tertiary hover:text-danger"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
