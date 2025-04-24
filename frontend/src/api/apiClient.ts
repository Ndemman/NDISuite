import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Define base API URL
// For browser requests, we need to use localhost, not the Docker service name
// When running in the browser (client-side), we need to use localhost
const isBrowser = typeof window !== 'undefined';

// Environment variable from Docker (will use backend:8000 in Docker context)
let configuredUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// For browser-side requests, ensure we use localhost instead of service names
if (isBrowser && configuredUrl.includes('backend:')) {
  configuredUrl = configuredUrl.replace('backend:', 'localhost:');
}

// Ensure URL has a trailing slash
const API_URL = configuredUrl.endsWith('/') ? configuredUrl : `${configuredUrl}/`;

// Log the API URL for debugging
console.log('API URL configured as:', API_URL);

// Create custom axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,  // Use the configured API_URL with trailing slash management
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor for adding the auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage if it exists
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    // If token exists, add it to the headers
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
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
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const apiPost = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  try {
    console.log(`Making POST request to ${url}`, { data });
    const response = await apiClient.post<T>(url, data, config);
    console.log(`POST request to ${url} successful`, { response });
    return response.data;
  } catch (error) {
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
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const apiPatch = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  try {
    const response = await apiClient.patch<T>(url, data, config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const apiDelete = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  try {
    const response = await apiClient.delete<T>(url, config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Function to handle API errors and extract error messages
export const handleApiError = (error: unknown): Error => {
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
