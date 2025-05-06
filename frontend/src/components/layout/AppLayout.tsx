import React, { ReactNode, useState, useEffect } from 'react';
import { Sidebar } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Home } from 'lucide-react';

// Define standard sizes for various UI elements
const UI_SIZES = {
  // Header elements
  headerLogo: 'w-7 h-7',
  headerAvatar: 'w-7 h-7',
  // Navigation
  navIcon: 'w-5 h-5',
  // Content areas
  contentPadding: 'p-6 md:p-8',
  // Spacing
  gap: 'gap-4',
};

// Sidebar widths
const SIDEBAR_WIDTHS = {
  collapsed: 'w-16',
  expanded: 'w-44', // Further reduced width to match highlight indicator
  mobileCollapsed: 'w-0',
  mobileExpanded: 'w-44',
};

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const router = useRouter();
  
  // Get sidebar state from localStorage
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  
  // Check localStorage for sidebar state on page load
  useEffect(() => {
    const storedState = localStorage.getItem('sidebarExpanded');
    if (storedState !== null) {
      setIsSidebarExpanded(storedState === 'true');
    }
  }, []);
  
  // Listen for changes to localStorage from sidebar toggle
  useEffect(() => {
    const handleStorageChange = () => {
      const storedState = localStorage.getItem('sidebarExpanded');
      if (storedState !== null) {
        setIsSidebarExpanded(storedState === 'true');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // Function to get the current page title based on the route
  const getPageTitle = () => {
    if (router.pathname === '/dashboard' || router.pathname === '/') {
      return 'Dashboard';
    } else if (router.pathname.includes('/reports/new')) {
      return 'New Report';
    } else if (router.pathname.includes('/reports')) {
      return 'Report Panel';
    } else if (router.pathname.includes('/scheduling')) {
      return 'Scheduling';
    } else if (router.pathname.includes('/billing')) {
      return 'Billing';
    } else if (router.pathname.includes('/clients')) {
      return 'Clients';
    } else if (router.pathname.includes('/team')) {
      return 'Team Hub';
    } else if (router.pathname.includes('/settings')) {
      return 'Settings';
    }
    return 'NDISuite Report Generator';
  };
  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Left side: Sidebar with connected header */}
      <aside className={`h-screen fixed left-0 top-0 bottom-0 z-50 bg-card border-r border-border shadow-sm transition-width duration-300 ease-in-out ${isSidebarExpanded ? SIDEBAR_WIDTHS.expanded : SIDEBAR_WIDTHS.collapsed}`}>
        {/* Sidebar Component */}
        <Sidebar showHeader={true} />
      </aside>
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col ml-16 transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'ml-44' : 'ml-16'}`}>
        {/* Top Header - Connected visually to sidebar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 md:px-6 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
            <h1 className="text-2xl font-medium">{getPageTitle()}</h1>
          </div>
          <nav className="flex items-center space-x-5">
            {/* Always visible dashboard link */}
            <Link 
              href="/dashboard" 
              className="flex items-center space-x-2 px-3 py-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
            >
              <Home size={16} />
              <span className="text-sm font-medium">Dashboard</span>
            </Link>
            <ThemeToggle />
            <div className={`${UI_SIZES.headerAvatar} rounded-full bg-primary/90 text-white grid place-items-center shadow-sm`}>
              <span className="text-sm font-medium">ND</span>
            </div>
          </nav>
        </header>
        
        {/* Content Area - scrollable beneath fixed header */}
        <main className="flex-1 overflow-auto bg-background">
          <div className={`${UI_SIZES.contentPadding} max-w-7xl mx-auto`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
