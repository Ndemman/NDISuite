import apiClient, { apiGet, apiPost, apiDelete } from './apiClient';
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
    return await apiGet<InputFile[]>(`files/sessions/${sessionId}/files/`); // Add trailing slash to match backend router expectation
  },
  
  /**
   * Get a specific file by ID
   */
  getFile: async (fileId: string): Promise<InputFile> => {
    return await apiGet<InputFile>(`files/files/${fileId}/`); // No leading slash to preserve baseURL
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
    // session is now part of the URL path, not form data
    formData.append('title', file.name);
    formData.append('original_filename', file.name);
    formData.append('file_size', file.size.toString());
    // file_type omitted – backend handles or derives it
    
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
    
    // Verify FormData is correctly created
    console.assert(formData instanceof FormData, "formData is not an instance of FormData");
    console.assert(Object.prototype.toString.call(formData) === "[object FormData]", "formData does not match [object FormData]");
    
    // Bypass apiPost so no JSON header logic runs
    // Axios auto-detects FormData and sets the correct Content-Type
    // The global interceptor still injects Authorization: Bearer token
    // Use the session-scoped endpoint instead of the legacy endpoint
    const url = `${process.env.NEXT_PUBLIC_API_URL}/reports/sessions/${sessionId}/files/`; // Use absolute URL to bypass Next.js proxy
    
    // temporary debug ↓↓↓
    console.log("upload sessionId =", sessionId);
    console.log("upload url      =", url);
    // end debug ↑↑↑
    
    const response = await apiClient.post<InputFile>(url, formData, config);  // trailing slash avoids 308
    return response.data;
  },
  
  /**
   * Delete a file
   */
  deleteFile: async (fileId: string): Promise<void> => {
    await apiDelete<void>(`files/files/${fileId}/`); // No leading slash to preserve baseURL
  },
  
  /**
   * Get the extracted text content from a file
   */
  getFileContent: async (fileId: string): Promise<string> => {
    const response = await apiGet<{content: string}>(`files/files/${fileId}/content/`); // No leading slash to preserve baseURL
    return response.content;
  },
  
  /**
   * Get the processing status of a file
   */
  getFileStatus: async (fileId: string): Promise<InputFile> => {
    return await apiGet<InputFile>(`files/files/${fileId}/status/`); // No leading slash to preserve baseURL
  },
  
  /**
   * Get the processed chunks for a file
   */
  getFileChunks: async (fileId: string): Promise<ProcessedChunk[]> => {
    return await apiGet<ProcessedChunk[]>(`files/files/${fileId}/chunks/`); // No leading slash to preserve baseURL
  },
  
  /**
   * Create a report from an uploaded document
   */
  createReportFromFile: async (fileId: string, templateId: string): Promise<string> => {
    const response = await apiPost<{report_id: string}>(`files/files/${fileId}/convert/`, { // No leading slash to preserve baseURL
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
