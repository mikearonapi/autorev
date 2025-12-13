import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'AutoRev - Find Your Perfect Sports Car';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

/**
 * Twitter Card Image for social sharing
 * Used when sharing links on Twitter/X
 */
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a1628 0%, #1a3a52 50%, #0f3460 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative elements */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(233,69,96,0.15) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        {/* Racing stripe accent */}
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '8px',
            height: '100%',
            background: 'linear-gradient(180deg, #e94560 0%, #ff6b6b 100%)',
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
            textAlign: 'center',
          }}
        >
          {/* Logo with div-based icon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '30px',
            }}
          >
            {/* AutoRev Logo Icon - Div-based */}
            <div
              style={{
                width: '70px',
                height: '70px',
                background: 'linear-gradient(135deg, #0a1628 0%, #1a3a52 100%)',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '18px',
                border: '2px solid rgba(255,255,255,0.3)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Speedometer arc */}
              <div
                style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  border: '4px solid rgba(255,255,255,0.7)',
                  borderRightColor: 'transparent',
                  borderBottomColor: 'transparent',
                }}
              />
              
              {/* Letter A */}
              <span
                style={{
                  fontSize: '36px',
                  fontWeight: 900,
                  fontFamily: 'Arial Black, Arial, sans-serif',
                  color: '#ffffff',
                  marginTop: '4px',
                }}
              >
                A
              </span>
              
              {/* Red accent */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '14px',
                  width: '8px',
                  height: '18px',
                  background: '#e94560',
                  borderRadius: '4px',
                  transform: 'rotate(35deg)',
                }}
              />
              
              {/* Orange needle */}
              <div
                style={{
                  position: 'absolute',
                  top: '32px',
                  right: '6px',
                  width: '18px',
                  height: '5px',
                  background: 'linear-gradient(90deg, #f5a623, #ff6b6b)',
                  borderRadius: '2px',
                  transform: 'rotate(-10deg)',
                }}
              />
            </div>
            <span
              style={{
                fontSize: '42px',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.5px',
              }}
            >
              AutoRev
            </span>
          </div>

          {/* Main headline */}
          <h1
            style={{
              fontSize: '72px',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.1,
              margin: '0 0 24px 0',
              textShadow: '0 4px 20px rgba(0,0,0,0.3)',
              letterSpacing: '-2px',
            }}
          >
            Find What Drives You
          </h1>

          {/* Subheadline */}
          <p
            style={{
              fontSize: '28px',
              color: 'rgba(255,255,255,0.85)',
              margin: '0 0 40px 0',
              maxWidth: '800px',
              lineHeight: 1.4,
            }}
          >
            Find your perfect sports car • Compare 100+ vehicles • Plan your build
          </p>

          {/* Feature badges */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
            }}
          >
            {['$25K - $300K', 'Car Selector', 'Performance Hub'].map((badge) => (
              <div
                key={badge}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '50px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  fontSize: '18px',
                  fontWeight: 600,
                }}
              >
                {badge}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom accent bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #e94560, #ff6b6b, #ffa502, #ff6b6b, #e94560)',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
