import { API_BASE_URL, API_TIMEOUT, getDefaultHeaders, handleApiError } from './config';

// Type definitions for API request options
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  token?: string;
  timeout?: number;
}

/**
 * Creates a promise that rejects after the given timeout
 */
const timeoutPromise = (timeout: number): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timed out after ${timeout}ms`));
    }, timeout);
  });
};

/**
 * Base API service for making HTTP requests to the backend
 */
class ApiService {
  private baseUrl: string;

  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Make an API request with proper error handling and timeout
   */
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const {
      method = 'GET',
      headers = {},
      body,
      token,
      timeout = API_TIMEOUT,
    } = options;

    const url = `${this.baseUrl}${endpoint}`;
    
    // Prepare request options
    const requestHeaders = {
      ...getDefaultHeaders(token),
      ...headers,
    };

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      credentials: 'include', // Include cookies for CSRF protection
    };

    // Add body for non-GET requests
    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    try {
      // Create a race between the fetch and a timeout
      const response = await Promise.race([
        fetch(url, requestOptions),
        timeoutPromise(timeout),
      ]) as Response;

      // Handle non-success responses
      if (!response.ok) {
        const error = await handleApiError(response);
        throw error;
      }

      // For 204 No Content responses
      if (response.status === 204) {
        return {} as T;
      }

      // Parse response as JSON
      const data = await response.json();
      return data as T;
    } catch (error) {
      // Rethrow API errors
      if ((error as any).status) {
        throw error;
      }
      
      // Handle network or timeout errors
      throw {
        status: 0,
        message: (error as Error).message || 'Network error',
      };
    }
  }

  /**
   * Shorthand methods for common HTTP verbs
   */
  async get<T>(endpoint: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T>(endpoint: string, body: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async patch<T>(endpoint: string, body: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  async delete<T>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * File upload with progress tracking
   */
  async uploadFile<T>(
    endpoint: string, 
    file: File, 
    onProgress?: (progress: number) => void,
    token?: string,
    additionalData?: Record<string, any>
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    
    // Add any additional data
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return new Promise((resolve, reject) => {
      // Create XMLHttpRequest for upload with progress tracking
      const xhr = new XMLHttpRequest();
      
      // Setup progress tracking
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            onProgress(percentComplete);
          }
        });
      }
      
      // Handle response
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response as T);
          } catch (e) {
            reject({
              status: xhr.status,
              message: 'Invalid JSON response',
            });
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject({
              status: xhr.status,
              message: errorData.detail || errorData.message || xhr.statusText,
              errors: errorData.errors || {},
            });
          } catch (e) {
            reject({
              status: xhr.status,
              message: xhr.statusText,
            });
          }
        }
      };
      
      // Handle network errors
      xhr.onerror = function() {
        reject({
          status: 0,
          message: 'Network error occurred',
        });
      };
      
      // Handle timeouts
      xhr.ontimeout = function() {
        reject({
          status: 0,
          message: `Request timed out after ${API_TIMEOUT}ms`,
        });
      };
      
      // Open and send request
      xhr.open('POST', url, true);
      xhr.timeout = API_TIMEOUT;
      
      // Set authorization header if token provided
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      xhr.send(formData);
    });
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
