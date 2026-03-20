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
      <main className="flex-1 ml-64">
        {children}
      </main>
    </div>
  )
}
