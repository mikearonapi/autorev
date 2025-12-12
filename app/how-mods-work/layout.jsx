/**
 * How Mods Work Layout - SEO Metadata
 * 
 * Provides metadata for the How Mods Work page (formerly Education).
 * URL: /how-mods-work
 */

export const metadata = {
  title: 'How Mods Work | Learn About Car Modifications & Upgrades',
  description: 'Learn how car modifications work together as a system. Explore goal-based build paths for more power, better handling, track preparation, and more. Understand upgrade dependencies and make informed decisions.',
  keywords: [
    'how mods work',
    'car modifications guide',
    'performance upgrades explained',
    'suspension mods',
    'brake upgrades',
    'engine tuning guide',
    'build paths',
    'mod dependencies',
    'track car preparation',
    'car upgrade education',
  ],
  openGraph: {
    title: 'How Mods Work | Learn About Car Modifications & Upgrades',
    description: 'Learn how car modifications work together. Explore build paths for power, handling, and track preparation.',
    url: '/how-mods-work',
    type: 'website',
  },
  twitter: {
    title: 'How Mods Work | Learn About Car Modifications',
    description: 'Learn how car mods work together. Explore build paths for power, handling, and track prep.',
  },
  alternates: {
    canonical: '/how-mods-work',
  },
};

export default function HowModsWorkLayout({ children }) {
  return children;
}
