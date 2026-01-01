import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

export const alt = 'AutoRev - Find Your Perfect Sports Car';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';
export const revalidate = 3600; // Revalidate every hour

// Brand Colors
const BRAND = {
  primary: '#1a4d6e',
  primaryLight: '#2a6d94',
  primaryDark: '#0f3347',
  gold: '#D4AF37',
  goldLight: '#E6C54A',
  goldDark: '#B8973A',
};

export default async function Image() {
  // Read images from filesystem
  const heroImageData = readFileSync(join(process.cwd(), 'public/images/onboarding/car-selector-02-results.png'));
  const heroImageBase64 = heroImageData.toString('base64');

  const logoData = readFileSync(join(process.cwd(), 'public/images/autorev-logo-white.png'));
  const logoBase64 = logoData.toString('base64');

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: `linear-gradient(135deg, ${BRAND.primaryDark} 0%, ${BRAND.primary} 50%, ${BRAND.primaryLight} 100%)`,
        }}
      >
        {/* Grid pattern overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)`,
            backgroundSize: '32px 32px',
            display: 'flex',
          }}
        />

        {/* Left accent stripe */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '6px',
            height: '100%',
            background: `linear-gradient(180deg, ${BRAND.gold} 0%, ${BRAND.goldLight} 50%, ${BRAND.goldDark} 100%)`,
            display: 'flex',
          }}
        />

        {/* Logo in top left */}
        <div
          style={{
            position: 'absolute',
            top: '36px',
            left: '36px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <img
            src={`data:image/png;base64,${logoBase64}`}
            alt=""
            style={{
              width: '48px',
              height: '48px',
              objectFit: 'contain',
            }}
          />
          <span
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.5px',
            }}
          >
            AutoRev
          </span>
        </div>

        {/* Main content - two column layout */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '100%',
            padding: '80px 60px 60px 60px',
          }}
        >
          {/* Left side - text content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              maxWidth: '550px',
              gap: '24px',
            }}
          >
            {/* Feature badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: `rgba(212,175,55,0.2)`,
                border: `2px solid ${BRAND.gold}`,
                borderRadius: '50px',
                padding: '8px 18px',
                width: 'fit-content',
              }}
            >
              <span style={{ color: BRAND.goldLight, fontSize: '16px', fontWeight: 600 }}>
                🎯 Car Selector Tool
              </span>
            </div>

            {/* Main headline */}
            <h1
              style={{
                fontSize: '56px',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.1,
                margin: 0,
                letterSpacing: '-2px',
              }}
            >
              Find Your{' '}
              <span style={{ color: BRAND.gold }}>Perfect</span>
              <br />
              Sports Car
            </h1>

            {/* Subheadline */}
            <p
              style={{
                fontSize: '22px',
                color: 'rgba(255,255,255,0.85)',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Set your priorities — sound, track, reliability, comfort, value — and get matched with cars that fit YOU.
            </p>

            {/* Stats */}
            <div
              style={{
                display: 'flex',
                gap: '32px',
                marginTop: '8px',
              }}
            >
              {[
                { value: '2,500+', label: 'Cars' },
                { value: '7', label: 'Priority Categories' },
                { value: '2 min', label: 'To Complete' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <span style={{ color: BRAND.goldLight, fontSize: '28px', fontWeight: 700 }}>
                    {stat.value}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - phone mockup */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {/* Phone frame */}
            <div
              style={{
                width: '280px',
                height: '520px',
                borderRadius: '36px',
                background: '#000000',
                padding: '12px',
                boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
                display: 'flex',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Screen content */}
              <img
                src={`data:image/png;base64,${heroImageBase64}`}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '28px',
                  objectFit: 'cover',
                  objectPosition: 'top',
                }}
              />
              {/* Notch */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '100px',
                  height: '28px',
                  background: '#000000',
                  borderRadius: '20px',
                  display: 'flex',
                }}
              />
            </div>
          </div>
        </div>

        {/* Domain in bottom right */}
        <div
          style={{
            position: 'absolute',
            bottom: '28px',
            right: '40px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '18px',
              fontWeight: 600,
            }}
          >
            autorev.app/landing/find-your-car
          </span>
        </div>

        {/* Bottom accent bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${BRAND.goldDark}, ${BRAND.gold}, ${BRAND.goldLight}, ${BRAND.gold}, ${BRAND.goldDark})`,
            display: 'flex',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}

