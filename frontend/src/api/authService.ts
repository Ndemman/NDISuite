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
  job_title?: string;
  is_active: boolean;
  account_type: 'PARENT' | 'CHILD' | 'LONE';
  can_export_reports: boolean;
  can_create_templates: boolean;
  can_access_analytics: boolean;
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
    const response = await apiPost<LoginResponse>('/auth/login/', credentials);
    
    // Store tokens and user data
    if (response.tokens) {
      localStorage.setItem('auth_token', response.tokens.access);
      localStorage.setItem('refresh_token', response.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  },
  
  /**
   * Register a new user account
   */
  register: async (userData: RegisterData): Promise<UserData> => {
    return await apiPost<UserData>('/auth/register/', userData);
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
