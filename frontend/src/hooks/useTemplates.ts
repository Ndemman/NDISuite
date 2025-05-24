import { useState, useEffect } from 'react';
import { reportsService, Template } from '@/api/reportsService';

// Define the return type for the hook
interface TemplateData {
  list: Template[];
  map: Record<string, string>; // map of slug -> id
}

interface UseTemplatesReturn {
  data: TemplateData | undefined;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Custom hook to fetch and cache templates
 * Returns a list of templates and a map of slug -> id for easy lookup
 */
export const useTemplates = (): UseTemplatesReturn => {
  const [data, setData] = useState<TemplateData | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchTemplates = async () => {
      try {
        console.log('[useTemplates] Starting template fetch...');
        setIsLoading(true);
        const templates = await reportsService.getTemplates();
        console.log('[useTemplates] Templates received:', templates);
        
        // Filter out templates without slugs and warn
        const validTemplates = templates.filter(t => {
          if (!t.slug) {
            console.warn(`[useTemplates] Template ${t.id} (${t.name}) is missing slug, skipping`);
            return false;
          }
          return true;
        });
        
        if (validTemplates.length === 0) {
          console.error('[useTemplates] No valid templates with slugs found!');
          throw new Error('No valid templates available');
        }
        
        if (isMounted) {
          // Create slug -> id mapping
          const templateMap = validTemplates.reduce((acc, template) => {
            acc[template.slug] = template.id;
            return acc;
          }, {} as Record<string, string>);
          
          console.log('[useTemplates] Template map created:', templateMap);
          console.log('[useTemplates] Available template slugs:', Object.keys(templateMap));
          
          setData({
            list: validTemplates,
            map: templateMap,
          });
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[useTemplates] Error fetching templates:', err);
          setError(err instanceof Error ? err : new Error('Failed to fetch templates'));
          
          // Add fallback for missing templates
          console.warn('[useTemplates] No templates from API, using defaults');
          const DEFAULT_TEMPLATES = [
            { id: 'default-progress-id', slug: 'progress', name: 'Progress Report', description: 'Default progress report template', category: 'progress', sections: [], created_at: '', updated_at: '' },
            { id: 'default-assessment-id', slug: 'assessment', name: 'Assessment Report', description: 'Default assessment report template', category: 'assessment', sections: [], created_at: '', updated_at: '' },
            { id: 'default-therapy-id', slug: 'therapy', name: 'Therapy Report', description: 'Default therapy report template', category: 'therapy', sections: [], created_at: '', updated_at: '' }
          ];
          
          const templateMap = DEFAULT_TEMPLATES.reduce((acc, t) => {
            acc[t.slug] = t.id;
            return acc;
          }, {} as Record<string, string>);
          
          setData({
            list: DEFAULT_TEMPLATES,
            map: templateMap
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTemplates();

    // Cleanup function to prevent state updates if the component unmounts
    return () => {
      isMounted = false;
    };
  }, []);

  return { data, isLoading, error };
};
