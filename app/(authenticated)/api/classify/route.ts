import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { classifyWaste } from '@/lib/roboflow';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(imageUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
    }

    // Classify waste using Roboflow
    const result = await classifyWaste(imageUrl);

    return NextResponse.json({
      success: true,
      classification: result,
    });
  } catch (error: any) {
    console.error('Classification error:', error);
    
    if (error.message === 'No waste items detected in the image') {
      return NextResponse.json(
        { error: 'No waste items detected in the image. Please upload a clearer image.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to classify waste. Please try again.' },
      { status: 500 }
    );
  }
}
