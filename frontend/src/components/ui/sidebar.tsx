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
  Settings
} from 'lucide-react';

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
  const baseClasses = "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200";
  const activeClasses = active 
    ? "bg-primary/10 text-primary font-medium shadow-sm" 
    : "hover:bg-primary/5 text-muted-foreground hover:text-foreground";
  const disabledClasses = disabled 
    ? "opacity-50 cursor-not-allowed hover:bg-transparent" 
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

export const Sidebar: React.FC = () => {
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);

  const isActive = (path: string) => router.pathname === path || router.pathname.startsWith(`${path}/`);

  return (
    <div className={`h-screen flex flex-col border-r border-border bg-card transition-all duration-300 shadow-md ${expanded ? 'w-64' : 'w-16'}`}>
      {/* Logo & Header */}
      <div className="p-4 border-b border-border flex justify-between items-center">
        {expanded ? (
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center bg-primary text-primary-foreground w-8 h-8 rounded-md shadow-md">
              <span className="font-bold text-md">ND</span>
            </div>
            <div className="font-semibold text-xl">NDISuite</div>
          </div>
        ) : (
          <div className="mx-auto flex items-center justify-center bg-primary text-primary-foreground w-8 h-8 rounded-md shadow-md">
            <span className="font-bold text-md">ND</span>
          </div>
        )}
        <button 
          onClick={() => setExpanded(!expanded)}
          className="p-1 rounded-md hover:bg-primary hover:bg-opacity-10 text-muted-foreground hover:text-primary transition-colors"
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {expanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 flex flex-col gap-2 px-3 overflow-y-auto">
        <NavItem 
          href="/dashboard" 
          icon={<Home />} 
          label="Dashboard" 
          active={isActive('/dashboard')} 
          expanded={expanded}
        />
        <NavItem 
          href="/reports" 
          icon={<FileText />} 
          label="Report Panel" 
          active={isActive('/reports')} 
          expanded={expanded}
        />
        
        {/* Coming Soon Items */}
        <div className="mt-6 mb-2 px-3">
          {expanded && <div className="text-xs uppercase text-muted-foreground">Coming Soon</div>}
        </div>
        <NavItem 
          href="/scheduling" 
          icon={<Calendar />} 
          label="Scheduling" 
          disabled={true} 
          expanded={expanded}
        />
        <NavItem 
          href="/billing" 
          icon={<DollarSign />} 
          label="Billing" 
          disabled={true} 
          expanded={expanded}
        />
        <NavItem 
          href="/clients" 
          icon={<Users />} 
          label="Clients" 
          disabled={true} 
          expanded={expanded}
        />
        <NavItem 
          href="/team" 
          icon={<UserPlus />} 
          label="Team Hub" 
          disabled={true} 
          expanded={expanded}
        />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <NavItem 
          href="/settings" 
          icon={<Settings />} 
          label="Settings" 
          active={isActive('/settings')} 
          expanded={expanded}
        />
      </div>
    </div>
  );
};
