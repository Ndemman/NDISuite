"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function Home() {
  const router = useRouter();
  const { toast } = useToast();

  // Function to bypass login for development/testing
  const handleDevLogin = () => {
    // Create mock user data
    const mockUser = {
      id: 'dev-user-123',
      username: 'admin',
      email: 'admin@ndisuite.com',
      first_name: 'Admin',
      last_name: 'User',
      is_verified: true
    };

    // Create mock tokens
    const mockToken = 'dev-token-' + Math.random().toString(36).substring(2, 15);
    const mockRefreshToken = 'dev-refresh-' + Math.random().toString(36).substring(2, 15);

    // Store in localStorage
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('access_token', mockToken);
    localStorage.setItem('refresh_token', mockRefreshToken);

    // Show success message
    toast({
      title: 'Development Login',
      description: 'Logged in with development mode bypass',
    });

    // Redirect to dashboard
    router.push('/dashboard');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-3xl w-full text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">
          Welcome to NDISuite Report Writer
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          A modular Retrieval-Augmented Generation (RAG) system for processing audio, 
          live recordings, and documents to generate structured reports.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="px-8">
            <Link href="/login">
              Login
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="px-8">
            <Link href="/register">
              Register
            </Link>
          </Button>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h2 className="text-lg font-medium mb-4">Development Options</h2>
          <Button 
            onClick={handleDevLogin} 
            variant="secondary" 
            className="px-8"
          >
            Quick Access (Dev Mode)
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Bypasses authentication for testing purposes
          </p>
        </div>
      </div>
    </main>
  );
}
