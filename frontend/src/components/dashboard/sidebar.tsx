"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth/auth-context'
import { buttonVariants } from '@/components/ui/button'
import { 
  Home, 
  FileText, 
  Mic, 
  Upload, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  FileEdit
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  open: boolean
  onToggle: () => void
}

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

export function Sidebar({ open, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { logout } = useAuth()

  const mainNavItems: NavItem[] = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: <Home className="h-5 w-5" />
    },
    {
      href: '/dashboard/reports',
      label: 'Reports',
      icon: <FileText className="h-5 w-5" />
    },
    {
      href: '/dashboard/report-generator',
      label: 'Report Generator',
      icon: <FileEdit className="h-5 w-5" />
    },
    {
      href: '/dashboard/recordings',
      label: 'Recordings',
      icon: <Mic className="h-5 w-5" />
    },
    {
      href: '/dashboard/uploads',
      label: 'Uploads',
      icon: <Upload className="h-5 w-5" />
    },
  ]

  const bottomNavItems: NavItem[] = [
    {
      href: '/dashboard/profile',
      label: 'Profile',
      icon: <User className="h-5 w-5" />
    },
    {
      href: '/dashboard/settings',
      label: 'Settings',
      icon: <Settings className="h-5 w-5" />
    },
  ]

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href
    
    return (
      <Link 
        href={item.href} 
        className={cn(
          "flex items-center py-3 px-3 rounded-md text-sm transition-colors",
          open ? "justify-start" : "justify-center",
          isActive 
            ? "bg-primary/10 text-primary font-medium" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <span className={open ? "mr-3" : ""}>{item.icon}</span>
        {open && <span>{item.label}</span>}
      </Link>
    )
  }

  return (
    <aside 
      className={cn(
        "fixed inset-y-0 left-0 z-10 flex flex-col border-r bg-card shadow-sm transition-all duration-300",
        open ? "w-64" : "w-20"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex h-16 items-center border-b px-4",
        open ? "justify-between" : "justify-center"
      )}>
        {open && (
          <Link href="/dashboard" className="flex items-center">
            <span className="text-xl font-bold text-primary">NDISuite</span>
          </Link>
        )}
        <button
          onClick={onToggle}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
          aria-label={open ? "Close sidebar" : "Open sidebar"}
        >
          {open ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {mainNavItems.map((item) => (
            <li key={item.href}>
              <NavLink item={item} />
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom navigation */}
      <div className="border-t p-2">
        <ul className="space-y-1">
          {bottomNavItems.map((item) => (
            <li key={item.href}>
              <NavLink item={item} />
            </li>
          ))}
          <li>
            <button
              onClick={logout}
              className={cn(
                "flex w-full items-center py-3 px-3 rounded-md text-sm transition-colors text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20",
                open ? "justify-start" : "justify-center",
              )}
            >
              <span className={open ? "mr-3" : ""}><LogOut className="h-5 w-5" /></span>
              {open && <span>Logout</span>}
            </button>
          </li>
        </ul>
      </div>
    </aside>
  )
}
