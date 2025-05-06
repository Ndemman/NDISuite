/**
 * Authentication utilities for API requests
 */

/**
 * Get authentication headers for API requests
 * @returns Headers object with Authorization if token exists
 */
export const authHeader = (): Record<string, string> => {
  if (typeof window === 'undefined') return {}; // For SSR
  
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default {
  authHeader
};
