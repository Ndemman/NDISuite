import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, CheckCircle, AlertTriangle, KeyRound, Save } from 'lucide-react';
import authService from '@/api/authService';

// Profile update form schema
const profileSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  organization: z.string().optional(),
  job_title: z.string().optional(),
});

// Password change form schema
const passwordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string().min(8, 'Confirm password is required'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function ProfileSettings() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        setLoading(true);
        
        // First check if user is logged in
        const userData = authService.getCurrentUser();
        if (!userData) {
          router.push('/auth/login');
          return;
        }
        
        // Get full user profile from API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }
        
        const profileData = await response.json();
        setUser(profileData);
        
        // Set initial form values
        reset({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          organization: profileData.organization || '',
          job_title: profileData.job_title || '',
        });
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };
    
    getCurrentUser();
  }, [router, reset]);

  const onSubmitProfile = async (data: ProfileForm) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      const updatedUser = await response.json();
      setUser(updatedUser);
      
      // Update local storage user data
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        const updatedLocalUser = {
          ...currentUser,
          first_name: data.first_name,
          last_name: data.last_name,
        };
        localStorage.setItem('user', JSON.stringify(updatedLocalUser));
      }
      
      setSuccess('Profile updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const onSubmitPassword = async (data: PasswordForm) => {
    try {
      setChangingPassword(true);
      setError('');
      setSuccess('');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/password/change/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          old_password: data.current_password,
          new_password1: data.new_password,
          new_password2: data.confirm_password,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to change password');
      }
      
      setSuccess('Password changed successfully');
      resetPassword();
      setShowPasswordForm(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-ndisuite-background">
      <Head>
        <title>Profile Settings | NDISuite</title>
      </Head>

      <main className="flex-1 p-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
            <p className="text-gray-400 mt-1">
              Manage your account information
            </p>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-500 bg-opacity-10 border border-green-500 rounded-md flex items-center gap-3 text-green-500">
              <CheckCircle size={20} />
              <p>{success}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-md flex items-center gap-3 text-red-500">
              <AlertTriangle size={20} />
              <p>{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            <div className="bg-ndisuite-panel rounded-lg shadow-md overflow-hidden">
              <div className="border-b border-gray-700 p-6">
                <h2 className="text-lg font-medium text-white">Account Information</h2>
                <p className="text-sm text-gray-400">Update your personal information</p>
              </div>
              
              <form onSubmit={handleSubmit(onSubmitProfile)} className="p-6 space-y-6">
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
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-700 rounded-md text-gray-300 focus:outline-none cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div>
                  <label htmlFor="organization" className="block text-sm font-medium text-gray-300">
                    Organization
                  </label>
                  <input
                    id="organization"
                    type="text"
                    {...register('organization')}
                    className={`mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      user?.account_type === 'CHILD' ? 'cursor-not-allowed bg-gray-700' : ''
                    }`}
                    readOnly={user?.account_type === 'CHILD'}
                  />
                  {user?.account_type === 'CHILD' && (
                    <p className="mt-1 text-xs text-gray-500">Organization is managed by your parent account</p>
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Account Type
                  </label>
                  <div className="mt-1 flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user?.account_type === 'PARENT' 
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
                        : user?.account_type === 'CHILD'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100'
                    }`}>
                      {user?.account_type === 'PARENT' ? 'Parent Account' : 
                       user?.account_type === 'CHILD' ? 'Child Account' : 'Individual Account'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-ndisuite-panel rounded-lg shadow-md overflow-hidden">
              <div className="border-b border-gray-700 p-6">
                <h2 className="text-lg font-medium text-white">Security</h2>
                <p className="text-sm text-gray-400">Manage your password</p>
              </div>
              
              {!showPasswordForm ? (
                <div className="p-6">
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    <KeyRound className="mr-2 h-4 w-4" />
                    Change Password
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="p-6 space-y-6">
                  <div>
                    <label htmlFor="current_password" className="block text-sm font-medium text-gray-300">
                      Current Password
                    </label>
                    <input
                      id="current_password"
                      type="password"
                      {...registerPassword('current_password')}
                      className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {passwordErrors.current_password && (
                      <p className="mt-1 text-sm text-red-500">{passwordErrors.current_password.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="new_password" className="block text-sm font-medium text-gray-300">
                      New Password
                    </label>
                    <input
                      id="new_password"
                      type="password"
                      {...registerPassword('new_password')}
                      className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {passwordErrors.new_password && (
                      <p className="mt-1 text-sm text-red-500">{passwordErrors.new_password.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-300">
                      Confirm New Password
                    </label>
                    <input
                      id="confirm_password"
                      type="password"
                      {...registerPassword('confirm_password')}
                      className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {passwordErrors.confirm_password && (
                      <p className="mt-1 text-sm text-red-500">{passwordErrors.confirm_password.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        resetPassword();
                      }}
                      className="px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {changingPassword ? (
                        <>
                          <Loader2 className="animate-spin mr-2 h-4 w-4" />
                          Updating...
                        </>
                      ) : (
                        'Update Password'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
