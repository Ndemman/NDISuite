"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, FileCheck, FileText, Loader2, Mic, Square, Save, Upload } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { SessionFile } from '@/contexts/session/session-context'
import { useToast } from '@/components/ui/use-toast'

interface SourcesTabProps {
  selectedFiles: SessionFile[]
  onFileUpload: (files: FileList) => void
  onFileRemove: (fileId: string) => void
  onBack: () => void
  onContinue: () => void
  
  // Recording props
  onShowRecordingDialog: () => void
  isRecordingDialogOpen: boolean
  onCloseRecordingDialog: () => void
  
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
  onSaveRecording: () => void
  formatTime: (seconds: number) => string
  
  // Canvas ref for visualization
  canvasRef: React.RefObject<HTMLCanvasElement>
}

export function SourcesTab({
  selectedFiles,
  onFileUpload,
  onFileRemove,
  onBack,
  onContinue,
  onShowRecordingDialog,
  isRecordingDialogOpen,
  onCloseRecordingDialog,
  isRecording,
  recordingTime,
  audioURL,
  transcript,
  recordingTitle,
  isTranscribing,
  onRecordingTitleChange,
  onStartRecording,
  onStopRecording,
  onSaveRecording,
  formatTime,
  canvasRef
}: SourcesTabProps) {
  const { toast } = useToast()
  
  return (
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
                    onFileUpload(e.target.files)
                  }
                }}
              />
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onShowRecordingDialog}
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
                onFileUpload(e.dataTransfer.files)
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
                    onClick={() => onFileRemove(file.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Recording Dialog */}
        {isRecordingDialogOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Record Audio</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  onClick={onCloseRecordingDialog}
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
                    onChange={(e) => onRecordingTitleChange(e.target.value)}
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
                    onClick={onStartRecording} 
                    className="bg-red-500 hover:bg-red-600 text-white"
                    size="lg"
                    disabled={!!audioURL || !recordingTitle.trim()}
                  >
                    <Mic className="mr-2 h-4 w-4" />
                    Start Recording
                  </Button>
                ) : (
                  <Button 
                    onClick={onStopRecording} 
                    variant="destructive"
                    size="lg"
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Stop Recording
                  </Button>
                )}
                
                {audioURL && (
                  <Button 
                    onClick={onSaveRecording}
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
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={onBack}
        >
          Back to Data
        </Button>
        <Button 
          onClick={onContinue}
          disabled={selectedFiles.length === 0}
        >
          Continue to Configure
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}

export default React.memo(SourcesTab)
