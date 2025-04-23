import { apiGet, apiPost, apiDelete } from './apiClient';
import { AxiosProgressEvent } from 'axios';

export interface InputFile {
  id: string;
  session_id: string;
  title: string;
  file_name: string;
  file_type: string;
  file_size: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface ProcessedChunk {
  id: string;
  file_id: string;
  sequence: number;
  text: string;
  embedding?: number[];
  metadata?: Record<string, any>;
}

export interface FileUploadProgress {
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  message?: string;
}

/**
 * Files service for handling document uploads and processing
 */
export const filesService = {
  /**
   * Get all files for a session
   */
  getFiles: async (sessionId: string): Promise<InputFile[]> => {
    return await apiGet<InputFile[]>(`/files/sessions/${sessionId}/files/`);
  },
  
  /**
   * Get a specific file by ID
   */
  getFile: async (fileId: string): Promise<InputFile> => {
    return await apiGet<InputFile>(`/files/files/${fileId}/`);
  },
  
  /**
   * Upload a file for processing
   */
  uploadFile: async (
    sessionId: string, 
    file: File, 
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<InputFile> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('session_id', sessionId);
    formData.append('title', file.name);
    
    // Track upload progress if callback provided
    const config = onProgress ? {
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress({
            progress: percentCompleted,
            status: percentCompleted < 100 ? 'uploading' : 'processing',
            message: percentCompleted < 100 ? 'Uploading file...' : 'Processing file...'
          });
        }
      }
    } : undefined;
    
    return await apiPost<InputFile>('/files/upload/', formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  /**
   * Delete a file
   */
  deleteFile: async (fileId: string): Promise<void> => {
    await apiDelete<void>(`/files/files/${fileId}/`);
  },
  
  /**
   * Get the extracted text content from a file
   */
  getFileContent: async (fileId: string): Promise<string> => {
    const response = await apiGet<{content: string}>(`/files/files/${fileId}/content/`);
    return response.content;
  },
  
  /**
   * Get the processing status of a file
   */
  getFileStatus: async (fileId: string): Promise<InputFile> => {
    return await apiGet<InputFile>(`/files/files/${fileId}/status/`);
  },
  
  /**
   * Get the processed chunks for a file
   */
  getFileChunks: async (fileId: string): Promise<ProcessedChunk[]> => {
    return await apiGet<ProcessedChunk[]>(`/files/files/${fileId}/chunks/`);
  },
  
  /**
   * Create a report from an uploaded document
   */
  createReportFromFile: async (fileId: string, templateId: string): Promise<string> => {
    const response = await apiPost<{report_id: string}>(`/files/files/${fileId}/convert/`, {
      template_id: templateId
    });
    
    return response.report_id;
  },
  
  /**
   * Check if file type is supported
   */
  isSupportedFileType: (file: File): boolean => {
    const supportedTypes = [
      // Documents
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'text/plain',
      'text/markdown',
      'text/csv',
      
      // Audio files
      'audio/mpeg', // .mp3
      'audio/wav',
      'audio/x-m4a', // .m4a
      'audio/webm',
      'audio/ogg'
    ];
    
    return supportedTypes.includes(file.type);
  },
  
  /**
   * Get maximum allowed file size in bytes
   */
  getMaxFileSize: (): number => {
    // 50 MB for all file types
    return 50 * 1024 * 1024;
  }
};

export default filesService;
