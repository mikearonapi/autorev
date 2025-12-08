// Performance page layout with SEO metadata
// Since the performance page is a client component, we export metadata from this layout

export const metadata = {
  title: 'Performance HUB | Plan Your Build & Upgrades',
  description: 'Plan your sports car build with our Performance HUB. Explore suspension, brakes, power, and handling upgrades for Porsche, BMW M, Corvette, and more. Calculate costs and performance gains.',
  keywords: ['performance upgrades', 'car build planner', 'suspension upgrades', 'brake upgrades', 'engine tuning', 'Porsche upgrades', 'BMW M upgrades', 'Corvette upgrades', 'track preparation'],
  openGraph: {
    title: 'Performance HUB | Plan Your Build & Upgrades',
    description: 'Plan your sports car build. Explore upgrades for suspension, brakes, power, and handling.',
    url: '/performance',
    type: 'website',
  },
  twitter: {
    title: 'Performance HUB | Plan Your Build & Upgrades',
    description: 'Plan your sports car build. Explore suspension, brake, and power upgrades.',
  },
  alternates: {
    canonical: '/performance',
  },
};

export default function PerformanceLayout({ children }) {
  return children;
}


