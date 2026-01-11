/**
 * API Route: GET /api/builds/[buildId]/images
 * 
 * Fetches images associated with a user build.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { withErrorLogging } from '@/lib/serverErrorLogger';

async function handleGet(request, { params }) {
  const { buildId } = await params;
    
    if (!buildId) {
      return NextResponse.json({ error: 'Build ID required' }, { status: 400 });
    }
    
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (error) {
              // Ignore errors when called from server component
            }
          },
        },
      }
    );
    
    // Fetch images for this build
    const { data: images, error } = await supabase
      .from('user_uploaded_images')
      .select('id, blob_url, thumbnail_url, caption, is_primary, display_order, width, height')
      .eq('user_build_id', buildId)
      .order('is_primary', { ascending: false })
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('[API/builds/images] Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
    }
    
    return NextResponse.json({ images: images || [] });
}

export const GET = withErrorLogging(handleGet, { route: 'builds/images', feature: 'tuning-shop' });
