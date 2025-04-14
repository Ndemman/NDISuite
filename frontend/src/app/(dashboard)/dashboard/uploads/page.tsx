"use client"

import React, { useState, useRef } from 'react'
import { useAuth } from '@/contexts/auth/auth-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Upload, 
  File, 
  FileText, 
  FileAudio,
  FileImage,
  AlertCircle,
  CheckCircle2,
  X,
  Trash
} from 'lucide-react'
import { formatFileSize, isAllowedFileType } from '@/lib/utils'

interface UploadedFile {
  id: string
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
}

export default function UploadsPage() {
  const { user, token } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // State for uploaded files
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  
  // Allowed file types
  const allowedFileTypes = ['pdf', 'doc', 'docx', 'txt', 'mp3', 'wav', 'mp4', 'jpg', 'jpeg', 'png']
  const documentTypes = ['pdf', 'doc', 'docx', 'txt']
  const audioTypes = ['mp3', 'wav', 'mp4']
  const imageTypes = ['jpg', 'jpeg', 'png']
  
  // Max file size: 50MB
  const MAX_FILE_SIZE = 50 * 1024 * 1024
  
  // File icon mapping
  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase() || ''
    
    if (documentTypes.includes(extension)) {
      return <FileText className="h-6 w-6 text-blue-500" />
    } else if (audioTypes.includes(extension)) {
      return <FileAudio className="h-6 w-6 text-green-500" />
    } else if (imageTypes.includes(extension)) {
      return <FileImage className="h-6 w-6 text-purple-500" />
    }
    
    return <File className="h-6 w-6 text-gray-500" />
  }
  
  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      uploadFiles(Array.from(selectedFiles))
    }
  }
  
  // Handle drag events
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }
  
  // Handle drop event
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(Array.from(e.dataTransfer.files))
    }
  }
  
  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }
  
  // Upload files to server
  const uploadFiles = async (selectedFiles: File[]) => {
    // Validate files before uploading
    const validFiles = selectedFiles.filter(file => {
      // Check file type
      if (!isAllowedFileType(file.name, allowedFileTypes)) {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: `${file.name} is not a supported file type.`
        })
        return false
      }
      
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: `${file.name} exceeds the 50MB limit.`
        })
        return false
      }
      
      return true
    })
    
    if (validFiles.length === 0) return
    
    // Add files to state with initial progress
    const newFiles = validFiles.map(file => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      progress: 0,
      status: 'uploading' as const
    }))
    
    setFiles(prev => [...prev, ...newFiles])
    setIsUploading(true)
    
    // Upload each file with simulated progress
    for (const fileObj of newFiles) {
      await uploadFile(fileObj)
    }
    
    setIsUploading(false)
  }
  
  // Simulate file upload with progress
  const uploadFile = async (fileObj: UploadedFile) => {
    // In a real implementation, you would use FormData and fetch to upload to your API
    // For now, we'll simulate the upload process
    
    return new Promise<void>(resolve => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 10) + 1
        
        if (progress >= 100) {
          clearInterval(interval)
          progress = 100
          
          // Update file status to success
          setFiles(prev => 
            prev.map(f => 
              f.id === fileObj.id ? { ...f, progress: 100, status: 'success' } : f
            )
          )
          
          toast({
            title: "File uploaded",
            description: `${fileObj.file.name} was uploaded successfully.`
          })
          
          resolve()
        } else {
          // Update progress
          setFiles(prev => 
            prev.map(f => 
              f.id === fileObj.id ? { ...f, progress } : f
            )
          )
        }
      }, 200)
    })
  }
  
  // Remove a file from the list
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }
  
  // Handle clear all files
  const clearAllFiles = () => {
    setFiles([])
  }
  
  // Calculate total upload progress
  const totalProgress = files.length 
    ? files.reduce((sum, file) => sum + file.progress, 0) / files.length 
    : 0
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">File Uploads</h1>
        <p className="text-muted-foreground mt-2">
          Upload documents, audio files, and images for processing and report generation
        </p>
      </div>
      
      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">Upload Files</TabsTrigger>
          <TabsTrigger value="history">Upload History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          {/* Drag & Drop Area */}
          <Card>
            <CardContent className="pt-6">
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center ${
                  dragActive ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="p-4 rounded-full bg-primary/10">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Drag and drop files here</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Supports PDF, DOC, DOCX, TXT, MP3, WAV, MP4, JPG, JPEG, and PNG files up to 50MB.
                  </p>
                  <Button 
                    onClick={handleUploadClick}
                    className="mt-4"
                  >
                    Select Files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.mp3,.wav,.mp4,.jpg,.jpeg,.png"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Uploaded Files */}
          {files.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Uploaded Files</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={clearAllFiles}
                    disabled={isUploading}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </div>
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Overall Progress</span>
                      <span>{Math.round(totalProgress)}%</span>
                    </div>
                    <Progress value={totalProgress} />
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {files.map((file) => (
                  <div 
                    key={file.id} 
                    className="flex items-center justify-between p-3 rounded-md border bg-card"
                  >
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file.file.name)}
                      <div>
                        <div className="font-medium">{file.file.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatFileSize(file.file.size)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {file.status === 'uploading' ? (
                        <>
                          <div className="w-24 text-xs">
                            <div className="flex justify-between mb-1">
                              <span>Uploading</span>
                              <span>{file.progress}%</span>
                            </div>
                            <Progress value={file.progress} className="h-1" />
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeFile(file.id)}
                            disabled={file.progress >= 95}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : file.status === 'success' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <div className="flex items-center">
                          <AlertCircle className="h-5 w-5 text-destructive mr-2" />
                          <span className="text-xs text-destructive">{file.error || 'Upload failed'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
              {files.some(f => f.status === 'success') && (
                <CardFooter className="flex justify-end">
                  <Button>
                    Process Files
                  </Button>
                </CardFooter>
              )}
            </Card>
          )}
          
          {/* File Types Information */}
          <Card>
            <CardHeader>
              <CardTitle>Supported File Types</CardTitle>
              <CardDescription>
                We support a variety of file formats for different purposes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border p-3">
                  <div className="flex items-center space-x-3 mb-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <h4 className="font-semibold">Documents</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>PDF (.pdf)</li>
                    <li>Word (.doc, .docx)</li>
                    <li>Text (.txt)</li>
                  </ul>
                </div>
                
                <div className="rounded-lg border p-3">
                  <div className="flex items-center space-x-3 mb-2">
                    <FileAudio className="h-5 w-5 text-green-500" />
                    <h4 className="font-semibold">Audio</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>MP3 (.mp3)</li>
                    <li>WAV (.wav)</li>
                    <li>MP4 (.mp4)</li>
                  </ul>
                </div>
                
                <div className="rounded-lg border p-3">
                  <div className="flex items-center space-x-3 mb-2">
                    <FileImage className="h-5 w-5 text-purple-500" />
                    <h4 className="font-semibold">Images</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>JPEG (.jpg, .jpeg)</li>
                    <li>PNG (.png)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Uploads</CardTitle>
              <CardDescription>
                View and manage your previously uploaded files
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* In a real implementation, this would fetch from the API */}
              <div className="text-center py-12 text-muted-foreground">
                <File className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium">No recent uploads</h3>
                <p className="text-sm mt-1">
                  Upload files to see them in your history
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    document.querySelector('[data-value="upload"]')?.dispatchEvent(
                      new MouseEvent('click', { bubbles: true })
                    );
                  }}
                >
                  Go to Upload
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
