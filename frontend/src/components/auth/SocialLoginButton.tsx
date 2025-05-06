import React from 'react';
import { GoogleIcon } from './SocialIcons';

export interface SocialLoginButtonProps {
  provider: 'google';
  onClick: () => void;
  isLoading?: boolean;
  className?: string;
}

export const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({
  provider,
  onClick,
  isLoading = false,
  className = '',
}) => {
  // Only supporting Google for now as per requirements
  if (provider === 'google') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={isLoading}
        className={`inline-flex items-center justify-center py-1.5 px-4 border border-gray-200 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current mr-2"></div>
            <span>Signing in...</span>
          </>
        ) : (
          <>
            <GoogleIcon className="h-4 w-4 mr-2" />
            <span>Sign in with Google</span>
          </>
        )}
      </button>
    );
  }
  
  // Default fallback button (won't be used in this case)
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className={`inline-flex items-center justify-center py-1.5 px-4 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-900 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current mr-2"></div>
          <span>Signing in...</span>
        </>
      ) : (
        <span>Continue</span>
      )}
    </button>
  );
};

export default SocialLoginButton;
