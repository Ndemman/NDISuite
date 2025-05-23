import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Save,
  Download,
  FileText,
  Plus,
  Trash,
  Edit,
  ChevronDown,
  ChevronUp,
  UploadCloud,
  RefreshCw,
  Check
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

// Mock data for report templates
const TEMPLATES = [
  { id: 'progress', name: 'Progress Report', category: 'NDIS', sections: ['Client Details', 'Goals Progress', 'Recommendations', 'Support Needs'] },
  { id: 'assessment', name: 'Assessment Report', category: 'NDIS', sections: ['Client Information', 'Assessment Results', 'Analysis', 'Recommendations'] },
  { id: 'therapy', name: 'Therapy Report', category: 'NDIS', sections: ['Client Background', 'Therapy Goals', 'Progress Summary', 'Future Recommendations'] },
];

// Mock transcription data
const MOCK_TRANSCRIPTION = `
Client: John Smith
Date of Session: April 21, 2025
Key Points:
- Client has been making good progress with physical therapy exercises
- Increased mobility in left shoulder, can now reach above head
- Still experiencing difficulty with fine motor control in left hand
- Recommended continuing with twice weekly sessions
- Goals for next month: improve grip strength and finger dexterity
- Client reports feeling more confident in daily activities
- Discussed strategies for managing pain during exercise
`;

interface ReportSection {
  id: string;
  title: string;
  content: string;
  aiSuggestion?: string;
  expanded: boolean;
}

interface ReportData {
  id: string;
  title: string;
  client: string;
  provider: string;
  date: string;
  sections: ReportSection[];
}

export default function ReportBuilder() {
  const router = useRouter();
  const { id } = router.query;
  
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [reportData, setReportData] = useState<ReportData>({
    id: id as string || 'new-report',
    title: 'New Progress Report',
    client: 'John Smith',
    provider: 'ABC Therapy Services',
    date: new Date().toISOString().split('T')[0],
    sections: []
  });
  const [transcription, setTranscription] = useState(MOCK_TRANSCRIPTION);
  const [aiGenerating, setAiGenerating] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  
  // Initialize with template sections when a template is selected
  useEffect(() => {
    if (selectedTemplate) {
      const template = TEMPLATES.find(t => t.id === selectedTemplate);
      if (template) {
        setReportData(prev => ({
          ...prev,
          title: template.name,
          sections: template.sections.map((section, index) => ({
            id: `section-${index}`,
            title: section,
            content: '',
            expanded: true
          }))
        }));
      }
    }
  }, [selectedTemplate]);
  
  // Simulate loading initial data
  useEffect(() => {
    const timer = setTimeout(() => {
      if (id && id !== 'new') {
        // In a real app, we would fetch the report data from the API
        setReportData({
          id: id as string,
          title: 'Progress Report - John Smith',
          client: 'John Smith',
          provider: 'ABC Therapy Services',
          date: '2025-04-21',
          sections: [
            {
              id: 'section-1',
              title: 'Client Details',
              content: 'John Smith is a 42-year-old male diagnosed with left-sided hemiparesis following a stroke in January 2025.',
              expanded: true
            },
            {
              id: 'section-2',
              title: 'Goals Progress',
              content: 'Client has been making steady progress with physical therapy exercises. Increased mobility in left shoulder, can now reach above head. Still experiencing difficulty with fine motor control in left hand.',
              expanded: true
            },
            {
              id: 'section-3',
              title: 'Recommendations',
              content: 'Recommended continuing with twice weekly sessions. Focus on grip strength and finger dexterity exercises.',
              expanded: true
            },
            {
              id: 'section-4',
              title: 'Support Needs',
              content: 'Client requires ongoing support with daily tasks involving fine motor skills. Recommend continued support from carer for meal preparation and dressing.',
              expanded: true
            }
          ]
        });
        
        setSelectedTemplate('progress');
      } else {
        // For a new report, use the default template
        setSelectedTemplate('progress');
      }
      
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [id]);
  
  // Handle template selection
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTemplate(e.target.value);
  };
  
  // Add a new section
  const addSection = () => {
    const newSection: ReportSection = {
      id: `section-${reportData.sections.length + 1}`,
      title: 'New Section',
      content: '',
      expanded: true
    };
    
    setReportData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
    
    setSaveStatus('unsaved');
  };
  
  // Remove a section
  const removeSection = (sectionId: string) => {
    setReportData(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
    }));
    
    setSaveStatus('unsaved');
  };
  
  // Update section title
  const updateSectionTitle = (sectionId: string, title: string) => {
    setReportData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId ? { ...section, title } : section
      )
    }));
    
    setSaveStatus('unsaved');
  };
  
  // Update section content
  const updateSectionContent = (sectionId: string, content: string) => {
    setReportData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId ? { ...section, content } : section
      )
    }));
    
    setSaveStatus('unsaved');
  };
  
  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setReportData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId ? { ...section, expanded: !section.expanded } : section
      )
    }));
  };
  
  // Move section up or down
  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    const sectionIndex = reportData.sections.findIndex(s => s.id === sectionId);
    if (
      (direction === 'up' && sectionIndex === 0) || 
      (direction === 'down' && sectionIndex === reportData.sections.length - 1)
    ) {
      return;
    }
    
    const newSections = [...reportData.sections];
    const newIndex = direction === 'up' ? sectionIndex - 1 : sectionIndex + 1;
    
    const temp = newSections[sectionIndex];
    newSections[sectionIndex] = newSections[newIndex];
    newSections[newIndex] = temp;
    
    setReportData(prev => ({ ...prev, sections: newSections }));
    setSaveStatus('unsaved');
  };
  
  // Generate AI content for a section
  const generateAiContent = (sectionId: string) => {
    const section = reportData.sections.find(s => s.id === sectionId);
    if (!section) return;
    
    setAiGenerating(sectionId);
    
    // Simulate AI generation delay
    setTimeout(() => {
      // Generate content based on section title and transcription
      let aiContent = '';
      
      switch (section.title) {
        case 'Client Details':
          aiContent = "John Smith is a 42-year-old male with a primary diagnosis of left-sided hemiparesis following a stroke in January 2025. He resides in Melbourne and is currently receiving NDIS-funded therapy supports.";
          break;
        case 'Goals Progress':
          aiContent = "Over the past three months, John has demonstrated significant progress toward his rehabilitation goals. He has achieved increased mobility in his left shoulder and can now reach above his head, which was a key short-term goal. He continues to work on fine motor control in his left hand, which remains challenging but shows gradual improvement. John has reported feeling more confident in performing daily activities independently.";
          break;
        case 'Recommendations':
          aiContent = "Based on John's current progress and ongoing needs, I recommend continuing with twice-weekly physical therapy sessions for the next three months. The focus should be on improving grip strength and finger dexterity to enhance fine motor control. A home exercise program has been provided to complement the therapy sessions. Regular reassessment at three-month intervals is recommended to track progress and adjust goals as needed.";
          break;
        case 'Support Needs':
          aiContent = "John requires ongoing support with tasks involving fine motor skills. It is recommended that he continues to receive support from his carer for meal preparation and dressing. He would benefit from assistive technology for writing and typing. As his mobility improves, the level of support can be gradually reduced, with a focus on building independence in daily activities.";
          break;
        default:
          aiContent = "Content generated based on the transcribed session notes. The client has been making steady progress in their therapy goals and continues to work toward greater independence in daily activities.";
      }
      
      // Update the section with AI-generated content
      setReportData(prev => ({
        ...prev,
        sections: prev.sections.map(s => 
          s.id === sectionId 
            ? { ...s, content: aiContent } 
            : s
        )
      }));
      
      setAiGenerating(null);
      setSaveStatus('unsaved');
    }, 2000);
  };
  
  // Save the report
  const saveReport = () => {
    setSaveStatus('saving');
    
    // Simulate API call delay
    setTimeout(() => {
      console.log('Saving report:', reportData);
      setSaveStatus('saved');
      
      // In a real app, we would make an API call to save the report
    }, 1000);
  };
  
  // Export the report as PDF
  const exportReport = () => {
    console.log('Exporting report as PDF:', reportData);
    
    // In a real app, we would make an API call to generate and download a PDF
    alert('Report export functionality will be implemented in the next version.');
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-ndisuite-background text-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mb-4" />
          <h2 className="text-xl font-semibold">Loading report data...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ndisuite-background text-white">
      <Head>
        <title>Report Builder | NDISuite Report Generator</title>
      </Head>

      {/* Header */}
      <header className="bg-ndisuite-panel shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold truncate max-w-md">
                {reportData.title}
              </h1>
              <span className="px-2 py-1 text-xs rounded-full bg-blue-900 text-blue-300">
                {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Unsaved'}
              </span>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={saveReport}
                disabled={saveStatus === 'saved' || saveStatus === 'saving'}
                className={`flex items-center px-3 py-2 rounded text-sm ${
                  saveStatus === 'saved' 
                    ? 'bg-green-800 text-green-200 cursor-not-allowed' 
                    : saveStatus === 'saving'
                    ? 'bg-gray-700 text-gray-300 cursor-wait'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {saveStatus === 'saved' ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Save'}
              </button>
              
              <button
                onClick={exportReport}
                className="flex items-center px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
              
              <button
                onClick={() => router.push('/reports')}
                className="px-3 py-2 text-sm text-gray-300 hover:text-white"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex min-h-[calc(100vh-64px)]">
        {/* Left panel - Input data */}
        <div className="w-1/3 border-r border-gray-800 p-4 overflow-auto">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Report Information</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
                  Report Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={reportData.title}
                  onChange={(e) => {
                    setReportData(prev => ({ ...prev, title: e.target.value }));
                    setSaveStatus('unsaved');
                  }}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="client" className="block text-sm font-medium text-gray-300 mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  id="client"
                  value={reportData.client}
                  onChange={(e) => {
                    setReportData(prev => ({ ...prev, client: e.target.value }));
                    setSaveStatus('unsaved');
                  }}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="provider" className="block text-sm font-medium text-gray-300 mb-1">
                  Service Provider
                </label>
                <input
                  type="text"
                  id="provider"
                  value={reportData.provider}
                  onChange={(e) => {
                    setReportData(prev => ({ ...prev, provider: e.target.value }));
                    setSaveStatus('unsaved');
                  }}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-1">
                  Report Date
                </label>
                <input
                  type="date"
                  id="date"
                  value={reportData.date}
                  onChange={(e) => {
                    setReportData(prev => ({ ...prev, date: e.target.value }));
                    setSaveStatus('unsaved');
                  }}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="template" className="block text-sm font-medium text-gray-300 mb-1">
                  Report Template
                </label>
                <select
                  id="template"
                  value={selectedTemplate}
                  onChange={handleTemplateChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a template</option>
                  {TEMPLATES.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-4">Transcription Data</h2>
            <div className="bg-gray-800 border border-gray-700 rounded-md p-3 relative">
              <textarea
                value={transcription}
                onChange={(e) => setTranscription(e.target.value)}
                rows={12}
                className="w-full bg-gray-800 text-white text-sm font-mono focus:outline-none resize-none"
              />
              
              <div className="absolute bottom-3 right-3 flex space-x-2">
                <button className="p-1 bg-blue-600 hover:bg-blue-700 rounded text-xs flex items-center">
                  <UploadCloud className="h-3 w-3 mr-1" />
                  Upload
                </button>
                <button className="p-1 bg-gray-700 hover:bg-gray-600 rounded text-xs flex items-center">
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right panel - Report builder */}
        <div className="w-2/3 p-4 overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Report Content</h2>
            <button
              onClick={addSection}
              className="flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Section
            </button>
          </div>
          
          {reportData.sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-ndisuite-panel rounded-lg p-6 text-gray-400">
              <FileText className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium mb-2">No sections yet</p>
              <p className="text-sm mb-4">Select a template or add sections manually</p>
              <button
                onClick={() => setSelectedTemplate('progress')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white"
              >
                Use Progress Report Template
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {reportData.sections.map((section, index) => (
                <div key={section.id} className="bg-ndisuite-panel rounded-lg shadow-md overflow-hidden">
                  <div className="flex items-center justify-between p-3 bg-gray-800">
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                        className="bg-transparent border-none font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => moveSection(section.id, 'up')}
                        disabled={index === 0}
                        className={`p-1 rounded ${
                          index === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                        }`}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => moveSection(section.id, 'down')}
                        disabled={index === reportData.sections.length - 1}
                        className={`p-1 rounded ${
                          index === reportData.sections.length - 1 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                        }`}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => generateAiContent(section.id)}
                        disabled={aiGenerating === section.id}
                        className={`p-1 rounded text-xs flex items-center ${
                          aiGenerating === section.id 
                            ? 'bg-blue-900 text-blue-300 cursor-wait' 
                            : 'bg-blue-700 hover:bg-blue-600'
                        }`}
                      >
                        {aiGenerating === section.id ? (
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <span className="mr-1">AI</span>
                        )}
                        {aiGenerating === section.id ? 'Generating...' : 'Generate'}
                      </button>
                      
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-700"
                      >
                        {section.expanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => removeSection(section.id)}
                        className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-gray-700"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {section.expanded && (
                    <div className="p-4">
                      <textarea
                        value={section.content}
                        onChange={(e) => updateSectionContent(section.id, e.target.value)}
                        placeholder={`Enter content for ${section.title} section...`}
                        rows={6}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

ReportBuilder.getLayout = (page: React.ReactNode) => {
  return <AppLayout>{page}</AppLayout>;
};
