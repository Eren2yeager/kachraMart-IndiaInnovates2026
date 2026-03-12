'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, RotateCcw } from 'lucide-react';
import { ImageUpload } from '@/components/citizen/ImageUpload';
import { ClassificationResult } from '@/components/citizen/ClassificationResult';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { animations } from '@/lib/theme';
import { ClassificationResult as ClassificationData } from '@/lib/roboflow';

export default function ClassifyPage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [classifying, setClassifying] = useState(false);
  const [result, setResult] = useState<ClassificationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUploaded = (url: string) => {
    setImageUrl(url);
    setResult(null);
    setError(null);
  };

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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-8">
      <motion.div {...animations.fadeIn} className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">AI Waste Classification</h1>
          </div>
          <p className="text-muted-foreground">
            Upload an image and let AI identify the waste type automatically
          </p>
        </div>

        {/* Main Content */}
        {!result ? (
          <div className="space-y-6">
            {/* Upload Section */}
            <ImageUpload onImageUploaded={handleImageUploaded} isLoading={classifying} />

            {/* Classify Button */}
            {imageUrl && !classifying && (
              <motion.div {...animations.slideUp}>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleClassify}
                  disabled={classifying}
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Classify Waste
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            )}

            {/* Classifying State */}
            {classifying && (
              <motion.div {...animations.scale}>
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center space-y-4">
                      <div className="relative mx-auto w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">Analyzing Image...</p>
                        <p className="text-sm text-muted-foreground">
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
                className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg"
              >
                {error}
              </motion.div>
            )}

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How It Works</CardTitle>
                <CardDescription>AI-powered waste detection in 3 steps</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Upload Image</p>
                      <p className="text-sm text-muted-foreground">
                        Take a clear photo of your waste items
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      2
                    </div>
                    <div>
                      <p className="font-medium">AI Analysis</p>
                      <p className="text-sm text-muted-foreground">
                        Our AI detects and categorizes waste items
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Get Results</p>
                      <p className="text-sm text-muted-foreground">
                        View classification and request pickup
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Classification Results */}
            <ClassificationResult result={result} />

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleReset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Classify Another
              </Button>
              <Button className="flex-1">
                <ArrowRight className="mr-2 h-4 w-4" />
                Request Pickup
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
