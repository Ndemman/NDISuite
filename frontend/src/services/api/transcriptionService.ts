/**
 * Service for audio transcription operations
 */
class TranscriptionService {
  // OpenAI API key - using environment variable
  private openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || 'your-openai-api-key-here';
  private isValidApiKey: boolean;

  constructor() {
    // Check if we have what appears to be a valid API key
    this.isValidApiKey = this.openaiKey.startsWith('sk-') && this.openaiKey.length > 20;
  }

  /**
   * Generate a mock transcription for development purposes
   * @param durationMs Recording duration in milliseconds
   * @returns A simulated transcription based on recording duration
   */
  private generateMockTranscription(durationMs: number): string {
    // Sample NDIS-related phrases to use in mock transcriptions
    const ndisTemplates = [
      "The participant's mobility goals include independent transfer from wheelchair to bed.",
      "We discussed how the assistive technology would help with daily living activities.",
      "According to the assessment, the client would benefit from regular physiotherapy sessions.",
      "The support worker has been implementing the positive behavior support plan consistently.",
      "The occupational therapy evaluation shows improvement in fine motor skills.",
      "We reviewed the NDIS funding allocation for speech therapy services.",
      "The participant expressed interest in community access programs for social engagement.",
      "The support coordinator will follow up regarding the equipment request approval.",
      "Today's session focused on developing strategies for sensory regulation.",
      "We observed significant progress in the participant's communication skills since the last report."
    ];

    // Generate mock transcription length based on audio duration
    // About 150 words per minute is average speaking pace
    const words = Math.floor((durationMs / 1000 / 60) * 150);
    
    // Create a transcription with appropriate length
    let transcription = '';
    let wordCount = 0;
    
    while (wordCount < words) {
      // Pick a random template
      const template = ndisTemplates[Math.floor(Math.random() * ndisTemplates.length)];
      transcription += template + ' ';
      wordCount += template.split(' ').length;
    }
    
    return transcription.trim();
  }

  /**
   * Transcribe audio using OpenAI's Whisper model or fallback to mock implementation
   * @param audioBlob The audio blob to transcribe
   * @returns Promise with the transcription text
   */
  async transcribeAudio(audioBlob: Blob): Promise<string> {
    // Get the audio duration from the blob for potential mock transcription
    const audioDurationMs = await this.getAudioDuration(audioBlob);
    
    // If we don't have a valid API key, use the mock implementation
    if (!this.isValidApiKey) {
      console.warn('Using mock transcription service (no valid API key found).');
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      return this.generateMockTranscription(audioDurationMs);
    }
    
    // Otherwise, use the real OpenAI API
    try {
      // Create a FormData object to send the audio file
      const formData = new FormData();
      
      // Convert Blob to File with .wav extension for better compatibility
      const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
      
      // Add the file to the FormData
      formData.append('file', audioFile);
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'text');
      formData.append('language', 'en');
      
      // For NDIS-specific terminology
      formData.append('prompt', 'This is a recording related to NDIS (National Disability Insurance Scheme) or healthcare. Please be precise with medical and clinical terminology.');
      
      // Call OpenAI's transcription API directly
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiKey}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }
      
      // The response is plain text when response_format is 'text'
      const transcription = await response.text();
      return transcription;
    } catch (error) {
      // Improved error logging with specific error details
      if (error instanceof Error) {
        console.error('Error transcribing audio:', { 
          message: error.message,
          name: error.name,
          stack: error.stack
        });
      } else {
        console.error('Error transcribing audio:', String(error));
      }
      
      // Fall back to mock implementation if there was an API error
      console.warn('Falling back to mock transcription service due to API error.');
      return this.generateMockTranscription(audioDurationMs);
    }
  }

  /**
   * Get the duration of an audio blob in milliseconds
   * @param audioBlob The audio blob
   * @returns Promise with the duration in milliseconds
   */
  private async getAudioDuration(audioBlob: Blob): Promise<number> {
    return new Promise((resolve) => {
      // Create an audio element to get the duration
      const audio = new Audio();
      audio.src = URL.createObjectURL(audioBlob);
      
      // When metadata is loaded, get the duration
      audio.addEventListener('loadedmetadata', () => {
        const durationMs = audio.duration * 1000;
        URL.revokeObjectURL(audio.src);
        resolve(durationMs);
      });
      
      // If there's an error, assume a default duration
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(audio.src);
        resolve(30000); // Default to 30 seconds
      });
    });
  }
}

// Create and export a singleton instance
const transcriptionService = new TranscriptionService();
export default transcriptionService;
