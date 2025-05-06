import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Home,
  FileText,
  User,
  Settings,
  Users,
  LogOut,
  ChevronRight,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import authService from '@/api/authService';

export default function Sidebar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    
    // Check if on mobile and close sidebar by default
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Open settings dropdown if on a settings page
    if (router.pathname.startsWith('/settings')) {
      setSettingsOpen(true);
    }
    
    return () => window.removeEventListener('resize', handleResize);
  }, [router.pathname]);

  const handleLogout = () => {
    authService.logout();
    router.push('/auth/login');
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-40 md:hidden">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="flex items-center justify-center h-10 w-10 rounded-md bg-ndisuite-panel text-white"
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      <aside
        className={`fixed top-0 left-0 h-full bg-ndisuite-panel border-r border-gray-700 transition-all duration-300 ease-in-out z-30
                  ${isOpen ? 'w-64' : 'w-20'} 
                  ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
            {isOpen ? (
              <span className="text-xl font-bold text-white">NDISuite</span>
            ) : (
              <span className="text-xl font-bold text-white">ND</span>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-400 hover:text-white hidden md:block"
            >
              <ChevronRight
                size={20}
                className={`transform transition-transform duration-300 ${
                  isOpen ? '' : 'rotate-180'
                }`}
              />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 py-4 overflow-y-auto">
            <ul className="space-y-1 px-2">
              <li>
                <Link href="/dashboard"
                  className={`flex items-center ${
                    isOpen ? 'px-4' : 'justify-center px-2'
                  } py-3 rounded-md ${
                    router.pathname === '/dashboard'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Home size={20} />
                  {isOpen && <span className="ml-3">Dashboard</span>}
                </Link>
              </li>

              <li>
                <Link href="/reports"
                  className={`flex items-center ${
                    isOpen ? 'px-4' : 'justify-center px-2'
                  } py-3 rounded-md ${
                    router.pathname.startsWith('/reports')
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <FileText size={20} />
                  {isOpen && <span className="ml-3">Reports</span>}
                </Link>
              </li>

              {/* Settings section with dropdown */}
              <li>
                <button
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  className={`w-full flex items-center ${
                    isOpen ? 'px-4 justify-between' : 'justify-center px-2'
                  } py-3 rounded-md ${
                    router.pathname.startsWith('/settings')
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center">
                    <Settings size={20} />
                    {isOpen && <span className="ml-3">Settings</span>}
                  </div>
                  {isOpen && (
                    <ChevronDown
                      size={16}
                      className={`transform transition-transform duration-300 ${
                        settingsOpen ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </button>

                {settingsOpen && isOpen && (
                  <ul className="mt-1 pl-6 space-y-1">
                    <li>
                      <Link href="/settings/profile"
                        className={`flex items-center px-4 py-2 rounded-md ${
                          router.pathname === '/settings/profile'
                            ? 'bg-gray-700 text-white'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        <User size={18} />
                        <span className="ml-3">Profile</span>
                      </Link>
                    </li>
                    
                    {/* Only show user management for PARENT accounts */}
                    {user?.account_type === 'PARENT' && (
                      <li>
                        <Link href="/settings/users"
                          className={`flex items-center px-4 py-2 rounded-md ${
                            router.pathname.startsWith('/settings/users')
                              ? 'bg-gray-700 text-white'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                          <Users size={18} />
                          <span className="ml-3">Users</span>
                        </Link>
                      </li>
                    )}
                  </ul>
                )}
              </li>
            </ul>
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-700">
            <div className={`flex ${isOpen ? 'items-center' : 'flex-col items-center'}`}>
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold">
                  {user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
              </div>
              {isOpen && (
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.first_name && user?.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user?.email || 'User'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user?.account_type === 'PARENT'
                      ? 'Parent Account'
                      : user?.account_type === 'CHILD'
                      ? 'Child Account'
                      : 'Individual Account'}
                  </p>
                </div>
              )}
              {isOpen && (
                <button
                  onClick={handleLogout}
                  className="ml-auto flex-shrink-0 text-gray-400 hover:text-white"
                >
                  <LogOut size={20} />
                </button>
              )}
            </div>
            {!isOpen && (
              <button
                onClick={handleLogout}
                className="mt-4 flex items-center justify-center w-full text-gray-400 hover:text-white"
              >
                <LogOut size={20} />
              </button>
            )}
          </div>
        </div>
      </aside>
      {/* Sidebar rendered; main content handled by Layout */}
    </>
  );
}
