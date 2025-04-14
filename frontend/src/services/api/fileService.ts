import apiService from './apiService';
import { API_ENDPOINTS } from './config';

// Types for file operations
export interface FileItem {
  id: string;
  name: string;
  file_type: string;
  size: number;
  url: string;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'processing' | 'ready' | 'error';
  transcription?: string;
  metadata?: Record<string, any>;
}

export interface FileListResponse {
  results: FileItem[];
  count: number;
  next: string | null;
  previous: string | null;
}

export interface FileUploadOptions {
  name?: string;
  metadata?: Record<string, any>;
}

export interface TranscriptionResponse {
  id: string;
  file_id: string;
  text: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

/**
 * Service for file-related API operations
 */
class FileService {
  /**
   * Upload a file
   */
  async uploadFile(
    file: File,
    token: string,
    onProgress?: (progress: number) => void,
    options?: FileUploadOptions
  ): Promise<FileItem> {
    return apiService.uploadFile<FileItem>(
      API_ENDPOINTS.FILES.UPLOAD,
      file,
      onProgress,
      token,
      options
    );
  }

  /**
   * List all files
   */
  async listFiles(token: string, page = 1, pageSize = 10): Promise<FileListResponse> {
    return apiService.get<FileListResponse>(
      `${API_ENDPOINTS.FILES.LIST}?page=${page}&page_size=${pageSize}`,
      { token }
    );
  }

  /**
   * Get file details
   */
  async getFile(id: string, token: string): Promise<FileItem> {
    return apiService.get<FileItem>(
      API_ENDPOINTS.FILES.DELETE(id),
      { token }
    );
  }

  /**
   * Delete a file
   */
  async deleteFile(id: string, token: string): Promise<void> {
    return apiService.delete(
      API_ENDPOINTS.FILES.DELETE(id),
      { token }
    );
  }

  /**
   * Start transcription process for a file
   */
  async transcribeFile(
    id: string,
    token: string,
    options?: { language?: 'en' | 'ar' }
  ): Promise<TranscriptionResponse> {
    return apiService.post<TranscriptionResponse>(
      API_ENDPOINTS.FILES.TRANSCRIBE(id),
      options || {},
      { token }
    );
  }

  /**
   * Check transcription status
   */
  async getTranscriptionStatus(id: string, token: string): Promise<TranscriptionResponse> {
    return apiService.get<TranscriptionResponse>(
      `${API_ENDPOINTS.FILES.TRANSCRIBE(id)}/status`,
      { token }
    );
  }
}

// Create and export a singleton instance
const fileService = new FileService();
export default fileService;
