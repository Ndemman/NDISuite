import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { TokenStore } from '@/utils/TokenStore';

// Extend AxiosRequestConfig to include the _retry property
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

// Set the base URL for API requests
// Using the Next.js API proxy instead of direct backend URL
const API_URL = '/api/v1/';

// For debugging in development
console.log('Using proxied API base URL:', API_URL);

// Create custom axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,  // Use the configured API_URL with trailing slash management
  headers: {
    // Removed default Content-Type header to allow Axios to auto-detect FormData
    // Content-Type will be set by apiPost or auto-detected by Axios for FormData
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout,
  withCredentials: true,  // Send cookies for refresh token
});

// Create a source map to store cancellation tokens
const cancelTokens = new Map<string, AbortController>();

// Helper to generate a unique request ID
const getRequestId = (url: string, method: string) => `${method}:${url}:${Date.now()}`;

// Helper to cancel previous requests to the same endpoint
const cancelPreviousRequests = (url: string, method: string) => {
  // Create a pattern to match similar requests (same URL and method)
  const pattern = `${method}:${url}`;
  
  // Find and cancel any matching previous requests
  for (const [key, controller] of cancelTokens.entries()) {
    if (key.startsWith(pattern)) {
      controller.abort();
      cancelTokens.delete(key);
    }
  }
};

// list of endpoints that should NOT include auth header - using exact path prefixes
const AUTH_EXEMPT_PATHS = [
  '/auth/login',
  '/auth/token',
  '/auth/token/refresh',
  '/auth/token/verify',
  '/api/v1/auth/login',
  '/api/v1/auth/registration',
  '/api/v1/auth/password/reset',
  '/api/v1/auth/token'
];

// Request interceptor for adding the auth token
apiClient.interceptors.request.use(
  (config) => {
    // Strip host from URL if present to handle both absolute and relative URLs
    const url = (config.url || "").replace(/^https?:\/\/[^/]+/, "");
    
    // Check if the URL starts with any of the exempt paths (exact prefix match)
    const isExempt = AUTH_EXEMPT_PATHS.some(p => url.startsWith(p));
    
    // If not exempt, add the Authorization header
    if (!isExempt) {
      const token = 
        TokenStore.access || localStorage.getItem("access");  // fallback
      if (token && config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    // Debug log to verify URL before it leaves the frontend
    console.log('REQUEST INTERCEPTOR URL:', config.url);
    
    // Cancel previous requests to the same endpoint
    cancelPreviousRequests(config.url!, config.method!);
    
    // Create a new AbortController for the current request
    const controller = new AbortController();
    config.signal = controller.signal;
    cancelTokens.set(getRequestId(config.url!, config.method!), controller);
    
    // Auto-append trailing slash to URLs (unless they have query params)
    if (config.url) {
      if (!config.url.endsWith('/') && !config.url.includes('?')) {
        config.url += '/';
        console.log('Trailing slash added:', config.url);
      }
    }
    
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Remove the request from the cancellation map
    const requestId = getRequestId(response.config.url!, response.config.method!);
    cancelTokens.delete(requestId);
    
    return response;
  },
  async (error: AxiosError) => {
    // Handle cancelled requests - don't propagate them as errors
    if (error.code === 'ERR_CANCELED') {
      console.log('Request was cancelled - suppressing error');
      // Return a resolved promise with a special cancelled flag
      // This prevents the error from propagating to the catch block
      return Promise.resolve({ data: { cancelled: true }, status: 200 });
    }
    
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized errors (expired token)
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Mark this request as retried to avoid infinite retry loop
      originalRequest._retry = true;
      
      try {
        // Call refresh endpoint (cookie supplies refresh token)
        console.log('Attempting token refresh');
        const { data } = await apiClient.post('/auth/token/refresh/', {});
        
        // Save the new access token to TokenStore
        TokenStore.set(data.access, TokenStore.refresh || '');
        
        // Update auth header and retry the original request
        originalRequest.headers['Authorization'] = `Bearer ${data.access}`;
        return apiClient(originalRequest);
        
      } catch (refreshError) {
        console.error('Could not refresh token:', refreshError);
        // Clear tokens on refresh failure
        TokenStore.clear();
        
        // Clear localStorage as well to maintain compatibility with existing code
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    // Handle 403 Forbidden errors
    if (error.response?.status === 403) {
      console.error('Access denied:', error.response.data);
    }
    
    // Handle 500 Server errors
    if (error.response?.status === 500) {
      console.error('Server error:', error.response.data);
      // Return a structured error for 500s to avoid hydration issues
      return Promise.reject({
        isApiError: true,
        status: 500,
        message: 'Internal Server Error',
        data: { error: 'The server encountered an unexpected condition' }
      });
    }
    
    return Promise.reject(error);
  }
);

// Ensure URLs have trailing slashes to prevent Django APPEND_SLASH errors
const ensureTrailingSlash = (url: string): string => {
  // Only add trailing slash if it's missing and doesn't already have query parameters
  if (!url.endsWith('/') && !url.includes('?')) {
    return `${url}/`;
  }
  return url;
};

// API Client helper functions
export const apiGet = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  // Normalize URL to ensure trailing slash
  const normalizedUrl = ensureTrailingSlash(url);
  try {
    const response = await apiClient.get<T>(normalizedUrl, config);
    
    // Check if this is a cancelled request that was converted to a success response
    if (response.data && typeof response.data === 'object' && 'cancelled' in response.data) {
      console.log(`GET request to ${url} was cancelled`);
      // @ts-ignore - We know this is safe because we checked for the cancelled property
      return response.data as T;
    }
    
    return response.data;
  } catch (error) {
    // Special handling for server 500 errors to prevent hydration issues
    if (error && typeof error === 'object' && 'isApiError' in error && 'status' in error && error.status === 500) {
      console.error(`GET request to ${url} failed with server error`);
      // Return empty array or object instead of throwing for hydration safety
      return (Array.isArray({})) ? [] as unknown as T : {} as T;
    }
    
    console.error(`GET request to ${url} failed`, error);
    throw handleApiError(error);
  }
};

export const apiPost = async <T>(url: string, data?: any, config: AxiosRequestConfig = {}): Promise<T> => {
  // Robust FormData detection that works across different execution contexts
  const isForm =
    typeof FormData !== "undefined" &&
    (data instanceof FormData ||
      Object.prototype.toString.call(data) === "[object FormData]");

  if (!isForm) {
    config.headers = {
      ...(config.headers || {}),
      "Content-Type": "application/json",
    };
  }

  // Normalize URL to ensure trailing slash
  const normalizedUrl = ensureTrailingSlash(url);
  try {
    const response = await apiClient.post<T>(normalizedUrl, data, config);
    
    // Check if this is a cancelled request that was converted to a success response
    if (response.data && typeof response.data === 'object' && 'cancelled' in response.data) {
      console.log(`POST request to ${url} was cancelled`);
      // @ts-ignore - We know this is safe because we checked for the cancelled property
      return response.data as T;
    }
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.code === 'ERR_CANCELED') {
      console.log(`POST request to ${url} was cancelled`);
      throw new Error('cancelled');
    }
    
    console.error(`POST request to ${url} failed`, { error, requestData: data });
    // If error is an AxiosError, extract and log the response data
    if (axios.isAxiosError(error) && error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
    }
    throw handleApiError(error);
  }
};

export const apiPut = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  // Normalize URL to ensure trailing slash
  const normalizedUrl = ensureTrailingSlash(url);
  try {
    const response = await apiClient.put<T>(normalizedUrl, data, config);
    
    // Check if this is a cancelled request that was converted to a success response
    if (response.data && typeof response.data === 'object' && 'cancelled' in response.data) {
      console.log(`PUT request to ${url} was cancelled`);
      // @ts-ignore - We know this is safe because we checked for the cancelled property
      return response.data as T;
    }
    
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const apiPatch = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  // Normalize URL to ensure trailing slash
  const normalizedUrl = ensureTrailingSlash(url);
  try {
    const response = await apiClient.patch<T>(normalizedUrl, data, config);
    
    // Check if this is a cancelled request that was converted to a success response
    if (response.data && typeof response.data === 'object' && 'cancelled' in response.data) {
      console.log(`PATCH request to ${url} was cancelled`);
      // @ts-ignore - We know this is safe because we checked for the cancelled property
      return response.data as T;
    }
    
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const apiDelete = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  // Normalize URL to ensure trailing slash
  const normalizedUrl = ensureTrailingSlash(url);
  try {
    const response = await apiClient.delete<T>(normalizedUrl, config);
    
    // Check if this is a cancelled request that was converted to a success response
    if (response.data && typeof response.data === 'object' && 'cancelled' in response.data) {
      console.log(`DELETE request to ${url} was cancelled`);
      // @ts-ignore - We know this is safe because we checked for the cancelled property
      return response.data as T;
    }
    
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Function to handle API errors and extract error messages
export const handleApiError = (error: unknown): Error => {
  // Handle cancelled requests gracefully
  if (axios.isAxiosError(error) && error.code === 'ERR_CANCELED') {
    console.log('Request was cancelled');
    return new Error('cancelled');
  }

  if (axios.isAxiosError(error)) {
    const serverError = error.response?.data;
    // Return the error message from the server if available
    if (serverError && typeof serverError === 'object') {
      if (serverError.detail) {
        return new Error(serverError.detail);
      }
      if (serverError.message) {
        return new Error(serverError.message);
      }
      if (serverError.error) {
        return new Error(serverError.error);
      }
      // If error is a validation error with multiple fields
      if (Object.keys(serverError).length > 0) {
        const errorMessages = Object.entries(serverError)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        return new Error(errorMessages);
      }
    }
    // If no structured error message, use the status text
    if (error.response) {
      return new Error(`${error.response.status}: ${error.response.statusText}`);
    }
    // For network errors without a response
    if (error.request) {
      return new Error('Network error. Please check your connection and try again.');
    }
  }
  // For non-Axios errors
  return error instanceof Error ? error : new Error('An unknown error occurred');
};

export default apiClient;
