import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import authService from '@/api/authService';

export default function SocialCallback() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    // Only run once the router is ready and we have access to query params
    if (!router.isReady) return;
    
    const { token, is_new_user, error } = router.query;
    
    if (error) {
      setError(error as string);
      return;
    }
    
    if (!token) {
      setError('No authentication token received');
      return;
    }
    
    try {
      // Convert is_new_user query param to boolean
      const isNewUser = is_new_user === 'true';
      
      // Handle the social callback
      authService.handleSocialCallback(token as string, isNewUser);
      setSuccess(true);
      
      // After a brief pause, redirect to the appropriate page
      setTimeout(() => {
        if (isNewUser) {
          router.push('/dashboard');
        } else {
          router.push('/dashboard');
        }
      }, 1500);
    } catch (err) {
      console.error('Social callback error:', err);
      setError('Authentication failed. Please try again.');
    }
  }, [router.isReady, router.query]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-ndisuite-background">
      <Head>
        <title>Social Authentication | NDISuite Report Generator</title>
      </Head>
      
      <div className="w-full max-w-md p-8 space-y-8 bg-ndisuite-panel rounded-lg shadow-lg text-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">NDISuite</h1>
          <p className="mt-2 text-gray-400">Social Authentication</p>
        </div>
        
        {error && (
          <div className="p-4 text-sm text-red-500 bg-red-100 bg-opacity-10 rounded-md border border-red-500">
            <p className="font-medium">Authentication Failed</p>
            <p>{error}</p>
            <div className="mt-4">
              <Link href="/auth/login" className="text-blue-500 hover:underline">
                Return to Login
              </Link>
            </div>
          </div>
        )}
        
        {success && (
          <div className="p-4 text-sm text-green-500 bg-green-100 bg-opacity-10 rounded-md border border-green-500">
            <p className="font-medium">Authentication Successful</p>
            <p>You are being redirected to your dashboard...</p>
            <div className="mt-4 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-500"></div>
            </div>
          </div>
        )}
        
        {!error && !success && (
          <div className="p-4 text-sm text-blue-500 bg-blue-100 bg-opacity-10 rounded-md border border-blue-500">
            <p className="font-medium">Processing Authentication</p>
            <p>Please wait while we complete your authentication...</p>
            <div className="mt-4 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
