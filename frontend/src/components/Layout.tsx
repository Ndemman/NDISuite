import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Sidebar from './Sidebar';
import authService from '@/api/authService';

interface LayoutProps {
  children: ReactNode;
}

// Pages that don't need authentication or sidebar
const publicPages = ['/auth/login', '/auth/register', '/auth/password-reset', '/auth/password-reset-confirm', '/auth/verify-email'];

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check if we're on a public page
    const isPublicPage = publicPages.some(page => 
      router.pathname === page || router.pathname.startsWith(page)
    );
    
    // If we're not on a public page, check if user is authenticated
    if (!isPublicPage) {
      const user = authService.getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
    }
    
    setIsLoading(false);
  }, [router]);
  
  // If we're still checking authentication, show a loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ndisuite-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Check if we're on a public page
  const isPublicPage = publicPages.some(page => 
    router.pathname === page || router.pathname.startsWith(page)
  );
  
  // If it's a public page, don't show the sidebar
  if (isPublicPage) {
    return <>{children}</>;
  }
  
  // Otherwise, show the layout with sidebar
  return (
    <div className="flex min-h-screen bg-ndisuite-background">
      <Sidebar />
      <main className="flex-1 transition-all duration-300 md:ml-64 pt-16 md:pt-0">
        {children}
      </main>
    </div>
  );
}
