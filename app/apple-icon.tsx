export const runtime = 'edge';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

/**
 * Apple Touch Icon - AutoRev AR logo on navy background
 * Uses the official logo with checkered flag pattern
 * Used for iOS home screen and Safari bookmarks
 */
export default async function AppleIcon() {
  // Fetch the pre-generated apple touch icon with logo
  const logoUrl = new URL(
    '/apple-touch-icon-v4.png',
    process.env.NEXT_PUBLIC_SITE_URL || 'https://autorev.app'
  );

  const logoResponse = await fetch(logoUrl);
  const logoArrayBuffer = await logoResponse.arrayBuffer();

  return new Response(logoArrayBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
