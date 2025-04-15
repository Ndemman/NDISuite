import React, { useState, useEffect } from 'react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Icons } from '@/components/ui/icons';
import { formatTime } from '@/lib/utils';

interface AudioRecorderProps {
  onRecordingComplete?: (audioBlob: Blob, audioDuration: number) => void;
  maxDuration?: number; // in seconds
  className?: string;
}

/**
 * Optimized AudioRecorder component
 * Uses the useAudioRecorder hook for efficient audio recording
 */
const AudioRecorder = ({
  onRecordingComplete,
  maxDuration = 300, // 5 minutes default
  className = '',
}: AudioRecorderProps) => {
  const {
    isRecording,
    recordingTime,
    audioBlob,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder({ maxDuration });

  const [progress, setProgress] = useState(0);

  // Update progress bar based on recording time
  useEffect(() => {
    if (isRecording) {
      const percentage = Math.min((recordingTime / maxDuration) * 100, 100);
      setProgress(percentage);
    }
  }, [recordingTime, maxDuration, isRecording]);

  // Call onRecordingComplete when recording is finished
  useEffect(() => {
    if (audioBlob && !isRecording && onRecordingComplete) {
      onRecordingComplete(audioBlob, recordingTime);
    }
  }, [audioBlob, isRecording, onRecordingComplete, recordingTime]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">
          {isRecording ? 'Recording...' : audioBlob ? 'Recording complete' : 'Ready to record'}
        </div>
        <div className="text-sm tabular-nums">
          {formatTime(recordingTime)} / {formatTime(maxDuration)}
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="flex justify-center space-x-2">
        {!isRecording && !audioBlob && (
          <Button 
            onClick={startRecording} 
            variant="default"
            size="sm"
            className="flex items-center"
          >
            <Icons.Mic className="mr-2 h-4 w-4" />
            Start Recording
          </Button>
        )}

        {isRecording && (
          <Button 
            onClick={stopRecording} 
            variant="destructive"
            size="sm"
            className="flex items-center"
          >
            <Icons.Square className="mr-2 h-4 w-4" />
            Stop Recording
          </Button>
        )}

        {audioBlob && !isRecording && (
          <Button 
            onClick={resetRecording} 
            variant="outline"
            size="sm"
            className="flex items-center"
          >
            <Icons.Mic className="mr-2 h-4 w-4" />
            Record Again
          </Button>
        )}
      </div>
    </div>
  );
};

export default React.memo(AudioRecorder);
