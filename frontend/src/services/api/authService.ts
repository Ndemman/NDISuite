import apiService from './apiService';
import { API_ENDPOINTS } from './config';

// Types for authentication
export interface LoginData {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    is_verified: boolean;
  };
}

export interface ProfileData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_verified: boolean;
  profile_picture?: string;
  language_preference?: 'en' | 'ar';
}

export interface PasswordResetData {
  email: string;
}

export interface PasswordResetConfirmData {
  token: string;
  password: string;
  password_confirm: string;
}

export interface PasswordChangeData {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
}

export interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  language_preference?: 'en' | 'ar';
}

/**
 * Service for authentication-related API operations
 */
class AuthService {
  /**
   * Login with email and password
   */
  async login(data: LoginData): Promise<TokenResponse> {
    return apiService.post<TokenResponse>(API_ENDPOINTS.AUTH.LOGIN, data);
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<TokenResponse> {
    return apiService.post<TokenResponse>(API_ENDPOINTS.AUTH.REGISTER, data);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<{ access: string }> {
    return apiService.post<{ access: string }>(
      API_ENDPOINTS.AUTH.REFRESH_TOKEN,
      { refresh: refreshToken }
    );
  }

  /**
   * Verify token validity
   */
  async verifyToken(token: string): Promise<{ valid: boolean }> {
    try {
      await apiService.post(API_ENDPOINTS.AUTH.VERIFY_TOKEN, { token });
      return { valid: true };
    } catch (error) {
      return { valid: false };
    }
  }

  /**
   * Request password reset
   */
  async resetPassword(data: PasswordResetData): Promise<{ message: string }> {
    return apiService.post<{ message: string }>(
      API_ENDPOINTS.AUTH.PASSWORD_RESET,
      data
    );
  }

  /**
   * Confirm password reset with token
   */
  async resetPasswordConfirm(data: PasswordResetConfirmData): Promise<{ message: string }> {
    return apiService.post<{ message: string }>(
      API_ENDPOINTS.AUTH.PASSWORD_RESET_CONFIRM,
      data
    );
  }

  /**
   * Get user profile
   */
  async getProfile(token: string): Promise<ProfileData> {
    return apiService.get<ProfileData>(API_ENDPOINTS.AUTH.PROFILE, { token });
  }

  /**
   * Update user profile
   */
  async updateProfile(data: ProfileUpdateData, token: string): Promise<ProfileData> {
    return apiService.patch<ProfileData>(API_ENDPOINTS.AUTH.PROFILE, data, { token });
  }

  /**
   * Change user password
   */
  async changePassword(data: PasswordChangeData, token: string): Promise<{ message: string }> {
    return apiService.post<{ message: string }>(
      `${API_ENDPOINTS.AUTH.PROFILE}/change-password/`,
      data,
      { token }
    );
  }

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(
    file: File,
    token: string,
    onProgress?: (progress: number) => void
  ): Promise<ProfileData> {
    return apiService.uploadFile<ProfileData>(
      `${API_ENDPOINTS.AUTH.PROFILE}/picture/`,
      file,
      onProgress,
      token
    );
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;
