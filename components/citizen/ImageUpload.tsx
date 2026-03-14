'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Loader2, X, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { animations } from '@/lib/theme';

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  onImageRemoved?: () => void;
  isLoading?: boolean;
}

export function ImageUpload({ onImageUploaded, onImageRemoved, isLoading }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [hasImage, setHasImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    // Upload to server
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setHasImage(true);
      onImageUploaded(data.url);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];

      setError(null);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB');
        return;
      }

      // Upload to server
      setUploading(true);
      fetch('/api/upload', {
        method: 'POST',
        body: (() => {
          const formData = new FormData();
          formData.append('file', file);
          return formData;
        })(),
      })
        .then((response) => response.json())
        .then((data) => {
          if (!data.url) {
            throw new Error(data.error || 'Upload failed');
          }
          setHasImage(true);
          onImageUploaded(data.url);
        })
        .catch((err: any) => {
          setError(err.message || 'Failed to upload image');
        })
        .finally(() => {
          setUploading(false);
        });
    }
  };

  const handleRemove = () => {
    setError(null);
    setHasImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageRemoved?.();
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading || isLoading}
      />

      {uploading ? (
        <motion.div {...animations.fadeIn}>
          <Card className="border-2 border-dashed border-primary/50 bg-primary/5">
            <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm font-medium">Uploading...</p>
            </div>
          </Card>
        </motion.div>
      ) : !hasImage ? (
        <motion.div {...animations.fadeIn}>
          <Card
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed transition-colors cursor-pointer ${
              isDragActive
                ? 'border-primary/80 bg-primary/5 dark:bg-primary/10'
                : 'border-muted-foreground/25 hover:border-primary/50 dark:border-muted-foreground/40'
            }`}
          >
            <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center">
              <div className="rounded-full bg-primary/10 p-3 md:p-4 mb-3 md:mb-4">
                <Upload className="h-6 md:h-8 w-6 md:w-8 text-primary" />
              </div>
              <h3 className="text-base md:text-lg font-semibold mb-2">Upload Waste Image</h3>
              <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-4">
                Click to select or drag and drop an image
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WEBP up to 10MB
              </p>
            </div>
          </Card>
        </motion.div>
      ) : (
        <motion.div {...animations.fadeIn}>
          <Card className="border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
            <div className="p-6 md:p-8 space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-2 flex-shrink-0">
                  <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-green-900 dark:text-green-100">Image Uploaded</p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">Ready for classification</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs md:text-sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Upload New
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1 text-xs md:text-sm"
                  onClick={handleRemove}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {error && (
        <motion.div
          {...animations.slideDown}
          className="p-3 text-xs md:text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}
