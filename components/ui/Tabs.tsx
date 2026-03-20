'use client'

import { useState } from 'react'

export interface Tab {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  onTabChange?: (tabId: string) => void
  children: (activeTab: string) => React.ReactNode
}

export function Tabs({ tabs, defaultTab, onTabChange, children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    onTabChange?.(tabId)
  }

  return (
    <div>
      <div className="border-b border-border">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-3 text-sm font-medium transition-all duration-150 border-b-2 flex items-center gap-2
                  ${isActive
                    ? 'border-accent text-accent'
                    : 'border-transparent text-fg-muted hover:text-fg-secondary hover:border-border'
                  }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>
      <div className="py-6">
        {children(activeTab)}
      </div>
    </div>
  )
}
