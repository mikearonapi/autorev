import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

/**
 * Favicon - AUTOREV wordmark style
 * Navy background with white "A" and lime "R" for small sizes
 */
export default async function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d1b2a',
          borderRadius: '6px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontWeight: 700,
          fontSize: '18px',
          letterSpacing: '-1px',
        }}
      >
        <span style={{ color: '#ffffff' }}>A</span>
        <span style={{ color: '#d4ff00' }}>R</span>
      </div>
    ),
    {
      ...size,
    }
  );
}
