/**
 * Authentication utilities for API requests
 */
import { TokenStore } from './TokenStore';

/**
 * Get authentication headers for API requests
 * @returns Headers object with Authorization if token exists
 */
export const authHeader = (): Record<string, string> => {
  if (typeof window === 'undefined') return {}; // For SSR
  
  const token = TokenStore.access;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default {
  authHeader
};
