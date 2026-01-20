import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

export const alt = 'AutoRev Tuning Shop - Plan Your Perfect Build';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';
export const revalidate = 3600;

// AutoRev Brand Colors - see /docs/BRAND_GUIDELINES.md
const BRAND = {
  primary: '#0d1b2a',      // Navy background
  secondary: '#1b263b',     // Elevated background
  accent: '#d4ff00',        // Lime - primary emphasis
  accentLight: '#e4ff4d',
  accentDark: '#bfe600',
  teal: '#10b981',          // Teal - improvements/gains
  gold: '#d4a84b',          // Gold - labels/secondary
};

export default async function Image() {
  const heroImageData = readFileSync(join(process.cwd(), 'public/images/onboarding/tuning-shop-04-power-list.png'));
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
          background: BRAND.primary,
        }}
      >

        {/* Left accent stripe - Performance orange */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '6px',
            height: '100%',
            background: `linear-gradient(180deg, ${BRAND.accent} 0%, ${BRAND.accentLight} 50%, ${BRAND.accentDark} 100%)`,
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
            {/* Feature badge wrapper */}
            <div style={{ display: 'flex' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(212,255,0,0.2)',
                  border: `2px solid ${BRAND.accent}`,
                  borderRadius: '50px',
                  padding: '8px 18px',
                }}
              >
                <span style={{ color: BRAND.accentLight, fontSize: '16px', fontWeight: 600 }}>
                  🔧 Build Planner
                </span>
              </div>
            </div>

            {/* Main headline */}
            <h1
              style={{
                fontSize: '54px',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.1,
                margin: 0,
                letterSpacing: '-2px',
              }}
            >
              Plan Your{' '}
              <span style={{ color: BRAND.accent }}>Perfect Build</span>
            </h1>

            {/* Subheadline */}
            <p
              style={{
                fontSize: '21px',
                color: 'rgba(255,255,255,0.85)',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Configure upgrades, see estimated power gains, track costs, and plan your complete build — before spending a dollar.
            </p>

            {/* Stats row */}
            <div
              style={{
                display: 'flex',
                gap: '28px',
                marginTop: '8px',
              }}
            >
              {[
                { icon: '⚡', label: 'HP Estimates' },
                { icon: '💰', label: 'Cost Tracking' },
                { icon: '💾', label: 'Save Builds' },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    background: `rgba(255,255,255,0.08)`,
                    borderRadius: '50px',
                    border: '1.5px solid rgba(255,255,255,0.2)',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{item.icon}</span>
                  <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: 600 }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Mod categories */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginTop: '4px',
              }}
            >
              {['Intake', 'Exhaust', 'Tune', 'Suspension', 'Wheels', 'Brakes'].map((mod) => (
                <span
                  key={mod}
                  style={{
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '13px',
                    fontWeight: 500,
                    padding: '4px 10px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '4px',
                  }}
                >
                  {mod}
                </span>
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
            autorev.app/tuning-shop
          </span>
        </div>

        {/* Bottom accent bar - Performance orange */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${BRAND.accentDark}, ${BRAND.accent}, ${BRAND.accentLight}, ${BRAND.accent}, ${BRAND.accentDark})`,
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
