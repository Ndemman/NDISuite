import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  Mic, 
  FileText,
  Upload, 
  File, 
  X, 
  Check, 
  AlertTriangle,
  Files
} from 'lucide-react';

// Mock function for creating a session
const createSession = async (data: { title: string; description: string }) => {
  // In a real implementation, this would make an API call
  return {
    id: 'new-session-' + Date.now(),
    title: data.title,
    description: data.description,
    status: 'draft',
    created_at: new Date().toISOString()
  };
};

export default function NewReportPage() {
  const router = useRouter();
  const [title, setTitle] = useState('New Report');
  const [description, setDescription] = useState('');
  const [inputMethod, setInputMethod] = useState('audio');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  // Create a new session when the component loads
  useEffect(() => {
    const initializeSession = async () => {
      setIsCreating(true);
      try {
        // Create a new session
        const session = await createSession({
          title: title || 'New Report',
          description: description || 'Created on ' + new Date().toLocaleString(),
        });
        
        setSessionId(session.id);
        
        console.log('Session created:', session);
      } catch (error) {
        console.error('Error creating session:', error);
      } finally {
        setIsCreating(false);
      }
    };
    
    initializeSession();
  }, []);
  
  // Handle recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);
  
  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle start/stop recording
  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      // In a real implementation, we would save the recording
      // and then navigate to the report builder rather than the dashboard
      if (sessionId) {
        router.push(`/reports/builder?id=${sessionId}`);
      }
    } else {
      // Start recording
      setIsRecording(true);
      setRecordingTime(0);
    }
  };
  
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFiles(Array.from(e.target.files));
    }
  };
  
  // Handle file upload
  const handleUploadFiles = () => {
    // In a real implementation, we would upload the files first
    // After successful upload, navigate to the report builder page for this session
    if (sessionId) {
      router.push(`/reports/builder?id=${sessionId}`);
    }
  };
  
  // Handle removing a file from the list
  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <Head>
        <title>New Report | NDISuite Report Generator</title>
      </Head>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Report title and details */}
        <div className="bg-card rounded-lg shadow-md border border-border p-6 mb-8">
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Report Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
              placeholder="Enter report title"
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
              placeholder="Enter report description"
            />
          </div>
        </div>
        
        {/* Input method selection */}
        <div className="mb-8">
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setInputMethod('audio')}
              className={`flex-1 py-4 px-6 flex flex-col items-center justify-center rounded-lg border ${
                inputMethod === 'audio' 
                  ? 'border-primary bg-primary text-primary-foreground' 
                  : 'border-border bg-card hover:bg-accent'
              }`}
            >
              <Mic className={`h-8 w-8 mb-2 ${inputMethod === 'audio' ? '' : 'text-muted-foreground'}`} />
              <span className={inputMethod === 'audio' ? 'font-medium' : 'text-muted-foreground'}>Audio Recording</span>
            </button>
            
            <button
              onClick={() => setInputMethod('document')}
              className={`flex-1 py-4 px-6 flex flex-col items-center justify-center rounded-lg border ${
                inputMethod === 'document' 
                  ? 'border-primary bg-primary text-primary-foreground' 
                  : 'border-border bg-card hover:bg-accent'
              }`}
            >
              <Files className={`h-8 w-8 mb-2 ${inputMethod === 'document' ? '' : 'text-muted-foreground'}`} />
              <span className={inputMethod === 'document' ? 'font-medium' : 'text-muted-foreground'}>File Upload</span>
            </button>
          </div>
        </div>
        
        {/* Input content based on selected method */}
        <div className="bg-card rounded-lg shadow-md border border-border p-6">
          {inputMethod === 'audio' ? (
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-6">Record Audio for Transcription</h2>
              
              <div className="mb-8">
                {/* Enhanced audio visualization container */}
                <div className="w-full rounded-lg flex items-center justify-center mb-6 p-2 bg-muted/20 shadow-sm border border-border">
                  {isRecording ? (
                    <div className="audio-visualizer">
                      {/* Use a fixed visualization without random heights to prevent hydration mismatch */}
                      {Array.from({ length: 30 }).map((_, i) => (
                        <div 
                          key={i} 
                          className="bar" 
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="audio-visualizer-inactive flex items-center justify-center">
                      <p className="text-muted-foreground">Audio visualization will appear here</p>
                    </div>
                  )}
                </div>
                
                <div className="text-2xl font-mono mb-6 text-center bg-muted py-2 px-4 rounded-md inline-block mx-auto shadow-sm border border-border">
                  {formatTime(recordingTime)}
                </div>
              </div>
              
              <button
                onClick={toggleRecording}
                className={`rounded-full p-4 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-md transition-all duration-200 active:scale-95 ${
                  isRecording 
                    ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' 
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                }`}
              >
                {isRecording ? (
                  <X className="h-8 w-8" />
                ) : (
                  <Mic className="h-8 w-8" />
                )}
              </button>
              
              <p className="mt-3 text-sm text-muted-foreground font-medium">
                {isRecording ? 'Click to stop recording' : 'Click to start recording'}
              </p>
              
              {isRecording && (
                <p className="mt-6 text-sm text-gray-400">
                  Your audio is being recorded and will be automatically transcribed
                </p>
              )}
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-6">Upload Files for Analysis</h2>
              
              <div className="max-w-md mx-auto">
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-8 mb-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                  <p className="mb-2 font-medium">Click or drag files to upload</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Supported formats: .pdf, .doc, .docx, .txt, .mp3, .wav
                  </p>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.mp3,.wav"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>
              
              {uploadedFiles.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Selected Files</h3>
                  <ul className="space-y-3 mb-6">
                    {uploadedFiles.map((file, index) => (
                      <li key={index} className="flex items-center justify-between bg-background/80 p-3 rounded-md border border-border shadow-sm group hover:border-primary/20">
                        <div className="flex items-center">
                          <File className="h-5 w-5 mr-3 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleRemoveFile(index)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Remove file"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  
                  <button
                    onClick={handleUploadFiles}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 shadow-sm flex items-center justify-center"
                    disabled={uploadedFiles.length === 0}
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Files
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
