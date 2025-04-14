/**
 * Service for audio transcription operations
 */
class TranscriptionService {
  // OpenAI API key - using environment variable
  private openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || 'your-openai-api-key-here';

  /**
   * Transcribe audio using OpenAI's Whisper model via dedicated transcription endpoint
   * @param audioBlob The audio blob to transcribe
   * @returns Promise with the transcription text
   */
  async transcribeAudio(audioBlob: Blob): Promise<string> {
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
      console.error('Error transcribing audio:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const transcriptionService = new TranscriptionService();
export default transcriptionService;
