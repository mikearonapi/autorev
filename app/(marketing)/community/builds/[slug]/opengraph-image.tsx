/**
 * Dynamic OG Image for Community Builds
 * 
 * Generates a social sharing image for each community build post.
 */

import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const alt = 'Community Build on AutoRev';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Fetch post data
  const { data: post } = await supabase
    .from('community_posts')
    .select(`
      id,
      title,
      car_name,
      description,
      user_id
    `)
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  // Fetch author
  let authorName = 'AutoRev User';
  if (post?.user_id) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('display_name')
      .eq('id', post.user_id)
      .single();
    authorName = profile?.display_name || authorName;
  }

  // Fetch primary image using post ID (not slug)
  let imageUrl = null;
  if (post?.id) {
    const { data: images } = await supabase
      .from('user_uploaded_images')
      .select('blob_url')
      .eq('community_post_id', post.id)
      .eq('is_primary', true)
      .limit(1);
    
    if (images && images.length > 0) {
      imageUrl = images[0].blob_url;
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0a0a0f',
          position: 'relative',
        }}
      >
        {/* Background gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '60px',
            flex: 1,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <span
              style={{
                padding: '8px 16px',
                backgroundColor: 'rgba(233, 69, 96, 0.2)',
                color: '#e94560',
                fontSize: '16px',
                fontWeight: 600,
                borderRadius: '20px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Community Build
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: post?.title && post.title.length > 40 ? '48px' : '56px',
              fontWeight: 700,
              color: '#ffffff',
              margin: '0 0 16px 0',
              lineHeight: 1.2,
              maxWidth: '900px',
            }}
          >
            {post?.title || 'Community Build'}
          </h1>

          {/* Car name */}
          {post?.car_name && (
            <p
              style={{
                fontSize: '28px',
                color: '#e94560',
                margin: '0 0 auto 0',
              }}
            >
              {post.car_name}
            </p>
          )}

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 'auto',
            }}
          >
            <span
              style={{
                fontSize: '20px',
                color: 'rgba(255, 255, 255, 0.7)',
              }}
            >
              by {authorName}
            </span>

            {/* AutoRev Logo */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span
                style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: '#ffffff',
                }}
              >
                Auto
              </span>
              <span
                style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: '#e94560',
                }}
              >
                Rev
              </span>
            </div>
          </div>
        </div>

        {/* Accent line at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #e94560, #ff6b6b)',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}

