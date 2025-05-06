import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { CheckCircle, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import authService, { RegisterData } from '@/api/authService';

// Social login button - temporary inline version until we can fix the import issue
interface SocialLoginButtonProps {
  provider: 'google';
  onClick: () => void;
  isLoading?: boolean;
  className?: string;
}

const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({ provider, onClick, isLoading, className = '' }) => {
  const getProviderConfig = () => {
    switch (provider) {
      case 'google':
        return {
          label: 'Continue with Google',
          icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path
                  fill="#4285F4"
                  d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                />
                <path
                  fill="#34A853"
                  d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                />
                <path
                  fill="#FBBC05"
                  d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                />
                <path
                  fill="#EA4335"
                  d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                />
              </g>
            </svg>
          ),
          bgColor: 'bg-white hover:bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-300',
        };
      default:
        return {
          label: 'Continue with Provider',
          icon: null,
          bgColor: 'bg-gray-200 hover:bg-gray-300',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-400',
        };
    }
  };

  const config = getProviderConfig();

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className={`w-full flex justify-center items-center space-x-2 py-2 px-4 border ${config.borderColor} rounded-md shadow-sm text-sm font-medium ${config.textColor} ${config.bgColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          <span>Processing...</span>
        </>
      ) : (
        <>
          {config.icon}
          <span>{config.label}</span>
        </>
      )}
    </button>
  );
};

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
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);


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
      
      console.log('Sending registration data:', registerData);
      // Call the authentication service
      await authService.register(registerData);
      
      // Show registration success message instead of redirecting
      setRegistered(true);
      setRegisteredEmail(data.email);
    } catch (err: any) {
      console.error('Registration error details:', err);
      console.error('Response data:', err?.response?.data);
      console.error('Error message:', err?.message);
      console.error('Full error object:', JSON.stringify(err, null, 2));
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
  
  // Handle social login
  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    try {
      authService.initiateGoogleLogin();
    } catch (err) {
      console.error('Failed to initiate Google login:', err);
      setError('Failed to initiate Google login. Please try again.');
      setGoogleLoading(false);
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
          {!registered ? (
            <p className="mt-2 text-gray-400">Create your account</p>
          ) : (
            <div className="flex items-center justify-center mt-2">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-green-500">Registration successful!</p>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 text-sm text-red-500 bg-red-100 bg-opacity-10 rounded-md border border-red-500">
            {error}
          </div>
        )}

        {registered ? (
          <div className="mt-8 space-y-6 text-center">
            <div className="p-6 rounded-lg bg-gray-800 bg-opacity-50 border border-gray-700">
              <div className="flex justify-center mb-4">
                <Mail className="h-16 w-16 text-blue-500" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Verify Your Email</h2>
              <p className="text-gray-300 mb-4">
                We've sent a verification email to <span className="font-medium text-blue-400">{registeredEmail}</span>.
              </p>
              <p className="text-gray-400 text-sm mb-6">
                Please check your inbox and click the verification link to activate your account. The link will expire in 24 hours.
              </p>
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => authService.resendVerificationEmail(registeredEmail).catch(console.error)}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Resend Verification Email
                </button>
                <Link href="/auth/login" className="w-full inline-block text-center py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 hover:text-white hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                  Go to Login
                </Link>
              </div>
            </div>
          </div>
        ) : (
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
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-ndisuite-panel text-gray-400">Or sign up with</span>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-3">
              <SocialLoginButton 
                provider="google" 
                onClick={handleGoogleLogin} 
                isLoading={googleLoading} 
              />
            </div>
          </div>
        </form>
        )}

        {!registered && (
          <div className="mt-6 text-center text-sm">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-blue-500 hover:text-blue-400">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
