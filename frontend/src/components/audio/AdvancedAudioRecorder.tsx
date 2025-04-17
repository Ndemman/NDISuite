import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mic, Square, Play, Save, ArrowRight, Loader2, Pause } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface AdvancedAudioRecorderProps {
  onRecordingComplete?: (blob: Blob, duration: number) => void;
  onTitleChange?: (title: string) => void;
  initialTitle?: string;
  onContinue?: (blob?: Blob, title?: string) => void;
  onSave?: (blob: Blob, title: string) => void;
  showSaveButton?: boolean;
  showContinueButton?: boolean;
  maxDuration?: number; // in seconds
  className?: string;
}

/**
 * Simplified Audio Recorder component with visualization
 * Focused on recording functionality without preview or transcription
 */
export function AdvancedAudioRecorder({
  onRecordingComplete,
  onTitleChange,
  initialTitle = '',
  onContinue,
  onSave,
  showSaveButton = true,
  showContinueButton = true,
  maxDuration = 7200, // 2 hours default
  className = ''
}: AdvancedAudioRecorderProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [recordingTitle, setRecordingTitle] = useState(initialTitle)
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  
  // Generate a default title based on current date and time if not provided
  useEffect(() => {
    if (!initialTitle) {
      const now = new Date()
      const defaultTitle = `Recording ${now.toLocaleDateString()} at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      setRecordingTitle(defaultTitle)
    } else {
      setRecordingTitle(initialTitle)
    }
  }, [initialTitle])
  
  // Audio recording references
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  // Initialize audio visualization
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        // Draw initial empty waveform
        ctx.fillStyle = 'rgb(20, 20, 20)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        ctx.lineWidth = 2
        ctx.strokeStyle = 'rgb(0, 255, 0)'
        ctx.beginPath()
        
        const sliceWidth = canvas.width / 100
        let x = 0
        
        for (let i = 0; i < 100; i++) {
          const y = canvas.height / 2
          
          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
          
          x += sliceWidth
        }
        
        ctx.stroke()
      }
    }
  }, []) // Empty dependency array to run only on mount
  
  // Handle recording start
  const startRecording = async () => {
    try {
      // Reset state
      setAudioBlob(null)
      setRecordingTime(0)
      setIsRecording(true)
      setIsPaused(false)
      
      // Check if MediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API not supported in this browser or environment')
      }
      
      // Request microphone permission
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream
      } catch (permissionError) {
        console.error('Microphone permission denied:', permissionError)
        throw new Error('Microphone access denied. Please allow microphone access to record audio.')
      }

      // Set up audio context and analyser for visualization
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        if (!AudioContextClass) {
          throw new Error('AudioContext not supported in this browser or environment')
        }
        
        audioContextRef.current = new AudioContextClass()
        analyserRef.current = audioContextRef.current.createAnalyser()
        const source = audioContextRef.current.createMediaStreamSource(streamRef.current!)
        source.connect(analyserRef.current)
        analyserRef.current.fftSize = 256
      } catch (audioContextError) {
        console.error('Audio context initialization error:', audioContextError)
        throw new Error('Failed to initialize audio processing. Please try again.')
      }
      
      // Create media recorder
      try {
        mediaRecorderRef.current = new MediaRecorder(streamRef.current!)
        audioChunksRef.current = []
      } catch (recorderError) {
        console.error('Media recorder initialization error:', recorderError)
        throw new Error('Failed to initialize recording. Please try again with a different browser.')
      }
      
      // Collect audio chunks
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      // Handle recording stop
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        setAudioBlob(audioBlob)
        
        // Notify parent component if callback is provided
        if (onRecordingComplete) {
          onRecordingComplete(audioBlob, recordingTime);
        }
      }
      
      // Start recording
      mediaRecorderRef.current.start(1000) // Collect data every second
      
      // Start timer
      const startTime = Date.now()
      timerRef.current = setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000)
        setRecordingTime(elapsedTime)
        
        // Stop recording if max duration is reached
        if (elapsedTime >= maxDuration) {
          stopRecording()
        }
      }, 1000)
      
      // Start visualization
      visualize()
    } catch (error) {
      console.error('Error starting recording:', error)
      setIsRecording(false)
      
      toast({
        variant: 'destructive',
        title: 'Recording Error',
        description: error instanceof Error ? error.message : 'Failed to start recording'
      })
    }
  }
  
  // Handle recording pause
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      
      // Pause timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }
  
  // Handle recording resume
  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      
      // Resume timer
      const resumeTime = Date.now() - (recordingTime * 1000)
      timerRef.current = setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - resumeTime) / 1000)
        setRecordingTime(elapsedTime)
        
        // Stop recording if max duration is reached
        if (elapsedTime >= maxDuration) {
          stopRecording()
        }
      }, 1000)
    }
  }
  
  // Handle recording stop
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      
      // Stop all tracks on the stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }
  
  // Handle audio visualization
  const visualize = () => {
    if (!analyserRef.current || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const canvasCtx = canvas.getContext('2d')
    if (!canvasCtx) return
    
    const width = canvas.width
    const height = canvas.height
    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    
    const draw = () => {
      if (!isRecording) return
      
      requestAnimationFrame(draw)
      
      analyserRef.current!.getByteTimeDomainData(dataArray)
      
      canvasCtx.fillStyle = 'rgb(20, 20, 20)'
      canvasCtx.fillRect(0, 0, width, height)
      
      canvasCtx.lineWidth = 2
      canvasCtx.strokeStyle = 'rgb(0, 255, 0)'
      canvasCtx.beginPath()
      
      const sliceWidth = width / bufferLength
      let x = 0
      
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0
        const y = v * height / 2
        
        if (i === 0) {
          canvasCtx.moveTo(x, y)
        } else {
          canvasCtx.lineTo(x, y)
        }
        
        x += sliceWidth
      }
      
      canvasCtx.lineTo(width, height / 2)
      canvasCtx.stroke()
    }
    
    draw()
  }
  
  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setRecordingTitle(newTitle)
    if (onTitleChange) {
      onTitleChange(newTitle)
    }
  }
  
  // Handle save recording
  const handleSaveRecording = () => {
    if (!audioBlob) return
    
    setIsLoading(true)
    
    try {
      if (onSave) {
        onSave(audioBlob, recordingTitle)
      }
    } catch (error) {
      console.error('Error saving recording:', error)
      
      toast({
        variant: 'destructive',
        title: 'Save Error',
        description: error instanceof Error ? error.message : 'Failed to save recording'
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Clean up resources when component unmounts
  useEffect(() => {
    // Return cleanup function
    return () => {
      // Clean up timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      
      // Clean up audio context
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error)
      }
      
      // Clean up media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, []) // Empty dependency array to run only on mount/unmount
  
  return (
    <div className={`${className} space-y-4`}>
      {/* Audio visualization canvas */}
      <div className="relative w-full h-32 bg-black rounded-md overflow-hidden">
        <canvas 
          ref={canvasRef}
          className="w-full h-full"
          width={800}
          height={128}
        />
        <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm font-mono">
          {formatTime(recordingTime)}
        </div>
      </div>
      
      {/* Recording controls */}
      <div className="flex justify-center space-x-2">
        {!isRecording && !audioBlob && (
          <Button 
            onClick={startRecording} 
            variant="default"
            size="lg"
            className="flex items-center"
          >
            <Mic className="h-5 w-5 mr-2" />
            Start Recording
          </Button>
        )}
        
        {isRecording && !isPaused && (
          <>
            <Button 
              onClick={pauseRecording} 
              variant="outline"
              className="flex items-center"
            >
              <Pause className="h-5 w-5 mr-2" />
              Pause
            </Button>
            <Button 
              onClick={stopRecording} 
              variant="destructive"
              className="flex items-center"
            >
              <Square className="h-5 w-5 mr-2" />
              Stop
            </Button>
          </>
        )}
        
        {isRecording && isPaused && (
          <>
            <Button 
              onClick={resumeRecording} 
              variant="default"
              className="flex items-center"
            >
              <Play className="h-5 w-5 mr-2" />
              Resume
            </Button>
            <Button 
              onClick={stopRecording} 
              variant="destructive"
              className="flex items-center"
            >
              <Square className="h-5 w-5 mr-2" />
              Stop
            </Button>
          </>
        )}
        
        {audioBlob && !isRecording && (
          <Button 
            onClick={startRecording} 
            variant="outline"
            className="flex items-center"
          >
            <Mic className="h-5 w-5 mr-2" />
            Record Again
          </Button>
        )}
      </div>
      
      {/* Recording title input - shown after recording is done */}
      {audioBlob && !isRecording && (
        <div className="space-y-2">
          <Label htmlFor="title">Recording Title</Label>
          <Input 
            id="title" 
            placeholder="Enter a title for your recording" 
            value={recordingTitle}
            onChange={handleTitleChange}
            disabled={isRecording}
          />
        </div>
      )}
      
      {/* Action buttons */}
      {audioBlob && !isRecording && (
        <div className="flex justify-end space-x-3 pt-2">
          {showSaveButton && (
            <Button 
              onClick={handleSaveRecording} 
              disabled={isLoading || isRecording || !audioBlob}
              variant="default"
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
          )}
          {showContinueButton && onContinue && (
            <Button 
              onClick={() => {
                if (audioBlob) {
                  onContinue(audioBlob, recordingTitle);
                } else {
                  onContinue();
                }
              }}
              variant="default"
            >
              Continue to Sources
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default AdvancedAudioRecorder;
