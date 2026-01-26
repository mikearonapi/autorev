/**
 * Shared AL Conversation Layout - SEO Metadata
 * 
 * Provides metadata for shared AL conversation pages.
 * These are user-generated content and should NOT be indexed.
 * 
 * URL: /shared/al/[token]
 * 
 * Security/SEO:
 * - noindex, nofollow (user-generated content)
 * - Generic title/description (no conversation content leaked)
 * - Canonical URL set dynamically
 */

export async function generateMetadata({ params }) {
  const { token } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autorev.app';
  
  return {
    title: 'Shared Conversation | AutoRev',
    description: 'View a shared AL conversation from AutoRev - your AI car expert.',
    // Don't index user-generated shared content
    robots: {
      index: false,
      follow: false,
    },
    // Canonical URL to prevent duplicate content issues
    alternates: {
      canonical: `${baseUrl}/shared/al/${token}`,
    },
    // Open Graph for social sharing
    openGraph: {
      title: 'Shared AL Conversation | AutoRev',
      description: 'Check out this helpful car advice from AL, the AI automotive assistant.',
      type: 'article',
      url: `${baseUrl}/shared/al/${token}`,
      siteName: 'AutoRev',
    },
    // Twitter card
    twitter: {
      card: 'summary',
      title: 'Shared AL Conversation | AutoRev',
      description: 'Check out this helpful car advice from AL, the AI automotive assistant.',
    },
  };
}

export default function SharedALLayout({ children }) {
  return children;
}
