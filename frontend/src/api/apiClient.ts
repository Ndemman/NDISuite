import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Set the base URL for API requests
// Using the Next.js API proxy instead of direct backend URL
const API_URL = '/api/v1/';

// For debugging in development
console.log('Using proxied API base URL:', API_URL);

// Create custom axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,  // Use the configured API_URL with trailing slash management
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
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

// Request interceptor for adding the auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage if it exists
    let token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    // For development purposes, use a fallback token if no token exists
    if (!token) {
      token = 'dev-access-token'; // This will be used during development only
      // Store it in localStorage for future requests
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', token);
      }
    }
    
    // Add token to the headers
    if (config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Cancel previous requests to the same endpoint
    cancelPreviousRequests(config.url!, config.method!);
    
    // Create a new AbortController for the current request
    const controller = new AbortController();
    config.signal = controller.signal;
    cancelTokens.set(getRequestId(config.url!, config.method!), controller);
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
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
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Try to get refresh token
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken && originalRequest) {
        try {
          // Call refresh token endpoint
          const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
            refresh: refreshToken
          });
          
          const { access } = response.data;
          
          // Update stored token
          localStorage.setItem('auth_token', access);
          
          // Retry the original request with new token
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${access}`;
          }
          
          return axios(originalRequest);
        } catch (refreshError) {
          // If refresh token also fails, clear auth and redirect to login
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
      } else {
        // No refresh token, clear auth and redirect to login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
      }
    }
    
    // Handle 403 Forbidden errors
    if (error.response?.status === 403) {
      console.error('Access denied:', error.response.data);
    }
    
    // Handle 500 Server errors
    if (error.response?.status === 500) {
      console.error('Server error:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

// API Client helper functions
export const apiGet = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  try {
    const response = await apiClient.get<T>(url, config);
    
    // Check if this is a cancelled request that was converted to a success response
    if (response.data && typeof response.data === 'object' && 'cancelled' in response.data) {
      console.log(`GET request to ${url} was cancelled`);
      // @ts-ignore - We know this is safe because we checked for the cancelled property
      return response.data as T;
    }
    
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const apiPost = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  try {
    console.log(`Making POST request to ${url}`, { data });
    const response = await apiClient.post<T>(url, data, config);
    
    // Check if this is a cancelled request that was converted to a success response
    if (response.data && typeof response.data === 'object' && 'cancelled' in response.data) {
      console.log(`POST request to ${url} was cancelled`);
      // @ts-ignore - We know this is safe because we checked for the cancelled property
      return response.data as T;
    }
    
    console.log(`POST request to ${url} successful`, { response });
    return response.data;
  } catch (error) {
    // Don't log cancelled requests as errors
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
  try {
    const response = await apiClient.put<T>(url, data, config);
    
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
  try {
    const response = await apiClient.patch<T>(url, data, config);
    
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
  try {
    const response = await apiClient.delete<T>(url, config);
    
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
