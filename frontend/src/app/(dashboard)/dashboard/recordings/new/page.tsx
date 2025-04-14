"use client"

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mic, Square, Play, Save, ArrowLeft, Loader2, FileText } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useSession } from '@/contexts/session/session-context'
import { Slider } from '@/components/ui/slider'
import transcriptionService from '@/services/api/transcriptionService'

export default function NewRecordingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { createSession } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [recordingTitle, setRecordingTitle] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [volume, setVolume] = useState([75])
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  
  // Generate a default title based on current date and time
  useEffect(() => {
    const now = new Date()
    const defaultTitle = `Recording ${now.toLocaleDateString()} at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    setRecordingTitle(defaultTitle)
  }, [])
  
  // Refs for recording functionality
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  // Initialize audio visualization
  useEffect(() => {
    if (canvasRef.current) {
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
  }, [])
  
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
      setIsPaused(false)
      
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
      
      // In browser preview environments, provide specific guidance
      if (window.location.hostname.includes('127.0.0.1') || window.location.hostname.includes('localhost')) {
        errorMessage += ' Note: Microphone access may be limited in browser preview environments.'
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
  
  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  // Handle save recording
  const handleSaveRecording = async () => {
    if (!audioURL) {
      toast({
        title: 'No Recording',
        description: 'Please record audio before saving.',
        variant: 'destructive'
      })
      return
    }
    
    if (!recordingTitle.trim()) {
      toast({
        title: 'Title Required',
        description: 'Please provide a title for your recording.',
        variant: 'destructive'
      })
      return
    }
    
    setIsLoading(true)
    
    try {
      // Ensure we have a valid duration (minimum 10 seconds if timer failed)
      const duration = recordingTime > 0 ? recordingTime : 10;
      console.log(`Saving recording with duration: ${duration} seconds`);
      
      // Create a new session with the recording
      const sessionId = await createSession({
        name: recordingTitle,
        type: 'recording',
        status: 'to-start',
        audioUrl: audioURL,
        transcript: transcript,
        duration: duration
      })
      
      toast({
        title: 'Recording Saved',
        description: 'Your recording has been saved successfully.',
      })
      
      // Redirect to the recording editor
      router.push(`/dashboard/recordings/${sessionId}`)
    } catch (error) {
      console.error('Error saving recording:', error)
      toast({
        title: 'Error',
        description: 'There was an error saving your recording. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
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
      
      toast({
        title: 'Transcription Complete',
        description: 'Your audio has been transcribed successfully.',
      })
    } catch (error) {
      // Better error handling with specific error message
      let errorMessage = 'There was an error transcribing your audio. You can try again later.';
      
      if (error instanceof Error) {
        console.error('Transcription error:', { 
          message: error.message,
          name: error.name,
          stack: error.stack
        });
        
        // Use the actual error message if available
        if (error.message) {
          errorMessage = error.message;
        }
      } else {
        console.error('Transcription error:', String(error));
      }
      
      toast({
        title: 'Transcription Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsTranscribing(false)
    }
  }
  
  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    setVolume(value)
    if (audioRef.current) {
      audioRef.current.volume = value[0] / 100
    }
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.back()}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Record Audio</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mic className="h-5 w-5 mr-2" />
            Audio Recorder
          </CardTitle>
          <CardDescription>
            Record audio for transcription and report generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
          
          {/* Recording title input - shown before recording starts */}
          {!isRecording && !audioURL && (
            <div className="space-y-2 mb-4">
              <Label htmlFor="pre-title">Recording Title</Label>
              <Input 
                id="pre-title" 
                placeholder="Enter a title for your recording" 
                value={recordingTitle}
                onChange={(e) => setRecordingTitle(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Enter a descriptive name for this recording before you start
              </p>
            </div>
          )}
          
          {/* Recording controls */}
          <div className="flex justify-center space-x-4">
            {!isRecording ? (
              <Button 
                onClick={startRecording} 
                className="bg-red-500 hover:bg-red-600 text-white"
                size="lg"
                disabled={!!audioURL || !recordingTitle.trim()}
              >
                <Mic className="h-5 w-5 mr-2" />
                Start Recording
              </Button>
            ) : (
              <Button 
                onClick={stopRecording} 
                variant="destructive"
                size="lg"
              >
                <Square className="h-5 w-5 mr-2" />
                Stop Recording
              </Button>
            )}
          </div>
          
          {/* Audio playback if recording is done */}
          {audioURL && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Recording Preview</h3>
                <div className="flex items-center space-x-2">
                  <Mic className="h-4 w-4" />
                  <Slider 
                    value={volume} 
                    onValueChange={handleVolumeChange}
                    max={100}
                    step={1}
                    className="w-24"
                  />
                </div>
              </div>
              
              <audio 
                ref={audioRef}
                src={audioURL} 
                controls 
                className="w-full"
              />
              
              {/* Transcription status and result */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Transcription
                  </h3>
                  {isTranscribing && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Transcribing...
                    </div>
                  )}
                </div>
                
                {isTranscribing ? (
                  <div className="bg-muted rounded-md p-4 min-h-[100px] flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                    <span>Processing your audio...</span>
                  </div>
                ) : transcript ? (
                  <div className="bg-muted rounded-md p-4 max-h-[300px] overflow-y-auto">
                    <p className="whitespace-pre-wrap">{transcript}</p>
                  </div>
                ) : (
                  <div className="bg-muted rounded-md p-4 min-h-[100px] flex items-center justify-center text-muted-foreground">
                    Transcription will appear here automatically
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Recording title input - shown after recording is done */}
          {audioURL && (
            <div className="space-y-2 pt-4">
              <Label htmlFor="title">Recording Title</Label>
              <Input 
                id="title" 
                placeholder="Enter a title for your recording" 
                value={recordingTitle}
                onChange={(e) => setRecordingTitle(e.target.value)}
                disabled={isRecording}
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveRecording} 
            disabled={isLoading || isRecording || !audioURL}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Recording
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
