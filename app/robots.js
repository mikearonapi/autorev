// Robots.txt configuration for SEO
// This file automatically generates robots.txt at /robots.txt

const siteUrl = 'https://autorev.app';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/_next/',
          '/private/',
          '/profile/',      // User profiles are private
          '/internal/',     // Internal admin pages
          '/auth/',         // Auth callbacks
          '/garage/compare/', // Ephemeral compare page
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/profile/', '/internal/', '/auth/'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/', '/profile/', '/internal/', '/auth/'],
      },
      {
        // Facebook/Meta crawler
        userAgent: 'facebookexternalhit',
        allow: '/',
      },
      {
        // Twitter/X crawler
        userAgent: 'Twitterbot',
        allow: '/',
      },
      {
        // LinkedIn crawler
        userAgent: 'LinkedInBot',
        allow: '/',
      },
      {
        // iMessage/Safari preview
        userAgent: 'Applebot',
        allow: '/',
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
