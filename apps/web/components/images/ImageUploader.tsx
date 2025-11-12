'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { uploadPropertyImage } from '@/lib/actions/image-upload';
import { getImageDimensions } from '@/lib/utils/image';

interface ImageUploaderProps {
  propertyId: string;
  onUploadComplete?: (imageId: string) => void;
  maxFiles?: number;
}

interface UploadingFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  dimensions?: { width: number; height: number };
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

export function ImageUploader({
  propertyId,
  onUploadComplete,
  maxFiles = 10,
}: ImageUploaderProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds 10MB';
    }
    if (!Object.keys(ACCEPTED_TYPES).includes(file.type)) {
      return 'Invalid file type. Only JPEG, PNG, and WebP are allowed';
    }
    return null;
  }, []);

  const uploadFile = useCallback(
    async (uploadFile: UploadingFile) => {
      try {
        // Update status to uploading
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 0 } : f
          )
        );

        // Get image dimensions
        const dimensions = await getImageDimensions(uploadFile.file);

        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, dimensions, progress: 25 } : f
          )
        );

        // Upload to server
        const formData = new FormData();
        formData.append('file', uploadFile.file);
        formData.append('propertyId', propertyId);

        setUploadingFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: 50 } : f))
        );

        const result = await uploadPropertyImage(formData);

        if (!result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        // Success
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, status: 'success', progress: 100 } : f
          )
        );

        if (onUploadComplete && result.image) {
          onUploadComplete(result.image.id);
        }

        // Remove from list after 2 seconds
        setTimeout(() => {
          setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadFile.id));
        }, 2000);
      } catch (error) {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? {
                  ...f,
                  status: 'error',
                  error: error instanceof Error ? error.message : 'Upload failed',
                }
              : f
          )
        );
      }
    },
    [propertyId, onUploadComplete]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Check max files limit
      const currentCount = uploadingFiles.filter(
        (f) => f.status === 'pending' || f.status === 'uploading'
      ).length;
      const availableSlots = maxFiles - currentCount;

      if (availableSlots <= 0) {
        alert(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const filesToUpload = acceptedFiles.slice(0, availableSlots);

      // Validate and prepare files
      const newFiles: UploadingFile[] = [];
      for (const file of filesToUpload) {
        const error = validateFile(file);
        if (error) {
          alert(`${file.name}: ${error}`);
          continue;
        }

        newFiles.push({
          id: `${Date.now()}-${Math.random()}`,
          file,
          preview: URL.createObjectURL(file),
          progress: 0,
          status: 'pending',
        });
      }

      setUploadingFiles((prev) => [...prev, ...newFiles]);

      // Start uploading
      newFiles.forEach((file) => {
        uploadFile(file);
      });
    },
    [uploadingFiles, maxFiles, validateFile, uploadFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  const removeFile = useCallback((id: string) => {
    setUploadingFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }
        `}
        role="button"
        aria-label="Upload images"
        tabIndex={0}
      >
        <input {...getInputProps()} aria-label="File input" />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-lg text-blue-600">Drop the images here...</p>
        ) : (
          <>
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drag & drop images here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              JPEG, PNG, or WebP (max {maxFiles} files, 10MB each)
            </p>
          </>
        )}
      </div>

      {/* Upload Progress List */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Uploading Files</h3>
          {uploadingFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 border rounded-lg bg-white"
            >
              {/* Preview */}
              <img
                src={file.preview}
                alt={file.file.name}
                className="h-12 w-12 object-cover rounded"
              />

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(file.file.size / 1024 / 1024).toFixed(2)} MB
                  {file.dimensions &&
                    ` • ${file.dimensions.width}×${file.dimensions.height}`}
                </p>

                {/* Progress Bar */}
                {file.status === 'uploading' && (
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}

                {/* Error Message */}
                {file.status === 'error' && (
                  <p className="text-xs text-red-600 mt-1">{file.error}</p>
                )}
              </div>

              {/* Status Icon */}
              <div className="flex-shrink-0">
                {file.status === 'pending' && (
                  <div className="h-5 w-5 text-gray-400">
                    <div className="animate-pulse">⏳</div>
                  </div>
                )}
                {file.status === 'uploading' && (
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                )}
                {file.status === 'success' && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                {file.status === 'error' && (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
              </div>

              {/* Remove Button */}
              {(file.status === 'error' || file.status === 'success') && (
                <button
                  onClick={() => removeFile(file.id)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                  aria-label="Remove file"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
