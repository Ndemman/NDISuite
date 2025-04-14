import apiService from './apiService';
import { API_ENDPOINTS } from './config';
import { FileItem } from './fileService';

// Types for session operations
export interface SessionItem {
  id: string;
  name: string;
  description?: string;
  type: 'report' | 'recording' | 'upload';
  status: 'to-start' | 'in-progress' | 'completed';
  created_at: string;
  updated_at: string;
  user_id: string;
  files: FileItem[];
  settings?: {
    language?: 'en' | 'ar';
    output_format?: string;
    fields?: string[];
  };
  content?: {
    raw_content?: string;
    processed_content?: string;
    highlights?: {
      id: string;
      text: string;
      start_index: number;
      end_index: number;
      note?: string;
    }[];
  };
}

export interface SessionListResponse {
  results: SessionItem[];
  count: number;
  next: string | null;
  previous: string | null;
}

export interface CreateSessionData {
  name: string;
  description?: string;
  type: 'report' | 'recording' | 'upload';
  status: 'to-start' | 'in-progress' | 'completed';
  files: string[]; // Array of file IDs
  report_type?: string;
  recording_id?: string;
  transcript?: string;
  audio_url?: string;
  duration?: number;
  settings?: {
    language?: 'en' | 'ar';
    output_format?: string;
    fields?: string[];
  };
  content?: {
    raw_content?: string;
    processed_content?: string;
  };
}

export interface UpdateSessionData {
  name?: string;
  description?: string;
  status?: 'to-start' | 'in-progress' | 'completed';
  files?: string[]; // Array of file IDs
  settings?: {
    language?: 'en' | 'ar';
    output_format?: string;
    fields?: string[];
  };
  content?: {
    raw_content?: string;
    processed_content?: string;
    highlights?: {
      id: string;
      text: string;
      start_index: number;
      end_index: number;
      note?: string;
    }[];
  };
}

/**
 * Service for session-related API operations
 */
class SessionService {
  /**
   * Create a new session
   */
  async createSession(data: CreateSessionData, token: string): Promise<SessionItem> {
    return apiService.post<SessionItem>(
      API_ENDPOINTS.SESSIONS.CREATE,
      data,
      { token }
    );
  }

  /**
   * List all sessions
   */
  async listSessions(token: string, page = 1, pageSize = 10): Promise<SessionListResponse> {
    return apiService.get<SessionListResponse>(
      `${API_ENDPOINTS.SESSIONS.LIST}?page=${page}&page_size=${pageSize}`,
      { token }
    );
  }

  /**
   * Get session details
   */
  async getSession(id: string, token: string): Promise<SessionItem> {
    return apiService.get<SessionItem>(
      API_ENDPOINTS.SESSIONS.GET(id),
      { token }
    );
  }

  /**
   * Update a session
   */
  async updateSession(id: string, data: UpdateSessionData, token: string): Promise<SessionItem> {
    return apiService.patch<SessionItem>(
      API_ENDPOINTS.SESSIONS.UPDATE(id),
      data,
      { token }
    );
  }

  /**
   * Delete a session
   */
  async deleteSession(id: string, token: string): Promise<void> {
    return apiService.delete(
      API_ENDPOINTS.SESSIONS.DELETE(id),
      { token }
    );
  }

  /**
   * Synchronize local sessions with backend
   * This is used to push local sessions to the backend and pull remote sessions
   */
  async syncSessions(localSessions: any[], token: string): Promise<SessionItem[]> {
    return apiService.post<SessionItem[]>(
      `${API_ENDPOINTS.SESSIONS.LIST}/sync`,
      { sessions: localSessions },
      { token }
    );
  }

  /**
   * Add a file to a session
   */
  async addFileToSession(sessionId: string, fileId: string, token: string): Promise<SessionItem> {
    return apiService.post<SessionItem>(
      `${API_ENDPOINTS.SESSIONS.GET(sessionId)}/files`,
      { file_id: fileId },
      { token }
    );
  }

  /**
   * Remove a file from a session
   */
  async removeFileFromSession(sessionId: string, fileId: string, token: string): Promise<SessionItem> {
    return apiService.delete<SessionItem>(
      `${API_ENDPOINTS.SESSIONS.GET(sessionId)}/files/${fileId}`,
      { token }
    );
  }
}

// Create and export a singleton instance
const sessionService = new SessionService();
export default sessionService;
