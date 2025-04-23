import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Printer,
  Download,
  Share2,
  FileText,
  File,
  ChevronLeft,
  RefreshCw,
  Check,
  X,
  ExternalLink
} from 'lucide-react';

// Mock data for a complete report
const MOCK_REPORT = {
  id: 'report-1',
  title: 'Progress Report - John Smith',
  client: 'John Smith',
  clientDetails: {
    dateOfBirth: '1983-05-12',
    ndisNumber: '123456789',
    address: '123 Main Street, Melbourne VIC 3000',
    phone: '0412 345 678',
    email: 'john.smith@example.com'
  },
  provider: {
    name: 'ABC Therapy Services',
    practitioner: 'Dr. Jane Wilson',
    profession: 'Occupational Therapist',
    address: '456 Health Street, Melbourne VIC 3000',
    phone: '03 9876 5432',
    email: 'info@abctherapy.com.au',
    logo: '/images/logo-placeholder.png'
  },
  date: '2025-04-21',
  sections: [
    {
      id: 'section-1',
      title: 'Client Details',
      content: 'John Smith is a 42-year-old male diagnosed with left-sided hemiparesis following a stroke in January 2025. He lives independently in Melbourne and is currently receiving NDIS-funded therapy supports to assist with his rehabilitation and daily living activities.'
    },
    {
      id: 'section-2',
      title: 'Goals Progress',
      content: 'Over the past three months, John has demonstrated significant progress toward his rehabilitation goals. He has achieved increased mobility in his left shoulder and can now reach above his head, which was a key short-term goal. He continues to work on fine motor control in his left hand, which remains challenging but shows gradual improvement. John has reported feeling more confident in performing daily activities independently.'
    },
    {
      id: 'section-3',
      title: 'Recommendations',
      content: 'Based on John\'s current progress and ongoing needs, I recommend continuing with twice-weekly physical therapy sessions for the next three months. The focus should be on improving grip strength and finger dexterity to enhance fine motor control. A home exercise program has been provided to complement the therapy sessions. Regular reassessment at three-month intervals is recommended to track progress and adjust goals as needed.'
    },
    {
      id: 'section-4',
      title: 'Support Needs',
      content: 'John requires ongoing support with tasks involving fine motor skills. It is recommended that he continues to receive support from his carer for meal preparation and dressing. He would benefit from assistive technology for writing and typing. As his mobility improves, the level of support can be gradually reduced, with a focus on building independence in daily activities.'
    }
  ]
};

// Export format options
type ExportFormat = 'pdf' | 'docx' | 'html';

export default function ReportPreview() {
  const router = useRouter();
  const { id } = router.query;
  const reportContainerRef = useRef<HTMLDivElement>(null);
  
  const [report, setReport] = useState(MOCK_REPORT);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExporting, setIsExporting] = useState<ExportFormat | null>(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  
  // Load report data
  useEffect(() => {
    if (!id) return;
    
    const loadReport = async () => {
      setIsLoading(true);
      try {
        // Simulate API call to fetch report data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In a real implementation, this would fetch the report from the API
        // For now, we're using mock data
        setReport(MOCK_REPORT);
      } catch (error) {
        console.error('Error loading report:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadReport();
  }, [id]);
  
  // Handle printing
  const handlePrint = () => {
    setIsPrinting(true);
    
    // Add print-specific styles
    document.body.classList.add('printing');
    
    // Use browser print functionality
    window.print();
    
    // Remove print-specific styles after printing dialog is closed
    setTimeout(() => {
      document.body.classList.remove('printing');
      setIsPrinting(false);
    }, 1000);
  };
  
  // Handle export
  const handleExport = (format: ExportFormat) => {
    setIsExporting(format);
    setExportProgress(0);
    
    // Simulate export progress
    const interval = setInterval(() => {
      setExportProgress(prev => {
        const newProgress = prev + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          
          // Simulate download completion after progress reaches 100%
          setTimeout(() => {
            setIsExporting(null);
            
            // Trigger a fake download
            const link = document.createElement('a');
            link.href = '#';
            link.download = `${report.title.replace(/\s+/g, '-').toLowerCase()}.${format}`;
            link.click();
          }, 500);
          
          return 100;
        }
        return newProgress;
      });
    }, 300);
  };
  
  // Handle share link generation
  const handleShare = async () => {
    try {
      // Simulate generating a shareable link
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate a fake share URL
      const shareableUrl = `https://ndisuite.app/share/${report.id}/${Math.random().toString(36).substring(2, 10)}`;
      setShareUrl(shareableUrl);
      
      // In a real implementation, this would generate a shareable link via the API
    } catch (error) {
      console.error('Error generating share link:', error);
    }
  };
  
  // Handle copying share link to clipboard
  const handleCopyShareLink = () => {
    if (!shareUrl) return;
    
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setShareLinkCopied(true);
        setTimeout(() => setShareLinkCopied(false), 3000);
      })
      .catch(err => {
        console.error('Failed to copy link: ', err);
      });
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-ndisuite-background text-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mb-4" />
          <h2 className="text-xl font-semibold">Loading report...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ndisuite-background text-white">
      <Head>
        <title>{report.title} | NDISuite Report Generator</title>
        <style jsx global>{`
          @media print {
            body {
              background-color: white !important;
              color: black !important;
            }
            
            .print-only {
              display: block !important;
            }
            
            .no-print {
              display: none !important;
            }
            
            .report-preview {
              background-color: white !important;
              color: black !important;
              padding: 0 !important;
              max-width: 100% !important;
              box-shadow: none !important;
            }
            
            .report-content {
              padding: 0 !important;
            }
          }
          
          .print-only {
            display: none;
          }
        `}</style>
      </Head>

      {/* Header - No Print */}
      <header className="bg-ndisuite-panel shadow sticky top-0 z-10 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-600"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold truncate max-w-md">
                {report.title}
              </h1>
            </div>
            
            <div className="flex space-x-2">
              {/* Print Button */}
              <button
                onClick={handlePrint}
                disabled={isPrinting}
                className={`flex items-center px-3 py-2 rounded text-sm ${
                  isPrinting ? 'bg-gray-700 text-gray-400 cursor-wait' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <Printer className="h-4 w-4 mr-1" />
                {isPrinting ? 'Printing...' : 'Print'}
              </button>
              
              {/* Export Dropdown */}
              <div className="relative group">
                <button
                  className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </button>
                
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg overflow-hidden z-20 invisible group-hover:visible">
                  <div className="py-1">
                    <button
                      onClick={() => handleExport('pdf')}
                      className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-gray-700"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      PDF Document
                    </button>
                    <button
                      onClick={() => handleExport('docx')}
                      className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-gray-700"
                    >
                      <File className="h-4 w-4 mr-2" />
                      Word Document
                    </button>
                    <button
                      onClick={() => handleExport('html')}
                      className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-gray-700"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      HTML Document
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Share Button */}
              <button
                onClick={handleShare}
                className="flex items-center px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </button>
            </div>
          </div>
        </div>
        
        {/* Export Progress */}
        {isExporting && (
          <div className="bg-gray-900 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Exporting {report.title} as {isExporting.toUpperCase()}...
              </span>
              <span className="text-sm">{exportProgress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${exportProgress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {/* Share Link */}
        {shareUrl && (
          <div className="bg-gray-900 p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-3">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none"
                />
              </div>
              <button
                onClick={handleCopyShareLink}
                className={`flex items-center px-3 py-2 rounded text-sm ${
                  shareLinkCopied 
                    ? 'bg-green-700 hover:bg-green-800' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {shareLinkCopied ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <span className="mr-1">Copy</span>
                )}
                {shareLinkCopied ? 'Copied!' : 'Link'}
              </button>
              <button
                onClick={() => setShareUrl(null)}
                className="ml-2 p-2 rounded-full hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Report Preview */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 no-print">
        <div 
          ref={reportContainerRef}
          className="bg-white text-black rounded-lg shadow-lg overflow-hidden report-preview"
        >
          {/* Report Header */}
          <div className="bg-gray-100 p-6 border-b border-gray-300">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
                <p className="text-gray-600 mt-1">Date: {formatDate(report.date)}</p>
              </div>
              <div className="mt-4 md:mt-0">
                {/* Provider logo placeholder */}
                <div className="w-40 h-16 bg-gray-200 flex items-center justify-center rounded">
                  <span className="text-gray-500 text-sm">{report.provider.name}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Report Content */}
          <div className="p-6 report-content">
            {/* Client Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Client Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Client Name:</p>
                  <p className="font-medium">{report.client}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date of Birth:</p>
                  <p className="font-medium">{formatDate(report.clientDetails.dateOfBirth)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">NDIS Number:</p>
                  <p className="font-medium">{report.clientDetails.ndisNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contact:</p>
                  <p className="font-medium">{report.clientDetails.phone}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Address:</p>
                  <p className="font-medium">{report.clientDetails.address}</p>
                </div>
              </div>
            </div>
            
            {/* Provider Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Provider Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Service Provider:</p>
                  <p className="font-medium">{report.provider.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Practitioner:</p>
                  <p className="font-medium">{report.provider.practitioner}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Profession:</p>
                  <p className="font-medium">{report.provider.profession}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contact:</p>
                  <p className="font-medium">{report.provider.phone}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Address:</p>
                  <p className="font-medium">{report.provider.address}</p>
                </div>
              </div>
            </div>
            
            {/* Report Sections */}
            <div>
              {report.sections.map(section => (
                <div key={section.id} className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">{section.title}</h2>
                  <div className="prose prose-sm max-w-none text-gray-800">
                    <p>{section.content}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Signature Section */}
            <div className="mt-12 pt-8 border-t border-gray-300">
              <div className="flex flex-col md:flex-row md:justify-between">
                <div className="mb-6 md:mb-0">
                  <p className="text-gray-800 font-medium">{report.provider.practitioner}</p>
                  <p className="text-gray-600">{report.provider.profession}</p>
                  <p className="text-gray-600">{report.provider.name}</p>
                </div>
                <div>
                  <div className="h-24 w-48 border-b border-gray-400 mb-2"></div>
                  <p className="text-gray-600">Signature</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Print-only version */}
      <div className="print-only">
        <div className="bg-white text-black">
          {/* Report Header */}
          <div className="p-6 border-b border-gray-300">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
                <p className="text-gray-600 mt-1">Date: {formatDate(report.date)}</p>
              </div>
              <div>
                {/* Provider logo placeholder */}
                <div className="w-40 h-16 bg-gray-200 flex items-center justify-center rounded">
                  <span className="text-gray-500 text-sm">{report.provider.name}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Report Content */}
          <div className="p-6">
            {/* Client Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Client Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Client Name:</p>
                  <p className="font-medium">{report.client}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date of Birth:</p>
                  <p className="font-medium">{formatDate(report.clientDetails.dateOfBirth)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">NDIS Number:</p>
                  <p className="font-medium">{report.clientDetails.ndisNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contact:</p>
                  <p className="font-medium">{report.clientDetails.phone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Address:</p>
                  <p className="font-medium">{report.clientDetails.address}</p>
                </div>
              </div>
            </div>
            
            {/* Provider Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Provider Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Service Provider:</p>
                  <p className="font-medium">{report.provider.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Practitioner:</p>
                  <p className="font-medium">{report.provider.practitioner}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Profession:</p>
                  <p className="font-medium">{report.provider.profession}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contact:</p>
                  <p className="font-medium">{report.provider.phone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Address:</p>
                  <p className="font-medium">{report.provider.address}</p>
                </div>
              </div>
            </div>
            
            {/* Report Sections */}
            <div>
              {report.sections.map(section => (
                <div key={section.id} className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">{section.title}</h2>
                  <div className="prose prose-sm max-w-none text-gray-800">
                    <p>{section.content}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Signature Section */}
            <div className="mt-12 pt-8 border-t border-gray-300">
              <div className="flex justify-between">
                <div>
                  <p className="text-gray-800 font-medium">{report.provider.practitioner}</p>
                  <p className="text-gray-600">{report.provider.profession}</p>
                  <p className="text-gray-600">{report.provider.name}</p>
                </div>
                <div>
                  <div className="h-24 w-48 border-b border-gray-400 mb-2"></div>
                  <p className="text-gray-600">Signature</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
