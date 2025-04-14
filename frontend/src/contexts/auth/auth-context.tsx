import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

// Types
export interface User {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  is_verified: boolean
  profile?: {
    profile_picture?: string
    bio?: string
    phone_number?: string
    organization?: string
    job_title?: string
    preferences?: Record<string, any>
  }
}

interface AuthContextType {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string, remember?: boolean) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => void
  requestPasswordReset: (email: string) => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
}

// Default context value
const defaultContext: AuthContextType = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  requestPasswordReset: async () => {},
  resetPassword: async () => {},
  changePassword: async () => {},
  updateProfile: async () => {},
}

// Create context
const AuthContext = createContext<AuthContextType>(defaultContext)

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  // Check if user is authenticated on mount
  useEffect(() => {
    const init = async () => {
      try {
        // Development mode bypass - allow automatic login for testing
        const isDevelopment = true; // Set to true for development mode
        
        if (isDevelopment) {
          // Check if we already have a dev user ID stored
          let devUserId = localStorage.getItem('dev-user-id')
          
          // If not, create one and store it
          if (!devUserId) {
            devUserId = 'dev-user-123456789'
            localStorage.setItem('dev-user-id', devUserId)
          }
          
          // Create a mock token
          const mockToken = 'dev-token-' + Math.random().toString(36).substring(2, 15)
          const mockRefreshToken = 'dev-refresh-' + Math.random().toString(36).substring(2, 15)
          
          // Set up the mock user
          setUser({
            id: devUserId,
            username: 'devuser',
            email: 'dev@example.com',
            first_name: 'Development',
            last_name: 'User',
            is_verified: true,
          })
          
          setToken(mockToken)
          setRefreshToken(mockRefreshToken)
          
          // Store tokens in localStorage
          localStorage.setItem('access_token', mockToken)
          localStorage.setItem('refresh_token', mockRefreshToken)
          
          console.log('Development mode: Auto-authenticated with user ID:', devUserId)
        } else {
          // Normal authentication flow for production
          const storedToken = localStorage.getItem('access_token')
          const storedRefreshToken = localStorage.getItem('refresh_token')

          if (storedToken) {
            setToken(storedToken)
            setRefreshToken(storedRefreshToken)
            
            // Fetch user data with token
            const userResponse = await fetch(`${API_URL}/auth/profiles/me/`, {
              headers: {
                Authorization: `Bearer ${storedToken}`
              }
            })

            if (userResponse.ok) {
              const userData = await userResponse.json()
              setUser(userData)
            } else {
              // Token might be expired, try to refresh
              if (storedRefreshToken) {
                await refreshAccessToken(storedRefreshToken)
              } else {
                // If refresh fails or no refresh token, logout
                handleLogout()
              }
            }
          }
        }
      } catch (error) {
        handleLogout()
        console.error('Authentication error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [])

  // Refresh token function
  const refreshAccessToken = async (storedRefreshToken: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: storedRefreshToken }),
      })

      if (response.ok) {
        const data = await response.json()
        setToken(data.access)
        localStorage.setItem('access_token', data.access)
        
        // Fetch user data with new token
        const userResponse = await fetch(`${API_URL}/auth/profiles/me/`, {
          headers: {
            Authorization: `Bearer ${data.access}`
          }
        })

        if (userResponse.ok) {
          const userData = await userResponse.json()
          setUser(userData)
        } else {
          handleLogout()
        }
      } else {
        handleLogout()
      }
    } catch (error) {
      handleLogout()
      console.error('Token refresh error:', error)
    }
  }

  // Login function
  const login = async (email: string, password: string, remember = false) => {
    setIsLoading(true)
    try {
      // Development mode bypass - allow any login for testing
      // In a real application, this would be removed in production
      const isDevelopment = true; // Set to true for development mode
      
      if (isDevelopment) {
        // Use a consistent user ID for development mode to avoid session issues
        const mockUserId = 'dev-user-123456789';
        const mockToken = 'dev-token-' + Math.random().toString(36).substring(2, 15);
        const mockRefreshToken = 'dev-refresh-' + Math.random().toString(36).substring(2, 15);
        
        // Store the user ID in localStorage for consistency
        localStorage.setItem('dev-user-id', mockUserId);
        
        // Create a mock user based on the provided email
        const nameParts = email.split('@')[0].split('.');
        const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : 'Test';
        const lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : 'User';
        
        setUser({
          id: mockUserId,
          username: email.split('@')[0],
          email: email,
          first_name: firstName,
          last_name: lastName,
          is_verified: true,
        });
        
        setToken(mockToken);
        setRefreshToken(mockRefreshToken);
        
        // Store tokens based on remember preference
        if (remember) {
          localStorage.setItem('access_token', mockToken);
          localStorage.setItem('refresh_token', mockRefreshToken);
        } else {
          sessionStorage.setItem('access_token', mockToken);
          sessionStorage.setItem('refresh_token', mockRefreshToken);
        }
        
        toast({
          title: 'Development Login',
          description: 'Logged in with development mode bypass',
        });
        
        router.push('/dashboard');
        setIsLoading(false);
        return;
      }
      
      // Normal login flow for production
      const response = await fetch(`${API_URL}/auth/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        setUser({
          id: data.user_id,
          username: data.username,
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          is_verified: data.is_verified,
        })
        setToken(data.access)
        setRefreshToken(data.refresh)

        // Store tokens based on remember preference
        if (remember) {
          localStorage.setItem('access_token', data.access)
          localStorage.setItem('refresh_token', data.refresh)
        } else {
          sessionStorage.setItem('access_token', data.access)
          sessionStorage.setItem('refresh_token', data.refresh)
        }

        toast({
          title: 'Login successful',
          description: 'Welcome back to NDISuite Report Writer!',
        })

        router.push('/dashboard')
      } else {
        const errorData = await response.json()
        toast({
          variant: 'destructive',
          title: 'Login failed',
          description: errorData.detail || 'Invalid credentials',
        })
      }
    } catch (error) {
      console.error('Login error:', error)
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: 'An error occurred during login',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Register function
  const register = async (data: any) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const responseData = await response.json()
        
        // If the registration returns a token, log the user in
        if (responseData.token) {
          setToken(responseData.token)
          localStorage.setItem('access_token', responseData.token)
          
          // If refresh token is provided
          if (responseData.refresh_token) {
            setRefreshToken(responseData.refresh_token)
            localStorage.setItem('refresh_token', responseData.refresh_token)
          }
          
          // Set user if user data is returned
          if (responseData.user) {
            setUser(responseData.user)
          }
          
          toast({
            title: 'Registration successful',
            description: 'Welcome to NDISuite Report Writer!',
          })
          
          router.push('/dashboard')
        } else {
          // If no token is returned, show success message but don't log in
          toast({
            title: 'Registration successful',
            description: 'Please check your email to verify your account.',
          })
          
          router.push('/login')
        }
      } else {
        const errorData = await response.json()
        let errorMessage = 'Registration failed'
        
        // Process validation errors
        if (errorData.email) {
          errorMessage = `Email: ${errorData.email.join(', ')}`
        } else if (errorData.password) {
          errorMessage = `Password: ${errorData.password.join(', ')}`
        } else if (errorData.username) {
          errorMessage = `Username: ${errorData.username.join(', ')}`
        } else if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors.join(', ')
        }
        
        toast({
          variant: 'destructive',
          title: 'Registration failed',
          description: errorMessage,
        })
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: 'An error occurred during registration',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function
  const handleLogout = () => {
    setUser(null)
    setToken(null)
    setRefreshToken(null)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('refresh_token')
  }

  const logout = async () => {
    if (refreshToken) {
      try {
        // Call logout endpoint to blacklist the token
        await fetch(`${API_URL}/auth/logout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ refresh: refreshToken }),
        })
      } catch (error) {
        console.error('Logout error:', error)
      }
    }
    
    handleLogout()
    router.push('/')
    
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out',
    })
  }

  // Request password reset
  const requestPasswordReset = async (email: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/auth/password-reset-request/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        toast({
          title: 'Password reset requested',
          description: 'Please check your email for instructions',
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Request failed',
          description: 'Unable to request password reset',
        })
      }
    } catch (error) {
      console.error('Password reset request error:', error)
      toast({
        variant: 'destructive',
        title: 'Request failed',
        description: 'An error occurred during password reset request',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Reset password with token
  const resetPassword = async (token: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/auth/password-reset-confirm/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      })

      if (response.ok) {
        toast({
          title: 'Password reset successful',
          description: 'Your password has been reset successfully',
        })
        router.push('/login')
      } else {
        const errorData = await response.json()
        toast({
          variant: 'destructive',
          title: 'Password reset failed',
          description: errorData.detail || 'Unable to reset password',
        })
      }
    } catch (error) {
      console.error('Password reset error:', error)
      toast({
        variant: 'destructive',
        title: 'Password reset failed',
        description: 'An error occurred during password reset',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Change password for authenticated user
  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!token) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'You must be logged in to change your password',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/auth/change-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      })

      if (response.ok) {
        toast({
          title: 'Password changed',
          description: 'Your password has been changed successfully',
        })
      } else {
        const errorData = await response.json()
        toast({
          variant: 'destructive',
          title: 'Password change failed',
          description: errorData.detail || 'Unable to change password',
        })
      }
    } catch (error) {
      console.error('Password change error:', error)
      toast({
        variant: 'destructive',
        title: 'Password change failed',
        description: 'An error occurred during password change',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Update user profile
  const updateProfile = async (data: Partial<User>) => {
    if (!token || !user) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'You must be logged in to update your profile',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/auth/profiles/me/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const updatedData = await response.json()
        setUser({ ...user, ...updatedData })
        toast({
          title: 'Profile updated',
          description: 'Your profile has been updated successfully',
        })
      } else {
        const errorData = await response.json()
        toast({
          variant: 'destructive',
          title: 'Profile update failed',
          description: errorData.detail || 'Unable to update profile',
        })
      }
    } catch (error) {
      console.error('Profile update error:', error)
      toast({
        variant: 'destructive',
        title: 'Profile update failed',
        description: 'An error occurred during profile update',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    user,
    token,
    refreshToken,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    requestPasswordReset,
    resetPassword,
    changePassword,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext)
