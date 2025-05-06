import { apiPost } from './apiClient';
import { v4 as uuidv4 } from 'uuid';

// Helper to read a cookie by name
function getCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp('(^|; )' + name + '=([^;]+)')
  );
  return match ? decodeURIComponent(match[2]) : null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
  account_type: 'PARENT' | 'CHILD' | 'LONE';
  organization?: string;
  job_title?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface UserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  date_joined: string;
}

export interface LoginResponse {
  tokens: AuthTokens;
  user: UserData;
}

export interface RefreshTokenRequest {
  refresh: string;
}

export interface RefreshTokenResponse {
  access: string;
}

/**
 * Authentication service for login, registration, email verification, and token refresh
 */
export interface SocialAuthResponse {
  token: string;
  user_id: string;
  email: string;
  is_new_user?: boolean;
}

export const authService = {
  /**
   * Log in a user with email and password
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      console.log('Attempting login with credentials:', { email: credentials.email });

      // First make a GET request to set the CSRF cookie
      await fetch('/api/v1/auth/login/', {
        method: 'GET',
        credentials: 'include',
      });
      
      // Get CSRF token using the helper function
      const csrfToken = getCookie('csrftoken') || '';
      console.log('CSRF Token retrieved:', csrfToken ? 'Yes' : 'No');

      // Make sure to use URL with trailing slash for Django compatibility
      const response = await fetch('/api/v1/auth/login/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Login API error:', errorData);
        throw new Error('Invalid email or password.');
      }

      // Parse the auth response which may have different formats depending on backend configuration
      const responseData = await response.json();
      console.log('Raw login response:', responseData);
      
      // Convert to our internal LoginResponse format
      // Handle both possible response formats:
      // 1. dj-rest-auth default format: { key: "token_value" }
      // 2. dj-rest-auth with JWT: { access: "token_value", refresh: "refresh_token" }
      const data: LoginResponse = {
        tokens: {
          // Accept either key (standard token) or access (JWT token) format
          access: responseData.key || responseData.access || '',
          refresh: responseData.refresh || '' // Refresh token if available
        },
        user: responseData.user || {
          // Default user data if not provided by the endpoint
          id: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}').id : '',
          email: credentials.email,
          first_name: '',
          last_name: '',
          is_active: true,
          date_joined: new Date().toISOString()
        }
      };

      // Store tokens and user data
      localStorage.setItem('auth_token', data.tokens.access);
      if (data.tokens.refresh) {
        localStorage.setItem('refresh_token', data.tokens.refresh);
      }
      localStorage.setItem('user', JSON.stringify(data.user));

      console.log('Login successful');
      return data;
    } catch (error) {
      console.error('Login failed with error:', error);
      throw error;
    }
  },
  
  /**
   * Register a new user account
   */
  register: async (registerData: RegisterData): Promise<UserData> => {
    try {
      console.log('Registering with data:', registerData);
      
      // Transform our RegisterData to django-allauth format
      const allauthData = {
        username: registerData.email.split('@')[0] + '_' + Math.floor(Math.random() * 1000), // Generate username from email
        email: registerData.email,
        password1: registerData.password,
        password2: registerData.password_confirm
      };
      
      // Directly use fetch API
      const response = await fetch('/api/v1/auth/registration/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(allauthData)
      });
      
      console.log('Registration raw response:', response);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Registration API error:', errorData);
        throw new Error(`API error: ${JSON.stringify(errorData)}`);
      }
      
      const responseData = await response.json();
      console.log('Registration successful:', responseData);
      
      // Convert allauth response to our UserData format
      const user: UserData = {
        id: responseData.user?.pk || '',
        email: responseData.user?.email || allauthData.email,
        first_name: registerData.first_name,
        last_name: registerData.last_name,
        is_active: true,
        date_joined: new Date().toISOString()
      };
      
      return user;
    } catch (error) {
      console.error('Registration failed with error:', error);
      // TypeScript safety: ensure error is treated as Error type with message property
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error message:', errorMessage);
      console.error('Full error object:', error);
      throw error;
    }
  },
  
  /**
   * Refresh the access token using a refresh token
   */
  refreshToken: async (refreshToken: string): Promise<string> => {
    try {
      const response = await fetch('/api/v1/auth/token/refresh/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      
      if (!response.ok) {
        // If refresh fails, clear tokens and redirect to login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        throw new Error('Token refresh failed');
      }
      
      const data = await response.json();
      
      if (data.access) {
        localStorage.setItem('auth_token', data.access);
        return data.access;
      } else {
        throw new Error('Invalid token response format');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  },
  
  /**
   * Log out the current user
   */
  logout: (): void => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
  
  /**
   * Get the current user from localStorage
   */
  getCurrentUser: (): UserData | null => {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch (e) {
        return null;
      }
    }
    return null;
  },
  
  /**
   * Check if a user is currently logged in
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },
  
  /**
   * Request a password reset for an email
   */
  requestPasswordReset: async (email: string): Promise<void> => {
    try {
      console.log('Requesting password reset for:', email);
      
      const response = await fetch('http://localhost:8000/api/v1/auth/request-password-reset/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Password reset request API error:', errorData);
        throw new Error(errorData.detail || 'Failed to request password reset');
      }
      
      console.log('Password reset request sent successfully');
    } catch (error) {
      console.error('Password reset request failed:', error);
      throw error;
    }
  },
  
  /**
   * Confirm a password reset with a token and new password
   */
  confirmPasswordReset: async (token: string, password: string): Promise<void> => {
    try {
      console.log('Confirming password reset with token:', token);
      
      const response = await fetch(`http://localhost:8000/api/v1/auth/reset-password/${token}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          password: password,
          password_confirm: password 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Password reset confirmation API error:', errorData);
        throw new Error(errorData.detail || 'Failed to reset password');
      }
      
      console.log('Password reset successfully');
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  },
  
  /**
   * Verify a user's email with the provided token
   */
  verifyEmail: async (token: string): Promise<LoginResponse> => {
    try {
      console.log('Verifying email with token:', token);
      
      const response = await fetch(`http://localhost:8000/api/v1/auth/verify-email/${token}/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Email verification API error:', errorData);
        throw new Error(errorData.detail || 'Verification failed');
      }
      
      const data: LoginResponse = await response.json();
      
      // Store tokens and user data for automatic login
      if (data.tokens) {
        localStorage.setItem('auth_token', data.tokens.access);
        localStorage.setItem('refresh_token', data.tokens.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      console.log('Email verification successful');
      return data;
    } catch (error) {
      console.error('Email verification failed:', error);
      throw error;
    }
  },
  
  /**
   * Resend verification email to inactive user
   */
  resendVerificationEmail: async (email: string): Promise<void> => {
    try {
      console.log('Resending verification email to:', email);
      
      const response = await fetch('http://localhost:8000/api/v1/auth/resend-verification/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Resend verification API error:', errorData);
        throw new Error(errorData.detail || 'Failed to resend verification email');
      }
      
      console.log('Verification email resent successfully');
    } catch (error) {
      console.error('Resend verification failed:', error);
      throw error;
    }
  },

  /**
   * Initiate Google OAuth login
   */
  initiateGoogleLogin: (): void => {
    // Generate a state parameter to protect against CSRF
    const state = uuidv4();
    localStorage.setItem('oauth_state', state);
    
    // Redirect to backend OAuth initiation endpoint
    window.location.href = `http://localhost:8000/api/v1/auth/social/google/?state=${state}`;
  },
  

  
  /**
   * Handle social authentication callback
   * This function is called when the user is redirected back from the OAuth provider
   */
  handleSocialCallback: (token: string, isNewUser: boolean = false): void => {
    if (!token) {
      console.error('No authentication token received from social login');
      throw new Error('Authentication failed');
    }
    
    // Store the token in localStorage
    localStorage.setItem('auth_token', token);
    
    // Redirect to dashboard or onboarding based on whether this is a new user
    if (isNewUser) {
      window.location.href = '/onboarding';
    } else {
      window.location.href = '/dashboard';
    }
  }
};

export default authService;
