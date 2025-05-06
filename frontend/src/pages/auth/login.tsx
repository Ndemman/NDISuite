import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
// @ts-ignore - Fixing Next.js Link component type issue
import { useForm } from 'react-hook-form';
import { Mail, AlertTriangle } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import authService, { LoginCredentials } from '@/api/authService';
import { GoogleIcon } from '@/components/auth/SocialIcons';

// Social login button - temporary inline version until we can fix the import issue
interface SocialLoginButtonProps {
  provider: 'google';
  onClick: () => void;
  isLoading?: boolean;
  className?: string;
}

const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({ provider, onClick, isLoading, className = '' }) => {
  const getProviderConfig = (provider: string) => {
    switch (provider) {
      case 'google':
        return {
          label: 'Continue with Google',
          icon: <GoogleIcon className="h-5 w-5" />,
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

  const config = getProviderConfig(provider);

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

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [showVerificationReminder, setShowVerificationReminder] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    // Pre‑flight GET to set the CSRF cookie
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login/`, {
      method: 'GET',
      credentials: 'include',
    });
  }, []);


  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError('');
    setShowVerificationReminder(false);

    try {
      const credentials: LoginCredentials = {
        email: data.email,
        password: data.password
      };
      
      // Call the authentication service
      await authService.login(credentials);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Handle unverified account error
      if (err?.message?.includes('not activated') || 
          (err?.response?.data?.detail && err.response.data.detail.includes('not activated'))) {
        setUnverifiedEmail(data.email);
        setShowVerificationReminder(true);
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    
    setResendLoading(true);
    setResendSuccess(false);
    
    try {
      await authService.resendVerificationEmail(unverifiedEmail);
      setResendSuccess(true);
    } catch (err) {
      console.error('Failed to resend verification email:', err);
      // We don't show an error to the user as the API returns success even if the email doesn't exist
      // for security reasons - we still show success message
      setResendSuccess(true);
    } finally {
      setResendLoading(false);
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
    <div className="min-h-screen flex items-center justify-center bg-ndisuite-background">
      <Head>
        <title>Login | NDISuite Report Generator</title>
      </Head>

      <div className="w-full max-w-md p-8 space-y-8 bg-ndisuite-panel rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">NDISuite</h1>
          <p className="mt-2 text-gray-400">Sign in to access the Report Generator</p>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-500 bg-red-100 bg-opacity-10 rounded-md border border-red-500">
            {error}
          </div>
        )}
        
        {showVerificationReminder && (
          <div className="p-6 text-sm bg-blue-100 bg-opacity-10 rounded-md border border-blue-500">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-blue-500 font-medium mb-2">Account Not Activated</h3>
                <p className="text-gray-300 mb-3">
                  Your account hasn't been activated yet. Please check your email for the verification link.
                </p>
                
                {resendSuccess ? (
                  <p className="text-green-500 mb-3">
                    Verification email has been sent! Please check your inbox.
                  </p>
                ) : (
                  <button 
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="text-blue-500 hover:text-blue-400 flex items-center"
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    {resendLoading ? 'Sending...' : 'Resend verification email'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
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
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-700 rounded bg-gray-800"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <button 
                onClick={() => window.location.href = '/auth/password-reset'}
                className="text-blue-500 hover:text-blue-400 text-left"
                type="button"
              >
                Forgot your password?
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-ndisuite-panel text-gray-400">Or</span>
              </div>
            </div>
            
            <div className="mt-6 flex justify-center">
              <SocialLoginButton 
                provider="google" 
                onClick={handleGoogleLogin} 
                isLoading={googleLoading} 
              />
            </div>
          </div>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-gray-400">
            Don't have an account?{' '}
            <Link href="/auth/register" legacyBehavior>
              <a className="text-blue-500 hover:underline">Create an account</a>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
