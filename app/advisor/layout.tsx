'use client'

import { Sidebar } from '@/components/advisor/Sidebar'

export default function AdvisorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-bg-primary">
      <Sidebar />
      {/* On mobile: add top padding for the fixed top bar (48px). On desktop: left margin for sidebar. */}
      <main className="flex-1 pt-14 md:pt-0 md:ml-64 min-w-0">
        {children}
      </main>
    </div>
  )
}
