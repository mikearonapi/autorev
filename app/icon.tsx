export const runtime = 'edge';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

/**
 * Favicon - AutoRev AR logo on navy background
 * Uses the official logo with checkered flag pattern
 */
export default async function Icon() {
  // Fetch the pre-generated favicon with logo
  const logoUrl = new URL('/favicon-32x32.png', process.env.NEXT_PUBLIC_SITE_URL || 'https://autorev.app');
  
  const logoResponse = await fetch(logoUrl);
  const logoArrayBuffer = await logoResponse.arrayBuffer();
  
  return new Response(logoArrayBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
