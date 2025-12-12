import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'AutoRev - Find Your Perfect Sports Car';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

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
          background: 'linear-gradient(135deg, #0a1628 0%, #1a4d6e 50%, #0f3460 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative racing stripes */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
          }}
        >
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
          <div
            style={{
              position: 'absolute',
              bottom: '-150px',
              left: '-100px',
              width: '600px',
              height: '600px',
              background: 'radial-gradient(circle, rgba(26,77,110,0.3) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />
        </div>

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
            zIndex: 10,
          }}
        >
          {/* Logo/Brand */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '30px',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #e94560, #ff6b6b)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '16px',
                fontSize: '32px',
              }}
            >
              🏎️
            </div>
            <span
              style={{
                fontSize: '36px',
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
            Find your perfect sports car • Compare ~100 vehicles • Plan your build
          </p>

          {/* Feature badges */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
            }}
          >
            {['$25K - $100K', 'Car Selector', 'Performance HUB', 'Expert Advice'].map((badge) => (
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

        {/* Domain */}
        <div
          style={{
            position: 'absolute',
            bottom: '30px',
            right: '40px',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '20px',
            fontWeight: 500,
          }}
        >
          autorev.app
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

