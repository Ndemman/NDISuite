import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import authService from '@/api/authService';

const passwordResetSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type PasswordResetForm = z.infer<typeof passwordResetSchema>;

export default function PasswordReset() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetForm>({
    resolver: zodResolver(passwordResetSchema),
  });

  const onSubmit = async (data: PasswordResetForm) => {
    setIsLoading(true);
    setError('');

    try {
      await authService.requestPasswordReset(data.email);
      setSuccess(true);
    } catch (err) {
      console.error('Password reset request error:', err);
      setError('Failed to request password reset. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ndisuite-background py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Reset Password | NDISuite</title>
      </Head>

      <div className="w-full max-w-md p-8 space-y-8 bg-ndisuite-panel rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">NDISuite</h1>
          <p className="mt-2 text-gray-400">Reset your password</p>
        </div>

        {success ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-6">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <div className="text-center space-y-2">
              <h3 className="text-xl font-medium text-white">Check your email</h3>
              <p className="text-gray-400">
                We have sent a password reset link to {' '}
                <span className="text-blue-400 font-medium">your email address</span>.
              </p>
              <p className="text-gray-400 text-sm">
                If you don't see it in your inbox, please check your spam folder.
              </p>
            </div>
            <Link 
              href="/auth/login" 
              className="inline-flex items-center space-x-2 text-blue-500 hover:text-blue-400"
            >
              <ArrowLeft size={16} />
              <span>Back to login</span>
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
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
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
                      Sending reset link...
                    </span>
                  ) : (
                    'Send reset link'
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
