import { put } from '@vercel/blob';
import { errors } from '@/lib/apiErrors';
import { NextResponse } from 'next/server';

/**
 * Feedback Screenshot Upload API
 * 
 * Accepts a base64-encoded screenshot from the feedback widget,
 * uploads it to Vercel Blob storage, and returns the public URL.
 * 
 * This endpoint is used before feedback submission to upload the
 * screenshot, then the returned URL is included in the feedback payload.
 */

// Route Segment Config (App Router)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // 30 second timeout for upload

export async function POST(request) {
  try {
    const body = await request.json();
    const { screenshot, metadata = {} } = body;

    if (!screenshot) {
      return NextResponse.json(
        { success: false, error: 'screenshot is required' },
        { status: 400 }
      );
    }

    // Validate base64 image format
    const base64Match = screenshot.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/);
    if (!base64Match) {
      return NextResponse.json(
        { success: false, error: 'Invalid screenshot format. Expected base64 image.' },
        { status: 400 }
      );
    }

    const imageFormat = base64Match[1];
    const base64Data = base64Match[2];
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Validate file size (max 5MB for screenshots)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (buffer.length > maxSize) {
      return NextResponse.json(
        { success: false, error: 'Screenshot too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const filename = `feedback-screenshots/${timestamp}-${randomSuffix}.${imageFormat}`;
    
    // Content type mapping
    const contentTypeMap = {
      png: 'image/png',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
    };

    // Upload to Vercel Blob
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: contentTypeMap[imageFormat] || 'image/png',
      addRandomSuffix: false,
    });

    console.log(`[Feedback Screenshot] Uploaded: ${blob.url} (${buffer.length} bytes)`);

    return NextResponse.json({
      success: true,
      data: {
        url: blob.url,
        pathname: blob.pathname,
        contentType: blob.contentType,
        size: buffer.length,
        metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString(),
          originalFormat: imageFormat,
        },
      },
    });
  } catch (err) {
    console.error('[Feedback Screenshot] Upload error:', err);
    
    // Check for specific Vercel Blob errors
    if (err.message?.includes('BLOB_READ_WRITE_TOKEN')) {
      return NextResponse.json(
        { success: false, error: 'Screenshot storage not configured.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to upload screenshot. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * Health check / capabilities endpoint
 */
export async function GET() {
  // Check if blob storage is configured
  const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;
  
  return NextResponse.json({
    enabled: hasBlobToken,
    maxSizeMB: 5,
    supportedFormats: ['png', 'jpeg', 'webp'],
  });
}

