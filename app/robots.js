/**
 * Robots.txt Configuration for SEO
 * 
 * Generates robots.txt at /robots.txt with crawling directives.
 * 
 * Key rules:
 * - Allow: All public pages
 * - Disallow: API routes, auth callbacks, internal admin pages, user profiles
 * - Sitemap: Points to dynamic sitemap.xml
 * 
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */

const SITE_URL = 'https://autorev.app';

export default function robots() {
  return {
    rules: [
      // Default rules for all crawlers
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',          // API routes
          '/_next/',        // Next.js internal
          '/private/',      // Private content
          '/profile/',      // User profiles
          '/internal/',     // Internal admin pages
          '/auth/',         // Auth callbacks
          '/garage/compare/', // Ephemeral compare page
          '/events/saved/', // User saved events (requires auth)
        ],
      },
      // Google-specific rules
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/profile/',
          '/internal/',
          '/auth/',
          '/events/saved/',
        ],
      },
      // Bing-specific rules
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/api/',
          '/profile/',
          '/internal/',
          '/auth/',
          '/events/saved/',
        ],
      },
      // Google Image bot
      {
        userAgent: 'Googlebot-Image',
        allow: [
          '/browse-cars/',
          '/community/events/',
          '/community/builds/', // Public builds for image indexing
          '/public/',
        ],
        disallow: [
          '/api/',
          '/internal/',
        ],
      },
      // Social media crawlers - allow most pages for previews
      {
        userAgent: 'facebookexternalhit',
        allow: '/',
        disallow: ['/api/', '/internal/', '/auth/'],
      },
      {
        userAgent: 'Twitterbot',
        allow: '/',
        disallow: ['/api/', '/internal/', '/auth/'],
      },
      {
        userAgent: 'LinkedInBot',
        allow: '/',
        disallow: ['/api/', '/internal/', '/auth/'],
      },
      // Apple bot for iMessage previews
      {
        userAgent: 'Applebot',
        allow: '/',
        disallow: ['/api/', '/internal/', '/auth/'],
      },
      // Slack bot for link previews
      {
        userAgent: 'Slackbot-LinkExpanding',
        allow: '/',
        disallow: ['/api/', '/internal/', '/auth/'],
      },
      // Discord bot for link previews
      {
        userAgent: 'Discordbot',
        allow: '/',
        disallow: ['/api/', '/internal/', '/auth/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
