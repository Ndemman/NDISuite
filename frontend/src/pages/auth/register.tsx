import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import authService, { RegisterData } from '@/api/authService';

const registerSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  account_type: z.enum(['PARENT', 'LONE']),
  organization: z.string().min(1, 'Organization name is required').optional().or(z.literal('')),
  job_title: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirm: z.string().min(8, 'Confirm password is required'),
}).refine((data) => data.password === data.password_confirm, {
  message: "Passwords don't match",
  path: ["password_confirm"],
}).refine(
  (data) => !(data.account_type === 'PARENT' && (!data.organization || data.organization.trim() === '')), {
  message: "Organization name is required for Parent accounts",
  path: ["organization"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      account_type: 'PARENT'
    }
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError('');

    try {
      // Convert form data to RegisterData format
      const registerData: RegisterData = {
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        password: data.password,
        password_confirm: data.password_confirm,
        account_type: data.account_type,
        organization: data.organization || '',
        job_title: data.job_title || ''
      };
      
      // Call the authentication service
      await authService.register(registerData);
      router.push('/auth/login?registered=true');
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err?.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err?.response?.data?.email) {
        setError(`Email error: ${err.response.data.email}`);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ndisuite-background py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Register | NDISuite Report Generator</title>
      </Head>

      <div className="w-full max-w-md p-8 space-y-8 bg-ndisuite-panel rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">NDISuite</h1>
          <p className="mt-2 text-gray-400">Create your account</p>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-500 bg-red-100 bg-opacity-10 rounded-md border border-red-500">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-300">
                  First Name
                </label>
                <input
                  id="first_name"
                  type="text"
                  {...register('first_name')}
                  className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John"
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-500">{errors.first_name.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-300">
                  Last Name
                </label>
                <input
                  id="last_name"
                  type="text"
                  {...register('last_name')}
                  className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Doe"
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-500">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email address
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="account_type" className="block text-sm font-medium text-gray-300">
                Account Type
              </label>
              <div className="mt-1 grid grid-cols-2 gap-3">
                <label className="relative flex cursor-pointer rounded-lg border border-gray-700 bg-gray-800 p-4 focus:outline-none hover:bg-gray-700 transition-colors">
                  <input
                    type="radio"
                    value="PARENT"
                    {...register('account_type')}
                    className="sr-only"
                    defaultChecked
                  />
                  <span className="flex flex-1">
                    <span className="flex flex-col">
                      <span className="block text-sm font-medium text-white">Parent Account</span>
                      <span className="mt-1 flex items-center text-xs text-gray-400">
                        For organizations with multiple staff members
                      </span>
                    </span>
                  </span>
                  <span 
                    className={`h-5 w-5 shrink-0 rounded-full border-2 border-white ml-2 ${watch('account_type') === 'PARENT' ? 'bg-blue-500' : 'bg-transparent'}`} 
                    aria-hidden="true"
                  />
                </label>
                <label className="relative flex cursor-pointer rounded-lg border border-gray-700 bg-gray-800 p-4 focus:outline-none hover:bg-gray-700 transition-colors">
                  <input
                    type="radio"
                    value="LONE"
                    {...register('account_type')}
                    className="sr-only"
                  />
                  <span className="flex flex-1">
                    <span className="flex flex-col">
                      <span className="block text-sm font-medium text-white">Individual Account</span>
                      <span className="mt-1 flex items-center text-xs text-gray-400">
                        For solo practitioners
                      </span>
                    </span>
                  </span>
                  <span 
                    className={`h-5 w-5 shrink-0 rounded-full border-2 border-white ml-2 ${watch('account_type') === 'LONE' ? 'bg-blue-500' : 'bg-transparent'}`} 
                    aria-hidden="true"
                  />
                </label>
              </div>
              {errors.account_type && (
                <p className="mt-1 text-sm text-red-500">{errors.account_type.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="organization" className="block text-sm font-medium text-gray-300">
                Organization Name {watch('account_type') === 'PARENT' && <span className="text-red-400">*</span>}
              </label>
              <input
                id="organization"
                type="text"
                {...register('organization')}
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your organization or practice name"
              />
              {errors.organization && (
                <p className="mt-1 text-sm text-red-500">{errors.organization.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="job_title" className="block text-sm font-medium text-gray-300">
                Job Title (Optional)
              </label>
              <input
                id="job_title"
                type="text"
                {...register('job_title')}
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your role or title"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
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
                Confirm Password
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
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-500 hover:text-blue-400">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
