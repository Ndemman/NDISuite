import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import authService from '@/api/authService';

export default function Home() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);

  // Redirect to dashboard if authenticated, otherwise to login
  useEffect(() => {
    // Only check auth on client-side
    if (typeof window !== 'undefined') {
      const isAuthenticated = authService.isAuthenticated();
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/auth/login');
      }
      setIsLoading(false);
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ndisuite-background">
      <Head>
        <title>NDISuite Report Generator</title>
        <meta name="description" content="Generate NDIS reports with AI-powered transcription and content generation" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="text-center">
        <h1 className="text-3xl font-bold">NDISuite Report Generator</h1>
        <p className="mt-4">{isLoading ? 'Loading...' : 'Redirecting to the appropriate page...'}</p>
      </div>
    </div>
  );
}
