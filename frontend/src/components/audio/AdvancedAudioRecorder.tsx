import React from 'react'
import { EnhancedAudioRecorder } from './EnhancedAudioRecorder'

/**
 * Interface for the AdvancedAudioRecorder component
 * Maintained for backward compatibility
 */
interface AdvancedAudioRecorderProps {
  onRecordingComplete?: (blob: Blob, duration: number, transcription?: string) => void;
  onTitleChange?: (title: string) => void;
  initialTitle?: string;
  onContinue?: (blob?: Blob, title?: string, transcription?: string) => void;
  onSave?: (blob: Blob, title: string, transcription?: string) => void;
  showSaveButton?: boolean;
  showContinueButton?: boolean;
  maxDuration?: number; // in seconds
  className?: string;
  showTranscription?: boolean; // Control whether to show transcription
}

/**
 * Advanced Audio Recorder component with enhanced reliability 
 * This implementation now internally uses the EnhancedAudioRecorder
 * for improved reliability while maintaining backward compatibility
 */
export function AdvancedAudioRecorder(props: AdvancedAudioRecorderProps) {
  // Pass all props directly to the EnhancedAudioRecorder
  return (
    <EnhancedAudioRecorder 
      onRecordingComplete={props.onRecordingComplete}
      onTitleChange={props.onTitleChange}
      initialTitle={props.initialTitle}
      onContinue={props.onContinue}
      onSave={props.onSave}
      showSaveButton={props.showSaveButton}
      showContinueButton={props.showContinueButton}
      maxDuration={props.maxDuration}
      className={props.className}
      showTranscription={props.showTranscription}
    />
  )
}

export default AdvancedAudioRecorder;
