/**
 * Global error handling utilities
 */

// Store the original console.error method
const originalConsoleError = console.error;

// Patch console.error to filter out cancelled request errors
console.error = function(...args: any[]) {
  // Check if this is a cancelled request error
  const isCancelledError = args.some(arg => {
    // Check if the argument is the cancelled object
    if (arg && typeof arg === 'object' && 'cancelled' in arg && Object.keys(arg).length === 1) {
      return true;
    }
    
    // Check if the argument is a string representation of the cancelled object
    if (typeof arg === 'string' && (arg.includes('{"cancelled":true}') || arg === '{"cancelled":true}')) {
      return true;
    }
    
    return false;
  });
  
  // If it's a cancelled error, log it as info instead of error
  if (isCancelledError) {
    console.log('Request was cancelled - suppressed error');
    return;
  }
  
  // Otherwise, pass through to the original console.error
  originalConsoleError.apply(console, args);
};

// Function to initialize error handling
export function initializeErrorHandling() {
  // Additional error handling could be added here in the future
  console.log('Global error handling initialized');
}

export default {
  initializeErrorHandling
};
