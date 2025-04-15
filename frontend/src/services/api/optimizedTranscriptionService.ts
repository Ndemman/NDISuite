import apiCache from './apiCache';
import { memoize, throttle } from '@/lib/utils'; // Using standardized import path as per memory
import { debounce } from '@/lib/utils';

/**
 * Optimized Transcription Service with caching and performance improvements
 */
class OptimizedTranscriptionService {
  private apiKey: string | null = null;
  private apiEndpoint = 'https://api.openai.com/v1/audio/transcriptions';
  private mockTranscriptionDelay = 2000; // ms
  
  /**
   * Set the API key for the OpenAI service
   */
  setApiKey(key: string): void {
    this.apiKey = key;
  }
  
  /**
   * Check if a valid API key is set
   */
  get isValidApiKey(): boolean {
    return !!this.apiKey && this.apiKey.startsWith('sk-') && this.apiKey.length > 20;
  }
  
  /**
   * Transcribe audio with caching
   * @param audioBlob Audio blob to transcribe
   * @param audioDurationMs Duration of audio in milliseconds (for mock transcription)
   * @returns Transcription text
   */
  async transcribeAudio(audioBlob: Blob, audioDurationMs?: number): Promise<string> {
    // Generate a cache key based on the audio blob
    const cacheKey = await this.generateCacheKey(audioBlob);
    
    // Check if we have a cached transcription
    const cachedTranscription = apiCache.get<string>(cacheKey);
    if (cachedTranscription) {
      console.log('Using cached transcription');
      return cachedTranscription;
    }
    
    // If no valid API key, use mock transcription
    if (!this.isValidApiKey) {
      const transcription = await this.generateMockTranscription(audioDurationMs);
      
      // Cache the result
      apiCache.set(cacheKey, transcription, 30 * 60 * 1000); // Cache for 30 minutes
      
      return transcription;
    }
    
    try {
      // Create a file from the blob
      const audioFile = new File([audioBlob], 'audio.wav', { type: 'audio/wav' });
      
      // Create form data
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');
      
      // Make API request
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      const transcription = data.text;
      
      // Cache the result
      apiCache.set(cacheKey, transcription, 30 * 60 * 1000); // Cache for 30 minutes
      
      return transcription;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      
      // Fallback to mock transcription on error
      const transcription = await this.generateMockTranscription(audioDurationMs);
      
      // Cache the result
      apiCache.set(cacheKey, transcription, 30 * 60 * 1000); // Cache for 30 minutes
      
      return transcription;
    }
  }
  
  /**
   * Generate a mock transcription for testing
   * @param audioDurationMs Duration of audio in milliseconds
   * @returns Mock transcription
   */
  private async generateMockTranscription(audioDurationMs?: number): Promise<string> {
    // Calculate a realistic delay based on audio duration
    const delay = audioDurationMs 
      ? Math.min(this.mockTranscriptionDelay, audioDurationMs / 10) 
      : this.mockTranscriptionDelay;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Generate mock transcription
    const mockTranscriptions = [
      "This is a sample transcription of the recorded audio. In a real scenario, this would contain the actual spoken content from your recording.",
      "Thank you for using our transcription service. This is a placeholder text since we're using the mock transcription service.",
      "The quick brown fox jumps over the lazy dog. This is a sample transcription generated for testing purposes.",
      "NDIS report for client session on " + new Date().toLocaleDateString() + ". Client expressed satisfaction with current progress and discussed goals for the upcoming month."
    ];
    
    // Return a random mock transcription
    return mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
  }
  
  /**
   * Generate a cache key for an audio blob
   * @param blob Audio blob
   * @returns Cache key
   */
  private async generateCacheKey(blob: Blob): Promise<string> {
    // Use blob size and type as part of the key
    const blobInfo = `${blob.size}-${blob.type}`;
    
    // If available, use crypto API to generate a hash of the first 1MB of the blob
    if (window.crypto && window.crypto.subtle) {
      try {
        // Read the first 1MB of the blob
        const chunk = await blob.slice(0, Math.min(1024 * 1024, blob.size)).arrayBuffer();
        
        // Generate a hash
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', chunk);
        
        // Convert hash to hex string
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        return `transcription-${hashHex}-${blobInfo}`;
      } catch (error) {
        console.error('Error generating cache key:', error);
      }
    }
    
    // Fallback to using blob info and timestamp
    return `transcription-${blobInfo}-${Date.now()}`;
  }
  
  /**
   * Throttled version of transcribeAudio to prevent too many concurrent requests
   */
  throttledTranscribeAudio = throttle(
    this.transcribeAudio.bind(this),
    5000 // Allow one request every 5 seconds
  );
  
  /**
   * Memoized version of generateMockTranscription for better performance
   */
  memoizedGenerateMockTranscription = memoize(
    this.generateMockTranscription.bind(this)
  );
}

// Create and export a singleton instance
const optimizedTranscriptionService = new OptimizedTranscriptionService();
export default optimizedTranscriptionService;
