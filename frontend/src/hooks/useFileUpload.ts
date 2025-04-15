import { useState, useCallback } from 'react'
import { SessionFile } from '@/contexts/session/session-context'
import { useToast } from '@/components/ui/use-toast'

interface UseFileUploadOptions {
  onFilesAdded?: (files: SessionFile[]) => void
  onUploadComplete?: (file: File) => void
  acceptedFileTypes?: string[]
  maxFileSize?: number // in bytes
}

export function useFileUpload(options?: UseFileUploadOptions) {
  const { toast } = useToast()
  const [selectedFiles, setSelectedFiles] = useState<SessionFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  
  // Handle file upload
  const uploadFiles = useCallback(async (files: FileList) => {
    if (!files || files.length === 0) return
    
    setIsUploading(true)
    const newFiles: SessionFile[] = []
    
    try {
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Create a unique ID for the file
        const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        
        // Create a file URL for preview
        const fileURL = URL.createObjectURL(file)
        
        // Create a new session file
        const newFile: SessionFile = {
          id: fileId,
          name: file.name,
          type: file.type,
          size: file.size,
          url: fileURL
        }
        
        // If it's a text file, read its contents
        if (file.type.startsWith('text/')) {
          try {
            const text = await readFileAsText(file)
            newFile.transcription = text
          } catch (error) {
            console.error('Error reading file:', error)
            toast({
              title: "Error Reading File",
              description: `Could not read the contents of ${file.name}.`,
              variant: "destructive"
            })
          }
        }
        
        newFiles.push(newFile)
      }
      
      // Update selected files
      setSelectedFiles(prev => [...prev, ...newFiles])
      
      // Call callback if provided
      if (options?.onFilesAdded) {
        options.onFilesAdded(newFiles)
      }
      
      toast({
        title: "Files Added",
        description: `${files.length} file(s) have been added.`
      })
    } catch (error) {
      console.error('Error uploading files:', error)
      toast({
        title: "Upload Error",
        description: "There was an error uploading your files. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }, [toast, options])
  
  // Read file as text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string)
        } else {
          reject(new Error('Failed to read file'))
        }
      }
      
      reader.onerror = () => {
        reject(reader.error)
      }
      
      reader.readAsText(file)
    })
  }
  
  // Remove file
  const removeFile = useCallback((fileId: string) => {
    setSelectedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId)
      
      // Revoke object URL to prevent memory leaks
      if (fileToRemove?.url) {
        URL.revokeObjectURL(fileToRemove.url)
      }
      
      return prev.filter(f => f.id !== fileId)
    })
  }, [])
  
  // Clear all files
  const clearFiles = useCallback(() => {
    // Revoke all object URLs to prevent memory leaks
    selectedFiles.forEach(file => {
      if (file.url) {
        URL.revokeObjectURL(file.url)
      }
    })
    
    setSelectedFiles([])
  }, [selectedFiles])
  
  // Single file state for the FileUploader component
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  // Handle single file selection for the FileUploader component
  const handleFileSelect = useCallback((selectedFile: File) => {
    // Validate file type if acceptedFileTypes is provided
    if (options?.acceptedFileTypes && options.acceptedFileTypes.length > 0) {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase() || ''
      if (!options.acceptedFileTypes.includes(fileExtension)) {
        setError(`File type not accepted. Please upload one of the following types: ${options.acceptedFileTypes.join(', ')}`)
        return
      }
    }
    
    // Validate file size if maxFileSize is provided
    if (options?.maxFileSize && selectedFile.size > options.maxFileSize) {
      setError(`File too large. Maximum file size is ${(options.maxFileSize / (1024 * 1024)).toFixed(2)} MB`)
      return
    }
    
    setFile(selectedFile)
    setError(null)
    
    // Simulate upload progress
    setIsUploading(true)
    setUploadProgress(0)
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          
          // Call onUploadComplete callback if provided
          if (options?.onUploadComplete) {
            options.onUploadComplete(selectedFile)
          }
          
          return 100
        }
        return prev + 10
      })
    }, 300)
  }, [options])
  
  // Reset the upload state
  const resetUpload = useCallback(() => {
    setFile(null)
    setUploadProgress(0)
    setError(null)
    setIsUploading(false)
  }, [])
  
  return {
    // Original interface
    selectedFiles,
    isUploading,
    uploadFiles,
    removeFile,
    clearFiles,
    setSelectedFiles,
    
    // FileUploader interface
    file,
    uploadProgress,
    error,
    handleFileSelect,
    resetUpload
  }
}

export default useFileUpload
