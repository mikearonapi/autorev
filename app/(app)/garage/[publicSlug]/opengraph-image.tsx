/**
 * Dynamic OG Image for Public Garages
 * 
 * Generates a social sharing image for public garage pages.
 */

import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const alt = 'Garage on AutoRev';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function Image({ params }: { params: Promise<{ publicSlug: string }> }) {
  const { publicSlug } = await params;

  // Fetch profile data (include id for vehicle count query)
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, display_name, bio, tier, avatar_url')
    .eq('public_slug', publicSlug)
    .eq('is_garage_public', true)
    .single();

  // Fetch vehicle count
  let vehicleCount = 0;
  if (profile?.id) {
    const { count } = await supabase
      .from('user_vehicles')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('ownership_status', 'owned');
    vehicleCount = count || 0;
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
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px',
            flex: 1,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '60px',
              background: 'linear-gradient(135deg, #e94560, #ff6b6b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
              fontSize: '48px',
              fontWeight: 700,
              color: '#ffffff',
              border: '4px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {profile?.display_name?.charAt(0).toUpperCase() || '?'}
          </div>

          {/* Display Name */}
          <h1
            style={{
              fontSize: '48px',
              fontWeight: 700,
              color: '#ffffff',
              margin: '0 0 8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            {profile?.display_name || 'AutoRev User'}
            {profile?.tier && profile.tier !== 'free' && (
              <span
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'rgba(233, 69, 96, 0.2)',
                  color: '#e94560',
                  fontSize: '18px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  textTransform: 'uppercase',
                }}
              >
                {profile.tier}
              </span>
            )}
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '24px',
              color: 'rgba(255, 255, 255, 0.7)',
              margin: '0 0 32px 0',
            }}
          >
            {vehicleCount} vehicle{vehicleCount !== 1 ? 's' : ''} in garage
          </p>

          {/* Bio */}
          {profile?.bio && (
            <p
              style={{
                fontSize: '20px',
                color: 'rgba(255, 255, 255, 0.6)',
                margin: '0',
                textAlign: 'center',
                maxWidth: '700px',
                lineHeight: 1.4,
              }}
            >
              {profile.bio.length > 120 ? `${profile.bio.slice(0, 120)}...` : profile.bio}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            gap: '12px',
          }}
        >
          <span
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#ffffff',
            }}
          >
            Auto
          </span>
          <span
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#e94560',
            }}
          >
            Rev
          </span>
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

