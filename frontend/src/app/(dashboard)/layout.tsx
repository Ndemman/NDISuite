"use client"

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth/auth-context'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import { cn } from '@/utilities/utils'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { isAuthenticated, isLoading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Handle sidebar toggle
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  return (
    <div className="min-h-screen flex dark:bg-background">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onToggle={toggleSidebar} />
      
      {/* Main content */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        sidebarOpen ? "md:ml-64" : "md:ml-20"
      )}>
        {/* Header */}
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        
        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
