import { useState, useEffect } from 'react';
import { TokenStore } from '@/utils/TokenStore';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Loader2, Plus, UserPlus, User, Settings, Shield, AlertTriangle } from 'lucide-react';
import authService from '@/api/authService';

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

export default function UserManagement() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);

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

  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser || currentUser.account_type !== 'PARENT') return;
      
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/child-accounts/`, {
          headers: {
            'Authorization': `Bearer ${TokenStore.access}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load user accounts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [currentUser]);

  const AccountStatus = ({ isActive }: { isActive: boolean }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      isActive 
        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
        : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
    }`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );

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
        <title>Manage Users | NDISuite</title>
      </Head>

      <main className="flex-1 p-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">User Management</h1>
            <Link href="/settings/users/new" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              <UserPlus size={18} />
              <span>Add New User</span>
            </Link>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-md flex items-center gap-3 text-red-500">
              <AlertTriangle size={20} />
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="bg-card rounded-lg shadow-md p-8 text-center">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <User size={24} className="text-primary" />
                </div>
                <h3 className="text-xl font-medium text-white">No team members yet</h3>
                <p className="text-muted-foreground max-w-md">
                  You haven't added any team members to your organization yet. Create your first child account to get started.
                </p>
                <Link href="/settings/users/new" className="inline-flex items-center gap-2 px-4 py-2 mt-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  <Plus size={18} />
                  <span>Create Child Account</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-card overflow-hidden shadow-md rounded-lg">
              <table className="min-w-full divide-y divide-ndisuite-border">
                <thead className="bg-ndisuite-card-header">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Permissions
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Joined
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-ndisuite-card divide-y divide-ndisuite-border">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-ndisuite-card-hover transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-lg font-medium text-primary">
                              {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-gray-400">{user.email}</div>
                            {user.job_title && (
                              <div className="text-xs text-gray-500">{user.job_title}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <AccountStatus isActive={user.is_active} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {user.can_export_reports && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                              Export
                            </span>
                          )}
                          {user.can_create_templates && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100">
                              Templates
                            </span>
                          )}
                          {user.can_access_analytics && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100">
                              Analytics
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(user.date_joined).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/settings/users/${user.id}`} className="text-blue-500 hover:text-blue-400 flex items-center justify-end gap-1">
                          <Settings size={16} />
                          <span>Edit</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
