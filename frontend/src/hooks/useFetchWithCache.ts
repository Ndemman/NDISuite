import { useState, useEffect, useCallback } from 'react';
import apiCache from '@/services/api/apiCache';
import apiService from '@/services/api/apiService';

interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  isCached: boolean;
}

interface FetchOptions {
  ttl?: number;
  skipCache?: boolean;
  dependencies?: any[];
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

/**
 * Custom hook for data fetching with caching
 * @param endpoint API endpoint
 * @param options Fetch options
 * @returns Fetch state and refetch function
 */
export function useFetchWithCache<T>(
  endpoint: string,
  options: FetchOptions = {}
) {
  const {
    ttl,
    skipCache = false,
    dependencies = [],
    onSuccess,
    onError
  } = options;

  const [state, setState] = useState<FetchState<T>>({
    data: null,
    isLoading: true,
    error: null,
    isCached: false
  });

  // Create a cache key from the endpoint
  const cacheKey = `fetch:${endpoint}`;

  // Function to fetch data
  const fetchData = useCallback(async (ignoreCache = false) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check cache first if not skipping
      if (!ignoreCache && !skipCache) {
        const cachedData = apiCache.get<T>(cacheKey);
        if (cachedData) {
          setState({
            data: cachedData,
            isLoading: false,
            error: null,
            isCached: true
          });
          onSuccess?.(cachedData);
          return;
        }
      }

      // Fetch from API
      const data = await apiService.get<T>(endpoint);
      
      // Cache the result if not skipping
      if (!skipCache) {
        apiCache.set(cacheKey, data, ttl);
      }
      
      setState({
        data,
        isLoading: false,
        error: null,
        isCached: false
      });
      
      onSuccess?.(data);
    } catch (error) {
      const errorObj = error as Error;
      setState({
        data: null,
        isLoading: false,
        error: errorObj,
        isCached: false
      });
      
      onError?.(errorObj);
    }
  }, [endpoint, skipCache, ttl, cacheKey, onSuccess, onError]);

  // Refetch function to force a fresh fetch
  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  return {
    ...state,
    refetch
  };
}

/**
 * Custom hook for data mutation (POST, PUT, PATCH, DELETE)
 * @param endpoint API endpoint
 * @param method HTTP method
 * @param options Mutation options
 * @returns Mutation state and mutate function
 */
export function useMutation<T, D = any>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
  options: Omit<FetchOptions, 'skipCache' | 'dependencies'> = {}
) {
  const { onSuccess, onError } = options;
  
  const [state, setState] = useState<Omit<FetchState<T>, 'isCached'>>({
    data: null,
    isLoading: false,
    error: null
  });

  // Function to perform the mutation
  const mutate = useCallback(async (data?: D) => {
    setState({ data: null, isLoading: true, error: null });

    try {
      let response: T;
      
      switch (method) {
        case 'POST':
          response = await apiService.post<T>(endpoint, data);
          break;
        case 'PUT':
          response = await apiService.put<T>(endpoint, data);
          break;
        case 'PATCH':
          response = await apiService.patch<T>(endpoint, data);
          break;
        case 'DELETE':
          response = await apiService.delete<T>(endpoint);
          break;
      }
      
      setState({
        data: response,
        isLoading: false,
        error: null
      });
      
      // Clear any cached data for this endpoint
      apiCache.delete(`fetch:${endpoint}`);
      
      onSuccess?.(response);
      return response;
    } catch (error) {
      const errorObj = error as Error;
      setState({
        data: null,
        isLoading: false,
        error: errorObj
      });
      
      onError?.(errorObj);
      throw error;
    }
  }, [endpoint, method, onSuccess, onError]);

  return {
    ...state,
    mutate
  };
}

export default useFetchWithCache;
