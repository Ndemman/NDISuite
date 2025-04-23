import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowLeft, CheckCircle, AlertTriangle, UserX, Trash2 } from 'lucide-react';
import authService from '@/api/authService';

// Edit child account form schema
const editUserSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  job_title: z.string().optional(),
  can_export_reports: z.boolean(),
  can_create_templates: z.boolean(),
  can_access_analytics: z.boolean(),
  is_active: z.boolean(),
});

type EditUserForm = z.infer<typeof editUserSchema>;

interface UserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  job_title?: string;
  is_active: boolean;
  account_type: 'PARENT' | 'CHILD' | 'LONE';
  can_export_reports: boolean;
  can_create_templates: boolean;
  can_access_analytics: boolean;
  date_joined: string;
}

export default function EditUser() {
  const router = useRouter();
  const { id } = router.query;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
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

  // Fetch user data when component mounts and id is available
  useEffect(() => {
    const fetchUserData = async () => {
      if (!id || !currentUser) return;
      
      try {
        setIsFetching(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const data = await response.json();
        setUserData(data);
        
        // Populate form with user data
        reset({
          first_name: data.first_name,
          last_name: data.last_name,
          job_title: data.job_title || '',
          can_export_reports: data.can_export_reports,
          can_create_templates: data.can_create_templates,
          can_access_analytics: data.can_access_analytics,
          is_active: data.is_active,
        });
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data. Please try again later.');
      } finally {
        setIsFetching(false);
      }
    };
    
    fetchUserData();
  }, [id, currentUser, reset]);

  const onSubmit = async (data: EditUserForm) => {
    if (!id) return;
    
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update user account');
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.message || 'Failed to update user account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!id) return;
    
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: false }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to deactivate user account');
      }

      // Update local state
      if (userData) {
        setUserData({ ...userData, is_active: false });
        reset({ ...userData, is_active: false });
      }
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Error deactivating user:', err);
      setError(err.message || 'Failed to deactivate user account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete user account');
      }

      router.push('/settings/users');
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Failed to delete user account. Please try again.');
      setDeleteModal(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser || isFetching) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ndisuite-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-ndisuite-background">
      <Head>
        <title>Edit User | NDISuite</title>
      </Head>

      <main className="flex-1 p-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6">
            <Link href="/settings/users" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={16} />
              <span>Back to user management</span>
            </Link>
          </div>

          {userData && (
            <div className="bg-ndisuite-panel rounded-lg shadow-md p-8">
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-white">Edit User</h1>
                  <p className="text-gray-400 mt-1">
                    {userData.email}
                  </p>
                </div>
                <div className="flex flex-shrink-0 h-12 w-12 rounded-full bg-primary/10 items-center justify-center">
                  <span className="text-lg font-medium text-primary">
                    {userData.first_name.charAt(0)}{userData.last_name.charAt(0)}
                  </span>
                </div>
              </div>

              {success && (
                <div className="mb-6 p-4 bg-green-500 bg-opacity-10 border border-green-500 rounded-md flex items-center gap-3 text-green-500">
                  <CheckCircle size={20} />
                  <p>User updated successfully</p>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-md flex items-center gap-3 text-red-500">
                  <AlertTriangle size={20} />
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="first_name" className="block text-sm font-medium text-gray-300">
                        First Name
                      </label>
                      <input
                        id="first_name"
                        type="text"
                        {...register('first_name')}
                        className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      />
                      {errors.last_name && (
                        <p className="mt-1 text-sm text-red-500">{errors.last_name.message}</p>
                      )}
                    </div>
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
                    <h3 className="text-md font-medium text-white mb-3">Account Status</h3>
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="is_active"
                          type="checkbox"
                          {...register('is_active')}
                          className="h-4 w-4 text-blue-600 rounded border-gray-700 bg-gray-800 focus:ring-blue-500"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="is_active" className="font-medium text-gray-300">
                          Active Account
                        </label>
                        <p className="text-gray-500">User can log in and access the system</p>
                      </div>
                    </div>
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

                  <div className="pt-4 flex flex-wrap gap-3 justify-between">
                    <div>
                      <button
                        type="button"
                        onClick={() => setDeleteModal(true)}
                        className="flex items-center px-4 py-2 border border-red-600 rounded-md shadow-sm text-sm font-medium text-red-500 hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Trash2 size={16} className="mr-2" />
                        Delete Account
                      </button>
                    </div>
                    
                    <div className="flex gap-3">
                      <Link
                        href="/settings/users"
                        className="px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
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
                            Saving...
                          </span>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-ndisuite-panel rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="p-3 bg-red-500 bg-opacity-10 rounded-full mb-4">
                <UserX size={32} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white">Delete User Account</h3>
              <p className="mt-2 text-gray-400">
                Are you sure you want to delete {userData?.first_name} {userData?.last_name}'s account? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-center space-x-4">
              <button
                type="button"
                onClick={() => setDeleteModal(false)}
                className="px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isLoading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Deleting...
                  </span>
                ) : (
                  'Delete Account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
