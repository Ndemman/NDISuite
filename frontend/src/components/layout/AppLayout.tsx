import React, { ReactNode } from 'react';
import { Sidebar } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const router = useRouter();
  
  // Function to get the current page title based on the route
  const getPageTitle = () => {
    if (router.pathname === '/dashboard') {
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
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header - Fixed position with z-index to stay on top */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm">
          <Link href="/dashboard" className="flex items-center space-x-2 hover:opacity-90 transition-opacity">
            <div className="flex items-center justify-center bg-primary text-primary-foreground w-8 h-8 rounded-md shadow-sm">
              <span className="font-bold text-md">ND</span>
            </div>
            <h1 className="text-xl font-medium">{getPageTitle()}</h1>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="h-8 w-8 rounded-full bg-primary/90 text-white grid place-items-center shadow-sm">
              <span className="text-sm font-medium">ND</span>
            </div>
          </div>
        </header>
        
        {/* Content Area - scrollable beneath fixed header */}
        <main className="flex-1 overflow-auto bg-background">
          <div className="p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
