import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

/**
 * Favicon - Uses the actual AutoRev logo image
 */
export default async function Icon() {
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
        }}
      >
        <img
          src={`data:image/png;base64,${Buffer.from(logoData).toString('base64')}`}
          width={30}
          height={30}
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
