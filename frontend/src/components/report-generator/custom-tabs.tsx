"use client"

import React, { useState } from 'react'
import { cn } from '@/lib/utils'

interface TabProps {
  id: string
  label: string
  isActive: boolean
  onClick: () => void
}

const Tab: React.FC<TabProps> = ({ id, label, isActive, onClick }) => {
  return (
    <button
      id={id}
      onClick={onClick}
      className={cn(
        "px-4 py-2 text-sm font-medium rounded-md transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
        isActive 
          ? "bg-white text-blue-600 shadow-sm" 
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      )}
    >
      {label}
    </button>
  )
}

interface TabsProps {
  tabs: { id: string; label: string }[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

export const CustomTabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="w-full mb-4">
      <div className="flex overflow-x-auto space-x-2 p-1 bg-gray-50 rounded-lg">
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            id={tab.id}
            label={tab.label}
            isActive={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          />
        ))}
      </div>
    </div>
  )
}

interface TabPanelProps {
  id: string
  activeTab: string
  children: React.ReactNode
}

export const TabPanel: React.FC<TabPanelProps> = ({ id, activeTab, children }) => {
  if (id !== activeTab) return null
  
  return <div className="w-full">{children}</div>
}
