/* eslint-disable @next/next/no-img-element */
import { readFileSync } from 'fs';
import { join } from 'path';

import { ImageResponse } from 'next/og';

// Using Node.js runtime for filesystem access
export const alt = 'AutoRev Article';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Revalidate every hour
export const revalidate = 3600;

// Brand Colors
const BRAND = {
  primary: '#1a4d6e',
  primaryLight: '#2a6d94',
  primaryDark: '#0f3347',
  gold: '#D4AF37',
  goldLight: '#E6C54A',
  goldDark: '#B8973A',
};

// Category display names
const CATEGORY_NAMES: Record<string, string> = {
  comparisons: 'Comparisons',
  enthusiast: 'Enthusiast',
  technical: 'Technical',
  pitlane: 'Pit Lane',
};

interface Props {
  params: Promise<{ category: string; slug: string }>;
}

/**
 * Dynamic Open Graph Image for individual articles
 * Optimized for Facebook, Facebook Groups, and Twitter sharing
 *
 * This generates a branded OG image with the article title and category
 * Facebook prefers 1200x630 images with clear text
 */
export default async function Image({ params }: Props) {
  const { category, slug } = await params;

  // Read logo from filesystem
  const logoData = readFileSync(join(process.cwd(), 'public/images/autorev-logo-white.png'));
  const logoBase64 = logoData.toString('base64');

  // Fetch article data
  let articleTitle = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  let heroImageUrl: string | null = null;

  try {
    // Dynamically import supabase to avoid build issues
    const supabaseModule = await import('@/lib/supabase');
    const supabase = supabaseModule.supabase as
      | import('@supabase/supabase-js').SupabaseClient
      | null;
    const isSupabaseConfigured = supabaseModule.isSupabaseConfigured;

    if (isSupabaseConfigured && supabase) {
      const { data: article } = await supabase
        .from('al_articles')
        .select('title, seo_title, hero_image_url')
        .eq('slug', slug)
        .eq('category', category)
        .single();

      if (article) {
        articleTitle = article.seo_title || article.title;
        heroImageUrl = article.hero_image_url;
      }
    }
  } catch (err) {
    console.error('[OG Image] Error fetching article:', err);
  }

  const categoryName = CATEGORY_NAMES[category] || category;

  // If we have a hero image, use it as background
  if (heroImageUrl) {
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
        }}
      >
        {/* Hero image background */}
        <img
          src={heroImageUrl}
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

        {/* Gradient overlay for text readability */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(180deg, 
                rgba(15,51,71,0.3) 0%, 
                rgba(15,51,71,0.1) 30%,
                rgba(15,51,71,0.3) 60%,
                rgba(15,51,71,0.95) 100%)`,
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
            top: '32px',
            left: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
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
              textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}
          >
            AutoRev
          </span>
        </div>

        {/* Category badge */}
        <div
          style={{
            position: 'absolute',
            top: '32px',
            right: '32px',
            padding: '10px 20px',
            background: `rgba(212,175,55,0.25)`,
            borderRadius: '50px',
            border: `2px solid ${BRAND.gold}`,
            color: BRAND.goldLight,
            fontSize: '16px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          {categoryName}
        </div>

        {/* Article title at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '48px',
            left: '40px',
            right: '40px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <h1
            style={{
              fontSize: articleTitle.length > 60 ? '40px' : '48px',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.15,
              margin: 0,
              textShadow: '0 4px 16px rgba(0,0,0,0.6)',
              letterSpacing: '-1px',
              maxWidth: '900px',
            }}
          >
            {articleTitle}
          </h1>

          <p
            style={{
              fontSize: '18px',
              color: 'rgba(255,255,255,0.9)',
              margin: 0,
              textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}
          >
            autorev.app/articles
          </p>
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
      </div>,
      {
        ...size,
      }
    );
  }

  // Fallback: no hero image - use branded gradient background
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
          backgroundImage: `radial-gradient(circle at 20% 30%, rgba(212,175,55,0.15) 0%, transparent 50%),
                              radial-gradient(circle at 80% 70%, rgba(212,175,55,0.1) 0%, transparent 50%)`,
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
          top: '32px',
          left: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
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

      {/* Category badge */}
      <div
        style={{
          position: 'absolute',
          top: '32px',
          right: '32px',
          padding: '10px 20px',
          background: `rgba(212,175,55,0.2)`,
          borderRadius: '50px',
          border: `2px solid ${BRAND.gold}`,
          color: BRAND.goldLight,
          fontSize: '16px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}
      >
        {categoryName}
      </div>

      {/* Main content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          flex: 1,
          padding: '80px 48px',
          paddingTop: '120px',
        }}
      >
        <h1
          style={{
            fontSize: articleTitle.length > 60 ? '44px' : '52px',
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.15,
            margin: 0,
            letterSpacing: '-1.5px',
            maxWidth: '950px',
          }}
        >
          {articleTitle}
        </h1>
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
            fontSize: '18px',
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
    </div>,
    {
      ...size,
    }
  );
}
