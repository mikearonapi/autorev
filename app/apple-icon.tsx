import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

/**
 * Apple Touch Icon - AUTOREV wordmark style
 * Navy background with white "AUTO" and lime "REV"
 * Used for iOS home screen and Safari bookmarks
 */
export default async function AppleIcon() {
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
          borderRadius: '27px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontWeight: 700,
          fontSize: '32px',
          letterSpacing: '-0.5px',
        }}
      >
        <span style={{ color: '#ffffff' }}>AUTO</span>
        <span style={{ color: '#d4ff00' }}>REV</span>
      </div>
    ),
    {
      ...size,
    }
  );
}
