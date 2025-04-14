import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/utilities/utils'
import { useUIStore } from '@/store/ui-store'
import { 
  Home, 
  FileText, 
  Mic, 
  Settings, 
  User, 
  ChevronLeft, 
  ChevronRight,
  LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SidebarLinkProps {
  href: string
  icon: React.ReactNode
  label: string
  active?: boolean
}

const SidebarLink = ({ href, icon, label, active }: SidebarLinkProps) => {
  return (
    <Link 
      href={href} 
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
        "hover:bg-primary/10 hover:text-primary",
        active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
      )}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const [mounted, setMounted] = useState(false)
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) return null
  
  return (
    <div 
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col border-r bg-background transition-all duration-300 ease-in-out",
        sidebarOpen ? "w-64" : "w-16"
      )}
    >
      {/* Logo and toggle */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        <div className="flex items-center">
          {sidebarOpen && (
            <span className="text-xl font-bold text-primary">NDISuite</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </Button>
      </div>
      
      {/* Nav links */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="flex flex-col gap-1">
          <SidebarLink
            href="/dashboard"
            icon={<Home size={20} />}
            label="Dashboard"
            active={pathname === "/dashboard"}
          />
          <SidebarLink
            href="/report-generator"
            icon={<FileText size={20} />}
            label="Report Generator"
            active={pathname === "/report-generator"}
          />
          <SidebarLink
            href="/recordings"
            icon={<Mic size={20} />}
            label="Recordings"
            active={pathname === "/recordings"}
          />
        </nav>
      </div>
      
      {/* Footer links */}
      <div className="border-t py-4 px-3">
        <nav className="flex flex-col gap-1">
          <SidebarLink
            href="/profile"
            icon={<User size={20} />}
            label="Profile"
            active={pathname === "/profile"}
          />
          <SidebarLink
            href="/settings"
            icon={<Settings size={20} />}
            label="Settings"
            active={pathname === "/settings"}
          />
          <SidebarLink
            href="/logout"
            icon={<LogOut size={20} />}
            label="Logout"
            active={false}
          />
        </nav>
      </div>
    </div>
  )
}
