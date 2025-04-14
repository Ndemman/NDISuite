import apiService from './apiService';
import { API_ENDPOINTS } from './config';

// OpenAI API configuration - using environment variable
const API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || 'your-openai-api-key-here';

// Types for report generation operations
export interface ReportGenerationOptions {
  files: string[]; // Array of file IDs
  language: 'en' | 'ar';
  output_format: string;
  fields?: string[];
  model?: string; // Optional parameter to specify which AI model to use
}

export interface ReportSection {
  id: string;
  title: string;
  content: string;
}

export interface ReportResult {
  id: string;
  timestamp: string;
  content: string;
  sections: ReportSection[];
  metadata: {
    word_count: number;
    processing_time: number;
    sources_used: string[];
    model_used: string;
  };
}

export interface RefinementRequest {
  section_id: string;
  content: string;
  prompt?: string;
  highlights?: {
    text: string;
    start_index: number;
    end_index: number;
    note?: string;
  }[];
}

export interface RefinementResult {
  section_id: string;
  original_content: string;
  refined_content: string;
  timestamp: string;
  prompt?: string;
}

/**
 * Service for report generation API operations
 */
class ReportService {
  private openaiKey: string;

  constructor() {
    this.openaiKey = API_KEY;
  }
  /**
   * Generate a new report
   */
  async generateReport(
    options: ReportGenerationOptions,
    token: string,
    onProgress?: (progress: number) => void
  ): Promise<ReportResult> {
    // In a real implementation, this would use Server-Sent Events (SSE) or WebSockets
    // to track progress. For now, we'll simulate progress with timeouts.
    
    return new Promise((resolve, reject) => {
      // Start the generation request
      apiService.post<{ job_id: string }>(
        API_ENDPOINTS.REPORTS.GENERATE,
        options,
        { token }
      ).then(({ job_id }) => {
        // Simulate progress updates
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += Math.random() * 15;
          
          if (progress >= 100) {
            progress = 100;
            clearInterval(progressInterval);
          }
          
          if (onProgress) {
            onProgress(Math.min(Math.round(progress), 100));
          }
        }, 500);
        
        // Poll for job completion
        const checkJob = () => {
          apiService.get<{ status: string; result?: ReportResult }>(
            `${API_ENDPOINTS.REPORTS.GENERATE}/${job_id}/status`,
            { token }
          ).then(response => {
            if (response.status === 'completed' && response.result) {
              clearInterval(progressInterval);
              if (onProgress) onProgress(100);
              resolve(response.result);
            } else if (response.status === 'failed') {
              clearInterval(progressInterval);
              reject({ message: 'Report generation failed' });
            } else {
              // Continue polling
              setTimeout(checkJob, 1000);
            }
          }).catch(err => {
            clearInterval(progressInterval);
            reject(err);
          });
        };
        
        // Start polling
        setTimeout(checkJob, 1000);
      }).catch(err => {
        reject(err);
      });
    });
  }

  /**
   * Refine a section of a report
   */
  async refineSection(
    reportId: string,
    refinement: RefinementRequest,
    token: string
  ): Promise<RefinementResult> {
    try {
      // Try to use the backend API first
      return await apiService.post<RefinementResult>(
        API_ENDPOINTS.REPORTS.REFINE(reportId),
        refinement,
        { token }
      );
    } catch (error) {
      console.warn('Failed to refine using API, falling back to direct OpenAI call', error);
      
      // Prepare the prompt for refinement
      let prompt = `Please refine the following text. `;
      
      if (refinement.prompt) {
        prompt += `User instructions: ${refinement.prompt}\n\n`;
      }
      
      if (refinement.highlights && refinement.highlights.length > 0) {
        prompt += "The following parts need special attention:\n";
        
        refinement.highlights.forEach(highlight => {
          prompt += `- Text: "${highlight.text}"`;
          if (highlight.note) {
            prompt += ` (Note: ${highlight.note})`;
          }
          prompt += "\n";
        });
        
        prompt += "\n";
      }
      
      prompt += `Original text:\n"""\n${refinement.content}\n"""`;

      // Call OpenAI directly
      const refinedContent = await this.generateWithOpenAI(prompt);
      
      // Create a result object
      const result: RefinementResult = {
        section_id: refinement.section_id,
        original_content: refinement.content,
        refined_content: refinedContent,
        timestamp: new Date().toISOString(),
        prompt: refinement.prompt
      };
      
      return result;
    }
  }

  /**
   * Retrieve a specific OpenAI model based on our API key configuration
   */
  async getAvailableModels(token: string): Promise<{ id: string; name: string }[]> {
    try {
      // First try to get from API
      return await apiService.get<{ id: string; name: string }[]>(
        `${API_ENDPOINTS.REPORTS.GENERATE}/models`,
        { token }
      );
    } catch (error) {
      console.warn('Failed to get models from API, using predefined list', error);
      // Fallback list of models compatible with the API key
      return [
        { id: 'gpt-4o', name: 'GPT-4o' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
      ];
    }
  }

  /**
   * Direct OpenAI API call for text generation
   * This can be used when the backend is not available
   */
  async generateWithOpenAI(prompt: string, model: string = 'gpt-4o'): Promise<string> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiKey}`,
          'OpenAI-Beta': 'assistants=v1'
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error calling OpenAI API directly:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const reportService = new ReportService();
export default reportService;
