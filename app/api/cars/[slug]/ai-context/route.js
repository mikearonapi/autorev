/**
 * Car AI Context API Route
 * 
 * Returns enriched AI context for a specific car.
 * Used by the AI Mechanic chat prefetch to get comprehensive car data in one call.
 * 
 * @route GET /api/cars/[slug]/ai-context
 */

import { NextResponse } from 'next/server';
import { getCarAIContext } from '@/lib/alTools';

export async function GET(request, { params }) {
  const { slug } = await params;
  
  if (!slug) {
    return NextResponse.json(
      { error: 'Car slug is required', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }
  
  try {
    // Use the existing AL Tools function to get context
    const context = await getCarAIContext({ car_slug: slug });
    
    // Check if there was an error
    if (context.error) {
      // If it's just "not found", return 404
      if (context.error.includes('not found') || context.error.includes('no data')) {
        return NextResponse.json(
          { error: 'Car not found', code: 'NOT_FOUND', car_slug: slug },
          { status: 404 }
        );
      }
      // For other errors, return 500
      return NextResponse.json(
        { error: context.error, code: 'SERVER_ERROR', car_slug: slug },
        { status: 500 }
      );
    }
    
    // Return the context data
    return NextResponse.json(context);
    
  } catch (err) {
    console.error('[API/ai-context] Error fetching AI context:', err);
    return NextResponse.json(
      { error: 'Failed to fetch AI context', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

