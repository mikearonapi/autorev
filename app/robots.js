/**
 * Robots.txt Configuration for SEO
 * 
 * Generates robots.txt at /robots.txt with crawling directives.
 * 
 * Key rules:
 * - Allow: Homepage, public community content (builds, events)
 * - Disallow: All app routes (require auth), API routes, internal pages
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
        allow: [
          '/',                      // Homepage
          '/community/builds',      // Public builds gallery
          '/community/builds/',     // Individual build pages
          '/community/events',      // Public events listing
          '/community/events/',     // Individual event pages
          '/terms',                 // Legal
          '/privacy',               // Legal
          '/contact',               // Contact
        ],
        disallow: [
          '/api/',                  // API routes
          '/_next/',                // Next.js internal
          '/garage/',               // Auth-required
          '/data/',                 // Auth-required
          '/community/',            // Base community is auth-required (user feed)
          '/al/',                   // Auth-required
          '/profile/',              // Auth-required
          '/build/',                // Auth-required
          '/performance/',          // Auth-required
          '/parts/',                // Auth-required
          '/mod-planner/',          // Auth-required
          '/internal/',             // Internal admin pages
          '/admin/',                // Admin pages
          '/auth/',                 // Auth callbacks
        ],
      },
      // Social media crawlers - allow public pages for previews
      {
        userAgent: 'facebookexternalhit',
        allow: [
          '/',
          '/community/builds/',
          '/community/events/',
        ],
        disallow: ['/api/', '/internal/', '/auth/', '/admin/'],
      },
      {
        userAgent: 'Twitterbot',
        allow: [
          '/',
          '/community/builds/',
          '/community/events/',
        ],
        disallow: ['/api/', '/internal/', '/auth/', '/admin/'],
      },
      {
        userAgent: 'LinkedInBot',
        allow: [
          '/',
          '/community/builds/',
          '/community/events/',
        ],
        disallow: ['/api/', '/internal/', '/auth/', '/admin/'],
      },
      // Slack/Discord for link previews
      {
        userAgent: 'Slackbot-LinkExpanding',
        allow: [
          '/',
          '/community/builds/',
          '/community/events/',
        ],
        disallow: ['/api/', '/internal/', '/auth/', '/admin/'],
      },
      {
        userAgent: 'Discordbot',
        allow: [
          '/',
          '/community/builds/',
          '/community/events/',
        ],
        disallow: ['/api/', '/internal/', '/auth/', '/admin/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
