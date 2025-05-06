import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import authService from '@/api/authService';

enum VerificationStatus {
  VERIFYING = 'verifying',
  SUCCESS = 'success',
  ERROR = 'error'
}

const VerifyEmailPage = () => {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState<VerificationStatus>(VerificationStatus.VERIFYING);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const verifyEmail = async (verificationToken: string) => {
      try {
        setStatus(VerificationStatus.VERIFYING);
        // Call the API to verify the email
        await authService.verifyEmail(verificationToken);
        setStatus(VerificationStatus.SUCCESS);
        
        // Redirect to dashboard after a brief success message
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } catch (err) {
        setStatus(VerificationStatus.ERROR);
        setError(err instanceof Error ? err.message : 'Email verification failed. Please try again.');
      }
    };

    // Only verify if token is available
    if (token && typeof token === 'string') {
      verifyEmail(token);
    }
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-md border border-border">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Email Verification</h1>
          
          {status === VerificationStatus.VERIFYING && (
            <div className="flex flex-col items-center justify-center mt-6 space-y-4">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
              <p className="text-lg text-muted-foreground">Verifying your email address...</p>
            </div>
          )}
          
          {status === VerificationStatus.SUCCESS && (
            <div className="flex flex-col items-center justify-center mt-6 space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <p className="text-lg text-muted-foreground">Your email has been verified successfully!</p>
              <p className="text-muted-foreground">You will be redirected to the dashboard in a moment.</p>
            </div>
          )}
          
          {status === VerificationStatus.ERROR && (
            <div className="flex flex-col items-center justify-center mt-6 space-y-4">
              <XCircle className="w-16 h-16 text-red-500" />
              <p className="text-lg text-muted-foreground">Verification failed</p>
              <p className="text-muted-foreground">{error}</p>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  The verification link may have expired or already been used.
                </p>
                <div className="flex flex-col space-y-4 mt-4">
                  <Link 
                    href="/auth/login" 
                    className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md"
                  >
                    Go to Login
                  </Link>
                  <Link 
                    href="/auth/register" 
                    className="inline-flex items-center justify-center px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-md"
                  >
                    Register Again
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
