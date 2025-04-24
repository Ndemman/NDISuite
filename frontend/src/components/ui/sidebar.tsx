import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Home, 
  FileText, 
  Calendar, 
  DollarSign, 
  Users, 
  UserPlus, 
  ChevronLeft,
  ChevronRight, 
  Settings,
  User,
  LogOut
} from 'lucide-react';
import authService from '@/api/authService';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  expanded: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ 
  href, 
  icon, 
  label, 
  active = false, 
  disabled = false,
  expanded
}) => {
  // Full-width highlight without rounded corners
  const baseClasses = "flex items-center gap-4 px-4 py-2.5 my-0.5 w-full transition-all duration-200";
  const activeClasses = active 
    ? "bg-primary/10 text-primary font-medium border-l-2 border-primary" 
    : "hover:bg-primary/5 text-muted-foreground hover:text-foreground";
  const disabledClasses = disabled 
    ? "opacity-70 cursor-not-allowed hover:bg-transparent text-muted-foreground" 
    : "cursor-pointer";
  
  const content = (
    <div className={`${baseClasses} ${activeClasses} ${disabledClasses}`}>
      {/* Always show icon, with appropriate color based on active state */}
      <span className="text-lg text-inherit">{icon}</span>
      {expanded && <span className="text-sm font-medium">{label}</span>}
      {expanded && disabled && <span className="ml-auto text-xs italic text-muted-foreground">Soon</span>}
    </div>
  );

  if (disabled) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
};

// Define standardized icon sizes as constants
const ICON_SIZES = {
  navigation: 20, // Navigation item icons
  toggle: 18,     // Toggle/expand/collapse icons
};

interface SidebarProps {
  showHeader?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ showHeader = true }) => {
  const router = useRouter();
  // Initialize from localStorage if available, default to true
  const storedExpandedState = typeof window !== 'undefined' ? localStorage.getItem('sidebarExpanded') : null;
  const initialExpanded = storedExpandedState !== null ? storedExpandedState === 'true' : true;
  const [expanded, setExpanded] = useState(initialExpanded);

  const isActive = (path: string) => router.pathname === path || router.pathname.startsWith(`${path}/`);
  
  // Toggle expanded state and store in localStorage
  const toggleExpanded = () => {
    const newState = !expanded;
    setExpanded(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarExpanded', newState.toString());
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    authService.logout();
    router.push('/auth/login');
  };

  return (
    <div className={`h-screen flex flex-col transition-all duration-300 ${expanded ? 'w-56' : 'w-16'}`}>
      {/* Logo & Header - exact height match with main header */}
      <div className="h-16 border-b border-border flex justify-between items-center px-4">
        {expanded ? (
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center bg-primary text-primary-foreground w-8 h-8 rounded-md shadow-md">
              <span className="font-bold text-sm">ND</span>
            </div>
            <div className="font-semibold text-lg">NDISuite</div>
          </div>
        ) : (
          <div className="mx-auto flex items-center justify-center bg-primary text-primary-foreground w-8 h-8 rounded-md shadow-md">
            <span className="font-bold text-sm">ND</span>
          </div>
        )}
        <button 
          onClick={toggleExpanded}
          className="p-1.5 rounded-md hover:bg-primary hover:bg-opacity-10 text-muted-foreground hover:text-primary transition-colors"
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {expanded ? <ChevronLeft size={ICON_SIZES.toggle} /> : <ChevronRight size={ICON_SIZES.toggle} />}
        </button>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 py-8 flex flex-col px-4 overflow-y-auto">
        {/* Active Features Section */}
        <div className="space-y-1 mb-8">
          <NavItem 
            href="/dashboard" 
            icon={<Home size={ICON_SIZES.navigation} />} 
            label="Dashboard" 
            active={isActive('/dashboard')} 
            expanded={expanded}
          />
          <NavItem 
            href="/reports" 
            icon={<FileText size={ICON_SIZES.navigation} />} 
            label="Report Panel" 
            active={isActive('/reports')} 
            expanded={expanded}
          />
        </div>
        
        {/* Coming Soon Features - Moved to main area but greyed out */}
        <div className="mb-8">
          {expanded && <div className="text-xs uppercase text-muted-foreground font-medium mb-2 px-2">Coming Soon</div>}
          <NavItem 
            href="/scheduling" 
            icon={<Calendar size={ICON_SIZES.navigation} />} 
            label="Scheduling" 
            disabled={true} 
            expanded={expanded}
          />
          <NavItem 
            href="/billing" 
            icon={<DollarSign size={ICON_SIZES.navigation} />} 
            label="Billing" 
            disabled={true} 
            expanded={expanded}
          />
          <NavItem 
            href="/clients" 
            icon={<Users size={ICON_SIZES.navigation} />} 
            label="Clients" 
            disabled={true} 
            expanded={expanded}
          />
          <NavItem 
            href="/team" 
            icon={<UserPlus size={ICON_SIZES.navigation} />} 
            label="Team Hub" 
            disabled={true} 
            expanded={expanded}
          />
        </div>

        {/* Empty space to push the bottom items down */}
        <div className="flex-grow"></div>

        {/* Bottom navigation items */}
        <div className="space-y-1 mb-2">
          <NavItem 
            href="/profile" 
            icon={<User size={ICON_SIZES.navigation} />} 
            label="Profile" 
            active={isActive('/profile')} 
            expanded={expanded}
          />
          <NavItem 
            href="/settings" 
            icon={<Settings size={ICON_SIZES.navigation} />} 
            label="Settings" 
            active={isActive('/settings')} 
            expanded={expanded}
          />
          {/* Logout button */}
          <div 
            onClick={handleLogout}
            className={`flex items-center gap-4 px-4 py-2.5 my-1 rounded-md transition-all duration-200 
                      cursor-pointer hover:bg-primary/5 text-muted-foreground hover:text-foreground 
                      transform scale-90 origin-left`}
          >
            <span className="text-lg"><LogOut size={ICON_SIZES.navigation} /></span>
            {expanded && <span className="text-sm font-medium">Logout</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
