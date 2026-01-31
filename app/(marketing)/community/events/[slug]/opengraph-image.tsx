/**
 * Dynamic OG Image for Community Events
 *
 * Generates a social sharing image for each community event.
 */

import { ImageResponse } from 'next/og';

import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const alt = 'Car Event on AutoRev';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Fetch event data
  const { data: event } = await supabase
    .from('events')
    .select(
      `
      id,
      name,
      description,
      start_date,
      end_date,
      city,
      state,
      venue_name,
      event_type:event_types(name)
    `
    )
    .eq('slug', slug)
    .eq('status', 'approved')
    .single();

  // Format date for display
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const dateDisplay = event?.start_date ? formatDate(event.start_date) : '';
  const location = [event?.city, event?.state].filter(Boolean).join(', ');
  // event_type comes from a join and may be an object with name property
  const eventTypeData = event?.event_type as { name?: string } | null | undefined;
  const eventType = eventTypeData?.name || 'Car Event';

  return new ImageResponse(
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
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              color: '#10b981',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: '20px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            {eventType}
          </span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: event?.name && event.name.length > 40 ? '44px' : '52px',
            fontWeight: 700,
            color: '#ffffff',
            margin: '0 0 20px 0',
            lineHeight: 1.2,
            maxWidth: '900px',
          }}
        >
          {event?.name || 'Car Event'}
        </h1>

        {/* Date and Location */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginBottom: 'auto',
          }}
        >
          {dateDisplay && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span
                style={{
                  fontSize: '28px',
                  color: '#10b981',
                }}
              >
                📅
              </span>
              <span
                style={{
                  fontSize: '26px',
                  color: 'rgba(255, 255, 255, 0.9)',
                }}
              >
                {dateDisplay}
              </span>
            </div>
          )}

          {location && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span
                style={{
                  fontSize: '28px',
                  color: '#10b981',
                }}
              >
                📍
              </span>
              <span
                style={{
                  fontSize: '26px',
                  color: 'rgba(255, 255, 255, 0.9)',
                }}
              >
                {event?.venue_name ? `${event.venue_name}, ${location}` : location}
              </span>
            </div>
          )}
        </div>

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
              fontSize: '18px',
              color: 'rgba(255, 255, 255, 0.6)',
            }}
          >
            Discover car events near you
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
                color: '#10b981',
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
          background: 'linear-gradient(90deg, #10b981, #34d399)',
        }}
      />
    </div>,
    {
      ...size,
    }
  );
}
