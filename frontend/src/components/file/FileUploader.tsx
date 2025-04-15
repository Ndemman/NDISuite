import React, { useCallback } from 'react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Icons } from '@/components/ui/icons';
import { formatFileSize } from '@/lib/utils';

interface FileUploaderProps {
  onFileUpload?: (file: File) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in bytes
  className?: string;
}

/**
 * Optimized FileUploader component
 * Uses the useFileUpload hook for efficient file handling
 */
const FileUploader = ({
  onFileUpload,
  acceptedFileTypes = ['mp3', 'wav', 'ogg', 'mp4', 'm4a'],
  maxFileSize = 100 * 1024 * 1024, // 100MB default
  className = '',
}: FileUploaderProps) => {
  const {
    file,
    uploadProgress,
    isUploading,
    error,
    handleFileSelect,
    resetUpload,
  } = useFileUpload({
    acceptedFileTypes,
    maxFileSize,
    onUploadComplete: onFileUpload,
  });

  // Handle file drop and selection
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleFileSelect(acceptedFiles[0]);
    }
  }, [handleFileSelect]);

  return (
    <div className={`space-y-4 ${className}`}>
      {!file && !isUploading && (
        <div 
          className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => document.getElementById('file-upload')?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files.length > 0) {
              handleFileSelect(e.dataTransfer.files[0]);
            }
          }}
        >
          <Icons.Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <div className="mt-4">
            <p className="text-sm font-medium">
              Drag and drop your file here or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Accepted file types: {acceptedFileTypes.join(', ')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Maximum file size: {formatFileSize(maxFileSize)}
            </p>
          </div>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept={acceptedFileTypes.map(type => `.${type}`).join(',')}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-2 rounded-md">
          {error}
        </div>
      )}

      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Uploading...</span>
            <span className="text-sm">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {file && !isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium truncate">{file.name}</span>
            <span className="text-sm">{formatFileSize(file.size)}</span>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={resetUpload}
              className="flex items-center"
            >
              <Icons.Close className="mr-2 h-4 w-4" />
              Remove
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(FileUploader);
