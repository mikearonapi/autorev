import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Using Node.js runtime to avoid Edge Function size limit (images exceed 2MB)
export const alt = 'AutoRev - AI-Powered Sports Car Research';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Revalidate every 5 minutes to pick up new car counts
export const revalidate = 300;

// Brand Colors (from globals.css)
const BRAND = {
  primary: '#1a4d6e',
  primaryLight: '#2a6d94',
  primaryDark: '#0f3347',
  gold: '#D4AF37',
  goldLight: '#E6C54A',
  goldDark: '#B8973A',
};

// Fetch car count from database
async function getCarCount(): Promise<number> {
  try {
    if (!isSupabaseConfigured || !supabase) {
      return 188; // Fallback if Supabase not configured
    }
    
    const { count, error } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('[Twitter Image] Error fetching car count:', error);
      return 188;
    }
    
    return count || 188;
  } catch (err) {
    console.error('[Twitter Image] Error in getCarCount:', err);
    return 188;
  }
}

/**
 * Twitter Card Image for social sharing
 * Features the dramatic hero car image with branded overlay
 * Brand-aligned: teal primary + gold accent
 */
export default async function Image() {
  // Fetch car count dynamically
  const carCount = await getCarCount();
  
  // Read images from filesystem (Node.js runtime)
  const heroImageData = readFileSync(join(process.cwd(), 'public/images/pages/home-hero.jpg'));
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
        }}
      >
        {/* Background car image */}
        <img
          src={`data:image/jpeg;base64,${heroImageBase64}`}
          alt=""
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Lighter gradient overlay - mostly transparent, just enough for text readability */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(135deg, rgba(15,51,71,0.7) 0%, rgba(26,77,110,0.3) 30%, transparent 50%, rgba(15,51,71,0.4) 100%)`,
            display: 'flex',
          }}
        />

        {/* Bottom fade for text area - keeps text readable */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '280px',
            background: `linear-gradient(to top, rgba(15,51,71,0.95) 0%, rgba(15,51,71,0.7) 40%, transparent 100%)`,
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
              textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            }}
          >
            AutoRev
          </span>
        </div>

        {/* Main content area - bottom left */}
        <div
          style={{
            position: 'absolute',
            bottom: '44px',
            left: '40px',
            right: '40px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {/* Main headline with space between What and Drives */}
          <h1
            style={{
              fontSize: '72px',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.0,
              margin: 0,
              textShadow: '0 4px 24px rgba(0,0,0,0.6)',
              letterSpacing: '-2px',
            }}
          >
            Find What{' '}
            <span style={{ color: BRAND.gold, marginLeft: '8px' }}>Drives You</span>
          </h1>

          {/* Subheadline - value proposition */}
          <p
            style={{
              fontSize: '26px',
              color: 'rgba(255,255,255,0.9)',
              margin: 0,
              textShadow: '0 2px 12px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <span>{carCount} Sports Cars</span>
            <span style={{ color: BRAND.gold, fontSize: '18px' }}>•</span>
            <span>$25K – $300K</span>
            <span style={{ color: BRAND.gold, fontSize: '18px' }}>•</span>
            <span>Miatas to GT3s</span>
          </p>

          {/* Feature pills - actual site features */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              marginTop: '10px',
            }}
          >
            {[
              { label: 'Meet AL — Your AI Car Expert', highlight: true },
              { label: 'Research', highlight: false },
              { label: 'My Garage', highlight: false },
              { label: 'Tuning Shop', highlight: false },
            ].map((feature) => (
              <div
                key={feature.label}
                style={{
                  padding: '10px 18px',
                  background: feature.highlight 
                    ? `rgba(212,175,55,0.25)` 
                    : `rgba(255,255,255,0.08)`,
                  borderRadius: '50px',
                  border: feature.highlight 
                    ? `2px solid ${BRAND.gold}` 
                    : '1.5px solid rgba(255,255,255,0.2)',
                  color: feature.highlight ? BRAND.goldLight : '#ffffff',
                  fontSize: '15px',
                  fontWeight: 600,
                }}
              >
                {feature.label}
              </div>
            ))}
          </div>
        </div>

        {/* Domain in bottom right - clean, no dot */}
        <div
          style={{
            position: 'absolute',
            bottom: '48px',
            right: '40px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: '22px',
              fontWeight: 600,
              textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}
          >
            autorev.app
          </span>
        </div>

        {/* Bottom accent bar - gold gradient */}
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
