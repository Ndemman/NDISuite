import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import authService from '@/api/authService';

const passwordResetConfirmSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirm: z.string().min(8, 'Confirm password is required'),
}).refine((data) => data.password === data.password_confirm, {
  message: "Passwords don't match",
  path: ["password_confirm"],
});

type PasswordResetConfirmForm = z.infer<typeof passwordResetConfirmSchema>;

export default function PasswordResetConfirm() {
  const router = useRouter();
  const { token } = router.query;
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [validationLoading, setValidationLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetConfirmForm>({
    resolver: zodResolver(passwordResetConfirmSchema),
  });

  // Validate token when component mounts
  useEffect(() => {
    const validateToken = async () => {
      if (token) {
        try {
          // Simple check if the token exists - we'll validate it fully on submission
          setTokenValid(true);
        } catch (err) {
          console.error('Token validation error:', err);
          setTokenValid(false);
        } finally {
          setValidationLoading(false);
        }
      } else {
        // If not found in router.query, check URL directly for compatibility
        const urlParams = new URLSearchParams(window.location.search);
        const tokenParam = urlParams.get('token');
        if (tokenParam) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
        }
        setValidationLoading(false);
      }
    };

    if (router.isReady) {
      validateToken();
    }
  }, [token]);

  const onSubmit = async (data: PasswordResetConfirmForm) => {
    // Get token from either router.query or URL params
    const tokenValue = token || new URLSearchParams(window.location.search).get('token');
    if (!tokenValue) return;
    
    setIsLoading(true);
    setError('');

    try {
      await authService.confirmPasswordReset(tokenValue.toString(), data.password);
      setSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err?.response?.data?.token) {
        setError(err.response.data.token);
      } else if (err?.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to reset password. The link may have expired.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (validationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ndisuite-background">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
          <p className="mt-4 text-white">Validating your reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ndisuite-background py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Reset Password | NDISuite</title>
      </Head>

      <div className="w-full max-w-md p-8 space-y-8 bg-ndisuite-panel rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">NDISuite</h1>
          <p className="mt-2 text-gray-400">Create new password</p>
        </div>

        {!tokenValid ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-6">
            <AlertCircle className="h-16 w-16 text-red-500" />
            <div className="text-center space-y-2">
              <h3 className="text-xl font-medium text-white">Invalid or expired link</h3>
              <p className="text-gray-400">
                The password reset link is invalid or has expired.
              </p>
            </div>
            <Link 
              href="/auth/password-reset" 
              className="inline-flex items-center space-x-2 text-blue-500 hover:text-blue-400"
            >
              <ArrowLeft size={16} />
              <span>Request a new reset link</span>
            </Link>
          </div>
        ) : success ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-6">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <div className="text-center space-y-2">
              <h3 className="text-xl font-medium text-white">Password reset successfully</h3>
              <p className="text-gray-400">
                Your password has been reset. You can now log in with your new password.
              </p>
            </div>
            <Link 
              href="/auth/login" 
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to login
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="p-4 text-sm text-red-500 bg-red-100 bg-opacity-10 rounded-md border border-red-500">
                {error}
              </div>
            )}

            <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  {...register('password')}
                  className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password_confirm" className="block text-sm font-medium text-gray-300">
                  Confirm New Password
                </label>
                <input
                  id="password_confirm"
                  type="password"
                  {...register('password_confirm')}
                  className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
                {errors.password_confirm && (
                  <p className="mt-1 text-sm text-red-500">{errors.password_confirm.message}</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Resetting password...
                    </span>
                  ) : (
                    'Reset password'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-gray-400">
                <Link href="/auth/login" className="text-blue-500 hover:text-blue-400">
                  Back to login
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
