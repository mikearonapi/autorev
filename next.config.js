/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Experimental features for better performance
  experimental: {
    // Enable optimized package imports for smaller bundles
    optimizePackageImports: [
      '@supabase/supabase-js',
      '@supabase/ssr',
      'recharts',
      'date-fns',
      'openai',
      '@anthropic-ai/sdk',
    ],
    // Enable CSS optimization for reduced render-blocking
    optimizeCss: true,
  },
  
  // Compiler optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Webpack configuration for better chunking
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Split large vendor chunks
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          // Separate Supabase into its own chunk
          supabase: {
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            name: 'supabase',
            chunks: 'all',
            priority: 30,
          },
          // Separate React Query
          reactQuery: {
            test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
            name: 'react-query',
            chunks: 'all',
            priority: 25,
          },
          // Large utility libraries
          utils: {
            test: /[\\/]node_modules[\\/](date-fns|lodash|uuid)[\\/]/,
            name: 'utils',
            chunks: 'all',
            priority: 20,
          },
        },
      };
    }
    return config;
  },

  // Image optimization configuration
  images: {
    // Enable modern image formats for better compression
    formats: ['image/avif', 'image/webp'],
    // Responsive image sizes for srcset generation
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  // Redirects for route migrations (Build pivot - January 2026)
  async redirects() {
    return [
      // Deprecated Find features → Garage
      {
        source: '/car-selector',
        destination: '/garage',
        permanent: true,
      },
      // Legacy Build routes → Garage
      {
        source: '/tuning-shop',
        destination: '/garage',
        permanent: true,
      },
      {
        source: '/my-builds',
        destination: '/garage',
        permanent: true,
      },
      {
        source: '/mod-planner',
        destination: '/garage',
        permanent: true,
      },
      {
        source: '/build',
        destination: '/garage',
        permanent: true,
      },
      // Legacy performance/track routes → Data
      {
        source: '/track',
        destination: '/data',
        permanent: true,
      },
      {
        source: '/performance',
        destination: '/data',
        permanent: true,
      },
      // Community builds consolidated
      {
        source: '/community/builds',
        destination: '/community',
        permanent: true,
      },
      {
        source: '/community/builds/:slug',
        destination: '/community',
        permanent: true,
      },
      // Join page → Homepage (auth modal handles signup now)
      {
        source: '/join',
        destination: '/',
        permanent: false, // Soft redirect - may reactivate
      },
    ];
  },
};

export default nextConfig;


