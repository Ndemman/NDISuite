import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from './apiClient';
import { authHeader } from '../utils/authUtils';

export interface Session {
  id: string;
  title: string;
  description: string;
  client: string;
  status: 'draft' | 'in-progress' | 'completed';
  created_at: string;
  updated_at: string;
  reports?: Report[];
}

export interface Report {
  id: string;
  title: string;
  session_id: string;
  template_id: string;
  content: Record<string, any>;
  status: 'draft' | 'in-progress' | 'completed';
  created_at: string;
  updated_at: string;
  version: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  sections: TemplateSection[];
  created_at: string;
  updated_at: string;
}

export interface TemplateSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  required: boolean;
}

export interface ExportOptions {
  format: 'pdf' | 'docx' | 'html';
  include_logo: boolean;
  include_signature?: boolean;
  template_id?: string;
}

/**
 * Reports service for managing sessions, reports, and templates
 */
export const reportsService = {
  /**
   * Get all sessions for the current user
   */
  getSessions: async (): Promise<Session[]> => {
    return await apiGet<Session[]>('/reports/sessions/');
  },
  
  /**
   * Get a specific session by ID
   */
  getSession: async (sessionId: string): Promise<Session> => {
    return await apiGet<Session>(`/reports/sessions/${sessionId}/`);
  },
  
  /**
   * Create a new session
   */
  createSession: async (sessionData: Partial<Session>): Promise<Session> => {
    try {
      console.log('Creating session with data:', sessionData);
      
      // For direct fetch to work around potential network issues in development
      if (typeof window !== 'undefined') {
        const response = await fetch('/api/v1/reports/sessions/', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...authHeader()
          },
          body: JSON.stringify(sessionData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Session creation API error:', errorData);
          throw new Error(JSON.stringify(errorData));
        }
        
        return await response.json();
      }
      
      // Fallback to apiPost with proper auth headers
      return await apiPost<Session>('/reports/sessions/', sessionData);
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing session
   */
  updateSession: async (sessionId: string, sessionData: Partial<Session>): Promise<Session> => {
    return await apiPut<Session>(`/reports/sessions/${sessionId}/`, sessionData);
  },
  
  /**
   * Delete a session
   */
  deleteSession: async (sessionId: string): Promise<void> => {
    await apiDelete<void>(`/reports/sessions/${sessionId}/`);
  },
  
  /**
   * Get all reports for a session
   */
  getReports: async (sessionId: string): Promise<Report[]> => {
    return await apiGet<Report[]>(`/reports/sessions/${sessionId}/reports/`);
  },
  
  /**
   * Get a specific report by ID
   */
  getReport: async (reportId: string): Promise<Report> => {
    return await apiGet<Report>(`/reports/reports/${reportId}/`);
  },
  
  /**
   * Create a new report
   */
  createReport: async (sessionId: string, reportData: Partial<Report>): Promise<Report> => {
    return await apiPost<Report>(`/reports/sessions/${sessionId}/reports/`, reportData);
  },
  
  /**
   * Update an existing report
   */
  updateReport: async (reportId: string, reportData: Partial<Report>): Promise<Report> => {
    return await apiPut<Report>(`/reports/reports/${reportId}/`, reportData);
  },
  
  /**
   * Delete a report
   */
  deleteReport: async (reportId: string): Promise<void> => {
    await apiDelete<void>(`/reports/reports/${reportId}/`);
  },
  
  /**
   * Get previous versions of a report
   */
  getReportVersions: async (reportId: string): Promise<Report[]> => {
    return await apiGet<Report[]>(`/reports/reports/${reportId}/versions/`);
  },
  
  /**
   * Export a report to a specified format
   */
  exportReport: async (reportId: string, options: ExportOptions): Promise<Blob> => {
    const response = await apiPost<Blob>(
      `/reports/reports/${reportId}/export/`,
      options,
      { responseType: 'blob' }
    );
    return response;
  },
  
  /**
   * Generate report content using AI
   */
  generateReportContent: async (reportId: string, sectionId?: string): Promise<Report> => {
    const endpoint = sectionId 
      ? `/reports/reports/${reportId}/generate/?section=${sectionId}`
      : `/reports/reports/${reportId}/generate/`;
      
    return await apiPost<Report>(endpoint);
  },
  
  /**
   * Get all available templates
   */
  getTemplates: async (): Promise<Template[]> => {
    return await apiGet<Template[]>('/reports/templates/');
  },
  
  /**
   * Get a specific template by ID
   */
  getTemplate: async (templateId: string): Promise<Template> => {
    return await apiGet<Template>(`/reports/templates/${templateId}/`);
  },
  
  /**
   * Create a shareable link for a report
   */
  createShareableLink: async (reportId: string, expiresInDays = 7): Promise<string> => {
    const response = await apiPost<{url: string}>(`/reports/reports/${reportId}/share/`, {
      expires_in_days: expiresInDays
    });
    return response.url;
  }
};

export default reportsService;
