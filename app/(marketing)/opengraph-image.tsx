/* eslint-disable @next/next/no-img-element */
import { readFileSync } from 'fs';
import { join } from 'path';

import { ImageResponse } from 'next/og';

import type { SupabaseClient } from '@supabase/supabase-js';

// Import supabase lazily to avoid type inference issues
let supabase: SupabaseClient | null = null;
let isSupabaseConfigured = false;

async function getSupabase() {
  if (supabase === null) {
    const supabaseModule = await import('@/lib/supabase');
    supabase = supabaseModule.supabase as SupabaseClient | null;
    isSupabaseConfigured = supabaseModule.isSupabaseConfigured;
  }
  return { supabase, isSupabaseConfigured };
}

// Using Node.js runtime to avoid Edge Function size limit (images exceed 2MB)
export const alt = 'AutoRev - Plan Your Perfect Build';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Revalidate every 5 minutes to pick up new car counts
export const revalidate = 300;

// AutoRev Brand Colors - see /docs/BRAND_GUIDELINES.md
const BRAND = {
  primary: '#0d1b2a', // Navy background
  secondary: '#1b263b', // Elevated background
  accent: '#d4ff00', // Lime - primary emphasis
  accentLight: '#e4ff4d',
  accentDark: '#bfe600',
  teal: '#10b981', // Teal - improvements/gains
  gold: '#d4a84b', // Gold - labels/secondary
  text: '#ffffff',
  textSecondary: '#94a3b8',
};

// Fetch car count from database
async function getCarCount(): Promise<number> {
  try {
    const { supabase: sb, isSupabaseConfigured: configured } = await getSupabase();

    if (!configured || !sb) {
      return 188; // Fallback if Supabase not configured
    }

    const { count, error } = await sb.from('cars').select('*', { count: 'exact', head: true });

    if (error) {
      console.error('[OG Image] Error fetching car count:', error);
      return 188;
    }

    return count || 188;
  } catch (err) {
    console.error('[OG Image] Error in getCarCount:', err);
    return 188;
  }
}

/**
 * Open Graph Image for social sharing
 * AutoRev: Premium dark theme with lime accent
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
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: BRAND.primary,
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
          opacity: 0.4,
        }}
      />

      {/* Dark gradient overlay for Build-focused aesthetic */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.7) 40%, rgba(10,10,10,0.8) 100%)`,
          display: 'flex',
        }}
      />

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
        {/* Main headline - Build focused */}
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
          Plan Your <span style={{ color: BRAND.accent }}>Perfect Build</span>
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
          <span style={{ color: BRAND.accent, fontSize: '18px' }}>•</span>
          <span>500+ Verified Parts</span>
          <span style={{ color: BRAND.accent, fontSize: '18px' }}>•</span>
          <span>Real Dyno Data</span>
        </p>

        {/* Feature pills - Build focused */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginTop: '10px',
          }}
        >
          {[
            { label: 'Build Planner', highlight: true },
            { label: 'Parts Database', highlight: false },
            { label: 'Cost Tracker', highlight: false },
            { label: 'Community Builds', highlight: false },
          ].map((feature) => (
            <div
              key={feature.label}
              style={{
                padding: '10px 18px',
                background: feature.highlight ? `rgba(212,255,0,0.2)` : `rgba(255,255,255,0.08)`,
                borderRadius: '50px',
                border: feature.highlight
                  ? `2px solid ${BRAND.accent}`
                  : '1.5px solid rgba(255,255,255,0.2)',
                color: feature.highlight ? BRAND.accentLight : '#ffffff',
                fontSize: '15px',
                fontWeight: 600,
              }}
            >
              {feature.label}
            </div>
          ))}
        </div>
      </div>

      {/* Domain in bottom right */}
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

      {/* Bottom accent bar - Performance orange gradient */}
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
    </div>,
    {
      ...size,
    }
  );
}
