import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import authService from '@/api/authService';

export default function VerifyEmail() {
  const router = useRouter();
  const { token } = router.query;
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    const verifyEmail = async () => {
      if (token) {
        try {
          // Call the verification endpoint
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/verify-email/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          }).then(async (res) => {
            if (res.ok) {
              setStatus('success');
              setMessage('Your email has been verified successfully! You can now log in.');
            } else {
              const data = await res.json();
              setStatus('error');
              setMessage(data.detail || 'Verification failed. The link may have expired or is invalid.');
            }
          });
        } catch (err) {
          console.error('Email verification error:', err);
          setStatus('error');
          setMessage('Verification failed. Please try again or contact support.');
        }
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-ndisuite-background py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Verify Email | NDISuite</title>
      </Head>

      <div className="w-full max-w-md p-8 space-y-8 bg-ndisuite-panel rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">NDISuite</h1>
          <p className="mt-2 text-gray-400">Email Verification</p>
        </div>

        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
              <p className="text-white text-center">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-white text-center">{message}</p>
              <Link href="/auth/login" legacyBehavior>
                <a className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Go to Login
                </a>
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="h-16 w-16 text-red-500" />
              <p className="text-white text-center">{message}</p>
              <div className="flex space-x-4 mt-4">
                <Link href="/auth/login" legacyBehavior>
                  <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                    Back to Login
                  </a>
                </Link>
                <Link href="/auth/register" legacyBehavior>
                  <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Register Again
                  </a>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
