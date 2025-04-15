import { useState, useRef, useCallback, useEffect } from 'react'
import transcriptionService from '@/services/api/transcriptionService'
import { useToast } from '@/components/ui/use-toast'

interface UseAudioRecorderOptions {
  onTranscriptionComplete?: (transcript: string) => void
  maxDuration?: number // Maximum recording duration in seconds
}

export function useAudioRecorder(options?: UseAudioRecorderOptions) {
  const { toast } = useToast()
  
  // Audio recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcript, setTranscript] = useState('')
  
  // Refs for recording functionality
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Format time for display
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])
  
  // Visualize audio
  const visualize = useCallback(() => {
    if (!analyserRef.current || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const canvasCtx = canvas.getContext('2d')
    if (!canvasCtx) return
    
    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    
    const draw = () => {
      if (!isRecording) return
      requestAnimationFrame(draw)
      
      analyser.getByteTimeDomainData(dataArray)
      
      canvasCtx.fillStyle = 'rgb(0, 0, 0)'
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height)
      
      canvasCtx.lineWidth = 2
      canvasCtx.strokeStyle = 'rgb(0, 255, 0)'
      canvasCtx.beginPath()
      
      const sliceWidth = canvas.width / bufferLength
      let x = 0
      
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0
        const y = v * canvas.height / 2
        
        if (i === 0) {
          canvasCtx.moveTo(x, y)
        } else {
          canvasCtx.lineTo(x, y)
        }
        
        x += sliceWidth
      }
      
      canvasCtx.lineTo(canvas.width, canvas.height / 2)
      canvasCtx.stroke()
    }
    
    draw()
  }, [isRecording])
  
  // Start recording
  const startRecording = useCallback(async () => {
    try {
      // Reset state
      audioChunksRef.current = []
      setIsRecording(true)
      setRecordingTime(0)
      setAudioURL(null)
      setAudioBlob(null)
      setTranscript('')
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Set up audio context for visualization
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = audioContext
      
      // Create analyzer for visualization
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      analyserRef.current = analyser
      
      // Connect microphone to analyzer
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      // Start visualization
      visualize()
      
      // Collect audio chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      // Handle recording stop
      mediaRecorder.onstop = () => {
        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        setAudioBlob(audioBlob)
        
        // Create audio URL for playback
        const audioURL = URL.createObjectURL(audioBlob)
        setAudioURL(audioURL)
        
        // Start transcription
        startTranscription(audioBlob)
      }
      
      // Start recording
      mediaRecorder.start()
      
    } catch (error) {
      console.error('Error starting recording:', error)
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions and try again.",
        variant: "destructive"
      })
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [toast, visualize])
  
  // Stop recording
  const stopRecording = useCallback(() => {
    // Stop recording
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }
    
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    // Update state
    setIsRecording(false)
  }, [])
  
  // Start transcription
  const startTranscription = useCallback(async (blob: Blob) => {
    try {
      setIsTranscribing(true)
      
      // Get audio duration
      const audioDurationMs = recordingTime * 1000
      
      // Transcribe audio
      const transcription = await transcriptionService.transcribeAudio(blob, audioDurationMs)
      
      // Update state
      setTranscript(transcription)
      
      // Call callback if provided
      if (options?.onTranscriptionComplete) {
        options.onTranscriptionComplete(transcription)
      }
      
      toast({
        title: 'Transcription Complete',
        description: 'Your audio has been transcribed successfully.'
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
  }, [recordingTime, toast, options])
  
  // Reset recording state
  const resetRecording = useCallback(() => {
    setIsRecording(false)
    setRecordingTime(0)
    setAudioURL(null)
    setAudioBlob(null)
    setTranscript('')
    
    // Clean up resources
    if (audioURL) {
      URL.revokeObjectURL(audioURL)
    }
  }, [audioURL])
  
  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      
      if (audioURL) {
        URL.revokeObjectURL(audioURL)
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error)
      }
    }
  }, [audioURL])
  
  return {
    isRecording,
    recordingTime,
    audioURL,
    audioBlob,
    isTranscribing,
    transcript,
    canvasRef,
    startRecording,
    stopRecording,
    resetRecording,
    formatTime
  }
}

export default useAudioRecorder
