// Type declarations for OpenAI API integration

/**
 * Project-based OpenAI API key format
 * This format requires OpenAI library v1.66.0+ and HTTPX 0.27.0+
 * Format: sk-proj-{random_string}
 */
declare interface OpenAIConfig {
  apiKey: string;  // Must use the project-based format
  organization?: string;
  baseURL?: string;
}

/**
 * Type guard to validate API key format
 */
declare function isValidProjectAPIKey(apiKey: string): boolean;
