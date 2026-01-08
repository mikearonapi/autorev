/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'abqnp7qrs0nhv5pw.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '**.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
    ],
  },

  // Redirects for route migrations
  async redirects() {
    return [
      // Migrate /compare to /articles/comparisons
      {
        source: '/compare',
        destination: '/articles/comparisons',
        permanent: true,
      },
      {
        source: '/compare/:slug',
        destination: '/articles/comparisons/:slug',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;


