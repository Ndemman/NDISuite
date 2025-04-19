import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Mic, Square, Play, Save, ArrowRight, Loader2, Pause, Settings } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import WaveformVisualizer from '@/components/audio/WaveformVisualizer';
import { useEnhancedAudioRecorder } from '@/hooks';
import LiveTranscription from './LiveTranscription';

export interface EnhancedAudioRecorderProps {
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
  showSettings?: boolean; // Control whether to show advanced settings
}

/**
 * Enhanced Audio Recorder component with failsafe recording capabilities
 * Directly imported from the audio-transcription-app with adaptation for NDISuite
 */
export function EnhancedAudioRecorder({
  onRecordingComplete,
  onTitleChange,
  initialTitle = '',
  onContinue,
  onSave,
  showSaveButton = true,
  showContinueButton = true,
  maxDuration = 7200, // 2 hours default
  className = '',
  showTranscription = true,
  showSettings = true
}: EnhancedAudioRecorderProps) {
  const { toast } = useToast();

  // Get recorder functionality from custom hook
  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    transcription,
    isTranscribing,
    liveTranscriptionEnabled,
    analyserNode,
    canvasRef,
    visualizationData,
    isProcessing,
    recordingTitle,
    setRecordingTitle,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    toggleLiveTranscription,
    processingError,
    recoveryAttempts,
    isOfflineMode,
    microphoneAccessError,
    setMicrophoneAccessError,
    formatTime,
    saveRecording,
    resetRecording
  } = useEnhancedAudioRecorder({
    initialTitle,
    maxDuration,
    onRecordingComplete,
    onTranscriptionUpdate: null,
    enableTranscription: showTranscription
  });

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setRecordingTitle(newTitle);
    if (onTitleChange) {
      onTitleChange(newTitle);
    }
  };

  // Handle save recording
  const handleSaveRecording = async () => {
    if (!audioBlob) return;
    
    try {
      await saveRecording();
      
      // If onSave prop exists, call it with the recording
      if (onSave) {
        onSave(audioBlob, recordingTitle, transcription || undefined);
      }
      
      toast({
        title: 'Recording Saved',
        description: `'${recordingTitle}' has been saved successfully.`,
      });
    } catch (error) {
      console.error('Error saving recording:', error);
      toast({
        title: 'Failed to Save',
        description: 'There was an error saving your recording. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Retry when microphone access denied
  const handleRetryMicrophoneAccess = () => {
    setMicrophoneAccessError(null);
    startRecording();
  };

  // Use text entry instead of audio recording
  const handleUseTextEntry = () => {
    // This would navigate to a text entry alternative
    toast({
      title: 'Text Entry Mode',
      description: 'Switching to manual text entry mode.',
    });
    
    // In a real implementation, this would trigger alternative UI
    if (onContinue) {
      onContinue(undefined, recordingTitle, '');
    }
  };

  // Show appropriate UI based on current state
  const renderMicrophoneAccessError = () => (
    <div className="space-y-4 p-4 border border-destructive rounded-md bg-destructive/10">
      <div className="flex items-center space-x-2">
        <div className="p-2 rounded-full bg-destructive/20">
          <Mic className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="text-lg font-medium">Microphone Access Denied</h3>
      </div>
      
      <p>Your browser has blocked microphone access. To fix this:</p>
      
      <ol className="list-decimal pl-5 space-y-1">
        <li>Click the camera/microphone icon in your browser's address bar</li>
        <li>Select "Allow" for microphone access</li>
        <li>Refresh this page</li>
      </ol>
      
      <div className="flex space-x-2 pt-2">
        <Button onClick={handleRetryMicrophoneAccess} variant="default">
          Try Again
        </Button>
        <Button onClick={handleUseTextEntry} variant="outline">
          Use Text Entry Instead
        </Button>
      </div>
    </div>
  );

  const renderNetworkError = () => (
    <div className="p-2 border border-amber-500 rounded-md bg-amber-50 dark:bg-amber-950/30 mb-4">
      <div className="flex items-center space-x-2">
        <div className="animate-spin">
          <Loader2 className="h-4 w-4 text-amber-500" />
        </div>
        <p className="text-sm text-amber-700 dark:text-amber-400">
          {isOfflineMode ? 'Offline mode active - Recording continues safely' : 'Reconnecting to transcription service...'}
        </p>
      </div>
    </div>
  );

  return (
    <div className={`${className} space-y-4`}>
      {/* Error messages */}
      {microphoneAccessError && renderMicrophoneAccessError()}
      {processingError && !microphoneAccessError && renderNetworkError()}
      
      {/* Only show main UI if no microphone access error */}
      {!microphoneAccessError && (
        <>
          {/* Audio visualization canvas */}
          <div className="relative w-full h-32 bg-black rounded-md overflow-hidden">
            <WaveformVisualizer 
              ref={canvasRef}
              isRecording={isRecording}
              isPaused={isPaused}
              analyserNode={analyserNode}
              className="w-full h-full"
              width={800}
              height={128}
            />
            <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm font-mono">
              {formatTime(recordingTime)}
            </div>
            
            {/* Recovery message */}
            {recoveryAttempts > 0 && (
              <div className="absolute bottom-2 left-2 bg-amber-500/80 text-white px-2 py-0.5 rounded text-xs">
                Recovery mode: {recoveryAttempts}/3
              </div>
            )}
          </div>
          
          {/* Live transcription toggle */}
          {showTranscription && (
            <div className="flex items-center space-x-2">
              <Switch
                id="live-transcription"
                checked={liveTranscriptionEnabled}
                onCheckedChange={toggleLiveTranscription}
                disabled={isRecording && !isPaused}
              />
              <Label htmlFor="live-transcription">Live Transcription</Label>
            </div>
          )}
          
          {/* Live transcription display */}
          {showTranscription && liveTranscriptionEnabled && (
            <LiveTranscription
              transcription={transcription}
              isTranscribing={isTranscribing}
              className="mt-2"
            />
          )}
          
          {/* Recording controls */}
          <div className="flex justify-center space-x-2">
            {!isRecording && !audioBlob && (
              <Button 
                onClick={startRecording} 
                variant="default"
                size="lg"
                disabled={isProcessing}
                className="flex items-center"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  <>
                    <Mic className="h-5 w-5 mr-2" />
                    Start Recording
                  </>
                )}
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
                onClick={resetRecording} 
                variant="outline"
                className="flex items-center"
              >
                <Mic className="h-5 w-5 mr-2" />
                Record Again
              </Button>
            )}
            
            {showSettings && !isRecording && (
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={() => toast({
                  title: "Settings",
                  description: "Advanced settings panel will be implemented in the next phase."
                })}
              >
                <Settings className="h-5 w-5" />
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
                  disabled={isProcessing || isRecording || !audioBlob}
                  variant="default"
                >
                  {isProcessing ? (
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
                      onContinue(audioBlob, recordingTitle, transcription);
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
        </>
      )}
    </div>
  );
}

export default EnhancedAudioRecorder;
