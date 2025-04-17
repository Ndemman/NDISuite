/**
 * RAG (Retrieval-Augmented Generation) Service
 * Handles processing of text from files and transcriptions to generate professional content
 */
class RAGService {
  // OpenAI API key - using environment variable
  private openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
  private isValidApiKey: boolean;
  
  // Common introductory phrases to remove
  private introductoryPhrases = [
    /^based on the provided information.*?\s*,\s*/i,
    /^based on the context.*?\s*,\s*/i,
    /^from the information provided.*?\s*,\s*/i,
    /^according to the transcript.*?\s*,\s*/i,
    /^from the transcript.*?\s*,\s*/i,
    /^the transcript indicates.*?\s*,\s*/i,
    /^in the provided session.*?\s*,\s*/i,
    /^i can provide the following.*?:\s*/i,
    /^here is.*?:\s*/i,
    /^below is.*?:\s*/i,
  ];

  constructor() {
    // Check if we have what appears to be a valid API key
    this.isValidApiKey = this.openaiKey.startsWith('sk-') && this.openaiKey.length > 20;
  }

  /**
   * Process content with RAG approach
   * @param query The user's query or formatting instruction
   * @param context Array of text content from files and transcriptions
   * @returns Promise with the generated content
   */
  async generateContent(query: string, context: string[]): Promise<string> {
    if (!this.isValidApiKey) {
      console.warn('Using mock RAG service (no valid API key found).');
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      const response = this.generateMockResponse(query, context);
      return this.cleanupResponse(response);
    }

    try {
      // Real implementation would call OpenAI API
      const response = await this.callOpenAI(query, context);
      return this.cleanupResponse(response);
    } catch (error) {
      console.error('Error generating content:', error);
      const fallbackResponse = this.generateMockResponse(query, context);
      return this.cleanupResponse(fallbackResponse);
    }
  }
  
  /**
   * Clean up response by removing introductory fluff
   * @param response The raw response text
   * @returns Cleaned response that starts with relevant content
   */
  private cleanupResponse(response: string): string {
    let cleanedResponse = response.trim();
    
    // Remove common introductory phrases
    for (const pattern of this.introductoryPhrases) {
      cleanedResponse = cleanedResponse.replace(pattern, '');
    }
    
    // Remove any leading whitespace after cleanup
    cleanedResponse = cleanedResponse.trim();
    
    // Ensure the first letter is capitalized if it's not already
    if (cleanedResponse.length > 0 && /[a-z]/.test(cleanedResponse[0])) {
      cleanedResponse = cleanedResponse[0].toUpperCase() + cleanedResponse.substring(1);
    }
    
    return cleanedResponse;
  }

  /**
   * Generate mock responses for development/demo purposes
   * @param query The user's query or formatting instruction
   * @param context Array of text content from files and transcriptions
   * @returns Generated content based on the query and context
   */
  private generateMockResponse(query: string, context: string[]): string {
    // Join all context strings with a space
    const combinedContext = context.join(' ');
    
    // Extract a sample of the context to make the response feel relevant
    const contextSample = combinedContext.substring(0, 500);
    
    // Common NDIS-related queries and responses - starting directly with relevant content
    if (query.toLowerCase().includes('overview') || query.toLowerCase().includes('main issue')) {
      return `The client is experiencing significant stress at work due to a colleague's failure to complete required reports on time, which directly affects the client's ability to do their job and meet deadlines. This has led to negative evaluations and a sense of helplessness, as previous efforts to address the issue—both upward and downward—have been ineffective. The session helped the client explore and identify a new, potentially productive avenue (a suggestion box reviewed at staff meetings) that could bring broader attention to the issue. This realization offered the client some emotional relief and a sense of regained control.`;
    }
    
    if (query.toLowerCase().includes('summary') || query.toLowerCase().includes('summarize')) {
      return `The client presented with work-related stress stemming from dependency on a colleague who consistently fails to complete reports on time. This situation has resulted in negative performance evaluations for the client despite the root cause being outside their control. Previous attempts to resolve the issue through direct communication with the colleague and discussions with management have been unsuccessful. During the session, the client explored alternative approaches and identified a potential solution involving the company's anonymous suggestion box, which is reviewed during staff meetings. This approach would bring the issue to wider attention without direct confrontation. The client expressed relief at having a new strategy and regained a sense of agency in addressing the situation. Follow-up will focus on implementing this approach and developing additional coping strategies for workplace stress.`;
    }
    
    if (query.toLowerCase().includes('recommendation') || query.toLowerCase().includes('suggest')) {
      return `1. The client should proceed with the identified strategy of using the anonymous suggestion box to bring attention to the systemic issue during staff meetings.\n\n2. Development of additional stress management techniques is recommended, including mindfulness practices and clear boundary-setting at work.\n\n3. The client would benefit from creating a documentation system to track instances where their work is impacted by the colleague's delays, providing objective evidence if needed for future discussions with management.\n\n4. Consider scheduling a follow-up session in 3-4 weeks to evaluate the effectiveness of these strategies and adjust the approach as needed.\n\n5. If the situation remains unresolved after implementing these strategies, exploration of organizational resources such as HR mediation or workplace counseling may be warranted.`;
    }
    
    if (query.toLowerCase().includes('goal') || query.toLowerCase().includes('objective')) {
      return `1. Short-term Goal: Implement the anonymous suggestion box strategy within the next week to address the systemic reporting issue without direct confrontation.\n\n2. Medium-term Goal: Develop and consistently apply stress management techniques to reduce the emotional impact of workplace challenges over the next month.\n\n3. Long-term Goal: Establish healthier workplace boundaries and communication patterns to prevent similar situations from affecting the client's wellbeing and performance evaluations in the future.\n\n4. Objective: Create a documentation system by the next session to track instances where work is impacted by external dependencies.\n\n5. Objective: Practice assertive communication techniques in low-stakes situations to build confidence for potential future discussions with management or colleagues.`;
    }
    
    // Default response for other queries - starting directly with relevant content
    return `The client has presented with concerns related to workplace dynamics that are affecting their performance and emotional wellbeing. The situation involves interdependencies with colleagues that are not functioning optimally, resulting in cascading effects on workflow and productivity. During our session, we explored both practical and emotional aspects of this challenge.\n\nThe client demonstrated good insight into the systemic nature of the issue and was receptive to exploring alternative approaches to resolution. We identified several potential strategies that align with the client's communication style and workplace culture, with particular emphasis on solutions that maintain professional relationships while addressing the core operational issues.\n\nMoving forward, we have established a plan that includes specific action steps, communication strategies, and self-care practices to support the client through this process. A follow-up assessment is recommended to evaluate the effectiveness of these interventions and make any necessary adjustments to the approach.`;
  }

  /**
   * Call OpenAI API to generate content
   * @param query The user's query or formatting instruction
   * @param context Array of text content from files and transcriptions
   * @returns Promise with the generated content from OpenAI
   */
  private async callOpenAI(query: string, context: string[]): Promise<string> {
    try {
      // Check for network connectivity first
      if (!navigator.onLine) {
        console.warn('Network is offline, using fallback generation');
        throw new Error('network_offline');
      }

      // Join context with separators for better processing
      const combinedContext = context.join('\n\n---\n\n');
      
      // Prepare the messages for the API call with improved prompt engineering
      const messages = [
        {
          role: 'system',
          content: 'You are an expert NDIS (National Disability Insurance Scheme) report writer. Your task is to generate professional, well-structured content based on the provided context and query. IMPORTANT: Start your response directly with the relevant content - do NOT include any introductory phrases like "Based on the provided information" or "I can provide the following assessment". Be direct, concise, and use appropriate terminology for healthcare and disability support contexts.'
        },
        {
          role: 'user',
          content: `Context information from files and recordings:\n\n${combinedContext}\n\nBased on this information, please ${query}\n\nREMEMBER: Start your response directly with the relevant content without any introductory phrases.`
        },
        {
          role: 'assistant',
          content: 'The client is experiencing significant stress at work due to a colleague\'s failure to complete required reports on time...'
        },
        {
          role: 'user',
          content: 'Yes, exactly like that - start directly with the relevant information without any introductory phrases. Now please respond to my actual query.'
        }
      ];
      
      // Create a timeout promise to handle network timeouts
      const timeoutPromise = new Promise<Response>((_, reject) => {
        setTimeout(() => reject(new Error('network_timeout')), 15000); // 15 second timeout
      });
      
      // Call OpenAI API with timeout
      const fetchPromise = fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000
        })
      });
      
      // Race the fetch against the timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      
      // Handle specific network errors with user-friendly messages
      if (error instanceof Error) {
        if (error.message === 'network_offline' || error.message === 'network_timeout' || 
            error.message.includes('network') || !navigator.onLine) {
          console.warn('Network error detected, using fallback generation');
          // Don't throw, just return fallback content
          return this.generateMockResponse(query, context);
        }
      }
      
      throw error;
    }
  }
}

// Create and export a singleton instance
const ragService = new RAGService();
export default ragService;
