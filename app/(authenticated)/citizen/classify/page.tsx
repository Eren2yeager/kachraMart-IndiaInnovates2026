'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Download } from 'lucide-react';
import { ImageUpload } from '@/components/citizen/ImageUpload';
import { CameraCapture } from '@/components/citizen/CameraCapture';
import { ClassificationResult } from '@/components/citizen/ClassificationResult';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { animations } from '@/lib/theme';
import { ClassificationResult as ClassificationData } from '@/lib/roboflow';

export default function ClassifyPage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [classifying, setClassifying] = useState(false);
  const [result, setResult] = useState<ClassificationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadTab, setUploadTab] = useState<'upload' | 'camera'>('upload');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleImageUploaded = (url: string) => {
    setImageUrl(url);
    setResult(null);
    setError(null);
    setImageDimensions(null);
  };

  // Load image dimensions
  useEffect(() => {
    if (imageUrl && imageRef.current) {
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
      };
      img.src = imageUrl;
    }
  }, [imageUrl]);

  // Draw bounding boxes on canvas
  useEffect(() => {
    if (result && canvasRef.current && imageRef.current && imageDimensions) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas dimensions to match image
      canvas.width = imageDimensions.width;
      canvas.height = imageDimensions.height;

      // Draw image
      ctx.drawImage(imageRef.current, 0, 0);

      // Draw bounding boxes
      const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
      
      result.allDetections.forEach((detection, index) => {
        const color = colors[index % colors.length];
        
        // Calculate box coordinates
        const x = detection.x - detection.width / 2;
        const y = detection.y - detection.height / 2;
        const width = detection.width;
        const height = detection.height;

        // Draw rectangle with thin lines
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Draw label background
        const label = `${detection.class} (${Math.round(detection.confidence * 100)}%)`;
        ctx.font = 'bold 12px Arial';
        const textMetrics = ctx.measureText(label);
        const textHeight = 16;
        const padding = 4;

        ctx.fillStyle = color;
        ctx.fillRect(
          x,
          y - textHeight - padding,
          textMetrics.width + padding * 2,
          textHeight + padding
        );

        // Draw label text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, x + padding, y - padding);
      });
    }
  }, [result, imageDimensions]);

  const handleClassify = async () => {
    if (!imageUrl) return;

    setClassifying(true);
    setError(null);

    try {
      const response = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Classification failed');
      }

      setResult(data.classification);
    } catch (err: any) {
      setError(err.message || 'Failed to classify waste');
    } finally {
      setClassifying(false);
    }
  };

  const handleReset = () => {
    setImageUrl(null);
    setResult(null);
    setError(null);
    setImageDimensions(null);
  };

  const downloadImage = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.href = canvasRef.current.toDataURL('image/png');
      link.download = 'waste-classification.png';
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-6 lg:p-8">
      <motion.div {...animations.fadeIn} className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">AI Waste Classification</h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground">
            Upload an image and let AI identify the waste type automatically
          </p>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Upload & Controls */}
          <div className={`space-y-4 ${imageUrl ? 'lg:col-span-1' : 'lg:col-span-3'}`}>
            {/* Upload & Camera Tabs */}
            <div className="space-y-4">
              <div className="flex gap-1 border-b border-muted-foreground/20">
                <button
                  onClick={() => setUploadTab('upload')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    uploadTab === 'upload'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Upload Image
                </button>
                <button
                  onClick={() => setUploadTab('camera')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    uploadTab === 'camera'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Take Photo
                </button>
              </div>

              {/* Upload Section */}
              {uploadTab === 'upload' && (
                <ImageUpload 
                  onImageUploaded={handleImageUploaded} 
                  onImageRemoved={handleReset}
                  isLoading={classifying}
                />
              )}

              {/* Camera Section */}
              {uploadTab === 'camera' && (
                <CameraCapture 
                  onImageUploaded={handleImageUploaded}
                  isLoading={classifying}
                />
              )}
            </div>

            {/* Classify Button */}
            {imageUrl && !classifying && !result && (
              <motion.div {...animations.slideUp}>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleClassify}
                  disabled={classifying}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Classify Waste
                </Button>
              </motion.div>
            )}

            {/* Classifying State */}
            {classifying && (
              <motion.div {...animations.scale}>
                <Card>
                  <CardContent className="py-8">
                    <div className="text-center space-y-3">
                      <div className="relative mx-auto w-12 h-12">
                        <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm md:text-base">Analyzing Image...</p>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          AI is detecting waste items
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                {...animations.slideDown}
                className="p-3 text-xs md:text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg"
              >
                {error}
              </motion.div>
            )}

            {/* Result Actions */}
            {result && (
              <motion.div {...animations.slideUp} className="space-y-3">

                <Button
                  variant="outline"
                  className="w-full text-sm"
                  onClick={downloadImage}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Result
                </Button>
                <Button className="w-full text-sm">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Request Pickup
                </Button>
              </motion.div>
            )}

            {/* Info Card */}
            {!result && (
              <Card className="">
                <CardHeader>
                  <CardTitle className="text-base">How It Works</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { num: 1, title: 'Upload', desc: 'Select a waste image' },
                      { num: 2, title: 'Analyze', desc: 'AI detects items' },
                      { num: 3, title: 'Results', desc: 'View classification' },
                    ].map((step) => (
                      <div key={step.num} className="flex gap-2">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                          {step.num}
                        </div>
                        <div>
                          <p className="text-xs font-medium">{step.title}</p>
                          <p className="text-xs text-muted-foreground">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Image & Results */}
          {imageUrl && (
            <div className="lg:col-span-2 space-y-4">
              {/* Image Display with Bounding Boxes */}
              <motion.div {...animations.slideUp}>
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex justify-center bg-black/5 p-4">
                      <div className="relative inline-block max-w-full">
                        {/* Hidden reference image */}
                        <img
                          ref={imageRef}
                          src={imageUrl}
                          alt="Waste"
                          className="hidden"
                        />
                        
                        {/* Canvas for bounding boxes */}
                        {result ? (
                          <canvas
                            ref={canvasRef}
                            className="max-w-full h-auto border border-gray-200 rounded"
                            style={{
                              maxHeight: '600px',
                              width: 'auto',
                              height: 'auto',
                            }}
                          />
                        ) : (
                          <img
                            src={imageUrl}
                            alt="Waste"
                            className="max-w-full h-auto border border-gray-200 rounded"
                            style={{
                              maxHeight: '600px',
                              width: 'auto',
                              height: 'auto',
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Classification Results */}
              {result && (
                <motion.div {...animations.slideUp}>
                  <ClassificationResult result={result} />
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
