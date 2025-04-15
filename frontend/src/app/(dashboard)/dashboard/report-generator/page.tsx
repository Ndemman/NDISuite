"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { OutputConfiguration, OutputConfigurationData } from '@/components/report-generator/output-configuration'
import { RAGGenerator, RAGResult } from '@/components/report-generator/rag-generator'
import { useSession, SessionData, SessionFile } from '@/contexts/session/session-context'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { AlertCircle, ArrowRight, CheckCircle2, FileCheck, FileText, Mic, Upload, Loader2, Square, Play, Save } from 'lucide-react'
import transcriptionService from '@/services/api/transcriptionService'

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
  const [selectedOption, setSelectedOption] = useState<'record' | 'upload' | null>(null)
  
  // Audio recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [recordingTitle, setRecordingTitle] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcript, setTranscript] = useState('')
  
  // Refs for recording functionality
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
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
  
  // File upload handler
  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) return
    
    // Convert FileList to array for easier handling
    const fileArray = Array.from(files)
    
    // Create file objects for session
    const sessionFiles: SessionFile[] = fileArray.map(file => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: '' // Will be populated after processing
    }))
    
    // Add files to selected files
    setSelectedFiles(prev => [...prev, ...sessionFiles])
    
    // Process each file
    fileArray.forEach((file, index) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const content = e.target?.result as string
        
        // Update the file with its content
        setSelectedFiles(prev => {
          const newFiles = [...prev]
          const fileIndex = newFiles.findIndex(f => f.id === sessionFiles[index].id)
          
          if (fileIndex !== -1) {
            newFiles[fileIndex] = {
              ...newFiles[fileIndex],
              url: content,
              transcription: file.type.startsWith('text/') ? content : ''
            }
          }
          
          return newFiles
        })
      }
      
      reader.onerror = () => {
        // Mark file as failed
        setSelectedFiles(prev => {
          const newFiles = [...prev]
          const fileIndex = newFiles.findIndex(f => f.id === sessionFiles[index].id)
          
          if (fileIndex !== -1) {
            // Just remove the file that failed
            return newFiles.filter(f => f.id !== sessionFiles[index].id)
          }
          
          return newFiles
        })
        
        toast({
          title: "File Error",
          description: `Failed to read ${file.name}. Please try again.`,
          variant: "destructive"
        })
      }
      
      // Read the file as text or data URL depending on type
      if (file.type.startsWith('text/') || 
          file.type === 'application/json' || 
          file.type === 'application/xml') {
        reader.readAsText(file)
      } else {
        reader.readAsDataURL(file)
      }
    })
    
    // Create or update session with files
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        files: [...(currentSession.files || []), ...sessionFiles]
      }
      updateSession(updatedSession)
    } else {
      // Create a new session with the files
      const sessionId = await createSession({
        name: `Upload ${new Date().toLocaleDateString()}`,
        type: 'upload',
        status: 'in-progress',
        files: sessionFiles
      })
      
      // Set active tab to sources to show the uploaded files
      setActiveTab('sources')
    }
    
    toast({
      title: "Files Added",
      description: `${files.length} file(s) have been added to your session.`
    })
  }
  
  // Load session from URL parameter if available
  useEffect(() => {
    const loadSessionFromParam = async () => {
      const sessionId = searchParams.get('session')
      
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
  
  // Handle recording or upload selection within the workflow
  const navigateToRecording = () => {
    setSelectedOption('record')
    setActiveTab('data')
  }

  const navigateToUpload = () => {
    setSelectedOption('upload')
    setActiveTab('data')
  }
  
  // Navigate to external recording or upload pages if needed
  const navigateToExternalRecording = () => {
    router.push('/dashboard/recordings/new')
  }

  const navigateToExternalUpload = () => {
    router.push('/dashboard/uploads')
  }

  // No longer need to manage start options visibility as they're integrated into the Begin tab
  
  // Generate a default title based on current date and time
  useEffect(() => {
    if (selectedOption === 'record' && recordingTitle === '') {
      const now = new Date()
      const defaultTitle = `Recording ${now.toLocaleDateString()} at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      setRecordingTitle(defaultTitle)
    }
  }, [selectedOption, recordingTitle])
  
  // Initialize audio visualization
  useEffect(() => {
    if (canvasRef.current && selectedOption === 'record') {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        // Clear canvas initially
        ctx.fillStyle = 'rgb(20, 20, 20)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [selectedOption])
  
  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  // Handle recording start
  const startRecording = async () => {
    try {
      // Check if MediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API not supported in this browser or environment')
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Set up audio context and analyser for visualization
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) {
        throw new Error('AudioContext not supported in this browser or environment')
      }
      
      audioContextRef.current = new AudioContextClass()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)
      analyserRef.current.fftSize = 256
      
      // Create media recorder
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []
      
      // Collect audio chunks
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      // Handle recording stop
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        const url = URL.createObjectURL(audioBlob)
        setAudioURL(url)
        setAudioBlob(audioBlob)
        
        // Automatically start transcription
        startTranscription(audioBlob)
      }
      
      // Start recording
      mediaRecorderRef.current.start()
      setIsRecording(true)
      
      // Start timer
      setRecordingTime(0) // Reset timer when starting recording
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
      // Start visualization
      visualize()
      
    } catch (error) {
      console.error('Error accessing microphone:', error)
      
      // Provide more specific error messages based on the error type
      let errorMessage = 'Failed to access microphone.'
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorMessage = 'Microphone access was denied. Please allow microphone permissions in your browser settings.'
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          errorMessage = 'No microphone detected. Please connect a microphone and try again.'
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          errorMessage = 'Your microphone is busy or not available. Please close other applications that might be using it.'
        } else if (error.name === 'AbortError') {
          errorMessage = 'Recording was aborted. Please try again.'
        } else if (error.name === 'SecurityError') {
          errorMessage = 'Recording is not allowed in this context due to security restrictions.'
        }
      } else if (error instanceof Error && error.message.includes('not supported')) {
        errorMessage = 'Audio recording is not supported in this browser or environment. Try using Chrome, Firefox, or Edge.'
      }
      
      toast({
        title: 'Microphone Access Error',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  }
  
  // Handle recording stop
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      // Stop all tracks on the stream
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }
  
  // Handle audio visualization
  const visualize = () => {
    if (!canvasRef.current || !analyserRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const width = canvas.width
    const height = canvas.height
    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    
    const draw = () => {
      if (!isRecording) return
      
      requestAnimationFrame(draw)
      
      analyserRef.current!.getByteFrequencyData(dataArray)
      
      ctx.fillStyle = 'rgb(20, 20, 20)'
      ctx.fillRect(0, 0, width, height)
      
      const barWidth = (width / bufferLength) * 2.5
      let x = 0
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height
        
        // Gradient based on volume
        const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight)
        gradient.addColorStop(0, '#10b981') // Green
        gradient.addColorStop(1, '#34d399') // Lighter green
        
        ctx.fillStyle = gradient
        ctx.fillRect(x, height - barHeight, barWidth, barHeight)
        
        x += barWidth + 1
      }
    }
    
    draw()
  }
  
  // Start transcription process
  const startTranscription = async (blob: Blob) => {
    if (!blob) return
    
    setIsTranscribing(true)
    setTranscript('')
    
    try {
      // Call the transcription service
      const result = await transcriptionService.transcribeAudio(blob)
      setTranscript(result)
      
      // Update current session with transcript
      if (currentSession) {
        const updatedSession = {
          ...currentSession,
          content: {
            ...currentSession.content || {},
            rawContent: result
          }
        }
        updateSession(updatedSession)
      } else {
        // Create a new session with the recording
        const sessionId = await createSession({
          name: recordingTitle,
          type: 'recording',
          status: 'in-progress',
          audioUrl: audioURL || '',
          transcript: result,
          duration: recordingTime
        })
        
        // Find and set the newly created session
        const newSession = sessions.find(s => s.id === sessionId)
        if (newSession && typeof newSession !== 'string') {
          setCurrentSession(newSession)
        }
      }
      
      toast({
        title: 'Transcription Complete',
        description: 'Your audio has been transcribed successfully.',
      })
      
    } catch (error) {
      console.error('Error transcribing audio:', error)
      toast({
        title: 'Transcription Error',
        description: 'There was an error transcribing your audio. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsTranscribing(false)
    }
  }

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
        <div className="flex justify-between items-center">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="begin">
              Begin
            </TabsTrigger>
            <TabsTrigger value="data" disabled={!selectedOption}>
              Data
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
              <CardTitle>Begin Your Report</CardTitle>
              <CardDescription>
                Choose how you want to start creating your report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
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
                      <Button 
                        variant="ghost" 
                        className="mt-2 group" 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToUpload();
                        }}
                      >
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
                      <Button 
                        variant="ghost" 
                        className="mt-2 group" 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToUpload();
                        }}
                      >
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {sessions.filter(s => s.type === 'recording' && s.status === 'completed').length > 0 && (
                <div className="w-full mt-6">
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
                        <Button variant="ghost" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          handleSessionSelect(session);
                        }}>
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
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={() => selectedOption ? setActiveTab('data') : null}
                disabled={!selectedOption}
              >
                Go to Data
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{selectedOption === 'record' ? 'Audio Recording' : 'File Upload'}</CardTitle>
              <CardDescription>
                {selectedOption === 'record' 
                  ? 'Record your session audio directly or select existing recordings' 
                  : 'Upload documents or audio files for processing'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedOption === 'record' ? (
                // Recording Interface
                <div>
                  <div className="bg-muted rounded-md p-6 flex flex-col items-center justify-center min-h-[200px]">
                    <div className="flex items-center space-x-4 mb-4">
                      <Button 
                        variant="outline" 
                        size="lg"
                        className="flex items-center justify-center h-16 w-16 rounded-full"
                      >
                        <Mic className="h-6 w-6" />
                      </Button>
                      <div className="text-center">
                        <div className="text-2xl font-bold">00:00</div>
                        <div className="text-sm text-muted-foreground">Recording Time</div>
                      </div>
                    </div>
                    <div className="w-full max-w-md">
                      <div className="bg-primary/10 h-12 rounded-md relative">
                        <div className="absolute top-0 left-0 bg-primary h-full w-0 rounded-md"></div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center space-x-2">
                      <Button variant="outline" className="flex items-center space-x-2">
                        <Square className="h-4 w-4 mr-2" />
                        <span>Stop</span>
                      </Button>
                      <Button variant="outline" className="flex items-center space-x-2">
                        <Play className="h-4 w-4 mr-2" />
                        <span>Start</span>
                      </Button>
                    </div>
                    <div className="mt-4 text-sm text-muted-foreground">
                      <p>Click Start to begin recording your session</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-sm text-muted-foreground mt-4">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <p>For best results, speak clearly and minimize background noise.</p>
                  </div>
                  
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-medium mb-2">Need more advanced recording features?</h3>
                    <p className="text-sm text-muted-foreground mb-2">Use our dedicated recording page for more options.</p>
                    <Button 
                      variant="outline" 
                      onClick={navigateToExternalRecording}
                      className="flex items-center space-x-2"
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      <span>Go to Advanced Recording</span>
                    </Button>
                  </div>
                </div>
              ) : selectedOption === 'upload' ? (
                // Upload Interface
                <div>
                  <div 
                    className="border-2 border-dashed rounded-md p-8 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        handleFileUpload(e.dataTransfer.files)
                      }
                    }}
                  >
                    <input 
                      type="file" 
                      id="file-upload" 
                      className="hidden" 
                      multiple 
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFileUpload(e.target.files)
                        }
                      }}
                    />
                    <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-1">Drag and drop files here</h3>
                    <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                    <Button variant="outline" size="sm">
                      Browse Files
                    </Button>
                  </div>
                  
                  <div className="border rounded-md p-4 mt-4">
                    <h3 className="text-lg font-medium mb-2">Supported File Types</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 bg-muted rounded-md">
                        <h4 className="font-medium mb-1 flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          Documents
                        </h4>
                        <p className="text-xs text-muted-foreground">PDF, DOCX, TXT</p>
                      </div>
                      <div className="p-3 bg-muted rounded-md">
                        <h4 className="font-medium mb-1 flex items-center">
                          <Mic className="h-4 w-4 mr-2" />
                          Audio
                        </h4>
                        <p className="text-xs text-muted-foreground">MP3, WAV, M4A</p>
                      </div>
                      <div className="p-3 bg-muted rounded-md">
                        <h4 className="font-medium mb-1 flex items-center">
                          <FileCheck className="h-4 w-4 mr-2" />
                          Other
                        </h4>
                        <p className="text-xs text-muted-foreground">CSV, JSON, XML</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-medium mb-2">Need more upload options?</h3>
                    <p className="text-sm text-muted-foreground mb-2">Use our dedicated upload page for more features.</p>
                    <Button 
                      variant="outline" 
                      onClick={navigateToExternalUpload}
                      className="flex items-center space-x-2"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      <span>Go to Advanced Upload</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-muted rounded-md p-4 min-h-[200px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p>Please select a recording or upload option first.</p>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('begin')}
              >
                Back to Begin
              </Button>
              <Button 
                onClick={() => setActiveTab('sources')}
                disabled={!selectedOption}
              >
                Continue to Sources
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
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Selected Files</h3>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => document.getElementById('sources-file-upload')?.click()}
                    className="flex items-center"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Add Files
                    <input 
                      type="file" 
                      id="sources-file-upload" 
                      className="hidden" 
                      multiple 
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFileUpload(e.target.files)
                        }
                      }}
                    />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      // Show recording interface
                      setIsRecording(false)
                      setAudioURL(null)
                      setAudioBlob(null)
                      setRecordingTime(0)
                      setTranscript('')
                      setRecordingTitle(`Recording ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`)
                      
                      // Open recording dialog
                      document.getElementById('recording-dialog')?.classList.remove('hidden')
                    }}
                    className="flex items-center"
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Record Audio
                  </Button>
                </div>
              </div>
              
              {selectedFiles.length === 0 ? (
                <div 
                  className="text-center p-6 border-2 border-dashed rounded-md hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('sources-file-upload')?.click()}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleFileUpload(e.dataTransfer.files)
                    }
                  }}
                >
                  <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No files selected</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Drag and drop files here or click to browse
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedFiles.map(file => (
                    <div 
                      key={file.id} 
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div className="flex items-center">
                        <FileCheck className="h-5 w-5 text-primary mr-2" />
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.type} · {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {file.url && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              // Preview the file
                              if (file.type.startsWith('image/')) {
                                window.open(file.url, '_blank')
                              } else if (file.type.startsWith('text/') || file.transcription) {
                                // Show text content
                                toast({
                                  title: file.name,
                                  description: file.transcription || 'No text content available',
                                  duration: 10000
                                })
                              }
                            }}
                          >
                            Preview
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedFiles(selectedFiles.filter(f => f.id !== file.id))
                            
                            // Also update the session if it exists
                            if (currentSession) {
                              const updatedSession = {
                                ...currentSession,
                                files: (currentSession.files || []).filter(f => f.id !== file.id)
                              }
                              updateSession(updatedSession)
                            }
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Recording Dialog */}
              <div id="recording-dialog" className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 hidden">
                <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Record Audio</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={() => document.getElementById('recording-dialog')?.classList.add('hidden')}
                    >
                      <span className="sr-only">Close</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </Button>
                  </div>
                  
                  {/* Recording Title */}
                  {!isRecording && !audioURL && (
                    <div className="space-y-2">
                      <Label htmlFor="dialog-recording-title">Recording Title</Label>
                      <Input 
                        id="dialog-recording-title" 
                        placeholder="Enter a title for your recording" 
                        value={recordingTitle}
                        onChange={(e) => setRecordingTitle(e.target.value)}
                      />
                    </div>
                  )}
                  
                  {/* Visualization canvas */}
                  <div className="relative w-full h-40 bg-black rounded-md overflow-hidden">
                    <canvas 
                      ref={canvasRef} 
                      className="w-full h-full"
                      width={800}
                      height={160}
                    />
                    <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm font-mono">
                      {formatTime(recordingTime)}
                    </div>
                  </div>
                  
                  {/* Recording controls */}
                  <div className="flex justify-center space-x-4">
                    {!isRecording ? (
                      <Button 
                        onClick={startRecording} 
                        className="bg-red-500 hover:bg-red-600 text-white"
                        size="lg"
                        disabled={!!audioURL || !recordingTitle.trim()}
                      >
                        <Mic className="mr-2 h-4 w-4" />
                        Start Recording
                      </Button>
                    ) : (
                      <Button 
                        onClick={stopRecording} 
                        variant="destructive"
                        size="lg"
                      >
                        <Square className="mr-2 h-4 w-4" />
                        Stop Recording
                      </Button>
                    )}
                    
                    {audioURL && (
                      <Button 
                        onClick={() => {
                          // Add recording to session
                          if (audioBlob) {
                            // Create a new session file
                            const newFile: SessionFile = {
                              id: `recording-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                              name: recordingTitle,
                              type: 'audio/wav',
                              size: audioBlob.size,
                              url: audioURL,
                              transcription: transcript
                            }
                            
                            // Add to selected files
                            setSelectedFiles(prev => [...prev, newFile])
                            
                            // Update session if it exists
                            if (currentSession) {
                              const updatedSession = {
                                ...currentSession,
                                files: [...(currentSession.files || []), newFile]
                              }
                              updateSession(updatedSession)
                            }
                            
                            // Close dialog
                            document.getElementById('recording-dialog')?.classList.add('hidden')
                            
                            toast({
                              title: "Recording Added",
                              description: `"${recordingTitle}" has been added to your sources.`
                            })
                          }
                        }}
                        disabled={isTranscribing || !transcript}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {isTranscribing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Transcribing...
                          </>
                        ) : (
                          "Save Recording"
                        )}
                      </Button>
                    )}
                  </div>
                  
                  {/* Audio playback if recording is complete */}
                  {audioURL && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Recording Preview:</p>
                      <audio 
                        src={audioURL} 
                        controls 
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  {/* Transcription result */}
                  {transcript && (
                    <div className="mt-4 p-4 bg-muted rounded-md max-h-40 overflow-y-auto">
                      <div className="flex items-center mb-2">
                        <FileText className="h-4 w-4 mr-2" />
                        <p className="font-medium">Transcription Result:</p>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{transcript}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <h3 className="text-lg font-medium mb-4">Recent Sessions</h3>
              
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
