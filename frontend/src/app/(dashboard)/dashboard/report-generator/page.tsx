"use client"

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { OutputConfiguration, OutputConfigurationData } from '@/components/report-generator/output-configuration'
import { RAGGenerator, RAGResult } from '@/components/report-generator/rag-generator'
import { useSession, SessionData, SessionFile } from '@/contexts/session/session-context'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, ArrowRight, CheckCircle2, FileCheck, FileText, Mic, Upload, Loader2 } from 'lucide-react'

export default function ReportGeneratorPage() {
  const { sessions, currentSession, setCurrentSession, updateSession, createSession } = useSession()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  
  const [activeTab, setActiveTab] = useState('begin')
  const [selectedFiles, setSelectedFiles] = useState<SessionFile[]>([])
  const [outputConfig, setOutputConfig] = useState<OutputConfigurationData>({
    language: 'en',
    outputFormat: '',
    fields: []
  })
  const [generatedReport, setGeneratedReport] = useState<RAGResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showStartOptions, setShowStartOptions] = useState(true)
  
  // Initialize router for navigation
  const router = useRouter()
  
  // Get in-progress sessions
  const inProgressSessions = sessions.filter(s => s.status === 'in-progress')
  
  // Handle session selection
  const handleSessionSelect = (session: SessionData) => {
    setCurrentSession(session)
    setSelectedFiles(session.files || [])
    
    if (session.settings?.language) {
      setOutputConfig({
        language: session.settings.language,
        outputFormat: session.settings.outputFormat || '',
        fields: session.settings.fields ? session.settings.fields.map(field => ({
          id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: field,
          type: 'text' as const // Explicitly type as text field
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
      description: `"${session.name}" has been loaded.`
    })
  }
  
  // Load session from URL parameter if available
  useEffect(() => {
    const loadSessionFromParam = async () => {
      const sessionId = searchParams.get('session')
      console.log('Session ID from URL:', sessionId)
      
      if (!sessionId) return
      
      setIsLoading(true)
      
      try {
        // First try to find the session in the existing sessions
        let session = sessions.find(s => s.id === sessionId)
        
        console.log('Found session:', session)
        
        // If session not found, create a mock session for development
        if (!session && process.env.NODE_ENV === 'development') {
          console.log('Creating mock session for development')
          session = {
            id: sessionId,
            name: 'Development Test Report',
            type: 'report',
            status: 'in-progress',
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: 'dev-user-123',
            files: [],
            content: {
              rawContent: 'This is a mock transcript for development testing. It simulates what would be received from a recording.'
            },
            settings: {
              language: 'en',
              outputFormat: 'NDIS Progress Report',
              fields: ['Goals', 'Progress', 'Recommendations']
            }
          }
        }
        
        if (session) {
          // Set current session
          setCurrentSession(session)
          setSelectedFiles(session.files || [])
          
          // Set output configuration
          if (session.settings?.language) {
            setOutputConfig({
              language: session.settings.language,
              outputFormat: session.settings.outputFormat || '',
              fields: session.settings.fields ? session.settings.fields.map(field => ({
                id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: field,
                type: 'text' as const
              })) : []
            })
          }
          
          // Determine the appropriate tab to show based on session state
          if (session.type === 'recording' && session.content?.rawContent) {
            console.log('Setting tab to transcription')
            setActiveTab('transcription')
          } else if (session.files && session.files.length > 0) {
            console.log('Setting tab to sources')
            setActiveTab('sources')
          } else {
            console.log('Setting tab to recording')
            setActiveTab('recording')
          }
          
          toast({
            title: "Session loaded",
            description: `"${session.name}" has been loaded.`
          })
        } else {
          console.error('Session not found:', sessionId)
          toast({
            title: "Session not found",
            description: "The requested session could not be found.",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error('Error loading session:', error)
        toast({
          title: "Error",
          description: "There was an error loading the session.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    loadSessionFromParam()
  }, [searchParams, sessions, setCurrentSession, setSelectedFiles, setOutputConfig, setActiveTab, toast])
  

  
  // Handle file selection toggle
  const toggleFileSelection = (file: SessionFile) => {
    if (selectedFiles.some(f => f.id === file.id)) {
      setSelectedFiles(selectedFiles.filter(f => f.id !== file.id))
    } else {
      setSelectedFiles([...selectedFiles, file])
    }
  }
  
  // Handle configuration saving
  const handleConfigurationSave = (config: OutputConfigurationData) => {
    setOutputConfig(config)
    setActiveTab('generate')
    
    // Save to current session if exists
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
  
  // Determine if we can proceed to the next step
  const canConfigureOutput = selectedFiles.length > 0 || (currentSession?.content?.rawContent && currentSession.content.rawContent.length > 0)
  const canGenerateReport = outputConfig.outputFormat !== ''
  
  // Navigate to recording or upload page
  const navigateToRecording = () => {
    router.push('/dashboard/recordings/new')
  }

  const navigateToUpload = () => {
    router.push('/dashboard/uploads')
  }

  // Show start options when first accessing the page and hide when a session is selected
  // or when moving to other tabs
  useEffect(() => {
    // Always show start options when first loading the page with no session
    if (!currentSession && activeTab === 'begin' && sessions.length === 0) {
      setShowStartOptions(true)
    } 
    // Show start options when on begin tab with no active session
    else if (!currentSession && activeTab === 'begin' && !searchParams.get('session')) {
      setShowStartOptions(true)
    }
    // Hide options when a session is selected or on other tabs
    else if (currentSession || activeTab !== 'begin') {
      setShowStartOptions(false)
    }
  }, [currentSession, activeTab, sessions.length, searchParams])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Report Generator</h1>
        <p className="text-muted-foreground">
          Create AI-powered structured reports from your files and recordings
        </p>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >

      {/* Start Options - Record Audio and Upload Files buttons */}
      {showStartOptions && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-card hover:bg-card/80 transition-colors cursor-pointer overflow-hidden border-2" onClick={navigateToRecording}>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mic className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold">Record Audio</h3>
                  <p className="text-sm text-muted-foreground">Start a new audio recording</p>
                </div>
                <Button variant="ghost" className="mt-2 group">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card hover:bg-card/80 transition-colors cursor-pointer overflow-hidden border-2" onClick={navigateToUpload}>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold">Upload Files</h3>
                  <p className="text-sm text-muted-foreground">Upload documents or audio files</p>
                </div>
                <Button variant="ghost" className="mt-2 group">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
        <div className="flex justify-between items-center">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="begin">
              Begin
            </TabsTrigger>
            <TabsTrigger value="transcription" disabled={!currentSession || !currentSession.files || currentSession.files.length === 0}>
              Transcription
            </TabsTrigger>
            <TabsTrigger value="sources" disabled={activeTab === 'output' && !canConfigureOutput}>
              Sources
            </TabsTrigger>
            <TabsTrigger value="output" disabled={activeTab === 'generate' && !canGenerateReport || !canConfigureOutput}>
              Configure
            </TabsTrigger>
            <TabsTrigger value="generate" disabled={!canGenerateReport}>
              Generate
            </TabsTrigger>
          </TabsList>
          
          {currentSession && (
            <div className="bg-muted px-3 py-1 rounded-md text-sm flex items-center">
              <span className="text-muted-foreground mr-2">Current session:</span>
              <span className="font-medium">{currentSession.name}</span>
            </div>
          )}
        </div>
        
        <TabsContent value="begin" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audio Recording</CardTitle>
              <CardDescription>
                Record your session audio directly or select existing recordings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-6">
                <div className="w-full bg-muted rounded-md p-4 flex items-center justify-center min-h-[200px]">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex items-center space-x-2"
                    onClick={() => router.push('/dashboard/recordings/new')}
                  >
                    <Mic className="h-5 w-5" />
                    <span>Start New Recording</span>
                  </Button>
                </div>
                
                <div className="w-full">
                  <h3 className="text-lg font-medium mb-2">Recent Recordings</h3>
                  {sessions
                    .filter(s => s.type === 'recording' && s.status === 'completed')
                    .slice(0, 3)
                    .map(session => (
                      <div 
                        key={session.id}
                        className="flex items-center p-3 border rounded-md mb-2 cursor-pointer hover:bg-accent"
                        onClick={() => handleSessionSelect(session)}
                      >
                        <Mic className="h-4 w-4 mr-3 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium">{session.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(session.createdAt || Date.now()).toLocaleString()}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleSessionSelect(session)}>
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  }
                  
                  {sessions.filter(s => s.type === 'recording' && s.status === 'completed').length === 0 && (
                    <div className="text-center p-4 border border-dashed rounded-md">
                      <p className="text-sm text-muted-foreground">No recordings available</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={() => setActiveTab('transcription')}
                disabled={!currentSession}
              >
                Go to Transcription
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="transcription" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transcription</CardTitle>
              <CardDescription>
                View and edit your session transcription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentSession?.content?.rawContent ? (
                <div className="bg-muted rounded-md p-4 max-h-[400px] overflow-y-auto">
                  <p className="whitespace-pre-wrap">{currentSession.content.rawContent}</p>
                </div>
              ) : (
                <div className="bg-muted rounded-md p-4 min-h-[200px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p>No transcription available. Record or upload an audio file first.</p>
                  </div>
                </div>
              )}
              
              {currentSession?.content?.rawContent && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Transcript Length:</p>
                    <p className="text-sm text-muted-foreground">
                      {currentSession.content.rawContent.length.toLocaleString()} characters
                    </p>
                  </div>
                  <div>
                    <Button variant="outline" size="sm">
                      Edit Transcript
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('recording')}
              >
                Back to Recording
              </Button>
              <Button 
                onClick={() => setActiveTab('sources')}
                disabled={!currentSession?.content?.rawContent}
              >
                Select Additional Sources
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Source Files</CardTitle>
              <CardDescription>
                Choose files and recordings to include in your report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {sessions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">No source files</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    You haven't uploaded any files or created recordings yet.
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <Button 
                      variant="outline"
                      onClick={() => window.location.href = '/dashboard/uploads'}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Files
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => window.location.href = '/dashboard/recordings'}
                    >
                      <Mic className="mr-2 h-4 w-4" />
                      Record Audio
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {inProgressSessions.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-md font-medium">In-Progress Sessions</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {inProgressSessions.map(session => (
                          <Card key={session.id} className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors" onClick={() => handleSessionSelect(session)}>
                            <CardHeader className="p-4 pb-2">
                              <CardTitle className="text-base">{session.name}</CardTitle>
                              <CardDescription>
                                {session.files.length} file{session.files.length !== 1 ? 's' : ''}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <p className="text-xs text-muted-foreground">
                                Last updated: {new Date(session.updatedAt).toLocaleDateString()}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <h3 className="text-md font-medium">Available Files</h3>
                    
                    {sessions.flatMap(s => s.files).length === 0 ? (
                      <div className="text-center py-6 border rounded-md">
                        <p className="text-sm text-muted-foreground">
                          No files available. Upload files or create recordings first.
                        </p>
                      </div>
                    ) : (
                      <div className="border rounded-md divide-y">
                        {sessions
                          .flatMap(session => 
                            session.files.map(file => ({
                              ...file,
                              sessionName: session.name,
                              sessionId: session.id
                            }))
                          )
                          .map(file => (
                            <div 
                              key={file.id}
                              className={`flex items-center p-3 cursor-pointer transition-colors ${
                                selectedFiles.some(f => f.id === file.id)
                                  ? 'bg-primary/10'
                                  : 'hover:bg-accent hover:text-accent-foreground'
                              }`}
                              onClick={() => toggleFileSelection(file)}
                            >
                              <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${
                                selectedFiles.some(f => f.id === file.id)
                                  ? 'bg-primary border-primary'
                                  : 'border-muted-foreground'
                              }`}>
                                {selectedFiles.some(f => f.id === file.id) && (
                                  <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center">
                                  {file.type.includes('audio') ? (
                                    <Mic className="h-4 w-4 mr-2 text-muted-foreground" />
                                  ) : (
                                    <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                                  )}
                                  <p className="font-medium truncate">{file.name}</p>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  From: {file.sessionName}
                                </p>
                              </div>
                              
                              <div className="text-xs text-muted-foreground">
                                {(file.size / 1024).toFixed(0)} KB
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button 
              onClick={() => setActiveTab('output')} 
              disabled={!canConfigureOutput}
            >
              Configure Output
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="output">
          <div className="space-y-4">
            <OutputConfiguration 
              onSubmit={handleConfigurationSave}
              initialConfig={outputConfig}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="generate">
          <RAGGenerator 
            files={selectedFiles}
            config={outputConfig}
            onGenerationComplete={handleReportGeneration}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
