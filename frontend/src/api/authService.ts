import { apiPost } from './apiClient';

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
 * Authentication service for login, registration, and token refresh
 */
export const authService = {
  /**
   * Log in a user with email and password
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      console.log('Attempting login with credentials:', { email: credentials.email });

      // Make sure to use URL with trailing slash for Django compatibility
      const response = await fetch('http://localhost:8000/api/v1/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Login API error:', errorData);
        throw new Error('Invalid email or password.');
      }

      const data: LoginResponse = await response.json();

      // Store tokens and user data
      if (data.tokens) {
        localStorage.setItem('auth_token', data.tokens.access);
        localStorage.setItem('refresh_token', data.tokens.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

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
  register: async (userData: RegisterData): Promise<UserData> => {
    try {
      console.log('Registering with data:', userData);
      
      // Directly use fetch API to bypass Axios issues
      const response = await fetch('http://localhost:8000/api/v1/auth/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(userData)
      });
      
      console.log('Registration raw response:', response);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Registration API error:', errorData);
        // toast.error(`Registration failed: ${JSON.stringify(errorData)}`);
        throw new Error(`API error: ${JSON.stringify(errorData)}`);
      }
      
      const responseData = await response.json();
      console.log('Registration successful:', responseData);
      return responseData;
    } catch (error) {
      console.error('Registration failed with error:', error);
      // TypeScript safety: ensure error is treated as Error type with message property
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error message:', errorMessage);
      console.error('Full error object:', error);
      // toast.error(`Registration failed: ${errorMessage}`);
      throw error;
    }
  },
  
  /**
   * Refresh the access token using a refresh token
   */
  refreshToken: async (refreshToken: string): Promise<string> => {
    const data: RefreshTokenRequest = { refresh: refreshToken };
    const response = await apiPost<RefreshTokenResponse>('/auth/token/refresh/', data);
    
    if (response.access) {
      localStorage.setItem('auth_token', response.access);
    }
    
    return response.access;
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
    await apiPost('/auth/password-reset/', { email });
  },
  
  /**
   * Confirm a password reset with a token and new password
   */
  confirmPasswordReset: async (token: string, password: string): Promise<void> => {
    await apiPost('/auth/password-reset/confirm/', { token, password });
  }
};

export default authService;
