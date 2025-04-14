"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth/auth-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { formatFileSize, formatDate } from '@/lib/utils'
import { 
  Mic, 
  Play,
  Pause, 
  Square, 
  Save,
  Timer,
  Volume2,
  AlertCircle,
  File,
  FileAudio,
  Trash,
  X,
  FileText
} from 'lucide-react'
import transcriptionService from '@/services/api/transcriptionService'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog'

interface RecordingData {
  id: string
  blob: Blob
  url: string
  duration: number
  size: number
  date: Date
  name: string
  status: 'ready' | 'processing' | 'transcribed' | 'error'
  transcript?: string
}

export default function RecordingsPage() {
  const router = useRouter()
  const { user, token } = useAuth()
  const { toast } = useToast()
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [volume, setVolume] = useState(75)
  const [recordingName, setRecordingName] = useState('')
  
  // Generate a default recording name based on current date and time
  useEffect(() => {
    if (!recordingName) {
      const now = new Date()
      const defaultName = `Recording ${now.toLocaleDateString()} at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      setRecordingName(defaultName)
    }
  }, [recordingName])
  
  // Media recorder state
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  
  // Transcript viewing state
  const [showTranscript, setShowTranscript] = useState(false)
  const [activeTranscript, setActiveTranscript] = useState('')
  const [activeRecordingName, setActiveRecordingName] = useState('')
  
  // Track recording timer interval
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Recordings list state
  const [recordings, setRecordings] = useState<RecordingData[]>([])
  
  // Currently playing recording
  const [currentPlayback, setCurrentPlayback] = useState<{
    id: string | null,
    audio: HTMLAudioElement | null,
    isPlaying: boolean
  }>({
    id: null,
    audio: null,
    isPlaying: false
  })
  
  // Initialize audio elements on mount
  useEffect(() => {
    // Check for browser recording support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        variant: 'destructive',
        title: 'Recording not supported',
        description: 'Your browser does not support audio recording.'
      })
      return
    }
    
    // Set up canvas for visualization
    if (canvasRef.current) {
      setupCanvas()
    }
    
    // Load saved recordings from localStorage
    const savedRecordings = localStorage.getItem('ndisuite-recordings')
    if (savedRecordings) {
      try {
        const parsed = JSON.parse(savedRecordings)
        // We can't store blobs in localStorage, so we'll need to
        // handle this differently in a real implementation
        // This is just a placeholder
        setRecordings(parsed)
      } catch (error) {
        console.error('Failed to load saved recordings', error)
      }
    }
    
    // Clean up on unmount
    return () => {
      stopVisualization()
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (currentPlayback.audio) {
        currentPlayback.audio.pause()
        currentPlayback.audio.src = ''
      }
    }
  }, [toast])
  
  // Set up canvas for audio visualization
  const setupCanvas = () => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw initial flat line
    ctx.strokeStyle = '#10b981' // Green color
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, canvas.height / 2)
    ctx.lineTo(canvas.width, canvas.height / 2)
    ctx.stroke()
  }
  
  // Start audio recording
  const startRecording = async () => {
    // Don't allow recording without a name
    if (!recordingName.trim()) {
      toast({
        title: 'Recording Name Required',
        description: 'Please provide a name for your recording before starting.',
        variant: 'destructive'
      })
      return
    }
    
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
      analyserRef.current.fftSize = 2048
      
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)
      
      // Start visualization
      startVisualization()
      
      // Initialize media recorder
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      // Clear previous chunks
      audioChunksRef.current = []
      
      // Listen for data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      // Handle recording stop
      mediaRecorder.onstop = () => {
        // Create blob from audio chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        const audioUrl = URL.createObjectURL(audioBlob)
        
        // Add recording to list
        const newRecording: RecordingData = {
          id: `rec-${Date.now()}`,
          blob: audioBlob,
          url: audioUrl,
          duration: recordingTime > 0 ? recordingTime : 10, // Ensure we have a minimum duration if timer failed
          size: audioBlob.size,
          date: new Date(),
          name: recordingName.trim() || `Recording ${recordings.length + 1}`,
          status: 'ready'
        }
        
        // Log the duration to help with debugging
        console.log(`Recording saved with duration: ${newRecording.duration} seconds`)
        
        setRecordings(prev => [...prev, newRecording])
        
        // Reset recording state
        setRecordingTime(0)
        setIsRecording(false)
        setIsPaused(false)
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
        
        // Show success toast
        toast({
          title: 'Recording saved',
          description: `Your recording (${formatDuration(recordingTime)}) has been saved.`
        })
      }
      
      // Start recording
      mediaRecorder.start(100)
      setIsRecording(true)
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
    } catch (error) {
      console.error('Error starting recording:', error)
      
      // Provide more specific error messages based on the error type
      let errorMessage = 'Failed to start audio recording.'
      
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
      
      // In browser preview environments, provide specific guidance
      if (window.location.hostname.includes('127.0.0.1') || window.location.hostname.includes('localhost')) {
        errorMessage += ' Note: Microphone access may be limited in browser preview environments.'
      }
      
      toast({
        variant: 'destructive',
        title: 'Recording failed',
        description: errorMessage
      })
    }
  }
  
  // Pause/resume recording
  const togglePauseRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return
    
    if (isPaused) {
      // Resume recording
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      
      // Resume timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
      // Resume visualization
      startVisualization()
    } else {
      // Pause recording
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      
      // Pause timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      
      // Pause visualization
      stopVisualization()
    }
  }
  
  // Stop recording
  const stopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return
    
    // Stop media recorder
    mediaRecorderRef.current.stop()
    
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    // Stop visualization
    stopVisualization()
  }
  
  // Start visualization
  const startVisualization = () => {
    if (!analyserRef.current || !canvasRef.current) return
    
    const analyser = analyserRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    
    const drawVisualization = () => {
      // Request next frame
      animationFrameRef.current = requestAnimationFrame(drawVisualization)
      
      // Get data from analyser
      analyser.getByteTimeDomainData(dataArray)
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw wave
      ctx.lineWidth = 2
      ctx.strokeStyle = '#10b981' // Green color
      ctx.beginPath()
      
      const sliceWidth = canvas.width / bufferLength
      let x = 0
      
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0
        const y = v * (canvas.height / 2)
        
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
        
        x += sliceWidth
      }
      
      ctx.lineTo(canvas.width, canvas.height / 2)
      ctx.stroke()
    }
    
    drawVisualization()
  }
  
  // Stop visualization
  const stopVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    // Reset canvas to flat line
    setupCanvas()
  }
  
  // Format duration for display
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  // Play/pause recording
  const togglePlayback = (recordingId: string) => {
    // Check if it's the same recording
    if (currentPlayback.id === recordingId) {
      // Toggle playback of current audio
      if (currentPlayback.isPlaying) {
        currentPlayback.audio?.pause()
        setCurrentPlayback(prev => ({ ...prev, isPlaying: false }))
      } else {
        currentPlayback.audio?.play()
        setCurrentPlayback(prev => ({ ...prev, isPlaying: true }))
      }
    } else {
      // Stop current playback if any
      if (currentPlayback.audio) {
        currentPlayback.audio.pause()
        currentPlayback.audio.src = ''
      }
      
      // Find new recording
      const recording = recordings.find(r => r.id === recordingId)
      if (!recording) return
      
      // Create new audio element
      const audio = new Audio(recording.url)
      
      // Set up event listeners
      audio.onended = () => {
        setCurrentPlayback(prev => ({ ...prev, isPlaying: false }))
      }
      
      // Start playback
      audio.play()
      
      // Update state
      setCurrentPlayback({
        id: recordingId,
        audio,
        isPlaying: true
      })
    }
  }
  
  // Delete recording
  const deleteRecording = (recordingId: string) => {
    // Stop playback if this recording is playing
    if (currentPlayback.id === recordingId && currentPlayback.audio) {
      currentPlayback.audio.pause()
      currentPlayback.audio.src = ''
      setCurrentPlayback({
        id: null,
        audio: null,
        isPlaying: false
      })
    }
    
    // Remove recording from list
    setRecordings(prev => prev.filter(r => r.id !== recordingId))
    
    // Show toast
    toast({
      title: 'Recording deleted',
      description: 'The recording has been deleted.'
    })
  }
  
  // Rename recording
  const renameRecording = (recordingId: string, newName: string) => {
    setRecordings(prev => 
      prev.map(r => 
        r.id === recordingId ? { ...r, name: newName } : r
      )
    )
  }
  
  // Transcribe a recording using OpenAI's Whisper model
  const transcribeRecording = async (recordingId: string) => {
    // Find recording
    const recording = recordings.find(r => r.id === recordingId)
    if (!recording || !recording.blob) {
      toast({
        title: 'Error',
        description: 'Recording not found or audio data is missing.',
        variant: 'destructive'
      })
      return
    }
    
    // Update status to processing
    setRecordings(prev => 
      prev.map(r => 
        r.id === recordingId ? { ...r, status: 'processing' } : r
      )
    )
    
    // Show toast
    toast({
      title: 'Processing recording',
      description: 'Your recording is being transcribed. This may take a moment.'
    })
    
    try {
      // Call the transcription service with the recording blob
      const transcriptText = await transcriptionService.transcribeAudio(recording.blob)
      
      // Update the recording with the transcript
      setRecordings(prev => 
        prev.map(r => 
          r.id === recordingId 
            ? { 
                ...r, 
                status: 'transcribed',
                transcript: transcriptText
              } 
            : r
        )
      )
      
      toast({
        title: 'Transcription complete',
        description: 'Your recording has been successfully transcribed.'
      })
    } catch (error) {
      console.error('Transcription error:', error)
      
      // Update status to error
      setRecordings(prev => 
        prev.map(r => 
          r.id === recordingId ? { ...r, status: 'error' } : r
        )
      )
      
      toast({
        title: 'Transcription failed',
        description: 'There was an error transcribing your recording. Please try again.',
        variant: 'destructive'
      })
    }
  }
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Audio Recordings</h1>
        <p className="text-muted-foreground mt-2">
          Record and manage audio for transcription and report generation
        </p>
      </div>
      
      <Tabs defaultValue="recorder" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recorder">Recorder</TabsTrigger>
          <TabsTrigger value="recordings">My Recordings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recorder" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audio Recorder</CardTitle>
              <CardDescription>
                Record audio for transcription and report generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Recording name input field - shown before recording starts */}
              {!isRecording && (
                <div className="space-y-2 mb-4">
                  <Label htmlFor="recording-name">Recording Name</Label>
                  <Input 
                    id="recording-name" 
                    placeholder="Enter a name for your recording" 
                    value={recordingName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRecordingName(e.target.value)}
                    disabled={isRecording}
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter a descriptive name for this recording before you start
                  </p>
                </div>
              )}
              
              {/* Audio visualization */}
              <div className="flex justify-center">
                <div className="w-full h-32 border rounded-lg overflow-hidden bg-background p-2">
                  <canvas 
                    ref={canvasRef} 
                    width={1000} 
                    height={128}
                    className="w-full h-full"
                  />
                </div>
              </div>
              
              {/* Recording timer */}
              <div className="flex justify-center">
                <div className="flex items-center text-3xl font-semibold">
                  <Timer className="h-6 w-6 mr-2 text-primary" />
                  {formatDuration(recordingTime)}
                </div>
              </div>
              
              {/* Recording controls */}
              <div className="flex justify-center space-x-4">
                {!isRecording ? (
                  <Button 
                    size="lg" 
                    className="rounded-full w-16 h-16"
                    onClick={startRecording}
                  >
                    <Mic className="h-6 w-6" />
                  </Button>
                ) : (
                  <>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="rounded-full w-16 h-16"
                      onClick={togglePauseRecording}
                    >
                      {isPaused ? (
                        <Play className="h-6 w-6" />
                      ) : (
                        <Pause className="h-6 w-6" />
                      )}
                    </Button>
                    <Button 
                      size="lg" 
                      variant="destructive" 
                      className="rounded-full w-16 h-16"
                      onClick={stopRecording}
                    >
                      <Square className="h-6 w-6" />
                    </Button>
                  </>
                )}
                {isRecording && !isPaused && (
                  <div className="flex items-center ml-4 space-x-2">
                    <Volume2 className="h-5 w-5 text-muted-foreground" />
                    <Slider
                      defaultValue={[volume]}
                      max={100}
                      step={1}
                      className="w-24"
                      onValueChange={(values) => setVolume(values[0])}
                    />
                  </div>
                )}
              </div>
              
              {/* Recording tips */}
              <div className="flex items-start gap-2 rounded-md border p-3 bg-blue-50 dark:bg-blue-900/20">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-medium">Recording Tips:</p>
                  <ul className="list-disc pl-4 text-xs space-y-1 mt-1">
                    <li>Speak clearly and at a consistent volume</li>
                    <li>Minimize background noise</li>
                    <li>Keep the microphone at a consistent distance</li>
                    <li>For best results, use an external microphone if available</li>
                  </ul>
                </div>
              </div>
            </CardContent>
            {isRecording && (
              <CardFooter className="flex justify-center">
                <p className="text-sm text-red-500 animate-pulse">
                  {isPaused ? 'Recording paused' : 'Recording in progress...'}
                </p>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="recordings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Recordings</CardTitle>
              <CardDescription>
                Manage your recorded audio files
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recordings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileAudio className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <h3 className="text-lg font-medium">No recordings yet</h3>
                  <p className="text-sm mt-1">
                    Use the recorder to create your first recording
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => router.push('/dashboard/recordings/new')}
                  >
                    Go to Recorder
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recordings.map((recording) => (
                    <div 
                      key={recording.id} 
                      className="flex items-center justify-between p-4 rounded-md border"
                    >
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-full"
                          onClick={() => togglePlayback(recording.id)}
                        >
                          {currentPlayback.id === recording.id && currentPlayback.isPlaying ? (
                            <Pause className="h-5 w-5" />
                          ) : (
                            <Play className="h-5 w-5" />
                          )}
                        </Button>
                        
                        <div>
                          <div className="font-medium">{recording.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {recording.duration > 0 ? formatDuration(recording.duration) : '00:10'} • {formatFileSize(recording.size)} • {formatDate(recording.date)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {recording.status === 'ready' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => transcribeRecording(recording.id)}
                          >
                            Transcribe
                          </Button>
                        )}
                        
                        {recording.status === 'processing' && (
                          <div className="flex items-center space-x-2">
                            <div className="text-xs text-muted-foreground">Processing...</div>
                            <Progress value={45} className="w-16 h-2" />
                          </div>
                        )}
                        
                        {recording.status === 'transcribed' && (
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-green-600 border-green-600"
                              onClick={() => {
                                setActiveTranscript(recording.transcript || 'No transcript available')
                                setActiveRecordingName(recording.name)
                                setShowTranscript(true)
                              }}
                            >
                              View Transcript
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-600 border-blue-600"
                              onClick={() => {
                                // Navigate to create report page with recording data
                                router.push(`/dashboard/reports/new?recordingId=${recording.id}&recordingName=${encodeURIComponent(recording.name)}&transcript=${encodeURIComponent(recording.transcript || '')}`)
                              }}
                            >
                              Create Report
                            </Button>
                          </div>
                        )}
                        
                        {recording.status === 'error' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 border-red-600"
                            onClick={() => transcribeRecording(recording.id)}
                          >
                            Retry Transcription
                          </Button>
                        )}
                        
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive hover:text-destructive/90"
                          onClick={() => deleteRecording(recording.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Transcript Dialog */}
      <Dialog open={showTranscript} onOpenChange={setShowTranscript}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              Transcript: {activeRecordingName}
            </DialogTitle>
            <DialogDescription>
              Automatically generated transcript of your recording
            </DialogDescription>
          </DialogHeader>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          
          <div className="mt-4 overflow-y-auto flex-grow bg-muted p-4 rounded-md">
            <p className="whitespace-pre-wrap">{activeTranscript}</p>
          </div>
          
          <div className="mt-4 flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                // Copy transcript to clipboard
                navigator.clipboard.writeText(activeTranscript);
                toast({
                  title: "Copied to clipboard",
                  description: "Transcript has been copied to your clipboard",
                });
              }}
            >
              Copy to Clipboard
            </Button>
            <Button onClick={() => setShowTranscript(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
