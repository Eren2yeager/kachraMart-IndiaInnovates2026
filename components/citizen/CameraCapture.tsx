'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Loader2, X } from 'lucide-react';
import Webcam from 'react-webcam';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { animations } from '@/lib/theme';

interface CameraCaptureProps {
  onImageUploaded: (url: string) => void;
  isLoading?: boolean;
}

export function CameraCapture({ onImageUploaded, isLoading }: CameraCaptureProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  const requestCameraPermission = async () => {
    try {
      setError(null);
      setPermissionDenied(false);
      
      console.log('Requesting camera permission...');
      
      // Request camera permission explicitly
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      console.log('Camera permission granted, stream:', stream);

      // Stop the stream immediately - we just needed to request permission
      stream.getTracks().forEach((track) => {
        console.log('Stopping track:', track);
        track.stop();
      });

      // Now activate the camera
      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera permission error:', err.name, err.message);
      setPermissionDenied(true);
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is already in use by another application.');
      } else {
        setError(`Failed to access camera: ${err.message}`);
      }
    }
  };

  const handleCapture = async () => {
    if (!webcamRef.current) return;

    try {
      setUploading(true);
      setError(null);

      // Capture image as base64
      const imageSrc = webcamRef.current.getScreenshot();

      if (!imageSrc) {
        setError('Failed to capture photo');
        setUploading(false);
        return;
      }

      // Convert base64 to blob
      const response = await fetch(imageSrc);
      const blob = await response.blob();

      // Upload to server
      const formData = new FormData();
      formData.append('file', blob, 'camera-capture.jpg');

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setCameraActive(false);
      onImageUploaded(data.url);
    } catch (err: any) {
      setError(err.message || 'Failed to capture and upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setCameraActive(false);
    setError(null);
  };

  if (!cameraActive) {
    return (
      <motion.div {...animations.fadeIn}>
        <div className="space-y-3">
          <Button
            onClick={requestCameraPermission}
            variant="outline"
            className="w-full"
            disabled={uploading || isLoading}
          >
            <Camera className="mr-2 h-4 w-4" />
            Open Camera
          </Button>

          {error && (
            <motion.div
              {...animations.slideDown}
              className="p-3 text-xs md:text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md"
            >
              {error}
            </motion.div>
          )}

          {permissionDenied && (
            <motion.div
              {...animations.slideDown}
              className="p-3 text-xs md:text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md space-y-2"
            >
              <p className="font-medium">Camera Permission Required</p>
              <p className="text-xs">
                To use the camera feature, please allow camera access when prompted by your browser.
              </p>
              <p className="text-xs font-medium">Steps to fix:</p>
              <ol className="text-xs list-decimal list-inside space-y-1">
                <li>Click the lock icon in the address bar</li>
                <li>Find "Camera" and change it to "Allow"</li>
                <li>Refresh the page</li>
                <li>Try again</li>
              </ol>
              <Button
                size="sm"
                variant="outline"
                onClick={requestCameraPermission}
                className="w-full mt-2"
              >
                Try Again
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <motion.div {...animations.fadeIn}>
        <Card className="overflow-hidden">
          <div className="relative bg-black">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 },
              }}
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '400px',
                display: 'block',
              }}
            />

            {/* Camera Controls Overlay */}
            <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
              {/* Top - Close Button */}
              <div className="flex justify-end pointer-events-auto">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleClose}
                  disabled={uploading}
                  className="rounded-full w-10 h-10 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Bottom - Capture Controls */}
              <div className="flex justify-center gap-3 pointer-events-auto">
                <Button
                  size="lg"
                  onClick={handleCapture}
                  disabled={uploading}
                  className="rounded-full w-16 h-16 p-0"
                >
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <div className="w-12 h-12 rounded-full border-4 border-white" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

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
