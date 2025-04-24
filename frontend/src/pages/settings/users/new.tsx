import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import authService from '@/api/authService';

// Create child account form schema
const newChildAccountSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  job_title: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  can_export_reports: z.boolean().default(true),
  can_create_templates: z.boolean().default(false),
  can_access_analytics: z.boolean().default(false),
});

type NewChildAccountForm = z.infer<typeof newChildAccountSchema>;

export default function CreateChildAccount() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewChildAccountForm>({
    resolver: zodResolver(newChildAccountSchema),
    defaultValues: {
      can_export_reports: true,
      can_create_templates: false,
      can_access_analytics: false,
    }
  });

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = authService.getCurrentUser();
      setCurrentUser(user);
      
      // If user is not logged in or not a parent account, redirect to dashboard
      if (!user || user.account_type !== 'PARENT') {
        router.push('/dashboard');
      }
    };
    
    fetchCurrentUser();
  }, [router]);

  const onSubmit = async (data: NewChildAccountForm) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/child-accounts/create/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create user account');
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Error creating child account:', err);
      setError(err.message || 'Failed to create user account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-ndisuite-background">
      <Head>
        <title>Add Team Member | NDISuite</title>
      </Head>

      <main className="flex-1 p-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6">
            <Link href="/settings/users" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={16} />
              <span>Back to user management</span>
            </Link>
          </div>

          <div className="bg-ndisuite-panel rounded-lg shadow-md p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white">Add Team Member</h1>
              <p className="text-gray-400 mt-1">
                Create a new staff account for your organization
              </p>
            </div>

            {success ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-6">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-medium text-white">Team member added successfully</h3>
                  <p className="text-gray-400">
                    An invitation email has been sent with login instructions.
                  </p>
                </div>
                <div className="flex gap-4">
                  <Link 
                    href="/settings/users" 
                    className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Back to user list
                  </Link>
                  <button
                    onClick={() => setSuccess(false)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Add another user
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)}>
                {error && (
                  <div className="mb-6 p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-md flex items-center gap-3 text-red-500">
                    <AlertTriangle size={20} />
                    <p>{error}</p>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="first_name" className="block text-sm font-medium text-gray-300">
                        First Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="first_name"
                        type="text"
                        {...register('first_name')}
                        className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter first name"
                      />
                      {errors.first_name && (
                        <p className="mt-1 text-sm text-red-500">{errors.first_name.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="last_name" className="block text-sm font-medium text-gray-300">
                        Last Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="last_name"
                        type="text"
                        {...register('last_name')}
                        className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter last name"
                      />
                      {errors.last_name && (
                        <p className="mt-1 text-sm text-red-500">{errors.last_name.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      {...register('email')}
                      className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="user@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="job_title" className="block text-sm font-medium text-gray-300">
                      Job Title
                    </label>
                    <input
                      id="job_title"
                      type="text"
                      {...register('job_title')}
                      className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. NDIS Support Coordinator"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                      Initial Password <span className="text-red-400">*</span>
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
                    <p className="mt-1 text-xs text-gray-500">
                      The user will be prompted to change their password upon first login.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-md font-medium text-white mb-3">Permissions</h3>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="can_export_reports"
                            type="checkbox"
                            {...register('can_export_reports')}
                            className="h-4 w-4 text-blue-600 rounded border-gray-700 bg-gray-800 focus:ring-blue-500"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="can_export_reports" className="font-medium text-gray-300">
                            Export Reports
                          </label>
                          <p className="text-gray-500">Can export reports as PDF or Word documents</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="can_create_templates"
                            type="checkbox"
                            {...register('can_create_templates')}
                            className="h-4 w-4 text-blue-600 rounded border-gray-700 bg-gray-800 focus:ring-blue-500"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="can_create_templates" className="font-medium text-gray-300">
                            Create Templates
                          </label>
                          <p className="text-gray-500">Can create and modify report templates</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="can_access_analytics"
                            type="checkbox"
                            {...register('can_access_analytics')}
                            className="h-4 w-4 text-blue-600 rounded border-gray-700 bg-gray-800 focus:ring-blue-500"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="can_access_analytics" className="font-medium text-gray-300">
                            Access Analytics
                          </label>
                          <p className="text-gray-500">Can view usage analytics and reporting metrics</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Link
                      href="/settings/users"
                      className="px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-white hover:bg-gray-700 mr-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <span className="flex items-center">
                          <Loader2 className="animate-spin mr-2 h-4 w-4" />
                          Adding user...
                        </span>
                      ) : (
                        'Add Team Member'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
