import { apiGet, apiPost } from './apiClient';
import { TokenStore } from '@/utils/TokenStore';

export interface AudioRecording {
  id: string;
  session_id: string;
  title: string;
  duration: number;
  file_path: string;
  status: 'processing' | 'completed' | 'error';
  created_at: string;
}

export interface TranscriptionSegment {
  id: string;
  recording_id: string;
  transcript_id: string;
  start_time: number;
  end_time: number;
  text: string;
  confidence: number;
}

export interface Transcript {
  id: string;
  recording_id: string;
  session_id: string;
  title: string;
  text: string;
  status: 'draft' | 'completed' | 'error';
  segments: TranscriptionSegment[];
  created_at: string;
  updated_at: string;
}

export interface WebSocketMessage {
  type: 'chunk' | 'start' | 'stop' | 'error';
  data?: any;
}

/**
 * Transcription service for handling audio recording and transcription
 */
export const transcriptionService = {
  /**
   * Get all recordings for a session
   */
  getRecordings: async (sessionId: string): Promise<AudioRecording[]> => {
    return await apiGet<AudioRecording[]>(`/transcription/sessions/${sessionId}/recordings/`);
  },
  
  /**
   * Get a specific recording by ID
   */
  getRecording: async (recordingId: string): Promise<AudioRecording> => {
    return await apiGet<AudioRecording>(`/transcription/recordings/${recordingId}/`);
  },
  
  /**
   * Get the transcript for a recording
   */
  getTranscript: async (recordingId: string): Promise<Transcript> => {
    return await apiGet<Transcript>(`/transcription/recordings/${recordingId}/transcript/`);
  },
  
  /**
   * Start a new recording session with WebSocket connection
   */
  startRecordingSession: (sessionId: string, onMessage: (transcript: string) => void, onError: (error: Error) => void) => {
    // Get token from TokenStore
    const token = TokenStore.access;
    
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NEXT_PUBLIC_WS_HOST || window.location.host;
    const wsUrl = `${protocol}//${host}/ws/transcription/${sessionId}/?token=${token}`;
    
    const socket = new WebSocket(wsUrl);
    let recorder: MediaRecorder | null = null;
    let audioChunks: Blob[] = [];
    
    // Set up socket handlers
    socket.onopen = async () => {
      console.log('WebSocket connection established');
      
      try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Create MediaRecorder instance
        recorder = new MediaRecorder(stream);
        
        // Handle data available event
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
            
            // Convert audio chunk to base64 and send over WebSocket
            const fileReader = new FileReader();
            fileReader.onload = function(e: ProgressEvent<FileReader>) {
              const base64Data = e.target?.result;
              
              // Send audio chunk to the server
              socket.send(JSON.stringify({
                type: 'chunk',
                data: {
                  audio: base64Data,
                  timestamp: new Date().toISOString()
                }
              }));
            };
            
            fileReader.readAsDataURL(event.data);
          }
        };
        
        // Start recording
        recorder.start(1000); // Collect chunks every second
        
        // Send start message to server
        socket.send(JSON.stringify({
          type: 'start',
          data: {
            timestamp: new Date().toISOString()
          }
        }));
      } catch (error) {
        console.error('Error accessing microphone:', error);
        onError(new Error('Could not access microphone. Please check permissions.'));
        socket.close();
      }
    };
    
    // Handle messages from the server
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        
        if (message.type === 'chunk' && message.data?.text) {
          // Handle transcription chunk
          onMessage(message.data.text);
        } else if (message.type === 'error') {
          // Handle error message
          onError(new Error(message.data?.message || 'Unknown error occurred'));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    // Handle socket close
    socket.onclose = () => {
      console.log('WebSocket connection closed');
      
      // Stop recording if still active
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop();
      }
      
      // Stop all tracks in the stream
      if (recorder) {
        const stream = recorder.stream;
        const tracks = stream.getTracks();
        
        tracks.forEach(track => track.stop());
      }
    };
    
    // Handle socket errors
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      onError(new Error('Connection error. Please try again.'));
    };
    
    // Return functions to control the recording
    return {
      // Stop recording function
      stop: (): Blob[] => {
        if (recorder && recorder.state !== 'inactive') {
          recorder.stop();
          
          // Send stop message to server
          socket.send(JSON.stringify({
            type: 'stop',
            data: {
              timestamp: new Date().toISOString()
            }
          }));
        }
        
        // Close WebSocket connection
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
        
        return audioChunks;
      },
      
      // Check if recording is active
      isRecording: (): boolean => {
        return recorder !== null && recorder.state === 'recording';
      },
      
      // Close connection function
      close: () => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      }
    };
  },
  
  /**
   * Upload an audio file for transcription
   */
  uploadAudioFile: async (sessionId: string, audioFile: File): Promise<AudioRecording> => {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    formData.append('session_id', sessionId);
    
    // Don't set Content-Type - let Axios handle it automatically for FormData
    // This prevents overriding the Authorization header set by the interceptor
    return await apiPost<AudioRecording>('/transcription/upload/', formData);
  },
  
  /**
   * Edit transcript text
   */
  updateTranscript: async (transcriptId: string, text: string): Promise<Transcript> => {
    return await apiPost<Transcript>(`/transcription/transcripts/${transcriptId}/update/`, { text });
  },
  
  /**
   * Convert a transcript to a report
   */
  createReportFromTranscript: async (transcriptId: string, templateId: string): Promise<string> => {
    const response = await apiPost<{report_id: string}>(`/transcription/transcripts/${transcriptId}/convert/`, {
      template_id: templateId
    });
    
    return response.report_id;
  }
};

export default transcriptionService;
