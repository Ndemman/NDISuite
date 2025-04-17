"use client"

import React, { useRef, useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, FileCheck, FileText, Loader2, Mic, Square, Save, Upload } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { SessionFile } from '@/contexts/session/session-context'
import { useToast } from '@/components/ui/use-toast'
import { DynamicComponents } from '@/components/report-generator/DynamicComponents'

interface DataTabProps {
  selectedOption: 'record' | 'upload' | null
  onBack: () => void
  onContinue: () => void
  selectedFiles: SessionFile[]
  onFileUpload: (files: FileList) => void
  onFileRemove: (fileId: string) => void
  onRecordingSave: (file: SessionFile) => void
  
  // Recording state
  isRecording: boolean
  recordingTime: number
  audioURL: string | null
  transcript: string
  recordingTitle: string
  isTranscribing: boolean
  
  // Recording functions
  onRecordingTitleChange: (title: string) => void
  onStartRecording: () => void
  onStopRecording: () => void
  onDiscardRecording: () => void
  formatTime: (seconds: number) => string
  
  // Canvas ref for visualization
  canvasRef: React.RefObject<HTMLCanvasElement>
}

export function DataTab({
  selectedOption,
  onBack,
  onContinue,
  selectedFiles,
  onFileUpload,
  onFileRemove,
  onRecordingSave,
  isRecording,
  recordingTime,
  audioURL,
  transcript,
  recordingTitle,
  isTranscribing,
  onRecordingTitleChange,
  onStartRecording,
  onStopRecording,
  onDiscardRecording,
  formatTime,
  canvasRef
}: DataTabProps) {
  // IMPORTANT: This component is now fully controlled by its parent
  // All state is managed by the parent component, and this component
  // only renders based on the props it receives
  const { toast } = useToast()
  
  // Use a ref to track if we've already saved this recording to prevent infinite loops
  const savedRecordingRef = useRef(false);
  
  // Reset the saved flag when recording starts - this is the ONLY useEffect we need
  useEffect(() => {
    if (isRecording) {
      savedRecordingRef.current = false;
    }
  }, [isRecording]);
  
  return (
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
          // Recording Interface using AdvancedAudioRecorder
          <div>
            <DynamicComponents.AdvancedAudioRecorder
              initialTitle={recordingTitle}
              onTitleChange={onRecordingTitleChange}
              onRecordingComplete={(blob, duration) => {
                // Create a URL for the blob
                const url = URL.createObjectURL(blob);
                
                // Create a session file
                const newFile: SessionFile = {
                  id: `recording-${Date.now()}`,
                  name: recordingTitle || 'New Recording',
                  type: 'audio/wav',
                  size: blob.size,
                  url: url
                }
                
                // Save the recording
                onRecordingSave(newFile)
                
                toast({
                  title: 'Recording saved',
                  description: `Recording "${recordingTitle}" has been saved.`
                })
              }}
              onSave={(blob, title) => {
                // Create a URL for the blob
                const url = URL.createObjectURL(blob);
                
                // Create a session file
                const newFile: SessionFile = {
                  id: `recording-${Date.now()}`,
                  name: title || 'New Recording',
                  type: 'audio/wav',
                  size: blob.size,
                  url: url
                }
                
                // Save the recording
                onRecordingSave(newFile)
                
                toast({
                  title: 'Recording saved',
                  description: `Recording "${title}" has been saved.`
                })
              }}
              onContinue={onContinue}
              showSaveButton={true}
              showContinueButton={true}
              className="p-4"
            />
          </div>
        ) : (
          // File Upload Interface
          <div>
            <div 
              className="text-center p-6 border-2 border-dashed rounded-md hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById('file-upload')?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  onFileUpload(e.dataTransfer.files)
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
                    onFileUpload(e.target.files)
                  }
                }}
              />
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium mt-4">Upload Files</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Drag and drop files here or click to browse. You can upload documents, images, or audio files.
              </p>
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={(e) => {
                  e.stopPropagation()
                  document.getElementById('file-upload')?.click()
                }}
              >
                <Upload className="mr-2 h-4 w-4" />
                Select Files
              </Button>
            </div>
            
            {selectedFiles.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Selected Files</h3>
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
                          onClick={() => onFileRemove(file.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={onBack}
        >
          Back to Begin
        </Button>
        {selectedOption === 'upload' && (
          <Button 
            onClick={onContinue}
            // Enable the button if there are files
            disabled={selectedFiles.length === 0}
          >
            Continue to Sources
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export default React.memo(DataTab)
