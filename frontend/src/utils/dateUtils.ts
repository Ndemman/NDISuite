/**
 * Date utility functions for consistent date formatting across the application
 */

/**
 * Format a date string to a standard format (DD/MM/YYYY)
 * @param dateString - ISO date string to format
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Format a date string with month name (DD Month YYYY)
 * @param dateString - ISO date string to format
 * @returns Formatted date string with month name
 */
export const formatDateWithMonthName = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Get a formatted date string for static display
 * Useful for reports and documents that need consistent date formatting
 * @param dateString - ISO date string to format
 * @returns Formatted date string for static display
 */
export const getStaticDateFormatted = (dateString: string): string => {
  const date = new Date(dateString);
  
  const day = date.getDate();
  const month = date.toLocaleString('en-AU', { month: 'long' });
  const year = date.getFullYear();
  
  // Add ordinal suffix to day number (1st, 2nd, 3rd, etc.)
  const ordinalSuffix = getOrdinalSuffix(day);
  
  return `${day}${ordinalSuffix} ${month} ${year}`;
};

/**
 * Format a date as relative time (e.g., "2 hours ago", "3 days ago")
 * @param dateString - ISO date string to format
 * @returns Relative time string
 */
export const getRelativeTimeFromNow = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);
  const diffMonth = Math.round(diffDay / 30);
  const diffYear = Math.round(diffMonth / 12);
  
  if (diffSec < 60) {
    return diffSec === 1 ? '1 second ago' : `${diffSec} seconds ago`;
  } else if (diffMin < 60) {
    return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
  } else if (diffHour < 24) {
    return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`;
  } else if (diffDay < 30) {
    return diffDay === 1 ? 'yesterday' : `${diffDay} days ago`;
  } else if (diffMonth < 12) {
    return diffMonth === 1 ? '1 month ago' : `${diffMonth} months ago`;
  } else {
    return diffYear === 1 ? '1 year ago' : `${diffYear} years ago`;
  }
};

/**
 * Get the ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 * @param day - Day number
 * @returns Ordinal suffix string
 */
function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}
