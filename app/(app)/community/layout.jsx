export const metadata = {
  title: 'Community Builds | Real Builds from Real Enthusiasts | AutoRev',
  description: 'Explore community builds, get inspired, and share your own. Browse track builds, street builds, drift setups, and more from enthusiasts worldwide.',
  keywords: [
    'car builds',
    'community builds',
    'track builds',
    'street builds',
    'drift builds',
    'car modification showcase',
    'build inspiration',
    'car project gallery',
  ],
  openGraph: {
    title: 'Community Builds | AutoRev',
    description: 'Explore real builds from enthusiasts worldwide. Get inspired for your next project.',
    url: '/community',
    type: 'website',
  },
  twitter: {
    title: 'Community Builds | AutoRev',
    description: 'Explore real builds from enthusiasts worldwide.',
  },
  alternates: {
    canonical: '/community',
  },
  robots: {
    index: false, // App route - marketing version at /community is indexed
    follow: true,
  },
};

export default function CommunityLayout({ children }) {
  return children;
}
