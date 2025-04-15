"use client"

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSession } from '@/contexts/session/session-context'
import { useToast } from '@/components/ui/use-toast'
import { ArrowRight } from 'lucide-react'

// Import our dynamic components
import { DynamicComponents } from '@/components/report-generator/DynamicComponents'

// Import types
import type { SessionData, SessionFile } from '@/contexts/session/session-context'
import type { OutputConfigurationData } from '@/components/report-generator/output-configuration'
import type { RAGResult } from '@/components/report-generator/rag-generator'

export default function ReportGeneratorPage() {
  const { toast } = useToast()
  const { 
    sessions, 
    currentSession, 
    setCurrentSession, 
    updateSession, 
    createSession 
  } = useSession()
  
  // State management
  const [activeTab, setActiveTab] = useState('begin')
  const [selectedFiles, setSelectedFiles] = useState<SessionFile[]>([])
  const [outputConfig, setOutputConfig] = useState<OutputConfigurationData>({
    language: 'en',
    outputFormat: '',
    fields: []
  })
  const [generatedReport, setGeneratedReport] = useState<RAGResult | null>(null)
  const [selectedOption, setSelectedOption] = useState<'record' | 'upload' | null>(null)
  
  // Determine if we can proceed with different steps
  const hasSelectedFiles = selectedFiles.length > 0
  const hasValidOutputFormat = outputConfig.outputFormat !== ''
  
  // Handle session selection
  const handleSessionSelect = (session: SessionData) => {
    setCurrentSession(session)
    setSelectedFiles(session.files || [])
    
    if (session.settings?.language) {
      setOutputConfig({
        language: session.settings.language,
        outputFormat: session.settings.outputFormat || '',
        fields: session.settings.fields ? session.settings.fields.map(field => ({
          id: `field-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: field,
          type: 'text' as const
        })) : []
      })
    }
    
    // Determine the appropriate tab to show based on session state
    if (session.type === 'recording' && session.content?.rawContent) {
      setActiveTab('transcription')
    } else if (session.files && session.files.length > 0) {
      setActiveTab('sources')
    } else {
      setActiveTab('recording')
    }
    
    toast({
      title: "Session loaded",
      description: `Session "${session.name}" has been loaded.`
    })
  }
  
  // Handle file upload
  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) return
    
    try {
      // Process files
      const sessionFiles: SessionFile[] = Array.from(files).map(file => ({
        id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: file.name,
        type: file.type,
        size: file.size
      }))
      
      // Add to selected files
      setSelectedFiles(prev => [...prev, ...sessionFiles])
      
      // Update current session if exists
      if (currentSession) {
        const updatedSession = {
          ...currentSession,
          files: [...(currentSession.files || []), ...sessionFiles]
        }
        updateSession(currentSession.id, updatedSession)
      } else {
        // Create a new session with the files
        const newSession = await createSession({
          name: `Upload ${new Date().toLocaleDateString()}`,
          type: 'upload',
          status: 'in-progress',
          files: sessionFiles
        })
        
        setCurrentSession(newSession)
      }
      
      // Show success message
      toast({
        title: "Files uploaded",
        description: `${files.length} file(s) have been added to your session.`
      })
      
      // Navigate to sources tab
      setActiveTab('sources')
    } catch (error) {
      console.error('Error uploading files:', error)
      toast({
        variant: 'destructive',
        title: "Upload Error",
        description: "There was an error uploading your files. Please try again."
      })
    }
  }
  
  // Toggle file selection
  const toggleFileSelection = (file: SessionFile) => {
    setSelectedFiles(prev => 
      prev.some(f => f.id === file.id)
        ? prev.filter(f => f.id !== file.id)
        : [...prev, file]
    )
  }
  
  // Handle configuration saving
  const handleConfigurationSave = (config: OutputConfigurationData) => {
    setOutputConfig(config)
    
    // Update current session if exists
    if (currentSession) {
      updateSession(currentSession.id, {
        settings: {
          ...currentSession.settings,
          language: config.language,
          outputFormat: config.outputFormat,
          fields: config.fields.map(f => f.name)
        }
      })
    }
    
    // Navigate to generate tab
    setActiveTab('generate')
  }
  
  // Handle report generation
  const handleReportGeneration = (result: RAGResult) => {
    setGeneratedReport(result)
    
    // Save to current session if exists
    if (currentSession) {
      updateSession(currentSession.id, {
        status: 'completed',
        content: {
          ...currentSession.content,
          rawContent: result.content,
          processedContent: result.content
        }
      })
    } else {
      // Create a new session with the report
      createSession({
        name: `Report - ${new Date().toLocaleDateString()}`,
        type: 'report',
        status: 'completed',
        files: selectedFiles,
        settings: {
          language: outputConfig.language,
          outputFormat: outputConfig.outputFormat,
          fields: outputConfig.fields.map(f => f.name)
        },
        content: {
          rawContent: result.content,
          processedContent: result.content
        }
      })
    }
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Report Generator</h1>
        <p className="text-muted-foreground">
          Create reports from audio recordings, transcripts, and documents.
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="begin">Begin</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="output">Configure</TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
        </TabsList>
        
        <TabsContent value="begin">
          <Card>
            <CardHeader>
              <CardTitle>Begin</CardTitle>
              <CardDescription>
                Start a new report or continue an existing one.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setActiveTab('data')}>
                    <CardHeader>
                      <CardTitle>New Report</CardTitle>
                      <CardDescription>
                        Start a new report from scratch.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  
                  <Card className={`cursor-pointer hover:bg-muted/50 ${sessions.length === 0 ? 'opacity-50' : ''}`}>
                    <CardHeader>
                      <CardTitle>Continue Report</CardTitle>
                      <CardDescription>
                        Continue working on an existing report.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {sessions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No existing reports found.</p>
                      ) : (
                        <div className="space-y-2">
                          {sessions.slice(0, 3).map(session => (
                            <Button 
                              key={session.id}
                              variant="outline" 
                              className="w-full justify-start text-left"
                              onClick={() => handleSessionSelect(session)}
                            >
                              {session.name}
                            </Button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data Collection</CardTitle>
              <CardDescription>
                Record audio or upload files to include in your report.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedOption('record')}>
                  <CardHeader>
                    <CardTitle>Record Audio</CardTitle>
                    <CardDescription>
                      Record audio directly from your microphone.
                    </CardDescription>
                  </CardHeader>
                </Card>
                
                <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedOption('upload')}>
                  <CardHeader>
                    <CardTitle>Upload Files</CardTitle>
                    <CardDescription>
                      Upload audio files, documents, or images.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
              
              {selectedOption === 'record' && (
                <div className="mt-4 p-4 border rounded-md">
                  <h3 className="text-lg font-medium mb-2">Record Audio</h3>
                  <DynamicComponents.AudioRecorder />
                </div>
              )}
              
              {selectedOption === 'upload' && (
                <div className="mt-4 p-4 border rounded-md">
                  <h3 className="text-lg font-medium mb-2">Upload Files</h3>
                  <DynamicComponents.FileUploader />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={() => setActiveTab('sources')} 
                disabled={!hasSelectedFiles}
              >
                Continue to Sources
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="sources">
          <Card>
            <CardHeader>
              <CardTitle>Sources</CardTitle>
              <CardDescription>
                Manage the files and recordings that will be used in your report.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Sources tab content */}
              <div className="space-y-4 py-4">
                <div className="grid gap-4">
                  {selectedFiles.length === 0 ? (
                    <div className="text-center p-4 border rounded-md border-dashed">
                      <p className="text-muted-foreground">No files selected. Add files from the Data tab.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Selected Files</h3>
                      <div className="grid gap-2">
                        {selectedFiles.map(file => (
                          <div 
                            key={file.id} 
                            className="flex items-center justify-between p-3 border rounded-md"
                          >
                            <div className="flex items-center">
                              <span>{file.name}</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => toggleFileSelection(file)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('data')}
              >
                Back to Data
              </Button>
              <Button 
                onClick={() => setActiveTab('output')} 
                disabled={!hasSelectedFiles}
              >
                Configure Output
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="output">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configure Output</CardTitle>
                <CardDescription>
                  Configure the format and content of your report.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Output configuration form would go here</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('sources')}
                >
                  Back to Sources
                </Button>
                <Button 
                  onClick={() => setActiveTab('generate')} 
                  disabled={!hasValidOutputFormat}
                >
                  Generate Report
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>Generate Report</CardTitle>
              <CardDescription>
                Generate your report based on the selected sources and configuration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Report generation interface would go here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
