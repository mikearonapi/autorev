import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

// Using Node.js runtime for filesystem access
export const alt = 'AutoRev - Expert Automotive Articles & Reviews';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Revalidate daily
export const revalidate = 86400;

// Brand Colors
const BRAND = {
  primary: '#1a4d6e',
  primaryLight: '#2a6d94',
  primaryDark: '#0f3347',
  gold: '#D4AF37',
  goldLight: '#E6C54A',
  goldDark: '#B8973A',
};

/**
 * Open Graph Image for Articles section
 * Optimized for Facebook, Facebook Groups, and Twitter sharing
 */
export default async function Image() {
  // Read logo from filesystem
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
        {/* Subtle pattern overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `radial-gradient(circle at 20% 30%, rgba(212,175,55,0.1) 0%, transparent 50%),
                              radial-gradient(circle at 80% 70%, rgba(212,175,55,0.1) 0%, transparent 50%)`,
            display: 'flex',
          }}
        />

        {/* Left accent stripe - gold gradient */}
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
              width: '56px',
              height: '56px',
              objectFit: 'contain',
            }}
          />
          <span
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.5px',
            }}
          >
            AutoRev
          </span>
        </div>

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
            padding: '80px',
            paddingTop: '120px',
          }}
        >
          {/* Articles badge */}
          <div
            style={{
              padding: '12px 28px',
              background: `rgba(212,175,55,0.2)`,
              borderRadius: '50px',
              border: `2px solid ${BRAND.gold}`,
              color: BRAND.goldLight,
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '24px',
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}
          >
            Expert Articles
          </div>

          {/* Main headline */}
          <h1
            style={{
              fontSize: '64px',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.1,
              margin: 0,
              textAlign: 'center',
              letterSpacing: '-2px',
              maxWidth: '900px',
            }}
          >
            Automotive Knowledge for{' '}
            <span style={{ color: BRAND.gold }}>Enthusiasts</span>
          </h1>

          {/* Subheadline */}
          <p
            style={{
              fontSize: '24px',
              color: 'rgba(255,255,255,0.85)',
              margin: '24px 0 0 0',
              textAlign: 'center',
              maxWidth: '700px',
            }}
          >
            Comparisons, Buyer Guides, Technical Deep-Dives & Car Culture
          </p>

          {/* Category pills */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginTop: '32px',
            }}
          >
            {[
              '⚖️ Comparisons',
              '🏁 Enthusiast',
              '🔧 Technical',
            ].map((cat) => (
              <div
                key={cat}
                style={{
                  padding: '10px 20px',
                  background: `rgba(255,255,255,0.1)`,
                  borderRadius: '50px',
                  border: '1.5px solid rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: 500,
                }}
              >
                {cat}
              </div>
            ))}
          </div>
        </div>

        {/* Domain in bottom right */}
        <div
          style={{
            position: 'absolute',
            bottom: '36px',
            right: '40px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: '20px',
              fontWeight: 600,
            }}
          >
            autorev.app/articles
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

