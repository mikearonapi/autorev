import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

/**
 * Apple Touch Icon - Uses the actual AutoRev logo image
 * Used for iOS home screen and Safari bookmarks
 */
export default async function AppleIcon() {
  // Fetch the actual logo image
  const logoData = await fetch(
    new URL('../public/images/autorev-logo-trimmed.png', import.meta.url)
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          borderRadius: '40px',
        }}
      >
        <img
          src={`data:image/png;base64,${Buffer.from(logoData).toString('base64')}`}
          width={150}
          height={150}
          style={{
            objectFit: 'contain',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
