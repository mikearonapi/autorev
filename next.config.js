import { withSentryConfig } from '@sentry/nextjs';

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
    // CSS optimization - inlines critical CSS and defers non-critical
    // Requires 'critters' package (installed)
    optimizeCss: true,
  },

  // Compiler optimizations
  compiler: {
    // Remove console.log in production
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,
  },

  // Webpack configuration for better chunking
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // =============================================================================
      // STUB OUT CORE-JS POLYFILLS
      // posthog-js includes core-js, but our browserslist targets modern browsers
      // that natively support all these features. Stubbing saves ~21 KiB.
      // =============================================================================
      config.resolve.alias = {
        ...config.resolve.alias,
        // Stub core-js polyfills - modern browsers don't need them
        'core-js/modules/es.array.at': false,
        'core-js/modules/es.array.flat': false,
        'core-js/modules/es.array.flat-map': false,
        'core-js/modules/es.object.from-entries': false,
        'core-js/modules/es.object.has-own': false,
        'core-js/modules/es.string.trim-end': false,
        'core-js/modules/es.string.trim-start': false,
        'core-js/modules/es.math.trunc': false,
      };
      // =============================================================================
      // PERFORMANCE BUDGETS
      // Warn when assets exceed size limits (helps catch bundle bloat)
      // =============================================================================
      config.performance = {
        maxAssetSize: 250000, // 250KB per asset
        maxEntrypointSize: 300000, // 300KB per entrypoint (slightly higher for app shell)
        hints: 'warning', // 'warning' | 'error' | false
      };

      // =============================================================================
      // CHUNK SPLITTING
      // Split large vendor chunks for better caching
      // =============================================================================
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
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
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

  // Security headers for all routes
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Prevent MIME type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // XSS protection (legacy browsers)
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Control referrer information
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Restrict browser features
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Force HTTPS (Vercel handles this, but explicit is good)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Organization and project (set via env vars or Sentry wizard)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Auth token for uploading source maps
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Upload larger set of source maps for more readable stack traces
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware
  tunnelRoute: '/monitoring',

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Automatically instrument App Router for performance monitoring
  autoInstrumentAppDirectory: true,

  // Enables automatic instrumentation of Vercel Cron Monitors
  // See https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/build/
  automaticVercelMonitors: true,
};

// Wrap with Sentry if DSN is configured
const finalConfig = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;

export default finalConfig;
