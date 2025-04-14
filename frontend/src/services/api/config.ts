// API configuration

// Base URL for the API
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Default headers for API requests
export const getDefaultHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login/',
    REGISTER: '/auth/register/',
    REFRESH_TOKEN: '/auth/token/refresh/',
    VERIFY_TOKEN: '/auth/token/verify/',
    PASSWORD_RESET: '/auth/password/reset/',
    PASSWORD_RESET_CONFIRM: '/auth/password/reset/confirm/',
    PROFILE: '/auth/profile/',
  },
  // File upload endpoints
  FILES: {
    UPLOAD: '/files/upload/',
    LIST: '/files/',
    DELETE: (id: string) => `/files/${id}/`,
    TRANSCRIBE: (id: string) => `/files/${id}/transcribe/`,
  },
  // Recording endpoints
  RECORDINGS: {
    UPLOAD: '/recordings/upload/',
    LIST: '/recordings/',
    DELETE: (id: string) => `/recordings/${id}/`,
    TRANSCRIBE: (id: string) => `/recordings/${id}/transcribe/`,
  },
  // Session endpoints
  SESSIONS: {
    CREATE: '/sessions/',
    LIST: '/sessions/',
    GET: (id: string) => `/sessions/${id}/`,
    UPDATE: (id: string) => `/sessions/${id}/`,
    DELETE: (id: string) => `/sessions/${id}/`,
  },
  // Report generation endpoints
  REPORTS: {
    GENERATE: '/reports/generate/',
    REFINE: (id: string) => `/reports/${id}/refine/`,
  },
};

// API error type
export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

// Convert fetch API errors to structured API error
export const handleApiError = async (response: Response): Promise<ApiError> => {
  let errorData: any;
  
  try {
    errorData = await response.json();
  } catch (e) {
    errorData = { message: 'An unexpected error occurred' };
  }
  
  return {
    status: response.status,
    message: errorData.detail || errorData.message || response.statusText,
    errors: errorData.errors || {},
  };
};

// Timeout for API requests (in milliseconds)
export const API_TIMEOUT = 30000; // 30 seconds
